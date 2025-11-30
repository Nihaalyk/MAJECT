# MAJECT Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Component Details](#component-details)
4. [API Documentation](#api-documentation)
5. [Data Flow](#data-flow)
6. [Configuration](#configuration)
7. [Development Guide](#development-guide)
8. [Deployment](#deployment)

---

## System Overview

**MAJECT** (Multi-Agent Behavioral Intelligence System) is a comprehensive AI-powered conversational platform that combines real-time behavioral analysis with emotionally intelligent AI interactions. The system consists of three main components:

- **BEVAL**: Real-time behavioral analyzer for video and audio
- **FUSION**: Integration layer that collects, processes, and serves behavioral metrics
- **CONVEI**: Conversational AI interface powered by Google Gemini 2.5 Live API

### Key Capabilities

- **Multimodal Behavioral Analysis**: Real-time analysis of facial expressions, voice, posture, and movement
- **Emotionally Intelligent AI**: ARIA (Advanced Relational Intelligence Assistant) with deep emotional understanding
- **Real-time Voice Interaction**: Natural voice conversations with live transcription
- **Behavioral Context Integration**: AI responses adapt based on detected emotional states
- **Comprehensive Reporting**: End-of-conversation behavioral reports with insights

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   BEVAL         │
│  (Analyzer)     │──┐
│                 │  │
│  - Video        │  │ SocketIO
│  - Audio        │  │ Events
│  - Unified      │  │
└─────────────────┘  │
                     │
                     ▼
              ┌──────────────┐
              │   FUSION     │
              │  (Collector) │
              │              │
              │  - SQLite DB │
              │  - API       │
              │  - Processor │
              └──────────────┘
                     │
                     │ HTTP/REST
                     │
                     ▼
              ┌──────────────┐
              │   CONVEI     │
              │  (Frontend)  │
              │              │
              │  - React     │
              │  - Gemini    │
              │  - ARIA      │
              └──────────────┘
```

### Technology Stack

#### BEVAL
- **Language**: Python 3.12+
- **ML Frameworks**: TensorFlow, DeepFace, MediaPipe, Whisper
- **Computer Vision**: OpenCV, YOLOv8, dlib
- **Audio Processing**: librosa, pyaudio
- **Web Framework**: Flask, SocketIO
- **Package Manager**: uv

#### FUSION
- **Language**: Python 3.12+
- **Web Framework**: FastAPI, Uvicorn
- **Database**: SQLite (WAL mode)
- **Real-time**: python-socketio (async client)
- **HTTP Client**: httpx
- **Package Manager**: uv

#### CONVEI
- **Language**: TypeScript
- **Framework**: React 18
- **AI SDK**: @google/genai (Gemini 2.5 Live)
- **State Management**: React Context API
- **Styling**: SCSS with CSS Variables
- **Build Tool**: Create React App
- **Package Manager**: npm

---

## Component Details

### BEVAL (Behavioral Analyzer)

#### Purpose
Real-time analysis of human behavior through video and audio streams.

#### Key Modules

**1. Video Analyzer (`video_analyzer.py`)**
- Facial expression detection (7 emotions: happy, sad, angry, fear, surprise, disgust, neutral)
- Eye aspect ratio (EAR) calculation for blink detection
- Gaze direction tracking
- Posture analysis
- Movement detection
- Head pose estimation

**2. Audio Analyzer (`audio_analyzer.py`)**
- Speech transcription (Whisper)
- Sentiment analysis
- Prosody analysis (pitch, energy, speech rate)
- Emotion detection from voice
- Audio chunk processing

**3. Unified Analyzer (`unified_analyzer.py`)**
- Combines video and audio metrics
- Temporal correlation
- Cross-modal validation
- Comprehensive behavioral state

**4. Web UI (`web_ui.py`)**
- Real-time dashboard
- SocketIO event emission
- Data collection worker
- Metrics aggregation

#### Metrics Collected

**Video Metrics:**
- `emotion`: Primary detected emotion
- `emotion_confidence`: Confidence score (0-1)
- `attention_level`: Attention score (0-100)
- `engagement`: Engagement level (low/medium/high)
- `posture`: Posture classification
- `movement_level`: Movement intensity
- `fatigue_level`: Fatigue indicator
- `blink_rate`: Blinks per minute
- `total_blinks`: Total blink count
- `blink_duration`: Average blink duration (ms)
- `blink_interval`: Average time between blinks (ms)
- `ear`: Eye aspect ratio
- `gaze_direction`: Gaze vector

**Audio Metrics:**
- `transcription`: Speech-to-text output
- `sentiment`: Sentiment score (-1 to 1)
- `sentiment_label`: Sentiment classification
- `audio_energy`: Audio energy level
- `audio_pitch`: Fundamental frequency
- `speech_rate`: Words per minute
- `chunk_duration`: Audio chunk duration
- `sample_rate`: Audio sample rate
- `word_count`: Words in chunk

#### SocketIO Events

**Emitted Events:**
- `data_update`: Real-time behavioral metrics (emitted every ~50ms)

**Event Payload:**
```json
{
  "timestamp": "2025-01-27T12:00:00Z",
  "video": {
    "emotion": "happy",
    "emotion_confidence": 0.85,
    "attention_level": 75.0,
    "engagement": "high",
    "blink_rate": 15.2,
    ...
  },
  "audio": {
    "transcription": "Hello, how are you?",
    "sentiment": 0.65,
    "audio_energy": 0.42,
    ...
  },
  "unified": {
    "overall_emotion": "happy",
    "confidence": 0.82,
    ...
  }
}
```

---

### FUSION (Integration Layer)

#### Purpose
Collects behavioral metrics from BEVAL, stores them in a database, and serves processed context to CONVEI.

#### Components

**1. BEVAL Collector (`integration/beval_collector.py`)**
- Connects to BEVAL via SocketIO
- Listens for `data_update` events
- Saves metrics to SQLite database
- Handles session management
- Runs as a background service

**2. Metrics Processor (`integration/metrics_processor.py`)**
- Aggregates metrics over time windows
- Calculates trends and patterns
- Generates emotional intelligence insights
- Correlates behavioral data with conversation context
- Provides recommendations

**3. Database Models (`db/models.py`)**
- SQLite database with WAL mode
- Tables: `video_metrics`, `audio_metrics`, `unified_metrics`, `sessions`
- Retry logic with exponential backoff
- Connection pooling and busy timeout

**4. API Server (`api/server.py`)**
- FastAPI REST API
- CORS enabled for CONVEI
- Endpoints for metrics retrieval
- Context generation for AI
- Behavioral report generation

#### Database Schema

```sql
-- Sessions table
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video metrics table
CREATE TABLE video_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    emotion TEXT,
    emotion_confidence REAL,
    attention_level REAL,
    engagement TEXT,
    posture TEXT,
    movement_level TEXT,
    fatigue_level TEXT,
    blink_rate REAL,
    total_blinks INTEGER,
    blink_duration REAL,
    blink_interval REAL,
    ear REAL,
    gaze_direction TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Audio metrics table
CREATE TABLE audio_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transcription TEXT,
    sentiment REAL,
    sentiment_label TEXT,
    audio_energy REAL,
    audio_pitch REAL,
    speech_rate REAL,
    chunk_duration REAL,
    sample_rate INTEGER,
    word_count INTEGER,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);

-- Unified metrics table
CREATE TABLE unified_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_emotion TEXT,
    confidence REAL,
    attention_score REAL,
    engagement_level TEXT,
    fatigue_indicator TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
);
```

#### API Endpoints

**Base URL**: `http://localhost:8083`

**1. Create Session**
```
POST /api/sessions?session_id={session_id}
Response: { "session_id": "...", "created_at": "..." }
```

**2. Get Current Metrics**
```
GET /api/metrics/current/{session_id}
Response: { "video": {...}, "audio": {...}, "unified": {...} }
```

**3. Get Context for CONVEI**
```
GET /api/metrics/context/{session_id}?window=30
POST /api/metrics/context/{session_id}?window=30
Body: { "conversation_context": {...} }
Response: {
  "current_state": {...},
  "trends": {...},
  "insights": [...],
  "recommendations": [...],
  "emotional_intelligence": {...}
}
```

**4. Generate Behavioral Report**
```
GET /api/report/{session_id}
Response: {
  "session_id": "...",
  "user_name": "...",
  "summary": {...},
  "emotion_distribution": {...},
  "sentiment_analysis": {...},
  "attention_analysis": {...},
  "fatigue_analysis": {...},
  "engagement_analysis": {...},
  "insights": [...],
  "recommendations": [...]
}
```

**5. Get Metrics History**
```
GET /api/metrics/history/{session_id}?limit=100
Response: { "metrics": [...] }
```

---

### CONVEI (Conversational Interface)

#### Purpose
Frontend application providing emotionally intelligent AI conversations with behavioral context integration.

#### Key Components

**1. Agent Registry (`agents/AgentRegistry.tsx`)**
- Central orchestration for AI agents
- Tool call processing
- Behavioral context integration
- Emotional journey analysis
- Empathy response generation

**2. Main Agent (`agents/main-agent/MainAgent.tsx`)**
- ARIA (Advanced Relational Intelligence Assistant)
- System instructions for emotional intelligence
- Tool declarations
- Context-aware responses

**3. Behavioral Context (`contexts/BehavioralContextContext.tsx`)**
- Fetches behavioral metrics from FUSION
- Generates contextual prompts for AI
- Tracks emotional journey
- Records emotional moments

**4. Chat Interface (`components/chat-interface/ChatInterface.tsx`)**
- Main conversation UI
- Message rendering
- Tool call visualization
- Pulsating avatar integration
- Audio reactivity

**5. Pulsating Avatar (`components/ai-avatar/PulsatingAvatar.tsx`)**
- Visual representation of AI activity
- Neural network-style visualization
- Audio-reactive animations
- Emotion-based styling

#### AI Tools

**1. `get_behavioral_context`**
- Retrieves current behavioral metrics
- Parameters: `session_id` (optional, defaults to current), `window_seconds` (default: 5)
- Returns: Current state, trends, insights, recommendations

**2. `analyze_emotional_journey`**
- Analyzes emotional changes over conversation
- Returns: Dominant emotions, emotional arc, variability, insights

**3. `get_empathy_response`**
- Generates empathetic responses based on emotion
- Parameters: `emotion`, `intensity`
- Returns: Tailored empathetic response

**4. `set_user_name`**
- Saves user's name for personalization
- Parameters: `name`
- Used for behavioral reports

**5. `generate_behavioral_report`**
- Generates comprehensive behavioral report
- Parameters: `session_id` (optional)
- Returns: Full behavioral analysis report

#### System Instructions

ARIA is configured with detailed system instructions that include:
- Core identity as an emotionally intelligent companion
- Multimodal perception abilities
- Emotional response protocols
- Conversation style guidelines
- Behavioral tool usage rules
- Memory and context management

#### State Management

**Contexts:**
- `LiveAPIContext`: Gemini API connection
- `BehavioralContextContext`: Behavioral metrics
- `ConversationMemoryContext`: Conversation history
- `LanguageContext`: i18n support
- `ThemeContext`: UI theme
- `MessageContext`: Message state

---

## Data Flow

### Real-Time Behavioral Analysis Flow

```
1. User speaks/expresses → BEVAL captures video/audio
2. BEVAL processes → Video/Audio analyzers extract metrics
3. BEVAL emits → SocketIO "data_update" event
4. FUSION collector → Receives event, saves to database
5. CONVEI requests → HTTP GET /api/metrics/context/current
6. FUSION processes → Aggregates metrics, generates insights
7. FUSION returns → Context with current state, trends, recommendations
8. CONVEI integrates → Adds context to AI prompt
9. ARIA responds → Emotionally aware response
```

### Conversation Flow

```
1. User opens CONVEI → Session created
2. User connects → Gemini Live API connection established
3. User speaks/types → Input sent to Gemini
4. Gemini processes → May call tools (get_behavioral_context, etc.)
5. Tool calls executed → AgentRegistry processes tools
6. Behavioral context fetched → From FUSION API
7. Context added → To AI system prompt
8. AI generates response → Emotionally aware, context-informed
9. Response displayed → With audio playback
10. Metrics updated → Behavioral data continues flowing
```

### Session Management

- **CONVEI**: Creates session ID (`convei_session_{timestamp}`)
- **FUSION Collector**: Uses fixed session ID (`current_session` by default)
- **FUSION API**: Resolves `"current"` to latest session with metrics
- **Session Persistence**: CONVEI stores session ID in localStorage (1 hour TTL)

---

## Configuration

### Environment Variables

#### BEVAL
```bash
# Optional: Custom configuration
BEVAL_CONFIG_PATH=config.json
```

#### FUSION
```bash
# BEVAL SocketIO connection
BEVAL_SOCKETIO_URL=http://localhost:5000

# Database path
FUSION_DB_PATH=fusion.db

# API port
FUSION_API_PORT=8083

# Session ID for collector
FUSION_SESSION_ID=current_session
```

#### CONVEI
```bash
# Gemini API Key (required)
REACT_APP_GEMINI_API_KEY=your_api_key_here

# FUSION API URL
REACT_APP_FUSION_API_URL=http://localhost:8083

# Default model
REACT_APP_DEFAULT_MODEL=models/gemini-live-2.5-flash-preview

# Default voice
REACT_APP_DEFAULT_VOICE=Kore
```

### Configuration Files

#### BEVAL Config (`behavioral_analyzer/config.py`)
```python
Config(
    video=VideoConfig(
        enable_emotion=True,
        enable_blink_detection=True,
        debug_mode=False
    ),
    audio=AudioConfig(
        model="small.en",
        enable_transcription=True,
        enable_emotion_detection=True
    ),
    output=OutputConfig(
        output_dir="results",
        save_json=True
    )
)
```

#### FUSION Config (`config/config.json`)
```json
{
  "beval": {
    "socketio_url": "http://localhost:5000"
  },
  "database": {
    "path": "fusion.db",
    "wal_mode": true,
    "busy_timeout": 30000
  },
  "api": {
    "port": 8083,
    "cors_origins": ["http://localhost:3001"]
  }
}
```

---

## Development Guide

### Prerequisites

- **Python 3.12+** with `uv` package manager
- **Node.js 16+** with npm
- **Google Gemini API Key**
- **Webcam and microphone** (for behavioral analysis)

### Setup Instructions

#### 1. Clone Repository
```bash
git clone <repository-url>
cd MAJECT
```

#### 2. Setup BEVAL
```bash
cd BEVAL/behavioral_analyzer
uv sync
uv run python run_web_ui.py
```

#### 3. Setup FUSION
```bash
cd FUSION
uv sync
uv run python start_fusion_uv.py
```

#### 4. Setup CONVEI
```bash
cd CONVEI
npm install
# Create .env file with REACT_APP_GEMINI_API_KEY
npm start
```

### Development Workflow

1. **Start BEVAL**: Run web UI on port 5000
2. **Start FUSION**: API on port 8083, collector connects to BEVAL
3. **Start CONVEI**: React app on port 3001
4. **Test Integration**: Verify metrics flow from BEVAL → FUSION → CONVEI

### Testing

#### BEVAL Tests
```bash
cd BEVAL/behavioral_analyzer
uv run pytest tests/
```

#### FUSION Tests
```bash
cd FUSION
uv run pytest test_comprehensive.py
uv run pytest test_stress.py
```

#### CONVEI Tests
```bash
cd CONVEI
npm test
```

### Debugging

#### BEVAL
- Check SocketIO events in browser console
- Verify metrics in web UI dashboard
- Check logs in terminal

#### FUSION
- API logs: Check FastAPI console output
- Database: Use SQLite browser to inspect `fusion.db`
- Collector: Check connection status and event reception

#### CONVEI
- Browser DevTools: Network tab for API calls
- React DevTools: Component state inspection
- Console: Tool call logs and errors

---

## Deployment

### Production Build

#### CONVEI
```bash
cd CONVEI
npm run build
# Deploy build/ directory to static hosting
```

#### FUSION
```bash
cd FUSION
uv sync --production
# Use process manager (PM2, systemd, etc.)
uvicorn api.server:app --host 0.0.0.0 --port 8083
```

#### BEVAL
```bash
cd BEVAL/behavioral_analyzer
uv sync --production
# Use process manager
uv run python run_web_ui.py
```

### Docker (Optional)

Example Dockerfile for FUSION:
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install uv && uv sync --production
CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "8083"]
```

### Environment Considerations

- **CORS**: Configure allowed origins in FUSION API
- **HTTPS**: Use HTTPS in production for secure connections
- **API Keys**: Store securely, never commit to repository
- **Database**: Consider PostgreSQL for production (instead of SQLite)
- **Scaling**: Use load balancer for multiple instances

---

## Troubleshooting

### Common Issues

**1. Metrics not updating**
- Check BEVAL is running and emitting events
- Verify FUSION collector is connected
- Check session ID matches between CONVEI and FUSION

**2. CORS errors**
- Ensure FUSION API has correct CORS origins configured
- Check browser console for specific CORS errors

**3. Database locked**
- FUSION uses WAL mode and retry logic
- Check for multiple processes accessing database
- Increase `busy_timeout` if needed

**4. No behavioral context**
- Verify FUSION API is accessible
- Check session ID resolution
- Ensure metrics exist in database

**5. AI not using behavioral context**
- Check tool calls in browser console
- Verify `get_behavioral_context` is being called
- Check system instructions include behavioral awareness

---

## API Reference

### FUSION API

#### Get Current Metrics
```http
GET /api/metrics/current/{session_id}
```

**Response:**
```json
{
  "video": {
    "emotion": "happy",
    "attention_level": 75.0,
    ...
  },
  "audio": {
    "sentiment": 0.65,
    ...
  }
}
```

#### Get Context for CONVEI
```http
POST /api/metrics/context/{session_id}?window=30
Content-Type: application/json

{
  "conversation_context": {
    "last_message": "...",
    "topic": "...",
    "history": [...]
  }
}
```

**Response:**
```json
{
  "current_state": {
    "emotion": "happy",
    "attention": 75.0,
    ...
  },
  "trends": {
    "emotion_trend": "improving",
    ...
  },
  "insights": [...],
  "recommendations": [...],
  "emotional_intelligence": {
    "intensity": "moderate",
    "empathy_level": "high",
    ...
  }
}
```

---

## Performance Considerations

### BEVAL
- Video processing: ~30 FPS target
- Audio processing: Real-time chunk processing
- SocketIO events: Emitted every ~50ms

### FUSION
- Database writes: Async with retry logic
- API responses: <100ms for current metrics
- Context generation: <200ms for 30s window

### CONVEI
- Behavioral context refresh: Every 800ms
- Tool call processing: <500ms
- AI response generation: Depends on Gemini API

---

## Security

### Best Practices

1. **API Keys**: Never expose in client-side code
2. **CORS**: Restrict to known origins
3. **Input Validation**: Validate all API inputs
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **HTTPS**: Use HTTPS in production
6. **Data Privacy**: Handle behavioral data responsibly

---

## License

See LICENSE file for details.

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

---

## Support

For issues and questions:
- Check existing documentation
- Review troubleshooting section
- Open an issue on GitHub

---

**Last Updated**: January 2025
**Version**: 1.0.0






