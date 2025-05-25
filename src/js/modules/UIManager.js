/**
 * UI Manager Module
 * Handles UI state, updates, animations, and user interactions
 */

export default class UIManager {
    constructor(app) {
        this.app = app;
        
        // Cache DOM elements
        this.elements = {
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            currentModel: document.getElementById('currentModel'),
            responseTime: document.getElementById('responseTime'),
            imageCount: document.getElementById('imageCount'),
            sendBtn: document.getElementById('sendBtn'),
            themeToggle: document.getElementById('themeToggle'),
            performanceMonitor: document.getElementById('performanceMonitor'),
            messageInput: document.getElementById('messageInput'),
            captureBtn: document.getElementById('pauseBtn'),
            settingsPanel: document.getElementById('settingsPanel')
        };

        // UI state
        this.state = {
            isSending: false,
            isDarkTheme: false,
            isSettingsOpen: false,
            isPerformanceVisible: false,
            lastNotification: null
        };
    }

    async initialize() {
        // Initialize UI components
        this.initializeTheme();
        this.setupResizeHandlers();
        this.setupScrollHandlers();
        this.setupAnimationHandlers();
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('enhancedVisionChatTheme');
        if (savedTheme === 'dark') {
            this.toggleTheme();
        }
    }

    setupResizeHandlers() {
        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', () => {
            this.adjustTextareaHeight(this.elements.messageInput);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    setupScrollHandlers() {
        // Smooth scroll for messages container
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.addEventListener('scroll', () => {
            this.handleScroll(messagesContainer);
        });
    }

    setupAnimationHandlers() {
        // Handle animation end events
        document.addEventListener('animationend', (e) => {
            if (e.target.classList.contains('notification')) {
                e.target.remove();
            }
        });
    }

    adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
    }

    handleResize() {
        // Update UI elements based on window size
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile', isMobile);
        
        // Adjust video container aspect ratio
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
            const aspectRatio = isMobile ? 9/16 : 16/9;
            videoContainer.style.paddingBottom = `${(1/aspectRatio) * 100}%`;
        }
    }

    handleScroll(container) {
        // Show/hide scroll indicator
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
        container.classList.toggle('show-scroll-indicator', !isNearBottom);
    }

    updateConnectionStatus(status) {
        this.elements.statusDot.className = 'status-dot';
        
        switch (status) {
            case 'connected':
                this.elements.statusDot.classList.add('connected');
                this.elements.statusText.textContent = 'Connected & Ready';
                break;
            case 'connecting':
                this.elements.statusText.textContent = 'Connecting...';
                break;
            case 'warning':
                this.elements.statusDot.classList.add('warning');
                this.elements.statusText.textContent = 'Model Warning';
                break;
            default:
                this.elements.statusText.textContent = 'Disconnected';
        }
    }

    updateModelInfo(model) {
        this.elements.currentModel.textContent = model;
    }

    updatePerformanceStats(fps, memory) {
        if (this.state.isPerformanceVisible) {
            document.getElementById('fpsCounter').textContent = fps;
            document.getElementById('memoryUsage').textContent = memory;
        }
    }

    setSendingState(sending) {
        this.state.isSending = sending;
        this.elements.sendBtn.disabled = sending;
        const btnText = this.elements.sendBtn.querySelector('span');
        const btnIcon = this.elements.sendBtn.querySelector('span:last-child');
        
        if (sending) {
            btnText.textContent = 'Sending...';
            btnIcon.innerHTML = '<div class="loading-spinner"></div>';
        } else {
            btnText.textContent = 'Send';
            btnIcon.textContent = '🚀';
        }
        
        this.elements.messageInput.disabled = sending;
    }

    updateCaptureButton(isCapturing) {
        const btn = this.elements.captureBtn;
        btn.classList.toggle('active', isCapturing);
        btn.innerHTML = isCapturing ? '⏸️' : '▶️';
        btn.title = isCapturing ? 'Pause Auto-capture' : 'Resume Auto-capture';
    }

    toggleTheme() {
        this.state.isDarkTheme = !this.state.isDarkTheme;
        document.documentElement.setAttribute(
            'data-theme',
            this.state.isDarkTheme ? 'dark' : 'light'
        );
        this.elements.themeToggle.textContent = this.state.isDarkTheme ? '☀️' : '🌙';
        localStorage.setItem(
            'enhancedVisionChatTheme',
            this.state.isDarkTheme ? 'dark' : 'light'
        );
    }

    togglePerformanceMonitor() {
        this.state.isPerformanceVisible = !this.state.isPerformanceVisible;
        this.elements.performanceMonitor.classList.toggle('show', this.state.isPerformanceVisible);
    }

    showSettingsPanel() {
        this.state.isSettingsOpen = true;
        this.elements.settingsPanel.classList.add('show');
    }

    hideSettingsPanel() {
        this.state.isSettingsOpen = false;
        this.elements.settingsPanel.classList.remove('show');
    }

    handleStateChange(key, value) {
        switch (key) {
            case 'darkTheme':
                if (value !== this.state.isDarkTheme) {
                    this.toggleTheme();
                }
                break;
            case 'isPerformanceVisible':
                this.togglePerformanceMonitor();
                break;
            case 'currentModel':
                this.updateModelInfo(value);
                break;
            case 'imageCount':
                this.elements.imageCount.textContent = value;
                break;
            case 'lastResponseTime':
                this.elements.responseTime.textContent = value;
                break;
        }
    }

    showLoadingIndicator(message = 'Loading...') {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <span>${message}</span>
        `;
        document.body.appendChild(loadingDiv);
        return loadingDiv;
    }

    hideLoadingIndicator(indicator) {
        if (indicator && indicator.parentNode) {
            indicator.classList.add('fade-out');
            setTimeout(() => indicator.remove(), 300);
        }
    }

    showTooltip(element, message) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = message;
        
        const rect = element.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + 5}px`;
        tooltip.style.left = `${rect.left + (rect.width/2)}px`;
        
        document.body.appendChild(tooltip);
        setTimeout(() => tooltip.remove(), 2000);
    }

    shake(element) {
        element.classList.add('shake');
        element.addEventListener('animationend', () => {
            element.classList.remove('shake');
        }, { once: true });
    }

    pulse(element) {
        element.classList.add('pulse');
        element.addEventListener('animationend', () => {
            element.classList.remove('pulse');
        }, { once: true });
    }

    fadeIn(element) {
        element.classList.add('fade-in');
        element.addEventListener('animationend', () => {
            element.classList.remove('fade-in');
        }, { once: true });
    }

    fadeOut(element, remove = false) {
        element.classList.add('fade-out');
        element.addEventListener('animationend', () => {
            element.classList.remove('fade-out');
            if (remove) element.remove();
        }, { once: true });
    }

    disableInteraction() {
        document.body.classList.add('no-interaction');
    }

    enableInteraction() {
        document.body.classList.remove('no-interaction');
    }

    clearSelection() {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    }

    requestFullscreen(element = document.documentElement) {
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }

    isFullscreen() {
        return document.fullscreenElement !== null ||
               document.webkitFullscreenElement !== null;
    }

    toggleFullscreen() {
        if (this.isFullscreen()) {
            this.exitFullscreen();
        } else {
            this.requestFullscreen();
        }
    }
}

