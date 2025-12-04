// config.js – central API base URL for the frontend
// Adjust the production URL as needed when deployed.
const API_BASE_URL = (function () {
    // If running on localhost (dev), use the local Flask server.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }
    // Production URL – replace with the actual Raindrop‑deployed backend URL.
    return 'https://citizen-hero-backend.raindrop.app';
})();
