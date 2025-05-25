/**
 * Camera Manager Module
 * Handles camera initialization, video capture, and related functionality
 */

export default class CameraManager {
    constructor(app) {
        this.app = app;
        this.stream = null;
        this.captureInterval = null;
        this.lastMotionDetection = 0;
        this.motionThreshold = 30;
        this.isCapturePaused = false;

        // Camera constraints
        this.constraints = {
            video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            }
        };
    }

    async initialize() {
        try {
            // Set initial camera source
            this.constraints.video.facingMode = this.app.getConfig('cameraSource');
            
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia(this.constraints);
            this.handleStreamSuccess(stream);
            
            // Add camera switch capability check
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasMultipleCameras = devices.filter(device => device.kind === 'videoinput').length > 1;
            
            if (hasMultipleCameras) {
                this.app.setState('hasMultipleCameras', true);
            }

            this.app.notifications.show('📹 Camera connected successfully', 'success');
            return true;
            
        } catch (error) {
            console.error('Camera initialization failed:', error);
            this.app.notifications.show('❌ Camera access failed: ' + this.getErrorMessage(error), 'error');
            return false;
        }
    }

    handleStreamSuccess(stream) {
        this.stream = stream;
        this.app.video.srcObject = stream;
        
        // Setup video metadata handling
        this.app.video.addEventListener('loadedmetadata', () => {
            this.setupCanvas();
            console.log(`Camera initialized: ${this.app.video.videoWidth}x${this.app.video.videoHeight}`);
        });
    }

    setupCanvas() {
        // Set canvas dimensions to match video
        this.app.canvas.width = this.app.video.videoWidth;
        this.app.canvas.height = this.app.video.videoHeight;
    }

    captureFrame() {
        if (!this.isVideoReady()) return null;

        try {
            // Draw current video frame to canvas
            this.app.ctx.drawImage(
                this.app.video,
                0, 0,
                this.app.canvas.width,
                this.app.canvas.height
            );

            // Convert to JPEG with configured quality
            const imageData = this.app.canvas.toDataURL(
                'image/jpeg',
                this.app.getConfig('imageQuality')
            );

            // Update state
            this.app.setState('currentImageData', imageData.split(',')[1]);
            this.app.setState('lastCaptureTime', Date.now());
            this.app.setState('imageCount', this.app.getState('imageCount') + 1);

            return imageData.split(',')[1];

        } catch (error) {
            console.error('Frame capture failed:', error);
            this.app.notifications.show('❌ Frame capture failed', 'error');
            return null;
        }
    }

    startAutoCapture() {
        if (this.captureInterval) {
            this.stopAutoCapture();
        }

        const interval = parseInt(this.app.settings.get('captureInterval')) * 1000;
        
        this.captureInterval = setInterval(() => {
            if (!this.isCapturePaused && this.shouldCapture()) {
                this.captureFrame();
            }
        }, interval);

        // Capture first frame immediately
        this.captureFrame();

        // Update UI
        this.app.ui.updateCaptureButton(true);
        this.app.notifications.show('▶️ Auto-capture started');
    }

    stopAutoCapture() {
        if (this.captureInterval) {
            clearInterval(this.captureInterval);
            this.captureInterval = null;
            
            // Update UI
            this.app.ui.updateCaptureButton(false);
            this.app.notifications.show('⏸️ Auto-capture stopped');
        }
    }

    pauseCapture() {
        this.isCapturePaused = true;
    }

    resumeCapture() {
        this.isCapturePaused = false;
        if (this.app.settings.get('autoCapture')) {
            this.captureFrame(); // Capture immediate frame on resume
        }
    }

    async switchCamera() {
        if (!this.stream) return;

        // Toggle facing mode
        const currentMode = this.app.getConfig('cameraSource');
        const newMode = currentMode === 'user' ? 'environment' : 'user';
        
        // Stop current stream
        this.stream.getTracks().forEach(track => track.stop());
        
        // Update constraints
        this.constraints.video.facingMode = newMode;
        
        try {
            // Get new stream
            const newStream = await navigator.mediaDevices.getUserMedia(this.constraints);
            this.handleStreamSuccess(newStream);
            
            // Update config
            this.app.setConfig('cameraSource', newMode);
            
            this.app.notifications.show('🔄 Camera switched successfully');
            
        } catch (error) {
            console.error('Camera switch failed:', error);
            this.app.notifications.show('❌ Camera switch failed', 'error');
            
            // Try to revert to previous camera
            this.constraints.video.facingMode = currentMode;
            const revertStream = await navigator.mediaDevices.getUserMedia(this.constraints);
            this.handleStreamSuccess(revertStream);
        }
    }

    showImagePreview() {
        const imageData = this.app.getState('currentImageData');
        if (!imageData) return;

        const preview = document.getElementById('imagePreview');
        const img = document.getElementById('previewImg');
        
        img.src = 'data:image/jpeg;base64,' + imageData;
        preview.classList.add('show');
        
        // Hide preview after delay
        setTimeout(() => {
            preview.classList.remove('show');
        }, 4000);
    }

    shouldCapture() {
        if (!this.app.settings.get('smartDetection')) {
            return true;
        }

        // Implement motion detection logic
        const motionDetected = this.detectMotion();
        const timeSinceLastDetection = Date.now() - this.lastMotionDetection;

        return motionDetected || timeSinceLastDetection > 5000;
    }

    detectMotion() {
        if (!this.isVideoReady()) return false;

        try {
            const currentFrame = this.app.ctx.getImageData(
                0, 0,
                this.app.canvas.width,
                this.app.canvas.height
            );

            if (!this.previousFrame) {
                this.previousFrame = currentFrame;
                return false;
            }

            const diff = this.calculateFrameDifference(currentFrame, this.previousFrame);
            this.previousFrame = currentFrame;

            if (diff > this.motionThreshold) {
                this.lastMotionDetection = Date.now();
                return true;
            }

            return false;

        } catch (error) {
            console.error('Motion detection failed:', error);
            return false;
        }
    }

    calculateFrameDifference(frame1, frame2) {
        const data1 = frame1.data;
        const data2 = frame2.data;
        let diff = 0;

        // Sample pixels for performance
        for (let i = 0; i < data1.length; i += 40) {
            diff += Math.abs(data1[i] - data2[i]);
        }

        return diff / data1.length;
    }

    isVideoReady() {
        return this.app.video &&
               this.app.video.videoWidth &&
               this.app.video.videoHeight &&
               !this.app.video.paused;
    }

    cleanup() {
        this.stopAutoCapture();
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }

    getErrorMessage(error) {
        switch(error.name) {
            case 'NotAllowedError':
                return 'Camera permission denied. Please allow camera access.';
            case 'NotFoundError':
                return 'No camera found. Please connect a camera and try again.';
            case 'NotReadableError':
                return 'Camera is in use by another application.';
            default:
                return error.message || 'Unknown camera error occurred.';
        }
    }
}

