// frontend/config.js
// Base URL for the backend API.
// Local dev uses localhost; Netlify uses your Vultr backend via sslip.io.

(function () {
  let baseUrl;

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Local dev
    baseUrl = 'http://127.0.0.1:5000';
  } else {
    // Production – Vultr backend with nginx + certbot
    baseUrl = 'https://140.82.9.200.sslip.io';
  }

  // Expose as a global for new_script.js
  window.API_BASE_URL = baseUrl;
})();