/**
 * Voice Manager Module
 * Handles voice recognition and speech synthesis functionality
 */

export default class VoiceManager {
    constructor(app) {
        this.app = app;
        this.recognition = null;
        this.synthesis = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.voices = [];
        
        // Voice settings
        this.settings = {
            language: 'en-US',
            continuous: false,
            interimResults: false,
            maxAlternatives: 1,
            pitch: 1,
            rate: 0.9,
            volume: 0.8,
            voiceName: null // Will be set during initialization
        };
    }

    async initialize() {
        await this.initializeRecognition();
        await this.initializeSynthesis();
        this.setupEventListeners();
    }

    async initializeRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition
        this.recognition.lang = this.settings.language;
        this.recognition.continuous = this.settings.continuous;
        this.recognition.interimResults = this.settings.interimResults;
        this.recognition.maxAlternatives = this.settings.maxAlternatives;

        // Setup recognition event handlers
        this.recognition.onstart = () => this.handleRecognitionStart();
        this.recognition.onend = () => this.handleRecognitionEnd();
        this.recognition.onresult = (event) => this.handleRecognitionResult(event);
        this.recognition.onerror = (event) => this.handleRecognitionError(event);
    }

    async initializeSynthesis() {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return;
        }

        this.synthesis = window.speechSynthesis;
        
        // Wait for voices to be loaded
        if (this.synthesis.getVoices().length === 0) {
            await new Promise(resolve => {
                this.synthesis.addEventListener('voiceschanged', () => {
                    this.voices = this.synthesis.getVoices();
                    resolve();
                }, { once: true });
            });
        } else {
            this.voices = this.synthesis.getVoices();
        }

        // Set default voice (prefer en-US)
        this.settings.voiceName = this.selectDefaultVoice();
    }

    setupEventListeners() {
        // Voice toggle button
        const voiceToggle = document.getElementById('voiceToggle');
        if (voiceToggle) {
            voiceToggle.addEventListener('click', () => this.toggleVoiceMode());
        }

        // Mic button
        const micBtn = document.getElementById('micBtn');
        if (micBtn) {
            micBtn.addEventListener('click', () => this.startVoiceInput());
        }
    }

    startVoiceInput() {
        if (!this.recognition) {
            this.app.notifications.show('❌ Voice recognition not supported', 'error');
            return;
        }

        if (this.isListening) {
            this.stopVoiceInput();
            return;
        }

        try {
            this.recognition.start();
            this.updateMicButton(true);
            this.app.notifications.show('🎤 Listening... Speak now!');
        } catch (error) {
            console.error('Failed to start voice recognition:', error);
            this.app.notifications.show('❌ Failed to start voice input', 'error');
        }
    }

    stopVoiceInput() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.updateMicButton(false);
        }
    }

    handleRecognitionStart() {
        this.isListening = true;
        this.updateMicButton(true);
    }

    handleRecognitionEnd() {
        this.isListening = false;
        this.updateMicButton(false);
    }

    handleRecognitionResult(event) {
        const transcript = event.results[0][0].transcript;
        this.app.messageInput.value = transcript;
        this.app.messageInput.focus();
        this.app.ui.adjustTextareaHeight(this.app.messageInput);
        
        // Auto-send if confidence is high
        if (event.results[0][0].confidence > 0.8) {
            this.app.messages.sendMessage();
        }
    }

    handleRecognitionError(event) {
        console.error('Speech recognition error:', event.error);
        this.app.notifications.show('❌ Voice recognition error: ' + event.error, 'error');
        this.updateMicButton(false);
    }

    updateMicButton(isActive) {
        const micBtn = document.getElementById('micBtn');
        if (micBtn) {
            micBtn.style.color = isActive ? 'var(--error-color)' : '';
            micBtn.innerHTML = isActive ? '🎙️' : '🎤';
            micBtn.classList.toggle('active', isActive);
        }
    }

    speakText(text, options = {}) {
        if (!this.synthesis) {
            console.warn('Speech synthesis not supported');
            return;
        }

        // Cancel any ongoing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply settings and custom options
        utterance.voice = this.getVoice(options.voiceName || this.settings.voiceName);
        utterance.pitch = options.pitch || this.settings.pitch;
        utterance.rate = options.rate || this.settings.rate;
        utterance.volume = options.volume || this.settings.volume;

        // Handle events
        utterance.onstart = () => {
            this.isSpeaking = true;
            this.app.notifications.show('🔊 Speaking...', 'info');
        };

        utterance.onend = () => {
            this.isSpeaking = false;
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.app.notifications.show('❌ Speech synthesis error', 'error');
            this.isSpeaking = false;
        };

        this.synthesis.speak(utterance);
    }

    stopSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
    }

    toggleVoiceMode() {
        this.app.setState('voiceMode', !this.app.getState('voiceMode'));
        const btn = document.getElementById('voiceToggle');
        
        if (this.app.getState('voiceMode')) {
            btn.innerHTML = '🔊 Voice ON';
            btn.style.background = 'var(--success-color)';
            btn.style.color = 'white';
            this.app.notifications.show('🎤 Voice mode enabled');
        } else {
            btn.innerHTML = '🎤 Voice';
            btn.style.background = '';
            btn.style.color = '';
            this.app.notifications.show('🔇 Voice mode disabled');
            this.stopSpeaking();
        }
    }

    getVoice(name) {
        return this.voices.find(voice => voice.name === name) ||
               this.voices.find(voice => voice.lang.startsWith('en')) ||
               this.voices[0];
    }

    selectDefaultVoice() {
        // Prefer English voices, with priority for specific ones
        const preferredVoices = [
            'Google US English',
            'Alex',
            'Samantha',
            'Microsoft David'
        ];

        for (const name of preferredVoices) {
            const voice = this.voices.find(v => v.name === name);
            if (voice) return voice.name;
        }

        // Fall back to any English voice
        const englishVoice = this.voices.find(voice => voice.lang.startsWith('en'));
        return englishVoice ? englishVoice.name : this.voices[0]?.name;
    }

    speakMessage(button) {
        if (!this.synthesis) return;

        const message = button.closest('.message').querySelector('div').textContent;
        this.speakText(message);
    }

    isVoiceSupported() {
        return ('webkitSpeechRecognition' in window) || 
               ('SpeechRecognition' in window) || 
               ('speechSynthesis' in window);
    }

    setVoiceSettings(settings) {
        Object.assign(this.settings, settings);
        
        if (this.recognition) {
            this.recognition.lang = this.settings.language;
            this.recognition.continuous = this.settings.continuous;
            this.recognition.interimResults = this.settings.interimResults;
            this.recognition.maxAlternatives = this.settings.maxAlternatives;
        }
    }
}

