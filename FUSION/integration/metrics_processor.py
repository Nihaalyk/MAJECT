"""
Metrics Processor
Processes and aggregates behavioral metrics for CONVEI context
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from db.models import MetricsDatabase

logger = logging.getLogger(__name__)


class MetricsProcessor:
    """Processes metrics for CONVEI context"""
    
    def __init__(self, db: MetricsDatabase):
        self.db = db
    
    def get_context_for_convei(self, session_id: str, time_window: int = 30) -> Dict[str, Any]:
        """
        Get formatted context for CONVEI agents
        
        Args:
            session_id: Session identifier
            time_window: Time window in seconds to look back
        
        Returns:
            Dictionary with behavioral context formatted for CONVEI
        """
        try:
            current_time = datetime.now().timestamp()
            start_time = current_time - time_window
            
            # Get current metrics (most recent, regardless of time window)
            current = self.db.get_current_metrics(session_id)
            
            # If no current metrics, try to get the most recent one from any time
            if not current:
                # Get the absolute most recent metric for this session
                metrics_range_all = self.db.get_metrics_range(session_id, 0, current_time)
                if metrics_range_all:
                    # Use the most recent one
                    current = metrics_range_all[-1]
            
            # Get metrics for time window (for trends)
            metrics_range = self.db.get_metrics_range(session_id, start_time, current_time)
            
            # Process and format
            context = {
                "current_state": self._format_current_state(current),
                "recent_trends": self._calculate_trends(metrics_range),
                "behavioral_insights": self._generate_insights(current, metrics_range),
                "recommendations": self._generate_recommendations(current, metrics_range)
            }
            
            return context
        except Exception as e:
            logger.error(f"Error getting context for CONVEI: {e}")
            return {}
    
    def _format_current_state(self, current: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Format current state for CONVEI"""
        if not current:
            return {
                "emotion": "neutral",
                "attention": "Unknown",
                "engagement": "medium",
                "sentiment": 0.0,
                "confidence": "medium"
            }
        
        return {
            "emotion": current.get("unified_emotion", "neutral"),
            "attention": current.get("unified_attention", "Unknown"),
            "attention_score": current.get("attention_score", 50.0),
            "engagement": current.get("engagement_level", "medium"),
            "sentiment": current.get("unified_sentiment", 0.0),
            "confidence": current.get("unified_confidence", "medium"),
            "fatigue": current.get("unified_fatigue", "Normal"),
            "posture": current.get("unified_posture", "Unknown"),
            "movement": current.get("unified_movement", "Unknown")
        }
    
    def _calculate_trends(self, metrics_range: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate trends from metrics range"""
        if not metrics_range:
            return {}
        
        # Extract values
        emotions = [m.get("unified_emotion") for m in metrics_range if m.get("unified_emotion")]
        sentiments = [m.get("unified_sentiment") for m in metrics_range if m.get("unified_sentiment") is not None]
        attention_scores = [m.get("attention_score") for m in metrics_range if m.get("attention_score") is not None]
        
        # Calculate trends
        trends = {
            "emotion_trend": self._get_dominant_emotion(emotions),
            "sentiment_trend": self._calculate_sentiment_trend(sentiments),
            "attention_trend": self._calculate_attention_trend(attention_scores),
            "stability": self._calculate_stability(metrics_range)
        }
        
        return trends
    
    def _get_dominant_emotion(self, emotions: List[str]) -> str:
        """Get most common emotion"""
        if not emotions:
            return "neutral"
        from collections import Counter
        return Counter(emotions).most_common(1)[0][0]
    
    def _calculate_sentiment_trend(self, sentiments: List[float]) -> str:
        """Calculate sentiment trend"""
        if len(sentiments) < 2:
            return "stable"
        
        recent_avg = sum(sentiments[-5:]) / len(sentiments[-5:])
        earlier_avg = sum(sentiments[:5]) / len(sentiments[:5]) if len(sentiments) >= 10 else sentiments[0]
        
        if recent_avg > earlier_avg + 0.2:
            return "improving"
        elif recent_avg < earlier_avg - 0.2:
            return "declining"
        else:
            return "stable"
    
    def _calculate_attention_trend(self, attention_scores: List[float]) -> str:
        """Calculate attention trend"""
        if len(attention_scores) < 2:
            return "stable"
        
        recent_avg = sum(attention_scores[-5:]) / len(attention_scores[-5:])
        earlier_avg = sum(attention_scores[:5]) / len(attention_scores[:5]) if len(attention_scores) >= 10 else attention_scores[0]
        
        if recent_avg > earlier_avg + 10:
            return "improving"
        elif recent_avg < earlier_avg - 10:
            return "declining"
        else:
            return "stable"
    
    def _calculate_stability(self, metrics_range: List[Dict[str, Any]]) -> str:
        """Calculate overall stability"""
        if len(metrics_range) < 5:
            return "unknown"
        
        # Check variance in key metrics
        emotions = [m.get("unified_emotion") for m in metrics_range]
        unique_emotions = len(set(emotions))
        
        if unique_emotions <= 2:
            return "stable"
        elif unique_emotions <= 4:
            return "moderate"
        else:
            return "unstable"
    
    def _generate_insights(self, current: Optional[Dict[str, Any]], metrics_range: List[Dict[str, Any]]) -> List[str]:
        """Generate behavioral insights"""
        insights = []
        
        if not current:
            return ["No behavioral data available"]
        
        # Emotion insights
        emotion = current.get("unified_emotion", "neutral")
        if emotion in ["sad", "angry", "fear"]:
            insights.append(f"User appears to be experiencing {emotion} emotions")
        
        # Attention insights
        attention_score = current.get("attention_score", 50.0)
        if attention_score < 40:
            insights.append("User attention level is low - may be distracted")
        elif attention_score > 80:
            insights.append("User is highly focused and engaged")
        
        # Engagement insights
        engagement = current.get("engagement_level", "medium")
        if engagement == "low":
            insights.append("User engagement is low - consider adjusting conversation approach")
        
        # Fatigue insights
        fatigue = current.get("unified_fatigue", "Normal")
        if fatigue in ["Moderate", "Severe"]:
            insights.append(f"User shows signs of {fatigue.lower()} fatigue")
        
        # Sentiment insights
        sentiment = current.get("unified_sentiment", 0.0)
        if sentiment < -0.3:
            insights.append("User sentiment is negative - may need support or clarification")
        elif sentiment > 0.3:
            insights.append("User sentiment is positive - conversation is going well")
        
        return insights if insights else ["No significant behavioral patterns detected"]
    
    def _generate_recommendations(self, current: Optional[Dict[str, Any]], metrics_range: List[Dict[str, Any]]) -> List[str]:
        """Generate recommendations for CONVEI agent"""
        recommendations = []
        
        if not current:
            return ["Continue normal conversation"]
        
        # Attention-based recommendations
        attention_score = current.get("attention_score", 50.0)
        if attention_score < 40:
            recommendations.append("User appears distracted - try to re-engage with a direct question")
        
        # Engagement-based recommendations
        engagement = current.get("engagement_level", "medium")
        if engagement == "low":
            recommendations.append("Consider using more engaging language or asking follow-up questions")
        
        # Emotion-based recommendations
        emotion = current.get("unified_emotion", "neutral")
        if emotion == "sad":
            recommendations.append("User seems sad - show empathy and offer support")
        elif emotion == "angry":
            recommendations.append("User appears frustrated - be patient and understanding")
        
        # Fatigue-based recommendations
        fatigue = current.get("unified_fatigue", "Normal")
        if fatigue in ["Moderate", "Severe"]:
            recommendations.append("User shows fatigue - consider shorter responses or offering a break")
        
        # Sentiment-based recommendations
        sentiment = current.get("unified_sentiment", 0.0)
        if sentiment < -0.3:
            recommendations.append("Negative sentiment detected - clarify understanding and address concerns")
        
        return recommendations if recommendations else ["Continue with current conversation approach"]

