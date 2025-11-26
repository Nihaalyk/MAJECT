/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  GoogleGenAIOptions,
  LiveClientToolResponse,
  LiveServerMessage,
  Part,
} from "@google/genai";

/**
 * Audio generation architecture options for Gemini Live API
 */
export type AudioArchitecture = "native" | "half-cascade";

/**
 * Model options for Gemini 2.5 Live API
 * - gemini-live-2.5-flash-preview: Half-cascade audio (recommended for production with tool use)
 * - gemini-2.0-flash-live-001: Half-cascade audio (stable)
 * - gemini-2.5-flash-native-audio-preview-09-2025: Native audio (most natural speech, emotion-aware)
 */
export type LiveModel = 
  | "models/gemini-live-2.5-flash-preview" 
  | "models/gemini-2.0-flash-live-001" 
  | "models/gemini-2.5-flash-native-audio-preview-09-2025";

/**
 * the options to initiate the client, ensure apiKey is required
 */
export type LiveClientOptions = GoogleGenAIOptions & { apiKey: string };

/** log types */
export type StreamingLog = {
  date: Date;
  type: string;
  count?: number;
  message:
    | string
    | ClientContentLog
    | Omit<LiveServerMessage, "text" | "data">
    | LiveClientToolResponse;
};

export type ClientContentLog = {
  turns: Part[];
  turnComplete: boolean;
};
