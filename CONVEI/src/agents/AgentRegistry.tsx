/**
 * Agent Registry - Manages all agents and their interactions
 */

import { MainAgent } from "./main-agent/MainAgent";
import { FAQAgent } from "./faq-agent";
import { ConversationMemory } from "../contexts/ConversationMemoryContext";

import { ToolResponseData } from "../types/chat";

export interface AgentContext {
  language: 'en' | 'ms';
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

export class AgentRegistry {
  private mainAgent: MainAgent;
  private faqAgent: FAQAgent;
  private memory: ConversationMemory;
  private currentLanguage: 'en' | 'ms';
  private behavioralContext: string = '';
  private fusionApiUrl: string;

  constructor(memory: ConversationMemory, language: 'en' | 'ms', getContextualInfo?: () => Record<string, unknown>, behavioralContext?: string) {
    this.memory = memory;
    this.currentLanguage = language;
    this.behavioralContext = behavioralContext || '';
    // Get FUSION API URL from environment variable
    // In Create React App, env vars are available at build time via process.env.REACT_APP_*
    const envUrl = typeof process !== 'undefined' ? (process.env as any)?.REACT_APP_FUSION_API_URL : undefined;
    this.fusionApiUrl = envUrl || 'http://localhost:8083';

    // Initialize agents
    this.mainAgent = new MainAgent({ language, memory, behavioralContext: this.behavioralContext });
    this.faqAgent = new FAQAgent({
      language,
      memory,
      getContextualInfo: getContextualInfo || (() => ({}))
    });
  }

  /**
   * Get function declarations from all agents
   */
  getFunctionDeclarations(): any[] {
    return this.mainAgent.getFunctionDeclarations();
  }

  /**
   * Get system instruction from main agent
   */
  getSystemInstruction(): string {
    return this.mainAgent.getSystemInstruction();
  }

  /**
   * Process tool call through appropriate agent
   */
  async processToolCall(toolCall: any, context: AgentContext): Promise<AgentResult | null> {
    const functionCalls = toolCall.functionCalls;
    if (!functionCalls?.length) return null;

    const functionCall = functionCalls[0];
    const { name, args } = functionCall;

    try {
      let result: any = null;

      switch (name) {
        case "handle_faq_inquiry":
          result = await this.faqAgent.processInquiry(args.question, args.context);
          break;
          
        case "switch_language_mode":
          // Language switching is handled in the UI, just return success
          result = {
            success: true,
            data: {
              message: context.language === 'en' 
                ? `Language mode switched to ${args.target_language === 'en' ? 'English' : 'Malay'}.`
                : `Mod bahasa ditukar kepada ${args.target_language === 'en' ? 'Bahasa Inggeris' : 'Bahasa Melayu'}.`,
              language_switched: true,
              new_language: args.target_language
            }
          };
          break;

        case "get_behavioral_context":
          // Always use "current" to get the latest metrics from the collector
          // The API will automatically find the session with the most recent data
          const sessionId = "current";  // Always use "current" to get latest data
          // Use a shorter window (5 seconds) to get the most recent data
          const windowSeconds = args.window || 5;  // Default to 5 seconds for fresher data
          console.log("📊 get_behavioral_context tool called:", { sessionId, window: windowSeconds });
          result = await this.getBehavioralContext(sessionId, windowSeconds);
          console.log("📊 get_behavioral_context result:", result);
          break;
          
        default:
          throw new Error(`Unknown function: ${name}`);
      }

      if (result) {
        // Update memory with this interaction
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
   * Get behavioral context from FUSION API
   */
  private async getBehavioralContext(sessionId: string, window: number = 30): Promise<any> {
    try {
      // If sessionId is "current", the API will automatically find the latest session
      // No need to create sessions - the collector handles that
      
      const response = await fetch(
        `${this.fusionApiUrl}/api/metrics/context/${sessionId}?window=${window}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          mode: 'cors'
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: {
              message: this.currentLanguage === 'en'
                ? "I don't have behavioral data available yet. Please make sure your camera and microphone are active so I can analyze your facial expressions and voice."
                : "Saya tidak mempunyai data tingkah laku lagi. Sila pastikan kamera dan mikrofon anda aktif supaya saya boleh menganalisis ekspresi muka dan suara anda.",
              available: false,
              current_state: {
                emotion: "unknown",
                attention: "Unknown",
                engagement: "medium",
                sentiment: 0.0,
                confidence: "medium"
              }
            }
          };
        }
        throw new Error(`FUSION API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Format the response for the AI
      const state = data.current_state || {};
      const emotion = state.emotion || 'neutral';
      const attention = state.attention || 'Unknown';
      const engagement = state.engagement || 'medium';
      const sentiment = state.sentiment || 0.0;
      const fatigue = state.fatigue || 'Normal';
      const posture = state.posture || 'Unknown';
      const movement = state.movement || 'Unknown';

      let message = this.currentLanguage === 'en'
        ? `**Current Behavioral Metrics Extracted:**\n\nBased on my real-time analysis of your facial expressions, voice, and behavior:\n\n`
        : `**Metrik Tingkah Laku Semasa Diekstrak:**\n\nBerdasarkan analisis masa nyata saya tentang ekspresi muka, suara, dan tingkah laku anda:\n\n`;

      message += this.currentLanguage === 'en'
        ? `**Emotion**: ${emotion}\n`
        : `**Emosi**: ${emotion}\n`;
      
      message += this.currentLanguage === 'en'
        ? `**Attention Level**: ${attention}\n`
        : `**Tahap Perhatian**: ${attention}\n`;
      
      message += this.currentLanguage === 'en'
        ? `**Engagement**: ${engagement}\n`
        : `**Penglibatan**: ${engagement}\n`;

      if (state.posture && state.posture !== 'Unknown') {
        message += this.currentLanguage === 'en'
          ? `**Posture**: ${state.posture}\n`
          : `**Postur**: ${state.posture}\n`;
      }

      if (state.movement && state.movement !== 'Unknown') {
        message += this.currentLanguage === 'en'
          ? `**Movement Level**: ${state.movement}\n`
          : `**Tahap Pergerakan**: ${state.movement}\n`;
      }

      if (sentiment !== 0) {
        const sentimentDesc = sentiment > 0.3 ? 'positive' : sentiment < -0.3 ? 'negative' : 'neutral';
        message += this.currentLanguage === 'en'
          ? `**Sentiment** (from voice): ${sentimentDesc} (${sentiment > 0 ? '+' : ''}${sentiment.toFixed(2)})\n`
          : `**Sentimen** (dari suara): ${sentimentDesc} (${sentiment > 0 ? '+' : ''}${sentiment.toFixed(2)})\n`;
      }

      if (fatigue !== 'Normal') {
        message += this.currentLanguage === 'en'
          ? `**Fatigue Level**: ${fatigue}\n`
          : `**Tahap Keletihan**: ${fatigue}\n`;
      }

      if (state.attention_score !== undefined) {
        message += this.currentLanguage === 'en'
          ? `**Attention Score**: ${state.attention_score.toFixed(1)}/100\n`
          : `**Skor Perhatian**: ${state.attention_score.toFixed(1)}/100\n`;
      }

      if (data.behavioral_insights && data.behavioral_insights.length > 0) {
        message += `\n**Insights**: ${data.behavioral_insights.join('; ')}\n`;
      }

      if (data.recommendations && data.recommendations.length > 0) {
        message += `\n**Recommendations**: ${data.recommendations.join('; ')}\n`;
      }

      message += this.currentLanguage === 'en'
        ? `\n**Summary**: I can see your facial expressions showing ${emotion} emotion, your attention level is ${attention}, and your engagement is ${engagement}.`
        : `\n**Ringkasan**: Saya boleh melihat ekspresi muka anda menunjukkan emosi ${emotion}, tahap perhatian anda adalah ${attention}, dan penglibatan anda adalah ${engagement}.`;

      // Return structured data that the AI can easily use
      return {
        success: true,
        data: {
          message,
          available: true,
          current_state: state,
          insights: data.behavioral_insights || [],
          recommendations: data.recommendations || [],
          // Add raw values for AI to reference directly
          emotion: emotion,
          attention: attention,
          engagement: engagement,
          sentiment: sentiment,
          fatigue: fatigue,
          posture: posture,
          movement: movement,
          // Add a concise summary for the AI to use in responses
          summary: this.currentLanguage === 'en'
            ? `The user's current behavioral state: ${emotion} emotion, ${attention} attention, ${engagement} engagement${sentiment !== 0 ? `, ${sentiment > 0.3 ? 'positive' : sentiment < -0.3 ? 'negative' : 'neutral'} sentiment` : ''}.`
            : `Keadaan tingkah laku semasa pengguna: emosi ${emotion}, perhatian ${attention}, penglibatan ${engagement}${sentiment !== 0 ? `, sentimen ${sentiment > 0.3 ? 'positif' : sentiment < -0.3 ? 'negatif' : 'neutral'}` : ''}.`
        }
      };
    } catch (error) {
      console.error('Error fetching behavioral context:', error);
      
      // Check if it's a network/CORS error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isNetworkError = errorMessage.includes('Failed to fetch') || 
                            errorMessage.includes('NetworkError') ||
                            errorMessage.includes('CORS');
      
      return {
        success: false,
        data: {
          message: this.currentLanguage === 'en'
            ? isNetworkError
              ? "I can't connect to the behavioral analysis system right now. Please make sure:\n1. FUSION API is running on http://localhost:8083\n2. BEVAL is running to generate metrics\n3. Your browser allows connections to localhost"
              : "I'm having trouble accessing behavioral analysis right now. The analysis system may not be running or there's a connection issue. Please check that FUSION API is running on http://localhost:8083"
            : isNetworkError
              ? "Saya tidak boleh menyambung ke sistem analisis tingkah laku sekarang. Sila pastikan:\n1. FUSION API sedang berjalan di http://localhost:8083\n2. BEVAL sedang berjalan untuk menjana metrik\n3. Pelayar anda membenarkan sambungan ke localhost"
              : "Saya menghadapi masalah mengakses analisis tingkah laku sekarang. Sistem analisis mungkin tidak berjalan atau terdapat masalah sambungan. Sila semak bahawa FUSION API sedang berjalan di http://localhost:8083",
          error: errorMessage,
          available: false
        }
      };
    }
  }

  /**
   * Get agent name from function name
   */
  private getAgentName(functionName: string): string {
    switch (functionName) {
      case "handle_faq_inquiry":
        return "FAQ Agent";
      case "switch_language_mode":
        return "Language Switcher";
      case "get_behavioral_context":
        return "Behavioral Analysis Agent";
      default:
        return "Unknown Agent";
    }
  }

  /**
   * Update memory with interaction
   */
  private updateMemoryWithInteraction(functionName: string, args: any, result: any, context: AgentContext): void {
    // Update memory with interaction if needed
    // Memory updates can be added here for future features
  }

  /**
   * Get welcome message from main agent
   */
  getWelcomeMessage(): { title: string; subtitle: string } {
    return this.mainAgent.getWelcomeMessage();
  }

  /**
   * Get options from main agent
   */
  getServiceOptions(): Array<{ title: string; description: string }> {
    return this.mainAgent.getServiceOptions();
  }

  /**
   * Update language for all agents (only recreate if language actually changed)
   */
  updateLanguage(language: 'en' | 'ms', getContextualInfo?: () => Record<string, unknown>): void {
    if (this.currentLanguage !== language) {
      this.currentLanguage = language;
      this.mainAgent = new MainAgent({ language, memory: this.memory, behavioralContext: this.behavioralContext });
      this.faqAgent = new FAQAgent({
        language,
        memory: this.memory,
        getContextualInfo: getContextualInfo || (() => ({}))
      });
    }
  }

  /**
   * Update behavioral context for agents
   */
  updateBehavioralContext(behavioralContext: string): void {
    this.behavioralContext = behavioralContext;
    this.mainAgent = new MainAgent({ 
      language: this.currentLanguage, 
      memory: this.memory, 
      behavioralContext: this.behavioralContext 
    });
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): 'en' | 'ms' {
    return this.currentLanguage;
  }
}
