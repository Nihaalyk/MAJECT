/**
 * Agent Registry - Emotionally Intelligent Agent Management
 * Manages all agents and provides advanced emotional analysis tools
 */

import { MainAgent } from "./main-agent/MainAgent";
import { ConversationMemory } from "../contexts/ConversationMemoryContext";

import { ToolResponseData } from "../types/chat";

export interface AgentContext {
  language: 'en' | 'kn';
  userInput: string;
  conversationHistory: Array<{ timestamp: Date; userInput: string; agentResponse: string; agentType: string }>;
  memory: ConversationMemory;
  sessionId: string;
}

export interface AgentResult {
  name: string;
  response: {
    success: boolean;
    data: ToolResponseData | null;
    error?: string;
  };
}

// Emotional memory for tracking emotional journey
interface EmotionalMemory {
  timestamp: number;
  emotion: string;
  intensity: string;
  trigger?: string;
}

export class AgentRegistry {
  private mainAgent: MainAgent;
  private memory: ConversationMemory;
  private currentLanguage: 'en' | 'kn';
  private behavioralContext: string = '';
  private fusionApiUrl: string;
  private emotionalJourney: EmotionalMemory[] = [];

  constructor(memory: ConversationMemory, language: 'en' | 'kn', getContextualInfo?: () => Record<string, unknown>, behavioralContext?: string) {
    this.memory = memory;
    this.currentLanguage = language;
    this.behavioralContext = behavioralContext || '';
    const envUrl = typeof process !== 'undefined' ? (process.env as any)?.REACT_APP_FUSION_API_URL : undefined;
    this.fusionApiUrl = envUrl || 'http://localhost:8083';

    this.mainAgent = new MainAgent({ language, memory, behavioralContext: this.behavioralContext });
  }

  getFunctionDeclarations(): any[] {
    return this.mainAgent.getFunctionDeclarations();
  }

  getSystemInstruction(): string {
    return this.mainAgent.getSystemInstruction();
  }

  async processToolCall(toolCall: any, context: AgentContext): Promise<AgentResult | null> {
    const functionCalls = toolCall.functionCalls;
    if (!functionCalls?.length) return null;

    const functionCall = functionCalls[0];
    const { name, args } = functionCall;

    try {
      let result: any = null;

      switch (name) {
        case "switch_language_mode":
          result = {
            success: true,
            data: {
              message: context.language === 'en' 
                ? `Language mode switched to ${args.target_language === 'en' ? 'English' : 'Kannada'}.`
                : `ಭಾಷಾ ಮೋಡ್ ${args.target_language === 'en' ? 'ಇಂಗ್ಲೀಷ್' : 'ಕನ್ನಡ'}ಗೆ ಬದಲಾಯಿಸಲಾಗಿದೆ.`,
              language_switched: true,
              new_language: args.target_language
            }
          };
          break;

        case "set_user_name":
          const userName = args.name;
          console.log("set_user_name tool called:", { name: userName });
          result = this.setUserName(userName);
          break;

        case "get_behavioral_context":
          const sessionId = "current";
          const windowSeconds = args.window || 5;
          console.log("get_behavioral_context tool called:", { sessionId, window: windowSeconds });
          result = await this.getBehavioralContext(sessionId, windowSeconds);
          console.log("get_behavioral_context result:", result);
          
          // Track emotion in journey - record every time we get behavioral context
          if (result.data?.emotion) {
            // Only add if it's different from last entry or if it's been more than 3 seconds
            const lastEntry = this.emotionalJourney[this.emotionalJourney.length - 1];
            const shouldRecord = !lastEntry || 
                                lastEntry.emotion !== result.data.emotion ||
                                (Date.now() - lastEntry.timestamp) > 3000;
            
            if (shouldRecord) {
              this.emotionalJourney.push({
                timestamp: Date.now(),
                emotion: result.data.emotion,
                intensity: this.getEmotionIntensity(result.data),
                trigger: context.userInput?.substring(0, 50)
              });
              
              // Keep only last 100 entries
              if (this.emotionalJourney.length > 100) {
                this.emotionalJourney = this.emotionalJourney.slice(-100);
              }
            }
          }
          break;

        case "generate_behavioral_report":
          console.log("generate_behavioral_report tool called");
          result = await this.generateBehavioralReport(
            args.include_recommendations !== false,
            args.include_timeline !== false
          );
          console.log("generate_behavioral_report result:", result);
          break;

        case "analyze_emotional_journey":
          console.log("analyze_emotional_journey tool called");
          result = await this.analyzeEmotionalJourney(args.include_timeline, args.include_triggers);
          console.log("analyze_emotional_journey result:", result);
          break;

        case "get_empathy_response":
          console.log("get_empathy_response tool called:", args);
          result = this.getEmpathyResponse(args.detected_emotion, args.context, args.intensity);
          console.log("get_empathy_response result:", result);
          break;
          
        default:
          throw new Error(`Unknown function: ${name}`);
      }

      if (result) {
        this.updateMemoryWithInteraction(name, args, result, context);
        
        return {
          name: this.getAgentName(name),
          response: result
        };
      }

      return null;
    } catch (error) {
      console.error('Error processing tool call:', error);
      return {
        name: this.getAgentName(name),
        response: {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      };
    }
  }

  /**
   * Advanced behavioral context with emotional intelligence and conversation context
   */
  private async getBehavioralContext(sessionId: string, window: number = 30): Promise<any> {
    try {
      // Prepare conversation context from memory
      const conversationContext = {
        conversationHistory: this.memory.currentContext.conversationHistory.slice(-10).map(entry => ({
          userInput: entry.userInput,
          agentResponse: entry.agentResponse,
          timestamp: entry.timestamp.getTime()
        })),
        lastUserInput: this.memory.currentContext.lastInquiry || '',
        recentTopics: this._extractRecentTopics(this.memory.currentContext.conversationHistory),
        sessionId: this.memory.sessionData.sessionId,
        totalInteractions: this.memory.sessionData.totalInteractions
      };
      
      // Send conversation context with the request
      const response = await fetch(
        `${this.fusionApiUrl}/api/metrics/context/${sessionId}?window=${window}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversation_context: conversationContext
          }),
          mode: 'cors'
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: {
              message: this.currentLanguage === 'en'
                ? "I can't see your facial expressions yet. Please make sure your camera is on so I can connect with you better!"
                : "Saya belum dapat melihat ekspresi muka anda. Sila pastikan kamera anda aktif supaya saya boleh berhubung dengan anda dengan lebih baik!",
              available: false,
              emotion: "unknown",
              emotional_guidance: "Without visual data, focus on tone of voice and word choice to understand the user."
            }
          };
        }
        throw new Error(`FUSION API error: ${response.status}`);
      }

      const data = await response.json();
      const state = data.current_state || {};
      
      const emotion = state.emotion || 'neutral';
      const attention = state.attention || 'Unknown';
      const engagement = state.engagement || 'medium';
      const sentiment = state.sentiment || 0.0;
      const fatigue = state.fatigue || 'Normal';
      const posture = state.posture || 'Unknown';
      const movement = state.movement || 'Unknown';
      const attentionScore = state.attention_score || 50;
      const blinkRate = state.blink_rate || null;
      const totalBlinks = state.total_blinks || null;
      const blinkDuration = state.blink_duration || null;
      const blinkInterval = state.blink_interval || null;

      // Generate emotionally intelligent interpretation
      const emotionalInterpretation = this.interpretEmotionalState(emotion, sentiment, fatigue, engagement);
      const conversationGuidance = this.generateConversationGuidance(emotion, attention, engagement, fatigue);
      const empathyPrompts = this.generateEmpathyPrompts(emotion, sentiment);

      const message = this.currentLanguage === 'en'
        ? this.formatEnglishBehavioralMessage(emotion, attention, engagement, sentiment, fatigue, posture, movement, attentionScore, emotionalInterpretation, blinkRate, totalBlinks, blinkDuration, blinkInterval)
        : this.formatKannadaBehavioralMessage(emotion, attention, engagement, sentiment, fatigue, posture, movement, attentionScore, emotionalInterpretation, blinkRate, totalBlinks, blinkDuration, blinkInterval);

      return {
        success: true,
        data: {
          message,
          available: true,
          // Core emotional data
          emotion,
          attention,
          engagement,
          sentiment,
          fatigue,
          posture,
          movement,
          attention_score: attentionScore,
          // Blink metrics
          blink_rate: blinkRate,
          total_blinks: totalBlinks,
          blink_duration: blinkDuration,
          blink_interval: blinkInterval,
          // Emotional intelligence additions
          emotional_interpretation: emotionalInterpretation,
          conversation_guidance: conversationGuidance,
          empathy_prompts: empathyPrompts,
          // Insights
          insights: data.behavioral_insights || [],
          recommendations: data.recommendations || [],
          // Summary for AI
          summary: this.currentLanguage === 'en'
            ? `User is showing ${emotion} emotion with ${attention} attention and ${engagement} engagement. ${emotionalInterpretation}`
            : `Pengguna menunjukkan emosi ${emotion} dengan perhatian ${attention} dan penglibatan ${engagement}. ${emotionalInterpretation}`
        }
      };
    } catch (error) {
      console.error('Error fetching behavioral context:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return {
        success: false,
        data: {
          message: this.currentLanguage === 'en'
            ? "I'm having trouble connecting to my emotional sensing capabilities. Let me focus on understanding you through our conversation instead."
            : "Saya menghadapi masalah untuk menyambung ke kebolehan penderiaan emosi saya. Biar saya fokus untuk memahami anda melalui perbualan kita.",
          error: errorMessage,
          available: false,
          fallback_guidance: "Without behavioral data, pay extra attention to word choice, sentence structure, and conversation flow to understand emotional state."
        }
      };
    }
  }

  /**
   * Analyze emotional journey throughout the conversation
   */
  private async analyzeEmotionalJourney(includeTimeline: boolean = true, includeTriggers: boolean = true): Promise<any> {
    try {
      // Get historical data from FUSION API
      const response = await fetch(
        `${this.fusionApiUrl}/api/metrics/context/current?window=300`, // Last 5 minutes
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors'
        }
      );

      let apiData = null;
      if (response.ok) {
        apiData = await response.json();
      }

      // Combine with local emotional memory
      const journey = this.emotionalJourney;
      const trends = apiData?.recent_trends || {};

      // If we don't have enough local data, try to build from API data
      if (journey.length < 3) {
        // Use API trends to provide some analysis even with limited data
        const dominantEmotion = trends.dominant_emotion || journey[0]?.emotion || 'neutral';
        const emotionalVariability = journey.length >= 2 ? this.calculateEmotionalVariability(journey) : 'Insufficient data';
        const emotionalArc = journey.length >= 2 ? this.determineEmotionalArc(journey) : 'Not enough data';

        let message = this.currentLanguage === 'en'
          ? `**Your Emotional Journey Analysis:**\n\n`
          : `**ನಿಮ್ಮ ಭಾವನಾತ್ಮಕ ಪ್ರಯಾಣದ ವಿಶ್ಲೇಷಣೆ:**\n\n`;

        message += this.currentLanguage === 'en'
          ? `**Dominant Emotion**: ${dominantEmotion}\n`
          : `**ಮುಖ್ಯ ಭಾವನೆ**: ${dominantEmotion}\n`;

        message += this.currentLanguage === 'en'
          ? `**Emotional Stability**: ${emotionalVariability}\n`
          : `**ಭಾವನಾತ್ಮಕ ಸ್ಥಿರತೆ**: ${emotionalVariability}\n`;

        message += this.currentLanguage === 'en'
          ? `**Emotional Arc**: ${emotionalArc}\n`
          : `**ಭಾವನಾತ್ಮಕ ಆರ್ಕ್**: ${emotionalArc}\n`;

        if (trends.sentiment_trend) {
          message += this.currentLanguage === 'en'
            ? `**Sentiment Trend**: ${trends.sentiment_trend}\n`
            : `**ಭಾವನೆಯ ಪ್ರವೃತ್ತಿ**: ${trends.sentiment_trend}\n`;
        }

        if (journey.length > 0 && includeTimeline) {
          message += this.currentLanguage === 'en'
            ? `\n**Emotional Timeline:**\n`
            : `\n**ಭಾವನಾತ್ಮಕ ಸಮಯರೇಖೆ:**\n`;
          
          journey.slice(-5).forEach((entry, index) => {
            const timeAgo = Math.round((Date.now() - entry.timestamp) / 1000);
            message += `  ${index + 1}. ${entry.emotion} (${entry.intensity}) - ${timeAgo}s ago\n`;
          });
        }

        if (journey.length > 0 && includeTriggers) {
          const triggers = journey.filter(e => e.trigger).slice(-3);
          if (triggers.length > 0) {
            message += this.currentLanguage === 'en'
              ? `\n**Recent Emotional Triggers:**\n`
              : `\n**ಇತ್ತೀಚಿನ ಭಾವನಾತ್ಮಕ ಪ್ರಚೋದಕಗಳು:**\n`;
            
            triggers.forEach((entry, index) => {
              message += `  ${index + 1}. "${entry.trigger}..." → ${entry.emotion}\n`;
            });
          }
        }

        // Generate emotional insights
        const insights = journey.length >= 2 
          ? this.generateEmotionalInsights(journey, dominantEmotion, emotionalArc)
          : ["Emotional patterns are still developing"];

        if (journey.length < 3) {
          message += this.currentLanguage === 'en'
            ? `\n**Note**: I'm still learning about your emotional patterns. Keep talking and I'll build a more detailed analysis of your emotional journey!\n`
            : `\n**ಗಮನಿಸಿ**: ನಾನು ಇನ್ನೂ ನಿಮ್ಮ ಭಾವನಾತ್ಮಕ ಮಾದರಿಗಳ ಬಗ್ಗೆ ಕಲಿಯುತ್ತಿದ್ದೇನೆ. ಮಾತನಾಡುವುದನ್ನು ಮುಂದುವರಿಸಿ ಮತ್ತು ನಾನು ನಿಮ್ಮ ಭಾವನಾತ್ಮಕ ಪ್ರಯಾಣದ ವಿವರವಾದ ವಿಶ್ಲೇಷಣೆಯನ್ನು ನಿರ್ಮಿಸುತ್ತೇನೆ!\n`;
        }
        
        message += this.currentLanguage === 'en'
          ? `\n**Insights:**\n${insights.map(i => `• ${i}`).join('\n')}`
          : `\n**ಒಳನೋಟಗಳು:**\n${insights.map(i => `• ${i}`).join('\n')}`;

        return {
          success: true,
          data: {
            message,
            dominant_emotion: dominantEmotion,
            emotional_variability: emotionalVariability,
            emotional_arc: emotionalArc,
            journey_length: journey.length,
            insights,
            trends
          }
        };
      }

      // Analyze emotional patterns with sufficient data
      const dominantEmotion = this.getDominantEmotion(journey);
      const emotionalVariability = this.calculateEmotionalVariability(journey);
      const emotionalArc = this.determineEmotionalArc(journey);

      let message = this.currentLanguage === 'en'
        ? `**Your Emotional Journey Analysis:**\n\n`
        : `**ನಿಮ್ಮ ಭಾವನಾತ್ಮಕ ಪ್ರಯಾಣದ ವಿಶ್ಲೇಷಣೆ:**\n\n`;

      message += this.currentLanguage === 'en'
        ? `**Dominant Emotion**: ${dominantEmotion}\n`
        : `**ಮುಖ್ಯ ಭಾವನೆ**: ${dominantEmotion}\n`;

      message += this.currentLanguage === 'en'
        ? `**Emotional Stability**: ${emotionalVariability}\n`
        : `**ಭಾವನಾತ್ಮಕ ಸ್ಥಿರತೆ**: ${emotionalVariability}\n`;

      message += this.currentLanguage === 'en'
        ? `**Emotional Arc**: ${emotionalArc}\n`
        : `**ಭಾವನಾತ್ಮಕ ಆರ್ಕ್**: ${emotionalArc}\n`;

      if (trends.sentiment_trend) {
        message += this.currentLanguage === 'en'
          ? `**Sentiment Trend**: ${trends.sentiment_trend}\n`
          : `**ಭಾವನೆಯ ಪ್ರವೃತ್ತಿ**: ${trends.sentiment_trend}\n`;
      }

      if (includeTimeline && journey.length > 0) {
        message += this.currentLanguage === 'en'
          ? `\n**Emotional Timeline:**\n`
          : `\n**ಭಾವನಾತ್ಮಕ ಸಮಯರೇಖೆ:**\n`;
        
        journey.slice(-5).forEach((entry, index) => {
          const timeAgo = Math.round((Date.now() - entry.timestamp) / 1000);
          message += `  ${index + 1}. ${entry.emotion} (${entry.intensity}) - ${timeAgo}s ago\n`;
        });
      }

      if (includeTriggers && journey.length > 0) {
        const triggers = journey.filter(e => e.trigger).slice(-3);
        if (triggers.length > 0) {
          message += this.currentLanguage === 'en'
            ? `\n**Recent Emotional Triggers:**\n`
            : `\n**ಇತ್ತೀಚಿನ ಭಾವನಾತ್ಮಕ ಪ್ರಚೋದಕಗಳು:**\n`;
          
          triggers.forEach((entry, index) => {
            message += `  ${index + 1}. "${entry.trigger}..." → ${entry.emotion}\n`;
          });
        }
      }

      // Generate emotional insights
      const insights = this.generateEmotionalInsights(journey, dominantEmotion, emotionalArc);
      
      message += this.currentLanguage === 'en'
        ? `\n**Insights:**\n${insights.map(i => `• ${i}`).join('\n')}`
        : `\n**ಒಳನೋಟಗಳು:**\n${insights.map(i => `• ${i}`).join('\n')}`;

      return {
        success: true,
        data: {
          message,
          dominant_emotion: dominantEmotion,
          emotional_variability: emotionalVariability,
          emotional_arc: emotionalArc,
          journey_length: journey.length,
          insights,
          trends
        }
      };
    } catch (error) {
      console.error('Error analyzing emotional journey:', error);
      return {
        success: false,
        data: {
          message: this.currentLanguage === 'en'
            ? "I don't have enough emotional data yet to analyze your journey. Let's keep talking so I can understand you better!"
            : "Saya belum mempunyai data emosi yang cukup untuk menganalisis perjalanan anda. Jom terus berbual supaya saya dapat memahami anda dengan lebih baik!",
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Get empathetic response suggestions
   */
  private getEmpathyResponse(detectedEmotion: string, context?: string, intensity?: string): any {
    const emotionResponses: Record<string, any> = {
      happy: {
        validation: [
          "That's wonderful! I can see the joy in your expression!",
          "Your happiness is contagious! Love seeing you smile!",
          "This clearly means a lot to you - that's beautiful!"
        ],
        followUp: [
          "What's making you feel so good right now?",
          "I'd love to hear more about what's bringing you this joy!",
          "Share the good news with me!"
        ],
        tone: "Match their enthusiasm, celebrate with them, be genuinely happy for them"
      },
      sad: {
        validation: [
          "I can see you're going through something difficult...",
          "It's okay to feel this way. I'm here with you.",
          "Whatever you're feeling right now is valid."
        ],
        followUp: [
          "Do you want to talk about what's on your mind?",
          "I'm here to listen if you need someone.",
          "Take your time - there's no rush."
        ],
        tone: "Be gentle, slow down, create safe space, don't rush to fix things"
      },
      angry: {
        validation: [
          "I can see you're really frustrated right now.",
          "That sounds incredibly frustrating.",
          "Your feelings are completely understandable."
        ],
        followUp: [
          "What happened that's making you feel this way?",
          "Let's work through this together.",
          "I want to understand - tell me more."
        ],
        tone: "Stay calm, acknowledge their frustration, don't dismiss or minimize"
      },
      fear: {
        validation: [
          "I sense some worry - that's completely natural.",
          "It's okay to feel anxious about this.",
          "Your concerns are valid."
        ],
        followUp: [
          "What's worrying you most right now?",
          "Let's break this down together.",
          "You don't have to face this alone."
        ],
        tone: "Be reassuring, provide structure, offer calm presence"
      },
      surprise: {
        validation: [
          "Wow, that clearly caught you off guard!",
          "I saw that reaction! Something unexpected?",
          "That's quite a surprise!"
        ],
        followUp: [
          "Tell me what just happened!",
          "I'm curious - what surprised you?",
          "What are you thinking now?"
        ],
        tone: "Match their energy, share in the moment, be curious"
      },
      neutral: {
        validation: [
          "I'm here and listening.",
          "What's on your mind?",
          "I'm ready to help with whatever you need."
        ],
        followUp: [
          "How are you feeling today?",
          "What would you like to talk about?",
          "Is there something specific I can help with?"
        ],
        tone: "Be warm and inviting, gently explore their state"
      },
      confused: {
        validation: [
          "I can see you're trying to process something.",
          "That does sound confusing.",
          "Let me help make this clearer."
        ],
        followUp: [
          "What part is most unclear?",
          "Should I explain it differently?",
          "Let's take this step by step."
        ],
        tone: "Be patient, simplify, check understanding frequently"
      },
      tired: {
        validation: [
          "You look like you could use some rest.",
          "I can see you're running low on energy.",
          "It's okay to take things slow."
        ],
        followUp: [
          "Should we take a break?",
          "Would you like me to keep things brief?",
          "What do you need right now?"
        ],
        tone: "Be gentle, shorten responses, offer to pause"
      }
    };

    const emotionKey = detectedEmotion.toLowerCase();
    const responseData = emotionResponses[emotionKey] || emotionResponses.neutral;
    const intensityLevel = intensity || 'moderate';

    // Adjust response based on intensity
    let responseIntensity = intensityLevel === 'strong' 
      ? 'Use more emphatic language, show deeper concern/celebration'
      : intensityLevel === 'mild'
        ? 'Keep response measured, gentle acknowledgment'
        : 'Standard empathetic response';

    const message = this.currentLanguage === 'en'
      ? `**Empathy Response Guide for ${detectedEmotion.toUpperCase()}:**\n\n` +
        `**Validation phrases:**\n${responseData.validation.map((v: string) => `  • "${v}"`).join('\n')}\n\n` +
        `**Follow-up questions:**\n${responseData.followUp.map((f: string) => `  • "${f}"`).join('\n')}\n\n` +
        `**Recommended tone:** ${responseData.tone}\n\n` +
        `**Intensity adjustment:** ${responseIntensity}` +
        (context ? `\n\n**Context:** "${context}"` : '')
      : `**Panduan Respons Empati untuk ${detectedEmotion.toUpperCase()}:**\n\n` +
        `**Frasa pengesahan:**\n${responseData.validation.map((v: string) => `  • "${v}"`).join('\n')}\n\n` +
        `**Soalan susulan:**\n${responseData.followUp.map((f: string) => `  • "${f}"`).join('\n')}\n\n` +
        `**Nada disyorkan:** ${responseData.tone}`;

    return {
      success: true,
      data: {
        message,
        emotion: detectedEmotion,
        validation_phrases: responseData.validation,
        follow_up_questions: responseData.followUp,
        recommended_tone: responseData.tone,
        intensity: intensityLevel,
        intensity_adjustment: responseIntensity
      }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPER METHODS FOR EMOTIONAL INTELLIGENCE
  // ═══════════════════════════════════════════════════════════════════════════

  private interpretEmotionalState(emotion: string, sentiment: number, fatigue: string, engagement: string): string {
    const interpretations: Record<string, string> = {
      happy: sentiment > 0.3 
        ? "The user is genuinely happy and in a positive mood - they're likely enjoying the conversation."
        : "The user appears content but may be holding back some feelings.",
      sad: fatigue !== 'Normal'
        ? "The user seems sad and tired - they may need gentle support and shorter interactions."
        : "The user is experiencing sadness - create a safe space for them to share.",
      angry: engagement === 'high'
        ? "The user is frustrated but engaged - they want to be heard and understood."
        : "The user seems frustrated and may be withdrawing - approach gently.",
      fear: "The user appears anxious or worried - provide reassurance and calm presence.",
      surprise: "Something unexpected has caught the user's attention - explore what surprised them.",
      neutral: engagement === 'low'
        ? "The user seems neutral but disengaged - try to spark their interest."
        : "The user is calm and attentive - good opportunity for meaningful conversation.",
      disgust: "The user may be reacting negatively to something - check if they're uncomfortable."
    };

    return interpretations[emotion.toLowerCase()] || 
      "The user's emotional state is complex - pay attention to subtle cues.";
  }

  private generateConversationGuidance(emotion: string, attention: string, engagement: string, fatigue: string): string[] {
    const guidance: string[] = [];

    // Emotion-based guidance
    if (['sad', 'fear', 'angry'].includes(emotion.toLowerCase())) {
      guidance.push("Use slower, gentler language");
      guidance.push("Validate feelings before offering solutions");
    } else if (emotion.toLowerCase() === 'happy') {
      guidance.push("Match their positive energy");
      guidance.push("Celebrate with them authentically");
    }

    // Attention-based guidance
    if (attention === 'Distracted' || attention === 'Low') {
      guidance.push("Keep responses concise and engaging");
      guidance.push("Use direct questions to re-engage");
    }

    // Engagement-based guidance
    if (engagement === 'low') {
      guidance.push("Ask open-ended questions");
      guidance.push("Switch to topics they might find interesting");
    }

    // Fatigue-based guidance
    if (fatigue === 'Moderate' || fatigue === 'Severe') {
      guidance.push("Shorten your responses");
      guidance.push("Offer to take a break if needed");
    }

    return guidance.length > 0 ? guidance : ["Continue with natural, empathetic conversation"];
  }

  private generateEmpathyPrompts(emotion: string, sentiment: number): string[] {
    const prompts: string[] = [];

    switch (emotion.toLowerCase()) {
      case 'sad':
        prompts.push("I notice you seem a bit down...");
        prompts.push("It's okay to feel this way.");
        prompts.push("I'm here if you want to talk about it.");
        break;
      case 'happy':
        prompts.push("Your smile is lighting up our conversation!");
        prompts.push("I love seeing you this happy!");
        prompts.push("What's bringing you such joy?");
        break;
      case 'angry':
        prompts.push("I can see you're frustrated...");
        prompts.push("That sounds really challenging.");
        prompts.push("Let's work through this together.");
        break;
      case 'fear':
        prompts.push("I sense some worry...");
        prompts.push("You're not alone in this.");
        prompts.push("Let's take this one step at a time.");
        break;
      default:
        prompts.push("How are you feeling right now?");
        prompts.push("I'm here and listening.");
    }

    return prompts;
  }

  private getEmotionIntensity(data: any): string {
    const sentiment = Math.abs(data.sentiment || 0);
    const attentionScore = data.attention_score || 50;
    
    if (sentiment > 0.5 || attentionScore > 80 || attentionScore < 30) {
      return 'strong';
    } else if (sentiment > 0.2 || attentionScore > 60 || attentionScore < 40) {
      return 'moderate';
    }
    return 'mild';
  }

  private getDominantEmotion(journey: EmotionalMemory[]): string {
    if (journey.length === 0) return 'neutral';
    
    const emotionCounts: Record<string, number> = {};
    journey.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });
    
    return Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  private calculateEmotionalVariability(journey: EmotionalMemory[]): string {
    if (journey.length < 3) return 'Insufficient data';
    
    const uniqueEmotions = new Set(journey.map(e => e.emotion)).size;
    
    if (uniqueEmotions <= 2) return 'Stable';
    if (uniqueEmotions <= 4) return 'Moderate variability';
    return 'High variability';
  }

  private determineEmotionalArc(journey: EmotionalMemory[]): string {
    if (journey.length < 2) return 'Not enough data';
    
    const positiveEmotions = ['happy', 'surprise'];
    
    const firstHalf = journey.slice(0, Math.floor(journey.length / 2));
    const secondHalf = journey.slice(Math.floor(journey.length / 2));
    
    const firstPositive = firstHalf.filter(e => positiveEmotions.includes(e.emotion.toLowerCase())).length;
    const secondPositive = secondHalf.filter(e => positiveEmotions.includes(e.emotion.toLowerCase())).length;
    
    if (secondPositive > firstPositive) return 'Improving';
    if (secondPositive < firstPositive) return 'Declining';
    return 'Stable';
  }

  private generateEmotionalInsights(journey: EmotionalMemory[], dominantEmotion: string, arc: string): string[] {
    const insights: string[] = [];
    
    if (dominantEmotion !== 'neutral') {
      insights.push(`• Your primary emotional state has been ${dominantEmotion}`);
    }
    
    if (arc.includes('Improving')) {
      insights.push('• Your mood has been trending more positive');
    } else if (arc.includes('Declining')) {
      insights.push('• Your mood has been shifting - is everything okay?');
    }
    
    const strongEmotions = journey.filter(e => e.intensity === 'strong');
    if (strongEmotions.length > 0) {
      insights.push(`• There were ${strongEmotions.length} moments of strong emotional expression`);
    }
    
    return insights.length > 0 ? insights : ['• Emotional patterns are still developing'];
  }

  private formatEnglishBehavioralMessage(
    emotion: string, attention: string, engagement: string, 
    sentiment: number, fatigue: string, posture: string, 
    movement: string, attentionScore: number, interpretation: string,
    blinkRate: number | null = null, totalBlinks: number | null = null,
    blinkDuration: number | null = null, blinkInterval: number | null = null
  ): string {
    let msg = `**Real-Time Emotional Analysis:**\n\n`;
    msg += `**Primary Emotion:** ${emotion.charAt(0).toUpperCase() + emotion.slice(1)}\n`;
    msg += `**Attention:** ${attention} (${attentionScore.toFixed(0)}/100)\n`;
    msg += `**Engagement Level:** ${engagement}\n`;
    
    if (sentiment !== 0) {
      const sentimentLabel = sentiment > 0.3 ? 'Positive' : sentiment < -0.3 ? 'Negative' : 'Neutral';
      msg += `**Sentiment:** ${sentimentLabel} (${sentiment > 0 ? '+' : ''}${sentiment.toFixed(2)})\n`;
    }
    
    if (fatigue !== 'Normal') {
      msg += `**Fatigue:** ${fatigue}\n`;
    }
    
    if (posture && posture !== 'Unknown') {
      msg += `**Posture:** ${posture}\n`;
    }
    
    // Add blink metrics if available
    if (blinkRate !== null && blinkRate !== undefined) {
      msg += `**Blink Rate:** ${blinkRate.toFixed(1)} blinks/min\n`;
    }
    if (totalBlinks !== null && totalBlinks !== undefined) {
      msg += `**Total Blinks:** ${totalBlinks}\n`;
    }
    if (blinkDuration !== null && blinkDuration !== undefined) {
      msg += `**Avg Blink Duration:** ${blinkDuration.toFixed(2)}s\n`;
    }
    if (blinkInterval !== null && blinkInterval !== undefined) {
      msg += `**Avg Blink Interval:** ${blinkInterval.toFixed(2)}s\n`;
    }
    
    msg += `\n**What This Tells Me:**\n${interpretation}\n`;
    
    return msg;
  }

  private formatKannadaBehavioralMessage(
    emotion: string, attention: string, engagement: string,
    sentiment: number, fatigue: string, posture: string,
    movement: string, attentionScore: number, interpretation: string,
    blinkRate: number | null = null, totalBlinks: number | null = null,
    blinkDuration: number | null = null, blinkInterval: number | null = null
  ): string {
    let msg = `**ನೈಜ-ಸಮಯದ ಭಾವನಾತ್ಮಕ ವಿಶ್ಲೇಷಣೆ:**\n\n`;
    msg += `**ಮುಖ್ಯ ಭಾವನೆ:** ${emotion}\n`;
    msg += `**ಗಮನ:** ${attention} (${attentionScore.toFixed(0)}/100)\n`;
    msg += `**ತೊಡಗಿಸಿಕೊಳ್ಳುವಿಕೆಯ ಮಟ್ಟ:** ${engagement}\n`;
    
    if (sentiment !== 0) {
      const sentimentLabel = sentiment > 0.3 ? 'ಧನಾತ್ಮಕ' : sentiment < -0.3 ? 'ನಕಾರಾತ್ಮಕ' : 'ತಟಸ್ಥ';
      msg += `**ಭಾವನೆ:** ${sentimentLabel} (${sentiment > 0 ? '+' : ''}${sentiment.toFixed(2)})\n`;
    }
    
    if (fatigue !== 'Normal') {
      msg += `**ಆಯಾಸ:** ${fatigue}\n`;
    }
    
    // Add blink metrics if available
    if (blinkRate !== null && blinkRate !== undefined) {
      msg += `**ಕಣ್ಣು ಮಿಟುಕಿಸುವ ದರ:** ${blinkRate.toFixed(1)} ಮಿಟುಕುಗಳು/ನಿಮಿಷ\n`;
    }
    if (totalBlinks !== null && totalBlinks !== undefined) {
      msg += `**ಒಟ್ಟು ಮಿಟುಕುಗಳು:** ${totalBlinks}\n`;
    }
    if (blinkDuration !== null && blinkDuration !== undefined) {
      msg += `**ಸರಾಸರಿ ಮಿಟುಕು ಅವಧಿ:** ${blinkDuration.toFixed(2)}s\n`;
    }
    if (blinkInterval !== null && blinkInterval !== undefined) {
      msg += `**ಸರಾಸರಿ ಮಿಟುಕು ಮಧ್ಯಂತರ:** ${blinkInterval.toFixed(2)}s\n`;
    }
    
    msg += `\n**ಇದು ನನಗೆ ಏನು ಹೇಳುತ್ತದೆ:**\n${interpretation}\n`;
    
    return msg;
  }

  /**
   * Set user's name for personalized interactions
   */
  private setUserName(name: string): any {
    // Update memory with user's name
    this.memory.userProfile = {
      name: name,
      nameConfirmed: true
    };
    
    const message = this.currentLanguage === 'en'
      ? `Lovely to meet you, ${name}! I've noted your name and will address you personally throughout our conversation. I'll also include your name in the comprehensive behavioral report I can generate for you at the end of our chat.`
      : `${name}, ನಿಮ್ಮನ್ನು ಭೇಟಿಯಾಗಲು ಸಂತೋಷ! ನಾನು ನಿಮ್ಮ ಹೆಸರನ್ನು ಗಮನಿಸಿದ್ದೇನೆ ಮತ್ತು ನಮ್ಮ ಸಂಭಾಷಣೆಯುದ್ದಕ್ಕೂ ನಿಮ್ಮನ್ನು ವೈಯಕ್ತಿಕವಾಗಿ ಸಂಬೋಧಿಸುತ್ತೇನೆ.`;

    return {
      success: true,
      data: {
        message,
        name: name,
        confirmed: true
      }
    };
  }

  /**
   * Generate comprehensive behavioral report
   */
  private async generateBehavioralReport(includeRecommendations: boolean = true, includeTimeline: boolean = true): Promise<any> {
    try {
      // Fetch report data from FUSION API
      const response = await fetch(
        `${this.fusionApiUrl}/api/report/current`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          mode: 'cors'
        }
      );

      if (!response.ok) {
        // Get error details from response
        let errorDetail = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorData.message || errorDetail;
        } catch {
          const errorText = await response.text();
          errorDetail = errorText || errorDetail;
        }
        
        // If 404, provide a more helpful message
        if (response.status === 404) {
          const errorMessage = this.currentLanguage === 'en'
            ? `I couldn't find any behavioral data for this session. This might mean:\n\n• The behavioral analysis system (BEVAL) hasn't collected enough data yet\n• The session just started and needs more time to gather metrics\n• There might be a connection issue with the data collection system\n\nWould you like me to try again in a moment, or would you prefer to continue our conversation?`
            : `ಈ ಸೆಷನ್‌ಗಾಗಿ ನಡವಳಿಕೆ ಡೇಟಾವನ್ನು ನಾನು ಕಂಡುಹಿಡಿಯಲಿಲ್ಲ. ಇದು ಇದನ್ನು ಅರ್ಥೈಸಬಹುದು:\n\n• ನಡವಳಿಕೆ ವಿಶ್ಲೇಷಣಾ ವ್ಯವಸ್ಥೆ (BEVAL) ಇನ್ನೂ ಸಾಕಷ್ಟು ಡೇಟಾವನ್ನು ಸಂಗ್ರಹಿಸಿಲ್ಲ\n• ಸೆಷನ್ ಇದೀಗ ಪ್ರಾರಂಭವಾಗಿದೆ ಮತ್ತು ಮೆಟ್ರಿಕ್‌ಗಳನ್ನು ಸಂಗ್ರಹಿಸಲು ಹೆಚ್ಚು ಸಮಯ ಬೇಕು`;
          
          return {
            success: false,
            data: {
              message: errorMessage,
              error: errorDetail,
              status: response.status
            }
          };
        }
        
        throw new Error(`Failed to fetch report data: ${errorDetail}`);
      }

      const reportData = await response.json();
      
      // Check if there's a message indicating no data
      if (reportData.message && reportData.total_data_points === 0) {
        const noDataMessage = this.currentLanguage === 'en'
          ? `I couldn't generate a comprehensive behavioral report because no behavioral data has been collected yet for this session.\n\n**Possible reasons:**\n• The behavioral analysis system (BEVAL) may not be running\n• The session just started and needs more time to collect metrics\n• There might be a connection issue between the systems\n\n**What you can do:**\n• Make sure BEVAL is running and collecting data\n• Continue the conversation for a few more minutes to allow data collection\n• Try generating the report again later\n\nWould you like to continue our conversation, or would you prefer to try again in a moment?`
          : `ಈ ಸೆಷನ್‌ಗಾಗಿ ಇನ್ನೂ ನಡವಳಿಕೆ ಡೇಟಾವನ್ನು ಸಂಗ್ರಹಿಸಲಾಗಿಲ್ಲವಾದ್ದರಿಂದ ನಾನು ಸಮಗ್ರ ನಡವಳಿಕೆ ವರದಿಯನ್ನು ರಚಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.\n\n**ಸಾಧ್ಯತೆಗಳು:**\n• ನಡವಳಿಕೆ ವಿಶ್ಲೇಷಣಾ ವ್ಯವಸ್ಥೆ (BEVAL) ಚಾಲನೆಯಲ್ಲಿಲ್ಲ\n• ಸೆಷನ್ ಇದೀಗ ಪ್ರಾರಂಭವಾಗಿದೆ ಮತ್ತು ಮೆಟ್ರಿಕ್‌ಗಳನ್ನು ಸಂಗ್ರಹಿಸಲು ಹೆಚ್ಚು ಸಮಯ ಬೇಕು`;
        
        return {
          success: false,
          data: {
            message: noDataMessage,
            has_data: false
          }
        };
      }
      
      // Get user's name
      const userName = this.memory.userProfile?.name || 'User';
      const sessionDuration = reportData.duration_formatted || 'Unknown';
      const dataPoints = reportData.total_data_points || 0;
      
      // Generate comprehensive report
      let report = '';
      
      if (this.currentLanguage === 'en') {
        report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║              COMPREHENSIVE BEHAVIORAL ANALYSIS REPORT                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Subject: ${userName.padEnd(60)}     ║
║  Session Duration: ${sessionDuration.padEnd(51)}     ║
║  Data Points Analyzed: ${String(dataPoints).padEnd(47)}     ║
║  Generated: ${new Date().toLocaleString().padEnd(58)}     ║
╚══════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMOTIONAL ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Dominant Emotion:** ${reportData.emotion_analysis?.dominant_emotion || 'neutral'}
**Emotional Variety:** ${reportData.emotion_analysis?.emotional_variety || 0} different emotions detected
**Emotional Stability:** ${reportData.emotion_analysis?.emotional_stability || 'unknown'}
**Emotion Transitions:** ${reportData.emotion_analysis?.transitions_count || 0} changes during session

**Emotion Distribution:**
${Object.entries(reportData.emotion_analysis?.distribution || {}).map(([emotion, count]) => 
  `  • ${emotion}: ${count} occurrences (${((count as number / dataPoints) * 100).toFixed(1)}%)`
).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SENTIMENT ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Overall Sentiment:** ${reportData.sentiment_analysis?.overall || 'neutral'}
**Average Score:** ${(reportData.sentiment_analysis?.average || 0).toFixed(3)} (range: -1 to +1)
**Sentiment Range:** ${(reportData.sentiment_analysis?.min || 0).toFixed(3)} to ${(reportData.sentiment_analysis?.max || 0).toFixed(3)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ATTENTION ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Average Attention Score:** ${(reportData.attention_analysis?.average_score || 50).toFixed(1)}/100
**Attention Quality:** ${reportData.attention_analysis?.attention_quality || 'moderate'}
**Score Range:** ${(reportData.attention_analysis?.min_score || 0).toFixed(1)} to ${(reportData.attention_analysis?.max_score || 100).toFixed(1)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FATIGUE ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Primary State:** ${reportData.fatigue_analysis?.primary_state || 'Normal'}
**Distribution:**
${Object.entries(reportData.fatigue_analysis?.distribution || {}).map(([state, count]) => 
  `  • ${state}: ${count} occurrences`
).join('\n') || '  No fatigue data available'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENGAGEMENT ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Primary Engagement Level:** ${reportData.engagement_analysis?.primary_level || 'medium'}
**Distribution:**
${Object.entries(reportData.engagement_analysis?.distribution || {}).map(([level, count]) => 
  `  • ${level}: ${count} occurrences`
).join('\n') || '  No engagement data available'}
`;

        if (includeTimeline && reportData.timeline) {
          report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMOTIONAL JOURNEY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Starting Emotion:** ${reportData.timeline.first_emotion || 'neutral'}
**Ending Emotion:** ${reportData.timeline.last_emotion || 'neutral'}

**Key Emotional Transitions:**
${(reportData.timeline.emotion_transitions || []).slice(0, 5).map((t: any, i: number) => 
  `  ${i + 1}. ${t.from} → ${t.to}`
).join('\n') || '  Stable emotional state maintained'}
`;
        }

        if (includeRecommendations) {
          // Generate personalized recommendations based on the data
          const recommendations = this.generatePersonalizedRecommendations(reportData, userName);
          report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PERSONALIZED RECOMMENDATIONS FOR ${userName.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${recommendations}
`;
        }

        report += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Dear ${userName},

During our ${sessionDuration} conversation, I observed ${dataPoints} behavioral data points.
Your dominant emotional state was "${reportData.emotion_analysis?.dominant_emotion || 'neutral'}" with 
${reportData.emotion_analysis?.emotional_stability || 'moderate'} stability. Your attention quality
was ${reportData.attention_analysis?.attention_quality || 'moderate'} with an average score of 
${(reportData.attention_analysis?.average_score || 50).toFixed(1)}/100.

Thank you for sharing this time with me. I hope our conversation was valuable to you!

With warmth,
ARIA - Advanced Relational Intelligence Assistant

═══════════════════════════════════════════════════════════════════════════════
                        END OF BEHAVIORAL REPORT
═══════════════════════════════════════════════════════════════════════════════
`;
      } else {
        // Kannada version
        report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║              ಸಮಗ್ರ ನಡವಳಿಕೆ ವಿಶ್ಲೇಷಣಾ ವರದಿ                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ವಿಷಯ: ${userName}
║  ಅವಧಿ: ${sessionDuration}
║  ಡೇಟಾ ಪಾಯಿಂಟ್‌ಗಳು: ${dataPoints}
║  ರಚಿಸಲಾಗಿದೆ: ${new Date().toLocaleString()}
╚══════════════════════════════════════════════════════════════════════════════╝

ಭಾವನಾತ್ಮಕ ವಿಶ್ಲೇಷಣೆ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**ಪ್ರಮುಖ ಭಾವನೆ:** ${reportData.emotion_analysis?.dominant_emotion || 'neutral'}
**ಭಾವನಾತ್ಮಕ ಸ್ಥಿರತೆ:** ${reportData.emotion_analysis?.emotional_stability || 'unknown'}

ಸೆಂಟಿಮೆಂಟ್ ವಿಶ್ಲೇಷಣೆ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**ಒಟ್ಟಾರೆ:** ${reportData.sentiment_analysis?.overall || 'neutral'}
**ಸರಾಸರಿ ಸ್ಕೋರ್:** ${(reportData.sentiment_analysis?.average || 0).toFixed(3)}

ಗಮನ ವಿಶ್ಲೇಷಣೆ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
**ಸರಾಸರಿ ಸ್ಕೋರ್:** ${(reportData.attention_analysis?.average_score || 50).toFixed(1)}/100
**ಗುಣಮಟ್ಟ:** ${reportData.attention_analysis?.attention_quality || 'moderate'}

ಧನ್ಯವಾದಗಳು, ${userName}!

ARIA
═══════════════════════════════════════════════════════════════════════════════
`;
      }

      return {
        success: true,
        data: {
          message: report,
          report_data: reportData,
          user_name: userName,
          generated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('Error generating behavioral report:', error);
      
      const errorMessage = this.currentLanguage === 'en'
        ? `I apologize, but I couldn't generate your behavioral report at this time. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        : `ಕ್ಷಮಿಸಿ, ಈ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ನಡವಳಿಕೆ ವರದಿಯನ್ನು ರಚಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.`;

      return {
        success: false,
        data: {
          message: errorMessage,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Generate personalized recommendations based on behavioral data
   */
  private generatePersonalizedRecommendations(reportData: any, userName: string): string {
    const recommendations: string[] = [];
    
    // Based on dominant emotion
    const dominantEmotion = reportData.emotion_analysis?.dominant_emotion?.toLowerCase() || 'neutral';
    if (dominantEmotion === 'sad') {
      recommendations.push(`• ${userName}, consider engaging in activities that bring you joy. Your emotional well-being is important.`);
      recommendations.push(`• Talking to friends or loved ones about how you're feeling can be very helpful.`);
    } else if (dominantEmotion === 'angry' || dominantEmotion === 'frustrated') {
      recommendations.push(`• ${userName}, practicing deep breathing or short mindfulness exercises can help manage frustration.`);
      recommendations.push(`• Taking short breaks during stressful situations can prevent emotional buildup.`);
    } else if (dominantEmotion === 'fear' || dominantEmotion === 'anxious') {
      recommendations.push(`• ${userName}, grounding exercises (5-4-3-2-1 technique) can help when feeling anxious.`);
      recommendations.push(`• Breaking down challenges into smaller steps can reduce overwhelm.`);
    } else if (dominantEmotion === 'happy') {
      recommendations.push(`• ${userName}, wonderful to see you in good spirits! Continue doing what brings you joy.`);
      recommendations.push(`• Consider journaling about positive moments to reinforce this emotional state.`);
    } else {
      recommendations.push(`• ${userName}, maintaining emotional awareness is a great practice. Keep checking in with yourself.`);
    }

    // Based on attention
    const attentionQuality = reportData.attention_analysis?.attention_quality || 'moderate';
    if (attentionQuality === 'needs_improvement' || attentionQuality === 'moderate') {
      recommendations.push(`• To improve focus, try the Pomodoro technique: 25 minutes of focused work, then 5 minutes break.`);
      recommendations.push(`• Reducing distractions in your environment can significantly improve attention.`);
    } else {
      recommendations.push(`• Your attention levels are excellent! This indicates good cognitive engagement.`);
    }

    // Based on fatigue
    const primaryFatigue = reportData.fatigue_analysis?.primary_state || 'Normal';
    if (primaryFatigue === 'Moderate' || primaryFatigue === 'Severe') {
      recommendations.push(`• ${userName}, I noticed signs of fatigue. Ensure you're getting adequate sleep (7-9 hours).`);
      recommendations.push(`• Regular short breaks and staying hydrated can help combat fatigue.`);
    }

    // Based on emotional stability
    const emotionalStability = reportData.emotion_analysis?.emotional_stability || 'moderate';
    if (emotionalStability === 'volatile') {
      recommendations.push(`• ${userName}, your emotions showed significant variation. This is normal, but mindfulness practices can help create more stability.`);
    }

    return recommendations.join('\n');
  }

  private _extractRecentTopics(conversationHistory: Array<{ userInput: string; agentResponse: string }>): string[] {
    const topics = new Set<string>();
    const recentInteractions = conversationHistory.slice(-5);
    
    recentInteractions.forEach(interaction => {
      const userInput = interaction.userInput?.toLowerCase() || '';
      // Extract potential topics (simple keyword extraction)
      const words = userInput.split(/\s+/).filter(w => w.length > 4);
      words.forEach(word => {
        if (!['about', 'think', 'would', 'could', 'should', 'there', 'their', 'these', 'those'].includes(word)) {
          topics.add(word);
        }
      });
    });
    
    return Array.from(topics).slice(0, 10);
  }

  private getAgentName(functionName: string): string {
    const names: Record<string, string> = {
      "switch_language_mode": "Language Switcher",
      "get_behavioral_context": "Emotional Intelligence",
      "analyze_emotional_journey": "Emotional Journey Analyzer",
      "get_empathy_response": "Empathy Advisor"
    };
    return names[functionName] || "Unknown Agent";
  }

  private updateMemoryWithInteraction(functionName: string, args: any, result: any, context: AgentContext): void {
    // Track emotional interactions for better context
  }

  getWelcomeMessage(): { title: string; subtitle: string } {
    return this.mainAgent.getWelcomeMessage();
  }

  getServiceOptions(): Array<{ title: string; description: string }> {
    return this.mainAgent.getServiceOptions();
  }

  updateLanguage(language: 'en' | 'kn', getContextualInfo?: () => Record<string, unknown>): void {
    if (this.currentLanguage !== language) {
      this.currentLanguage = language;
      this.mainAgent = new MainAgent({ language, memory: this.memory, behavioralContext: this.behavioralContext });
    }
  }

  updateBehavioralContext(behavioralContext: string): void {
    this.behavioralContext = behavioralContext;
    this.mainAgent = new MainAgent({ 
      language: this.currentLanguage, 
      memory: this.memory, 
      behavioralContext: this.behavioralContext 
    });
  }

  getCurrentLanguage(): 'en' | 'kn' {
    return this.currentLanguage;
  }
}
