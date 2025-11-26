# Behavioral Analysis Metrics Documentation

This document lists all metrics extracted from video and audio analysis.

## 📹 Video Analysis Metrics

### 1. **Emotion Detection**
- **Primary Metric**: `current_emotion`
  - Values: `angry`, `disgust`, `fear`, `happy`, `sad`, `surprise`, `neutral`, `Unknown`
- **Emotion Scores**: `emotion_scores`
  - Individual confidence scores for each emotion (0.0 to 1.0)
  - Tracks: `angry`, `disgust`, `fear`, `happy`, `sad`, `surprise`, `neutral`
- **Detection Method**: DeepFace emotion recognition on facial regions

### 2. **Attention Analysis**
- **Primary Metric**: `attention_state`
  - Values: `Focused`, `Partially Focused`, `Distracted`, `Unknown`
- **Calculation**: Based on face orientation (horizontal and vertical angles)
  - Face orientation angles calculated from facial landmarks
  - Gaze direction estimation
- **History**: Tracks last 60 attention states

### 3. **Blink Detection**
- **Blink Rate**: `blink_rate` (blinks per minute)
- **Total Blinks**: `total_blink_count`
- **EAR (Eye Aspect Ratio)**: 
  - `ear`: Current eye aspect ratio
  - `ear_threshold`: Dynamic threshold for blink detection
  - `left_ear_values`: Left eye EAR history
  - `right_ear_values`: Right eye EAR history
- **Blink Duration**: `blink_duration` (average duration of blinks)
- **Blink Intervals**: `blink_interval` (average time between blinks)
- **Eye Asymmetry**: `eye_asymmetry` (difference between left and right eye)
- **Eye State**: Tracks open/closed states with frame counters

### 4. **Posture Analysis**
- **Primary Metric**: `posture_state`
  - Values: `Excellent`, `Good`, `Fair`, `Poor`, `Unknown`
- **Calculation**: Based on pose landmarks
  - Shoulder alignment
  - Spine curvature
  - Head position relative to body
- **History**: Tracks last 30 posture states

### 5. **Movement Analysis**
- **Primary Metric**: `movement_level`
  - Values: `Low`, `Moderate`, `High`, `Unknown`
- **Movement Magnitude**: Tracks body movement intensity
- **Calculation**: Based on pose landmark velocity and displacement
- **History**: Tracks last 30 movement states and 60 magnitude values

### 6. **Fatigue Detection**
- **Primary Metric**: `fatigue_level`
  - Values: `Normal`, `Mild`, `Moderate`, `Severe`
- **Drowsiness Score**: `drowsiness_score`
  - Calculated from extended eye closure
  - Abnormal blink rate detection
  - Frame-based drowsiness tracking
- **Drowsiness Frames**: Count of frames with drowsiness indicators
- **Drowsiness Alerts**: Total number of drowsiness alerts

### 7. **Object Detection**
- **Detections**: `current_detections`
  - List of detected objects with:
    - Class name
    - Confidence score
    - Bounding box coordinates
- **Main Person Tracking**: `main_person`
  - ID, confidence, size ratio, bounding box
- **Person Count**: Total number of detected people

### 8. **Performance Metrics**
- **FPS**: `fps` (frames per second)
- **Processing Time**: Time taken to process each frame
- **Frame Count**: Total frames processed

---

## 🎤 Audio Analysis Metrics

### 1. **Speech Transcription**
- **Primary Metric**: `transcription`
  - Real-time speech-to-text using Whisper AI
  - Word-level timestamps
  - Confidence scores per segment
- **Word Count**: `total_words` (total words spoken in session)
- **Transcription Confidence**: `confidence`
  - Values: `low`, `medium`, `high`
  - Based on audio features and model confidence

### 2. **Audio Emotion Detection**
- **Primary Metric**: `emotion`
  - Values: `excited`, `happy`, `sad`, `angry`, `calm`, `neutral`
- **Detection Method**: Based on audio feature analysis
  - Energy levels
  - Pitch variations
  - Speech rate
  - Silence patterns

### 3. **Audio Features**
- **Energy**: `energy`
  - Audio loudness/intensity (0.0 to 1.0+)
  - Z-score normalized against history
- **Pitch**: `pitch`
  - Fundamental frequency in Hz
  - Z-score normalized against history
- **Speech Rate**: `speech_rate`
  - Zero-crossing rate as proxy for speech speed
  - Z-score normalized against history
- **Silence Ratio**: `silence_ratio`
  - Proportion of silence in audio chunk (0.0 to 1.0)
- **Z-Scores**: 
  - `energy_z_score`: Statistical deviation of energy
  - `pitch_z_score`: Statistical deviation of pitch
  - `rate_z_score`: Statistical deviation of speech rate

### 4. **Sentiment Analysis**
- **Primary Metric**: `sentiment`
  - Range: -1.0 (negative) to +1.0 (positive)
  - Calculated using TextBlob on transcribed text
- **Subjectivity**: Text subjectivity score (0.0 to 1.0)
- **Sentiment History**: Tracks sentiment scores over time

### 5. **Audio Quality Metrics**
- **Chunk Duration**: Length of audio chunk processed
- **Sample Rate**: Audio sample rate (typically 16000 Hz)
- **Speech Clarity**: Confidence in speech detection
- **No Speech Probability**: Likelihood that chunk contains no speech

### 6. **Session Statistics**
- **Total Chunks**: Number of audio chunks processed
- **Emotion Counts**: Distribution of detected emotions
- **Silence Ratio History**: Historical silence patterns
- **Sentiment Scores**: Historical sentiment values

---

## 🔄 Combined/Unified Metrics

### 1. **Unified Emotion**
- Combines video and audio emotion detection
- Priority: Video emotion (more reliable for facial expressions)
- Falls back to audio emotion if video unavailable

### 2. **Unified Fatigue**
- Combines video fatigue indicators with audio energy/silence
- Video fatigue is primary
- Audio provides additional context (low energy + high silence = increased fatigue)

### 3. **Session Statistics**
- **Session Duration**: Total analysis time
- **Total Frames Processed**: Video frames analyzed
- **Total Audio Chunks**: Audio chunks processed
- **Emotion Changes**: Count of emotion transitions
- **Average Attention Score**: Mean attention level (0-100%)
- **Fatigue Score**: Current fatigue level (0-100%)

---

## 📊 Data Collection Structure

### Video Data Point Structure:
```python
{
    'timestamp': float,
    'emotion': str,
    'emotion_scores': dict,
    'attention_state': str,
    'posture_state': str,
    'movement_level': str,
    'blink_rate': float,
    'total_blinks': int,
    'ear': float,
    'ear_threshold': float,
    'eye_asymmetry': float,
    'blink_duration': float,
    'blink_interval': float,
    'fatigue_level': str,
    'drowsiness_score': float,
    'fps': float,
    'object_detections': list,
    'person_tracking': dict
}
```

### Audio Data Point Structure:
```python
{
    'timestamp': float,
    'transcription': str,
    'emotion': str,
    'sentiment': float,
    'confidence': str,
    'audio_features': {
        'energy': float,
        'pitch': float,
        'speech_rate': float,
        'silence_ratio': float,
        'energy_z_score': float,
        'pitch_z_score': float,
        'rate_z_score': float
    },
    'chunk_duration': float,
    'sample_rate': int
}
```

### Combined Data Point Structure:
```python
{
    'timestamp': float,
    'unified_state': {
        'emotion': str,
        'attention': str,
        'posture': str,
        'movement': str,
        'fatigue': str,
        'transcription': str,
        'sentiment': float,
        'confidence': str
    },
    'video_metrics': dict,
    'audio_metrics': dict,
    'performance': dict
}
```

---

## 🎯 Key Behavioral Indicators

### Engagement Metrics:
- **Attention State**: Focused vs. Distracted
- **Eye Contact**: Gaze direction and focus
- **Posture Quality**: Body alignment and positioning

### Emotional State Metrics:
- **Facial Emotion**: Real-time emotion from facial expressions
- **Audio Emotion**: Emotion from voice characteristics
- **Sentiment**: Text-based sentiment from speech

### Fatigue/Alertness Metrics:
- **Blink Rate**: Normal vs. abnormal patterns
- **Eye Closure**: Extended closure detection
- **Drowsiness Indicators**: Multiple fatigue signals
- **Audio Energy**: Voice energy levels

### Communication Metrics:
- **Speech Transcription**: What is being said
- **Speech Rate**: How fast someone is speaking
- **Silence Patterns**: Pauses and breaks in speech
- **Word Count**: Total words spoken

---

## 📈 Real-time Updates

All metrics are updated in real-time:
- **Video metrics**: Updated every frame (~30 FPS)
- **Audio metrics**: Updated per audio chunk (~10 Hz)
- **Unified state**: Updated every 100ms (throttled for efficiency)
- **Data collection**: Collected every 10 state updates (optimized)

---

## 🔧 Configuration Options

Metrics can be enabled/disabled via configuration:
- `enable_emotion`: Video emotion detection
- `enable_blink_detection`: Blink analysis
- `enable_attention_analysis`: Attention tracking
- `enable_posture_analysis`: Posture assessment
- `enable_movement_analysis`: Movement tracking
- `enable_fatigue_detection`: Fatigue monitoring
- `enable_object_detection`: Object/person detection
- `enable_transcription`: Speech-to-text
- `enable_emotion_detection`: Audio emotion
- `enable_sentiment_analysis`: Text sentiment

