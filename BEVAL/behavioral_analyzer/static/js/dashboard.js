/**
 * Behavioral Analyzer Dashboard JavaScript
 * 
 * Handles real-time updates, WebSocket communication, and UI interactions
 */

class BehavioralDashboard {
    constructor() {
        this.socket = null;
        this.charts = {};
        this.dataHistory = {
            blinkRate: [],
            emotionScores: {},
            objectCounts: {},
            timestamps: []
        };
        this.sessionStartTime = Date.now();
        this.lastUpdateTime = Date.now();
        
        this.init();
    }
    
    init() {
        this.initSocket();
        this.initCharts();
        this.initControls();
        this.startSessionTimer();
        this.requestInitialData();
    }
    
    initSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateConnectionStatus(true);
            this.showNotification('Connected to server', 'success');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus(false);
            this.showNotification('Disconnected from server', 'warning');
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.updateConnectionStatus(false);
            this.showNotification('Connection error. Retrying...', 'danger');
        });
        
        this.socket.on('data_update', (data) => {
            this.updateDashboard(data);
        });
        
        this.socket.on('video_frame', (data) => {
            this.updateVideoFeed(data.frame);
        });
        
        this.socket.on('status', (data) => {
            console.log('Status:', data.message);
            if (data.message && data.message.includes('error')) {
                this.showNotification(data.message, 'danger');
            } else if (data.message) {
                this.showNotification(data.message, 'info');
            }
        });
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 150);
        }, 3000);
    }
    
    initCharts() {
        // Emotion Chart
        const emotionCtx = document.getElementById('emotionChart').getContext('2d');
        this.charts.emotion = new Chart(emotionCtx, {
            type: 'doughnut',
            data: {
                labels: ['Happy', 'Sad', 'Angry', 'Fear', 'Surprise', 'Neutral'],
                datasets: [{
                    data: [0, 0, 0, 0, 0, 100],
                    backgroundColor: [
                        '#28a745', '#6f42c1', '#dc3545', 
                        '#fd7e14', '#ffc107', '#6c757d'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Blink Rate Chart
        const blinkCtx = document.getElementById('blinkChart').getContext('2d');
        this.charts.blink = new Chart(blinkCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Blink Rate (bpm)',
                    data: [],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 30
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // Object Detection Chart
        const objectCtx = document.getElementById('objectChart').getContext('2d');
        this.charts.objects = new Chart(objectCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Object Count',
                    data: [],
                    backgroundColor: '#ffc107',
                    borderColor: '#ffc107',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
    
    initControls() {
        // Debug Mode Toggle
        const debugToggle = document.getElementById('debug-mode');
        if (debugToggle) {
            debugToggle.addEventListener('change', (e) => {
                this.socket.emit('update_controls', { debug_mode: e.target.checked });
                this.showNotification(`Debug mode ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
            });
        }
        
        // Show Landmarks Toggle
        const landmarksToggle = document.getElementById('show-landmarks');
        if (landmarksToggle) {
            landmarksToggle.addEventListener('change', (e) => {
                this.socket.emit('update_controls', { show_landmarks: e.target.checked });
                this.showNotification(`Landmarks ${e.target.checked ? 'shown' : 'hidden'}`, 'info');
            });
        }
        
        // Show Objects Toggle
        const objectsToggle = document.getElementById('show-objects');
        if (objectsToggle) {
            objectsToggle.addEventListener('change', (e) => {
                this.socket.emit('update_controls', { show_objects: e.target.checked });
                this.showNotification(`Object detection ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
            });
        }
        
        // Video Stream Toggle (auto-enabled, but allow manual control)
        const videoToggle = document.getElementById('video-stream');
        if (videoToggle) {
            videoToggle.checked = true; // Auto-enable
            videoToggle.addEventListener('change', (e) => {
                this.socket.emit('toggle_video_stream', { enabled: e.target.checked });
                this.showNotification(`Video stream ${e.target.checked ? 'enabled' : 'disabled'}`, e.target.checked ? 'success' : 'warning');
            });
        }
    }
    
    startSessionTimer() {
        setInterval(() => {
            const elapsed = Date.now() - this.sessionStartTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            document.getElementById('session-time').textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    requestInitialData() {
        this.socket.emit('request_data');
    }
    
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (connected) {
            statusElement.className = 'badge bg-success me-2';
            statusElement.innerHTML = '<i class="fas fa-circle"></i> Connected';
        } else {
            statusElement.className = 'badge bg-danger me-2';
            statusElement.innerHTML = '<i class="fas fa-circle"></i> Disconnected';
        }
    }
    
    updateDashboard(data) {
        this.lastUpdateTime = Date.now();
        
        // Update video analysis data
        if (data.video) {
            this.updateVideoAnalysis(data.video);
            this.updatePersonTracking(data.video);
        }
        
        // Update audio analysis data
        if (data.audio) {
            this.updateAudioAnalysis(data.audio);
        }
        
        // Update object detection data
        if (data.objects) {
            this.updateObjectDetection(data.objects);
        }
        
        // Update session statistics
        if (data.session_stats) {
            this.updateSessionStats(data.session_stats);
        }
        
        // Update charts
        this.updateCharts(data);
    }
    
    updateVideoAnalysis(videoData) {
        // Update emotion with animation
        const emotionElement = document.getElementById('current-emotion');
        const currentEmotion = videoData.emotion || 'Unknown';
        if (emotionElement.textContent !== currentEmotion) {
            emotionElement.style.animation = 'none';
            setTimeout(() => {
                emotionElement.style.animation = 'emotionPulse 0.5s ease-in-out';
            }, 10);
        }
        emotionElement.textContent = currentEmotion;
        emotionElement.className = `text-primary emotion-${currentEmotion.toLowerCase()}`;
        
        // Update attention with smooth transition
        const attentionElement = document.getElementById('attention-state');
        const currentAttention = videoData.attention_state || 'Unknown';
        attentionElement.textContent = currentAttention;
        attentionElement.className = `text-warning attention-${currentAttention.toLowerCase().replace(' ', '-')}`;
        attentionElement.style.transition = 'all 0.3s ease';
        
        // Update posture with smooth transition
        const postureElement = document.getElementById('posture-state');
        const currentPosture = videoData.posture_state || 'Unknown';
        postureElement.textContent = currentPosture;
        postureElement.className = `text-info posture-${currentPosture.toLowerCase()}`;
        postureElement.style.transition = 'all 0.3s ease';
        
        // Update blink analysis
        document.getElementById('blink-rate').textContent = Math.round(videoData.blink_rate || 0);
        document.getElementById('total-blinks').textContent = videoData.total_blinks || 0;
        
        // Update fatigue level
        const fatigueLevel = videoData.fatigue_level || 'Normal';
        document.getElementById('fatigue-level').textContent = fatigueLevel;
        
        const fatigueBar = document.getElementById('fatigue-bar');
        const fatiguePercentage = this.getFatiguePercentage(fatigueLevel);
        fatigueBar.style.width = `${fatiguePercentage}%`;
        fatigueBar.className = `progress-bar ${this.getFatigueColor(fatigueLevel)}`;
        
        // Update FPS
        document.getElementById('video-fps').textContent = Math.round(videoData.fps || 0);
        
        // Store data for charts
        this.dataHistory.blinkRate.push(videoData.blink_rate || 0);
        this.dataHistory.timestamps.push(new Date().toLocaleTimeString());
        
        // Keep only last 20 data points
        if (this.dataHistory.blinkRate.length > 20) {
            this.dataHistory.blinkRate.shift();
            this.dataHistory.timestamps.shift();
        }
    }
    
    updateAudioAnalysis(audioData) {
        // Update transcription
        const transcriptionElement = document.getElementById('transcription');
        if (audioData.transcription && audioData.transcription.trim()) {
            transcriptionElement.innerHTML = `<strong>${audioData.transcription}</strong>`;
        } else {
            transcriptionElement.innerHTML = '<em class="text-muted">No speech detected</em>';
        }
        
        // Update audio emotion
        document.getElementById('audio-emotion').textContent = audioData.emotion || 'neutral';
        
        // Update sentiment
        const sentimentScore = audioData.sentiment || 0;
        document.getElementById('sentiment-score').textContent = sentimentScore.toFixed(2);
        document.getElementById('sentiment-score').className = 
            `text-${sentimentScore > 0 ? 'success' : sentimentScore < 0 ? 'danger' : 'secondary'}`;
        
        // Update word count
        if (audioData.session_stats && audioData.session_stats.total_words) {
            document.getElementById('total-words').textContent = audioData.session_stats.total_words;
        }
    }
    
    updateObjectDetection(objectData) {
        const objectCount = objectData.detections ? objectData.detections.length : 0;
        document.getElementById('object-count').textContent = objectCount;
        
        // Update object list
        const objectListElement = document.getElementById('object-list');
        if (objectData.detections && objectData.detections.length > 0) {
            const objectCounts = {};
            objectData.detections.forEach(detection => {
                const className = detection.class_name;
                objectCounts[className] = (objectCounts[className] || 0) + 1;
            });
            
            objectListElement.innerHTML = Object.entries(objectCounts)
                .map(([name, count]) => `
                    <div class="object-item">
                        <span class="object-name">${name}</span>
                        <span class="object-confidence">${count}</span>
                    </div>
                `).join('');
        } else {
            objectListElement.innerHTML = '<em class="text-muted">No objects detected</em>';
        }
        
        // Update object counts for chart
        if (objectData.object_counts) {
            this.dataHistory.objectCounts = objectData.object_counts;
        }
    }
    
    updatePersonTracking(videoData) {
        const personTracking = videoData.person_tracking || {};
        const mainPerson = videoData.main_person;
        
        // Update person count
        document.getElementById('person-count').textContent = personTracking.total_persons || 0;
        
        // Update main person status
        const mainPersonStatus = document.getElementById('main-person-status');
        if (personTracking.has_main_person) {
            mainPersonStatus.textContent = '✓';
            mainPersonStatus.className = 'text-success';
        } else {
            mainPersonStatus.textContent = '✗';
            mainPersonStatus.className = 'text-danger';
        }
        
        // Update main person details
        if (mainPerson) {
            document.getElementById('main-person-id').textContent = mainPerson.id ? mainPerson.id.substring(0, 8) + '...' : 'None';
            document.getElementById('main-person-confidence').textContent = (personTracking.main_person_confidence || 0).toFixed(2);
            document.getElementById('main-person-size').textContent = (mainPerson.size_ratio || 0).toFixed(3);
        } else {
            document.getElementById('main-person-id').textContent = 'None';
            document.getElementById('main-person-confidence').textContent = '0.00';
            document.getElementById('main-person-size').textContent = '0.000';
        }
        
        // Update person list
        const personListElement = document.getElementById('person-list');
        if (personTracking.person_detections && personTracking.person_detections.length > 0) {
            personListElement.innerHTML = personTracking.person_detections
                .map((person, index) => `
                    <div class="object-item">
                        <span class="object-name">Person ${index + 1}</span>
                        <span class="object-confidence">${(person.confidence * 100).toFixed(0)}%</span>
                    </div>
                `).join('');
        } else {
            personListElement.innerHTML = '<em class="text-muted">No people detected</em>';
        }
    }
    
    updateSessionStats(sessionStats) {
        // Update session duration
        const duration = sessionStats.session_duration || 0;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = Math.floor(duration % 60);
        
        document.getElementById('session-duration').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update emotion changes
        const emotionChanges = sessionStats.emotion_changes || 0;
        const emotionChangesElement = document.getElementById('emotion-changes');
        if (emotionChangesElement) {
            emotionChangesElement.textContent = emotionChanges;
            // Add animation when value changes
            if (parseInt(emotionChangesElement.textContent) !== emotionChanges) {
                emotionChangesElement.style.animation = 'emotionPulse 0.5s ease-in-out';
            }
        }
        
        // Update average attention score
        const avgAttention = sessionStats.avg_attention_score || 0;
        const attentionScoreElement = document.getElementById('attention-score');
        if (attentionScoreElement) {
            const percentage = Math.round(avgAttention);
            attentionScoreElement.textContent = `${percentage}%`;
            // Color based on score
            if (percentage >= 70) {
                attentionScoreElement.className = 'text-success';
            } else if (percentage >= 40) {
                attentionScoreElement.className = 'text-warning';
            } else {
                attentionScoreElement.className = 'text-danger';
            }
        }
        
        // Update fatigue score
        const fatigueScore = sessionStats.fatigue_score || 0;
        const fatigueScoreElement = document.getElementById('fatigue-score');
        if (fatigueScoreElement) {
            const percentage = Math.round(fatigueScore);
            fatigueScoreElement.textContent = `${percentage}%`;
            // Color based on score
            if (percentage <= 30) {
                fatigueScoreElement.className = 'text-success';
            } else if (percentage <= 60) {
                fatigueScoreElement.className = 'text-warning';
            } else {
                fatigueScoreElement.className = 'text-danger';
            }
        }
    }
    
    updateCharts(data) {
        // Update blink rate chart
        if (this.dataHistory.blinkRate.length > 0) {
            this.charts.blink.data.labels = this.dataHistory.timestamps;
            this.charts.blink.data.datasets[0].data = this.dataHistory.blinkRate;
            this.charts.blink.update('none');
        }
        
        // Update object detection chart
        if (Object.keys(this.dataHistory.objectCounts).length > 0) {
            const objectEntries = Object.entries(this.dataHistory.objectCounts);
            this.charts.objects.data.labels = objectEntries.map(([name]) => name);
            this.charts.objects.data.datasets[0].data = objectEntries.map(([, count]) => count);
            this.charts.objects.update('none');
        }
        
        // Update emotion chart
        if (data.video && data.video.emotion_scores) {
            const emotionScores = data.video.emotion_scores;
            const emotionData = [
                emotionScores.happy || 0,
                emotionScores.sad || 0,
                emotionScores.angry || 0,
                emotionScores.fear || 0,
                emotionScores.surprise || 0,
                emotionScores.neutral || 0
            ];
            
            this.charts.emotion.data.datasets[0].data = emotionData;
            this.charts.emotion.update('none');
        }
    }
    
    updateVideoFeed(frameData) {
        const videoElement = document.getElementById('video-feed');
        const placeholderElement = document.getElementById('video-placeholder');
        const videoContainer = document.getElementById('video-container');
        const videoStatus = document.getElementById('video-status');
        
        if (frameData) {
            // Add fade effect
            videoElement.classList.add('loading');
            
            // Use requestAnimationFrame for smooth updates
            requestAnimationFrame(() => {
                videoElement.src = `data:image/jpeg;base64,${frameData}`;
                videoElement.onload = () => {
                    videoElement.classList.remove('loading');
                    videoElement.style.display = 'block';
                    placeholderElement.style.display = 'none';
                    videoContainer.style.background = '#000';
                    if (videoStatus) videoStatus.style.display = 'block';
                };
                videoElement.onerror = () => {
                    console.error('Failed to load video frame');
                    videoElement.style.display = 'none';
                    placeholderElement.style.display = 'flex';
                    if (videoStatus) videoStatus.style.display = 'none';
                };
            });
        } else {
            videoElement.style.display = 'none';
            placeholderElement.style.display = 'flex';
            videoContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            if (videoStatus) videoStatus.style.display = 'none';
        }
    }
    
    getFatiguePercentage(fatigueLevel) {
        switch (fatigueLevel.toLowerCase()) {
            case 'normal': return 20;
            case 'mild': return 40;
            case 'moderate': return 60;
            case 'severe': return 80;
            default: return 20;
        }
    }
    
    getFatigueColor(fatigueLevel) {
        switch (fatigueLevel.toLowerCase()) {
            case 'normal': return 'bg-success';
            case 'mild': return 'bg-warning';
            case 'moderate': return 'bg-warning';
            case 'severe': return 'bg-danger';
            default: return 'bg-success';
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new BehavioralDashboard();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, reduce update frequency
        console.log('Page hidden, reducing updates');
    } else {
        // Page is visible, resume normal updates
        console.log('Page visible, resuming updates');
        if (window.dashboard) {
            window.dashboard.requestInitialData();
        }
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.dashboard && window.dashboard.charts) {
        Object.values(window.dashboard.charts).forEach(chart => {
            chart.resize();
        });
    }
});
