// Fikisha Integration Configuration
export const FIKISHA_CONFIG = {
  // API URL for Fikisha delivery website
  API_URL: process.env.REACT_APP_FIKISHA_API_URL || 'http://localhost:3001/api',
  
  // API Key for authentication (optional)
  API_KEY: process.env.REACT_APP_FIKISHA_API_KEY || 'your-api-key',
  
  // Enable/disable integration
  ENABLED: process.env.REACT_APP_FIKISHA_ENABLED !== 'false',
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // milliseconds
};


