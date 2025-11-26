"""
FUSION API Server
RESTful API for accessing behavioral metrics
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import logging
from datetime import datetime
import sqlite3

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
async def get_context_for_convei(
    session_id: str,
    window: int = 30
):
    """Get formatted context for CONVEI agents"""
    try:
        # If session_id is "current" or empty, use the latest session with metrics
        if session_id == "current" or not session_id:
            # Find the most recent session with metrics
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
                # Fallback to "current_session" if no metrics exist
                session_id = "current_session"
        
        context = processor.get_context_for_convei(session_id, window)
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

