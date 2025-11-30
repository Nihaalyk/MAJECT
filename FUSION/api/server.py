"""
FUSION API Server
RESTful API for accessing behavioral metrics
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any
import logging
from datetime import datetime
import sqlite3
import json

from db.models import MetricsDatabase
from integration.metrics_processor import MetricsProcessor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="FUSION API", version="1.0.0")

# CORS middleware for CONVEI frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "http://localhost:3001"],  # CONVEI dev server
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Initialize database and processor
db = MetricsDatabase()
processor = MetricsProcessor(db)


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "FUSION API - Behavioral Metrics Integration"}


@app.get("/api/metrics/current/{session_id}")
async def get_current_metrics(session_id: str):
    """Get current metrics for a session"""
    try:
        # If session_id is "current", find the latest session with metrics
        if session_id == "current":
            cursor = db.conn.cursor()
            cursor.execute("""
                SELECT session_id, MAX(timestamp) as last_time
                FROM unified_metrics
                GROUP BY session_id
                ORDER BY last_time DESC
                LIMIT 1
            """)
            result = cursor.fetchone()
            if result:
                session_id = result[0]
            else:
                raise HTTPException(status_code=404, detail="No metrics found")
        
        metrics = db.get_current_metrics(session_id)
        if not metrics:
            raise HTTPException(status_code=404, detail="No metrics found for session")
        return metrics
    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Error getting current metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/range/{session_id}")
async def get_metrics_range(
    session_id: str,
    start: Optional[float] = None,
    end: Optional[float] = None
):
    """Get metrics for a time range"""
    try:
        if not start:
            start = datetime.now().timestamp() - 60  # Default: last minute
        if not end:
            end = datetime.now().timestamp()
        
        metrics = db.get_metrics_range(session_id, start, end)
        return {"metrics": metrics, "count": len(metrics)}
    except Exception as e:
        logger.error(f"Error getting metrics range: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/context/{session_id}")
async def get_context_for_convei_get(
    session_id: str,
    window: int = 30,
    conversation_context: Optional[str] = None
):
    """Get formatted context for CONVEI agents (GET with optional conversation context)"""
    try:
        # If session_id is "current" or empty, use the latest session with metrics
        if session_id == "current" or not session_id:
            cursor = db.conn.cursor()
            cursor.execute("""
                SELECT session_id, MAX(timestamp) as last_time
                FROM unified_metrics
                GROUP BY session_id
                ORDER BY last_time DESC
                LIMIT 1
            """)
            result = cursor.fetchone()
            if result:
                session_id = result[0]
                logger.debug(f"Using latest session with metrics: {session_id}")
            else:
                session_id = "current_session"
        
        # Parse conversation context if provided
        conv_context = None
        if conversation_context:
            try:
                conv_context = json.loads(conversation_context)
            except:
                pass
        
        context = processor.get_context_for_convei(session_id, window, conv_context)
        return context
    except Exception as e:
        logger.error(f"Error getting context: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/metrics/context/{session_id}")
async def get_context_for_convei_post(
    request: Request,
    session_id: str,
    window: int = 30
):
    """Get formatted context for CONVEI agents (POST with conversation context in body)"""
    try:
        # If session_id is "current" or empty, use the latest session with metrics
        if session_id == "current" or not session_id:
            cursor = db.conn.cursor()
            cursor.execute("""
                SELECT session_id, MAX(timestamp) as last_time
                FROM unified_metrics
                GROUP BY session_id
                ORDER BY last_time DESC
                LIMIT 1
            """)
            result = cursor.fetchone()
            if result:
                session_id = result[0]
                logger.debug(f"Using latest session with metrics: {session_id}")
            else:
                session_id = "current_session"
        
        # Parse conversation context from request body
        conversation_context = None
        if request:
            try:
                body = await request.json()
                conversation_context = body.get('conversation_context')
            except:
                pass
        
        context = processor.get_context_for_convei(session_id, window, conversation_context)
        return context
    except Exception as e:
        logger.error(f"Error getting context: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/metrics/aggregated/{session_id}")
async def get_aggregated_metrics(
    session_id: str,
    window: int = 60
):
    """Get aggregated metrics for a time window"""
    try:
        end_time = datetime.now().timestamp()
        start_time = end_time - window
        
        metrics = db.get_metrics_range(session_id, start_time, end_time)
        
        if not metrics:
            return {"message": "No metrics in time window"}
        
        # Aggregate
        emotions = [m.get("unified_emotion") for m in metrics if m.get("unified_emotion")]
        sentiments = [m.get("unified_sentiment") for m in metrics if m.get("unified_sentiment") is not None]
        attention_scores = [m.get("attention_score") for m in metrics if m.get("attention_score") is not None]
        
        from collections import Counter
        dominant_emotion = Counter(emotions).most_common(1)[0][0] if emotions else "neutral"
        avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0.0
        avg_attention = sum(attention_scores) / len(attention_scores) if attention_scores else 50.0
        
        return {
            "window_seconds": window,
            "metric_count": len(metrics),
            "dominant_emotion": dominant_emotion,
            "average_sentiment": avg_sentiment,
            "average_attention": avg_attention,
            "time_range": {
                "start": start_time,
                "end": end_time
            }
        }
    except Exception as e:
        logger.error(f"Error getting aggregated metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/{session_id}")
async def get_session_report(session_id: str):
    """Get comprehensive behavioral report for a session"""
    try:
        logger.info(f"Report request for session_id: {session_id}")
        
        # If session_id is "current", find the latest session
        if session_id == "current" or session_id == "current_session":
            cursor = db.conn.cursor()
            # First try unified_metrics
            try:
                cursor.execute("""
                    SELECT session_id, MAX(timestamp) as last_time
                    FROM unified_metrics
                    GROUP BY session_id
                    ORDER BY last_time DESC
                    LIMIT 1
                """)
                result = cursor.fetchone()
                if result:
                    session_id = result[0]
                    logger.info(f"Found session in unified_metrics: {session_id}")
                else:
                    # Fallback: try video_metrics or audio_metrics
                    cursor.execute("""
                        SELECT session_id, MAX(timestamp) as last_time
                        FROM video_metrics
                        GROUP BY session_id
                        ORDER BY last_time DESC
                        LIMIT 1
                    """)
                    result = cursor.fetchone()
                    if result:
                        session_id = result[0]
                        logger.info(f"Found session in video_metrics: {session_id}")
                    else:
                        cursor.execute("""
                            SELECT session_id, MAX(timestamp) as last_time
                            FROM audio_metrics
                            GROUP BY session_id
                            ORDER BY last_time DESC
                            LIMIT 1
                        """)
                        result = cursor.fetchone()
                        if result:
                            session_id = result[0]
                            logger.info(f"Found session in audio_metrics: {session_id}")
                        else:
                            logger.warning("No sessions found in any metrics table")
                            raise HTTPException(status_code=404, detail="No session found in database. Please ensure BEVAL is running and collecting data.")
            except sqlite3.OperationalError as e:
                logger.error(f"Database error while finding session: {e}")
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        # Get all metrics for the session
        cursor = db.conn.cursor()
        try:
            cursor.execute("""
                SELECT * FROM unified_metrics
                WHERE session_id = ?
                ORDER BY timestamp ASC
            """, (session_id,))
            
            columns = [description[0] for description in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            logger.info(f"Found {len(rows)} unified_metrics for session {session_id}")
        except sqlite3.OperationalError as e:
            logger.error(f"Error querying unified_metrics: {e}")
            rows = []
            columns = []
        
        # If no unified_metrics, try to aggregate from video and audio metrics
        if not rows:
            logger.warning(f"No unified_metrics found for session {session_id}, trying to aggregate from individual metrics")
            
            # Get video metrics
            cursor.execute("""
                SELECT * FROM video_metrics
                WHERE session_id = ?
                ORDER BY timestamp ASC
            """, (session_id,))
            video_rows = cursor.fetchall()
            if video_rows:
                video_columns = [description[0] for description in cursor.description]
                video_metrics = [dict(zip(video_columns, row)) for row in video_rows]
            else:
                video_metrics = []
            
            # Get audio metrics
            cursor.execute("""
                SELECT * FROM audio_metrics
                WHERE session_id = ?
                ORDER BY timestamp ASC
            """, (session_id,))
            audio_rows = cursor.fetchall()
            if audio_rows:
                audio_columns = [description[0] for description in cursor.description]
                audio_metrics = [dict(zip(audio_columns, row)) for row in audio_rows]
            else:
                audio_metrics = []
            
            if not video_metrics and not audio_metrics:
                logger.warning(f"No metrics found for session {session_id} in any table")
                # Return a minimal report structure instead of 404
                return {
                    "session_id": session_id,
                    "total_data_points": 0,
                    "duration_seconds": 0,
                    "duration_formatted": "0m 0s",
                    "emotion_analysis": {
                        "distribution": {},
                        "dominant_emotion": "neutral",
                        "emotional_variety": 0,
                        "transitions_count": 0,
                        "emotional_stability": "insufficient_data"
                    },
                    "sentiment_analysis": {
                        "average": 0.0,
                        "min": 0.0,
                        "max": 0.0,
                        "overall": "neutral"
                    },
                    "attention_analysis": {
                        "average_score": 50.0,
                        "min_score": 0.0,
                        "max_score": 100.0,
                        "attention_quality": "insufficient_data"
                    },
                    "fatigue_analysis": {
                        "distribution": {},
                        "primary_state": "Normal"
                    },
                    "engagement_analysis": {
                        "distribution": {},
                        "primary_level": "medium"
                    },
                    "timeline": {
                        "emotion_transitions": [],
                        "first_emotion": "neutral",
                        "last_emotion": "neutral"
                    },
                    "raw_metrics_sample": [],
                    "message": "No behavioral data collected yet for this session. Please ensure BEVAL is running and collecting metrics."
                }
            
            # Create synthetic unified metrics from available data
            metrics = []
            # Combine video and audio metrics by timestamp (simplified approach)
            all_timestamps = set()
            if video_metrics:
                all_timestamps.update(m.get('timestamp', 0) for m in video_metrics)
            if audio_metrics:
                all_timestamps.update(m.get('timestamp', 0) for m in audio_metrics)
            
            for ts in sorted(all_timestamps):
                video_m = next((m for m in video_metrics if abs(m.get('timestamp', 0) - ts) < 1), None)
                audio_m = next((m for m in audio_metrics if abs(m.get('timestamp', 0) - ts) < 1), None)
                
                unified = {
                    'session_id': session_id,
                    'timestamp': ts,
                    'unified_emotion': video_m.get('emotion') if video_m else audio_m.get('emotion') if audio_m else 'neutral',
                    'unified_attention': video_m.get('attention_state') if video_m else None,
                    'unified_posture': video_m.get('posture_state') if video_m else None,
                    'unified_movement': video_m.get('movement_level') if video_m else None,
                    'unified_fatigue': video_m.get('fatigue_level') if video_m else None,
                    'unified_sentiment': audio_m.get('sentiment') if audio_m else None,
                    'attention_score': video_m.get('attention_score') if video_m else None,
                    'engagement_level': 'medium',
                    'video_data': video_m,
                    'audio_data': audio_m
                }
                metrics.append(unified)
        else:
            metrics = [dict(zip(columns, row)) for row in rows]
        
        # Parse JSON fields
        for metric in metrics:
            # Handle video_data
            if metric.get('video_data'):
                if isinstance(metric['video_data'], str):
                    try:
                        metric['video_data'] = json.loads(metric['video_data'])
                    except:
                        pass
                elif isinstance(metric['video_data'], dict):
                    # Already parsed
                    pass
            # Handle audio_data
            if metric.get('audio_data'):
                if isinstance(metric['audio_data'], str):
                    try:
                        metric['audio_data'] = json.loads(metric['audio_data'])
                    except:
                        pass
                elif isinstance(metric['audio_data'], dict):
                    # Already parsed
                    pass
            # Handle stress_indicators
            if metric.get('stress_indicators') and isinstance(metric['stress_indicators'], str):
                try:
                    metric['stress_indicators'] = json.loads(metric['stress_indicators'])
                except:
                    pass
        
        # Calculate aggregated stats
        emotions = [m.get("unified_emotion") for m in metrics if m.get("unified_emotion")]
        sentiments = [m.get("unified_sentiment") for m in metrics if m.get("unified_sentiment") is not None]
        attention_scores = [m.get("attention_score") for m in metrics if m.get("attention_score") is not None]
        fatigue_levels = [m.get("unified_fatigue") for m in metrics if m.get("unified_fatigue")]
        engagements = [m.get("engagement_level") for m in metrics if m.get("engagement_level")]
        
        from collections import Counter
        
        # Emotion distribution
        emotion_counts = Counter(emotions)
        emotion_distribution = {k: v for k, v in emotion_counts.most_common()}
        
        # Fatigue distribution
        fatigue_counts = Counter(fatigue_levels)
        
        # Engagement distribution
        engagement_counts = Counter(engagements)
        
        # Calculate emotion transitions
        emotion_transitions = []
        for i in range(1, len(emotions)):
            if emotions[i] != emotions[i-1]:
                emotion_transitions.append({
                    'from': emotions[i-1],
                    'to': emotions[i],
                    'index': i
                })
        
        # Session duration
        if len(metrics) >= 2:
            start_time = metrics[0].get('timestamp', 0)
            end_time = metrics[-1].get('timestamp', 0)
            duration_seconds = end_time - start_time
        else:
            duration_seconds = 0
        
        report = {
            "session_id": session_id,
            "total_data_points": len(metrics),
            "duration_seconds": duration_seconds,
            "duration_formatted": f"{int(duration_seconds // 60)}m {int(duration_seconds % 60)}s",
            "emotion_analysis": {
                "distribution": emotion_distribution,
                "dominant_emotion": emotion_counts.most_common(1)[0][0] if emotion_counts else "neutral",
                "emotional_variety": len(set(emotions)),
                "transitions_count": len(emotion_transitions),
                "emotional_stability": "stable" if len(emotion_transitions) < len(emotions) * 0.2 else "moderate" if len(emotion_transitions) < len(emotions) * 0.4 else "volatile"
            },
            "sentiment_analysis": {
                "average": sum(sentiments) / len(sentiments) if sentiments else 0.0,
                "min": min(sentiments) if sentiments else 0.0,
                "max": max(sentiments) if sentiments else 0.0,
                "overall": (
                    "positive" if (sentiments and sum(sentiments) / len(sentiments) > 0.2)
                    else "negative" if (sentiments and sum(sentiments) / len(sentiments) < -0.2)
                    else "neutral"
                )
            },
            "attention_analysis": {
                "average_score": sum(attention_scores) / len(attention_scores) if attention_scores else 50.0,
                "min_score": min(attention_scores) if attention_scores else 0.0,
                "max_score": max(attention_scores) if attention_scores else 100.0,
                "attention_quality": (
                    "excellent" if (attention_scores and sum(attention_scores) / len(attention_scores) > 80)
                    else "good" if (attention_scores and sum(attention_scores) / len(attention_scores) > 60)
                    else "moderate" if (attention_scores and sum(attention_scores) / len(attention_scores) > 40)
                    else "needs_improvement"
                )
            },
            "fatigue_analysis": {
                "distribution": dict(fatigue_counts),
                "primary_state": fatigue_counts.most_common(1)[0][0] if fatigue_counts else "Normal"
            },
            "engagement_analysis": {
                "distribution": dict(engagement_counts),
                "primary_level": engagement_counts.most_common(1)[0][0] if engagement_counts else "medium"
            },
            "timeline": {
                "emotion_transitions": emotion_transitions[:10],  # First 10 transitions
                "first_emotion": emotions[0] if emotions else "neutral",
                "last_emotion": emotions[-1] if emotions else "neutral"
            },
            "raw_metrics_sample": metrics[:5] + metrics[-5:] if len(metrics) > 10 else metrics  # First and last 5
        }
        
        return report
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/sessions")
async def create_session(session_id: str, user_id: Optional[str] = None):
    """Create a new session"""
    try:
        success = db.create_session(session_id, user_id)
        if success:
            return {"message": "Session created", "session_id": session_id}
        else:
            return {"message": "Session already exists", "session_id": session_id}
    except Exception as e:
        logger.error(f"Error creating session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "FUSION API"}


def main():
    """Main entry point for uv script"""
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8083)


if __name__ == "__main__":
    main()

