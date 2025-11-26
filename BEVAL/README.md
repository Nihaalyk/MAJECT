# POS Malaysia Multi-Agent Conversational System

A sophisticated AI-powered conversational system built with Google's Gemini 2.5 Live API for POS Malaysia services. Features real-time voice interaction, intelligent agent orchestration, and comprehensive service information.

## 🌟 Key Features

### 🤖 Multi-Agent Architecture
- **Main Agent**: Orchestrates conversation flow and routes queries
- **FAQ Agent**: Handles general inquiries with 53+ comprehensive FAQs
- **Rate Calculator Agent**: Calculates postage rates with memory context
- **Intelligent Routing**: Automatic query classification and agent selection

### 🎙️ Real-Time Voice Interaction
- **Audio Input & Output**: Natural voice conversation with AI
- **Live Transcription**: Real-time display of both user and AI speech
- **Multiple Voice Options**: Customizable voice selection (Aoede, Puck, Charon, Kore, Fenrir, Aoede)
- **Audio Architecture**: Support for both Native and Half-Cascade audio

### 🌍 Bilingual Support
- **English & Malay**: Seamless switching between languages
- **Localized Content**: All FAQs and responses available in both languages
- **Context-Aware**: Maintains conversation context across language switches

### 📦 Service Types
- **Economy**: Most affordable (RM 1.80), 5-7 days delivery
- **Pos Laju**: Standard service (RM 6.50), 1-2 days delivery
- **Express**: Fastest service (RM 12.00), same-day delivery
- **Islamic**: Halal certified (RM 6.50), 1-2 days delivery
- **Pos Ekspres**: Fast service (RM 8.50), 1-day delivery
- **Pos Biasa**: Regular service (RM 2.50), 3-5 days delivery

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
   cd CES_Demo
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

## 📖 Documentation

Comprehensive documentation available in the `/docs` folder:

### Getting Started
- [Quick Start Guide](docs/GEMINI_2.5_QUICK_START.md)
- [POS Malaysia README](docs/POS_MALAYSIA_README.md)
- [Deployment Workflow](docs/DEPLOYMENT_WORKFLOW.md)

### Feature Guides
- [Audio Transcription Feature](docs/AUDIO_TRANSCRIPTION_FEATURE.md)
- [Complete Transcription Guide](docs/COMPLETE_TRANSCRIPTION_GUIDE.md)
- [Transcript Quick Reference](docs/TRANSCRIPT_QUICK_REFERENCE.md)

### Technical Documentation
- [Gemini 2.5 Upgrade Notes](docs/GEMINI_2.5_UPGRADE_NOTES.md)
- [Gemini 2.5 Upgrade Summary](docs/GEMINI_2.5_UPGRADE_SUMMARY.md)
- [System Stability Improvements](docs/SYSTEM_STABILITY_IMPROVEMENTS.md)
- [System Improvements Summary](docs/SYSTEM_IMPROVEMENTS_SUMMARY.md)

### Optimization
- [Optimization Report](docs/OPTIMIZATION_REPORT.md)
- [Optimization Summary](docs/OPTIMIZATION_SUMMARY.md)
- [Quick Improvements Summary](docs/QUICK_IMPROVEMENTS_SUMMARY.md)

### UI/UX
- [UI Redesign Summary](docs/UI_REDESIGN_SUMMARY.md)
- [Layout Improvements Summary](docs/LAYOUT_IMPROVEMENTS_SUMMARY.md)
- [Transcript Visual Guide](docs/TRANSCRIPT_VISUAL_GUIDE.md)

### Troubleshooting
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

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
│   └── pos-malaysia-services.ts # Business logic
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

## 📊 Features Breakdown

### 1. FAQ Database (53 Items)
- General Services (5 items)
- Tracking & Delivery (6 items)
- Weight & Size Limits (2 items)
- International Services (5 items)
- Payment & Pricing (2 items)
- Special Services (3 items)
- Business Services (2 items)
- Insurance & Claims (2 items)
- Technology & Digital (2 items)
- Stamps & Postal Services (3 items)
- PO Box Services (2 items)
- Special Handling (2 items)
- Mobile & Online Services (2 items)
- Environmental & Sustainability (1 item)
- Customer Service (2 items)
- Economy, Express, Islamic Services (6 items)

### 2. Rate Calculator
- Automatic rate calculation
- Zone-based pricing (same state, peninsula, Sabah/Sarawak)
- Weight-based surcharges
- International shipping support
- Service type comparison
- Delivery time estimates
- Cost breakdowns

### 3. Conversation Memory
- Session-based memory
- User preference tracking
- Context persistence
- Interaction history
- Pending information tracking

## 🎯 Use Cases

### For Customers
- Ask about POS Malaysia services
- Calculate shipping rates instantly
- Track package status
- Learn about different service types
- Get answers in English or Malay
- Voice or text interaction

### For Businesses
- Integrate rate calculations
- Corporate account information
- Bulk shipping inquiries
- API integration details
- Special service requirements

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

See [Deployment Workflow](docs/DEPLOYMENT_WORKFLOW.md) for detailed instructions.

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
1. Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. Review relevant documentation in `/docs`
3. Contact POS Malaysia customer service: 1-300-300-300
4. Email: customer@pos.com.my

## 📊 Project Stats

- **Total Components**: 15+
- **FAQ Database**: 53 items (bilingual)
- **Service Types**: 6 main types
- **Supported Languages**: 2 (English, Malay)
- **Countries Supported**: 200+ (international shipping)
- **Build Size**: ~437 KB (gzipped)
- **Dependencies**: Up-to-date and secure

## 🎉 Recent Updates

### Latest (October 2025)
- ✅ Upgraded to Gemini 2.5 Live API
- ✅ Added audio transcription (input/output)
- ✅ Implemented session resumption
- ✅ Enhanced error handling
- ✅ Expanded FAQ database (30 → 53 items)
- ✅ Added Economy, Express, Islamic services
- ✅ Improved dark mode compatibility
- ✅ Console closed by default
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

For the latest updates and more information, visit the [documentation](docs/).
