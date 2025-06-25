/**
 * Shared configuration and constants for Artifact Desktop
 */

// Service configuration
const SERVICES = {
  OLLAMA: {
    HOST: '127.0.0.1',
    PORT: 11500,
    BASE_URL: 'http://127.0.0.1:11500',
    HEALTH_ENDPOINT: '/api/version',
    TIMEOUT: 8000
  },
  WEBCHAT: {
    HOST: '127.0.0.1',
    PORT: 9000,
    BASE_URL: 'http://127.0.0.1:9000',
    HEALTH_ENDPOINT: '/',
    TIMEOUT: 8000
  }
};

// Theme configuration
const THEME = {
  COLORS: {
    // AMOLED Black theme
    BACKGROUND_PRIMARY: '#000000',
    BACKGROUND_SECONDARY: '#0a0a0a',
    BACKGROUND_TERTIARY: '#1a1a1a',
    
    // White sharp lightweight text
    TEXT_PRIMARY: '#ffffff',
    TEXT_SECONDARY: '#e0e0e0',
    TEXT_MUTED: '#b0b0b0',
    
    // Accent colors (minimal usage)
    ACCENT_BLUE: '#00d2ff',
    ACCENT_GRADIENT: 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)',
    
    // Borders and dividers
    BORDER_PRIMARY: '#333333',
    BORDER_SECONDARY: '#222222',
    
    // Status colors
    SUCCESS: '#00ff88',
    WARNING: '#ffaa00',
    ERROR: '#ff4444',
    
    // Transparent overlays
    OVERLAY_LIGHT: 'rgba(255, 255, 255, 0.05)',
    OVERLAY_DARK: 'rgba(0, 0, 0, 0.5)'
  },
  
  TYPOGRAPHY: {
    FONT_FAMILY: "'Inter', 'Segoe UI', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
    FONT_MONO: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
    
    // Font weights - thin and slim focus
    WEIGHT_THIN: 100,
    WEIGHT_LIGHT: 300,
    WEIGHT_NORMAL: 400,
    WEIGHT_MEDIUM: 500,
    WEIGHT_SEMIBOLD: 600,
    
    // Font sizes
    SIZE_XS: '0.75rem',
    SIZE_SM: '0.875rem',
    SIZE_BASE: '1rem',
    SIZE_LG: '1.125rem',
    SIZE_XL: '1.25rem',
    SIZE_2XL: '1.5rem',
    SIZE_3XL: '1.875rem',
    SIZE_4XL: '2.25rem'
  },
  
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    XXL: '3rem'
  },
  
  ANIMATION: {
    DURATION_FAST: '0.15s',
    DURATION_NORMAL: '0.3s',
    DURATION_SLOW: '0.5s',
    EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

// Window configuration
const WINDOW_CONFIG = {
  DEFAULT_WIDTH: 1920,
  DEFAULT_HEIGHT: 1080,
  MIN_WIDTH: 1200,
  MIN_HEIGHT: 800,
  TITLE_BAR_HEIGHT: 30
};

// Application metadata
const APP_INFO = {
  NAME: 'Artifact Desktop',
  DESCRIPTION: 'Premium Development Environment',
  VERSION: '3.0.0',
  AUTHOR: 'Artifact Labs'
};

module.exports = {
  SERVICES,
  THEME,
  WINDOW_CONFIG,
  APP_INFO
};
