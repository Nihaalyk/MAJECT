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
import "./CustomerServiceAgent.scss";

// Function declarations will be created dynamically based on language


function CustomerServiceAgentComponent() {
  const { client, setConfig, setModel } = useLiveAPIContext();
  const { language, setLanguage, t } = useLanguage();
  const { logout } = useAuth();
  const [currentAgent, setCurrentAgent] = useState<string>(t("main_agent"));

  useEffect(() => {
    setModel("models/gemini-live-2.5-flash-preview");
    
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
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
      tools: [],
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

      // FAQ agent removed - no tool handlers

      // Send empty response if needed
      if (functionResponses.length > 0) {
        setTimeout(() => {
          client.sendToolResponse({ functionResponses });
          setCurrentAgent(t("main_agent"));
        }, 200);
      }
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
          <span className="logo-text">ARIA</span>
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
              KN
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
