/**
 * Pulsating AI Avatar Component
 * Animated avatar that pulses to show the AI is active and thinking
 */

import React from 'react';
import './PulsatingAvatar.scss';

interface PulsatingAvatarProps {
  size?: number;
  isActive?: boolean;
  emotion?: string;
  className?: string;
}

export const PulsatingAvatar: React.FC<PulsatingAvatarProps> = ({ 
  size = 48, 
  isActive = true,
  emotion = 'neutral',
  className = '' 
}) => {
  // Get emoji based on emotion
  const getEmotionEmoji = (emotion: string): string => {
    const emotionMap: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      fear: '😨',
      surprise: '😲',
      disgust: '🤢',
      neutral: '🤖',
      confused: '😕',
      tired: '😴'
    };
    return emotionMap[emotion.toLowerCase()] || emotionMap.neutral;
  };

  return (
    <div 
      className={`pulsating-avatar ${isActive ? 'active' : ''} ${className}`}
      style={{ width: size, height: size }}
      aria-label="AI Assistant Avatar"
    >
      <div className="avatar-pulse-ring"></div>
      <div className="avatar-pulse-ring delay-1"></div>
      <div className="avatar-pulse-ring delay-2"></div>
      <div className="avatar-core">
        <span className="avatar-emoji" style={{ fontSize: `${size * 0.5}px` }}>
          {getEmotionEmoji(emotion)}
        </span>
      </div>
    </div>
  );
};

