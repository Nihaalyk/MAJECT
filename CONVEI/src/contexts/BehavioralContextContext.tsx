/**
 * Behavioral Context Context
 * Provides real-time behavioral metrics from FUSION to CONVEI agents
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface BehavioralState {
  emotion: string;
  attention: string;
  engagement: string;
  sentiment: number;
  confidence: string;
  fatigue?: string;
  posture?: string;
  movement?: string;
}

export interface BehavioralContextData {
  currentState: BehavioralState;
  insights: string[];
  recommendations: string[];
  isAvailable: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

interface BehavioralContextType {
  behavioralData: BehavioralContextData;
  refreshContext: () => Promise<void>;
  getContextualPrompt: () => string;
}

const BehavioralContext = createContext<BehavioralContextType | undefined>(undefined);

const FUSION_API_URL = process.env.REACT_APP_FUSION_API_URL || 'http://localhost:8083';
const REFRESH_INTERVAL = 1000; // 1 second (increased frequency from 5 seconds)
const CONTEXT_WINDOW = 30; // 30 seconds of metrics

export const BehavioralContextProvider: React.FC<{ 
  children: ReactNode;
  sessionId?: string;
}> = ({ children, sessionId }) => {
  const [behavioralData, setBehavioralData] = useState<BehavioralContextData>({
    currentState: {
      emotion: 'neutral',
      attention: 'Unknown',
      engagement: 'medium',
      sentiment: 0.0,
      confidence: 'medium'
    },
    insights: [],
    recommendations: [],
    isAvailable: false,
    lastUpdated: null,
    error: null
  });

  const fetchBehavioralContext = useCallback(async () => {
    if (!sessionId) {
      // Use a default session or create one
      const defaultSessionId = `convei_session_${Date.now()}`;
      try {
        // Create session in FUSION
        await fetch(`${FUSION_API_URL}/api/sessions?session_id=${defaultSessionId}`, {
          method: 'POST'
        });
      } catch (e) {
        // Session creation failed, continue without it
      }
    }

    const activeSessionId = sessionId || `convei_session_${Date.now()}`;

    try {
      const response = await fetch(
        `${FUSION_API_URL}/api/metrics/context/${activeSessionId}?window=${CONTEXT_WINDOW}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No metrics yet, that's okay
          setBehavioralData(prev => ({
            ...prev,
            isAvailable: false,
            error: null
          }));
          return;
        }
        throw new Error(`FUSION API error: ${response.status}`);
      }

      const data = await response.json();
      
      setBehavioralData({
        currentState: {
          emotion: data.current_state?.emotion || 'neutral',
          attention: data.current_state?.attention || 'Unknown',
          engagement: data.current_state?.engagement || 'medium',
          sentiment: data.current_state?.sentiment || 0.0,
          confidence: data.current_state?.confidence || 'medium',
          fatigue: data.current_state?.fatigue,
          posture: data.current_state?.posture,
          movement: data.current_state?.movement
        },
        insights: data.behavioral_insights || [],
        recommendations: data.recommendations || [],
        isAvailable: true,
        lastUpdated: new Date(),
        error: null
      });
    } catch (error) {
      console.warn('Failed to fetch behavioral context:', error);
      setBehavioralData(prev => ({
        ...prev,
        isAvailable: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: prev.lastUpdated // Keep last successful update
      }));
    }
  }, [sessionId]);

  // Initial fetch
  useEffect(() => {
    fetchBehavioralContext();
  }, [fetchBehavioralContext]);

  // Periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchBehavioralContext();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchBehavioralContext]);

  const getContextualPrompt = useCallback((): string => {
    if (!behavioralData.isAvailable || !behavioralData.lastUpdated) {
      return '';
    }

    const state = behavioralData.currentState;
    const age = Math.floor((Date.now() - behavioralData.lastUpdated.getTime()) / 1000);

    // Only include context if it's recent (within 60 seconds)
    if (age > 60) {
      return '';
    }

    let prompt = '\n\n[BEHAVIORAL CONTEXT - You have access to real-time emotion and behavioral analysis]:\n';
    prompt += `You CAN see and analyze the user's facial expressions, voice, and behavior in real-time. You have MULTIMODAL analysis capabilities:\n`;
    prompt += `- FACIAL EXPRESSION ANALYSIS: You can see and analyze facial expressions, emotions, eye movements, and facial features\n`;
    prompt += `- VOICE ANALYSIS: You can analyze voice tone, sentiment, and speech patterns\n`;
    prompt += `- BEHAVIORAL ANALYSIS: You can detect attention, engagement, posture, and movement\n`;
    prompt += `\nCurrent analysis shows: ${state.emotion} emotion (from facial expressions and voice), ${state.attention} attention level, ${state.engagement} engagement.\n`;
    
    if (state.sentiment !== 0) {
      const sentimentDesc = state.sentiment > 0.3 ? 'positive' : state.sentiment < -0.3 ? 'negative' : 'neutral';
      prompt += `Sentiment analysis (from voice): ${sentimentDesc} (${state.sentiment > 0 ? '+' : ''}${state.sentiment.toFixed(2)}).\n`;
    }

    if (state.fatigue && state.fatigue !== 'Normal') {
      prompt += `User appears ${state.fatigue.toLowerCase()} - consider shorter responses if needed.\n`;
    }

    if (state.attention === 'Distracted') {
      prompt += 'User attention is low - be concise and engaging.\n';
    } else if (state.attention === 'Focused') {
      prompt += 'User is focused - you can provide more detailed responses.\n';
    }

    if (state.engagement === 'low') {
      prompt += 'User engagement is low - try to re-engage with questions or interesting topics.\n';
    } else if (state.engagement === 'high') {
      prompt += 'User is highly engaged - feel free to explore topics in depth.\n';
    }

    if (behavioralData.insights.length > 0) {
      prompt += `Behavioral insights: ${behavioralData.insights.join('; ')}.\n`;
    }

    if (behavioralData.recommendations.length > 0) {
      prompt += `Recommendations: ${behavioralData.recommendations.join('; ')}.\n`;
    }

    prompt += 'IMPORTANT: You have MULTIMODAL analysis capabilities including facial expression recognition. When asked about what you can see, you CAN and SHOULD acknowledge that you can see facial expressions, analyze emotions from faces, detect attention from eye movements, and understand behavior. You can say things like "I can see your facial expressions show [emotion]" or "From your facial expressions and voice, you seem [emotion]" or "I can analyze your facial expressions, and right now I see [emotion]". Be specific about your multimodal capabilities - you can see faces, analyze expressions, detect emotions, and understand behavior. Use this information naturally to be more empathetic and understanding. Adapt your tone, length, and style based on the user\'s emotional state.\n';

    return prompt;
  }, [behavioralData]);

  return (
    <BehavioralContext.Provider
      value={{
        behavioralData,
        refreshContext: fetchBehavioralContext,
        getContextualPrompt
      }}
    >
      {children}
    </BehavioralContext.Provider>
  );
};

export const useBehavioralContext = (): BehavioralContextType => {
  const context = useContext(BehavioralContext);
  if (!context) {
    throw new Error('useBehavioralContext must be used within BehavioralContextProvider');
  }
  return context;
};

