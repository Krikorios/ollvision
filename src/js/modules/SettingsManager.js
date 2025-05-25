/**
 * Settings Manager Module
 * Handles application settings, configuration, and their persistence
 */

export default class SettingsManager {
    constructor(app) {
        this.app = app;
        this.storageKey = 'enhancedVisionChatSettings';
        this.settingsPanel = document.getElementById('settingsPanel');
        
        // Default settings
        this.defaults = {
            ollamaUrl: 'http://localhost:11434',
            modelName: 'llava',
            systemPrompt: 'You are a helpful AI assistant with advanced vision capabilities.',
            contextMemory: 10,
            imageQuality: 0.8,
            timeout: 30000,
            responseStyle: 'casual',
            cameraSource: 'user',
            autoCapture: true,
            captureInterval: 10,
            smartDetection: false,
            enablePerformance: false,
            cacheResponses: true,
            theme: 'light',
            voiceMode: false
        };
    }

    async initialize() {
        this.setupSettingsPanel();
        this.setupEventListeners();
        await this.loadSettings();
    }

    setupSettingsPanel() {
        // Connection settings
        this.bindInput('ollamaUrl', 'text');
        this.bindInput('modelName', 'select');
        this.bindInput('timeout', 'range', value => {
            document.getElementById('timeoutValue').textContent = value;
            return value * 1000;
        });

        // Camera settings
        this.bindInput('autoCapture', 'checkbox');
        this.bindInput('captureInterval', 'range', value => {
            document.getElementById('intervalValue').textContent = value;
            return parseInt(value);
        });
        this.bindInput('imageQuality', 'select', value => parseFloat(value));
        this.bindInput('cameraSource', 'select');
        this.bindInput('smartDetection', 'checkbox');

        // AI settings
        this.bindInput('systemPrompt', 'textarea');
        this.bindInput('contextMemory', 'select', value => parseInt(value));
        this.bindInput('responseStyle', 'select');
        this.bindInput('autoDescribe', 'checkbox');

        // Performance settings
        this.bindInput('enablePerformance', 'checkbox');
        this.bindInput('cacheResponses', 'checkbox');
    }

    setupEventListeners() {
        // Settings panel toggle
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.toggleSettings();
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.hideSettings();
        });

        // Model selection handling
        document.getElementById('modelName').addEventListener('change', (e) => {
            const customModelItem = document.getElementById('customModelItem');
            if (e.target.value === 'custom') {
                customModelItem.style.display = 'block';
            } else {
                customModelItem.style.display = 'none';
                this.set('modelName', e.target.value);
            }
        });

        // Custom model input
        document.getElementById('customModel').addEventListener('change', (e) => {
            this.set('modelName', e.target.value);
        });

        // Handle clicks outside settings panel
        document.addEventListener('click', (e) => {
            if (!this.settingsPanel.contains(e.target) && 
                !e.target.matches('#settingsBtn') && 
                this.settingsPanel.classList.contains('show')) {
                this.hideSettings();
            }
        });
    }

    bindInput(settingKey, type, transformer = null) {
        const element = document.getElementById(settingKey);
        if (!element) return;

        // Set initial value
        if (type === 'checkbox') {
            element.checked = this.get(settingKey);
        } else {
            element.value = this.get(settingKey);
        }

        // Add event listener
        element.addEventListener(type === 'range' ? 'input' : 'change', (e) => {
            let value = type === 'checkbox' ? e.target.checked : e.target.value;
            if (transformer) {
                value = transformer(value);
            }
            this.set(settingKey, value);
        });
    }

    async loadSettings() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const settings = JSON.parse(saved);
                
                // Apply saved settings
                Object.entries(settings).forEach(([key, value]) => {
                    this.app.setConfig(key, value);
                    
                    // Update UI elements
                    const element = document.getElementById(key);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = value;
                        } else {
                            element.value = value;
                        }
                    }
                });

                // Special handling for theme
                if (settings.theme === 'dark') {
                    this.app.ui.toggleTheme();
                }

                // Special handling for voice mode
                if (settings.voiceMode) {
                    this.app.voice.toggleVoiceMode();
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.app.notifications.show('⚠️ Failed to load settings', 'warning');
        }
    }

    saveSettings() {
        const settings = {
            ollamaUrl: this.app.getConfig('ollamaUrl'),
            modelName: this.app.getConfig('modelName'),
            systemPrompt: this.app.getConfig('systemPrompt'),
            contextMemory: this.app.getConfig('contextMemory'),
            imageQuality: this.app.getConfig('imageQuality'),
            timeout: this.app.getConfig('timeout'),
            responseStyle: this.app.getConfig('responseStyle'),
            cameraSource: this.app.getConfig('cameraSource'),
            autoCapture: this.get('autoCapture'),
            captureInterval: this.get('captureInterval'),
            enablePerformance: this.get('enablePerformance'),
            cacheResponses: this.get('cacheResponses'),
            theme: this.app.getState('darkTheme') ? 'dark' : 'light',
            voiceMode: this.app.getState('voiceMode')
        };

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.app.notifications.show('⚠️ Failed to save settings', 'warning');
        }
    }

    get(key) {
        const element = document.getElementById(key);
        if (!element) return this.defaults[key];

        if (element.type === 'checkbox') {
            return element.checked;
        } else if (element.type === 'range' || element.tagName === 'SELECT') {
            return element.value;
        }
        return element.value || this.defaults[key];
    }

    set(key, value) {
        const element = document.getElementById(key);
        if (element) {
            if (element.type === 'checkbox') {
                element.checked = value;
            } else {
                element.value = value;
            }
        }
        this.app.setConfig(key, value);
        this.saveSettings();
        this.handleSettingChange(key, value);
    }

    handleSettingChange(key, value) {
        switch (key) {
            case 'autoCapture':
                if (value) {
                    this.app.camera.startAutoCapture();
                } else {
                    this.app.camera.stopAutoCapture();
                }
                break;
            
            case 'enablePerformance':
                if (value) {
                    this.app.performance.startMonitoring();
                } else {
                    this.app.performance.stopMonitoring();
                }
                break;
            
            case 'cameraSource':
                this.app.camera.initialize();
                break;
            
            case 'cacheResponses':
                if (!value) {
                    this.app.state.responseCache.clear();
                }
                break;
        }
    }

    toggleSettings() {
        this.settingsPanel.classList.toggle('show');
    }

    hideSettings() {
        this.settingsPanel.classList.remove('show');
    }

    updateAvailableModels() {
        const select = document.getElementById('modelName');
        const customOption = select.querySelector('option[value="custom"]');
        
        // Clear existing model options (except predefined ones)
        const predefinedValues = ['llava', 'llava:7b', 'llava:13b', 'llava:34b', 'bakllava', 'moondream', 'custom'];
        Array.from(select.options).forEach(option => {
            if (!predefinedValues.includes(option.value)) {
                option.remove();
            }
        });

        // Add available models
        this.app.state.availableModels.forEach(model => {
            if (!predefinedValues.includes(model.name)) {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = `${model.name} (${this.formatBytes(model.size)})`;
                select.insertBefore(option, customOption);
            }
        });
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    resetToDefaults() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            Object.entries(this.defaults).forEach(([key, value]) => {
                this.set(key, value);
            });
            this.app.notifications.show('🔄 Settings reset to defaults');
        }
    }

    exportSettings() {
        const settings = {
            timestamp: new Date().toISOString(),
            settings: Object.fromEntries(
                Object.keys(this.defaults).map(key => [key, this.get(key)])
            )
        };

        const blob = new Blob([JSON.stringify(settings, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vision-chat-settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.app.notifications.show('💾 Settings exported successfully');
    }

    async importSettings(file) {
        try {
            const content = await file.text();
            const { settings } = JSON.parse(content);
            
            Object.entries(settings).forEach(([key, value]) => {
                this.set(key, value);
            });
            
            this.app.notifications.show('✅ Settings imported successfully');
            
        } catch (error) {
            console.error('Failed to import settings:', error);
            this.app.notifications.show('❌ Failed to import settings', 'error');
        }
    }
}

