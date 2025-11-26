import {
  ChangeEvent,
  FormEventHandler,
  useCallback,
  useMemo,
  useState,
} from "react";
import "./settings-dialog.scss";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import VoiceSelector from "./VoiceSelector";
import ResponseModalitySelector from "./ResponseModalitySelector";
import ModelSelector from "./ModelSelector";
import AudioArchitectureSelector from "./AudioArchitectureSelector";
import { FunctionDeclaration, LiveConnectConfig, Tool } from "@google/genai";
import { AudioArchitecture } from "../../types";

type FunctionDeclarationsTool = Tool & {
  functionDeclarations: FunctionDeclaration[];
};

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { config, setConfig, connected } = useLiveAPIContext();
  const [audioArchitecture, setAudioArchitecture] = useState<AudioArchitecture>("native");
  
  const functionDeclarations: FunctionDeclaration[] = useMemo(() => {
    if (!Array.isArray(config.tools)) {
      return [];
    }
    return (config.tools as Tool[])
      .filter((t: Tool): t is FunctionDeclarationsTool =>
        Array.isArray((t as any).functionDeclarations)
      )
      .map((t) => t.functionDeclarations)
      .filter((fc) => !!fc)
      .flat();
  }, [config]);

  // system instructions can come in many types
  const systemInstruction = useMemo(() => {
    if (!config.systemInstruction) {
      return "";
    }
    if (typeof config.systemInstruction === "string") {
      return config.systemInstruction;
    }
    if (Array.isArray(config.systemInstruction)) {
      return config.systemInstruction
        .map((p) => (typeof p === "string" ? p : p.text))
        .join("\n");
    }
    if (
      typeof config.systemInstruction === "object" &&
      "parts" in config.systemInstruction
    ) {
      return (
        config.systemInstruction.parts?.map((p) => p.text).join("\n") || ""
      );
    }
    return "";
  }, [config]);

  const updateConfig: FormEventHandler<HTMLTextAreaElement> = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const newConfig: LiveConnectConfig = {
        ...config,
        systemInstruction: event.target.value,
      };
      setConfig(newConfig);
    },
    [config, setConfig]
  );

  const updateFunctionDescription = useCallback(
    (editedFdName: string, newDescription: string) => {
      const newConfig: LiveConnectConfig = {
        ...config,
        tools:
          config.tools?.map((tool) => {
            const fdTool = tool as FunctionDeclarationsTool;
            if (!Array.isArray(fdTool.functionDeclarations)) {
              return tool;
            }
            return {
              ...tool,
              functionDeclarations: fdTool.functionDeclarations.map((fd) =>
                fd.name === editedFdName
                  ? { ...fd, description: newDescription }
                  : fd
              ),
            };
          }) || [],
      };
      setConfig(newConfig);
    },
    [config, setConfig]
  );

  return (
    <div className="settings-dialog">
      <button
        className="action-button material-symbols-outlined"
        onClick={() => setOpen(!open)}
      >
        settings
      </button>
      
      {open && (
        <div className="settings-overlay" onClick={() => setOpen(false)}>
          <div className="settings-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h2>Settings</h2>
              <button 
                className="close-button"
                onClick={() => setOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className={`popup-content ${connected ? "disabled" : ""}`}>
              {connected && (
                <div className="connected-indicator">
                  <p>
                    These settings can only be applied before connecting and will
                    override other settings.
                  </p>
                </div>
              )}
              <div className="mode-selectors">
                <ModelSelector />
                <AudioArchitectureSelector 
                  value={audioArchitecture}
                  onChange={setAudioArchitecture}
                  disabled={connected}
                />
                <ResponseModalitySelector />
                <VoiceSelector />
              </div>

              <h3>System Instructions</h3>
              <textarea
                className="system"
                onChange={updateConfig}
                value={systemInstruction}
              />
              <h4>Function declarations</h4>
              <div className="function-declarations">
                <div className="fd-rows">
                  {functionDeclarations.map((fd, fdKey) => (
                    <div className="fd-row" key={`function-${fdKey}`}>
                      <span className="fd-row-name">{fd.name}</span>
                      <span className="fd-row-args">
                        {Object.keys(fd.parameters?.properties || {}).map(
                          (item, k) => (
                            <span key={k}>{item}</span>
                          )
                        )}
                      </span>
                      <input
                        key={`fd-${fd.description}`}
                        className="fd-row-description"
                        type="text"
                        defaultValue={fd.description}
                        onBlur={(e) =>
                          updateFunctionDescription(fd.name!, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
