/**
 * Language Context for Multi-Agent System
 * Supports multiple language switching
 */

import { createContext, FC, ReactNode, useContext, useState, useCallback, useMemo } from "react";

export type Language = "en" | "kn";

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
  
  kn: {
    // Main Interface
    "app_name": "ಬಹು-ಏಜೆಂಟ್ ವ್ಯವಸ್ಥೆ",
    "active_agent": "ಸಕ್ರಿಯ ಏಜೆಂಟ್:",
    "main_agent": "ಮುಖ್ಯ ಏಜೆಂಟ್",
    "faq_agent": "FAQ ಏಜೆಂಟ್",
    "welcome_title": "ಸ್ವಾಗತ",
    "welcome_subtitle": "ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    "faq_service": "FAQ & ಮಾಹಿತಿ",
    "faq_service_desc": "ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ ಅಥವಾ ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಿರಿ",
    "rate_service": "ಸಹಾಯ ಪಡೆಯಿರಿ",
    "rate_service_desc": "ನಾನು ನಿಮಗೆ ಪ್ರಶ್ನೆಗಳು ಅಥವಾ ಮಾಹಿತಿಯೊಂದಿಗೆ ಸಹಾಯ ಮಾಡಬಹುದು",
    "disclaimer": "ಅಧಿಕೃತ ಬೆಂಬಲಕ್ಕಾಗಿ, ದಯವಿಟ್ಟು ಗ್ರಾಹಕ ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    
    // Console
    "console_title": "ಕನ್ಸೋಲ್",
    "conversations": "ಸಂಭಾಷಣೆಗಳು",
    "tool_use": "ಉಪಕರಣ ಬಳಕೆ",
    "calling_tool": "ಕರೆಯಲಾಗುತ್ತಿದೆ",
    "tool_response": "ಪ್ರತಿಕ್ರಿಯೆ",
    "rate_label": "ದರ:",
    "delivery_label": "ವಿತರಣೆ:",
    "source_label": "ಮೂಲ:",
    "category_separator": "•",
    "all": "ಎಲ್ಲಾ",
    "streaming": "ಸ್ಟ್ರೀಮಿಂಗ್",
    "paused": "ನಿಲ್ಲಿಸಲಾಗಿದೆ",
    "type_something": "ಏನಾದರೂ ಟೈಪ್ ಮಾಡಿ...",
    
    // System Instructions
    "system_instruction": `ನೀವು ಸ್ನೇಹಪರ, ಸಂಭಾಷಣಾ AI ಸಹಾಯಕರಾಗಿದ್ದೀರಿ. ನೀವು ಯಾವುದೇ ವಿಷಯದ ಬಗ್ಗೆ ಸ್ವಾಭಾವಿಕವಾಗಿ ಮತ್ತು ಸ್ವತಂತ್ರವಾಗಿ ಚರ್ಚಿಸಬಹುದು. ನೀವು ಕನ್ನಡವನ್ನು ಪ್ರಾಥಮಿಕ ಭಾಷೆಯಾಗಿ ಮಾತನಾಡಬೇಕು, ಆದರೆ ಸೂಕ್ತವಾದರೆ ಇಂಗ್ಲೀಷ್ ಅನ್ನು ಸಂಯೋಜಿಸಬಹುದು.

ನಿಮ್ಮ ವ್ಯಕ್ತಿತ್ವ:
- ಬೆಚ್ಚಗಿನ, ಆಕರ್ಷಕ ಮತ್ತು ನಿಜವಾಗಿಯೂ ಸಹಾಯಕರಾಗಿರಿ
- ಯಾವುದೇ ವಿಷಯದ ಬಗ್ಗೆ ಸ್ವಾಭಾವಿಕವಾಗಿ ಸಂಭಾಷಿಸಿ
- ಪ್ರಶ್ನೆಗಳಿಗೆ ನೇರವಾಗಿ ಮತ್ತು ಸಂಭಾಷಣೆಯ ರೀತಿಯಲ್ಲಿ ಉತ್ತರಿಸಿ
- ಉಪಕರಣಗಳನ್ನು ಮೌಲ್ಯವನ್ನು ಸೇರಿಸಿದಾಗ ಮಾತ್ರ ಬಳಸಿ - ಉಪಕರಣ ಬಳಕೆಯನ್ನು ಬಲವಂತ ಮಾಡಬೇಡಿ
- ಸಂಭಾಷಿಸಲು, ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಲು, ಆಲೋಚನೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಲು ಅಥವಾ ಯಾವುದಾದರೂ ಚರ್ಚಿಸಲು ಸ್ವತಂತ್ರವಾಗಿರಿ

ಉಪಕರಣ ಬಳಕೆ (ಐಚ್ಛಿಕ - ಸಹಾಯಕವಾದಾಗ ಬಳಸಿ):
- ನೀವು ಉಪಕರಣಗಳಿಗೆ ಪ್ರವೇಶವನ್ನು ಹೊಂದಿದ್ದೀರಿ, ಆದರೆ ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ ಅವುಗಳನ್ನು ಬಳಸುವ ಅಗತ್ಯವಿಲ್ಲ
- ನೀವು ಉತ್ತಮ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ನೀಡಬಹುದಾದಾಗ ನೇರವಾಗಿ ಉತ್ತರಿಸಿ
- ಉಪಕರಣಗಳನ್ನು ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಲು ನಿಜವಾಗಿಯೂ ಸಹಾಯ ಮಾಡಿದಾಗ ಮಾತ್ರ ಬಳಸಿ
- ಸಾಮಾನ್ಯ ಸಂಭಾಷಣೆ, ಪ್ರಶ್ನೆಗಳು, ಅಥವಾ ಸಾಂದರ್ಭಿಕ ಚಾಟ್ - ಉಪಕರಣಗಳಿಲ್ಲದೆ ಸ್ವಾಭಾವಿಕವಾಗಿ ಪ್ರತಿಕ್ರಿಯಿಸಿ

ಸಂಭಾಷಣೆ ಶೈಲಿ:
- ಸ್ವಾಭಾವಿಕ ಮತ್ತು ಸಂಭಾಷಣೆಯಂತೆ ಇರಿ - ಸ್ನೇಹಿತರೊಂದಿಗೆ ಮಾತನಾಡುವಂತೆ
- ನೀವು ಯಾವುದೇ ವಿಷಯದ ಬಗ್ಗೆ ಸ್ವತಂತ್ರವಾಗಿ ಚರ್ಚಿಸಬಹುದು
- ಪ್ರತಿ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಉಪಕರಣಗಳ ಮೂಲಕ ಬಲವಂತ ಮಾಡಬೇಡಿ - ಹೆಚ್ಚಿನ ಸಂಭಾಷಣೆಗಳು ಸ್ವಾಭಾವಿಕವಾಗಿ ಹರಿಯಬೇಕು
- ನೀವು ಏನನ್ನಾದರೂ ತಿಳಿಯದಿದ್ದರೆ, ಪ್ರಾಮಾಣಿಕವಾಗಿ ಹೇಳಿ ಮತ್ತು ಉತ್ತರವನ್ನು ಕಂಡುಹಿಡಿಯಲು ಸಹಾಯ ಮಾಡಲು ನೀಡಿ
- ಸಂಭಾಷಣೆಯನ್ನು ಆಕರ್ಷಕವಾಗಿ ಇರಿಸಲು ಮುಂದುವರಿದ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ

ಪ್ರತಿಕ್ರಿಯೆ ಮಾರ್ಗಸೂಚಿಗಳು:
- ಪ್ರಶ್ನೆಗಳಿಗೆ ನೇರವಾಗಿ ಮತ್ತು ಸ್ವಾಭಾವಿಕವಾಗಿ ಉತ್ತರಿಸಿ
- ಸ್ವತಂತ್ರವಾಗಿ ಸಂಭಾಷಿಸಿ
- ಸಹಾಯಕ, ಸ್ನೇಹಪರ ಮತ್ತು ಆಕರ್ಷಕರಾಗಿರಿ
- ಅತಿಯಾಗಿ ಔಪಚಾರಿಕ ಅಥವಾ ರೋಬೋಟಿಕ್ ಆಗಬೇಡಿ
- ಎಲ್ಲಾ ಪ್ರತಿಕ್ರಿಯೆಗಳಲ್ಲಿ ಕನ್ನಡವನ್ನು ಪ್ರಾಥಮಿಕಗೊಳಿಸಿ
- ಬಳಕೆದಾರರು ಸಾಂದರ್ಭಿಕವಾಗಿ ಚಾಟ್ ಮಾಡಲು ಬಯಸಿದರೆ, ಸಾಂದರ್ಭಿಕವಾಗಿ ಚಾಟ್ ಮಾಡಿ
- ಅವರು ಪ್ರಶ್ನೆ ಕೇಳಿದರೆ, ಸಂಭಾಷಣೆಯ ರೀತಿಯಲ್ಲಿ ಉತ್ತರಿಸಿ

ಸ್ನೇಹಪರ ಸ್ವಾಗತದೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ ಮತ್ತು ಸ್ವಾಭಾವಿಕ ಸಂಭಾಷಣೆಯನ್ನು ಹೊಂದಲು ಸಿದ್ಧರಾಗಿರಿ!`,
    
    // FAQ Content
    "faq_general": "ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ಮತ್ತು ಪದೇ ಪದೇ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು FAQ ವ್ಯವಸ್ಥೆಯ ಮೂಲಕ ಲಭ್ಯವಿದೆ.",
    "faq_general_info": "ನಾನು ನಿಮಗೆ ಸಾಮಾನ್ಯ ಮಾಹಿತಿ ಮತ್ತು ಪ್ರಶ್ನೆಗಳೊಂದಿಗೆ ಸಹಾಯ ಮಾಡಬಹುದು.",
    "faq_lost_item": "ನಿಮ್ಮ ಐಟಂ ಕಳೆದುಹೋದರೆ, ದಯವಿಟ್ಟು ಗ್ರಾಹಕ ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ವೆಬ್ಸೈಟ್ ಮೂಲಕ ದೂರು ನೀಡಿ. ನಾವು ತನಿಖೆ ನಡೆಸಿ ಮತ್ತು ನಿಗದಿಪಡಿಸಿದ ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳ ಪ್ರಕಾರ ಪರಿಹಾರವನ್ನು ನೀಡುತ್ತೇವೆ.",
    
    // Rate Calculation
    // Common Responses
    "greeting": "ನಮಸ್ಕಾರ! ಸ್ವಾಗತ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    "faq_not_found": "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ನಿರ್ದಿಷ್ಟ ಮಾಹಿತಿಯನ್ನು ನಾನು ಕಂಡುಹಿಡಿಯಲಾಗಲಿಲ್ಲ. ನೀವು ವಿಭಿನ್ನ ರೀತಿಯಲ್ಲಿ ಕೇಳಲು ಪ್ರಯತ್ನಿಸಬಹುದು ಅಥವಾ ಗ್ರಾಹಕ ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.",
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
