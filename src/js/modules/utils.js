/**
 * Utility Functions Module
 * Provides common utility functions used throughout the application
 */

// Timing Functions
export const debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

export const throttle = (func, limit = 300) => {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// UUID Generation
export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Data Formatting
export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatDuration = (ms) => {
    if (ms < 1000) return ms + 'ms';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
};

export const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
};

// Data Validation
export const isValidUrl = (string) => {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
};

export const isValidJSON = (str) => {
    try {
        JSON.parse(str);
        return true;
    } catch (_) {
        return false;
    }
};

export const isBase64Image = (str) => {
    if (!str?.startsWith('data:image/')) return false;
    try {
        return btoa(atob(str.split(',')[1])) === str.split(',')[1];
    } catch (_) {
        return false;
    }
};

// DOM Utilities
export const createElement = (tag, attributes = {}, children = []) => {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });
    
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    
    return element;
};

export const removeElement = (element) => {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
};

// Array and Object Utilities
export const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (obj instanceof Object) {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, deepClone(value)])
        );
    }
    return obj;
};

export const deepMerge = (target, ...sources) => {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }
    
    return deepMerge(target, ...sources);
};

// Type Checking
export const isObject = (item) => {
    return item && typeof item === 'object' && !Array.isArray(item);
};

// Browser and Device Detection
export const getBrowserInfo = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';
    
    // Browser detection
    if (ua.includes('Firefox/')) {
        browser = 'Firefox';
        version = ua.split('Firefox/')[1];
    } else if (ua.includes('Chrome/')) {
        browser = 'Chrome';
        version = ua.split('Chrome/')[1].split(' ')[0];
    } else if (ua.includes('Safari/')) {
        browser = 'Safari';
        version = ua.split('Version/')[1].split(' ')[0];
    } else if (ua.includes('Edge/')) {
        browser = 'Edge';
        version = ua.split('Edge/')[1];
    }
    
    return { browser, version };
};

export const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        return 'mobile';
    }
    return 'desktop';
};

// Error Handling
export const handleError = (error, context = '') => {
    console.error(`Error in ${context}:`, error);
    
    if (error instanceof TypeError) {
        return 'A type error occurred. Please check your input.';
    }
    if (error instanceof ReferenceError) {
        return 'A reference error occurred. Please try again.';
    }
    if (error instanceof NetworkError) {
        return 'A network error occurred. Please check your connection.';
    }
    
    return error.message || 'An unknown error occurred.';
};

// Local Storage Utilities
export const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// Color Utilities
export const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

export const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};

// Performance Utilities
export const measureExecutionTime = async (callback) => {
    const start = performance.now();
    const result = await callback();
    const end = performance.now();
    return {
        result,
        duration: end - start
    };
};

// String Utilities
export const truncate = (str, length, suffix = '...') => {
    if (str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
};

export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

export const slugify = (str) => {
    return str
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

