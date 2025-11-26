/**
 * Conversation Memory Context
 * Maintains conversation state and memory across the session
 */

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface ConversationMemory {
  // User preferences
  userPreferences: {
    preferredLanguage: 'en' | 'ms';
    defaultService: string;
    lastUsedOrigin?: string;
    lastUsedDestination?: string;
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
      origin?: string;
      destination?: string;
      weight?: string;
      serviceType?: string;
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
    preferredLanguage: 'ms',
    defaultService: 'Pos Laju',
  },
  currentContext: {
    lastInquiry: '',
    lastAgent: 'main-agent',
    conversationHistory: [],
    pendingInfo: {},
  },
  sessionData: {
    sessionId: `session-${Date.now()}`,
    startTime: new Date(),
    totalInteractions: 0,
  },
};

export const ConversationMemoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [memory, setMemory] = useState<ConversationMemory>(initialMemory);

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
