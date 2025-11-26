import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLiveAPIContext } from '../../contexts/LiveAPIContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLoggerStore } from '../../lib/store-logger';
// import { useTheme } from '../../contexts/ThemeContext'; // Unused for now
import Logger from '../logger/Logger';
import SettingsDialog from '../settings-dialog/SettingsDialog';
import Manual from './Manual';
import {
  LogIcon,
  ToolIcon,
  ConsoleIcon,
  SendIcon,
  StatusConnectedIcon,
  StatusDisconnectedIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ResponseIcon
} from '../icons/SvgIcons';
import './EnhancedConsole.scss';

interface ConsoleTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export const EnhancedConsole: React.FC = () => {
  const { connected, client } = useLiveAPIContext();
  const { t, language } = useLanguage();
  // const { theme } = useTheme(); // Unused for now
  const { log, logs } = useLoggerStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [textInput, setTextInput] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [consoleWidth, setConsoleWidth] = useState(500);

  // Update main layout when console opens/closes or resizes
  useEffect(() => {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      if (isOpen) {
        mainElement.style.marginRight = `${consoleWidth}px`;
        mainElement.style.transition = 'margin-right var(--transition-normal)';
      } else {
        mainElement.style.marginRight = '60px'; // Collapsed console width
        mainElement.style.transition = 'margin-right var(--transition-normal)';
      }
    }
  }, [isOpen, consoleWidth]);
  
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  const scrollToBottom = useCallback(() => {
    const container = consoleRef.current?.querySelector('.console-content');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [logs, scrollToBottom]);

  // Listen for log events
  useEffect(() => {
    client.on('log', log);
    return () => {
      client.off('log', log);
    };
  }, [client, log]);

  // Handle resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        const minWidth = 300;
        const maxWidth = window.innerWidth * 0.6;
        setConsoleWidth(Math.min(Math.max(newWidth, minWidth), maxWidth));
        
        // Update main layout margin
        const mainElement = document.querySelector('main');
        if (mainElement) {
          mainElement.style.marginRight = `${Math.min(Math.max(newWidth, minWidth), maxWidth)}px`;
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleSubmit = () => {
    if (textInput.trim() && connected) {
      client.send([{ text: textInput }]);
      setTextInput('');
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const tabs: ConsoleTab[] = [
    {
      id: 'logs',
      label: t('logs'),
      icon: <LogIcon size={16} />,
      component: <Logger filter="none" />
    },
    {
      id: 'tools',
      label: t('tool_use'),
      icon: <ToolIcon size={16} />,
      component: <Logger filter="tools" />
    },
    {
      id: 'manual',
      label: language === 'en' ? 'Manual' : 'Panduan',
      icon: <ResponseIcon size={16} />,
      component: <Manual />
    }
  ];

  return (
    <div 
      className={`enhanced-console ${isOpen ? 'open' : 'closed'}`}
      style={{ width: isOpen ? `${consoleWidth}px` : '60px' }}
    >
      {/* Header */}
      {isOpen ? (
        <div className="console-header">
          <div className="console-title">
            <ConsoleIcon size={16} className="console-icon" />
            <span className="console-text">{t('console_title')}</span>
          </div>
          
          <div className="console-controls">
            <SettingsDialog />
            <button
              className="toggle-button"
              onClick={() => setIsOpen(!isOpen)}
              title="Collapse Console"
            >
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="console-header-collapsed">
          <button
            className="toggle-button"
            onClick={() => setIsOpen(!isOpen)}
            title="Expand Console"
          >
            <ChevronLeftIcon size={14} />
          </button>
        </div>
      )}

      {/* Connection Status */}
      {isOpen && (
        <div className="connection-status">
        <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? <StatusConnectedIcon size={12} /> : <StatusDisconnectedIcon size={12} />}
          <span className="status-text">
            {connected ? t('streaming') : t('paused')}
          </span>
        </div>
        </div>
      )}

      {/* Tabs */}
      {isOpen && (
        <div className="console-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              data-tab={tab.id}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {isOpen && (
        <div className="console-content" ref={consoleRef}>
          {tabs.find(tab => tab.id === activeTab)?.component}
        </div>
      )}

      {/* Input Area */}
      {isOpen && (
        <div className="console-input">
          <div className="input-container">
            <textarea
              ref={inputRef}
              className="input-field"
              placeholder={t('type_something')}
              value={textInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={!connected}
              rows={1}
            />
            <button
              className="send-button"
              onClick={handleSubmit}
              disabled={!connected || !textInput.trim()}
              title="Send Message"
            >
              <SendIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Resize Handle */}
      {isOpen && (
        <div
          className="resize-handle"
          ref={resizeRef}
          onMouseDown={() => setIsResizing(true)}
        />
      )}
    </div>
  );
};
