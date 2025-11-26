import { useCallback, useEffect, useState } from "react";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { LiveModel } from "../../types";

const modelOptions: Array<{ value: LiveModel; label: string; description: string }> = [
  { 
    value: "models/gemini-live-2.5-flash-preview", 
    label: "Gemini Live 2.5 Flash (Recommended)",
    description: "Half-cascade audio - Best for production with tool use"
  },
  { 
    value: "models/gemini-2.0-flash-live-001", 
    label: "Gemini 2.0 Flash Live (Stable)",
    description: "Half-cascade audio - Stable production model"
  },
  { 
    value: "models/gemini-2.5-flash-native-audio-preview-09-2025", 
    label: "Gemini 2.5 Flash Native Audio (Preview)",
    description: "Native audio - Most natural speech with emotion awareness"
  },
];

export default function ModelSelector() {
  const { model, setModel, connected } = useLiveAPIContext();

  const [selectedOption, setSelectedOption] = useState<{
    value: LiveModel;
    label: string;
    description: string;
  } | null>(modelOptions[0]);

  useEffect(() => {
    const currentModel = modelOptions.find(option => option.value === model) || modelOptions[0];
    setSelectedOption(currentModel);
  }, [model]);

  const updateModel = useCallback(
    (modelName: LiveModel) => {
      setModel(modelName);
    },
    [setModel]
  );

  return (
    <div className="select-group">
      <label htmlFor="model-selector">
        Model
        {connected && <span className="disabled-label"> (Reconnect to change)</span>}
      </label>
      <Select
        id="model-selector"
        className="react-select"
        classNamePrefix="react-select"
        isDisabled={connected}
        styles={{
          control: (baseStyles, state) => ({
            ...baseStyles,
            background: state.isDisabled ? "var(--Neutral-10)" : "var(--Neutral-15)",
            color: "var(--Neutral-90)",
            minHeight: "33px",
            maxHeight: "33px",
            border: 0,
            opacity: state.isDisabled ? 0.5 : 1,
          }),
          option: (styles, { isFocused, isSelected }) => ({
            ...styles,
            backgroundColor: isFocused
              ? "var(--Neutral-30)"
              : isSelected
              ? "var(--Neutral-20)"
              : undefined,
          }),
        }}
        value={selectedOption}
        options={modelOptions}
        onChange={(e) => {
          if (e) {
            setSelectedOption(e);
            updateModel(e.value);
          }
        }}
        formatOptionLabel={(option) => (
          <div>
            <div style={{ fontWeight: 500 }}>{option.label}</div>
            <div style={{ fontSize: "0.85em", opacity: 0.7 }}>{option.description}</div>
          </div>
        )}
      />
    </div>
  );
}

