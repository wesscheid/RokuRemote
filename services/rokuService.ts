import { RokuKey } from '../types';

// Helper to check for WebView2 context
const isWebView = () => (window as any).chrome?.webview !== undefined;

export const sendRokuCommand = async (ip: string, key: string, isSimulation: boolean): Promise<void> => {
  if (isSimulation) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[SIMULATION] Sent ${key} to ${ip}`);
        resolve();
      }, 300); // Simulate network latency
    });
  }

  // WebView2 Bridge Mode (Native Shell)
  if (isWebView()) {
    (window as any).chrome.webview.postMessage({
      type: 'keypress',
      ip,
      key
    });
    return Promise.resolve();
  }

  // Chrome App Mode / Browser Mode with --disable-web-security: Direct to Roku
  try {
    const rokuUrl = `http://${ip}:8060/keypress/${key}`;
    const response = await fetch(rokuUrl, {
      method: 'POST',
      // For ECP keypress, body and specific headers are typically not needed.
      // fetch will handle content type if body is present, but for keypress, it's usually empty.
    });
    
    if (!response.ok) {
        // ECP often responds with 200 even if TV is off.
        // This 'ok' check is more for actual network failures.
        console.warn(`Roku ECP keypress ${key} response not OK: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Failed to send command directly to Roku:', error);
    throw error;
  }
};

export const executePowerOnMacro = async (ip: string, isSimulation: boolean): Promise<void> => {
    if (isSimulation) {
        console.log(`[SIMULATION] Executing Power On + HDMI1 Macro`);
        return;
    }

    // WebView2 Bridge Mode
    if (isWebView()) {
        (window as any).chrome.webview.postMessage({
          type: 'macro',
          name: 'power-on-hdmi1',
          ip
        });
        return Promise.resolve();
    }

    // Chrome App Mode / Browser Mode: Direct to Roku with delays for macro
    try {
        // 1. Send PowerOn
        await fetch(`http://${ip}:8060/keypress/PowerOn`, { method: 'POST' });
        
        // 2. Wait for TV to wake up (Roku TVs can take a few seconds)
        await new Promise(r => setTimeout(r, 3000));

        // 3. Switch to HDMI 1
        await fetch(`http://${ip}:8060/launch/tvinput.hdmi1`, { method: 'POST' });

        // Check if !response.ok if desired, but ECP is often fire-and-forget
    } catch (error) {
        console.error('Power Macro failed:', error);
        throw error;
    }
};