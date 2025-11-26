/**
 * Enhanced Conversation Display Component
 * Shows tool calls, rate calculations, and FAQ responses in a highlighted manner
 */

import { memo, useCallback, useMemo } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useLoggerStore } from "../../lib/store-logger";
import { StreamingLog } from "../../types";
import {
  LiveServerToolCall,
  LiveClientToolResponse,
  LiveServerContent,
  Part,
} from "@google/genai";
import { formatMessageTime, generateMessageId } from "../../lib/utils";
import { SpeakerIcon } from "../icons/SvgIcons";
import "./ConversationDisplay.scss";

interface ConversationMessage {
  id: string;
  type: "user" | "assistant" | "tool_call" | "tool_response" | "rate_calculation" | "faq_response" | "transcription";
  content: string;
  timestamp: Date;
  toolCall?: LiveServerToolCall;
  toolResponse?: LiveClientToolResponse;
  rateInfo?: any;
  faqInfo?: any;
  isTranscription?: boolean;
}

function ConversationDisplayComponent() {
  const { logs } = useLoggerStore();
  const { language } = useLanguage();

  // Process logs to create conversation messages with memoization
  const conversationMessages = useMemo(() => {
    const messages: ConversationMessage[] = [];
    
    logs.forEach((log: StreamingLog, index: number) => {
      const messageId = generateMessageId(`msg-${index}`);
      
      // Handle tool calls
      if (typeof log.message === "object" && "toolCall" in log.message) {
        const toolCall = log.message.toolCall;
        if (toolCall) {
          messages.push({
            id: messageId,
            type: "tool_call",
            content: `${language === "en" ? "Calling" : "Memanggil"} ${toolCall.functionCalls?.[0]?.name || "tool"}`,
            timestamp: log.date,
            toolCall: toolCall,
          });
        }
      }
      
      // Handle tool responses
      if (typeof log.message === "object" && "functionResponses" in log.message) {
        const toolResponse = log.message as LiveClientToolResponse;
        const response = toolResponse.functionResponses?.[0];
        
        if (response?.response?.output) {
          const output = response.response.output as any;
          
          // Check if it's a rate calculation
          if (output && (output.rate_info || output.complete)) {
            messages.push({
              id: messageId,
              type: "rate_calculation",
              content: output.message || "Rate calculated",
              timestamp: log.date,
              rateInfo: output,
            });
          }
          // Check if it's an FAQ response
          else if (output && output.answer) {
            messages.push({
              id: messageId,
              type: "faq_response",
              content: output.answer,
              timestamp: log.date,
              faqInfo: output,
            });
          }
          // Generic tool response
          else {
            messages.push({
              id: messageId,
              type: "tool_response",
              content: `${language === "en" ? "Tool response received" : "Respons alat diterima"}`,
              timestamp: log.date,
              toolResponse: toolResponse,
            });
          }
        }
      }
      
      // Handle user messages
      if (typeof log.message === "object" && "turns" in log.message) {
        const clientContent = log.message as any;
        const userText = clientContent.turns?.find((turn: Part) => turn.text)?.text;
        if (userText) {
          messages.push({
            id: messageId,
            type: "user",
            content: userText,
            timestamp: log.date,
          });
        }
      }
      
      // Handle assistant messages
      if (typeof log.message === "object" && "serverContent" in log.message) {
        const serverContent = log.message.serverContent as LiveServerContent;
        if (serverContent && "modelTurn" in serverContent) {
          const modelTurn = serverContent.modelTurn;
          if (modelTurn) {
            const assistantText = modelTurn.parts?.find((part: Part) => part.text)?.text;
            if (assistantText) {
              messages.push({
                id: messageId,
                type: "assistant",
                content: assistantText,
                timestamp: log.date,
              });
            }
          }
        }
      }

      // Handle transcriptions
      if (log.type === "server.transcription" && typeof log.message === "string") {
        messages.push({
          id: messageId,
          type: "transcription",
          content: log.message,
          timestamp: log.date,
          isTranscription: true,
        });
      }
    });
    
    return messages;
  }, [logs, language]);

  const renderMessage = useCallback((message: ConversationMessage) => {
    const timeStr = formatMessageTime(message.timestamp, true);
    
    switch (message.type) {
      case "user":
        return (
          <div key={message.id} className="message user-message">
            <div className="message-header">
              <span className="message-type">User</span>
              <span className="message-time">{timeStr}</span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        );
        
      case "assistant":
        return (
          <div key={message.id} className="message assistant-message">
            <div className="message-header">
              <span className="message-type">Assistant</span>
              <span className="message-time">{timeStr}</span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        );
        
      case "tool_call":
        return (
          <div key={message.id} className="message tool-call-message">
            <div className="message-header">
              <span className="message-type">Tool Call</span>
              <span className="message-time">{timeStr}</span>
            </div>
            <div className="message-content">
              <div className="tool-call-info">
                <strong>{message.content}</strong>
                {message.toolCall?.functionCalls?.map((fc, idx) => (
                  <div key={idx} className="function-call-details">
                    <div className="function-name">{fc.name}</div>
                    <div className="function-args">
                      {Object.entries(fc.args || {}).map(([key, value]) => (
                        <div key={key} className="arg-item">
                          <span className="arg-key">{key}:</span>
                          <span className="arg-value">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case "rate_calculation":
        return (
          <div key={message.id} className="message rate-calculation-message">
            <div className="message-header">
              <span className="message-type">Rate Calculation</span>
              <span className="message-time">{timeStr}</span>
            </div>
            <div className="message-content">
              <div className="rate-calculation-result">
                <div className="rate-summary">{message.content}</div>
                {message.rateInfo?.rate_info && (
                  <div className="rate-details">
                    <div className="rate-breakdown">
                      <div className="rate-item">
                        <span className="rate-label">{language === "en" ? "Service:" : "Perkhidmatan:"}</span>
                        <span className="rate-value">{message.rateInfo.rate_info.service_type}</span>
                      </div>
                      <div className="rate-item">
                        <span className="rate-label">{language === "en" ? "Rate:" : "Kadar:"}</span>
                        <span className="rate-value rate-amount">{message.rateInfo.rate_info.currency || 'USD'} {message.rateInfo.rate_info.rate}</span>
                      </div>
                      <div className="rate-item">
                        <span className="rate-label">{language === "en" ? "Delivery:" : "Penghantaran:"}</span>
                        <span className="rate-value">{message.rateInfo.rate_info.estimated_delivery}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case "faq_response":
        return (
          <div key={message.id} className="message faq-response-message">
            <div className="message-header">
              <span className="message-type">FAQ Response</span>
              <span className="message-time">{timeStr}</span>
            </div>
            <div className="message-content">
              <div className="faq-response">
                <div className="faq-answer">{message.content}</div>
                {message.faqInfo?.category && (
                  <div className="faq-meta">
                    <span className="faq-category">{message.faqInfo.category}</span>
                    <span className="faq-source">{message.faqInfo.source}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
        
      case "tool_response":
        return (
          <div key={message.id} className="message tool-response-message">
            <div className="message-header">
              <span className="message-type">Tool Response</span>
              <span className="message-time">{timeStr}</span>
            </div>
            <div className="message-content">{message.content}</div>
          </div>
        );
        
      case "transcription":
        return (
          <div key={message.id} className="message transcription-message">
            <div className="message-header">
              <SpeakerIcon size={14} className="transcription-icon" />
              <span className="message-type">Audio Transcript</span>
              <span className="message-time">{timeStr}</span>
            </div>
            <div className="message-content transcription-content">
              {message.content}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  }, [language]);

  return (
    <div className="conversation-display">
      <div className="conversation-header">
        <h3>{language === "en" ? "Conversation Flow" : "Aliran Perbualan"}</h3>
        <div className="conversation-stats">
          {conversationMessages.length} {language === "en" ? "messages" : "mesej"}
        </div>
      </div>
      
      <div className="conversation-messages">
        {conversationMessages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-text">
              {language === "en" 
                ? "Start a conversation to see the flow here" 
                : "Mulakan perbualan untuk melihat aliran di sini"
              }
            </div>
          </div>
        ) : (
          conversationMessages.map(renderMessage)
        )}
      </div>
    </div>
  );
}

export const ConversationDisplay = memo(ConversationDisplayComponent);
