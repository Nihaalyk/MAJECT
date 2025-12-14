/**
 * Application-wide constants
 */

// API Configuration
export const DEFAULT_MODEL = "models/gemini-2.5-flash-native-audio-preview-09-2025";
export const DEFAULT_VOICE = "Kore";

// Tool Response Delay (ms)
export const TOOL_RESPONSE_DELAY = 200;

// Message Limits
export const MAX_MESSAGES_HISTORY = 1000;
export const MAX_TOOL_CALL_RETRIES = 3;

// Session Configuration
export const SESSION_TIMEOUT_HOURS = 24;

// UI Constants
export const SCROLL_BEHAVIOR: ScrollBehavior = 'smooth';
export const DEBOUNCE_DELAY = 300;

// Error Messages
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: "Connection failed. Please check your API key and try again.",
  TOOL_CALL_FAILED: "Error processing request. Please try again.",
  SEND_MESSAGE_FAILED: "Failed to send message. Please reconnect.",
  RESUME_FAILED: "Resume failed. Starting a new session.",
} as const;

// Agent Names
export const AGENT_NAMES = {
  MAIN: "main_agent",
  FAQ: "faq_agent",
  RATE_CALCULATOR: "rate_calculator_agent",
} as const;

// Tool Names
export const TOOL_NAMES = {
  FAQ_INQUIRY: "handle_faq_inquiry",
  RATE_CALCULATION: "calculate_postage_rate",
  LANGUAGE_SWITCH: "switch_language_mode",
} as const;

