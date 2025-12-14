"""
BEVAL Metrics Collector
Collects behavioral metrics from BEVAL server and stores them in FUSION database
"""

import asyncio
import json
import logging
import time
import sys
from pathlib import Path
from typing import Dict, Any, Optional
import httpx
from socketio import AsyncClient

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from db.models import MetricsDatabase, VideoMetric, AudioMetric, UnifiedMetric

logger = logging.getLogger(__name__)


class BEVALCollector:
    """Collects metrics from BEVAL server"""
    
    def __init__(self, beval_url: str = "http://localhost:5000", db_path: str = "fusion.db", use_socketio: bool = True):
        self.beval_url = beval_url
        self.beval_ws_url = beval_url.replace("http://", "ws://").replace("https://", "wss://")
        self.db = MetricsDatabase(db_path)
        self.current_session_id: Optional[str] = None
        self.is_connected = False
        self.socketio_client = None
        self.use_socketio = use_socketio
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def connect(self, session_id: str):
        """Connect to BEVAL server"""
        try:
            self.current_session_id = session_id
            self.db.create_session(session_id)
            
            if self.use_socketio:
                # Connect via SocketIO
                self.socketio_client = AsyncClient()
                
                # Register event handlers BEFORE connecting
                @self.socketio_client.on('data_update')
                async def on_data_update(data):
                    await self._process_metric({"type": "unified_state", "data": data})
                
                @self.socketio_client.on('connect')
                async def on_connect():
                    logger.info("SocketIO connected to BEVAL")
                    # Request initial data
                    await self.socketio_client.emit('request_data')
                
                @self.socketio_client.on('disconnect')
                async def on_disconnect(*args):
                    logger.warning("SocketIO disconnected from BEVAL")
                    self.is_connected = False
                
                await self.socketio_client.connect(self.beval_url)
                self.is_connected = True
                logger.info(f"Connected to BEVAL via SocketIO at {self.beval_url}")
            else:
                # Use HTTP polling as fallback
                self.is_connected = True
                logger.info(f"Using HTTP polling to BEVAL at {self.beval_url}")
            
            return True
        except Exception as e:
            logger.error(f"Error connecting to BEVAL: {e}")
            # Fallback to HTTP polling
            if self.use_socketio:
                logger.info("Falling back to HTTP polling...")
                self.use_socketio = False
                return await self.connect(session_id)
            return False
    
    async def collect_metrics(self):
        """Main collection loop"""
        if not self.is_connected:
            logger.error("Not connected to BEVAL")
            return
        
        try:
            if self.use_socketio and self.socketio_client:
                # SocketIO handles events via callbacks
                await self.socketio_client.wait()
            else:
                # HTTP polling fallback
                await self._poll_metrics()
        except Exception as e:
            logger.error(f"Error in collection loop: {e}")
            self.is_connected = False
    
    async def _poll_metrics(self):
        """Poll metrics via HTTP - fallback method"""
        logger.info("Using HTTP polling to collect metrics from BEVAL")
        while self.is_connected:
            try:
                # Try to get latest data from BEVAL's data export file or HTTP endpoint
                # First try HTTP endpoint if available
                try:
                    response = await self.http_client.get(f"{self.beval_url}/api/data", timeout=5.0)
                    if response.status_code == 200:
                        data = response.json()
                        await self._process_metric({"type": "unified_state", "data": data})
                except httpx.HTTPStatusError:
                    # Endpoint doesn't exist, that's okay
                    pass
                except httpx.RequestError:
                    # Connection error, will retry
                    pass
                
                await asyncio.sleep(1.0)  # Poll every second
            except Exception as e:
                logger.warning(f"Error polling metrics: {e}, retrying in 5 seconds...")
                await asyncio.sleep(5.0)
    
    
    async def _process_metric(self, data: Dict[str, Any]):
        """Process a metric from BEVAL"""
        if not self.current_session_id:
            return
        
        timestamp = time.time()
        metric_type = data.get("type", "unknown")
        
        if metric_type == "video_analysis":
            await self._process_video_metric(data, timestamp)
        elif metric_type == "audio_analysis":
            await self._process_audio_metric(data, timestamp)
        elif metric_type == "unified_state":
            await self._process_unified_metric(data, timestamp)
        else:
            logger.debug(f"Unknown metric type: {metric_type}")
    
    async def _process_video_metric(self, data: Dict[str, Any], timestamp: float):
        """Process video analysis metric"""
        try:
            video_data = data.get("data", {})
            
            metric = VideoMetric(
                session_id=self.current_session_id,
                timestamp=timestamp,
                emotion=video_data.get("emotion"),
                emotion_scores=video_data.get("emotion_scores"),
                attention_state=video_data.get("attention_state"),
                posture_state=video_data.get("posture_state"),
                movement_level=video_data.get("movement_level"),
                blink_rate=video_data.get("blink_rate"),
                total_blinks=video_data.get("total_blinks") or video_data.get("total_blink_count"),
                ear=video_data.get("ear"),
                ear_threshold=video_data.get("ear_threshold"),
                eye_asymmetry=video_data.get("eye_asymmetry"),
                blink_duration=video_data.get("blink_duration"),
                blink_interval=video_data.get("blink_interval"),
                fatigue_level=video_data.get("fatigue_level"),
                drowsiness_score=video_data.get("drowsiness_score"),
                fps=video_data.get("fps"),
                object_detections=video_data.get("object_detections") or video_data.get("current_detections"),
                person_tracking=video_data.get("person_tracking") or video_data.get("main_person")
            )
            
            self.db.save_video_metric(metric)
            logger.debug(f"Saved video metric for session {self.current_session_id}")
        except Exception as e:
            logger.error(f"Error processing video metric: {e}")
    
    async def _process_audio_metric(self, data: Dict[str, Any], timestamp: float):
        """Process audio analysis metric"""
        try:
            audio_data = data.get("data", {})
            audio_features = audio_data.get("audio_features", {})
            
            # Extract audio features - check both nested and direct access
            audio_features_dict = audio_data.get("audio_features", {})
            if not isinstance(audio_features_dict, dict):
                audio_features_dict = {}
            
            metric = AudioMetric(
                session_id=self.current_session_id,
                timestamp=timestamp,
                transcription=audio_data.get("transcription"),
                emotion=audio_data.get("emotion"),
                sentiment=audio_data.get("sentiment"),
                confidence=str(audio_data.get("confidence_label")) if audio_data.get("confidence_label") else None,
                energy=audio_data.get("energy") or audio_features_dict.get("energy"),
                pitch=audio_data.get("pitch") or audio_features_dict.get("pitch"),
                speech_rate=audio_data.get("speech_rate") or audio_features_dict.get("speech_rate"),
                silence_ratio=audio_data.get("silence_ratio") or audio_features_dict.get("silence_ratio"),
                energy_z_score=audio_data.get("energy_z_score") or audio_features_dict.get("energy_z_score"),
                pitch_z_score=audio_data.get("pitch_z_score") or audio_features_dict.get("pitch_z_score"),
                rate_z_score=audio_data.get("rate_z_score") or audio_features_dict.get("rate_z_score"),
                chunk_duration=audio_data.get("chunk_duration"),
                sample_rate=audio_data.get("sample_rate"),
                word_count=audio_data.get("word_count") or audio_data.get("total_words")
            )
            
            self.db.save_audio_metric(metric)
            logger.debug(f"Saved audio metric for session {self.current_session_id}")
        except Exception as e:
            logger.error(f"Error processing audio metric: {e}")
    
    async def _process_unified_metric(self, data: Dict[str, Any], timestamp: float):
        """Process unified metric from BEVAL data_update event"""
        try:
            # BEVAL sends data in format: {video: {...}, audio: {...}, objects: {...}, session_stats: {...}}
            beval_data = data.get("data", {})
            video_data = beval_data.get("video", {})
            audio_data = beval_data.get("audio", {})
            session_stats = beval_data.get("session_stats", {})
            
            # Extract unified state from video and audio data
            unified_state = {
                "emotion": video_data.get("emotion", "neutral"),
                "attention": video_data.get("attention_state", "Unknown"),
                "posture": video_data.get("posture_state", "Unknown"),
                "movement": video_data.get("movement_level", "Unknown"),
                "fatigue": video_data.get("fatigue_level", "Normal"),
                "sentiment": audio_data.get("sentiment", 0.0),
                "confidence": audio_data.get("confidence_label", "medium")
            }
            
            # Calculate derived metrics
            attention_score = self._calculate_attention_score(unified_state)
            engagement_level = self._calculate_engagement_level(unified_state)
            stress_indicators = self._calculate_stress_indicators(unified_state)
            confidence_level = self._calculate_confidence_level({"unified_state": unified_state})
            
            # Also save individual video and audio metrics
            await self._process_video_metric({"type": "video_analysis", "data": video_data}, timestamp)
            await self._process_audio_metric({"type": "audio_analysis", "data": audio_data}, timestamp)
            
            metric = UnifiedMetric(
                session_id=self.current_session_id,
                timestamp=timestamp,
                unified_emotion=unified_state.get("emotion"),
                unified_attention=unified_state.get("attention"),
                unified_posture=unified_state.get("posture"),
                unified_movement=unified_state.get("movement"),
                unified_fatigue=unified_state.get("fatigue"),
                unified_sentiment=unified_state.get("sentiment"),
                unified_confidence=unified_state.get("confidence"),
                attention_score=attention_score,
                engagement_level=engagement_level,
                stress_indicators=stress_indicators,
                confidence_level=confidence_level,
                video_data=video_data,
                audio_data=audio_data
            )
            
            self.db.save_unified_metric(metric)
            logger.debug(f"Saved unified metric for session {self.current_session_id}")
        except Exception as e:
            logger.error(f"Error processing unified metric: {e}")
            import traceback
            logger.error(traceback.format_exc())
    
    def _calculate_attention_score(self, unified_state: Dict[str, Any]) -> float:
        """Calculate attention score (0-100)"""
        attention_state = unified_state.get("attention", "Unknown")
        # Handle both string and dict formats
        if isinstance(attention_state, dict):
            attention_state = attention_state.get("state", "Unknown")
        attention_map = {
            "Focused": 90.0,
            "Partially Focused": 60.0,
            "Distracted": 30.0,
            "Unknown": 50.0
        }
        return attention_map.get(str(attention_state), 50.0)
    
    def _calculate_engagement_level(self, unified_state: Dict[str, Any]) -> str:
        """Calculate engagement level"""
        attention = unified_state.get("attention", "Unknown")
        emotion = unified_state.get("emotion", "neutral")
        sentiment = unified_state.get("sentiment", 0.0)
        
        # High engagement: focused attention + positive emotion + positive sentiment
        if attention == "Focused" and emotion in ["happy", "surprise"] and sentiment > 0.3:
            return "high"
        # Low engagement: distracted + negative emotion + negative sentiment
        elif attention == "Distracted" and emotion in ["sad", "angry"] and sentiment < -0.3:
            return "low"
        else:
            return "medium"
    
    def _calculate_stress_indicators(self, unified_state: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate stress indicators"""
        indicators = {
            "high_blink_rate": False,
            "negative_emotion": False,
            "poor_posture": False,
            "high_movement": False,
            "negative_sentiment": False
        }
        
        # Check various stress indicators
        if unified_state.get("movement") == "High":
            indicators["high_movement"] = True
        if unified_state.get("posture") in ["Fair", "Poor"]:
            indicators["poor_posture"] = True
        if unified_state.get("emotion") in ["sad", "angry", "fear"]:
            indicators["negative_emotion"] = True
        if unified_state.get("sentiment", 0.0) < -0.3:
            indicators["negative_sentiment"] = True
        
        return indicators
    
    def _calculate_confidence_level(self, unified_data: Dict[str, Any]) -> float:
        """Calculate confidence level (0-1)"""
        confidence_str = unified_data.get("unified_state", {}).get("confidence", "medium")
        confidence_map = {
            "high": 0.9,
            "medium": 0.6,
            "low": 0.3
        }
        return confidence_map.get(confidence_str, 0.5)
    
    async def disconnect(self):
        """Disconnect from BEVAL"""
        if self.socketio_client:
            await self.socketio_client.disconnect()
        if self.http_client:
            await self.http_client.aclose()
        self.is_connected = False
        logger.info("Disconnected from BEVAL")


async def main():
    """Main entry point"""
    import os
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    collector = BEVALCollector()
    
    # Use a fixed "current" session ID - always collect to this
    # CONVEI will query this session directly
    session_id = os.getenv("FUSION_SESSION_ID", "current_session")
    
    logger.info(f"Collecting to fixed session: {session_id}")
    
    if await collector.connect(session_id):
        try:
            await collector.collect_metrics()
        finally:
            await collector.disconnect()
            collector.db.close()


def main_sync():
    """Synchronous entry point for uv script"""
    asyncio.run(main())


if __name__ == "__main__":
    asyncio.run(main())

