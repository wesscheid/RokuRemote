import { RokuKey } from '../types.ts';

export const sendRokuCommand = async (ip: string, key: string, isSimulation: boolean): Promise<void> => {
  if (isSimulation) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[SIMULATION] Sent ${key} to ${ip}`);
        resolve();
      }, 300); // Simulate network latency
    });
  }

  // Roku ECP: POST http://<ip>:8060/keypress/<key>
  // Note: Standard browsers will block this with CORS unless the user has an extension or proxy.
  const url = `http://${ip}:8060/keypress/${key}`;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      // mode: 'no-cors' is often required for local devices that don't send headers,
      // but it makes error handling opaque (always status 0).
      mode: 'no-cors', 
    });
    
    clearTimeout(id);
    
    // With no-cors, we can't check response.ok. We assume success if no network error thrown.
  } catch (error) {
    console.error('Failed to send command to Roku:', error);
    throw error;
  }
};