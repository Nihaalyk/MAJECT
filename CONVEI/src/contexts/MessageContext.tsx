import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'assistant' | 'transcription';
  isTranscription?: boolean;
}

interface MessageContextType {
  messages: Message[];
  addMessage: (content: string, type: 'user' | 'assistant' | 'transcription') => void;
  clearMessages: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessageContext = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = (content: string, type: 'user' | 'assistant' | 'transcription') => {
    const newMessage: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      content,
      timestamp: new Date(),
      type,
      isTranscription: type === 'transcription',
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <MessageContext.Provider value={{ messages, addMessage, clearMessages }}>
      {children}
    </MessageContext.Provider>
  );
};
