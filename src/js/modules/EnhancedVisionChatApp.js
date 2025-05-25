// Import managers and utilities
import CameraManager from './CameraManager.js';
import MessageHandler from './MessageHandler.js';
import SettingsManager from './SettingsManager.js';
import UIManager from './UIManager.js';
import VoiceManager from './VoiceManager.js';
import PerformanceMonitor from './PerformanceMonitor.js';
import NotificationManager from './NotificationManager.js';
import { debounce, generateUUID } from './utils.js';

export default class EnhancedVisionChatApp {
    constructor() {
        // Core Elements
        this.video = document.getElementById('videoElement');
        this.canvas = document.getElementById('captureCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.statusDot = document.getElementById('statusDot');
        this.statusText = document.getElementById('statusText');
        this.typingIndicator = document.getElementById('typingIndicator');

        // Feature Managers
        this.ui = new UIManager(this);
        this.camera = new CameraManager(this);
        this.messages = new MessageHandler(this);
        this.settings = new SettingsManager(this);
        this.voice = new VoiceManager(this);
        this.performance = new PerformanceMonitor(this);
        this.notifications = new NotificationManager(this);

        // Application State
        this.state = {
            connected: false,
            recording: false,
            darkTheme: false,
            voiceMode: false,
            captureIntervalId: null,
            lastCaptureTime: 0,
            currentImageData: null,
            messageHistory: [],
            availableModels: [],
            lastResponseTime: 0,
            imageCount: 0,
            responseCache: new Map()
        };

        // Configuration
        this.config = {
            ollamaUrl: 'http://localhost:11434',
            modelName: 'llava',
            systemPrompt: 'You are a helpful AI assistant with advanced vision capabilities.',
            contextMemory: 10,
            imageQuality: 0.8,
            timeout: 30000,
            responseStyle: 'casual',
            cameraSource: 'user'
        };

        // Initialize the application
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Enhanced Vision Chat Pro...');
        
        try {
            // Initialize all managers
            await this.initializeManagers();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load saved settings
            this.settings.loadSettings();
            
            // Initialize camera
            await this.camera.initialize();
            
            // Check Ollama connection
            await this.checkConnection();
            
            // Start auto-capture if enabled
            if (this.settings.get('autoCapture')) {
                this.camera.startAutoCapture();
            }
            
            // Initialize theme
            this.ui.initializeTheme();
            
            this.notifications.show('✅ Enhanced Vision Chat Pro initialized successfully!', 'success');
            console.log('✅ Initialization complete!');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.notifications.show('❌ Initialization failed: ' + error.message, 'error');
        }
    }

    async initializeManagers() {
        await Promise.all([
            this.ui.initialize(),
            this.messages.initialize(),
            this.settings.initialize(),
            this.voice.initialize(),
            this.performance.initialize(),
            this.notifications.initialize()
        ]);
    }

    setupEventListeners() {
        // Core functionality
        this.sendBtn.addEventListener('click', () => this.messages.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.messages.sendMessage();
            }
        });

        // Message input handling
        this.messageInput.addEventListener('input', () => {
            this.ui.adjustTextareaHeight(this.messageInput);
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        this.messages.clearChat();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.messages.exportChat();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        this.camera.captureFrame();
                        this.camera.showImagePreview();
                        break;
                }
            }
            
            if (e.key === 'Escape') {
                this.ui.hideSettings();
            }
        });
    }

    async checkConnection() {
        try {
            this.setConnectionStatus('connecting');
            const controller = new AbortController();
            setTimeout(() => controller.abort(), this.config.timeout);
            
            const response = await fetch(`${this.config.ollamaUrl}/api/tags`, {
                signal: controller.signal
            });
            
            if (response.ok) {
                const data = await response.json();
                this.state.availableModels = data.models || [];
                this.setConnectionStatus('connected');
                this.settings.updateAvailableModels();
                
                if (!this.state.availableModels.some(model => 
                    model.name.includes(this.config.modelName)
                )) {
                    this.messages.addSystemMessage(`⚠️ Model "${this.config.modelName}" not found.`);
                    this.setConnectionStatus('warning');
                }
                
                this.notifications.show('✅ Connected to Ollama successfully!');
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            console.error('❌ Ollama connection failed:', error);
            this.setConnectionStatus('disconnected');
            this.handleConnectionError(error);
        }
    }

    setConnectionStatus(status) {
        this.state.connected = status === 'connected' || status === 'warning';
        this.ui.updateConnectionStatus(status);
    }

    handleConnectionError(error) {
        if (error.name === 'AbortError') {
            this.messages.addErrorMessage(
                `Connection timeout after ${this.config.timeout/1000}s. Please check if Ollama is running.`
            );
        } else {
            this.messages.addErrorMessage(
                `Failed to connect to Ollama at ${this.config.ollamaUrl}. Make sure Ollama is running.`
            );
        }
        this.notifications.show('❌ Failed to connect to Ollama', 'error');
    }

    // Utility methods
    getConfig(key) {
        return this.config[key];
    }

    setConfig(key, value) {
        this.config[key] = value;
        this.settings.saveSettings();
    }

    getState(key) {
        return this.state[key];
    }

    setState(key, value) {
        this.state[key] = value;
        // Trigger any necessary UI updates
        this.ui.handleStateChange(key, value);
    }
}

