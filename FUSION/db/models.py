"""
Database models for FUSION metrics storage
"""

import sqlite3
import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class VideoMetric:
    """Video analysis metric"""
    session_id: str
    timestamp: float
    emotion: Optional[str] = None
    emotion_scores: Optional[Dict[str, float]] = None
    attention_state: Optional[str] = None
    posture_state: Optional[str] = None
    movement_level: Optional[str] = None
    blink_rate: Optional[float] = None
    total_blinks: Optional[int] = None
    ear: Optional[float] = None
    ear_threshold: Optional[float] = None
    eye_asymmetry: Optional[float] = None
    blink_duration: Optional[float] = None
    blink_interval: Optional[float] = None
    fatigue_level: Optional[str] = None
    drowsiness_score: Optional[float] = None
    fps: Optional[float] = None
    object_detections: Optional[List[Dict]] = None
    person_tracking: Optional[Dict] = None


@dataclass
class AudioMetric:
    """Audio analysis metric"""
    session_id: str
    timestamp: float
    transcription: Optional[str] = None
    emotion: Optional[str] = None
    sentiment: Optional[float] = None
    confidence: Optional[str] = None
    energy: Optional[float] = None
    pitch: Optional[float] = None
    speech_rate: Optional[float] = None
    silence_ratio: Optional[float] = None
    energy_z_score: Optional[float] = None
    pitch_z_score: Optional[float] = None
    rate_z_score: Optional[float] = None
    chunk_duration: Optional[float] = None
    sample_rate: Optional[int] = None
    word_count: Optional[int] = None


@dataclass
class UnifiedMetric:
    """Combined video+audio metric"""
    session_id: str
    timestamp: float
    unified_emotion: Optional[str] = None
    unified_attention: Optional[str] = None
    unified_posture: Optional[str] = None
    unified_movement: Optional[str] = None
    unified_fatigue: Optional[str] = None
    unified_sentiment: Optional[float] = None
    unified_confidence: Optional[str] = None
    attention_score: Optional[float] = None
    engagement_level: Optional[str] = None
    stress_indicators: Optional[Dict] = None
    confidence_level: Optional[float] = None
    video_data: Optional[Dict] = None
    audio_data: Optional[Dict] = None


class MetricsDatabase:
    """Database manager for behavioral metrics"""
    
    def __init__(self, db_path: str = "fusion.db"):
        self.db_path = db_path
        self.conn = None
        self._init_db()
    
    def _init_db(self):
        """Initialize database connection and create tables"""
        max_retries = 5
        retry_delay = 0.5
        
        for attempt in range(max_retries):
            try:
                # Connect to database with timeout
                self.conn = sqlite3.connect(
                    self.db_path, 
                    check_same_thread=False,
                    timeout=30.0  # 30 second timeout for operations
                )
                self.conn.row_factory = sqlite3.Row
                
                # Set busy timeout FIRST to handle concurrent access
                self.conn.execute('PRAGMA busy_timeout=30000')  # 30 seconds
                self.conn.commit()
                
                # Try to enable WAL mode (may fail if database is locked, that's OK)
                try:
                    result = self.conn.execute('PRAGMA journal_mode=WAL').fetchone()
                    if result and result[0] == 'wal':
                        logger.debug("WAL mode enabled")
                    else:
                        logger.debug(f"Journal mode: {result[0] if result else 'unknown'}")
                except sqlite3.OperationalError as e:
                    if "database is locked" in str(e):
                        logger.warning("Could not enable WAL mode (database locked), will retry on next connection")
                    else:
                        raise
                
                # Optimize for concurrent reads and writes
                try:
                    self.conn.execute('PRAGMA synchronous=NORMAL')
                    self.conn.execute('PRAGMA cache_size=-64000')  # 64MB cache
                    self.conn.commit()
                except sqlite3.OperationalError:
                    # If locked, these can wait
                    pass
                
                # Read and execute schema (only if tables don't exist)
                try:
                    cursor = self.conn.cursor()
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'")
                    table_exists = cursor.fetchone() is not None
                    
                    if not table_exists:
                        with open('db/schema.sql', 'r') as f:
                            schema = f.read()
                            self.conn.executescript(schema)
                            self.conn.commit()
                            logger.info("Database schema created")
                    else:
                        logger.debug("Database schema already exists")
                except sqlite3.OperationalError as e:
                    if "database is locked" in str(e) and attempt < max_retries - 1:
                        self.conn.close()
                        time.sleep(retry_delay * (attempt + 1))
                        continue
                    raise
                
                logger.info(f"Database initialized: {self.db_path}")
                return  # Success!
                
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e) and attempt < max_retries - 1:
                    if self.conn:
                        try:
                            self.conn.close()
                        except:
                            pass
                    logger.warning(f"Database locked, retrying in {retry_delay * (attempt + 1)}s (attempt {attempt + 1}/{max_retries})...")
                    time.sleep(retry_delay * (attempt + 1))
                    continue
                else:
                    logger.error(f"Error initializing database: {e}")
                    if self.conn:
                        try:
                            self.conn.close()
                        except:
                            pass
                    raise
            except Exception as e:
                logger.error(f"Error initializing database: {e}")
                if self.conn:
                    try:
                        self.conn.close()
                    except:
                        pass
                raise
        
        # If we get here, all retries failed
        raise sqlite3.OperationalError("Database initialization failed after all retries")
    
    def create_session(self, session_id: str, user_id: Optional[str] = None) -> bool:
        """Create a new session"""
        try:
            cursor = self.conn.cursor()
            cursor.execute(
                "INSERT INTO sessions (session_id, user_id, start_time) VALUES (?, ?, ?)",
                (session_id, user_id, datetime.now().timestamp())
            )
            self.conn.commit()
            return True
        except sqlite3.IntegrityError:
            logger.warning(f"Session {session_id} already exists")
            return False
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            return False
    
    def save_video_metric(self, metric: VideoMetric) -> bool:
        """Save a video metric with retry logic"""
        max_retries = 3
        retry_delay = 0.1
        
        for attempt in range(max_retries):
            try:
                cursor = self.conn.cursor()
                cursor.execute("""
                    INSERT INTO video_metrics (
                        session_id, timestamp, emotion, emotion_scores, attention_state,
                        posture_state, movement_level, blink_rate, total_blinks, ear,
                        ear_threshold, eye_asymmetry, blink_duration, blink_interval,
                        fatigue_level, drowsiness_score, fps, object_detections, person_tracking
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    metric.session_id, metric.timestamp, metric.emotion,
                    json.dumps(metric.emotion_scores) if metric.emotion_scores else None,
                    metric.attention_state, metric.posture_state, metric.movement_level,
                    metric.blink_rate, metric.total_blinks, metric.ear, metric.ear_threshold,
                    metric.eye_asymmetry, metric.blink_duration, metric.blink_interval,
                    metric.fatigue_level, metric.drowsiness_score, metric.fps,
                    json.dumps(metric.object_detections) if metric.object_detections else None,
                    json.dumps(metric.person_tracking) if metric.person_tracking else None
                ))
                self.conn.commit()
                return True
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e) and attempt < max_retries - 1:
                    time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                    continue
                logger.error(f"Error saving video metric: {e}")
                return False
            except Exception as e:
                logger.error(f"Error saving video metric: {e}")
                return False
        return False
    
    def save_audio_metric(self, metric: AudioMetric) -> bool:
        """Save an audio metric with retry logic"""
        max_retries = 3
        retry_delay = 0.1
        
        for attempt in range(max_retries):
            try:
                cursor = self.conn.cursor()
                cursor.execute("""
                    INSERT INTO audio_metrics (
                        session_id, timestamp, transcription, emotion, sentiment, confidence,
                        energy, pitch, speech_rate, silence_ratio, energy_z_score,
                        pitch_z_score, rate_z_score, chunk_duration, sample_rate, word_count
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    metric.session_id, metric.timestamp, metric.transcription,
                    metric.emotion, metric.sentiment, metric.confidence,
                    metric.energy, metric.pitch, metric.speech_rate, metric.silence_ratio,
                    metric.energy_z_score, metric.pitch_z_score, metric.rate_z_score,
                    metric.chunk_duration, metric.sample_rate, metric.word_count
                ))
                self.conn.commit()
                return True
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e) and attempt < max_retries - 1:
                    time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                    continue
                logger.error(f"Error saving audio metric: {e}")
                return False
            except Exception as e:
                logger.error(f"Error saving audio metric: {e}")
                return False
        return False
    
    def save_unified_metric(self, metric: UnifiedMetric) -> bool:
        """Save a unified metric with retry logic"""
        max_retries = 3
        retry_delay = 0.1
        
        for attempt in range(max_retries):
            try:
                cursor = self.conn.cursor()
                cursor.execute("""
                    INSERT INTO unified_metrics (
                        session_id, timestamp, unified_emotion, unified_attention,
                        unified_posture, unified_movement, unified_fatigue, unified_sentiment,
                        unified_confidence, attention_score, engagement_level, stress_indicators,
                        confidence_level, video_data, audio_data
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    metric.session_id, metric.timestamp, metric.unified_emotion,
                    metric.unified_attention, metric.unified_posture, metric.unified_movement,
                    metric.unified_fatigue, metric.unified_sentiment, metric.unified_confidence,
                    metric.attention_score, metric.engagement_level,
                    json.dumps(metric.stress_indicators) if metric.stress_indicators else None,
                    metric.confidence_level,
                    json.dumps(metric.video_data) if metric.video_data else None,
                    json.dumps(metric.audio_data) if metric.audio_data else None
                ))
                self.conn.commit()
                return True
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e) and attempt < max_retries - 1:
                    time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                    continue
                logger.error(f"Error saving unified metric: {e}")
                return False
            except Exception as e:
                logger.error(f"Error saving unified metric: {e}")
                return False
        return False
    
    def get_current_metrics(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get the most recent metrics for a session"""
        try:
            cursor = self.conn.cursor()
            
            # Get latest unified metric
            cursor.execute("""
                SELECT * FROM unified_metrics
                WHERE session_id = ?
                ORDER BY timestamp DESC
                LIMIT 1
            """, (session_id,))
            
            unified = cursor.fetchone()
            if unified:
                # Convert Row to dict
                return {key: unified[key] for key in unified.keys()}
            return None
        except Exception as e:
            logger.error(f"Error getting current metrics: {e}")
            return None
    
    def get_metrics_range(self, session_id: str, start_time: float, end_time: float) -> List[Dict[str, Any]]:
        """Get metrics for a time range"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT * FROM unified_metrics
                WHERE session_id = ? AND timestamp >= ? AND timestamp <= ?
                ORDER BY timestamp ASC
            """, (session_id, start_time, end_time))
            
            rows = cursor.fetchall()
            # Convert Row objects to dicts
            return [{key: row[key] for key in row.keys()} for row in rows]
        except Exception as e:
            logger.error(f"Error getting metrics range: {e}")
            return []
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()

