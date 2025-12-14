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


def _format_duration(seconds: float) -> str:
    """Format duration in seconds to human-readable string (e.g., '2m 30s' or '1h 15m 30s')"""
    if seconds <= 0:
        return "0m 0s"
    
    # Cap at 24 hours for display
    seconds = min(seconds, 86400)
    
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    
    if hours > 0:
        return f"{hours}h {minutes}m {secs}s"
    elif minutes > 0:
        return f"{minutes}m {secs}s"
    else:
        return f"{secs}s"


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
        
        # If session_id is "current", find the most recent active session
        # Only consider sessions with data from the last hour to avoid old sessions
        if session_id == "current" or session_id == "current_session":
            import time
            cursor = db.conn.cursor()
            current_time = time.time()
            one_hour_ago = current_time - 3600  # Only look at last hour
            
            # First try unified_metrics - get the session with the most recent data
            try:
                cursor.execute("""
                    SELECT session_id, MAX(timestamp) as last_time, COUNT(*) as metric_count
                    FROM unified_metrics
                    WHERE timestamp > ?
                    GROUP BY session_id
                    ORDER BY last_time DESC, metric_count DESC
                    LIMIT 1
                """, (one_hour_ago,))
                result = cursor.fetchone()
                if result and result[2] > 0:  # Check that we have metrics
                    session_id = result[0]
                    logger.info(f"Found active session in unified_metrics: {session_id} (last update: {result[1]}, metrics: {result[2]})")
                else:
                    # Fallback: try video_metrics or audio_metrics
                    cursor.execute("""
                        SELECT session_id, MAX(timestamp) as last_time, COUNT(*) as metric_count
                        FROM video_metrics
                        WHERE timestamp > ?
                        GROUP BY session_id
                        ORDER BY last_time DESC, metric_count DESC
                        LIMIT 1
                    """, (one_hour_ago,))
                    result = cursor.fetchone()
                    if result and result[2] > 0:
                        session_id = result[0]
                        logger.info(f"Found active session in video_metrics: {session_id} (last update: {result[1]}, metrics: {result[2]})")
                    else:
                        cursor.execute("""
                            SELECT session_id, MAX(timestamp) as last_time, COUNT(*) as metric_count
                            FROM audio_metrics
                            WHERE timestamp > ?
                            GROUP BY session_id
                            ORDER BY last_time DESC, metric_count DESC
                            LIMIT 1
                        """, (one_hour_ago,))
                        result = cursor.fetchone()
                        if result and result[2] > 0:
                            session_id = result[0]
                            logger.info(f"Found active session in audio_metrics: {session_id} (last update: {result[1]}, metrics: {result[2]})")
                        else:
                            # If no recent data, try without time filter (but log a warning)
                            logger.warning("No recent sessions found (last hour), trying all sessions...")
                            cursor.execute("""
                                SELECT session_id, MAX(timestamp) as last_time, COUNT(*) as metric_count
                                FROM unified_metrics
                                GROUP BY session_id
                                ORDER BY last_time DESC
                                LIMIT 1
                            """)
                            result = cursor.fetchone()
                            if result and result[2] > 0:
                                session_id = result[0]
                                logger.info(f"Found session (no recent filter): {session_id}")
                            else:
                                logger.warning("No sessions found in any metrics table")
                                raise HTTPException(status_code=404, detail="No session found in database. Please ensure BEVAL is running and collecting data.")
            except sqlite3.OperationalError as e:
                logger.error(f"Database error while finding session: {e}")
                raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        
        # Log the resolved session_id to ensure we're using the right one
        logger.info(f"Generating report for session_id: {session_id}")
        
        # Get aggregated stats using SQL (much faster than loading all data)
        cursor = db.conn.cursor()
        
        # Add time filter to only include recent data (last 2 hours max) to ensure we only get current session data
        import time
        current_time = time.time()
        two_hours_ago = current_time - 7200  # Only include data from last 2 hours
        
        # First check if unified_metrics exist and get count (only from this session and recent)
        try:
            cursor.execute("""
                SELECT COUNT(*) as count, 
                       MIN(timestamp) as start_time,
                       MAX(timestamp) as end_time
                FROM unified_metrics
                WHERE session_id = ? AND timestamp > ?
            """, (session_id, two_hours_ago))
            unified_stats = cursor.fetchone()
            has_unified = unified_stats and unified_stats[0] > 0
        except sqlite3.OperationalError as e:
            logger.error(f"Error checking unified_metrics: {e}")
            has_unified = False
            unified_stats = None
        
        # If no unified_metrics, try to aggregate from video and audio metrics
        if not has_unified:
            logger.warning(f"No unified_metrics found for session {session_id}, trying to aggregate from individual metrics")
            
            # Get aggregated stats from video and audio metrics using SQL (only recent data)
            cursor.execute("""
                SELECT COUNT(*) as count,
                       MIN(timestamp) as start_time,
                       MAX(timestamp) as end_time
                FROM video_metrics
                WHERE session_id = ? AND timestamp > ?
            """, (session_id, two_hours_ago))
            video_stats = cursor.fetchone()
            
            cursor.execute("""
                SELECT COUNT(*) as count,
                       MIN(timestamp) as start_time,
                       MAX(timestamp) as end_time
                FROM audio_metrics
                WHERE session_id = ? AND timestamp > ?
            """, (session_id, two_hours_ago))
            audio_stats = cursor.fetchone()
            
            has_video = video_stats and video_stats[0] > 0
            has_audio = audio_stats and audio_stats[0] > 0
            
            if not has_video and not has_audio:
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
            
            # Use SQL aggregations instead of loading all data
            # Get emotion distribution from video metrics (only recent data)
            cursor.execute("""
                SELECT emotion, COUNT(*) as count
                FROM video_metrics
                WHERE session_id = ? AND emotion IS NOT NULL AND timestamp > ?
                GROUP BY emotion
                ORDER BY count DESC
            """, (session_id, two_hours_ago))
            emotion_distribution = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Get sentiment stats from audio metrics (only recent data)
            cursor.execute("""
                SELECT AVG(sentiment) as avg_sentiment,
                       MIN(sentiment) as min_sentiment,
                       MAX(sentiment) as max_sentiment,
                       COUNT(*) as count
                FROM audio_metrics
                WHERE session_id = ? AND sentiment IS NOT NULL AND timestamp > ?
            """, (session_id, two_hours_ago))
            sentiment_row = cursor.fetchone()
            avg_sentiment = sentiment_row[0] if sentiment_row and sentiment_row[0] is not None else 0.0
            min_sentiment = sentiment_row[1] if sentiment_row and sentiment_row[1] is not None else 0.0
            max_sentiment = sentiment_row[2] if sentiment_row and sentiment_row[2] is not None else 0.0
            
            # Note: video_metrics doesn't have attention_score, only attention_state
            # For fallback, we'll use default values or calculate from attention_state if needed
            avg_attention = 50.0
            min_attention = 0.0
            max_attention = 100.0
            
            # Get fatigue distribution (only recent data)
            cursor.execute("""
                SELECT fatigue_level, COUNT(*) as count
                FROM video_metrics
                WHERE session_id = ? AND fatigue_level IS NOT NULL AND timestamp > ?
                GROUP BY fatigue_level
            """, (session_id, two_hours_ago))
            fatigue_distribution = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Get first and last emotions for timeline (only recent data)
            cursor.execute("""
                SELECT emotion FROM video_metrics
                WHERE session_id = ? AND emotion IS NOT NULL AND timestamp > ?
                ORDER BY timestamp ASC
                LIMIT 1
            """, (session_id, two_hours_ago))
            first_emotion_row = cursor.fetchone()
            first_emotion = first_emotion_row[0] if first_emotion_row else "neutral"
            
            cursor.execute("""
                SELECT emotion FROM video_metrics
                WHERE session_id = ? AND emotion IS NOT NULL AND timestamp > ?
                ORDER BY timestamp DESC
                LIMIT 1
            """, (session_id, two_hours_ago))
            last_emotion_row = cursor.fetchone()
            last_emotion = last_emotion_row[0] if last_emotion_row else "neutral"
            
            # Get emotion transitions (simplified - just count changes, only recent data)
            cursor.execute("""
                SELECT COUNT(*) FROM (
                    SELECT emotion, 
                           LAG(emotion) OVER (ORDER BY timestamp) as prev_emotion
                    FROM video_metrics
                    WHERE session_id = ? AND emotion IS NOT NULL AND timestamp > ?
                ) WHERE emotion != prev_emotion
            """, (session_id, two_hours_ago))
            transitions_row = cursor.fetchone()
            transitions_count = transitions_row[0] if transitions_row else 0
            
            # Get total count and duration
            total_count = (video_stats[0] if video_stats else 0) + (audio_stats[0] if audio_stats else 0)
            start_time = min(
                video_stats[1] if video_stats and video_stats[1] else float('inf'),
                audio_stats[1] if audio_stats and audio_stats[1] else float('inf')
            )
            end_time = max(
                video_stats[2] if video_stats and video_stats[2] else 0,
                audio_stats[2] if audio_stats and audio_stats[2] else 0
            )
            # Calculate duration - ensure timestamps are valid and reasonable
            if start_time != float('inf') and end_time and end_time > start_time:
                duration_seconds = end_time - start_time
                # Sanity check: cap at 24 hours
                if duration_seconds > 86400:
                    logger.warning(f"Duration {duration_seconds}s seems too large, capping at 24h")
                    duration_seconds = 86400
            else:
                duration_seconds = 0
            
            # Get sample metrics (only load what we need, only recent data)
            cursor.execute("""
                SELECT id, session_id, timestamp, emotion, attention_state, fatigue_level
                FROM video_metrics
                WHERE session_id = ? AND timestamp > ?
                ORDER BY timestamp ASC
                LIMIT 5
            """, (session_id, two_hours_ago))
            sample_start = [dict(zip(['id', 'session_id', 'timestamp', 'unified_emotion', 'unified_attention', 'unified_fatigue'], row)) 
                           for row in cursor.fetchall()]
            
            cursor.execute("""
                SELECT id, session_id, timestamp, emotion, attention_state, fatigue_level
                FROM video_metrics
                WHERE session_id = ? AND timestamp > ?
                ORDER BY timestamp DESC
                LIMIT 5
            """, (session_id, two_hours_ago))
            sample_end = [dict(zip(['id', 'session_id', 'timestamp', 'unified_emotion', 'unified_attention', 'unified_fatigue'], row)) 
                         for row in cursor.fetchall()]
            raw_metrics_sample = sample_start + sample_end
            
            # Build report with SQL-aggregated data
            dominant_emotion = max(emotion_distribution.items(), key=lambda x: x[1])[0] if emotion_distribution else "neutral"
            primary_fatigue = max(fatigue_distribution.items(), key=lambda x: x[1])[0] if fatigue_distribution else "Normal"
            
            report = {
                "session_id": session_id,
                "total_data_points": total_count,
                "duration_seconds": duration_seconds,
                "duration_formatted": _format_duration(duration_seconds),
                "emotion_analysis": {
                    "distribution": emotion_distribution,
                    "dominant_emotion": dominant_emotion,
                    "emotional_variety": len(emotion_distribution),
                    "transitions_count": transitions_count,
                    "emotional_stability": "stable" if transitions_count < total_count * 0.2 else "moderate" if transitions_count < total_count * 0.4 else "volatile"
                },
                "sentiment_analysis": {
                    "average": avg_sentiment,
                    "min": min_sentiment,
                    "max": max_sentiment,
                    "overall": "positive" if avg_sentiment > 0.2 else "negative" if avg_sentiment < -0.2 else "neutral"
                },
                "attention_analysis": {
                    "average_score": avg_attention,
                    "min_score": min_attention,
                    "max_score": max_attention,
                    "attention_quality": "excellent" if avg_attention > 80 else "good" if avg_attention > 60 else "moderate" if avg_attention > 40 else "needs_improvement"
                },
                "fatigue_analysis": {
                    "distribution": fatigue_distribution,
                    "primary_state": primary_fatigue
                },
                "engagement_analysis": {
                    "distribution": {"medium": total_count},  # Simplified for fallback
                    "primary_level": "medium"
                },
                "timeline": {
                    "emotion_transitions": [],  # Simplified - can be enhanced if needed
                    "first_emotion": first_emotion,
                    "last_emotion": last_emotion
                },
                "raw_metrics_sample": raw_metrics_sample
            }
            
            return report
        
        # Use optimized SQL aggregations for unified_metrics
        # Get aggregated stats directly from SQL (only recent data from current session)
        cursor.execute("""
            SELECT 
                COUNT(*) as total_count,
                MIN(timestamp) as start_time,
                MAX(timestamp) as end_time,
                AVG(unified_sentiment) as avg_sentiment,
                MIN(unified_sentiment) as min_sentiment,
                MAX(unified_sentiment) as max_sentiment,
                AVG(attention_score) as avg_attention,
                MIN(attention_score) as min_attention,
                MAX(attention_score) as max_attention
            FROM unified_metrics
            WHERE session_id = ? AND timestamp > ?
        """, (session_id, two_hours_ago))
        stats_row = cursor.fetchone()
        total_count = stats_row[0] if stats_row else 0
        start_time = stats_row[1] if stats_row and stats_row[1] else 0
        end_time = stats_row[2] if stats_row and stats_row[2] else 0
        avg_sentiment = stats_row[3] if stats_row and stats_row[3] is not None else 0.0
        min_sentiment = stats_row[4] if stats_row and stats_row[4] is not None else 0.0
        max_sentiment = stats_row[5] if stats_row and stats_row[5] is not None else 0.0
        avg_attention = stats_row[6] if stats_row and stats_row[6] is not None else 50.0
        min_attention = stats_row[7] if stats_row and stats_row[7] is not None else 0.0
        max_attention = stats_row[8] if stats_row and stats_row[8] is not None else 100.0
        
        # Calculate duration - ensure timestamps are valid and reasonable
        if start_time and end_time and end_time > start_time:
            duration_seconds = end_time - start_time
            
            # Check if timestamps might be in milliseconds instead of seconds
            # If duration is > 86400 (24 hours), timestamps might be in milliseconds
            if duration_seconds > 86400:
                # Try converting from milliseconds
                duration_seconds_ms = (end_time - start_time) / 1000.0
                if duration_seconds_ms <= 86400:
                    logger.info(f"Timestamps appear to be in milliseconds, converting. Original: {duration_seconds}s, Converted: {duration_seconds_ms}s")
                    duration_seconds = duration_seconds_ms
                else:
                    # Sanity check: cap at 24 hours to prevent display issues
                    logger.warning(f"Duration {duration_seconds}s seems too large, capping at 24h. Start: {start_time}, End: {end_time}")
                    duration_seconds = 86400
        else:
            duration_seconds = 0
        
        # Get distributions using SQL GROUP BY (much faster, only recent data)
        cursor.execute("""
            SELECT unified_emotion, COUNT(*) as count
            FROM unified_metrics
            WHERE session_id = ? AND unified_emotion IS NOT NULL AND timestamp > ?
            GROUP BY unified_emotion
            ORDER BY count DESC
        """, (session_id, two_hours_ago))
        emotion_distribution = {row[0]: row[1] for row in cursor.fetchall()}
        
        cursor.execute("""
            SELECT unified_fatigue, COUNT(*) as count
            FROM unified_metrics
            WHERE session_id = ? AND unified_fatigue IS NOT NULL AND timestamp > ?
            GROUP BY unified_fatigue
        """, (session_id, two_hours_ago))
        fatigue_distribution = {row[0]: row[1] for row in cursor.fetchall()}
        
        cursor.execute("""
            SELECT engagement_level, COUNT(*) as count
            FROM unified_metrics
            WHERE session_id = ? AND engagement_level IS NOT NULL AND timestamp > ?
            GROUP BY engagement_level
        """, (session_id, two_hours_ago))
        engagement_distribution = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Get first and last emotions (only recent data)
        cursor.execute("""
            SELECT unified_emotion FROM unified_metrics
            WHERE session_id = ? AND unified_emotion IS NOT NULL AND timestamp > ?
            ORDER BY timestamp ASC
            LIMIT 1
        """, (session_id, two_hours_ago))
        first_emotion_row = cursor.fetchone()
        first_emotion = first_emotion_row[0] if first_emotion_row else "neutral"
        
        cursor.execute("""
            SELECT unified_emotion FROM unified_metrics
            WHERE session_id = ? AND unified_emotion IS NOT NULL AND timestamp > ?
            ORDER BY timestamp DESC
            LIMIT 1
        """, (session_id, two_hours_ago))
        last_emotion_row = cursor.fetchone()
        last_emotion = last_emotion_row[0] if last_emotion_row else "neutral"
        
        # Get emotion transitions count using window function (only recent data)
        cursor.execute("""
            SELECT COUNT(*) FROM (
                SELECT unified_emotion,
                       LAG(unified_emotion) OVER (ORDER BY timestamp) as prev_emotion
                FROM unified_metrics
                WHERE session_id = ? AND unified_emotion IS NOT NULL AND timestamp > ?
            ) WHERE unified_emotion != prev_emotion
        """, (session_id, two_hours_ago))
        transitions_row = cursor.fetchone()
        transitions_count = transitions_row[0] if transitions_row else 0
        
        # Get emotion transitions details (limited to 10, only recent data)
        cursor.execute("""
            SELECT 
                prev_emotion as "from",
                unified_emotion as "to",
                row_num as "index"
            FROM (
                SELECT 
                    unified_emotion,
                    LAG(unified_emotion) OVER (ORDER BY timestamp) as prev_emotion,
                    ROW_NUMBER() OVER (ORDER BY timestamp) as row_num
                FROM unified_metrics
                WHERE session_id = ? AND unified_emotion IS NOT NULL AND timestamp > ?
            ) WHERE unified_emotion != prev_emotion
            LIMIT 10
        """, (session_id, two_hours_ago))
        emotion_transitions = [{"from": row[0], "to": row[1], "index": row[2]} for row in cursor.fetchall()]
        
        # Get sample metrics (only load first 5 and last 5, not all, only recent data)
        cursor.execute("""
            SELECT id, session_id, timestamp, unified_emotion, unified_attention, unified_fatigue, 
                   unified_sentiment, attention_score, engagement_level
            FROM unified_metrics
            WHERE session_id = ? AND timestamp > ?
            ORDER BY timestamp ASC
            LIMIT 5
        """, (session_id, two_hours_ago))
        sample_start = [dict(zip(['id', 'session_id', 'timestamp', 'unified_emotion', 'unified_attention', 
                                 'unified_fatigue', 'unified_sentiment', 'attention_score', 'engagement_level'], row)) 
                       for row in cursor.fetchall()]
        
        cursor.execute("""
            SELECT id, session_id, timestamp, unified_emotion, unified_attention, unified_fatigue,
                   unified_sentiment, attention_score, engagement_level
            FROM unified_metrics
            WHERE session_id = ? AND timestamp > ?
            ORDER BY timestamp DESC
            LIMIT 5
        """, (session_id, two_hours_ago))
        sample_end = [dict(zip(['id', 'session_id', 'timestamp', 'unified_emotion', 'unified_attention',
                               'unified_fatigue', 'unified_sentiment', 'attention_score', 'engagement_level'], row)) 
                     for row in cursor.fetchall()]
        raw_metrics_sample = sample_start + sample_end
        
        # Parse JSON only for sample metrics (much faster)
        for metric in raw_metrics_sample:
            # We don't need to parse video_data/audio_data for the sample since we're not including them
            pass
        
        from collections import Counter
        
        # Build final report
        dominant_emotion = max(emotion_distribution.items(), key=lambda x: x[1])[0] if emotion_distribution else "neutral"
        primary_fatigue = max(fatigue_distribution.items(), key=lambda x: x[1])[0] if fatigue_distribution else "Normal"
        primary_engagement = max(engagement_distribution.items(), key=lambda x: x[1])[0] if engagement_distribution else "medium"
        
        report = {
            "session_id": session_id,
            "total_data_points": total_count,
            "duration_seconds": duration_seconds,
            "duration_formatted": f"{int(duration_seconds // 60)}m {int(duration_seconds % 60)}s",
            "emotion_analysis": {
                "distribution": emotion_distribution,
                "dominant_emotion": dominant_emotion,
                "emotional_variety": len(emotion_distribution),
                "transitions_count": transitions_count,
                "emotional_stability": "stable" if transitions_count < total_count * 0.2 else "moderate" if transitions_count < total_count * 0.4 else "volatile"
            },
            "sentiment_analysis": {
                "average": avg_sentiment,
                "min": min_sentiment,
                "max": max_sentiment,
                "overall": "positive" if avg_sentiment > 0.2 else "negative" if avg_sentiment < -0.2 else "neutral"
            },
            "attention_analysis": {
                "average_score": avg_attention,
                "min_score": min_attention,
                "max_score": max_attention,
                "attention_quality": "excellent" if avg_attention > 80 else "good" if avg_attention > 60 else "moderate" if avg_attention > 40 else "needs_improvement"
            },
            "fatigue_analysis": {
                "distribution": fatigue_distribution,
                "primary_state": primary_fatigue
            },
            "engagement_analysis": {
                "distribution": engagement_distribution,
                "primary_level": primary_engagement
            },
            "timeline": {
                "emotion_transitions": emotion_transitions,
                "first_emotion": first_emotion,
                "last_emotion": last_emotion
            },
            "raw_metrics_sample": raw_metrics_sample
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

