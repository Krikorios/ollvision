import EnhancedVisionChatApp from './modules/EnhancedVisionChatApp.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.app = new EnhancedVisionChatApp();
    
    // Log initialization
    console.log('🎉 Enhanced Vision Chat Pro loaded successfully!');
});

// Handle service worker registration for PWA support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}

// Handle unhandled errors
window.addEventListener('unhandledrejection', event => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.app) {
        window.app.notifications.show('❌ An unexpected error occurred', 'error');
    }
});

// Handle runtime errors
window.addEventListener('error', event => {
    console.error('Runtime error:', event.error);
    if (window.app) {
        window.app.notifications.show('❌ An unexpected error occurred', 'error');
    }
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.app) {
        if (document.hidden) {
            window.app.camera.pauseCapture();
        } else {
            window.app.camera.resumeCapture();
        }
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    if (window.app) {
        window.app.notifications.show('🌐 Connection restored', 'success');
        window.app.checkConnection();
    }
});

window.addEventListener('offline', () => {
    if (window.app) {
        window.app.notifications.show('📡 Connection lost', 'warning');
        window.app.setConnectionStatus('disconnected');
    }
});

// Handle before unload
window.addEventListener('beforeunload', () => {
    if (window.app) {
        window.app.settings.saveSettings();
    }
});

