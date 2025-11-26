/**
 * Multi-Agent Conversational System
 * Main Agent that orchestrates FAQ agent
 */

import { useEffect, useState, memo } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { ConversationDisplay } from "../conversation-display/ConversationDisplay";
import {
  FunctionDeclaration,
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";
import { searchFAQ } from "../../lib/generic-services";
import "./CustomerServiceAgent.scss";

// Function declarations will be created dynamically based on language


function CustomerServiceAgentComponent() {
  const { client, setConfig, setModel } = useLiveAPIContext();
  const { language, setLanguage, t } = useLanguage();
  const { logout } = useAuth();
  const [currentAgent, setCurrentAgent] = useState<string>(t("main_agent"));

  useEffect(() => {
    // Create function declarations based on current language
    const faqAgentDeclaration: FunctionDeclaration = {
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
    };


    setModel("models/gemini-live-2.5-flash-preview");
    
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
      },
      outputAudioTranscription: {},
      inputAudioTranscription: {},
      systemInstruction: {
        parts: [
          {
            text: t("system_instruction"),
          },
        ],
      },
      tools: [
        { functionDeclarations: [faqAgentDeclaration] },
      ],
    });
  }, [setConfig, setModel, language, t]);

  useEffect(() => {
    const onToolCall = async (toolCall: LiveServerToolCall) => {
      const functionCalls = toolCall.functionCalls;
      if (!functionCalls?.length) return;

      const functionResponses: {
        id: string;
        name: string;
        response: { output: any };
      }[] = [];

      for (const fc of functionCalls) {
        if (fc.name === "handle_faq_inquiry") {
          console.log("Routing to FAQ Agent:", fc.args);
          setCurrentAgent(t("faq_agent"));
          
          const { question } = fc.args as any;
          
          // Enhanced FAQ search using the service
          const matchingFAQs = searchFAQ(question, language);
          
          const response = matchingFAQs.length > 0
            ? { 
                answer: matchingFAQs[0].answer, 
                source: "FAQ Database",
                category: matchingFAQs[0].category,
                related_questions: matchingFAQs.slice(1, 3).map(faq => faq.question)
              }
            : { 
                answer: t("faq_not_found"), 
                source: "General Response" 
              };

          functionResponses.push({
            id: fc.id ?? "",
            name: fc.name ?? "",
            response: { output: response },
          });
        }

      }

      // Send response back to main agent
      setTimeout(() => {
        client.sendToolResponse({ functionResponses });
        setCurrentAgent(t("main_agent"));
      }, 200);
    };

    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client, language, t]);

  return (
    <div className="customer-service-agent">
      <div className="agent-header">
        <div className="logo">
          <span className="logo-text">CES</span>
        </div>
        <div className="header-controls">
          <div className="language-toggle">
            <button 
              className={`lang-btn ${language === "en" ? "active" : ""}`}
              onClick={() => setLanguage("en")}
            >
              EN
            </button>
            <button 
              className={`lang-btn ${language === "kn" ? "active" : ""}`}
              onClick={() => setLanguage("kn")}
            >
              MS
            </button>
          </div>
          <button
            className="logout-button"
            onClick={logout}
            title="Logout"
          >
            Logout
          </button>
          <div className="current-agent">
            <span className="agent-label">{t("active_agent")}</span>
            <span className="agent-name">{currentAgent}</span>
          </div>
        </div>
      </div>
      
      <div className="main-content">
        <div className="welcome-section">
          <div className="welcome-message">
            <h2>{t("welcome_title")}</h2>
            <p>{t("welcome_subtitle")}</p>
            <div className="service-options">
              <div className="service-card">
                <h3>Chat & Questions</h3>
                <p>Ask me anything or just have a conversation</p>
              </div>
              <div className="service-card">
                <h3>Get Information</h3>
                <p>I can help you find answers to your questions</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="conversation-section">
          <ConversationDisplay />
        </div>
      </div>
    </div>
  );
}

export const CustomerServiceAgent = memo(CustomerServiceAgentComponent);
