"""
Advanced Metrics Processor
Deep emotional intelligence processing for human-like understanding
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import Counter
from db.models import MetricsDatabase

logger = logging.getLogger(__name__)


class MetricsProcessor:
    """Advanced processor for emotionally intelligent CONVEI context"""
    
    # Emotional complexity mapping
    EMOTION_VALENCE = {
        'happy': 1.0,
        'surprise': 0.5,
        'neutral': 0.0,
        'sad': -0.5,
        'fear': -0.7,
        'angry': -0.8,
        'disgust': -0.6
    }
    
    # Emotion intensity indicators
    INTENSITY_THRESHOLDS = {
        'attention_high': 75,
        'attention_low': 35,
        'sentiment_strong': 0.4,
        'engagement_high': 0.7
    }
    
    def __init__(self, db: MetricsDatabase):
        self.db = db
        self.emotional_memory: List[Dict[str, Any]] = []
    
    def get_context_for_convei(self, session_id: str, time_window: int = 30) -> Dict[str, Any]:
        """
        Get emotionally intelligent context for CONVEI
        """
        try:
            current_time = datetime.now().timestamp()
            start_time = current_time - time_window
            
            # Get current metrics
            current = self.db.get_current_metrics(session_id)
            
            # Fallback to most recent if none in window
            if not current:
                all_metrics = self.db.get_metrics_range(session_id, 0, current_time)
                if all_metrics:
                    current = all_metrics[-1]
            
            # Get historical for trends
            metrics_range = self.db.get_metrics_range(session_id, start_time, current_time)
            
            # Deep emotional analysis
            emotional_state = self._analyze_emotional_state(current)
            emotional_trends = self._analyze_emotional_trends(metrics_range)
            behavioral_patterns = self._detect_behavioral_patterns(metrics_range)
            conversation_guidance = self._generate_conversation_guidance(emotional_state, emotional_trends)
            
            context = {
                "current_state": self._format_current_state(current, emotional_state),
                "recent_trends": emotional_trends,
                "behavioral_patterns": behavioral_patterns,
                "behavioral_insights": self._generate_deep_insights(current, metrics_range, emotional_state),
                "recommendations": self._generate_smart_recommendations(emotional_state, emotional_trends, behavioral_patterns),
                "conversation_guidance": conversation_guidance,
                "emotional_intelligence": {
                    "primary_emotion": emotional_state.get('primary_emotion', 'neutral'),
                    "emotional_intensity": emotional_state.get('intensity', 'moderate'),
                    "emotional_valence": emotional_state.get('valence', 0),
                    "suggested_approach": conversation_guidance.get('approach', 'neutral'),
                    "empathy_level_needed": emotional_state.get('empathy_needed', 'moderate')
                }
            }
            
            return context
        except Exception as e:
            logger.error(f"Error getting context for CONVEI: {e}")
            return {}
    
    def _analyze_emotional_state(self, current: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Deep analysis of current emotional state"""
        if not current:
            return {
                'primary_emotion': 'neutral',
                'intensity': 'mild',
                'valence': 0,
                'empathy_needed': 'low',
                'complexity': 'simple'
            }
        
        emotion = current.get("unified_emotion", "neutral").lower()
        sentiment = current.get("unified_sentiment", 0.0)
        attention_score = current.get("attention_score", 50.0)
        fatigue = current.get("unified_fatigue", "Normal")
        engagement = current.get("engagement_level", "medium")
        
        # Calculate emotional valence
        valence = self.EMOTION_VALENCE.get(emotion, 0)
        
        # Adjust valence with sentiment
        combined_valence = (valence + sentiment) / 2
        
        # Determine intensity
        intensity = 'mild'
        if abs(sentiment) > self.INTENSITY_THRESHOLDS['sentiment_strong']:
            intensity = 'strong'
        elif attention_score > self.INTENSITY_THRESHOLDS['attention_high'] or attention_score < self.INTENSITY_THRESHOLDS['attention_low']:
            intensity = 'strong'
        elif abs(sentiment) > 0.2:
            intensity = 'moderate'
        
        # Determine empathy level needed
        empathy_needed = 'low'
        if emotion in ['sad', 'fear', 'angry']:
            empathy_needed = 'high'
            if intensity == 'strong':
                empathy_needed = 'very_high'
        elif emotion in ['surprise', 'happy'] and intensity == 'strong':
            empathy_needed = 'moderate'
        
        # Emotional complexity
        complexity = 'simple'
        if fatigue != 'Normal' and emotion != 'neutral':
            complexity = 'complex'
        if emotion in ['sad', 'angry'] and sentiment > 0:
            complexity = 'mixed'  # Mixed signals
        
        return {
            'primary_emotion': emotion,
            'intensity': intensity,
            'valence': combined_valence,
            'empathy_needed': empathy_needed,
            'complexity': complexity,
            'fatigue_factor': fatigue != 'Normal',
            'engagement_level': engagement,
            'attention_quality': 'high' if attention_score > 70 else 'low' if attention_score < 40 else 'moderate'
        }
    
    def _analyze_emotional_trends(self, metrics_range: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze emotional patterns over time"""
        if not metrics_range or len(metrics_range) < 2:
            return {
                'emotion_stability': 'unknown',
                'sentiment_direction': 'stable',
                'attention_pattern': 'unknown',
                'emotional_arc': 'flat'
            }
        
        emotions = [m.get("unified_emotion", "neutral") for m in metrics_range]
        sentiments = [m.get("unified_sentiment", 0) for m in metrics_range if m.get("unified_sentiment") is not None]
        attention_scores = [m.get("attention_score", 50) for m in metrics_range if m.get("attention_score") is not None]
        
        # Emotion stability
        unique_emotions = len(set(emotions))
        stability = 'stable' if unique_emotions <= 2 else 'moderate' if unique_emotions <= 4 else 'volatile'
        
        # Sentiment direction
        sentiment_direction = 'stable'
        if len(sentiments) >= 3:
            first_half = sum(sentiments[:len(sentiments)//2]) / max(len(sentiments)//2, 1)
            second_half = sum(sentiments[len(sentiments)//2:]) / max(len(sentiments) - len(sentiments)//2, 1)
            if second_half > first_half + 0.2:
                sentiment_direction = 'improving'
            elif second_half < first_half - 0.2:
                sentiment_direction = 'declining'
        
        # Attention pattern
        attention_pattern = 'consistent'
        if len(attention_scores) >= 3:
            variance = sum((x - sum(attention_scores)/len(attention_scores))**2 for x in attention_scores) / len(attention_scores)
            if variance > 400:
                attention_pattern = 'fluctuating'
            elif attention_scores[-1] < attention_scores[0] - 15:
                attention_pattern = 'declining'
            elif attention_scores[-1] > attention_scores[0] + 15:
                attention_pattern = 'improving'
        
        # Emotional arc (narrative)
        dominant_first = Counter(emotions[:len(emotions)//2]).most_common(1)
        dominant_second = Counter(emotions[len(emotions)//2:]).most_common(1)
        
        emotional_arc = 'flat'
        if dominant_first and dominant_second:
            first_emotion = dominant_first[0][0]
            second_emotion = dominant_second[0][0]
            first_valence = self.EMOTION_VALENCE.get(first_emotion, 0)
            second_valence = self.EMOTION_VALENCE.get(second_emotion, 0)
            
            if second_valence > first_valence + 0.3:
                emotional_arc = 'brightening'
            elif second_valence < first_valence - 0.3:
                emotional_arc = 'darkening'
            elif second_emotion != first_emotion:
                emotional_arc = 'shifting'
        
        return {
            'emotion_stability': stability,
            'sentiment_direction': sentiment_direction,
            'attention_pattern': attention_pattern,
            'emotional_arc': emotional_arc,
            'dominant_emotion': Counter(emotions).most_common(1)[0][0] if emotions else 'neutral',
            'emotion_sequence': emotions[-5:] if len(emotions) >= 5 else emotions
        }
    
    def _detect_behavioral_patterns(self, metrics_range: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Detect behavioral patterns for deeper understanding"""
        if not metrics_range or len(metrics_range) < 3:
            return {'patterns_detected': False}
        
        patterns = {
            'patterns_detected': True,
            'micro_expressions': [],
            'engagement_drops': [],
            'stress_indicators': [],
            'positive_moments': []
        }
        
        for i, metric in enumerate(metrics_range):
            emotion = metric.get("unified_emotion", "neutral")
            fatigue = metric.get("unified_fatigue", "Normal")
            attention = metric.get("attention_score", 50)
            sentiment = metric.get("unified_sentiment", 0)
            
            # Detect stress indicators
            if fatigue in ['Moderate', 'Severe'] or (emotion in ['angry', 'fear'] and attention > 60):
                patterns['stress_indicators'].append({
                    'index': i,
                    'type': 'stress',
                    'factors': [fatigue, emotion]
                })
            
            # Detect engagement drops
            if i > 0:
                prev_attention = metrics_range[i-1].get("attention_score", 50)
                if attention < prev_attention - 20:
                    patterns['engagement_drops'].append({
                        'index': i,
                        'drop_amount': prev_attention - attention
                    })
            
            # Detect positive moments
            if emotion == 'happy' or sentiment > 0.4:
                patterns['positive_moments'].append({
                    'index': i,
                    'emotion': emotion,
                    'sentiment': sentiment
                })
        
        # Summarize patterns
        patterns['summary'] = {
            'stress_count': len(patterns['stress_indicators']),
            'engagement_drops_count': len(patterns['engagement_drops']),
            'positive_moments_count': len(patterns['positive_moments']),
            'overall_health': self._assess_conversation_health(patterns)
        }
        
        return patterns
    
    def _assess_conversation_health(self, patterns: Dict[str, Any]) -> str:
        """Assess overall conversation health"""
        stress = len(patterns.get('stress_indicators', []))
        drops = len(patterns.get('engagement_drops', []))
        positive = len(patterns.get('positive_moments', []))
        
        if positive > stress + drops:
            return 'positive'
        elif stress > 3 or drops > 3:
            return 'concerning'
        elif stress > 0 or drops > 0:
            return 'mixed'
        return 'neutral'
    
    def _generate_conversation_guidance(self, emotional_state: Dict[str, Any], trends: Dict[str, Any]) -> Dict[str, Any]:
        """Generate smart conversation guidance"""
        emotion = emotional_state.get('primary_emotion', 'neutral')
        intensity = emotional_state.get('intensity', 'moderate')
        empathy_needed = emotional_state.get('empathy_needed', 'moderate')
        arc = trends.get('emotional_arc', 'flat')
        
        guidance = {
            'approach': 'neutral',
            'tone': 'warm',
            'pace': 'normal',
            'techniques': [],
            'avoid': []
        }
        
        # Emotion-specific guidance
        if emotion == 'sad':
            guidance['approach'] = 'supportive'
            guidance['tone'] = 'gentle'
            guidance['pace'] = 'slow'
            guidance['techniques'] = [
                'Validate feelings first',
                'Use phrases like "I can see..." or "It sounds like..."',
                'Give space for silence',
                'Ask open questions gently'
            ]
            guidance['avoid'] = [
                'Rushing to solutions',
                'Minimizing their feelings',
                'Being overly cheerful'
            ]
        elif emotion == 'angry':
            guidance['approach'] = 'calm_presence'
            guidance['tone'] = 'understanding'
            guidance['pace'] = 'measured'
            guidance['techniques'] = [
                'Acknowledge frustration immediately',
                'Use "I understand" statements',
                'Let them vent if needed',
                'Find common ground'
            ]
            guidance['avoid'] = [
                'Defensive responses',
                'Matching their anger',
                'Dismissing concerns'
            ]
        elif emotion == 'fear':
            guidance['approach'] = 'reassuring'
            guidance['tone'] = 'steady'
            guidance['pace'] = 'calm'
            guidance['techniques'] = [
                'Break things into small steps',
                'Provide clear information',
                'Offer consistent support',
                'Use grounding language'
            ]
            guidance['avoid'] = [
                'Adding complexity',
                'Dismissing fears',
                'Overwhelming with information'
            ]
        elif emotion == 'happy':
            guidance['approach'] = 'celebratory'
            guidance['tone'] = 'enthusiastic'
            guidance['pace'] = 'energetic'
            guidance['techniques'] = [
                'Match their energy',
                'Celebrate with them',
                'Ask follow-up questions',
                'Share in their joy'
            ]
            guidance['avoid'] = [
                'Being too reserved',
                'Changing subject abruptly'
            ]
        elif emotion == 'surprise':
            guidance['approach'] = 'curious'
            guidance['tone'] = 'engaged'
            guidance['pace'] = 'responsive'
            guidance['techniques'] = [
                'Explore what surprised them',
                'Show genuine interest',
                'Give them time to process'
            ]
        
        # Intensity adjustments
        if intensity == 'strong':
            guidance['techniques'].append('Give extra space for expression')
            guidance['techniques'].append('Respond with heightened empathy')
        
        # Arc-based adjustments
        if arc == 'brightening':
            guidance['techniques'].append('Note and acknowledge the positive shift')
        elif arc == 'darkening':
            guidance['techniques'].append('Gently check in on how they\'re doing')
        
        return guidance
    
    def _format_current_state(self, current: Optional[Dict[str, Any]], emotional_state: Dict[str, Any]) -> Dict[str, Any]:
        """Format current state with emotional intelligence"""
        if not current:
            return {
                "emotion": "neutral",
                "attention": "Unknown",
                "engagement": "medium",
                "sentiment": 0.0,
                "confidence": "medium",
                "emotional_context": "No data available"
            }
        
        emotion = current.get("unified_emotion", "neutral")
        
        return {
            "emotion": emotion,
            "attention": current.get("unified_attention", "Unknown"),
            "attention_score": current.get("attention_score", 50.0),
            "engagement": current.get("engagement_level", "medium"),
            "sentiment": current.get("unified_sentiment", 0.0),
            "confidence": current.get("unified_confidence", "medium"),
            "fatigue": current.get("unified_fatigue", "Normal"),
            "posture": current.get("unified_posture", "Unknown"),
            "movement": current.get("unified_movement", "Unknown"),
            # Emotional intelligence additions
            "emotional_intensity": emotional_state.get('intensity', 'moderate'),
            "empathy_level_needed": emotional_state.get('empathy_needed', 'moderate'),
            "emotional_complexity": emotional_state.get('complexity', 'simple'),
            "emotional_context": self._create_emotional_context_string(emotion, emotional_state)
        }
    
    def _create_emotional_context_string(self, emotion: str, emotional_state: Dict[str, Any]) -> str:
        """Create human-readable emotional context"""
        intensity = emotional_state.get('intensity', 'moderate')
        empathy = emotional_state.get('empathy_needed', 'moderate')
        
        contexts = {
            'happy': f"User is expressing {intensity} happiness - share in their joy!",
            'sad': f"User appears {intensity}ly sad - approach with gentle empathy",
            'angry': f"User shows {intensity} frustration - stay calm and validate",
            'fear': f"User seems {intensity}ly anxious - provide reassurance",
            'surprise': f"User is {intensity}ly surprised - explore what caught their attention",
            'neutral': "User is calm and attentive - good opportunity for engagement",
            'disgust': f"User shows {intensity} discomfort - check what's bothering them"
        }
        
        return contexts.get(emotion, "User's emotional state is nuanced - pay close attention")
    
    def _generate_deep_insights(self, current: Optional[Dict[str, Any]], metrics_range: List[Dict[str, Any]], emotional_state: Dict[str, Any]) -> List[str]:
        """Generate deep behavioral insights"""
        insights = []
        
        if not current:
            return ["Awaiting behavioral data for insights"]
        
        emotion = current.get("unified_emotion", "neutral")
        intensity = emotional_state.get('intensity', 'moderate')
        complexity = emotional_state.get('complexity', 'simple')
        attention_quality = emotional_state.get('attention_quality', 'moderate')
        
        # Emotion-specific insights
        if emotion in ['sad', 'fear', 'angry']:
            insights.append(f"User is experiencing {emotion} with {intensity} intensity - emotional support may be beneficial")
        elif emotion == 'happy':
            insights.append(f"User is in a positive emotional state - great moment for meaningful connection")
        
        # Complexity insights
        if complexity == 'mixed':
            insights.append("User is showing mixed emotional signals - there may be underlying concerns")
        elif complexity == 'complex':
            insights.append("User's emotional state is complex - fatigue may be affecting their mood")
        
        # Attention insights
        attention_score = current.get("attention_score", 50)
        if attention_score < 35:
            insights.append("User attention is low - consider re-engaging or checking if they need a break")
        elif attention_score > 80:
            insights.append("User is highly focused - they're deeply engaged in the conversation")
        
        # Fatigue insights
        fatigue = current.get("unified_fatigue", "Normal")
        if fatigue in ["Moderate", "Severe"]:
            insights.append(f"User shows {fatigue.lower()} fatigue - shorter, gentler interactions recommended")
        
        # Engagement insights
        engagement = current.get("engagement_level", "medium")
        if engagement == "low":
            insights.append("Engagement is dropping - try asking an open question or changing topic")
        elif engagement == "high":
            insights.append("User is highly engaged - they're invested in this conversation")
        
        # Pattern insights from history
        if len(metrics_range) >= 5:
            emotions = [m.get("unified_emotion", "neutral") for m in metrics_range[-5:]]
            if len(set(emotions)) >= 4:
                insights.append("User's emotions have been variable - they may be processing complex feelings")
        
        return insights if insights else ["User appears stable - continue with natural conversation flow"]
    
    def _generate_smart_recommendations(self, emotional_state: Dict[str, Any], trends: Dict[str, Any], patterns: Dict[str, Any]) -> List[str]:
        """Generate smart, actionable recommendations"""
        recommendations = []
        
        emotion = emotional_state.get('primary_emotion', 'neutral')
        intensity = emotional_state.get('intensity', 'moderate')
        empathy_needed = emotional_state.get('empathy_needed', 'moderate')
        arc = trends.get('emotional_arc', 'flat')
        
        # Core emotional recommendations
        if emotion == 'sad' and empathy_needed in ['high', 'very_high']:
            recommendations.append("🫂 Lead with empathy - acknowledge their feelings before anything else")
            recommendations.append("🗣️ Use validating phrases: 'I can see you're going through something...'")
        elif emotion == 'angry':
            recommendations.append("😌 Stay calm and don't match their frustration")
            recommendations.append("👂 Let them express fully before responding")
        elif emotion == 'fear':
            recommendations.append("🤝 Be a steady, reassuring presence")
            recommendations.append("📋 Break complex things into simple steps")
        elif emotion == 'happy':
            recommendations.append("🎉 Match their positive energy!")
            recommendations.append("❓ Ask about what's making them happy")
        
        # Intensity-based recommendations
        if intensity == 'strong':
            recommendations.append("💡 Give extra space for emotional expression")
        
        # Trend-based recommendations
        if arc == 'darkening':
            recommendations.append("🔍 Check in: 'How are you feeling about all this?'")
        elif arc == 'brightening':
            recommendations.append("✨ Acknowledge the positive shift you're seeing")
        
        # Pattern-based recommendations
        if patterns.get('patterns_detected'):
            summary = patterns.get('summary', {})
            if summary.get('stress_count', 0) > 2:
                recommendations.append("⚠️ Multiple stress indicators detected - consider offering a break")
            if summary.get('engagement_drops_count', 0) > 2:
                recommendations.append("📉 Engagement dropping - try a more engaging approach")
        
        # Fatigue-based recommendations
        if emotional_state.get('fatigue_factor'):
            recommendations.append("😴 User seems tired - keep responses concise and gentle")
        
        return recommendations if recommendations else ["👍 Continue with your natural, empathetic approach"]
