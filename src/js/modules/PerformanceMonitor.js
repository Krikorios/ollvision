/**
 * Performance Monitor Module
 * Handles performance tracking, metrics, and monitoring
 */

export default class PerformanceMonitor {
    constructor(app) {
        this.app = app;
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.metrics = {
            fps: 0,
            memory: 0,
            cpu: 0,
            lastFrameTime: 0,
            frameCount: 0,
            frameHistory: [],
            memoryHistory: [],
            responseTimeHistory: [],
            imageProcessingTimes: []
        };

        // Configuration
        this.config = {
            updateInterval: 1000,      // Update interval in ms
            historyLength: 60,         // Number of data points to keep
            fpsTarget: 30,             // Target FPS
            memoryThreshold: 90,       // Memory usage warning threshold (%)
            responseTimeThreshold: 2000 // Response time warning threshold (ms)
        };

        // Performance marks
        this.marks = new Map();
    }

    async initialize() {
        this.setupEventListeners();
        this.checkBrowserSupport();
        
        // Initialize performance buffer if available
        if ('performance' in window) {
            performance.clearMarks();
            performance.clearMeasures();
        }
    }

    setupEventListeners() {
        // Performance monitor toggle button
        const perfBtn = document.getElementById('perfBtn');
        if (perfBtn) {
            perfBtn.addEventListener('click', () => this.toggleMonitoring());
        }

        // Monitor specific events
        window.addEventListener('blur', () => this.pauseMonitoring());
        window.addEventListener('focus', () => this.resumeMonitoring());
    }

    checkBrowserSupport() {
        this.hasPerformanceAPI = 'performance' in window;
        this.hasMemoryAPI = 'memory' in performance;
        this.hasResourceTiming = 'resourceTimingBufferSize' in performance;
        
        if (!this.hasPerformanceAPI) {
            console.warn('Performance API not supported');
        }
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitoringInterval = setInterval(() => {
            this.updateMetrics();
            this.updateUI();
        }, this.config.updateInterval);

        // Start frame counting
        this.startFrameTracking();
        
        // Show performance monitor
        document.getElementById('performanceMonitor').classList.add('show');
        
        this.app.notifications.show('📊 Performance monitoring started');
    }

    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
        
        // Stop frame tracking
        this.stopFrameTracking();
        
        // Hide performance monitor
        document.getElementById('performanceMonitor').classList.remove('show');
        
        this.app.notifications.show('📊 Performance monitoring stopped');
    }

    toggleMonitoring() {
        if (this.isMonitoring) {
            this.stopMonitoring();
        } else {
            this.startMonitoring();
        }
    }

    pauseMonitoring() {
        if (this.isMonitoring) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    resumeMonitoring() {
        if (this.isMonitoring && !this.monitoringInterval) {
            this.monitoringInterval = setInterval(() => {
                this.updateMetrics();
                this.updateUI();
            }, this.config.updateInterval);
        }
    }

    startFrameTracking() {
        let lastTime = performance.now();
        
        const trackFrame = () => {
            const now = performance.now();
            const delta = now - lastTime;
            
            this.metrics.frameCount++;
            this.metrics.fps = Math.round(1000 / delta);
            
            // Keep track of frame times
            this.metrics.frameHistory.push({
                timestamp: now,
                fps: this.metrics.fps
            });
            
            // Limit history length
            if (this.metrics.frameHistory.length > this.config.historyLength) {
                this.metrics.frameHistory.shift();
            }
            
            lastTime = now;
            
            if (this.isMonitoring) {
                requestAnimationFrame(trackFrame);
            }
        };
        
        requestAnimationFrame(trackFrame);
    }

    stopFrameTracking() {
        this.metrics.frameCount = 0;
        this.metrics.fps = 0;
        this.metrics.frameHistory = [];
    }

    updateMetrics() {
        // Update memory usage if available
        if (this.hasMemoryAPI) {
            const memory = performance.memory;
            this.metrics.memory = Math.round(
                (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
            );
            
            this.metrics.memoryHistory.push({
                timestamp: Date.now(),
                value: this.metrics.memory
            });
            
            if (this.metrics.memoryHistory.length > this.config.historyLength) {
                this.metrics.memoryHistory.shift();
            }
        }

        // Check for performance issues
        this.checkPerformanceIssues();
    }

    updateUI() {
        if (!this.isMonitoring) return;

        // Update FPS counter
        const fpsCounter = document.getElementById('fpsCounter');
        if (fpsCounter) {
            fpsCounter.textContent = this.metrics.fps;
            fpsCounter.style.color = this.metrics.fps < this.config.fpsTarget 
                ? 'var(--error-color)' 
                : 'inherit';
        }

        // Update memory usage
        const memoryUsage = document.getElementById('memoryUsage');
        if (memoryUsage && this.hasMemoryAPI) {
            const usedMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
            memoryUsage.textContent = usedMB;
            memoryUsage.style.color = this.metrics.memory > this.config.memoryThreshold
                ? 'var(--error-color)'
                : 'inherit';
        }
    }

    checkPerformanceIssues() {
        // Check FPS
        if (this.metrics.fps < this.config.fpsTarget) {
            console.warn(`Low FPS detected: ${this.metrics.fps}`);
        }

        // Check memory usage
        if (this.metrics.memory > this.config.memoryThreshold) {
            console.warn(`High memory usage: ${this.metrics.memory}%`);
        }

        // Check response times
        const avgResponseTime = this.getAverageResponseTime();
        if (avgResponseTime > this.config.responseTimeThreshold) {
            console.warn(`High average response time: ${avgResponseTime}ms`);
        }
    }

    // Performance marking and measuring
    mark(name) {
        if (this.hasPerformanceAPI) {
            const mark = `${name}_${Date.now()}`;
            performance.mark(mark);
            this.marks.set(name, mark);
        }
    }

    measure(name) {
        if (this.hasPerformanceAPI && this.marks.has(name)) {
            const startMark = this.marks.get(name);
            const measureName = `${name}_measure`;
            performance.measure(measureName, startMark);
            
            const duration = performance.getEntriesByName(measureName)[0].duration;
            
            // Clean up
            performance.clearMarks(startMark);
            performance.clearMeasures(measureName);
            
            return duration;
        }
        return null;
    }

    recordResponseTime(duration) {
        this.metrics.responseTimeHistory.push({
            timestamp: Date.now(),
            value: duration
        });
        
        if (this.metrics.responseTimeHistory.length > this.config.historyLength) {
            this.metrics.responseTimeHistory.shift();
        }
    }

    recordImageProcessingTime(duration) {
        this.metrics.imageProcessingTimes.push({
            timestamp: Date.now(),
            value: duration
        });
        
        if (this.metrics.imageProcessingTimes.length > this.config.historyLength) {
            this.metrics.imageProcessingTimes.shift();
        }
    }

    getAverageResponseTime() {
        if (this.metrics.responseTimeHistory.length === 0) return 0;
        
        const sum = this.metrics.responseTimeHistory.reduce(
            (acc, item) => acc + item.value, 
            0
        );
        return Math.round(sum / this.metrics.responseTimeHistory.length);
    }

    getAverageImageProcessingTime() {
        if (this.metrics.imageProcessingTimes.length === 0) return 0;
        
        const sum = this.metrics.imageProcessingTimes.reduce(
            (acc, item) => acc + item.value, 
            0
        );
        return Math.round(sum / this.metrics.imageProcessingTimes.length);
    }

    getPerformanceReport() {
        return {
            fps: {
                current: this.metrics.fps,
                average: this.getAverageFPS(),
                history: this.metrics.frameHistory
            },
            memory: {
                current: this.metrics.memory,
                history: this.metrics.memoryHistory
            },
            responseTimes: {
                average: this.getAverageResponseTime(),
                history: this.metrics.responseTimeHistory
            },
            imageProcessing: {
                average: this.getAverageImageProcessingTime(),
                history: this.metrics.imageProcessingTimes
            }
        };
    }

    getAverageFPS() {
        if (this.metrics.frameHistory.length === 0) return 0;
        
        const sum = this.metrics.frameHistory.reduce(
            (acc, item) => acc + item.fps, 
            0
        );
        return Math.round(sum / this.metrics.frameHistory.length);
    }

    clearMetrics() {
        this.metrics = {
            fps: 0,
            memory: 0,
            cpu: 0,
            lastFrameTime: 0,
            frameCount: 0,
            frameHistory: [],
            memoryHistory: [],
            responseTimeHistory: [],
            imageProcessingTimes: []
        };
    }
}

