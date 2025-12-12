# Roku AI Commander

**Roku AI Commander** is a smart, AI-powered remote control for your Roku TV or device. It runs directly on your computer and allows you to control your TV using natural language commands (e.g., "Turn it up and open YouTube") or a virtual on-screen remote.

## 🚀 Quick Start (Standalone Mode)

The easiest way to use the remote without running a command-line server every time.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Set API Key:**
    Open `.env.local` and paste your [Google Gemini API Key](https://aistudio.google.com/app/apikey).
    ```env
    GEMINI_API_KEY=your_actual_key_here
    ```
3.  **Build the App:**
    This bakes your API key into the secure local application.
    ```bash
    npm run build
    ```
4.  **Launch:**
    Double-click **`Launch-Remote.bat`** in this folder.
    *   Opens a clean, native-looking window.
    *   Connects directly to your Roku (bypassing CORS).
    *   **Settings:** Click the Settings gear (top-right) to enter your Roku's IP address and disable "Simulation Mode".

## ✨ Features

*   **🧠 AI Smart Commands:** Type natural requests like *"Mute and go Home"* or *"Turn volume up 5 times"*. Powered by Google Gemini 2.5 Flash.
*   **🎮 Virtual Remote:** Full D-pad, playback controls, and volume management.
*   **⌨️ Keyboard Shortcuts:**
    *   `Arrow Keys`: Navigate menus
    *   `Enter`: Select
    *   `Esc`: Back
    *   `P`: Power Toggle
    *   `M`: Mute
    *   `+ / -`: Volume
*   **⚡ Fast Macro Execution:** Complex sequences are executed automatically.
*   **🖥️ Local Control:** No external servers required. Runs entirely on your machine.

## 🛠️ Development

If you want to modify the code or run in development mode:

```bash
npm run dev
```
*   Starts the frontend at `http://localhost:3000`
*   Starts a backend proxy at `http://localhost:3001` (to handle CORS during dev)

## ❓ Troubleshooting

*   **Black Screen?** Ensure you ran `npm run build` after any changes.
*   **"Network Error"?** Make sure your Roku IP is correct in Settings and you are on the same Wi-Fi network.
*   **AI Not Working?** Verify your API Key in `.env.local` and run `npm run build` again to update the application.