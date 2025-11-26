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

import { useRef, useState, Suspense, lazy } from "react";
import "./App.scss";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { ConversationMemoryProvider } from "./contexts/ConversationMemoryContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { MessageProvider } from "./contexts/MessageContext";
import Login from "./components/login/Login";
import ErrorBoundary from "./components/error-boundary/ErrorBoundary";
import cn from "classnames";
import { LiveClientOptions } from "./types";

// Lazy load heavy components
const EnhancedConsole = lazy(() => import("./components/enhanced-console/EnhancedConsole").then(module => ({ default: module.EnhancedConsole })));
const ChatInterface = lazy(() => import("./components/chat-interface/ChatInterface").then(module => ({ default: module.ChatInterface })));
const ControlTray = lazy(() => import("./components/control-tray/ControlTray"));

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY as string;
if (typeof API_KEY !== "string") {
  throw new Error("set REACT_APP_GEMINI_API_KEY in .env");
}

const apiOptions: LiveClientOptions = {
  apiKey: API_KEY,
};

// Loading fallback component
const LoadingFallback = () => (
  <div className="loading-fallback">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Main app content component
function AppContent() {
  // this video reference is used for displaying the active stream, whether that is the webcam or screen capture
  // feel free to style as you see fit
  const videoRef = useRef<HTMLVideoElement>(null);
  // either the screen capture, the video or null, if null we hide it
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  return (
    <ErrorBoundary>
      <div className="App">
        <ThemeProvider>
          <LanguageProvider>
            <ConversationMemoryProvider>
              <MessageProvider>
                <LiveAPIProvider options={apiOptions}>
                  <Suspense fallback={<LoadingFallback />}>
                    <div className="streaming-console">
                      <main>
                        <div className="main-app-area">
                          {/* APP goes here */}
                          <ChatInterface />
                          <video
                            className={cn("stream", {
                              hidden: !videoRef.current || !videoStream,
                            })}
                            ref={videoRef}
                            autoPlay
                            playsInline
                          />
                        </div>

                        <ControlTray
                          videoRef={videoRef}
                          supportsVideo={true}
                          onVideoStreamChange={setVideoStream}
                          enableEditingSettings={true}
                        >
                          {/* put your own buttons here */}
                        </ControlTray>
                      </main>
                      <EnhancedConsole />
                    </div>
                  </Suspense>
                </LiveAPIProvider>
              </MessageProvider>
            </ConversationMemoryProvider>
          </LanguageProvider>
        </ThemeProvider>
      </div>
    </ErrorBoundary>
  );
}

// App wrapper with authentication
function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

// Component that handles authentication logic
function AppWithAuth() {
  const { user, login, loading, error } = useAuth();

  if (user) {
    return <AppContent />;
  }

  return (
    <ThemeProvider>
      <Login
        onLogin={login}
        error={error || undefined}
        loading={loading}
      />
    </ThemeProvider>
  );
}

export default App;
