/**
 * FAQ Agent - Handles document-based questions and FAQ responses
 */

import { searchFAQ } from "./faq-database";
import { ConversationMemory } from "../../contexts/ConversationMemoryContext";

export interface FAQAgentConfig {
  language: 'en' | 'ms';
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
      return `POS Malaysia offers a comprehensive range of postal and delivery services to meet all your shipping needs:

**DOMESTIC SERVICES:**
• **Pos Laju**: Express delivery (1-2 working days) with full tracking - Perfect for urgent documents and packages
• **Pos Biasa**: Standard delivery (3-5 working days) - Cost-effective for light packages
• **Pos Ekspres**: Same-day delivery for certain urban areas - Premium service for time-critical shipments
• **Economy**: Budget-friendly delivery (5-7 working days) - Best value for non-urgent items

**INTERNATIONAL SERVICES:**
• **Express Mail Service (EMS)**: Fast international delivery (3-7 working days)
• **International Surface Air Lift (ISAL)**: Cost-effective international delivery
• **Airmail**: Standard international mail service

**SPECIALIZED SERVICES:**
• **Registered Mail**: With proof of delivery for important documents
• **COD (Cash on Delivery)**: Recipient pays upon delivery
• **Insurance**: Package protection up to RM10,000 for valuable items
• **Pickup Service**: Courier collects from your location (RM5-10 depending on area)
• **Islamic Services**: Shariah-compliant delivery options

**ADDITIONAL FEATURES:**
• Real-time tracking for all services
• Online booking and payment through our website and mobile app
• Corporate accounts with volume discounts
• Customs clearance assistance for international shipments

All services include comprehensive tracking, insurance options, and dedicated customer support. Which service interests you most?`;
    } else {
      return `POS Malaysia menawarkan pelbagai perkhidmatan pos dan penghantaran yang komprehensif untuk memenuhi semua keperluan penghantaran anda:

**PERKHIDMATAN DALAMAN:**
• **Pos Laju**: Penghantaran ekspres (1-2 hari bekerja) dengan jejak penuh - Sempurna untuk dokumen dan bungkusan penting
• **Pos Biasa**: Penghantaran standard (3-5 hari bekerja) - Kos efektif untuk bungkusan ringan
• **Pos Ekspres**: Penghantaran hari sama untuk kawasan bandar tertentu - Perkhidmatan premium untuk penghantaran kritikal masa
• **Economy**: Penghantaran bajet mesra (5-7 hari bekerja) - Nilai terbaik untuk item tidak mendesak

**PERKHIDMATAN ANTARABANGSA:**
• **Express Mail Service (EMS)**: Penghantaran antarabangsa pantas (3-7 hari bekerja)
• **International Surface Air Lift (ISAL)**: Penghantaran antarabangsa kos efektif
• **Airmail**: Perkhidmatan mel antarabangsa standard

**PERKHIDMATAN KHUSUS:**
• **Mel Berdaftar**: Dengan bukti penghantaran untuk dokumen penting
• **COD (Bayar Semasa Penghantaran)**: Penerima bayar semasa penghantaran
• **Insurans**: Perlindungan bungkusan sehingga RM10,000 untuk item berharga
• **Perkhidmatan Pickup**: Kurier mengambil dari lokasi anda (RM5-10 bergantung kawasan)
• **Perkhidmatan Islamic**: Pilihan penghantaran patuh Syariah

**CIRI TAMBAHAN:**
• Jejak masa nyata untuk semua perkhidmatan
• Tempahan dan pembayaran dalam talian melalui laman web dan aplikasi mudah alih
• Akaun korporat dengan diskaun volum
• Bantuan pembersihan kastam untuk penghantaran antarabangsa

Semua perkhidmatan termasuk jejak yang menyeluruh, pilihan insurans, dan sokongan pelanggan khusus. Perkhidmatan mana yang paling menarik minat anda?`;
    }
  }

  /**
   * Get related questions for service overview
   */
  private getServiceRelatedQuestions(language: 'en' | 'ms'): string[] {
    if (language === 'en') {
      return [
        "What are the delivery times for Pos Laju?",
        "How much does Pos Biasa cost?",
        "Do you offer international shipping?",
        "What insurance options are available?"
      ];
    } else {
      return [
        "Apa masa penghantaran untuk Pos Laju?",
        "Berapa harga Pos Biasa?",
        "Adakah anda menawarkan penghantaran antarabangsa?",
        "Apa pilihan insurans yang tersedia?"
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
        'pos laju', 'pos biasa', 'pos ekspres', 'express', 'economy',
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
      if (recentTopics.includes('pos laju') || recentTopics.includes('express')) {
        const addition = language === 'en'
          ? "\n\nBased on our recent conversation about Pos Laju services, this delivery option provides 1-2 working days with full tracking capabilities."
          : "\n\nBerdasarkan perbualan terkini tentang perkhidmatan Pos Laju, pilihan penghantaran ini menyediakan 1-2 hari bekerja dengan keupayaan tracking penuh.";
        answer += addition;
      }

      const pendingInfo = contextualInfo?.pendingInfo as { serviceType?: string; origin?: string; destination?: string } | undefined;
      if (pendingInfo?.serviceType) {
        const service = pendingInfo.serviceType;
        const addition = language === 'en'
          ? `\n\nI notice you were previously discussing ${service}. This service is one of our most popular options.`
          : `\n\nSaya perhatikan anda sebelum ini membincangkan ${service}. Perkhidmatan ini adalah salah satu pilihan paling popular kami.`;
        answer += addition;
      }
    }

    // Add location context if relevant
    const pendingInfo = contextualInfo?.pendingInfo as { serviceType?: string; origin?: string; destination?: string } | undefined;
    if ((question.toLowerCase().includes('rate') || question.toLowerCase().includes('harga')) &&
        (pendingInfo?.origin || pendingInfo?.destination)) {
      const origin = pendingInfo.origin;
      const destination = pendingInfo.destination;

      if (origin && destination) {
        const addition = language === 'en'
          ? `\n\nFor shipments from ${origin} to ${destination}, we can provide specific rate calculations.`
          : `\n\nUntuk penghantaran dari ${origin} ke ${destination}, kami boleh memberikan pengiraan kadar yang spesifik.`;
        answer += addition;
      }
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

    // Add contextual questions based on conversation
    if (recentTopics.includes('weight') || recentTopics.includes('berat')) {
      const weightQuestion = language === 'en'
        ? "What are the weight limits for different services?"
        : "Apa had berat maksimum untuk perkhidmatan yang berbeza?";
      questions.push(weightQuestion);
    }

    if (recentTopics.includes('tracking')) {
      const trackingQuestion = language === 'en'
        ? "How can I track my package?"
        : "Bagaimana saya boleh track bungkusan saya?";
      questions.push(trackingQuestion);
    }

    const pendingInfo = contextualInfo?.pendingInfo as { serviceType?: string } | undefined;
    if (pendingInfo?.serviceType) {
      const service = pendingInfo.serviceType;
      const serviceQuestion = language === 'en'
        ? `More details about ${service} delivery times`
        : `Maklumat lanjut tentang masa penghantaran ${service}`;
      questions.push(serviceQuestion);
    }

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

    const pendingInfo = contextualInfo?.pendingInfo as { serviceType?: string } | undefined;
    if (pendingInfo?.serviceType) {
      const service = pendingInfo.serviceType;
      response += language === 'en'
        ? `I can provide more specific information about ${service}. `
        : `Saya boleh memberikan maklumat lebih spesifik tentang ${service}. `;
    }

    response += language === 'en'
      ? "While I don't have specific information about this in our FAQ database, I can help you with general POS Malaysia services. For more specific information, you can visit www.pos.com.my or call 1-300-300-300."
      : "Walaupun saya tidak mempunyai maklumat spesifik tentang perkara ini dalam pangkalan data FAQ kami, saya boleh membantu anda dengan perkhidmatan POS Malaysia umum. Untuk maklumat lebih spesifik, anda boleh layari www.pos.com.my atau hubungi 1-300-300-300.";

    return response;
  }

  /**
   * Get general response when no FAQ match is found
   */
  private getGeneralResponse(question: string, language: 'en' | 'ms'): string {
    if (language === 'en') {
      return `I understand you're asking about "${question}". While I don't have specific information about this in our FAQ database, I can help you with general POS Malaysia services. 

For more specific information, you can:
- Visit our website at www.pos.com.my
- Contact our customer service at 1-300-300-300
- Visit any POS Malaysia branch

Is there anything else I can help you with regarding our services?`;
    } else {
      return `Saya faham anda bertanya tentang "${question}". Walaupun saya tidak mempunyai maklumat khusus tentang ini dalam pangkalan data FAQ kami, saya boleh membantu anda dengan perkhidmatan POS Malaysia secara umum.

Untuk maklumat yang lebih khusus, anda boleh:
- Layari laman web kami di www.pos.com.my
- Hubungi pusat khidmat pelanggan kami di 1-300-300-300
- Lawati mana-mana cawangan POS Malaysia

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
      return "Handles FAQ and document-based questions about POS Malaysia services, policies, and procedures";
    } else {
      return "Mengendalikan FAQ dan soalan berasaskan dokumen tentang perkhidmatan, polisi, dan prosedur POS Malaysia";
    }
  }
}
