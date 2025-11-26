"""
Check if all BEVAL metrics are being captured by FUSION
"""

import sqlite3
import json
from typing import Dict, Set, List

def get_beval_metrics_structure() -> Dict[str, List[str]]:
    """Expected BEVAL metrics structure based on code analysis"""
    return {
        "video": [
            "emotion",
            "emotion_scores",
            "attention_state",
            "posture_state",
            "movement_level",
            "blink_rate",
            "total_blinks",
            "ear",  # Eye Aspect Ratio
            "ear_threshold",
            "eye_asymmetry",
            "blink_duration",
            "blink_interval",
            "fatigue_level",
            "drowsiness_score",
            "fps",
            "object_detections",
            "person_tracking",
            "main_person",
            "current_detections"
        ],
        "audio": [
            "transcription",
            "emotion",
            "sentiment",
            "confidence",
            "confidence_label",
            "energy",
            "pitch",
            "speech_rate",
            "silence_ratio",
            "energy_z_score",
            "pitch_z_score",
            "rate_z_score",
            "chunk_duration",
            "sample_rate",
            "word_count",
            "total_words",
            "audio_features",
            "session_stats"
        ],
        "objects": [
            "detections",
            "tracking_data"
        ],
        "session_stats": [
            "session_duration",
            "total_frames",
            "total_audio_chunks",
            "avg_fps",
            "avg_attention_score"
        ]
    }

def get_fusion_schema_fields() -> Dict[str, List[str]]:
    """FUSION database schema fields"""
    return {
        "video_metrics": [
            "emotion",
            "emotion_scores",
            "attention_state",
            "posture_state",
            "movement_level",
            "blink_rate",
            "total_blinks",
            "ear",
            "ear_threshold",
            "eye_asymmetry",
            "blink_duration",
            "blink_interval",
            "fatigue_level",
            "drowsiness_score",
            "fps",
            "object_detections",
            "person_tracking"
        ],
        "audio_metrics": [
            "transcription",
            "emotion",
            "sentiment",
            "confidence",
            "energy",
            "pitch",
            "speech_rate",
            "silence_ratio",
            "energy_z_score",
            "pitch_z_score",
            "rate_z_score",
            "chunk_duration",
            "sample_rate",
            "word_count"
        ],
        "unified_metrics": [
            "unified_emotion",
            "unified_attention",
            "unified_posture",
            "unified_movement",
            "unified_fatigue",
            "unified_sentiment",
            "unified_confidence",
            "attention_score",
            "engagement_level",
            "stress_indicators",
            "confidence_level",
            "video_data",  # JSON string containing all video data
            "audio_data"   # JSON string containing all audio data
        ]
    }

def check_actual_data(db_path: str = "fusion.db"):
    """Check what's actually in the database"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get latest unified metric
    cursor.execute("""
        SELECT video_data, audio_data 
        FROM unified_metrics 
        ORDER BY timestamp DESC 
        LIMIT 1
    """)
    row = cursor.fetchone()
    
    if not row or not row[0]:
        print("No data found in database")
        conn.close()
        return None, None
    
    video_data = json.loads(row[0]) if row[0] else {}
    audio_data = json.loads(row[1]) if row[1] else {}
    
    conn.close()
    return video_data, audio_data

def compare_metrics():
    """Compare BEVAL metrics vs FUSION capture"""
    print("=" * 70)
    print("BEVAL Metrics Coverage Analysis")
    print("=" * 70)
    
    beval_metrics = get_beval_metrics_structure()
    fusion_schema = get_fusion_schema_fields()
    actual_video, actual_audio = check_actual_data()
    
    print("\n1. VIDEO METRICS")
    print("-" * 70)
    
    beval_video = set(beval_metrics["video"])
    fusion_video = set(fusion_schema["video_metrics"])
    actual_video_keys = set(actual_video.keys()) if actual_video else set()
    
    # Metrics in BEVAL but not in FUSION schema
    missing_in_schema = beval_video - fusion_video
    if missing_in_schema:
        print(f"[WARN] Missing in FUSION schema: {sorted(missing_in_schema)}")
    else:
        print("[OK] All BEVAL video metrics are in FUSION schema")
    
    # Metrics in schema but not captured
    in_schema_not_captured = fusion_video - actual_video_keys
    if in_schema_not_captured:
        print(f"[WARN] In schema but not captured: {sorted(in_schema_not_captured)}")
    else:
        print("[OK] All schema fields are being captured")
    
    # Metrics captured but not in schema
    captured_not_in_schema = actual_video_keys - fusion_video
    if captured_not_in_schema:
        print(f"[INFO] Captured but not in schema (stored in JSON): {sorted(captured_not_in_schema)}")
    
    print(f"\n   BEVAL video metrics: {len(beval_video)}")
    print(f"   FUSION schema fields: {len(fusion_video)}")
    print(f"   Actually captured: {len(actual_video_keys)}")
    
    print("\n2. AUDIO METRICS")
    print("-" * 70)
    
    beval_audio = set(beval_metrics["audio"])
    fusion_audio = set(fusion_schema["audio_metrics"])
    actual_audio_keys = set(actual_audio.keys()) if actual_audio else set()
    
    # Handle nested audio_features
    if actual_audio and "audio_features" in actual_audio:
        if isinstance(actual_audio["audio_features"], dict):
            actual_audio_keys.update(actual_audio["audio_features"].keys())
    
    missing_in_schema = beval_audio - fusion_audio
    if missing_in_schema:
        print(f"[WARN] Missing in FUSION schema: {sorted(missing_in_schema)}")
    else:
        print("[OK] All BEVAL audio metrics are in FUSION schema")
    
    in_schema_not_captured = fusion_audio - actual_audio_keys
    if in_schema_not_captured:
        print(f"[WARN] In schema but not captured: {sorted(in_schema_not_captured)}")
    else:
        print("[OK] All schema fields are being captured")
    
    captured_not_in_schema = actual_audio_keys - fusion_audio
    if captured_not_in_schema:
        print(f"[INFO] Captured but not in schema (stored in JSON): {sorted(captured_not_in_schema)}")
    
    print(f"\n   BEVAL audio metrics: {len(beval_audio)}")
    print(f"   FUSION schema fields: {len(fusion_audio)}")
    print(f"   Actually captured: {len(actual_audio_keys)}")
    
    print("\n3. ADDITIONAL BEVAL DATA")
    print("-" * 70)
    
    # Check for objects and session_stats
    beval_objects = beval_metrics.get("objects", [])
    beval_session_stats = beval_metrics.get("session_stats", [])
    
    print(f"   Objects data: {len(beval_objects)} fields")
    print(f"   Session stats: {len(beval_session_stats)} fields")
    
    if actual_audio and "session_stats" in actual_audio:
        print(f"   [OK] Session stats captured in audio_data JSON")
    else:
        print(f"   [WARN] Session stats not found in captured data")
    
    print("\n4. SUMMARY")
    print("-" * 70)
    
    # Calculate coverage
    video_coverage = len(actual_video_keys & fusion_video) / len(fusion_video) * 100 if fusion_video else 0
    audio_coverage = len(actual_audio_keys & fusion_audio) / len(fusion_audio) * 100 if fusion_audio else 0
    
    print(f"   Video metrics coverage: {video_coverage:.1f}%")
    print(f"   Audio metrics coverage: {audio_coverage:.1f}%")
    
    # Check if all critical metrics are captured
    critical_video = {"emotion", "attention_state", "posture_state", "fatigue_level"}
    critical_audio = {"transcription", "sentiment", "emotion", "confidence"}
    
    critical_video_captured = critical_video.issubset(actual_video_keys) if actual_video else False
    critical_audio_captured = critical_audio.issubset(actual_audio_keys) if actual_audio else False
    
    if critical_video_captured and critical_audio_captured:
        print("   [OK] All critical metrics are captured")
    else:
        missing_critical = []
        if not critical_video_captured:
            missing_critical.extend(critical_video - (actual_video_keys if actual_video else set()))
        if not critical_audio_captured:
            missing_critical.extend(critical_audio - (actual_audio_keys if actual_audio else set()))
        print(f"   [WARN] Missing critical metrics: {missing_critical}")
    
    print("\n" + "=" * 70)
    
    # Detailed breakdown
    if actual_video:
        print("\n5. ACTUAL VIDEO DATA KEYS:")
        print("-" * 70)
        for key in sorted(actual_video.keys()):
            value_type = type(actual_video[key]).__name__
            print(f"   {key}: {value_type}")
    
    if actual_audio:
        print("\n6. ACTUAL AUDIO DATA KEYS:")
        print("-" * 70)
        for key in sorted(actual_audio.keys()):
            value_type = type(actual_audio[key]).__name__
            if isinstance(actual_audio[key], dict):
                print(f"   {key}: dict with keys {list(actual_audio[key].keys())}")
            else:
                print(f"   {key}: {value_type}")

if __name__ == "__main__":
    compare_metrics()


"""

import sqlite3
import json
from typing import Dict, Set, List

def get_beval_metrics_structure() -> Dict[str, List[str]]:
    """Expected BEVAL metrics structure based on code analysis"""
    return {
        "video": [
            "emotion",
            "emotion_scores",
            "attention_state",
            "posture_state",
            "movement_level",
            "blink_rate",
            "total_blinks",
            "ear",  # Eye Aspect Ratio
            "ear_threshold",
            "eye_asymmetry",
            "blink_duration",
            "blink_interval",
            "fatigue_level",
            "drowsiness_score",
            "fps",
            "object_detections",
            "person_tracking",
            "main_person",
            "current_detections"
        ],
        "audio": [
            "transcription",
            "emotion",
            "sentiment",
            "confidence",
            "confidence_label",
            "energy",
            "pitch",
            "speech_rate",
            "silence_ratio",
            "energy_z_score",
            "pitch_z_score",
            "rate_z_score",
            "chunk_duration",
            "sample_rate",
            "word_count",
            "total_words",
            "audio_features",
            "session_stats"
        ],
        "objects": [
            "detections",
            "tracking_data"
        ],
        "session_stats": [
            "session_duration",
            "total_frames",
            "total_audio_chunks",
            "avg_fps",
            "avg_attention_score"
        ]
    }

def get_fusion_schema_fields() -> Dict[str, List[str]]:
    """FUSION database schema fields"""
    return {
        "video_metrics": [
            "emotion",
            "emotion_scores",
            "attention_state",
            "posture_state",
            "movement_level",
            "blink_rate",
            "total_blinks",
            "ear",
            "ear_threshold",
            "eye_asymmetry",
            "blink_duration",
            "blink_interval",
            "fatigue_level",
            "drowsiness_score",
            "fps",
            "object_detections",
            "person_tracking"
        ],
        "audio_metrics": [
            "transcription",
            "emotion",
            "sentiment",
            "confidence",
            "energy",
            "pitch",
            "speech_rate",
            "silence_ratio",
            "energy_z_score",
            "pitch_z_score",
            "rate_z_score",
            "chunk_duration",
            "sample_rate",
            "word_count"
        ],
        "unified_metrics": [
            "unified_emotion",
            "unified_attention",
            "unified_posture",
            "unified_movement",
            "unified_fatigue",
            "unified_sentiment",
            "unified_confidence",
            "attention_score",
            "engagement_level",
            "stress_indicators",
            "confidence_level",
            "video_data",  # JSON string containing all video data
            "audio_data"   # JSON string containing all audio data
        ]
    }

def check_actual_data(db_path: str = "fusion.db"):
    """Check what's actually in the database"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get latest unified metric
    cursor.execute("""
        SELECT video_data, audio_data 
        FROM unified_metrics 
        ORDER BY timestamp DESC 
        LIMIT 1
    """)
    row = cursor.fetchone()
    
    if not row or not row[0]:
        print("No data found in database")
        conn.close()
        return None, None
    
    video_data = json.loads(row[0]) if row[0] else {}
    audio_data = json.loads(row[1]) if row[1] else {}
    
    conn.close()
    return video_data, audio_data

def compare_metrics():
    """Compare BEVAL metrics vs FUSION capture"""
    print("=" * 70)
    print("BEVAL Metrics Coverage Analysis")
    print("=" * 70)
    
    beval_metrics = get_beval_metrics_structure()
    fusion_schema = get_fusion_schema_fields()
    actual_video, actual_audio = check_actual_data()
    
    print("\n1. VIDEO METRICS")
    print("-" * 70)
    
    beval_video = set(beval_metrics["video"])
    fusion_video = set(fusion_schema["video_metrics"])
    actual_video_keys = set(actual_video.keys()) if actual_video else set()
    
    # Metrics in BEVAL but not in FUSION schema
    missing_in_schema = beval_video - fusion_video
    if missing_in_schema:
        print(f"[WARN] Missing in FUSION schema: {sorted(missing_in_schema)}")
    else:
        print("[OK] All BEVAL video metrics are in FUSION schema")
    
    # Metrics in schema but not captured
    in_schema_not_captured = fusion_video - actual_video_keys
    if in_schema_not_captured:
        print(f"[WARN] In schema but not captured: {sorted(in_schema_not_captured)}")
    else:
        print("[OK] All schema fields are being captured")
    
    # Metrics captured but not in schema
    captured_not_in_schema = actual_video_keys - fusion_video
    if captured_not_in_schema:
        print(f"[INFO] Captured but not in schema (stored in JSON): {sorted(captured_not_in_schema)}")
    
    print(f"\n   BEVAL video metrics: {len(beval_video)}")
    print(f"   FUSION schema fields: {len(fusion_video)}")
    print(f"   Actually captured: {len(actual_video_keys)}")
    
    print("\n2. AUDIO METRICS")
    print("-" * 70)
    
    beval_audio = set(beval_metrics["audio"])
    fusion_audio = set(fusion_schema["audio_metrics"])
    actual_audio_keys = set(actual_audio.keys()) if actual_audio else set()
    
    # Handle nested audio_features
    if actual_audio and "audio_features" in actual_audio:
        if isinstance(actual_audio["audio_features"], dict):
            actual_audio_keys.update(actual_audio["audio_features"].keys())
    
    missing_in_schema = beval_audio - fusion_audio
    if missing_in_schema:
        print(f"[WARN] Missing in FUSION schema: {sorted(missing_in_schema)}")
    else:
        print("[OK] All BEVAL audio metrics are in FUSION schema")
    
    in_schema_not_captured = fusion_audio - actual_audio_keys
    if in_schema_not_captured:
        print(f"[WARN] In schema but not captured: {sorted(in_schema_not_captured)}")
    else:
        print("[OK] All schema fields are being captured")
    
    captured_not_in_schema = actual_audio_keys - fusion_audio
    if captured_not_in_schema:
        print(f"[INFO] Captured but not in schema (stored in JSON): {sorted(captured_not_in_schema)}")
    
    print(f"\n   BEVAL audio metrics: {len(beval_audio)}")
    print(f"   FUSION schema fields: {len(fusion_audio)}")
    print(f"   Actually captured: {len(actual_audio_keys)}")
    
    print("\n3. ADDITIONAL BEVAL DATA")
    print("-" * 70)
    
    # Check for objects and session_stats
    beval_objects = beval_metrics.get("objects", [])
    beval_session_stats = beval_metrics.get("session_stats", [])
    
    print(f"   Objects data: {len(beval_objects)} fields")
    print(f"   Session stats: {len(beval_session_stats)} fields")
    
    if actual_audio and "session_stats" in actual_audio:
        print(f"   [OK] Session stats captured in audio_data JSON")
    else:
        print(f"   [WARN] Session stats not found in captured data")
    
    print("\n4. SUMMARY")
    print("-" * 70)
    
    # Calculate coverage
    video_coverage = len(actual_video_keys & fusion_video) / len(fusion_video) * 100 if fusion_video else 0
    audio_coverage = len(actual_audio_keys & fusion_audio) / len(fusion_audio) * 100 if fusion_audio else 0
    
    print(f"   Video metrics coverage: {video_coverage:.1f}%")
    print(f"   Audio metrics coverage: {audio_coverage:.1f}%")
    
    # Check if all critical metrics are captured
    critical_video = {"emotion", "attention_state", "posture_state", "fatigue_level"}
    critical_audio = {"transcription", "sentiment", "emotion", "confidence"}
    
    critical_video_captured = critical_video.issubset(actual_video_keys) if actual_video else False
    critical_audio_captured = critical_audio.issubset(actual_audio_keys) if actual_audio else False
    
    if critical_video_captured and critical_audio_captured:
        print("   [OK] All critical metrics are captured")
    else:
        missing_critical = []
        if not critical_video_captured:
            missing_critical.extend(critical_video - (actual_video_keys if actual_video else set()))
        if not critical_audio_captured:
            missing_critical.extend(critical_audio - (actual_audio_keys if actual_audio else set()))
        print(f"   [WARN] Missing critical metrics: {missing_critical}")
    
    print("\n" + "=" * 70)
    
    # Detailed breakdown
    if actual_video:
        print("\n5. ACTUAL VIDEO DATA KEYS:")
        print("-" * 70)
        for key in sorted(actual_video.keys()):
            value_type = type(actual_video[key]).__name__
            print(f"   {key}: {value_type}")
    
    if actual_audio:
        print("\n6. ACTUAL AUDIO DATA KEYS:")
        print("-" * 70)
        for key in sorted(actual_audio.keys()):
            value_type = type(actual_audio[key]).__name__
            if isinstance(actual_audio[key], dict):
                print(f"   {key}: dict with keys {list(actual_audio[key].keys())}")
            else:
                print(f"   {key}: {value_type}")

if __name__ == "__main__":
    compare_metrics()
