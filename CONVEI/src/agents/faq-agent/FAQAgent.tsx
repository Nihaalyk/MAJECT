/**
 * FAQ Agent - Handles document-based questions and FAQ responses
 */

import { searchFAQ } from "./faq-database";
import { ConversationMemory } from "../../contexts/ConversationMemoryContext";

export interface FAQAgentConfig {
  language: 'en' | 'kn';
  memory: ConversationMemory;
  getContextualInfo: () => Record<string, unknown>;
}

export interface FAQResponse {
  success: boolean;
  data: {
    answer: string;
    source: string;
    category: string;
    related_questions?: string[];
  };
  error?: string;
}

export class FAQAgent {
  private config: FAQAgentConfig;

  constructor(config: FAQAgentConfig) {
    this.config = config;
  }

  /**
   * Process FAQ inquiry with context awareness
   */
  async processInquiry(question: string, context?: string): Promise<FAQResponse> {
    try {
      const { language, memory, getContextualInfo } = this.config;

      // Get contextual information from conversation
      const contextualInfo = getContextualInfo();
      const conversationHistory = memory.currentContext.conversationHistory;
      const recentTopics = this.extractRecentTopics(conversationHistory);

      // Check if this is a service overview question
      if (this.isServiceOverviewQuestion(question)) {
        const serviceOverview = this.getServiceOverview(language);

        // Update memory with this interaction
        this.updateMemoryWithInquiry(question, serviceOverview);

        return {
          success: true,
          data: {
            answer: serviceOverview,
            source: "Service Overview",
            category: "Services",
            related_questions: this.getServiceRelatedQuestions(language)
          }
        };
      }

      // Search FAQ database
      const matchingFAQs = searchFAQ(question, language);

      if (matchingFAQs.length > 0) {
        const bestMatch = matchingFAQs[0];

        // Enhance answer with contextual information
        const enhancedAnswer = this.enhanceAnswerWithContext(
          bestMatch,
          question,
          contextualInfo,
          recentTopics,
          language
        );

        // Update memory with this interaction
        this.updateMemoryWithInquiry(question, enhancedAnswer);

        return {
          success: true,
          data: {
            answer: enhancedAnswer,
            source: "FAQ Database",
            category: bestMatch.category,
            related_questions: this.generateContextualRelatedQuestions(
              matchingFAQs.slice(1, 3),
              contextualInfo,
              recentTopics,
              language
            )
          }
        };
      } else {
        // No direct match found, provide contextual general response
        const contextualResponse = this.getContextualGeneralResponse(
          question,
          contextualInfo,
          recentTopics,
          language
        );

        return {
          success: true,
          data: {
            answer: contextualResponse,
            source: "Contextual Response",
            category: "General"
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        data: {
          answer: "",
          source: "",
          category: ""
        },
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  /**
   * Check if the question is asking for a service overview
   */
  private isServiceOverviewQuestion(question: string): boolean {
    const serviceKeywords = [
      'services', 'what do you offer', 'what do you provide', 'service types',
      'kinds of services', 'what services', 'perkhidmatan', 'apa yang anda tawarkan',
      'jenis perkhidmatan', 'macam-macam perkhidmatan'
    ];

    const lowerQuestion = question.toLowerCase();
    return serviceKeywords.some(keyword => lowerQuestion.includes(keyword));
  }

  /**
   * Get comprehensive service overview
   */
  private getServiceOverview(language: 'en' | 'ms'): string {
    if (language === 'en') {
      return `We offer a comprehensive range of services to meet your needs:

**STANDARD SERVICES:**
• **Basic Service**: Standard service with tracking
• **Express Service**: Fast service for urgent needs
• **Economy Service**: Budget-friendly option
• **Premium Service**: Enhanced features and faster delivery

**ADDITIONAL FEATURES:**
• Real-time tracking
• Online booking and payment
• Mobile app access
• Corporate accounts with discounts

All services include comprehensive tracking and dedicated customer support. How can I help you today?`;
    } else {
      return `Kami menawarkan pelbagai perkhidmatan yang komprehensif untuk memenuhi keperluan anda:

**PERKHIDMATAN STANDARD:**
• **Perkhidmatan Asas**: Perkhidmatan standard dengan tracking
• **Perkhidmatan Ekspres**: Perkhidmatan pantas untuk keperluan mendesak
• **Perkhidmatan Economy**: Pilihan mesra bajet
• **Perkhidmatan Premium**: Ciri-ciri tambahan dan penghantaran lebih pantas

**CIRI TAMBAHAN:**
• Jejak masa nyata
• Tempahan dan pembayaran dalam talian
• Akses aplikasi mudah alih
• Akaun korporat dengan diskaun

Semua perkhidmatan termasuk jejak yang menyeluruh dan sokongan pelanggan khusus. Bagaimana saya boleh membantu anda hari ini?`;
    }
  }

  /**
   * Get related questions for service overview
   */
  private getServiceRelatedQuestions(language: 'en' | 'ms'): string[] {
    if (language === 'en') {
      return [
        "What are the delivery times?",
        "How much does it cost?",
        "Do you offer international services?",
        "What options are available?"
      ];
    } else {
      return [
        "Apa masa penghantaran?",
        "Berapa harganya?",
        "Adakah anda menawarkan perkhidmatan antarabangsa?",
        "Apa pilihan yang tersedia?"
      ];
    }
  }

  /**
   * Extract recent conversation topics for context awareness
   */
  private extractRecentTopics(conversationHistory: Array<{ userInput?: string; agentResponse?: string }>): string[] {
    const topics = new Set<string>();

    // Look at last 5 interactions for context
    const recentInteractions = conversationHistory.slice(-5);

    recentInteractions.forEach(interaction => {
      const userInput = interaction.userInput?.toLowerCase() || '';
      const agentResponse = interaction.agentResponse?.toLowerCase() || '';

      // Extract service-related keywords
      const serviceKeywords = [
        'basic', 'express', 'economy', 'premium',
        'weight', 'berat', 'origin', 'asal', 'destination', 'destinasi',
        'tracking', 'rate', 'harga', 'cost', 'caj', 'service', 'perkhidmatan'
      ];

      serviceKeywords.forEach(keyword => {
        if (userInput.includes(keyword) || agentResponse.includes(keyword)) {
          topics.add(keyword);
        }
      });
    });

    return Array.from(topics);
  }

  /**
   * Enhance FAQ answer with contextual information
   */
  private enhanceAnswerWithContext(
    faqItem: { answer: string; answer_en?: string },
    question: string,
    contextualInfo: Record<string, unknown>,
    recentTopics: string[],
    language: 'en' | 'ms'
  ): string {
    let answer: string = language === 'en' ? (faqItem.answer_en || faqItem.answer) : faqItem.answer;
    if (!answer) {
      answer = language === 'en' ? faqItem.answer : (faqItem.answer_en || faqItem.answer);
    }

    // Add contextual enhancements based on question type and recent topics
    if (question.toLowerCase().includes('service') || question.toLowerCase().includes('perkhidmatan')) {
      if (recentTopics.includes('express') || recentTopics.includes('premium')) {
        const addition = language === 'en'
          ? "\n\nBased on our recent conversation, this service option provides fast delivery with full tracking capabilities."
          : "\n\nBerdasarkan perbualan terkini, pilihan perkhidmatan ini menyediakan penghantaran pantas dengan keupayaan tracking penuh.";
        answer += addition;
      }

      // Contextual information can be used here if needed
    }


    return answer;
  }

  /**
   * Generate contextual related questions based on conversation
   */
  private generateContextualRelatedQuestions(
    relatedFAQs: Array<{ question?: string; question_en?: string }>,
    contextualInfo: Record<string, unknown>,
    recentTopics: string[],
    language: 'en' | 'ms'
  ): string[] {
    const questions = relatedFAQs.map(faq => language === 'en' ? faq.question_en : faq.question).filter(Boolean);

    // Add contextual questions based on conversation if needed

    return questions.filter((q): q is string => Boolean(q)).slice(0, 3); // Limit to 3 related questions
  }

  /**
   * Get contextual general response when no FAQ match
   */
  private getContextualGeneralResponse(
    question: string,
    contextualInfo: Record<string, unknown>,
    recentTopics: string[],
    language: 'en' | 'ms'
  ): string {
    let response = language === 'en'
      ? `I understand you're asking about "${question}". `
      : `Saya faham anda bertanya tentang "${question}". `;

    // Add contextual information based on recent conversation
    if (recentTopics.length > 0) {
      const topicsStr = recentTopics.slice(0, 3).join(', ');
      response += language === 'en'
        ? `Based on our recent conversation about ${topicsStr}, `
        : `Berdasarkan perbualan terkini tentang ${topicsStr}, `;
    }


    response += language === 'en'
      ? "While I don't have specific information about this in our FAQ database, I can help you with general services. For more specific information, please contact customer support."
      : "Walaupun saya tidak mempunyai maklumat spesifik tentang perkara ini dalam pangkalan data FAQ kami, saya boleh membantu anda dengan perkhidmatan umum. Untuk maklumat lebih spesifik, sila hubungi khidmat pelanggan.";

    return response;
  }

  /**
   * Get general response when no FAQ match is found
   */
  private getGeneralResponse(question: string, language: 'en' | 'ms'): string {
    if (language === 'en') {
      return `I understand you're asking about "${question}". While I don't have specific information about this in our FAQ database, I can help you with general services. 

For more specific information, you can:
- Visit our website
- Contact our customer service
- Visit any service branch

Is there anything else I can help you with regarding our services?`;
    } else {
      return `Saya faham anda bertanya tentang "${question}". Walaupun saya tidak mempunyai maklumat khusus tentang ini dalam pangkalan data FAQ kami, saya boleh membantu anda dengan perkhidmatan secara umum.

Untuk maklumat yang lebih khusus, anda boleh:
- Layari laman web kami
- Hubungi pusat khidmat pelanggan kami
- Lawati mana-mana cawangan perkhidmatan

Adakah ada lagi yang boleh saya bantu mengenai perkhidmatan kami?`;
    }
  }

  /**
   * Update memory with inquiry information
   */
  private updateMemoryWithInquiry(question: string, answer: string): void {
    // This would be called by the main agent to update memory
    // The actual memory update happens in the main agent
  }

  /**
   * Get agent name
   */
  getName(): string {
    return "FAQ Agent";
  }

  /**
   * Get agent description
   */
  getDescription(): string {
    const { language } = this.config;
    
    if (language === 'en') {
      return "Handles FAQ and document-based questions about services, policies, and procedures";
    } else {
      return "Mengendalikan FAQ dan soalan berasaskan dokumen tentang perkhidmatan, polisi, dan prosedur";
    }
  }
}
