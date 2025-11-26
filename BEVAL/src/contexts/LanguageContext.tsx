/**
 * Language Context for POS Malaysia Multi-Agent System
 * Supports English and Malay language switching
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
    "pos_malaysia": "POS Malaysia",
    "active_agent": "Active Agent:",
    "main_agent": "Main Agent",
    "faq_agent": "FAQ Agent",
    "rate_calculator_agent": "Rate Calculator Agent",
    "welcome_title": "Welcome to POS Malaysia",
    "welcome_subtitle": "How can I help you today?",
    "faq_service": "FAQ & Information",
    "faq_service_desc": "Ask about services, policies, and POS Malaysia procedures",
    "rate_service": "Calculate Postage Rates",
    "rate_service_desc": "Get shipping cost estimates for your packages",
    "disclaimer": "For official POS Malaysia services, visit www.pos.com.my or call 1-300-300-300.",
    
    // Console
    "console_title": "Console",
    "conversations": "Conversations",
    "tool_use": "Tool Use",
    "calling_tool": "Calling",
    "tool_response": "Response",
    "service_label": "Service:",
    "rate_label": "Rate:",
    "delivery_label": "Delivery:",
    "source_label": "Source:",
    "category_separator": "•", 
    "all": "All",
    "streaming": "Streaming",
    "paused": "Paused",
    "type_something": "Type something...",
    
    // System Instructions
    "system_instruction": `You are a POS Malaysia assistant who speaks ONLY English. You are the main agent that manages all customer inquiries about POS Malaysia services.

YOUR ROLE:
- Speak in natural and friendly English ONLY
- Route inquiries to the appropriate agent
- Ensure all responses flow through you for consistency
- NEVER mix languages - use only English words and phrases

AGENT ROUTING:
1. For FAQ, manual, or general information questions (keywords: "what is", "can I", "how to", "why", "FAQ", "manual", "package") → call "handle_faq_inquiry"
2. For postage rate calculations (keywords: "rate", "price", "cost", "send", "weight", "post") → call "calculate_postage_rate"

RULES:
- Always speak in English - never use Malay words like "hari bekerja", "bungkusan", "penghantaran"
- Use English equivalents: "working days", "package", "delivery"
- If information is incomplete, ask follow-up questions to get required information
- Give natural responses, not technical or JSON-like
- If sub-agent gives incomplete results, ask for additional information and try again
- Provide accurate and helpful information about POS Malaysia services

LANGUAGE CONSISTENCY:
- If user speaks in English, respond in English
- If user speaks in Malay, acknowledge but respond in English
- Never use mixed language responses
- Always use English terms for delivery times, package types, etc.

EXAMPLE CONVERSATION:
User: "What's the price to send a package to Johor?"
You: "I'll help you calculate the postage rate. Can you tell me the weight of the package and what service you'd like?"

Start with a friendly greeting and ask how you can help them today.`,
    
    // FAQ Content
    "faq_pos_laju": "Pos Laju is POS Malaysia's express delivery service that offers fast and secure delivery for documents and packages throughout Malaysia and internationally. This service uses an advanced tracking system to monitor your package's journey.",
    "faq_delivery_time": "Pos Laju domestic delivery typically takes 1-2 working days, while international delivery depends on the destination, usually 3-7 working days. Delivery times may vary by location and season.",
    "faq_food_shipping": "Yes, food can be sent through the mail provided it's properly packaged and complies with food safety regulations. Perishable foods are not recommended.",
    "faq_tracking": "You can track your package using the tracking number provided. Visit the POS Malaysia website or use the POS Malaysia mobile app.",
    "faq_weight_limit": "Pos Biasa can send packages up to 2kg for domestic and 1kg for international. For heavier packages, use Pos Laju or Pos Ekspres which can send up to 30kg.",
    "faq_lost_package": "If your package is lost, please contact POS Malaysia customer service at 1-300-300-300 or file a complaint through the website. We will investigate and provide compensation according to the terms and conditions set.",
    
    // Rate Calculation
    "rate_calculation": "Postage rate for {service} from {origin} to {destination} ({weight}) is RM{rate}. Estimated delivery time: {delivery}.",
    "missing_info": "I need the following information to calculate the postage rate: {fields}. Can you provide this information?",
    "rate_breakdown": "Rate breakdown: Base rate RM{base}, Weight surcharge RM{weight}, Zone surcharge RM{zone}, Total RM{total}",
    
    // Common Responses
    "greeting": "Hello! Welcome to POS Malaysia. How can I assist you today?",
    "faq_not_found": "Sorry, I couldn't find specific information for your question. Could you try asking in a different way or contact POS Malaysia customer service at 1-300-300-300.",
    "rate_success": "Here's your postage rate calculation:",
    "rate_incomplete": "I need more information to calculate the rate. Please provide:",
  },
  
  ms: {
    // Main Interface
    "pos_malaysia": "POS Malaysia",
    "active_agent": "Agen Aktif:",
    "main_agent": "Main Agent",
    "faq_agent": "FAQ Agent",
    "rate_calculator_agent": "Rate Calculator Agent",
    "welcome_title": "Selamat Datang ke POS Malaysia",
    "welcome_subtitle": "Bagaimana saya boleh membantu anda hari ini?",
    "faq_service": "FAQ & Maklumat",
    "faq_service_desc": "Tanya tentang perkhidmatan, polisi, dan prosedur POS Malaysia",
    "rate_service": "Kira Kadar Pos",
    "rate_service_desc": "Dapatkan anggaran kos penghantaran untuk bungkusan anda",
    "disclaimer": "Untuk perkhidmatan POS Malaysia rasmi, layari www.pos.com.my atau hubungi 1-300-300-300.",
    
    // Console
    "console_title": "Console",
    "conversations": "Perbualan",
    "tool_use": "Penggunaan Alat",
    "calling_tool": "Memanggil",
    "tool_response": "Respons",
    "service_label": "Perkhidmatan:",
    "rate_label": "Kadar:",
    "delivery_label": "Penghantaran:",
    "source_label": "Sumber:",
    "category_separator": "•",
    "all": "Semua", 
    "streaming": "Menghantar",
    "paused": "Berhenti",
    "type_something": "Taip sesuatu...",
    
    // System Instructions
    "system_instruction": `Anda adalah pembantu POS Malaysia yang berbahasa Melayu. Anda adalah agen utama yang menguruskan semua pertanyaan pelanggan tentang perkhidmatan POS Malaysia.

PERANAN ANDA:
- Bercakap dalam Bahasa Melayu yang natural dan mesra
- Mengarahkan pertanyaan kepada agen yang sesuai
- Memastikan semua respons mengalir melalui anda untuk konsistensi

PENGARAHAN AGEN:
1. Untuk pertanyaan FAQ, manual, atau maklumat umum (kata kunci: "apa itu", "boleh ke", "macam mana", "kenapa", "FAQ", "manual", "bungkusan") → panggil "handle_faq_inquiry"
2. Untuk pengiraan kadar pos (kata kunci: "rate", "harga", "caj", "hantar", "berat", "pos") → panggil "calculate_postage_rate"

PERATURAN:
- Sentiasa bercakap dalam Bahasa Melayu
- Jika maklumat tidak lengkap, tanya soalan susulan untuk mendapatkan maklumat yang diperlukan
- Berikan respons yang natural, bukan teknikal atau seperti JSON
- Jika agen sub memberikan hasil yang tidak lengkap, tanya maklumat tambahan dan cuba lagi
- Berikan maklumat yang tepat dan berguna tentang perkhidmatan POS Malaysia

CONTOH PERBUALAN:
User: "Berapa harga hantar bungkusan ke Johor?"
Anda: "Baik, saya akan bantu anda kira kadar pos. Boleh beritahu saya berat bungkusan dan jenis perkhidmatan yang anda mahu?"

Mulakan dengan salam mesra dan tanya bagaimana anda boleh membantu mereka hari ini.`,
    
    // FAQ Content
    "faq_pos_laju": "Pos Laju adalah perkhidmatan penghantaran ekspres POS Malaysia yang menawarkan penghantaran pantas dan selamat untuk dokumen dan bungkusan di seluruh Malaysia dan antarabangsa. Perkhidmatan ini menggunakan sistem tracking yang canggih untuk memantau perjalanan bungkusan anda.",
    "faq_delivery_time": "Pos Laju domestik biasanya mengambil masa 1-2 hari bekerja, manakala penghantaran antarabangsa bergantung pada destinasi, biasanya 3-7 hari bekerja. Masa penghantaran mungkin berbeza mengikut lokasi dan musim.",
    "faq_food_shipping": "Ya, makanan boleh dihantar melalui pos dengan syarat dibungkus dengan betul dan mematuhi peraturan keselamatan makanan. Makanan yang mudah rosak tidak digalakkan.",
    "faq_tracking": "Anda boleh track bungkusan anda menggunakan nombor tracking yang diberikan. Masuk ke laman web POS Malaysia atau gunakan aplikasi mobile POS Malaysia.",
    "faq_weight_limit": "Pos Biasa boleh menghantar bungkusan sehingga 2kg untuk domestik dan 1kg untuk antarabangsa. Untuk bungkusan yang lebih berat, gunakan Pos Laju atau Pos Ekspres yang boleh menghantar sehingga 30kg.",
    "faq_lost_package": "Jika bungkusan anda hilang, sila hubungi pusat khidmat pelanggan POS Malaysia di 1-300-300-300 atau buat aduan melalui laman web. Kami akan menyiasat dan memberikan ganti rugi mengikut terma dan syarat yang ditetapkan.",
    
    // Rate Calculation
    "rate_calculation": "Kadar pos untuk {service} dari {origin} ke {destination} ({weight}) adalah RM{rate}. Masa penghantaran anggaran: {delivery}.",
    "missing_info": "Saya perlukan maklumat berikut untuk kira kadar pos: {fields}. Boleh beritahu saya maklumat ini?",
    "rate_breakdown": "Pecahan kadar: Kadar asas RM{base}, Surcharge berat RM{weight}, Surcharge zon RM{zone}, Jumlah RM{total}",
    
    // Common Responses
    "greeting": "Selamat datang ke POS Malaysia! Bagaimana saya boleh membantu anda hari ini?",
    "faq_not_found": "Maaf, saya tidak dapat mencari maklumat yang tepat untuk soalan anda. Boleh anda cuba tanya dengan cara yang berbeza atau hubungi pusat khidmat pelanggan POS Malaysia di 1-300-300-300.",
    "rate_success": "Ini adalah pengiraan kadar pos anda:",
    "rate_incomplete": "Saya perlukan maklumat tambahan untuk kira kadar. Sila berikan:",
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
