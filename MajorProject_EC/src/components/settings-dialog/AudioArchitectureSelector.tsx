import { useCallback, useState } from "react";
import Select from "react-select";
import { AudioArchitecture } from "../../types";

const architectureOptions: Array<{ 
  value: AudioArchitecture; 
  label: string; 
  description: string 
}> = [
  { 
    value: "native", 
    label: "Native Audio",
    description: "Natural speech with emotion-aware dialogue and proactive audio"
  },
  { 
    value: "half-cascade", 
    label: "Half-Cascade Audio",
    description: "Native audio input + text-to-speech output for enhanced reliability"
  },
];

interface AudioArchitectureSelectorProps {
  value?: AudioArchitecture;
  onChange?: (architecture: AudioArchitecture) => void;
  disabled?: boolean;
}

export default function AudioArchitectureSelector({ 
  value = "native", 
  onChange,
  disabled = false 
}: AudioArchitectureSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<{
    value: AudioArchitecture;
    label: string;
    description: string;
  }>(architectureOptions.find(opt => opt.value === value) || architectureOptions[0]);

  const handleChange = useCallback(
    (option: typeof architectureOptions[0] | null) => {
      if (option) {
        setSelectedOption(option);
        onChange?.(option.value);
      }
    },
    [onChange]
  );

  return (
    <div className="select-group">
      <label htmlFor="audio-architecture-selector">
        Audio Architecture
        {disabled && <span className="disabled-label"> (Reconnect to change)</span>}
      </label>
      <Select
        id="audio-architecture-selector"
        className="react-select"
        classNamePrefix="react-select"
        isDisabled={disabled}
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
        options={architectureOptions}
        onChange={handleChange}
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

