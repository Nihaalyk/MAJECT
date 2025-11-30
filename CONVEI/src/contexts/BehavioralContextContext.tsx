/**
 * Behavioral Context Context
 * Advanced emotional intelligence with memory and deep understanding
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useConversationMemory } from './ConversationMemoryContext';

export interface BehavioralState {
  emotion: string;
  attention: string;
  engagement: string;
  sentiment: number;
  confidence: string;
  fatigue?: string;
  posture?: string;
  movement?: string;
  attentionScore?: number;
  emotionalIntensity?: string;
  empathyNeeded?: string;
  audioEnergy?: number;
  audioPitch?: number;
  speechRate?: number;
}

export interface EmotionalMemoryEntry {
  timestamp: number;
  emotion: string;
  sentiment: number;
  intensity: string;
  trigger?: string;
}

export interface BehavioralContextData {
  currentState: BehavioralState;
  insights: string[];
  recommendations: string[];
  conversationGuidance?: {
    approach: string;
    tone: string;
    pace: string;
    techniques: string[];
    avoid: string[];
  };
  emotionalMemory: EmotionalMemoryEntry[];
  emotionalTrend: 'improving' | 'stable' | 'declining' | 'volatile' | 'unknown';
  dominantEmotion: string;
  isAvailable: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

interface BehavioralContextType {
  behavioralData: BehavioralContextData;
  refreshContext: () => Promise<void>;
  getContextualPrompt: () => string;
  recordEmotionalMoment: (emotion: string, trigger?: string) => void;
  getEmotionalJourneySummary: () => string;
}

const BehavioralContext = createContext<BehavioralContextType | undefined>(undefined);

const FUSION_API_URL = process.env.REACT_APP_FUSION_API_URL || 'http://localhost:8083';
const REFRESH_INTERVAL = 800; // 800ms for real-time feel
const CONTEXT_WINDOW = 30;
const MAX_EMOTIONAL_MEMORY = 50;

export const BehavioralContextProvider: React.FC<{ 
  children: ReactNode;
  sessionId?: string;
}> = ({ children, sessionId }) => {
  const { memory } = useConversationMemory();
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
    emotionalMemory: [],
    emotionalTrend: 'unknown',
    dominantEmotion: 'neutral',
    isAvailable: false,
    lastUpdated: null,
    error: null
  });

  const emotionalMemoryRef = useRef<EmotionalMemoryEntry[]>([]);

  const recordEmotionalMoment = useCallback((emotion: string, trigger?: string, sentiment?: number, intensity?: string) => {
    const entry: EmotionalMemoryEntry = {
      timestamp: Date.now(),
      emotion,
      sentiment: sentiment !== undefined ? sentiment : behavioralData.currentState.sentiment,
      intensity: intensity || behavioralData.currentState.emotionalIntensity || 'moderate',
      trigger
    };
    
    emotionalMemoryRef.current = [
      ...emotionalMemoryRef.current.slice(-MAX_EMOTIONAL_MEMORY + 1),
      entry
    ];
  }, [behavioralData.currentState.sentiment, behavioralData.currentState.emotionalIntensity]);

  const calculateEmotionalTrend = useCallback((memory: EmotionalMemoryEntry[]): 'improving' | 'stable' | 'declining' | 'volatile' | 'unknown' => {
    if (memory.length < 3) return 'unknown';
    
    const positiveEmotions = ['happy', 'surprise'];
    const negativeEmotions = ['sad', 'angry', 'fear', 'disgust'];
    
    const recentEmotions = memory.slice(-5);
    const olderEmotions = memory.slice(-10, -5);
    
    if (olderEmotions.length === 0) return 'unknown';
    
    const recentPositive = recentEmotions.filter(e => positiveEmotions.includes(e.emotion)).length;
    const olderPositive = olderEmotions.filter(e => positiveEmotions.includes(e.emotion)).length;
    const recentNegative = recentEmotions.filter(e => negativeEmotions.includes(e.emotion)).length;
    
    const uniqueRecent = new Set(recentEmotions.map(e => e.emotion)).size;
    if (uniqueRecent >= 4) return 'volatile';
    
    if (recentPositive > olderPositive) return 'improving';
    if (recentNegative > 2) return 'declining';
    return 'stable';
  }, []);

  const getDominantEmotion = useCallback((memory: EmotionalMemoryEntry[]): string => {
    if (memory.length === 0) return 'neutral';
    
    const counts: Record<string, number> = {};
    memory.slice(-10).forEach(entry => {
      counts[entry.emotion] = (counts[entry.emotion] || 0) + 1;
    });
    
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  }, []);

  const fetchBehavioralContext = useCallback(async () => {
    // Always use "current" to get the latest metrics
    const activeSessionId = "current";

    try {
      // Prepare conversation context from conversation memory
      const conversationContext = {
        conversationHistory: memory.currentContext.conversationHistory.slice(-10).map(entry => ({
          userInput: entry.userInput,
          agentResponse: entry.agentResponse,
          timestamp: entry.timestamp.getTime()
        })),
        lastUserInput: memory.currentContext.lastInquiry || '',
        sessionId: memory.sessionData.sessionId,
        totalInteractions: memory.sessionData.totalInteractions
      };
      
      // Send conversation context with POST request
      const response = await fetch(
        `${FUSION_API_URL}/api/metrics/context/${activeSessionId}?window=${CONTEXT_WINDOW}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            conversation_context: conversationContext
          })
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
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
      
      const currentEmotion = data.current_state?.emotion || 'neutral';
      const previousEmotion = behavioralData.currentState.emotion;
      const currentSentiment = data.current_state?.sentiment || 0;
      const currentIntensity = data.current_state?.emotional_intensity || data.emotional_intelligence?.emotional_intensity || 'moderate';
      
      // Record emotional moment more frequently (every time we get new data, not just on change)
      // This builds up the emotional journey faster
      const timeSinceLastRecord = emotionalMemoryRef.current.length > 0
        ? Date.now() - emotionalMemoryRef.current[emotionalMemoryRef.current.length - 1].timestamp
        : Infinity;
      
      // Record if emotion changed OR if it's been more than 5 seconds since last record
      if (currentEmotion !== previousEmotion || timeSinceLastRecord > 5000) {
        recordEmotionalMoment(currentEmotion, undefined, currentSentiment, currentIntensity);
      }
      
      const emotionalTrend = calculateEmotionalTrend(emotionalMemoryRef.current);
      const dominantEmotion = getDominantEmotion(emotionalMemoryRef.current);
      
      // Extract audio data from current_state
      // Try multiple possible field names
      const audioEnergy = data.current_state?.audio_energy || 
                         data.current_state?.energy || 
                         (data.current_state?.audio_data?.energy) || 0;
      const audioPitch = data.current_state?.audio_pitch || 
                        data.current_state?.pitch || 
                        (data.current_state?.audio_data?.pitch) || 0;
      const speechRate = data.current_state?.speech_rate || 
                        data.current_state?.speechRate || 
                        (data.current_state?.audio_data?.speech_rate) || 0;
      
      // Debug logging
      if (audioEnergy > 0 || audioPitch > 0 || speechRate > 0) {
        console.log('Audio data extracted:', { audioEnergy, audioPitch, speechRate });
      }

      setBehavioralData({
        currentState: {
          emotion: currentEmotion,
          attention: data.current_state?.attention || 'Unknown',
          engagement: data.current_state?.engagement || 'medium',
          sentiment: data.current_state?.sentiment || 0.0,
          confidence: data.current_state?.confidence || 'medium',
          fatigue: data.current_state?.fatigue,
          posture: data.current_state?.posture,
          movement: data.current_state?.movement,
          attentionScore: data.current_state?.attention_score,
          emotionalIntensity: data.current_state?.emotional_intensity || data.emotional_intelligence?.emotional_intensity,
          empathyNeeded: data.current_state?.empathy_level_needed || data.emotional_intelligence?.empathy_level_needed,
          audioEnergy: audioEnergy,
          audioPitch: audioPitch,
          speechRate: speechRate
        },
        insights: data.behavioral_insights || [],
        recommendations: data.recommendations || [],
        conversationGuidance: data.conversation_guidance,
        emotionalMemory: emotionalMemoryRef.current,
        emotionalTrend,
        dominantEmotion,
        isAvailable: true,
        lastUpdated: new Date(),
        error: null
      });
    } catch (error) {
      console.warn('Failed to fetch behavioral context:', error);
      setBehavioralData(prev => ({
        ...prev,
        isAvailable: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [
    behavioralData.currentState.emotion, 
    recordEmotionalMoment, 
    calculateEmotionalTrend, 
    getDominantEmotion,
    memory.currentContext.conversationHistory,
    memory.currentContext.lastInquiry,
    memory.sessionData.sessionId,
    memory.sessionData.totalInteractions
  ]);

  useEffect(() => {
    fetchBehavioralContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchBehavioralContext, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchBehavioralContext]);

  const getEmotionalJourneySummary = useCallback((): string => {
    const memory = emotionalMemoryRef.current;
    if (memory.length < 2) return "Not enough emotional data yet for a journey summary.";
    
    const trend = calculateEmotionalTrend(memory);
    const dominant = getDominantEmotion(memory);
    const recentEmotions = memory.slice(-5).map(e => e.emotion);
    
    let summary = `Over our conversation, your dominant emotion has been ${dominant}. `;
    
    if (trend === 'improving') {
      summary += "I've noticed your mood has been brightening - that's wonderful to see! ";
    } else if (trend === 'declining') {
      summary += "I've sensed a shift in your mood. Is everything okay? ";
    } else if (trend === 'volatile') {
      summary += "Your emotions have been quite varied - you've been processing a lot. ";
    } else {
      summary += "Your emotional state has been fairly consistent. ";
    }
    
    const uniqueEmotions = [...new Set(recentEmotions)];
    if (uniqueEmotions.length > 1) {
      summary += `Recently, I've observed ${uniqueEmotions.join(', ')} in your expressions.`;
    }
    
    return summary;
  }, [calculateEmotionalTrend, getDominantEmotion]);

  const getContextualPrompt = useCallback((): string => {
    if (!behavioralData.isAvailable || !behavioralData.lastUpdated) {
      return '';
    }

    const state = behavioralData.currentState;
    const age = Math.floor((Date.now() - behavioralData.lastUpdated.getTime()) / 1000);

    if (age > 60) return '';

    let prompt = `
═══════════════════════════════════════════════════════════════════════════════
REAL-TIME EMOTIONAL INTELLIGENCE DATA
═══════════════════════════════════════════════════════════════════════════════

You have ACTIVE multimodal perception. Right now you can see:

CURRENT EMOTIONAL STATE:
   • Primary Emotion: ${state.emotion.toUpperCase()}${state.emotionalIntensity ? ` (${state.emotionalIntensity} intensity)` : ''}
   • Attention: ${state.attention}${state.attentionScore ? ` (${state.attentionScore.toFixed(0)}/100)` : ''}
   • Engagement: ${state.engagement}
   • Sentiment: ${state.sentiment > 0 ? '+' : ''}${state.sentiment.toFixed(2)} (${state.sentiment > 0.3 ? 'positive' : state.sentiment < -0.3 ? 'negative' : 'neutral'})
`;

    if (state.fatigue && state.fatigue !== 'Normal') {
      prompt += `   • Fatigue Level: ${state.fatigue}\n`;
    }

    if (state.empathyNeeded && state.empathyNeeded !== 'low') {
      prompt += `   • Empathy Needed: ${state.empathyNeeded.toUpperCase()}\n`;
    }

    // Emotional trend
    if (behavioralData.emotionalTrend !== 'unknown') {
      prompt += `
EMOTIONAL TREND: ${behavioralData.emotionalTrend}
   Dominant emotion this session: ${behavioralData.dominantEmotion}
`;
    }

    // Conversation guidance
    if (behavioralData.conversationGuidance) {
      const guidance = behavioralData.conversationGuidance;
      prompt += `
CONVERSATION GUIDANCE:
   • Approach: ${guidance.approach}
   • Tone: ${guidance.tone}
   • Pace: ${guidance.pace}
`;
      if (guidance.techniques?.length) {
        prompt += `   • Techniques: ${guidance.techniques.slice(0, 2).join('; ')}\n`;
      }
      if (guidance.avoid?.length) {
        prompt += `   • Avoid: ${guidance.avoid.slice(0, 2).join('; ')}\n`;
      }
    }

    // Key insights
    if (behavioralData.insights.length > 0) {
      prompt += `
KEY INSIGHTS:
${behavioralData.insights.slice(0, 3).map(i => `   • ${i}`).join('\n')}
`;
    }

    // Recommendations
    if (behavioralData.recommendations.length > 0) {
      prompt += `
RECOMMENDATIONS:
${behavioralData.recommendations.slice(0, 3).map(r => `   • ${r}`).join('\n')}
`;
    }

    prompt += `
═══════════════════════════════════════════════════════════════════════════════

CRITICAL: You CAN see facial expressions. You CAN detect emotions from faces.
When asked about emotions, USE this data. Say things like:
- "I can see your expression shows ${state.emotion}..."
- "Looking at your face, I notice ${state.emotion}..."
- "Your facial expressions tell me you're feeling ${state.emotion}..."

Adapt your ENTIRE response style to this emotional data:
- If sad/angry/fear → be gentle, validating, slower
- If happy → be enthusiastic, share their joy
- If tired → keep it brief and gentle
- If disengaged → re-engage with questions

Be human. Be empathetic. Connect genuinely.
═══════════════════════════════════════════════════════════════════════════════
`;

    return prompt;
  }, [behavioralData]);

  return (
    <BehavioralContext.Provider
      value={{
        behavioralData,
        refreshContext: fetchBehavioralContext,
        getContextualPrompt,
        recordEmotionalMoment,
        getEmotionalJourneySummary
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
