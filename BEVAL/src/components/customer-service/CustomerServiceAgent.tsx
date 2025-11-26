/**
 * POS Malaysia Multi-Agent Conversational System
 * Main Agent that orchestrates FAQ and Rate Calculator agents
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
import { searchFAQ, calculatePostageRate, RateCalculationParams } from "../../lib/pos-malaysia-services";
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
        ? "Handles FAQ and document-based questions about POS Malaysia services, policies, and procedures. Use this for questions about 'what is', 'can I', 'how to', 'why', 'FAQ', 'manual', 'package'."
        : "Handles FAQ and document-based questions about POS Malaysia services, policies, and procedures. Use this for questions about 'apa itu', 'boleh ke', 'macam mana', 'kenapa', 'FAQ', 'manual', 'bungkusan'.",
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
    };

    const rateCalculatorDeclaration: FunctionDeclaration = {
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
              ? "Type of postal service (e.g., 'Pos Laju', 'Pos Biasa', 'Pos Ekspres')."
              : "Jenis perkhidmatan pos (cth: 'Pos Laju', 'Pos Biasa', 'Pos Ekspres').",
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
        { functionDeclarations: [faqAgentDeclaration, rateCalculatorDeclaration] },
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

        if (fc.name === "calculate_postage_rate") {
          console.log("Routing to Rate Calculator Agent:", fc.args);
          setCurrentAgent(t("rate_calculator_agent"));
          
          const params = fc.args as any;
          
          // Check for required fields
          const missingFields = [];
          if (!params.origin) missingFields.push(language === "en" ? "origin" : "asal");
          if (!params.destination) missingFields.push(language === "en" ? "destination" : "destinasi");
          if (!params.weight) missingFields.push(language === "en" ? "weight" : "berat");
          
          if (missingFields.length > 0) {
            const response = {
              incomplete: true,
              missing_fields: missingFields,
              message: t("missing_info").replace("{fields}", missingFields.join(", "))
            };
            
            functionResponses.push({
              id: fc.id ?? "",
              name: fc.name ?? "",
              response: { output: response },
            });
          } else {
            // Calculate rate using the enhanced service
            const rateResult = calculatePostageRate(params as RateCalculationParams);
            const response = {
              complete: true,
              rate_info: rateResult,
              message: t("rate_calculation")
                .replace("{service}", params.service_type || 'Pos Laju')
                .replace("{origin}", params.origin)
                .replace("{destination}", params.destination)
                .replace("{weight}", params.weight)
                .replace("{rate}", rateResult.rate)
                .replace("{delivery}", rateResult.estimated_delivery)
            };
            
            functionResponses.push({
              id: fc.id ?? "",
              name: fc.name ?? "",
              response: { output: response },
            });
          }
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
              className={`lang-btn ${language === "ms" ? "active" : ""}`}
              onClick={() => setLanguage("ms")}
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
                <h3>FAQ & Information</h3>
                <p>Ask about services, policies, and POS Malaysia procedures</p>
              </div>
              <div className="service-card">
                <h3>Calculate Postage Rates</h3>
                <p>Get shipping cost estimates for your packages</p>
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
