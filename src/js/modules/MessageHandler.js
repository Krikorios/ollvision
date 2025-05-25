/**
 * Message Handler Module
 * Manages chat messages, history, and interaction with Ollama API
 */

export default class MessageHandler {
    constructor(app) {
        this.app = app;
        this.messageQueue = [];
        this.isProcessing = false;
        this.maxRetries = 3;
        this.maxHistoryLength = 100;
    }

    async initialize() {
        // Load any saved chat history
        this.loadChatHistory();
        
        // Initialize quick actions
        this.setupQuickActions();
    }

    setupQuickActions() {
        document.querySelectorAll('.quick-action').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.dataset.prompt;
                if (prompt) {
                    this.app.messageInput.value = prompt;
                    this.app.messageInput.focus();
                    this.app.ui.adjustTextareaHeight(this.app.messageInput);
                }
            });
        });
    }

    async sendMessage() {
        const message = this.app.messageInput.value.trim();
        if (!message) return;

        if (!this.app.getState('connected')) {
            this.addErrorMessage('❌ Not connected to Ollama. Please check the connection.');
            this.app.notifications.show('❌ Connection required', 'error');
            return;
        }

        // Ensure we have recent image data
        if (!this.app.getState('currentImageData') || 
            (Date.now() - this.app.getState('lastCaptureTime') > 30000)) {
            this.app.camera.captureFrame();
        }

        // Check cache for similar messages
        const cacheKey = this.generateCacheKey(message);
        if (this.app.settings.get('cacheResponses') && this.app.state.responseCache.has(cacheKey)) {
            const cachedResponse = this.app.state.responseCache.get(cacheKey);
            this.addUserMessage(message);
            this.addAssistantMessage(cachedResponse + ' (cached)');
            this.app.notifications.show('⚡ Response served from cache');
            return;
        }

        // Process the message
        this.addUserMessage(message);
        this.app.messageInput.value = '';
        this.app.messageInput.style.height = 'auto';
        this.app.ui.setSendingState(true);
        this.showTypingIndicator();

        const startTime = Date.now();

        try {
            const response = await this.sendToOllama(message);
            
            this.app.setState('lastResponseTime', Date.now() - startTime);
            this.addAssistantMessage(response);
            this.updateMessageHistory(message, response);
            
            // Cache the response
            if (this.app.settings.get('cacheResponses')) {
                this.app.state.responseCache.set(cacheKey, response);
            }
            
            // Voice synthesis if enabled
            if (this.app.getState('voiceMode')) {
                this.app.voice.speakResponse(response);
            }
            
            this.app.notifications.show('✅ Response received');
            
        } catch (error) {
            console.error('Message sending failed:', error);
            this.addErrorMessage('❌ Error: ' + error.message);
            this.app.notifications.show('❌ ' + error.message, 'error');
            
        } finally {
            this.app.ui.setSendingState(false);
            this.hideTypingIndicator();
        }
    }

    async sendToOllama(message) {
        const payload = {
            model: this.app.getConfig('modelName'),
            prompt: this.buildContextualPrompt(message),
            stream: false,
            options: {
                temperature: this.getTemperatureForStyle(),
                top_p: 0.9,
                num_ctx: 4096
            }
        };

        // Add image data if available
        const imageData = this.app.getState('currentImageData');
        if (imageData) {
            payload.images = [imageData];
        }

        const controller = new AbortController();
        setTimeout(() => controller.abort(), this.app.getConfig('timeout'));

        const response = await fetch(`${this.app.getConfig('ollamaUrl')}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`Request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.response || 'No response received';
    }

    buildContextualPrompt(currentMessage) {
        let prompt = this.app.getConfig('systemPrompt');
        
        // Add style-specific instructions
        switch (this.app.getConfig('responseStyle')) {
            case 'professional':
                prompt += ' Respond in a professional, formal manner.';
                break;
            case 'technical':
                prompt += ' Provide detailed technical explanations and analysis.';
                break;
            case 'creative':
                prompt += ' Be creative, imaginative, and engaging in your responses.';
                break;
            case 'casual':
                prompt += ' Be casual, friendly, and conversational.';
                break;
        }
        
        prompt += '\n\n';
        
        // Add recent conversation history
        const recentHistory = this.getRecentHistory();
        if (recentHistory.length > 0) {
            prompt += 'Recent conversation:\n';
            recentHistory.forEach(({ user, assistant }) => {
                prompt += `Human: ${user}\nAssistant: ${assistant}\n\n`;
            });
        }
        
        prompt += `Human: ${currentMessage}\nAssistant:`;
        return prompt;
    }

    getTemperatureForStyle() {
        switch (this.app.getConfig('responseStyle')) {
            case 'professional': return 0.3;
            case 'technical': return 0.2;
            case 'creative': return 0.9;
            case 'casual':
            default: return 0.7;
        }
    }

    addUserMessage(content) {
        this.addMessage('user', content);
    }

    addAssistantMessage(content) {
        this.addMessage('assistant', content);
    }

    addSystemMessage(content) {
        this.addMessage('system', content);
    }

    addErrorMessage(content) {
        this.addMessage('error', content);
    }

    addSuccessMessage(content) {
        this.addMessage('success', content);
    }

    addMessage(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = this.formatMessageContent(content);
        messageDiv.appendChild(contentDiv);
        
        // Add message actions for assistant messages
        if (type === 'assistant') {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';
            actionsDiv.innerHTML = this.getMessageActionsHTML();
            messageDiv.appendChild(actionsDiv);
        }
        
        if (type !== 'system' && type !== 'error' && type !== 'success') {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'message-time';
            timeDiv.textContent = new Date().toLocaleTimeString();
            messageDiv.appendChild(timeDiv);
        }
        
        this.app.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    getMessageActionsHTML() {
        return `
            <button class="message-action-btn" onclick="app.messages.copyMessage(this)">📋</button>
            <button class="message-action-btn" onclick="app.voice.speakMessage(this)">🔊</button>
            <button class="message-action-btn" onclick="app.messages.regenerateResponse(this)">🔄</button>
        `;
    }

    formatMessageContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/(\bhttps?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
    }

    showTypingIndicator() {
        this.app.typingIndicator.classList.add('show');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.app.typingIndicator.classList.remove('show');
    }

    scrollToBottom() {
        this.app.messagesContainer.scrollTop = this.app.messagesContainer.scrollHeight;
    }

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            this.app.messagesContainer.innerHTML = `
                <div class="message system">
                    🔄 Chat cleared! Enhanced Vision Chat Pro is ready to help with your visual tasks.
                </div>
            `;
            this.app.state.messageHistory = [];
            this.app.state.responseCache.clear();
            localStorage.removeItem('chatHistory');
            this.app.notifications.show('🗑️ Chat cleared successfully');
        }
    }

    exportChat() {
        const chatData = {
            timestamp: new Date().toISOString(),
            settings: {
                model: this.app.getConfig('modelName'),
                ollamaUrl: this.app.getConfig('ollamaUrl'),
                responseStyle: this.app.getConfig('responseStyle')
            },
            messages: Array.from(this.app.messagesContainer.children).map(msg => ({
                type: msg.className.replace('message ', ''),
                content: msg.querySelector('div').textContent,
                time: msg.querySelector('.message-time')?.textContent || null
            })),
            statistics: {
                totalMessages: this.app.state.messageHistory.length,
                imagesProcessed: this.app.getState('imageCount'),
                averageResponseTime: this.app.getState('lastResponseTime')
            }
        };

        const blob = new Blob([JSON.stringify(chatData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced-vision-chat-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.addSuccessMessage('💾 Chat export completed successfully!');
        this.app.notifications.show('💾 Chat exported with full metadata');
    }

    async copyMessage(button) {
        const message = button.closest('.message').querySelector('div').textContent;
        await navigator.clipboard.writeText(message);
        this.app.notifications.show('📋 Message copied to clipboard');
    }

    regenerateResponse(button) {
        const messageElement = button.closest('.message');
        const userMessage = messageElement.previousElementSibling;
        
        if (userMessage && userMessage.classList.contains('user')) {
            const userText = userMessage.querySelector('div').textContent;
            this.app.messageInput.value = userText;
            this.sendMessage();
            this.app.notifications.show('🔄 Regenerating response...');
        }
    }

    updateMessageHistory(userMessage, assistantResponse) {
        this.app.state.messageHistory.push({
            user: userMessage,
            assistant: assistantResponse,
            timestamp: Date.now(),
            imageUsed: !!this.app.getState('currentImageData')
        });
        
        // Trim history if it exceeds maximum length
        if (this.app.state.messageHistory.length > this.maxHistoryLength) {
            this.app.state.messageHistory = this.app.state.messageHistory.slice(-this.maxHistoryLength);
        }
        
        // Save to local storage
        this.saveChatHistory();
    }

    getRecentHistory() {
        const contextMemory = this.app.getConfig('contextMemory');
        return this.app.state.messageHistory.slice(-contextMemory);
    }

    generateCacheKey(message) {
        const imageData = this.app.getState('currentImageData');
        return `${message}_${imageData?.substring(0, 100) || ''}`;
    }

    saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify({
            messages: this.app.state.messageHistory,
            timestamp: Date.now()
        }));
    }

    loadChatHistory() {
        const saved = localStorage.getItem('chatHistory');
        if (saved) {
            const { messages, timestamp } = JSON.parse(saved);
            
            // Only load history if it's less than 24 hours old
            if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
                this.app.state.messageHistory = messages;
                
                // Rebuild message UI
                messages.forEach(msg => {
                    this.addUserMessage(msg.user);
                    this.addAssistantMessage(msg.assistant);
                });
            } else {
                localStorage.removeItem('chatHistory');
            }
        }
    }
}

