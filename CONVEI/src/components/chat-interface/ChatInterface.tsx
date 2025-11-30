/**
 * Enhanced Chat Interface with Tool Call Visualization
 * Shows user messages, tool calls, and responses in a clean, scrollable interface
 */

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useConversationMemory } from "../../contexts/ConversationMemoryContext";
import { useMessageContext } from "../../contexts/MessageContext";
import { useAuth } from "../../contexts/AuthContext";
import { useBehavioralContext } from "../../contexts/BehavioralContextContext";
import { AgentRegistry } from "../../agents/AgentRegistry";
import { Modality } from "@google/genai";
import { formatMessageTime, generateMessageId } from "../../lib/utils";
import { ThemeToggle } from "../theme-toggle/ThemeToggle";
import { ToolIcon, ResponseIcon, MicrophoneIcon, SpeakerIcon } from "../icons/SvgIcons";
import { PulsatingAvatar } from "../ai-avatar/PulsatingAvatar";
import { ChatMessage, ToolCallData, ToolResponseData } from "../../types/chat";
import { TOOL_RESPONSE_DELAY, ERROR_MESSAGES, AGENT_NAMES, TOOL_NAMES, SCROLL_BEHAVIOR, DEFAULT_MODEL, DEFAULT_VOICE } from "../../constants";
import "./ChatInterface.scss";

function ChatInterfaceComponent() {
  const { client, setConfig, setModel, connect, connected, stopAudio } = useLiveAPIContext();
  const { language, setLanguage, t } = useLanguage();
  const { memory, addConversationEntry, getContextualInfo, clearMemory } = useConversationMemory();
  const { messages: contextMessages, addMessage, clearMessages } = useMessageContext();
  const { logout } = useAuth();
  const { getContextualPrompt, behavioralData } = useBehavioralContext();
  // const { logs } = useLoggerStore(); // Unused for now
  const [currentAgent, setCurrentAgent] = useState<string>(t(AGENT_NAMES.MAIN));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentRegistryRef = useRef<AgentRegistry | null>(null);

  // Get behavioral context prompt
  const behavioralContextPrompt = getContextualPrompt();

  // Initialize agent registry with memoization
  const agentRegistry = useMemo(() => {
    return new AgentRegistry(memory, language, getContextualInfo, behavioralContextPrompt);
  }, [memory, language, getContextualInfo, behavioralContextPrompt]);

  useEffect(() => {
    agentRegistryRef.current = agentRegistry;
    setIsInitialized(true);
  }, [agentRegistry]);

  // Update agent registry language when language changes
  useEffect(() => {
    if (agentRegistryRef.current) {
      agentRegistryRef.current.updateLanguage(language);
    }
  }, [language]);

  // Update behavioral context when it changes
  useEffect(() => {
    if (agentRegistryRef.current && behavioralContextPrompt) {
      agentRegistryRef.current.updateBehavioralContext(behavioralContextPrompt);
    }
  }, [behavioralContextPrompt]);

  // Welcome message removed - start with empty messages

    // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: SCROLL_BEHAVIOR });
  }, [messages]);

  // Initialize system configuration
  useEffect(() => {
    if (!isInitialized || !agentRegistryRef.current) return;

    setModel(DEFAULT_MODEL);
    
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: DEFAULT_VOICE } },
      },
      outputAudioTranscription: {},
      inputAudioTranscription: {},
      systemInstruction: {
        parts: [
          {
            text: agentRegistryRef.current.getSystemInstruction(),
          },
        ],
      },
      tools: [
        { functionDeclarations: agentRegistryRef.current.getFunctionDeclarations() },
      ],
    });
  }, [setConfig, setModel, isInitialized, language, agentRegistry, behavioralContextPrompt]);

  // Handle tool calls with enhanced visualization
  useEffect(() => {
    if (!isInitialized || !agentRegistryRef.current) return;

    const onToolCall = async (toolCall: { functionCalls?: Array<{ id?: string; name?: string; args?: Record<string, unknown> }> }) => {
      try {
        const functionCalls = toolCall.functionCalls;
        if (!functionCalls?.length) return;

        const functionCall = functionCalls[0];
        if (!functionCall?.name || !functionCall?.args) {
          if (process.env.NODE_ENV === 'development') {
            console.warn("Invalid tool call: missing name or args", functionCall);
          }
          return;
        }
        const { name, args } = functionCall;
        
        // Debug logging for tool calls
        if (process.env.NODE_ENV === 'development') {
          console.log("Tool call received:", { name, args, fullToolCall: toolCall });
        }


        setIsProcessing(true);

        // Add tool call message
        const toolCallMessage: ChatMessage = {
          id: generateMessageId('tool-call'),
          type: 'tool_call',
          content: `${t('calling_tool')} ${name.replace(/_/g, ' ')}...`,
          timestamp: new Date(),
          toolData: { name, args } as ToolCallData
        };

        setMessages(prev => [...prev, toolCallMessage]);

        // Update current agent or handle language switching
        if (name === TOOL_NAMES.LANGUAGE_SWITCH) {
          const { target_language } = args as { target_language?: 'en' | 'kn' };
          if (target_language && (target_language === 'en' || target_language === 'kn')) {
            setLanguage(target_language);
            setCurrentAgent(t(AGENT_NAMES.MAIN));
          }
        } else {
          setCurrentAgent(name === TOOL_NAMES.FAQ_INQUIRY ? t(AGENT_NAMES.FAQ) : t(AGENT_NAMES.RATE_CALCULATOR));
        }

        // Process through agent registry
        const toolArgs = args as Record<string, unknown>;
        // Get or create session ID for behavioral context
        const sessionId = memory.sessionData.sessionId || `convei_session_${Date.now()}`;
        const agentContext = {
          language,
          userInput: (toolArgs.question || toolArgs.origin || "") as string,
          conversationHistory: memory.currentContext.conversationHistory,
          memory,
          sessionId: sessionId
        };

        const agentResult = await agentRegistryRef.current!.processToolCall(toolCall, agentContext);
        
        if (agentResult && agentResult.response.data) {
          // Add tool response message
          const responseData = agentResult.response.data;
          const toolResponseMessage: ChatMessage = {
            id: generateMessageId('tool-response'),
            type: 'tool_response',
            content: responseData?.message || responseData?.answer || "Response received",
            timestamp: new Date(),
            toolData: responseData
          };

          setMessages(prev => [...prev, toolResponseMessage]);

          // Update memory
          const toolArgs = functionCall.args as Record<string, unknown>;
          addConversationEntry(
            (toolArgs?.question as string) || "Rate calculation request",
            toolResponseMessage.content,
            agentResult.name
          );

          // Send response back to main agent
          const functionResponses = [{
            id: functionCall.id ?? "",
            name: functionCall.name ?? "",
            response: { output: agentResult.response.data }
          }];

          setTimeout(() => {
            try {
              client.sendToolResponse({ functionResponses });
              setCurrentAgent(t(AGENT_NAMES.MAIN));
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error("Failed to send tool response:", error);
              }
              const errorMessage: ChatMessage = {
                id: generateMessageId('error'),
                type: 'system',
                content: ERROR_MESSAGES.TOOL_CALL_FAILED,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
            } finally {
              setIsProcessing(false);
            }
          }, TOOL_RESPONSE_DELAY);
        } else {
          setIsProcessing(false);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error processing tool call:", error);
        }
        setIsProcessing(false);
        setCurrentAgent(t(AGENT_NAMES.MAIN));
        
        // Add error message
        const errorMessage: ChatMessage = {
          id: generateMessageId('error'),
          type: 'system',
          content: `${ERROR_MESSAGES.TOOL_CALL_FAILED}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    };

    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client, isInitialized, language, t, memory, addConversationEntry, agentRegistry, setLanguage]);

  // Handle output audio transcriptions (AI speaking) with accumulation
  useEffect(() => {
    let currentTranscriptionId: string | null = null;
    let accumulatedText = '';

    const onTranscription = (text: string) => {
      if (!text) return;

      // Accumulate transcription text
      accumulatedText += text;

      // Create or update transcription message
      if (!currentTranscriptionId) {
        currentTranscriptionId = generateMessageId('output-transcription');
        
        const transcriptionMessage: ChatMessage = {
          id: currentTranscriptionId,
          type: 'assistant',
          content: accumulatedText,
          timestamp: new Date(),
          isTranscription: true,
        };

        setMessages(prev => [...prev, transcriptionMessage]);
      } else {
        // Update existing transcription message
        setMessages(prev => 
          prev.map(msg => 
            msg.id === currentTranscriptionId
              ? { ...msg, content: accumulatedText }
              : msg
          )
        );
      }
    };

    const onTurnComplete = () => {
      // When turn is complete, save to message context and reset
      if (accumulatedText) {
        addMessage(accumulatedText, 'transcription');
      }
      currentTranscriptionId = null;
      accumulatedText = '';
    };

    client.on("transcription", onTranscription);
    client.on("turncomplete", onTurnComplete);
    
    return () => {
      client.off("transcription", onTranscription);
      client.off("turncomplete", onTurnComplete);
    };
  }, [client, addMessage]);

  // Handle input audio transcriptions (User speaking) - show "Speaking..." only
  useEffect(() => {
    let currentInputTranscriptionId: string | null = null;

    const onInputTranscription = (text: string) => {
      if (!text) return;

      // Hide welcome section when transcription appears
      // Welcome section removed
      if (false) {
      }

      // Create or keep showing "Speaking..." message
      if (!currentInputTranscriptionId) {
        currentInputTranscriptionId = generateMessageId('input-transcription');
        
        const inputTranscriptionMessage: ChatMessage = {
          id: currentInputTranscriptionId,
          type: 'user',
          content: 'Speaking...',
          timestamp: new Date(),
          isTranscription: true,
        };

        setMessages(prev => [...prev, inputTranscriptionMessage]);
      }
      // Don't update the message - keep showing "Speaking..."
    };

    const onTurnComplete = () => {
      // When turn is complete, remove the "Speaking..." message
      // The final message will come through normal channels
      if (currentInputTranscriptionId) {
        setMessages(prev => prev.filter(msg => msg.id !== currentInputTranscriptionId));
      }
      currentInputTranscriptionId = null;
    };

    client.on("inputtranscription", onInputTranscription);
    client.on("turncomplete", onTurnComplete);
    
    return () => {
      client.off("inputtranscription", onInputTranscription);
      client.off("turncomplete", onTurnComplete);
    };
  }, [client]);

  // Sync context messages with local messages
  useEffect(() => {
    // Sync context messages but avoid duplicates by ID
    if (!contextMessages.length) return;

    setMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id));
      const toAdd: ChatMessage[] = [];
      for (const msg of contextMessages) {
        if (!existingIds.has(msg.id)) {
          toAdd.push({
            id: msg.id,
            type: msg.type,
            content: msg.content,
            timestamp: msg.timestamp,
          });
        }
      }
      if (!toAdd.length) return prev;
      const filtered = prev.filter(m => m.id !== 'welcome');
      return [...filtered, ...toAdd];
    });
  }, [contextMessages]);

  // Initialize welcome message
  useEffect(() => {
    // Welcome section removed - no initial message
    if (false && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'system',
        content: agentRegistryRef.current?.getWelcomeMessage().subtitle || t("welcome_subtitle"),
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length, t, language]);

  const handleUserMessage = useCallback(async (message: string) => {
    // Validate and sanitize input
    const sanitizedMessage = message.trim();
    if (!sanitizedMessage) {
      return;
    }

    // Stop any ongoing audio when user interacts
    stopAudio();

    // Hide welcome section when user starts chatting
    // If not connected, automatically connect first
    if (!connected) {
      try {
        setIsProcessing(true);
        await connect();
        setIsProcessing(false);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Failed to connect:", error);
        }
        setIsProcessing(false);
        return;
      }
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: generateMessageId('user'),
      type: 'user',
      content: sanitizedMessage,
      timestamp: new Date()
    };

    setMessages(prev => {
      // Remove welcome message if it exists
      const filteredMessages = prev.filter(msg => msg.id !== 'welcome');
      return [...filteredMessages, userMessage];
    });

    // Send message to start conversation
    try {
      await client.send({ text: sanitizedMessage });
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error("Failed to send message:", error);
              }
              const errorMessage: ChatMessage = {
                id: generateMessageId('error'),
                type: 'system',
                content: ERROR_MESSAGES.SEND_MESSAGE_FAILED,
                timestamp: new Date()
              };
              setMessages(prev => [...prev, errorMessage]);
            }
  }, [connected, client, connect, stopAudio]);

  // Reset conversation and go to home page
  const handleLogoClick = useCallback(async () => {
    // Stop any ongoing audio
    stopAudio();

    // Disconnect if connected
    if (connected) {
      try {
        await client.disconnect();
      } catch (error) {
        console.error("Error disconnecting:", error);
      }
    }

    // Clear conversation memory
    clearMemory();

    // Clear messages
    clearMessages();

    // Reset local state
    setMessages([]);
    setCurrentAgent(t(AGENT_NAMES.MAIN));
    setIsProcessing(false);
  }, [stopAudio, connected, client, clearMemory, clearMessages, setMessages, setCurrentAgent, setIsProcessing, t]);

  // Render inline markdown elements like bold, italic
  const renderInlineMarkdown = useCallback((text: string) => {
    if (!text) return text;

    // Simple approach: split by ** and * patterns and create React elements
    const parts = [];
    let lastIndex = 0;

    // Handle bold text **text**
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the bold element
      parts.push(<strong key={`bold-${match.index}`}>{match[1]}</strong>);

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    // If no matches, return original text
    return parts.length > 0 ? parts : text;
  }, []);

  // Simple markdown renderer for tool responses
  const renderMarkdown = useCallback((text: string) => {
    if (!text) return text;

    // Split by double newlines for paragraphs, then process each paragraph
    const paragraphs = text.split('\n\n');
    const elements: React.ReactNode[] = [];

    paragraphs.forEach((paragraph, paraIndex) => {
      const lines = paragraph.split('\n');
      const paraElements: React.ReactNode[] = [];

      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();

        // Skip empty lines
        if (!trimmedLine) return;

        // Check if this is a header
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**:')) {
          const headerText = trimmedLine.slice(2, -3); // Remove ** and **:
          paraElements.push(
            <h3 key={`${paraIndex}-${lineIndex}`} className="markdown-h3">
              {headerText}
            </h3>
          );
          return;
        }

        // Check if this is a list item
        if (trimmedLine.startsWith('• ')) {
          const itemText = trimmedLine.slice(2); // Remove •
          paraElements.push(
            <li key={`${paraIndex}-${lineIndex}`} className="markdown-li">
              {renderInlineMarkdown(itemText)}
            </li>
          );
          return;
        }

        // Regular line - could be part of a paragraph or standalone
        if (paraElements.length > 0) {
          // If we already have elements, this is a continuation
          const lastElement = paraElements[paraElements.length - 1];
          if (lastElement && typeof lastElement === 'object' && 'props' in lastElement && lastElement.props.className === 'markdown-p') {
            // Append to existing paragraph
            const currentText = lastElement.props.children;
            const newText = Array.isArray(currentText) ? [...currentText, ' ', renderInlineMarkdown(trimmedLine)] : [currentText, ' ', renderInlineMarkdown(trimmedLine)];
            paraElements[paraElements.length - 1] = (
              <p key={`${paraIndex}-${lineIndex}`} className="markdown-p">
                {newText}
              </p>
            );
          } else {
            // Start new paragraph
            paraElements.push(
              <p key={`${paraIndex}-${lineIndex}`} className="markdown-p">
                {renderInlineMarkdown(trimmedLine)}
              </p>
            );
          }
        } else {
          // First element in paragraph
          paraElements.push(
            <p key={`${paraIndex}-${lineIndex}`} className="markdown-p">
              {renderInlineMarkdown(trimmedLine)}
            </p>
          );
        }
      });

      // Check if this paragraph contains list items
      const hasListItems = paraElements.some(el =>
        el && typeof el === 'object' && 'props' in el && el.props.className === 'markdown-li'
      );

      if (hasListItems) {
        // Wrap list items in ul
        const listElements = paraElements.filter(el =>
          el && typeof el === 'object' && 'props' in el && el.props.className === 'markdown-li'
        );
        const otherElements = paraElements.filter(el =>
          !el || !(typeof el === 'object' && 'props' in el && el.props.className === 'markdown-li')
        );

        elements.push(...otherElements);
        if (listElements.length > 0) {
          elements.push(
            <ul key={`list-${paraIndex}`} className="markdown-ul">
              {listElements}
            </ul>
          );
        }
      } else {
        elements.push(...paraElements);
      }
    });

    return elements.length > 0 ? elements : text;
  }, [renderInlineMarkdown]);

  const renderMessage = useCallback((message: ChatMessage) => {
    const timeStr = formatMessageTime(message.timestamp);

    switch (message.type) {
      case 'user':
        return (
          <div key={message.id} className={`message user-message ${message.isTranscription ? 'input-transcription-message' : ''}`}>
            <div className="message-wrapper">
              {message.isTranscription && (
                <div className="message-header">
                  <MicrophoneIcon size={14} className="transcription-icon" />
                  <span className="transcription-badge">User</span>
                </div>
              )}
              <div className="message-content">
                {message.content}
              </div>
              <div className="message-time">{timeStr}</div>
            </div>
          </div>
        );

      case 'assistant':
        return (
          <div key={message.id} className={`message assistant-message ${message.isTranscription ? 'output-transcription-message' : ''}`}>
            <div className="message-wrapper">
              <div className="avatar-container">
                <PulsatingAvatar 
                  size={40} 
                  isActive={isProcessing || behavioralData.isAvailable}
                  emotion={behavioralData.currentState?.emotion || 'neutral'}
                  audioLevel={(() => {
                    // Calculate normalized audio level from available metrics
                    const energy = behavioralData.currentState?.audioEnergy || 0;
                    const pitch = behavioralData.currentState?.audioPitch || 0;
                    const speechRate = behavioralData.currentState?.speechRate || 0;
                    
                    // Debug logging (remove in production)
                    if (energy > 0 || pitch > 0 || speechRate > 0) {
                      console.log('Audio data:', { energy, pitch, speechRate });
                    }
                    
                    // Normalize each metric with better ranges
                    // Energy: typically 0-1, but can be higher
                    const normalizedEnergy = Math.min(Math.max(energy / 2.0, 0), 1); // Allow up to 2.0
                    // Pitch: typically 100-300 Hz for human voice
                    const normalizedPitch = Math.min(Math.max((Math.abs(pitch || 0) - 80) / 220, 0), 1); // 80-300 Hz range
                    // Speech rate: typically 2-5 words per second
                    const normalizedSpeechRate = Math.min(Math.max((speechRate || 0) / 6.0, 0), 1); // Allow up to 6 wps
                    
                    // Combine with weights (energy is most important, but use average if all are present)
                    let audioLevel = 0;
                    const activeMetrics = [normalizedEnergy, normalizedPitch, normalizedSpeechRate].filter(v => v > 0);
                    if (activeMetrics.length > 0) {
                      // Use weighted average if multiple metrics, otherwise use the single metric
                      audioLevel = activeMetrics.length > 1 
                        ? (normalizedEnergy * 0.5 + normalizedPitch * 0.3 + normalizedSpeechRate * 0.2)
                        : activeMetrics[0];
                    }
                    
                    // Boost the level slightly to make it more reactive
                    audioLevel = Math.min(audioLevel * 1.2, 1);
                    
                    return audioLevel;
                  })()}
                />
              </div>
              <div className="message-content-wrapper">
                {message.isTranscription && (
                  <div className="message-header">
                    <SpeakerIcon size={14} className="transcription-icon" />
                    <span className="transcription-badge">Assistant</span>
                  </div>
                )}
                <div className="message-content">
                  {renderMarkdown(message.content)}
                </div>
                <div className="message-time">{timeStr}</div>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div key={message.id} className="message system-message">
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-time">{timeStr}</div>
          </div>
        );

      case 'tool_call':
        return (
          <div key={message.id} className="message tool-call-message">
            <div className="message-header">
              <ToolIcon size={16} className="tool-icon" />
              <span className="tool-name">{(message.toolData as ToolCallData)?.name?.replace(/_/g, ' ') || 'Tool Call'}</span>
            </div>
            <div className="message-content">
              <div className="tool-params">
                {(message.toolData as ToolCallData)?.args && Object.entries((message.toolData as ToolCallData).args).map(([key, value]) => (
                  <div key={key} className="param-item">
                    <span className="param-key">{key}:</span>
                    <span className="param-value">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="message-time">{timeStr}</div>
          </div>
        );

      case 'tool_response':
        return (
          <div key={message.id} className="message tool-response-message">
            <div className="message-header">
              <ResponseIcon size={16} className="tool-icon" />
              <span className="tool-name">{t('tool_response')}</span>
            </div>
            <div className="message-content">
              {(message.toolData as ToolResponseData)?.rate_info ? (
                <div className="rate-calculation-result">
                  <div className="rate-summary">{renderMarkdown(message.content)}</div>
                  <div className="rate-details">
                    <div className="rate-breakdown">
                      <div className="rate-item">
                        <span className="rate-label">{t('service_label')}</span>
                        <span className="rate-value">{(message.toolData as ToolResponseData).rate_info?.service_type || 'N/A'}</span>
                      </div>
                      <div className="rate-item">
                        <span className="rate-label">{t('rate_label')}</span>
                        <span className="rate-value rate-amount">{(message.toolData as ToolResponseData).rate_info?.currency || 'USD'} {(message.toolData as ToolResponseData).rate_info?.rate}</span>
                      </div>
                      <div className="rate-item">
                        <span className="rate-label">{t('delivery_label')}</span>
                        <span className="rate-value">{(message.toolData as ToolResponseData).rate_info?.estimated_delivery}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (message.toolData as ToolResponseData)?.source ? (
                <div className="faq-response-result">
                  <div className="faq-answer">{renderMarkdown(message.content)}</div>
                  <div className="faq-source">
                    <span className="source-label">{t('source_label')}</span>
                    <span className="source-value">{(message.toolData as ToolResponseData).source}</span>
                    {(message.toolData as ToolResponseData).category && (
                      <>
                        <span className="source-separator">{t('category_separator')}</span>
                        <span className="source-category">{(message.toolData as ToolResponseData).category}</span>
                      </>
                    )}
                  </div>
                  {(message.toolData as ToolResponseData).related_questions && (message.toolData as ToolResponseData).related_questions!.length > 0 && (
                    <div className="related-questions">
                      <span className="related-label">Related:</span>
                      <ul className="related-list">
                        {(message.toolData as ToolResponseData).related_questions!.map((question: string, index: number) => (
                          <li
                            key={index}
                            className="related-item clickable"
                            onClick={() => handleUserMessage(question)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleUserMessage(question);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            title="Click to ask this question"
                            aria-label={`Ask: ${question}`}
                          >
                            {question}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="response-content">
                  {renderMarkdown(message.content)}
                </div>
              )}
            </div>
            <div className="message-time">{timeStr}</div>
          </div>
        );

      default:
        return null;
    }
  }, [
    handleUserMessage, 
    renderMarkdown, 
    t, 
    behavioralData.currentState?.emotion, 
    behavioralData.isAvailable, 
    isProcessing,
    behavioralData.currentState?.audioEnergy,
    behavioralData.currentState?.audioPitch,
    behavioralData.currentState?.speechRate
  ]);

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="logo">
          <button
            className="logo-button"
            onClick={handleLogoClick}
            title="Go to home page and reset conversation"
            aria-label="Reset conversation and go to home page"
          >
            <span className="logo-text">ARIA</span>
          </button>
        </div>
        <div className="header-controls">
          <div className="language-toggle" role="group" aria-label="Language selection">
            <button 
              className={`lang-btn ${language === "en" ? "active" : ""}`}
              onClick={() => setLanguage("en")}
              aria-pressed={language === "en"}
              aria-label="Switch to English"
            >
              EN
            </button>
            <button 
              className={`lang-btn ${language === "kn" ? "active" : ""}`}
              onClick={() => setLanguage("kn")}
              aria-pressed={language === "kn"}
              aria-label="Switch to Kannada"
            >
              KN
            </button>
          </div>
          <ThemeToggle />
          <button
            className="logout-button"
            onClick={logout}
            title="Logout"
            aria-label="Logout from the application"
          >
            Logout
          </button>
          <div className="current-agent">
            <span className="agent-label">{t("active_agent")}</span>
            <span className="agent-name">{currentAgent}</span>
          </div>
        </div>
      </div>
      
      <div className="chat-content">
        {messages.length === 0 && (
          <div className="aria-greeting">
            <div className="greeting-text">
              <span className="greeting-pulse">Hello, I'm</span>
              <span className="greeting-name">ARIA</span>
            </div>
          </div>
        )}
        <div className="conversation-section">
          <div className="messages-container" role="log" aria-live="polite" aria-label="Conversation messages">
            {messages.map(renderMessage)}
            {isProcessing && (
              <div className="message processing-message">
                <div className="message-wrapper">
                  <div className="avatar-container">
                    <PulsatingAvatar 
                      size={40} 
                      isActive={true}
                      emotion={behavioralData.currentState?.emotion || 'neutral'}
                    />
                  </div>
                  <div className="message-content-wrapper">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      Processing...
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatInterfaceComponent;
