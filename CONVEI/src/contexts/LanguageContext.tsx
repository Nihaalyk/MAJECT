/**
 * Language Context for Multi-Agent System
 * Supports multiple language switching
 */

import { createContext, FC, ReactNode, useContext, useState, useCallback, useMemo } from "react";

export type Language = "en" | "ms";

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations = {
  en: {
    // Main Interface
    "app_name": "Multi-Agent System",
    "active_agent": "Active Agent:",
    "main_agent": "Main Agent",
    "faq_agent": "FAQ Agent",
    "welcome_title": "Welcome",
    "welcome_subtitle": "How can I help you today?",
    "faq_service": "FAQ & Information",
    "faq_service_desc": "Ask questions or get information",
    "rate_service": "Get Help",
    "rate_service_desc": "I can help you with questions or information",
    "disclaimer": "For official support, please contact customer service.",
    
    // Console
    "console_title": "Console",
    "conversations": "Conversations",
    "tool_use": "Tool Use",
    "calling_tool": "Calling",
    "tool_response": "Response",
    "rate_label": "Rate:",
    "delivery_label": "Delivery:",
    "source_label": "Source:",
    "category_separator": "•", 
    "all": "All",
    "streaming": "Streaming",
    "paused": "Paused",
    "type_something": "Type something...",
    
    // System Instructions
    "system_instruction": `You are a friendly, conversational AI assistant. You can discuss any topic naturally and freely. You MUST speak ONLY in English.

YOUR PERSONALITY:
- Be warm, engaging, and genuinely helpful
- Have natural conversations about any topic
- Answer questions directly and conversationally
- Use tools only when they add value - don't force tool usage
- Feel free to chat, ask questions, share thoughts, or discuss anything

TOOL USAGE (OPTIONAL - use when helpful):
- You have access to tools, but you don't need to use them for every question
- Answer directly when you can provide a good response
- Use tools only when they genuinely help answer the question
- For general conversation, questions, or casual chat - just respond naturally without tools

CONVERSATION STYLE:
- Be natural and conversational - like talking to a friend
- You can discuss any topic freely
- Don't force every response through tools - most conversations should flow naturally
- If you don't know something, say so honestly and offer to help find the answer
- Ask follow-up questions to keep the conversation engaging

RESPONSE GUIDELINES:
- Answer questions directly and naturally
- Have free-flowing conversations
- Be helpful, friendly, and engaging
- Don't be overly formal or robotic
- Use ONLY English in all responses
- If the user wants to chat casually, chat casually
- If they ask a question, answer it conversationally

Start with a friendly greeting and be ready to have a natural conversation!`,
    
    // FAQ Content
    "faq_general": "General information and frequently asked questions are available through the FAQ system.",
    "faq_general_info": "I can help you with general information and questions.",
    "faq_lost_item": "If your item is lost, please contact customer service or file a complaint through the website. We will investigate and provide compensation according to the terms and conditions set.",
    
    // Rate Calculation
    // Common Responses
    "greeting": "Hello! Welcome. How can I assist you today?",
    "faq_not_found": "Sorry, I couldn't find specific information for your question. Could you try asking in a different way or contact customer service.",
  },
  
  ms: {
    // Main Interface
    "app_name": "Sistem Multi-Agen",
    "active_agent": "Agen Aktif:",
    "main_agent": "Main Agent",
    "faq_agent": "FAQ Agent",
    "welcome_title": "Selamat Datang",
    "welcome_subtitle": "Bagaimana saya boleh membantu anda hari ini?",
    "faq_service": "FAQ & Maklumat",
    "faq_service_desc": "Tanya soalan atau dapatkan maklumat",
    "rate_service": "Dapatkan Bantuan",
    "rate_service_desc": "Saya boleh membantu anda dengan soalan atau maklumat",
    "disclaimer": "Untuk sokongan rasmi, sila hubungi khidmat pelanggan.",
    
    // Console
    "console_title": "Console",
    "conversations": "Perbualan",
    "tool_use": "Penggunaan Alat",
    "calling_tool": "Memanggil",
    "tool_response": "Respons",
    "rate_label": "Kadar:",
    "delivery_label": "Penghantaran:",
    "source_label": "Sumber:",
    "category_separator": "•",
    "all": "Semua", 
    "streaming": "Menghantar",
    "paused": "Berhenti",
    "type_something": "Taip sesuatu...",
    
    // System Instructions
    "system_instruction": `Anda adalah pembantu AI yang mesra dan perbualan. Anda boleh berbincang tentang apa-apa topik secara semula jadi dan bebas. Anda MESTI bercakap dalam Bahasa Melayu sebagai bahasa utama, tetapi boleh menggabungkan Bahasa Inggeris jika sesuai.

PERSONALITI ANDA:
- Jadilah mesra, menarik, dan benar-benar membantu
- Berbual secara semula jadi tentang apa-apa topik
- Jawab soalan secara langsung dan perbualan
- Gunakan alat hanya apabila ia menambah nilai - jangan paksa penggunaan alat
- Bebas untuk berbual, bertanya soalan, berkongsi pendapat, atau berbincang tentang apa sahaja

PENGGUNAAN ALAT (PILIHAN - gunakan apabila membantu):
- Anda mempunyai akses kepada alat, tetapi anda tidak perlu menggunakannya untuk setiap soalan
- Jawab terus apabila anda boleh memberikan respons yang baik
- Gunakan alat hanya apabila ia benar-benar membantu menjawab soalan
- Untuk perbualan umum, soalan, atau sembang santai - hanya respons secara semula jadi tanpa alat

GAYA PERBUALAN:
- Jadilah semula jadi dan perbualan - seperti bercakap dengan kawan
- Anda boleh berbincang tentang apa-apa topik secara bebas
- Jangan paksa setiap respons melalui alat - kebanyakan perbualan harus mengalir secara semula jadi
- Jika anda tidak tahu sesuatu, katakan dengan jujur dan tawarkan untuk membantu mencari jawapan
- Tanya soalan susulan untuk mengekalkan perbualan yang menarik

GARIS PANDUAN RESPONS:
- Jawab soalan secara langsung dan semula jadi
- Berbual dengan bebas
- Jadilah membantu, mesra, dan menarik
- Jangan terlalu formal atau robotik
- Utamakan Bahasa Melayu dalam semua respons
- Jika pengguna mahu berbual secara santai, berbual secara santai
- Jika mereka bertanya soalan, jawab secara perbualan

Mulakan dengan salam mesra dan bersedia untuk mempunyai perbualan semula jadi!`,
    
    // FAQ Content
    "faq_general": "Maklumat umum dan soalan lazim tersedia melalui sistem FAQ.",
    "faq_general_info": "Saya boleh membantu anda dengan maklumat umum dan soalan.",
    "faq_lost_item": "Jika item anda hilang, sila hubungi khidmat pelanggan atau buat aduan melalui laman web. Kami akan menyiasat dan memberikan ganti rugi mengikut terma dan syarat yang ditetapkan.",
    
    // Rate Calculation
    // Common Responses
    "greeting": "Selamat datang! Bagaimana saya boleh membantu anda hari ini?",
    "faq_not_found": "Maaf, saya tidak dapat mencari maklumat yang tepat untuk soalan anda. Boleh anda cuba tanya dengan cara yang berbeza atau hubungi khidmat pelanggan.",
  }
};

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("en");

  // Memoize the current translations to avoid object recreation
  const currentTranslations = useMemo(() => translations[language], [language]);

  // Memoize the translation function to prevent recreation on every render
  const t = useCallback((key: string): string => {
    return currentTranslations[key as keyof typeof currentTranslations] || key;
  }, [currentTranslations]);

  // Memoize the setLanguage function
  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    language,
    setLanguage: handleSetLanguage,
    t,
  }), [language, handleSetLanguage, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
