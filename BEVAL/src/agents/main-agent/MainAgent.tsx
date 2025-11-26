/**
 * Main Agent - Orchestrates all interactions and routes to specialized agents
 */

import { FunctionDeclaration, Type } from "@google/genai";
import { ConversationMemory } from "../../contexts/ConversationMemoryContext";

export interface MainAgentConfig {
  language: 'en' | 'ms';
  memory: ConversationMemory;
}

export class MainAgent {
  private config: MainAgentConfig;

  constructor(config: MainAgentConfig) {
    this.config = config;
  }

  /**
   * Get system instruction for the main agent
   */
  getSystemInstruction(): string {
    const { language, memory } = this.config;
    
    if (language === 'en') {
      return `You are a helpful POS Malaysia assistant. You MUST speak ONLY in English. Never mix languages in your responses.

CORE BEHAVIOR:
- Be proactive and anticipate user needs
- Provide quick, accurate responses without unnecessary confirmations
- Use conversation memory to provide contextual responses
- Route user inquiries to specialized agents efficiently
- ALWAYS respond in English - never use Malay words or phrases

CONVERSATION MEMORY:
${this.formatMemoryContext(memory)}

INTENT ROUTING:
- For general service overview questions (keywords: "services", "what do you offer", "what do you provide", "service types", "kinds of services", "what services") → Route to FAQ Agent for comprehensive overview
- For specific questions about 'what is', 'can I', 'how to', 'why', 'FAQ', 'manual', 'package' → Route to FAQ Agent
- For questions about 'rate', 'price', 'cost', 'send', 'weight', 'post' → Route to Rate Calculator Agent

SERVICE OVERVIEW (when asked about services):
POS Malaysia offers comprehensive postal and delivery services:

DOMESTIC SERVICES:
• Pos Laju: Express delivery (1-2 working days) with full tracking
• Pos Biasa: Standard delivery (3-5 working days) for light packages
• Pos Ekspres: Same-day delivery for certain urban areas
• Economy: Budget-friendly delivery (5-7 working days)

INTERNATIONAL SERVICES:
• Express Mail Service (EMS): Fast international delivery (3-7 working days)
• International Surface Air Lift (ISAL): Cost-effective international delivery
• Airmail: Standard international mail service

SPECIALIZED SERVICES:
• Registered Mail: With proof of delivery
• COD (Cash on Delivery): Recipient pays upon delivery
• Insurance: Package protection up to RM10,000
• Pickup Service: Courier collects from your location
• Islamic Services: Shariah-compliant delivery options

ADDITIONAL FEATURES:
• Real-time tracking for all services
• Online booking and payment
• Mobile app for easy access
• Corporate accounts with discounts
• Customs clearance for international shipments

RESPONSE STYLE:
- Be conversational and helpful
- Anticipate follow-up questions
- Use memory to avoid asking for information already provided
- Provide immediate, actionable responses
- Use ONLY English in all responses

LANGUAGE CONSISTENCY:
- If user speaks in English, respond in English
- If user speaks in Malay, acknowledge but respond in English
- Never use Malay words like "hari bekerja", "bungkusan", "penghantaran" etc.
- Always use English equivalents: "working days", "package", "delivery" etc.
- If user requests to switch to Malay, acknowledge but continue in English unless explicitly told to switch language mode

EXAMPLE INTERACTIONS:
User: "What's the price to send a package to Johor?"
You: "I'll calculate the postage rate for you. What's the weight of the package and where are you sending it from?"

User: "1kg from KL"
You: "For a 1kg package from KL to Johor using Pos Laju, the rate is RM 9.75 with 1-2 working days delivery. Would you like to know about other service options?"`;
    } else {
      return `Anda adalah pembantu POS Malaysia yang berguna. Anda MESTI bercakap dalam Bahasa Melayu sebagai bahasa utama, tetapi boleh menggabungkan Bahasa Inggeris jika sesuai.

PERILAKU UTAMA:
- Proaktif dan jangka keperluan pengguna
- Berikan respons yang pantas dan tepat tanpa pengesahan yang tidak perlu
- Gunakan ingatan perbualan untuk memberikan respons kontekstual
- Hantar pertanyaan pengguna kepada ejen khusus dengan cekap
- Utamakan Bahasa Melayu dalam semua respons

INGATAN PERBUALAN:
${this.formatMemoryContext(memory)}

PENGHANTARAN NIAT:
- Untuk soalan umum tentang perkhidmatan (kata kunci: "perkhidmatan", "apa yang anda tawarkan", "apa yang anda berikan", "jenis perkhidmatan", "macam-macam perkhidmatan") → Hantar kepada Ejen FAQ untuk gambaran keseluruhan yang menyeluruh
- Untuk soalan khusus tentang 'apa itu', 'boleh ke', 'macam mana', 'kenapa', 'FAQ', 'manual', 'bungkusan' → Hantar kepada Ejen FAQ
- Untuk soalan tentang 'kadar', 'harga', 'caj', 'hantar', 'berat', 'pos' → Hantar kepada Ejen Kira Kadar Pos

GAMBARAN PERKHIDMATAN (apabila ditanya tentang perkhidmatan):
POS Malaysia menawarkan perkhidmatan pos dan penghantaran yang menyeluruh:

PERKHIDMATAN DALAMAN:
• Pos Laju: Penghantaran ekspres (1-2 hari bekerja) dengan jejak penuh
• Pos Biasa: Penghantaran standard (3-5 hari bekerja) untuk bungkusan ringan
• Pos Ekspres: Penghantaran hari sama untuk kawasan bandar tertentu
• Economy: Penghantaran bajet mesra (5-7 hari bekerja)

PERKHIDMATAN ANTARABANGSA:
• Express Mail Service (EMS): Penghantaran antarabangsa pantas (3-7 hari bekerja)
• International Surface Air Lift (ISAL): Penghantaran antarabangsa kos efektif
• Airmail: Perkhidmatan mel antarabangsa standard

PERKHIDMATAN KHUSUS:
• Mel Berdaftar: Dengan bukti penghantaran
• COD (Bayar Semasa Penghantaran): Penerima bayar semasa penghantaran
• Insurans: Perlindungan bungkusan sehingga RM10,000
• Perkhidmatan Pickup: Kurier mengambil dari lokasi anda
• Perkhidmatan Islamic: Pilihan penghantaran patuh Syariah

CIRI TAMBAHAN:
• Jejak masa nyata untuk semua perkhidmatan
• Tempahan dan pembayaran dalam talian
• Aplikasi mudah alih untuk akses mudah
• Akaun korporat dengan diskaun
• Pembersihan kastam untuk penghantaran antarabangsa

GAYA RESPONS:
- Bercakap secara perbualan dan membantu
- Jangka soalan susulan
- Gunakan ingatan untuk mengelakkan bertanya maklumat yang sudah diberikan
- Berikan respons yang segera dan boleh diambil tindakan

CONTOH INTERAKSI:
Pengguna: "Berapa harga hantar bungkusan ke Johor?"
Anda: "Saya akan kira kadar pos untuk anda. Berapa berat bungkusan dan dari mana anda hantar?"

Pengguna: "1kg dari KL"
Anda: "Untuk bungkusan 1kg dari KL ke Johor menggunakan Pos Laju, kadarnya adalah RM 9.75 dengan penghantaran 1-2 hari bekerja. Adakah anda ingin tahu tentang pilihan perkhidmatan lain?"`;
    }
  }

  /**
   * Get function declarations for the main agent
   */
  getFunctionDeclarations(): FunctionDeclaration[] {
    const { language } = this.config;
    
    return [
      {
        name: "handle_faq_inquiry",
        description: language === "en"
          ? "Handles FAQ and document-based questions about POS Malaysia services, policies, and procedures. Also provides comprehensive service overviews. Use this for questions about 'what is', 'can I', 'how to', 'why', 'services', 'what do you offer', 'FAQ', 'manual', 'package'."
          : "Handles FAQ and document-based questions about POS Malaysia services, policies, and procedures. Also provides comprehensive service overviews. Use this for questions about 'apa itu', 'boleh ke', 'macam mana', 'kenapa', 'perkhidmatan', 'apa yang anda tawarkan', 'FAQ', 'manual', 'bungkusan'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: language === "en" 
                ? "The user's question about POS Malaysia services, policies, or procedures."
                : "Pertanyaan pengguna tentang perkhidmatan, polisi, atau prosedur POS Malaysia.",
            },
            context: {
              type: Type.STRING,
              description: language === "en" 
                ? "Additional context about the user's inquiry."
                : "Konteks tambahan tentang pertanyaan pengguna.",
            },
          },
          required: ["question"],
        },
      },
      {
        name: "calculate_postage_rate",
        description: language === "en"
          ? "Calculates postage rates for POS Malaysia services. Use this for questions about 'rate', 'price', 'cost', 'send', 'weight', 'post'."
          : "Calculates postage rates for POS Malaysia services. Use this for questions about 'rate', 'harga', 'caj', 'hantar', 'berat', 'pos'.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            origin: {
              type: Type.STRING,
              description: language === "en" 
                ? "Origin location (city/state) for the package."
                : "Lokasi asal (bandar/negeri) untuk bungkusan.",
            },
            destination: {
              type: Type.STRING,
              description: language === "en"
                ? "Destination location (city/state) for the package."
                : "Lokasi destinasi (bandar/negeri) untuk bungkusan.",
            },
            weight: {
              type: Type.STRING,
              description: language === "en"
                ? "Weight of the package in grams or kg."
                : "Berat bungkusan dalam gram atau kg.",
            },
            service_type: {
              type: Type.STRING,
              description: language === "en"
                ? "Type of postal service. Options: 'Economy' (cheapest, 5-7 days), 'Pos Laju' (standard, 1-2 days), 'Express' (fastest, same day), 'Islamic' (halal certified, 1-2 days), 'Pos Ekspres' (1 day), 'Pos Biasa' (regular, 3-5 days)."
                : "Jenis perkhidmatan pos. Pilihan: 'Economy' (termurah, 5-7 hari), 'Pos Laju' (standard, 1-2 hari), 'Express' (terpantas, hari sama), 'Islamic' (bersijil halal, 1-2 hari), 'Pos Ekspres' (1 hari), 'Pos Biasa' (biasa, 3-5 hari).",
              enum: ["Economy", "Pos Laju", "Express", "Islamic", "Pos Ekspres", "Pos Biasa"],
            },
            package_type: {
              type: Type.STRING,
              description: language === "en"
                ? "Type of package (e.g., 'document', 'parcel', 'registered')."
                : "Jenis bungkusan (cth: 'dokumen', 'parcel', 'registered').",
            },
          },
          required: ["origin", "destination", "weight"],
        },
      },
      {
        name: "switch_language_mode",
        description: language === "en"
          ? "Switch the system language mode between English and Malay based on user request."
          : "Tukar mod bahasa sistem antara Bahasa Inggeris dan Bahasa Melayu berdasarkan permintaan pengguna.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            target_language: {
              type: Type.STRING,
              description: language === "en"
                ? "Target language to switch to (en or ms)."
                : "Bahasa sasaran untuk ditukar (en atau ms).",
              enum: ["en", "ms"],
            },
            reason: {
              type: Type.STRING,
              description: language === "en"
                ? "Reason for language switch request."
                : "Sebab permintaan tukar bahasa.",
            },
          },
          required: ["target_language"],
        },
      },
    ];
  }

  /**
   * Format memory context for system instruction
   */
  private formatMemoryContext(memory: ConversationMemory): string {
    const { currentContext, userPreferences } = memory;
    
    let context = `Recent conversation history:\n`;
    
    if (currentContext.conversationHistory.length > 0) {
      currentContext.conversationHistory.slice(-3).forEach((entry, index) => {
        context += `${index + 1}. User: "${entry.userInput}"\n   Response: "${entry.agentResponse}"\n`;
      });
    }
    
    if (currentContext.pendingInfo.origin || currentContext.pendingInfo.destination) {
      context += `\nPending information:\n`;
      if (currentContext.pendingInfo.origin) context += `- Origin: ${currentContext.pendingInfo.origin}\n`;
      if (currentContext.pendingInfo.destination) context += `- Destination: ${currentContext.pendingInfo.destination}\n`;
      if (currentContext.pendingInfo.weight) context += `- Weight: ${currentContext.pendingInfo.weight}\n`;
      if (currentContext.pendingInfo.serviceType) context += `- Service: ${currentContext.pendingInfo.serviceType}\n`;
    }
    
    context += `\nUser preferences:\n`;
    context += `- Preferred language: ${userPreferences.preferredLanguage}\n`;
    context += `- Default service: ${userPreferences.defaultService}\n`;
    if (userPreferences.lastUsedOrigin) context += `- Last used origin: ${userPreferences.lastUsedOrigin}\n`;
    if (userPreferences.lastUsedDestination) context += `- Last used destination: ${userPreferences.lastUsedDestination}\n`;
    
    return context;
  }

  /**
   * Get welcome message
   */
  getWelcomeMessage(): { title: string; subtitle: string } {
    const { language } = this.config;
    
    if (language === 'en') {
      return {
        title: "Self Service for Your Post",
        subtitle: "How can I help you today? Ask me about our services or calculate postage rates."
      };
    } else {
      return {
        title: "Perkhidmatan Kendiri untuk Pos Anda",
        subtitle: "Bagaimana saya boleh membantu anda hari ini? Tanya saya tentang perkhidmatan kami atau kira kadar pos."
      };
    }
  }

  /**
   * Get service options
   */
  getServiceOptions(): Array<{ title: string; description: string }> {
    const { language } = this.config;
    
    if (language === 'en') {
      return [
        {
          title: "FAQ & Information",
          description: "Ask about services, policies, and procedures"
        },
        {
          title: "Calculate Postage Rates",
          description: "Get shipping cost estimates for your packages"
        }
      ];
    } else {
      return [
        {
          title: "FAQ & Maklumat",
          description: "Tanya tentang perkhidmatan, polisi, dan prosedur"
        },
        {
          title: "Kira Kadar Pos",
          description: "Dapatkan anggaran kos penghantaran untuk bungkusan anda"
        }
      ];
    }
  }
}
