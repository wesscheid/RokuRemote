# Roku AI Commander

## Project Overview

**Roku AI Commander** is a modern React-based web application that acts as a smart remote control for Roku devices. It leverages **Google's Gemini 2.5 Flash** model to interpret natural language voice/text commands and translate them into sequences of Roku External Control Protocol (ECP) actions.

For example, a user can type *"Turn the volume up 5 times and go to the home screen"*, and the application will intelligently parse this into the corresponding sequence of Roku keypresses (`VolumeUp` x5, `Home`).

## Tech Stack

*   **Framework**: React 19 (via Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
*   **Communication**: Direct Roku ECP (External Control Protocol) via Chrome App Mode

## Setup & Running

### Prerequisites
*   Node.js (v18+ recommended) for building the project.
*   A physical Roku device (TV/Stick) connected to the same local network.
*   A Google Gemini API Key.

### Installation

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment:**
    Create a `.env.local` file in the root directory and add your API key:
    ```env
    GEMINI_API_KEY=your_actual_api_key_here
    ```

3.  **Build the Project:**
    Crucial step! The API key is baked into the app during the build.
    ```bash
    npm run build
    ```

### Running the App

#### Option 1: Standalone Launcher (Recommended)
Double-click the **`Launch-Remote.bat`** file in the project root.
*   Opens the remote as a dedicated, native-looking window.
*   **No backend server required.**
*   Automatically bypasses CORS restrictions using Chrome's `--disable-web-security` flag, allowing direct control of your Roku on the local network.

#### Option 2: Development Mode
Run `npm run dev` to start the frontend and a local proxy server (useful for development).
*   URL: `http://localhost:3000`

## Key Features

### 1. Smart AI Commands
Located in `services/geminiService.ts`.
*   Uses `gemini-2.5-flash` to parse natural language.
*   System instructions define valid Roku ECP keys and logic (e.g., navigating Home before launching apps).
*   Returns a JSON sequence of commands executed by the client.

### 2. Virtual Remote Interface
Located in `components/RemoteButton.tsx` and `App.tsx`.
*   Provides a standard D-pad, playback controls, and volume management.
*   Visual feedback for command execution.
*   **Settings Panel**: Configure Target IP and Simulation Mode.

### 3. Keyboard Hotkeys
*   `Arrow Keys`: Navigation
*   `Enter`: Select
*   `Esc`: Back
*   `P`: Power
*   `M`: Mute
*   `+/-`: Volume Control

### 4. Simulation Mode
*   Allows testing UI and AI flows without a physical Roku device.
*   Enabled by default until configured otherwise in Settings.

## Architecture & Code Structure

*   **`App.tsx`**: Main entry point. Manages application state (`config`, `logs`, `smartInput`), handles hotkeys, and orchestrates command execution.
*   **`services/rokuService.ts`**: Handles communication with the Roku device.
    *   **Hybrid Mode**: Detects if running in "Chrome App Mode" (via `fetch` success/fail patterns or explicit flags) to send requests directly to `http://<ROKU_IP>:8060`.
    *   **Fallback**: Supports a local proxy (`/api/...`) if running in standard web mode.
*   **`services/geminiService.ts`**: Encapsulates the interaction with the Gemini API.
*   **`Launch-Remote.bat`**: Windows batch script that launches the compiled `dist/index.html` in a Chrome window with specific flags (`--app`, `--disable-web-security`) to enable local device control without a backend.

## Configuration

Settings are persisted in the browser's `localStorage` under the key `roku-commander-config`.
*   **Target IP**: The local IP address of the Roku device (e.g., `192.168.1.50`).
*   **Simulation Mode**: Toggle to mock network calls.

## Development Notes

*   **CORS Strategy**: The project uses a "Launcher" approach that runs Chrome with security flags disabled (`--disable-web-security`) for the specific remote control window. This allows the local file (`file://`) to send POST requests to the local Roku IP (`http://192.168.x.x`) without being blocked by standard browser CORS policies.