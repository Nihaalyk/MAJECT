-- FUSION Database Schema
-- Behavioral metrics storage for video, audio, and unified metrics

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT,
    start_time REAL NOT NULL,
    end_time REAL,
    created_at REAL DEFAULT (strftime('%s', 'now'))
);

-- Video metrics table
CREATE TABLE IF NOT EXISTS video_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp REAL NOT NULL,
    emotion TEXT,
    emotion_scores TEXT,  -- JSON string
    attention_state TEXT,
    posture_state TEXT,
    movement_level TEXT,
    blink_rate REAL,
    total_blinks INTEGER,
    ear REAL,
    ear_threshold REAL,
    eye_asymmetry REAL,
    blink_duration REAL,
    blink_interval REAL,
    fatigue_level TEXT,
    drowsiness_score REAL,
    fps REAL,
    object_detections TEXT,  -- JSON string
    person_tracking TEXT,  -- JSON string
    created_at REAL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Audio metrics table
CREATE TABLE IF NOT EXISTS audio_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp REAL NOT NULL,
    transcription TEXT,
    emotion TEXT,
    sentiment REAL,
    confidence TEXT,
    energy REAL,
    pitch REAL,
    speech_rate REAL,
    silence_ratio REAL,
    energy_z_score REAL,
    pitch_z_score REAL,
    rate_z_score REAL,
    chunk_duration REAL,
    sample_rate INTEGER,
    word_count INTEGER,
    created_at REAL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Unified metrics table (combines video + audio)
CREATE TABLE IF NOT EXISTS unified_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp REAL NOT NULL,
    unified_emotion TEXT,
    unified_attention TEXT,
    unified_posture TEXT,
    unified_movement TEXT,
    unified_fatigue TEXT,
    unified_sentiment REAL,
    unified_confidence TEXT,
    attention_score REAL,
    engagement_level TEXT,
    stress_indicators TEXT,  -- JSON string
    confidence_level REAL,
    video_data TEXT,  -- JSON string
    audio_data TEXT,  -- JSON string
    created_at REAL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Aggregated metrics table (optional, for pre-computed aggregations)
CREATE TABLE IF NOT EXISTS aggregated_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    window_start REAL NOT NULL,
    window_end REAL NOT NULL,
    window_seconds INTEGER NOT NULL,
    metric_count INTEGER,
    dominant_emotion TEXT,
    average_sentiment REAL,
    average_attention REAL,
    engagement_score REAL,
    created_at REAL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_metrics_session_timestamp ON video_metrics(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audio_metrics_session_timestamp ON audio_metrics(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_unified_metrics_session_timestamp ON unified_metrics(session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_aggregated_metrics_session_window ON aggregated_metrics(session_id, window_start, window_end);







