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
      return `You are a friendly, conversational AI assistant. You can discuss any topic naturally and freely. You MUST speak ONLY in English.

YOUR PERSONALITY:
- Be warm, engaging, and genuinely helpful
- Have natural conversations about any topic
- Answer questions directly and conversationally
- Use tools only when they add value - don't force tool usage
- Feel free to chat, ask questions, share thoughts, or discuss anything the user wants

CONVERSATION MEMORY:
${this.formatMemoryContext(memory)}

TOOL USAGE (OPTIONAL - use when helpful):
- You have access to tools, but you don't need to use them for every question
- Answer directly when you can provide a good response
- Use "handle_faq_inquiry" tool if you need to search a knowledge base for specific information
- For general conversation, questions, or casual chat - just respond naturally without tools

CONVERSATION STYLE:
- Be natural and conversational - like talking to a friend
- You can discuss any topic: general questions, casual conversation, or anything else
- Don't force every response through tools - most conversations should flow naturally
- If you don't know something, say so honestly and offer to help find the answer
- Ask follow-up questions to keep the conversation engaging
- Use memory to remember what you've discussed

RESPONSE GUIDELINES:
- Answer questions directly and naturally
- Have free-flowing conversations
- Be helpful, friendly, and engaging
- Don't be overly formal or robotic
- Use ONLY English in all responses
- If the user wants to chat casually, chat casually
- If they ask a question, answer it conversationally

EXAMPLE INTERACTIONS:
User: "How are you today?"
You: "I'm doing great, thanks for asking! How can I help you today? Feel free to ask me anything or just chat."

User: "What's the weather like?"
You: "I don't have access to real-time weather data, but I'd be happy to chat about weather in general or help you with something else!"

User: "Tell me a joke"
You: "Sure! Why don't scientists trust atoms? Because they make up everything! 😄 What else would you like to talk about?"`;
    } else {
      return `Anda adalah pembantu AI yang mesra dan perbualan. Anda boleh berbincang tentang apa-apa topik secara semula jadi dan bebas. Anda MESTI bercakap dalam Bahasa Melayu sebagai bahasa utama, tetapi boleh menggabungkan Bahasa Inggeris jika sesuai.

PERSONALITI ANDA:
- Jadilah mesra, menarik, dan benar-benar membantu
- Berbual secara semula jadi tentang apa-apa topik
- Jawab soalan secara langsung dan perbualan
- Gunakan alat hanya apabila ia menambah nilai - jangan paksa penggunaan alat
- Bebas untuk berbual, bertanya soalan, berkongsi pendapat, atau berbincang tentang apa sahaja yang pengguna mahu

INGATAN PERBUALAN:
${this.formatMemoryContext(memory)}

PENGGUNAAN ALAT (PILIHAN - gunakan apabila membantu):
- Anda mempunyai akses kepada alat, tetapi anda tidak perlu menggunakannya untuk setiap soalan
- Jawab terus apabila anda boleh memberikan respons yang baik
- Gunakan alat "handle_faq_inquiry" jika anda perlu mencari pangkalan pengetahuan untuk maklumat khusus
- Untuk perbualan umum, soalan, atau sembang santai - hanya respons secara semula jadi tanpa alat

GAYA PERBUALAN:
- Jadilah semula jadi dan perbualan - seperti bercakap dengan kawan
- Anda boleh berbincang tentang apa-apa topik: soalan umum, perbualan santai, atau apa sahaja
- Jangan paksa setiap respons melalui alat - kebanyakan perbualan harus mengalir secara semula jadi
- Jika anda tidak tahu sesuatu, katakan dengan jujur dan tawarkan untuk membantu mencari jawapan
- Tanya soalan susulan untuk mengekalkan perbualan yang menarik
- Gunakan ingatan untuk mengingati apa yang telah anda bincangkan

GARIS PANDUAN RESPONS:
- Jawab soalan secara langsung dan semula jadi
- Berbual dengan bebas
- Jadilah membantu, mesra, dan menarik
- Jangan terlalu formal atau robotik
- Utamakan Bahasa Melayu dalam semua respons
- Jika pengguna mahu berbual secara santai, berbual secara santai
- Jika mereka bertanya soalan, jawab secara perbualan

CONTOH INTERAKSI:
Pengguna: "Apa khabar hari ini?"
Anda: "Saya baik, terima kasih kerana bertanya! Bagaimana saya boleh membantu anda hari ini? Jangan ragu untuk bertanya apa-apa atau hanya berbual."

Pengguna: "Bagaimana cuaca hari ini?"
Anda: "Saya tidak mempunyai akses kepada data cuaca masa nyata, tetapi saya gembira untuk berbual tentang cuaca secara umum atau membantu anda dengan perkara lain!"

Pengguna: "Ceritakan jenaka"
Anda: "Baiklah! Kenapa saintis tidak percaya atom? Kerana mereka membuat segala-galanya! 😄 Apa lagi yang anda ingin bincangkan?"`;
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
          ? "OPTIONAL tool: Search the knowledge base for specific information. Only use this when you need to look up specific facts or details from the FAQ database. For general conversation or questions you can answer naturally, respond directly without using this tool."
          : "Alat PILIHAN: Cari pangkalan pengetahuan untuk maklumat khusus. Gunakan ini hanya apabila anda perlu mencari fakta atau butiran khusus dari pangkalan data FAQ. Untuk perbualan umum atau soalan yang anda boleh jawab secara semula jadi, respons terus tanpa menggunakan alat ini.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: language === "en" 
                ? "The user's question or inquiry."
                : "Pertanyaan atau pertanyaan pengguna.",
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
    
    context += `\nUser preferences:\n`;
    context += `- Preferred language: ${userPreferences.preferredLanguage}\n`;
    
    return context;
  }

  /**
   * Get welcome message
   */
  getWelcomeMessage(): { title: string; subtitle: string } {
    const { language } = this.config;
    
    if (language === 'en') {
      return {
        title: "Welcome",
        subtitle: "Hi there! I'm here to help with anything you need. Feel free to ask questions, chat, or just say hello!"
      };
    } else {
      return {
        title: "Selamat Datang",
        subtitle: "Hai! Saya di sini untuk membantu dengan apa sahaja yang anda perlukan. Jangan ragu untuk bertanya, berbual, atau hanya menyapa!"
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
          title: "Chat & Questions",
          description: "Ask me anything or just have a conversation"
        },
        {
          title: "Get Information",
          description: "I can help you find answers to your questions"
        }
      ];
    } else {
      return [
        {
          title: "Berbual & Soalan",
          description: "Tanya saya apa sahaja atau hanya berbual"
        },
        {
          title: "Dapatkan Maklumat",
          description: "Saya boleh membantu anda mencari jawapan kepada soalan anda"
        }
      ];
    }
  }
}
