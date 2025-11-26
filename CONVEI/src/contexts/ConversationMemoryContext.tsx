/**
 * Conversation Memory Context
 * Maintains conversation state and memory across the session
 */

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';

export interface ConversationMemory {
  // User preferences
  userPreferences: {
    preferredLanguage: 'en' | 'kn';
  };
  
  // Current conversation context
  currentContext: {
    lastInquiry: string;
    lastAgent: string;
    conversationHistory: Array<{
      timestamp: Date;
      userInput: string;
      agentResponse: string;
      agentType: string;
    }>;
    pendingInfo: {
      // Can store any pending information
    };
  };
  
  // Session data
  sessionData: {
    sessionId: string;
    startTime: Date;
    totalInteractions: number;
  };
}

interface ConversationMemoryContextType {
  memory: ConversationMemory;
  updateMemory: (updates: Partial<ConversationMemory>) => void;
  addConversationEntry: (userInput: string, agentResponse: string, agentType: string) => void;
  getContextualInfo: () => any;
  clearMemory: () => void;
}

const ConversationMemoryContext = createContext<ConversationMemoryContextType | undefined>(undefined);

const initialMemory: ConversationMemory = {
  userPreferences: {
    preferredLanguage: 'kn',
  },
  currentContext: {
    lastInquiry: '',
    lastAgent: 'main-agent',
    conversationHistory: [],
    pendingInfo: {},
  },
  sessionData: {
    // Use a persistent session ID stored in localStorage, or find active session from FUSION
    sessionId: (() => {
      // First, try localStorage
      const stored = localStorage.getItem('convei_session_id');
      if (stored) {
        const sessionTime = parseInt(stored.split('_').pop() || '0');
        const oneHourAgo = Date.now() - 3600000;
        if (sessionTime > oneHourAgo) {
          return stored;
        }
      }
      
      // If no valid stored session, try to find active session from FUSION API
      // This is async, so we'll do it in useEffect instead
      // For now, create a new one but we'll update it
      const newSessionId = `convei_session_${Date.now()}`;
      localStorage.setItem('convei_session_id', newSessionId);
      return newSessionId;
    })(),
    startTime: new Date(),
    totalInteractions: 0,
  },
};

export const ConversationMemoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [memory, setMemory] = useState<ConversationMemory>(initialMemory);
  
  // Try to find active session from FUSION API on mount
  useEffect(() => {
    const findActiveSession = async () => {
      try {
        const fusionApiUrl = process.env.REACT_APP_FUSION_API_URL || 'http://localhost:8083';
        const currentSessionId = memory.sessionData.sessionId;
        
        // Check if current session has data
        const response = await fetch(
          `${fusionApiUrl}/api/metrics/current/${currentSessionId}`,
          { method: 'GET', headers: { 'Content-Type': 'application/json' } }
        );
        
        // If current session has no data, try to find one that does
        if (!response.ok || response.status === 404) {
          // The collector is likely using a session from the last hour
          // Try to find it by checking recent session IDs
          const oneHourAgo = Date.now() - 3600000;
          let foundSession = null;
          
          // Check sessions in 1-minute intervals over the last hour
          for (let offset = 0; offset < 60; offset++) {
            const testTime = oneHourAgo + (offset * 60000);
            const testSessionId = `convei_session_${testTime}`;
            
            try {
              const testResponse = await fetch(
                `${fusionApiUrl}/api/metrics/current/${testSessionId}`,
                { method: 'GET', headers: { 'Content-Type': 'application/json' } }
              );
              
              if (testResponse.ok) {
                foundSession = testSessionId;
                break;
              }
            } catch (e) {
              // Continue searching
            }
          }
          
          // If we found a session with data, use it
          if (foundSession) {
            console.log('🔑 Found active session with data:', foundSession);
            localStorage.setItem('convei_session_id', foundSession);
            setMemory(prev => ({
              ...prev,
              sessionData: {
                ...prev.sessionData,
                sessionId: foundSession
              }
            }));
          } else {
            console.log('🔑 No active session found, using:', currentSessionId);
          }
        } else {
          console.log('🔑 Current session has data:', currentSessionId);
        }
      } catch (error) {
        console.warn('Could not find active session from FUSION:', error);
      }
    };
    
    findActiveSession();
  }, []); // Only run once on mount

  const updateMemory = useCallback((updates: Partial<ConversationMemory>) => {
    setMemory(prev => {
      // Only update if there are actual changes
      const hasChanges = Object.keys(updates).some(key => {
        const updateValue = updates[key as keyof ConversationMemory];
        const prevValue = prev[key as keyof ConversationMemory];
        return JSON.stringify(updateValue) !== JSON.stringify(prevValue);
      });
      
      if (!hasChanges) return prev;
      
      return {
        ...prev,
        ...updates,
        // Deep merge for nested objects only when they exist
        userPreferences: updates.userPreferences ? { ...prev.userPreferences, ...updates.userPreferences } : prev.userPreferences,
        currentContext: updates.currentContext ? { ...prev.currentContext, ...updates.currentContext } : prev.currentContext,
        sessionData: updates.sessionData ? { ...prev.sessionData, ...updates.sessionData } : prev.sessionData,
      };
    });
  }, []);

  const addConversationEntry = useCallback((userInput: string, agentResponse: string, agentType: string) => {
    setMemory(prev => ({
      ...prev,
      currentContext: {
        ...prev.currentContext,
        lastInquiry: userInput,
        lastAgent: agentType,
        conversationHistory: [
          ...prev.currentContext.conversationHistory,
          {
            timestamp: new Date(),
            userInput,
            agentResponse,
            agentType,
          },
        ].slice(-10), // Keep only last 10 conversations
      },
      sessionData: {
        ...prev.sessionData,
        totalInteractions: prev.sessionData.totalInteractions + 1,
      },
    }));
  }, []);

  const getContextualInfo = useCallback(() => {
    const recentHistory = memory.currentContext.conversationHistory.slice(-3);
    const lastConversation = recentHistory[recentHistory.length - 1];
    
    return {
      recentHistory,
      lastConversation,
      pendingInfo: memory.currentContext.pendingInfo,
      userPreferences: memory.userPreferences,
      sessionInfo: memory.sessionData,
    };
  }, [memory]);

  const clearMemory = useCallback(() => {
    setMemory(initialMemory);
  }, []);

  return (
    <ConversationMemoryContext.Provider 
      value={{ 
        memory, 
        updateMemory, 
        addConversationEntry, 
        getContextualInfo, 
        clearMemory 
      }}
    >
      {children}
    </ConversationMemoryContext.Provider>
  );
};

export const useConversationMemory = () => {
  const context = useContext(ConversationMemoryContext);
  if (!context) {
    throw new Error('useConversationMemory must be used within a ConversationMemoryProvider');
  }
  return context;
};
