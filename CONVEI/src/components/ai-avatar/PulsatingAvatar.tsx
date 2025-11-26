/**
 * Pulsating AI Avatar Component
 * Animated visual avatar that pulses to show the AI is active and thinking
 */

import React from 'react';
import './PulsatingAvatar.scss';

interface PulsatingAvatarProps {
  size?: number;
  isActive?: boolean;
  emotion?: string;
  className?: string;
  audioLevel?: number; // 0-1 normalized audio level (energy, pitch, or speech rate)
  audioEnergy?: number; // Raw audio energy
  audioPitch?: number; // Audio pitch
  speechRate?: number; // Speech rate
}

export const PulsatingAvatar: React.FC<PulsatingAvatarProps> = ({ 
  size = 48, 
  isActive = true,
  emotion = 'neutral',
  className = '',
  audioLevel = 0
}) => {
  // Calculate dynamic size based on audio level
  // Normalize audio level to 0-1 range, then scale between 0.95x and 1.4x for more visible effect
  const normalizedAudioLevel = Math.min(Math.max(audioLevel || 0, 0), 1);
  const sizeMultiplier = 0.95 + (normalizedAudioLevel * 0.45); // Range: 0.95 to 1.4
  const dynamicSize = size * sizeMultiplier;

  // Calculate pulse intensity based on audio
  const pulseIntensity = normalizedAudioLevel * 100; // 0-100%
  
  // Lower threshold for audio-active class to make it more sensitive
  const hasAudio = normalizedAudioLevel > 0.05;

  return (
    <div 
      className={`pulsating-avatar ${isActive ? 'active' : ''} ${className} ${hasAudio ? 'audio-active' : ''}`}
      style={{ 
        width: dynamicSize, 
        height: dynamicSize,
        '--audio-level': normalizedAudioLevel,
        '--pulse-intensity': `${pulseIntensity}%`
      } as React.CSSProperties}
      data-emotion={emotion}
      data-audio-level={normalizedAudioLevel.toFixed(3)}
      aria-label="AI Assistant Avatar"
    >
      <div className="avatar-pulse-ring"></div>
      <div className="avatar-pulse-ring delay-1"></div>
      <div className="avatar-pulse-ring delay-2"></div>
      <div className="avatar-core">
        <div className="avatar-visualization">
          {/* Animated circles representing neural activity */}
          <div className="neural-circle circle-1"></div>
          <div className="neural-circle circle-2"></div>
          <div className="neural-circle circle-3"></div>
          <div className="neural-circle circle-4"></div>
          
          {/* Central core */}
          <div className="avatar-center"></div>
          
          {/* Connecting lines */}
          <svg className="connection-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="50" y1="50" x2="30" y2="30" className="connection-line" />
            <line x1="50" y1="50" x2="70" y2="30" className="connection-line" />
            <line x1="50" y1="50" x2="30" y2="70" className="connection-line" />
            <line x1="50" y1="50" x2="70" y2="70" className="connection-line" />
          </svg>
        </div>
      </div>
    </div>
  );
};
