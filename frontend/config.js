// config.js – central API base URL for the frontend
// Adjust the production URL as needed when deployed.
export function getApiBaseUrl() {
  if (window.location.hostname.includes('localhost')) {
    return 'http://127.0.0.1:5000';
  }
  // Vultr backend
  return 'https://140.82.9.200.sslip.io';
}
