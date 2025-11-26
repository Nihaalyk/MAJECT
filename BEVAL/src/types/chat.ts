/**
 * Type definitions for chat interface
 */

export interface ToolCallData {
  name: string;
  args: Record<string, unknown>;
}

export interface RateInfo {
  service_type?: string;
  rate: string;
  estimated_delivery: string;
  origin?: string;
  destination?: string;
  weight?: string;
  breakdown?: {
    base_rate: string;
    weight_surcharge: string;
    zone_surcharge: string;
    total: string;
  };
}

export interface FAQResponseData {
  answer: string;
  source: string;
  category: string;
  related_questions?: string[];
  message?: string;
}

export interface ToolResponseData {
  rate_info?: RateInfo;
  source?: string;
  category?: string;
  answer?: string;
  message?: string;
  related_questions?: string[];
  incomplete?: boolean;
  missing_fields?: string[];
  complete?: boolean;
}

export type ChatMessageType = 'user' | 'assistant' | 'system' | 'tool_call' | 'tool_response' | 'transcription';

export interface ChatMessage {
  id: string;
  type: ChatMessageType;
  content: string;
  timestamp: Date;
  toolData?: ToolCallData | ToolResponseData;
  isTyping?: boolean;
  isTranscription?: boolean;
}

