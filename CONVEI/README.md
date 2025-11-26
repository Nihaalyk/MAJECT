# Multi-Agent Conversational System

A sophisticated AI-powered conversational system built with Google's Gemini 2.5 Live API. Features real-time voice interaction, intelligent agent orchestration, and comprehensive service information.

## 🌟 Key Features

### 🤖 Multi-Agent Architecture
- **Main Agent**: Orchestrates conversation flow and routes queries
- **FAQ Agent**: Handles general inquiries with comprehensive FAQs
- **Rate Calculator Agent**: Calculates rates with memory context
- **Intelligent Routing**: Automatic query classification and agent selection

### 🎙️ Real-Time Voice Interaction
- **Audio Input & Output**: Natural voice conversation with AI
- **Live Transcription**: Real-time display of both user and AI speech
- **Multiple Voice Options**: Customizable voice selection (Aoede, Puck, Charon, Kore, Fenrir)
- **Audio Architecture**: Support for both Native and Half-Cascade audio

### 🌍 Bilingual Support
- **Multi-language**: Seamless switching between languages
- **Localized Content**: All FAQs and responses available in multiple languages
- **Context-Aware**: Maintains conversation context across language switches

### 🎨 Modern UI/UX
- **Dark/Light Mode**: Full theme support with smooth transitions
- **Responsive Design**: Works seamlessly on all devices
- **Real-time Updates**: Live status indicators and connection feedback
- **Enhanced Console**: Comprehensive logging and debugging tools

### 💾 Advanced Features
- **Session Resumption**: Continue conversations after disconnection
- **Conversation Memory**: Context-aware responses using past interactions
- **Rate Caching**: Optimized performance with intelligent caching
- **Error Handling**: Comprehensive error recovery mechanisms

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Google Gemini API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multi-agent-conversational-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   Create a `.env` file in the root directory:
   ```env
   REACT_APP_GEMINI_API_KEY=your_api_key_here
   ```

4. **Start development server**
   ```bash
   npm start
   ```
   
   The app will open at `http://localhost:3000`

5. **Build for production**
   ```bash
   npm run build
   ```

## 🏗️ Architecture

### Technology Stack
- **Framework**: React 18 with TypeScript
- **AI Engine**: Google Gemini 2.5 Live API
- **State Management**: React Context + Zustand
- **Styling**: SCSS with CSS Variables
- **Build Tool**: Create React App
- **Real-time**: WebSocket connections via Gemini SDK

### Project Structure
```
src/
├── agents/                 # Agent implementations
│   ├── AgentRegistry.tsx   # Central agent orchestration
│   ├── main-agent/         # Main orchestrator agent
│   ├── faq-agent/          # FAQ handling agent
│   └── rate-calculator-agent/  # Rate calculation agent
├── components/             # React components
│   ├── chat-interface/     # Main chat UI
│   ├── control-tray/       # Connection controls
│   ├── enhanced-console/   # Debug console
│   ├── settings-dialog/    # Configuration UI
│   └── ...
├── contexts/               # React contexts
│   ├── LiveAPIContext.tsx  # Gemini API connection
│   ├── LanguageContext.tsx # i18n support
│   ├── ThemeContext.tsx    # Theme management
│   └── ...
├── hooks/                  # Custom React hooks
├── lib/                    # Core libraries
│   ├── genai-live-client.ts    # Gemini client
│   ├── audio-streamer.ts       # Audio handling
│   └── generic-services.ts     # Business logic
└── types.ts                # TypeScript definitions
```

## 🔧 Configuration

### Model Selection
Choose from three official Gemini 2.5 models:

1. **gemini-live-2.5-flash-preview** (Recommended)
   - Half-cascade audio architecture
   - Best for production with tool use
   - Optimal reliability

2. **gemini-2.0-flash-live-001** (Stable)
   - Half-cascade audio architecture
   - Proven production reliability

3. **gemini-2.5-flash-native-audio-preview-09-2025** (Preview)
   - Native audio architecture
   - Most natural speech
   - Emotion-aware dialogue

### Audio Configuration
```typescript
{
  responseModalities: [Modality.AUDIO],
  speechConfig: {
    voiceConfig: { 
      prebuiltVoiceConfig: { 
        voiceName: "Aoede" // Choose: Aoede, Puck, Charon, Kore, Fenrir
      } 
    }
  },
  outputAudioTranscription: {},  // Enable output transcription
  inputAudioTranscription: {}     // Enable input transcription
}
```

## 🔒 Security & Privacy

- API keys stored in environment variables
- No sensitive data logged
- Secure WebSocket connections (WSS)
- SSL encryption for online payments
- Session data not persisted beyond browser session

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
The `build` folder can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting
- Any static hosting service

## 🤝 Contributing

Contributions are welcome! Please ensure:
1. Code follows TypeScript best practices
2. All components are properly typed
3. Dark mode compatibility is maintained
4. Documentation is updated
5. Build passes without errors

## 📝 License

Copyright 2024 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting documentation
2. Review relevant documentation
3. Open an issue on GitHub

## 📊 Project Stats

- **Total Components**: 15+
- **Supported Languages**: Multiple
- **Build Size**: Optimized for production
- **Dependencies**: Up-to-date and secure

## 🎉 Recent Updates

### Latest
- ✅ Upgraded to Gemini 2.5 Live API
- ✅ Added audio transcription (input/output)
- ✅ Implemented session resumption
- ✅ Enhanced error handling
- ✅ Improved dark mode compatibility
- ✅ Comprehensive stability improvements

## 🔮 Future Enhancements

- [ ] Real-time package tracking integration
- [ ] Payment gateway integration
- [ ] Multi-user support
- [ ] Analytics dashboard
- [ ] Mobile app version
- [ ] Voice commands for common tasks
- [ ] Automated testing suite
- [ ] Performance monitoring

---

**Built with ❤️ using Google Gemini 2.5 Live API**
