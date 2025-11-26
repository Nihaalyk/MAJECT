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

  constructor(memory: ConversationMemory, language: 'en' | 'ms', getContextualInfo?: () => Record<string, unknown>) {
    this.memory = memory;
    this.currentLanguage = language;

    // Initialize agents
    this.mainAgent = new MainAgent({ language, memory });
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
   * Get agent name from function name
   */
  private getAgentName(functionName: string): string {
    switch (functionName) {
      case "handle_faq_inquiry":
        return "FAQ Agent";
      case "switch_language_mode":
        return "Language Switcher";
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
      this.mainAgent = new MainAgent({ language, memory: this.memory });
      this.faqAgent = new FAQAgent({
        language,
        memory: this.memory,
        getContextualInfo: getContextualInfo || (() => ({}))
      });
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): 'en' | 'ms' {
    return this.currentLanguage;
  }
}
