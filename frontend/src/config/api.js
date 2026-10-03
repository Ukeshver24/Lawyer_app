// Centralized Universal API Configuration for Digi Law Reporter
// Automatically adapts to localhost, local LAN Wi-Fi (Mac/iPhone/Android), and Live Production domains

const getApiBaseUrl = () => {
  // 1. Explicit environment variable override
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 2. Client-side browser runtime dynamic detection
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;

    // Production / Live Deployed Domain (e.g., https://digilaw.com or custom domain)
    if (import.meta.env.PROD && port !== '5173' && port !== '5174') {
      return `${protocol}//${hostname}${port ? `:${port}` : ''}/api`;
    }

    // Local Development / LAN Access from Mac, iOS, Android, or Windows
    // If accessing via http://192.168.x.x:5173 or hostname, route to backend on port 5000 of the same host
    const backendPort = '5000';
    return `${protocol}//${hostname}:${backendPort}/api`;
  }

  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
