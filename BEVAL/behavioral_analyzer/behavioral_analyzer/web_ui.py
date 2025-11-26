"""
Web UI Module for Behavioral Analyzer.

This module provides a real-time web dashboard for monitoring
behavioral analysis results including video, audio, and object detection data.
"""

import json
import time
import threading
import os
import socket
from typing import Dict, Any, Optional
from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import cv2
import base64
import numpy as np

from .config import Config
from .unified_analyzer import UnifiedBehavioralAnalyzer


class BehavioralWebUI:
    """
    Web-based dashboard for real-time behavioral analysis monitoring.
    
    Features:
    - Real-time video feed
    - Live emotion, attention, and posture data
    - Audio transcription and sentiment analysis
    - Object detection results
    - Interactive charts and graphs
    - Session statistics
    """
    
    def __init__(self, config: Config, analyzer: Optional[UnifiedBehavioralAnalyzer] = None):
        """
        Initialize the web UI.
        
        Args:
            config: Configuration object
            analyzer: Optional existing analyzer instance
        """
        self.config = config
        self.analyzer = analyzer
        
        # Get the correct paths for templates and static files
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(current_dir)
        template_folder = os.path.join(project_root, 'templates')
        static_folder = os.path.join(project_root, 'static')
        
        # Debug: Print the paths
        print(f"Current dir: {current_dir}")
        print(f"Project root: {project_root}")
        print(f"Template folder: {template_folder}")
        print(f"Static folder: {static_folder}")
        
        # Verify paths exist
        if not os.path.exists(template_folder):
            print(f"ERROR: Template folder not found at {template_folder}")
            # Try alternative path
            template_folder = os.path.join(current_dir, '..', 'templates')
            template_folder = os.path.abspath(template_folder)
            print(f"Trying alternative template path: {template_folder}")
            
        if not os.path.exists(static_folder):
            print(f"ERROR: Static folder not found at {static_folder}")
            # Try alternative path
            static_folder = os.path.join(current_dir, '..', 'static')
            static_folder = os.path.abspath(static_folder)
            print(f"Trying alternative static path: {static_folder}")
        
        print(f"Final template folder: {template_folder}")
        print(f"Final static folder: {static_folder}")
        print(f"Template exists: {os.path.exists(template_folder)}")
        print(f"Static exists: {os.path.exists(static_folder)}")
        
        self.app = Flask(__name__, 
                        template_folder=template_folder,
                        static_folder=static_folder)
        self.app.config['SECRET_KEY'] = 'behavioral_analyzer_secret_key'
        # Use threading mode on Windows, eventlet on Unix
        async_mode = 'threading' if os.name == 'nt' else 'eventlet'
        self.socketio = SocketIO(self.app, cors_allowed_origins="*", async_mode=async_mode)
        
        # Data storage
        self.latest_data = {
            'video': {},
            'audio': {},
            'objects': {},
            'session_stats': {},
            'timestamp': time.time()
        }
        
        # Statistics tracking
        self.emotion_history = []
        self.attention_scores = []
        self.previous_emotion = None
        self.emotion_change_count = 0
        
        # Video streaming
        self.video_streaming = False
        self.video_thread = None
        
        # Frame processing
        self.frame_processing_active = False
        self.frame_processing_thread = None
        
        # Setup routes
        self._setup_routes()
        self._setup_socketio_events()
        
        # Start data collection thread
        self.data_thread = None
        self.data_thread_active = False
    
    def _setup_routes(self):
        """Setup Flask routes."""
        
        @self.app.route('/')
        def index():
            """Main dashboard page."""
            try:
                print(f"Template folder: {self.app.template_folder}")
                print(f"Static folder: {self.app.static_folder}")
                return render_template('dashboard.html')
            except Exception as e:
                print(f"Error rendering dashboard: {e}")
                import traceback
                traceback.print_exc()
                return f"Error loading dashboard: {str(e)}", 500
        
        @self.app.route('/api/data')
        def get_data():
            """Get current analysis data."""
            return jsonify(self.latest_data)
        
        @self.app.route('/api/config')
        def get_config():
            """Get current configuration."""
            return jsonify({
                'video_enabled': self.config.video.enable_emotion,
                'audio_enabled': self.config.audio.enable_transcription,
                'object_detection_enabled': self.config.video.enable_object_detection,
                'debug_mode': self.config.video.debug_mode
            })
        
        @self.app.route('/api/controls', methods=['POST'])
        def update_controls():
            """Update analyzer controls."""
            data = request.get_json()
            
            if 'debug_mode' in data:
                self.config.video.debug_mode = data['debug_mode']
            
            if 'show_landmarks' in data:
                self.config.video.show_landmarks = data['show_landmarks']
            
            if 'show_objects' in data:
                self.config.video.show_object_detections = data['show_objects']
            
            return jsonify({'status': 'success'})
    
    def _setup_socketio_events(self):
        """Setup SocketIO events."""
        
        @self.socketio.on('connect')
        def handle_connect():
            """Handle client connection."""
            print(f"Client connected: {request.sid}")
            emit('status', {'message': 'Connected to Behavioral Analyzer'})
        
        @self.socketio.on('disconnect')
        def handle_disconnect():
            """Handle client disconnection."""
            print(f"Client disconnected: {request.sid}")
        
        @self.socketio.on('request_data')
        def handle_data_request():
            """Handle data request from client."""
            emit('data_update', self.latest_data)
        
        @self.socketio.on('toggle_video_stream')
        def handle_video_toggle(data):
            """Toggle video streaming."""
            self.video_streaming = data.get('enabled', False)
            if self.video_streaming and not self.video_thread:
                self._start_video_stream()
            elif not self.video_streaming and self.video_thread:
                self._stop_video_stream()
            
            emit('status', {'message': f'Video streaming {"enabled" if self.video_streaming else "disabled"}'})
        
        @self.socketio.on('update_controls')
        def handle_update_controls(data):
            """Handle control updates from client."""
            try:
                print(f"Received control update: {data}")
                
                # Update configuration based on received data
                if 'debug_mode' in data:
                    self.config.debug_mode = data['debug_mode']
                    print(f"Debug mode: {data['debug_mode']}")
                
                if 'show_landmarks' in data:
                    self.config.video.show_landmarks = data['show_landmarks']
                    print(f"Show landmarks: {data['show_landmarks']}")
                
                if 'show_objects' in data:
                    self.config.video.show_object_detections = data['show_objects']
                    print(f"Show objects: {data['show_objects']}")
                
                emit('status', {'message': 'Controls updated successfully'})
            except Exception as e:
                print(f"Error updating controls: {e}")
                emit('status', {'message': f'Error updating controls: {str(e)}'})
    
    def _start_video_stream(self):
        """Start video streaming thread."""
        if self.analyzer and hasattr(self.analyzer, 'video_analyzer'):
            self.video_thread = threading.Thread(target=self._video_stream_worker, daemon=True)
            self.video_thread.start()
    
    def _stop_video_stream(self):
        """Stop video streaming thread."""
        self.video_streaming = False
        if self.video_thread:
            self.video_thread.join(timeout=1.0)
            self.video_thread = None
    
    def _video_stream_worker(self):
        """Video streaming worker thread."""
        while self.video_streaming and self.analyzer:
            try:
                # Get current frame from analyzer
                if hasattr(self.analyzer, 'video_analyzer') and hasattr(self.analyzer.video_analyzer, 'current_frame'):
                    frame = self.analyzer.video_analyzer.current_frame
                    if frame is not None and frame.size > 0:
                        # Encode frame as JPEG
                        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                        if buffer is not None:
                            frame_base64 = base64.b64encode(buffer).decode('utf-8')
                            
                            # Emit frame to all connected clients
                            self.socketio.emit('video_frame', {
                                'frame': frame_base64,
                                'timestamp': time.time()
                            })
                
                time.sleep(0.033)  # ~30 FPS
            except Exception as e:
                print(f"Video streaming error: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(0.1)
    
    def _start_data_collection(self):
        """Start data collection thread."""
        self.data_thread_active = True
        self.data_thread = threading.Thread(target=self._data_collection_worker, daemon=True)
        self.data_thread.start()
    
    def _stop_data_collection(self):
        """Stop data collection thread."""
        self.data_thread_active = False
        if self.data_thread:
            self.data_thread.join(timeout=1.0)
            self.data_thread = None
    
    def _attention_state_to_score(self, attention_state: str) -> Optional[float]:
        """Convert attention state to numeric score (0-100)."""
        attention_map = {
            'Focused': 90.0,
            'Partially Focused': 60.0,
            'Distracted': 30.0,
            'Unknown': None
        }
        return attention_map.get(attention_state, None)
    
    def _fatigue_level_to_score(self, fatigue_level: str) -> float:
        """Convert fatigue level to numeric score (0-100)."""
        fatigue_map = {
            'Normal': 20.0,
            'Mild': 40.0,
            'Moderate': 60.0,
            'Severe': 80.0
        }
        return fatigue_map.get(fatigue_level, 20.0)
    
    def _data_collection_worker(self):
        """Data collection worker thread."""
        while self.data_thread_active and self.analyzer:
            try:
                # Collect data from analyzer
                self._collect_analyzer_data()
                
                # Emit data to connected clients
                self.socketio.emit('data_update', self.latest_data)
                
                time.sleep(0.1)  # 10 Hz update rate
            except Exception as e:
                print(f"Data collection error: {e}")
                # Continue emitting even if there's an error, with fallback data
                try:
                    fallback_data = {
                        'video': {'emotion': 'Unknown', 'fps': 0, 'blink_rate': 0},
                        'audio': {'transcription': '', 'emotion': 'neutral', 'sentiment': 0.0, 'confidence': 0.0},
                        'objects': {'detections': []},
                        'session_stats': {'session_duration': 0, 'timestamp': time.time()}
                    }
                    self.socketio.emit('data_update', fallback_data)
                except Exception as emit_error:
                    print(f"Failed to emit fallback data: {emit_error}")
                time.sleep(0.1)
    
    def _convert_numpy_types(self, obj):
        """Convert numpy types to native Python types for JSON serialization."""
        import numpy as np
        
        if isinstance(obj, dict):
            return {key: self._convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_numpy_types(item) for item in obj]
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif hasattr(obj, 'item'):  # Handle numpy scalars
            return obj.item()
        else:
            return obj
    
    def _collect_analyzer_data(self):
        """Collect data from the analyzer."""
        if not self.analyzer:
            return
        
        current_time = time.time()
        
        # Video analysis data
        video_data = {}
        if hasattr(self.analyzer, 'video_analyzer'):
            va = self.analyzer.video_analyzer
            video_data = {
                'emotion': str(getattr(va, 'current_emotion', 'Unknown')),
                'emotion_scores': getattr(va, 'emotion_scores', {}),
                'attention_state': str(getattr(va, 'attention_state', 'Unknown')),
                'posture_state': str(getattr(va, 'posture_state', 'Unknown')),
                'movement_level': str(getattr(va, 'movement_level', 'Unknown')),
                'fatigue_level': str(getattr(va, 'fatigue_level', 'Normal')),
                'blink_rate': float(getattr(va, 'blink_count', 0) / max(1, current_time - getattr(va, 'last_reset_time', current_time)) * 60.0),
                'total_blinks': int(getattr(va, 'total_blink_count', 0)),
                'fps': float(getattr(va.performance_tracker, 'current_fps', 0.0) if hasattr(va, 'performance_tracker') else 0.0),
                'person_tracking': getattr(va, '_get_person_tracking_data', lambda: {})(),
                'main_person': getattr(va, 'main_person', None)
            }
        
        # Audio analysis data
        audio_data = {}
        if hasattr(self.analyzer, 'audio_analyzer'):
            aa = self.analyzer.audio_analyzer
            
            # Handle confidence conversion - it can be a string like "low", "medium", "high"
            confidence_value = getattr(aa, 'current_confidence', 0.0)
            if isinstance(confidence_value, str):
                confidence_map = {"low": 0.3, "medium": 0.6, "high": 0.9}
                confidence_numeric = confidence_map.get(confidence_value.lower(), 0.0)
            else:
                confidence_numeric = float(confidence_value)
            
            audio_data = {
                'transcription': str(getattr(aa, 'current_transcription', '')),
                'emotion': str(getattr(aa, 'current_emotion', 'neutral')),
                'sentiment': float(getattr(aa, 'current_sentiment', 0.0)),
                'confidence': confidence_numeric,
                'confidence_label': str(confidence_value) if isinstance(confidence_value, str) else "unknown",
                'audio_features': getattr(aa, 'audio_features', {}),
                'session_stats': getattr(aa, 'session_stats', {})
            }
        
        # Object detection data
        objects_data = {}
        if hasattr(self.analyzer, 'video_analyzer') and hasattr(self.analyzer.video_analyzer, 'object_detector'):
            od = self.analyzer.video_analyzer.object_detector
            if od:
                objects_data = {
                    'detections': getattr(self.analyzer.video_analyzer, 'current_detections', []),
                    'summary': od.get_detection_summary(),
                    'object_counts': getattr(od, 'object_counts', {})
                }
        
        # Track emotion changes
        current_emotion = video_data.get('emotion', 'Unknown')
        if current_emotion != 'Unknown' and current_emotion != self.previous_emotion and self.previous_emotion is not None:
            self.emotion_change_count += 1
        if current_emotion != 'Unknown':
            self.previous_emotion = current_emotion
        
        # Track attention scores
        attention_state = video_data.get('attention_state', 'Unknown')
        if attention_state != 'Unknown':
            attention_score = self._attention_state_to_score(attention_state)
            if attention_score is not None:
                self.attention_scores.append(attention_score)
                # Keep only last 100 scores
                if len(self.attention_scores) > 100:
                    self.attention_scores.pop(0)
        
        # Calculate average attention
        avg_attention = 0.0
        if self.attention_scores:
            avg_attention = sum(self.attention_scores) / len(self.attention_scores)
        
        # Calculate fatigue score
        fatigue_level = video_data.get('fatigue_level', 'Normal')
        fatigue_score = self._fatigue_level_to_score(fatigue_level)
        
        # Session statistics
        session_stats = {
            'session_duration': float(current_time - getattr(self.analyzer, 'session_start_time', current_time)),
            'total_frames_processed': int(getattr(self.analyzer, 'total_frames_processed', 0)),
            'emotion_changes': int(self.emotion_change_count),
            'avg_attention_score': float(avg_attention),
            'fatigue_score': float(fatigue_score),
            'timestamp': float(current_time)
        }
        
        # Convert all numpy types to native Python types
        video_data = self._convert_numpy_types(video_data)
        audio_data = self._convert_numpy_types(audio_data)
        objects_data = self._convert_numpy_types(objects_data)
        session_stats = self._convert_numpy_types(session_stats)
        
        # Update latest data
        self.latest_data = {
            'video': video_data,
            'audio': audio_data,
            'objects': objects_data,
            'session_stats': session_stats,
            'timestamp': float(current_time)
        }
    
    def start_analyzer(self):
        """Start the behavioral analyzer."""
        if not self.analyzer:
            self.analyzer = UnifiedBehavioralAnalyzer(self.config)
        
        if not self.analyzer.start_analysis():
            print("Failed to start analyzer")
            return False
        
        # Initialize current_frame attribute in video_analyzer if it doesn't exist
        if hasattr(self.analyzer, 'video_analyzer'):
            if not hasattr(self.analyzer.video_analyzer, 'current_frame'):
                self.analyzer.video_analyzer.current_frame = None
        
        # Start frame processing thread
        self.frame_processing_active = True
        self.frame_processing_thread = threading.Thread(target=self._frame_processing_worker, daemon=True)
        self.frame_processing_thread.start()
        
        # Auto-enable video streaming
        self.video_streaming = True
        self._start_video_stream()
        
        # Start data collection
        self._start_data_collection()
        
        return True
    
    def stop_analyzer(self):
        """Stop the behavioral analyzer."""
        # Stop frame processing
        self.frame_processing_active = False
        if self.frame_processing_thread:
            self.frame_processing_thread.join(timeout=2.0)
            self.frame_processing_thread = None
        
        if self.analyzer:
            self.analyzer.cleanup()
        
        # Stop data collection
        self._stop_data_collection()
        
        # Stop video streaming
        self._stop_video_stream()
    
    def _frame_processing_worker(self):
        """Continuously process frames from the camera (optimized)."""
        last_frame_time = time.time()
        target_fps = 30.0
        frame_time = 1.0 / target_fps
        
        while self.frame_processing_active and self.analyzer:
            try:
                if self.analyzer and self.analyzer.is_running:
                    current_time = time.time()
                    elapsed = current_time - last_frame_time
                    
                    # Process frame only if enough time has passed (maintain target FPS)
                    if elapsed >= frame_time:
                        success, frame = self.analyzer.process_frame()
                        if success and frame is not None:
                            # Store the processed frame for video streaming (avoid copy if possible)
                            if hasattr(self.analyzer, 'video_analyzer'):
                                # Only copy if frame will be modified elsewhere
                                if hasattr(self.analyzer.video_analyzer, 'current_frame') and \
                                   self.analyzer.video_analyzer.current_frame is not None:
                                    # Reuse existing frame buffer if same size
                                    if frame.shape == self.analyzer.video_analyzer.current_frame.shape:
                                        np.copyto(self.analyzer.video_analyzer.current_frame, frame)
                                    else:
                                        self.analyzer.video_analyzer.current_frame = frame.copy()
                                else:
                                    self.analyzer.video_analyzer.current_frame = frame.copy()
                        last_frame_time = current_time
                    else:
                        # Sleep for remaining time to maintain FPS
                        time.sleep(max(0, frame_time - elapsed))
                else:
                    time.sleep(0.1)
            except Exception as e:
                print(f"Frame processing error: {e}")
                import traceback
                traceback.print_exc()
                time.sleep(0.1)
    
    def run(self, host='0.0.0.0', port=5000, debug=False):
        """
        Run the web UI server.
        
        Args:
            host: Host to bind to
            port: Port to bind to
            debug: Enable debug mode
        """
        print(f"Starting Behavioral Analyzer Web UI on http://{host}:{port}")
        print("Press Ctrl+C to stop")
        
        try:
            self.socketio.run(self.app, host=host, port=port, debug=debug)
        except KeyboardInterrupt:
            print("\nShutting down web UI...")
            self.stop_analyzer()


def create_web_ui(config: Config, analyzer: Optional[UnifiedBehavioralAnalyzer] = None) -> BehavioralWebUI:
    """
    Create a web UI instance.
    
    Args:
        config: Configuration object
        analyzer: Optional existing analyzer instance
        
    Returns:
        BehavioralWebUI instance
    """
    return BehavioralWebUI(config, analyzer)
