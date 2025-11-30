# MAJECT - Multi-Agent Behavioral Intelligence System

<div align="center">

![MAJECT Logo](https://img.shields.io/badge/MAJECT-1.0.0-blue)
![Python](https://img.shields.io/badge/Python-3.12+-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)

**An emotionally intelligent AI conversational system with real-time behavioral analysis**

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## Overview

**MAJECT** is a cutting-edge AI conversational platform that combines real-time behavioral analysis with emotionally intelligent AI interactions. The system analyzes facial expressions, voice patterns, and body language to provide context-aware, empathetic responses through **ARIA** (Advanced Relational Intelligence Assistant).

### What Makes MAJECT Special?

- **Real-Time Behavioral Analysis**: Analyzes facial expressions, voice, posture, and movement in real-time
- **Emotionally Intelligent AI**: ARIA understands and responds to emotions with genuine empathy
- **Natural Voice Interaction**: Seamless voice conversations with live transcription
- **Comprehensive Insights**: Detailed behavioral reports and emotional journey tracking
- **Multi-Modal Integration**: Combines video, audio, and conversational context

---

## Features

### Behavioral Analysis (BEVAL)
- **Facial Expression Detection**: 7 core emotions (happy, sad, angry, fear, surprise, disgust, neutral)
- **Eye Tracking**: Blink rate, gaze direction, attention level
- **Voice Analysis**: Sentiment, prosody, speech rate, emotion from voice
- **Posture & Movement**: Body language analysis and fatigue detection
- **Real-Time Processing**: Sub-second latency for live analysis

### Emotionally Intelligent AI (ARIA)
- **Multimodal Perception**: Sees facial expressions, hears voice tone, understands behavior
- **Emotional Response Protocols**: Tailored responses based on detected emotions
- **Context-Aware Conversations**: Adapts communication style to user's emotional state
- **Empathy Engine**: Generates empathetic responses with appropriate emotional intelligence
- **Behavioral Reports**: Comprehensive end-of-conversation analysis

### Modern User Interface
- **Monochrome Design**: Sleek black and white aesthetic
- **Pulsating Avatar**: Audio-reactive neural network visualization
- **Real-Time Updates**: Live behavioral metrics and status indicators
- **Responsive Design**: Works seamlessly on all devices
- **Dark Theme**: Optimized for extended use

### Technical Features
- **Multi-Agent Architecture**: Modular, extensible agent system
- **Session Management**: Persistent conversations with resumption
- **Bilingual Support**: English and Kannada language support
- **Tool-Based AI**: Extensible tool system for behavioral analysis
- **Real-Time Integration**: SocketIO for live data streaming

---

## Quick Start

### Prerequisites

- **Python 3.12+** with `uv` package manager
- **Node.js 16+** with npm
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))
- **Webcam and microphone** (for behavioral analysis)

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd MAJECT
```

#### 2. Setup BEVAL (Behavioral Analyzer)
```bash
cd BEVAL/behavioral_analyzer
uv sync
uv run python run_web_ui.py
```
BEVAL will start on `http://localhost:5000`

#### 3. Setup FUSION (Integration Layer)
```bash
cd FUSION
uv sync
uv run python start_fusion_uv.py
```
FUSION API will start on `http://localhost:8083`

#### 4. Setup CONVEI (Frontend)
```bash
cd CONVEI
npm install

# Create .env file
echo "REACT_APP_GEMINI_API_KEY=your_api_key_here" > .env
echo "REACT_APP_FUSION_API_URL=http://localhost:8083" >> .env

npm start
```
CONVEI will start on `http://localhost:3001`

### First Run

1. **Start BEVAL**: Open `http://localhost:5000` and allow camera/microphone access
2. **Start FUSION**: The collector will automatically connect to BEVAL
3. **Start CONVEI**: Open `http://localhost:3001` and click "Connect"
4. **Begin Conversation**: ARIA will greet you and ask for your name
5. **Experience**: Have a natural conversation - ARIA will understand your emotions!

---

## Architecture

MAJECT consists of three main components:

```
┌─────────────┐
│   BEVAL     │  Real-time behavioral analysis
│  (Python)   │  Video + Audio processing
└──────┬──────┘
       │ SocketIO
       ▼
┌─────────────┐
│   FUSION    │  Integration layer
│  (Python)   │  Metrics collection & API
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐
│   CONVEI    │  Frontend application
│  (React)    │  ARIA conversational AI
└─────────────┘
```

### Component Details

#### BEVAL (Behavioral Analyzer)
- Analyzes video streams for facial expressions, eye tracking, posture
- Processes audio for sentiment, emotion, prosody
- Emits real-time metrics via SocketIO
- Web UI dashboard for visualization

#### FUSION (Integration Layer)
- Collects metrics from BEVAL via SocketIO
- Stores data in SQLite database
- Provides REST API for CONVEI
- Processes metrics for AI context generation

#### CONVEI (Conversational Interface)
- React-based frontend application
- Integrates with Google Gemini 2.5 Live API
- ARIA: Emotionally intelligent AI assistant
- Real-time behavioral context integration

---

## Documentation

### Comprehensive Guides

- **[Technical Documentation](./TECHNICAL_DOCUMENTATION.md)**: Detailed technical reference
- **[BEVAL README](./BEVAL/behavioral_analyzer/README.md)**: Behavioral analyzer documentation
- **[FUSION README](./FUSION/README.md)**: Integration layer documentation
- **[CONVEI README](./CONVEI/README.md)**: Frontend application documentation

### Key Concepts

#### Behavioral Metrics
- **Emotion**: Primary detected emotion (7 core emotions)
- **Attention**: Attention level score (0-100)
- **Engagement**: Engagement level (low/medium/high)
- **Sentiment**: Audio sentiment score (-1 to 1)
- **Fatigue**: Fatigue indicator from eye tracking
- **Blink Rate**: Blinks per minute (stress/fatigue indicator)

#### AI Tools
- `get_behavioral_context`: Get current behavioral metrics
- `analyze_emotional_journey`: Track emotional changes over time
- `get_empathy_response`: Generate empathetic responses
- `set_user_name`: Save user name for personalization
- `generate_behavioral_report`: Create comprehensive behavioral report

#### Session Management
- CONVEI creates session IDs (`convei_session_{timestamp}`)
- FUSION collector uses fixed session (`current_session`)
- FUSION API resolves `"current"` to latest session
- Sessions persist in localStorage (1 hour TTL)

---

## Use Cases

### 1. Emotional Support Conversations
ARIA can detect when users are sad, anxious, or stressed and provide empathetic support.

### 2. Behavioral Analysis
Track attention, engagement, and fatigue during conversations for insights.

### 3. Personalized Interactions
AI adapts communication style based on detected emotional state and preferences.

### 4. Research & Analytics
Comprehensive behavioral reports for research, therapy, or self-reflection.

### 5. Accessibility
Voice-first interface with emotional understanding for inclusive interactions.

---

## Configuration

### Environment Variables

#### CONVEI (.env)
```env
REACT_APP_GEMINI_API_KEY=your_api_key_here
REACT_APP_FUSION_API_URL=http://localhost:8083
REACT_APP_DEFAULT_VOICE=Kore
```

#### FUSION
```bash
export BEVAL_SOCKETIO_URL=http://localhost:5000
export FUSION_DB_PATH=fusion.db
export FUSION_API_PORT=8083
```

### Voice Options
- **Kore** (default): Modern, clear voice
- **Puck**: Energetic, friendly
- **Charon**: Deep, authoritative
- **Fenrir**: Warm, conversational
- **Aoede**: Soft, gentle

---

## Testing

### Run Tests

```bash
# BEVAL tests
cd BEVAL/behavioral_analyzer
uv run pytest tests/

# FUSION tests
cd FUSION
uv run pytest test_comprehensive.py
uv run pytest test_stress.py

# CONVEI tests
cd CONVEI
npm test
```

### Integration Testing

1. Start all three components
2. Verify metrics flow: BEVAL → FUSION → CONVEI
3. Test AI tool calls in conversation
4. Verify behavioral report generation

---

## Troubleshooting

### Common Issues

**Metrics not updating?**
- Check BEVAL is running and emitting events
- Verify FUSION collector is connected
- Ensure session IDs match

**CORS errors?**
- Verify FUSION API CORS configuration
- Check browser console for specific errors

**No behavioral context?**
- Ensure FUSION API is accessible
- Check session ID resolution
- Verify metrics exist in database

**AI not responding?**
- Check Gemini API key is valid
- Verify API connection status
- Review browser console for errors

For more troubleshooting, see [Technical Documentation](./TECHNICAL_DOCUMENTATION.md#troubleshooting).

---

## Deployment

### Production Build

```bash
# CONVEI
cd CONVEI
npm run build
# Deploy build/ directory

# FUSION
cd FUSION
uv sync --production
uvicorn api.server:app --host 0.0.0.0 --port 8083

# BEVAL
cd BEVAL/behavioral_analyzer
uv sync --production
uv run python run_web_ui.py
```

### Production Considerations

- Use HTTPS for all connections
- Secure API keys (never commit to repository)
- Configure CORS for production domains
- Consider PostgreSQL for production database
- Use process manager (PM2, systemd) for services
- Implement rate limiting for API endpoints

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** with tests
4. **Commit your changes** (`git commit -m 'Add amazing feature'`)
5. **Push to the branch** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Follow semantic versioning

---

## Project Structure

```
MAJECT/
├── BEVAL/                    # Behavioral Analyzer
│   ├── behavioral_analyzer/  # Core analysis modules
│   ├── client/               # Web client
│   └── server/               # API server
├── FUSION/                   # Integration Layer
│   ├── api/                  # FastAPI server
│   ├── db/                   # Database models
│   ├── integration/          # BEVAL collector
│   └── config/               # Configuration
├── CONVEI/                   # Frontend Application
│   ├── src/
│   │   ├── agents/           # AI agents
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   └── hooks/            # Custom hooks
│   └── public/               # Static assets
├── TECHNICAL_DOCUMENTATION.md # Technical docs
└── README.md                 # This file
```

---

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## Acknowledgments

- **Google Gemini API** for powerful AI capabilities
- **DeepFace** for facial expression analysis
- **MediaPipe** for real-time computer vision
- **Whisper** for speech transcription
- **React** and **FastAPI** communities

---

## Support

- **Documentation**: See [Technical Documentation](./TECHNICAL_DOCUMENTATION.md)
- **Issues**: Open an issue on GitHub
- **Questions**: Check existing documentation first

---

## Roadmap

### Upcoming Features
- [ ] Additional language support
- [ ] Advanced emotion detection models
- [ ] Real-time collaboration features
- [ ] Mobile app support
- [ ] Enhanced behavioral insights
- [ ] Customizable AI personalities

### Known Limitations
- Requires webcam and microphone
- Best performance with good lighting
- Some features require modern browsers
- Behavioral analysis accuracy depends on video quality

---

<div align="center">

**Made with love by the MAJECT Team**

[Star us on GitHub](https://github.com/your-repo) • [Read the Docs](./TECHNICAL_DOCUMENTATION.md) • [Report Issues](https://github.com/your-repo/issues)

</div>



