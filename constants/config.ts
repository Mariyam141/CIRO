// Backend URL — must point to a running CIRO backend instance.
//
// For local WiFi testing (Expo Go on phone + laptop on same network):
//   Run `ipconfig` on Windows → find IPv4 Address → set BASE_URL = "http://<YOUR_IP>:8000"
//
// For demo without phone (Expo web or Android emulator):
//   BASE_URL = "http://localhost:8000"  (emulator uses 10.0.2.2 instead of localhost)
//
// For public tunnel (localtunnel / ngrok):
//   npx localtunnel --port 8000  → copy the URL here
export const BASE_URL = "https://my-backend-928152278734.us-central1.run.app";

export const DEMO_DELAY = 1500;
