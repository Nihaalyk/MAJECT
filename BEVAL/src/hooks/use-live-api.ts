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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GenAILiveClient } from "../lib/genai-live-client";
import { LiveClientOptions } from "../types";
import { AudioStreamer } from "../lib/audio-streamer";
import { audioContext } from "../lib/utils";
import VolMeterWorket from "../lib/worklets/vol-meter";
import { LiveConnectConfig } from "@google/genai";
import { useLoggerStore } from "../lib/store-logger";

export type UseLiveAPIResults = {
  client: GenAILiveClient;
  setConfig: (config: LiveConnectConfig) => void;
  config: LiveConnectConfig;
  model: string;
  setModel: (model: string) => void;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: (preserveSession?: boolean) => Promise<void>;
  resume: () => Promise<void>;
  stopAudio: () => void;
  sessionId: string | null;
  volume: number;
};

export function useLiveAPI(options: LiveClientOptions): UseLiveAPIResults {
  const client = useMemo(() => new GenAILiveClient(options), [options]);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const { log: logToStore } = useLoggerStore();

  const [model, setModel] = useState<string>("models/gemini-live-2.5-flash-preview");
  const [config, setConfig] = useState<LiveConnectConfig>({});
  const [connected, setConnected] = useState(false);
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onOpen = () => {
      setConnected(true);
    };

    const onClose = () => {
      setConnected(false);
    };

    const onError = (error: ErrorEvent) => {
      console.error("error", error);
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.interrupt();

    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    const onLog = (logData: any) => {
      logToStore(logData);
    };

    client
      .on("error", onError)
      .on("open", onOpen)
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio)
      .on("log", onLog);

    return () => {
      client
        .off("error", onError)
        .off("open", onOpen)
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        .off("log", onLog)
        .disconnect();
    };
  }, [client, logToStore]);

  const connect = useCallback(async () => {
    try {
      if (!config) {
        throw new Error("config has not been set");
      }
      if (!model) {
        throw new Error("model has not been set");
      }
      client.disconnect();
      await client.connect(model, config);
    } catch (error) {
      console.error("Failed to connect:", error);
      setConnected(false);
      throw error; // Re-throw to allow UI to handle
    }
  }, [client, config, model]);

  const disconnect = useCallback(async (preserveSession: boolean = false) => {
    try {
      client.disconnect(preserveSession);
    } catch (error) {
      console.error("Error during disconnect:", error);
    } finally {
      setConnected(false);
    }
  }, [setConnected, client]);

  const resume = useCallback(async () => {
    try {
      const success = await client.resume();
      if (success) {
        setConnected(true);
      } else {
        console.warn("Failed to resume session");
        setConnected(false);
      }
    } catch (error) {
      console.error("Failed to resume session:", error);
      setConnected(false);
      throw error;
    }
  }, [client]);

  const stopAudio = useCallback(() => {
    audioStreamerRef.current?.stop();
  }, []);

  return {
    client,
    config,
    setConfig,
    model,
    setModel,
    connected,
    connect,
    disconnect,
    resume,
    stopAudio,
    sessionId: client.sessionId,
    volume,
  };
}
