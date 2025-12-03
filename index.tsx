
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---
enum RokuKey {
  Power = 'Power',
  PowerOff = 'PowerOff',
  PowerOn = 'PowerOn',
  Home = 'Home',
  Rev = 'Rev',
  Fwd = 'Fwd',
  Play = 'Play',
  Select = 'Select',
  Left = 'Left',
  Right = 'Right',
  Down = 'Down',
  Up = 'Up',
  Back = 'Back',
  InstantReplay = 'InstantReplay',
  Info = 'Info',
  Backspace = 'Backspace',
  Search = 'Search',
  Enter = 'Enter',
  VolumeDown = 'VolumeDown',
  VolumeMute = 'VolumeMute',
  VolumeUp = 'VolumeUp',
  InputHDMI1 = 'InputHDMI1',
  InputHDMI2 = 'InputHDMI2',
  InputHDMI3 = 'InputHDMI3',
}

interface AppConfig {
  ipAddress: string;
  enableHotkeys: boolean;
  simulationMode: boolean;
}

interface CommandLog {
  id: string;
  timestamp: Date;
  command: string;
  status: 'pending' | 'success' | 'error' | 'simulated';
  details?: string;
}

interface SmartCommandResponse {
  commands: string[];
  explanation: string;
}

// --- SERVICES ---

// Roku Service
const sendRokuCommand = async (ip: string, key: string, isSimulation: boolean): Promise<void> => {
  if (isSimulation) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[SIMULATION] Sent ${key} to ${ip}`);
        resolve();
      }, 300); // Simulate network latency
    });
  }

  // Roku ECP: POST http://<ip>:8060/keypress/<key>
  const url = `http://${ip}:8060/keypress/${key}`;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      mode: 'no-cors', 
    });
    
    clearTimeout(id);
  } catch (error) {
    console.error('Failed to send command to Roku:', error);
    throw error;
  }
};

// Gemini Service
// Initialize Gemini Client with safety check for process.env
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
const ai = new GoogleGenAI({ apiKey: apiKey });

const parseNaturalLanguageCommand = async (prompt: string): Promise<SmartCommandResponse> => {
  try {
    const model = "gemini-2.5-flash";
    const systemInstruction = `
      You are an intelligent controller for a Roku TV. 
      Your job is to translate natural language user requests into a sequence of Roku ECP (External Control Protocol) keypress commands.

      Valid Roku Keys:
      Power, PowerOff, PowerOn, Home, Rev, Fwd, Play, Select, Left, Right, Down, Up, Back, 
      InstantReplay, Info, Backspace, Search, Enter, VolumeDown, VolumeMute, VolumeUp,
      InputHDMI1, InputHDMI2, InputHDMI3.

      If the user wants to open a specific app (like Netflix, YouTube), you cannot launch it directly by name in this mode, 
      so you should navigate to Home first. If the request is complex, break it down.
      
      Example: "Turn it up" -> ["VolumeUp", "VolumeUp", "VolumeUp"]
      Example: "Go home and mute" -> ["Home", "VolumeMute"]
      Example: "Switch to PlayStation" (assuming HDMI1) -> ["InputHDMI1"]
      Example: "Turn on and watch TV" -> ["PowerOn", "InputHDMI1"]
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            commands: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "The list of Roku key commands to execute in order."
            },
            explanation: {
              type: Type.STRING,
              description: "Brief explanation of what the sequence does."
            }
          },
          required: ["commands", "explanation"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    return JSON.parse(jsonText) as SmartCommandResponse;

  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
};

// --- COMPONENTS ---

// RemoteButton Component
interface RemoteButtonProps {
  label?: string;
  icon?: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger' | 'dpad' | 'success';
  className?: string;
  disabled?: boolean;
}

const RemoteButton: React.FC<RemoteButtonProps> = ({ 
  label, 
  icon, 
  onClick, 
  variant = 'default',
  className = '',
  disabled = false
}) => {
  const baseStyles = "relative flex items-center justify-center transition-all duration-100 active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none";
  
  const variants = {
    default: "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shadow-md rounded-2xl h-14 w-14",
    primary: "bg-roku-purple hover:bg-violet-600 text-white shadow-lg shadow-purple-900/30 rounded-full h-16 w-16",
    danger: "bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30 rounded-full h-12 w-12",
    success: "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/30 rounded-full h-14 w-14",
    dpad: "bg-zinc-700 hover:bg-zinc-600 text-white"
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      aria-label={label || icon}
    >
      {icon && <span className="material-symbols-rounded text-2xl">{icon}</span>}
      {label && !icon && <span className="font-semibold text-sm">{label}</span>}
    </button>
  );
};

// Settings Component
interface SettingsProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave, isOpen, onClose }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const isHttps = window.location.protocol === 'https:';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="material-symbols-rounded text-roku-accent">settings</span>
            Configuration
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="space-y-6">
          {/* Mixed Content Warning */}
          {isHttps && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 p-3 rounded-xl text-xs text-yellow-200/80">
              <strong className="block mb-1 text-yellow-200">Connection Warning</strong>
              You are running this app on HTTPS (Secure) but Roku TVs use HTTP. 
              Your browser may block these requests ("Mixed Content").
              <br/>
              <span className="opacity-70 mt-1 block">Fix: Click the lock icon in your address bar and allow "Insecure Content" or run the app locally.</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Roku IP Address
            </label>
            <input
              type="text"
              value={localConfig.ipAddress}
              onChange={(e) => setLocalConfig({ ...localConfig, ipAddress: e.target.value })}
              placeholder="e.g. 192.168.0.5"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-roku-purple focus:ring-1 focus:ring-roku-purple transition-all font-mono"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Find this in your Roku: Settings &gt; Network &gt; About.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
            <div>
              <p className="text-white font-medium">Keyboard Shortcuts</p>
              <p className="text-xs text-zinc-500">P (On+HDMI1), Shift+P (Off), M (Mute)</p>
            </div>
            <button
              onClick={() => setLocalConfig({ ...localConfig, enableHotkeys: !localConfig.enableHotkeys })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${localConfig.enableHotkeys ? 'bg-roku-purple' : 'bg-zinc-700'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localConfig.enableHotkeys ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
            <div>
              <p className="text-white font-medium">Simulation Mode</p>
              <p className="text-xs text-zinc-500">Test UI without real device (Bypasses CORS)</p>
            </div>
            <button
              onClick={() => setLocalConfig({ ...localConfig, simulationMode: !localConfig.simulationMode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${localConfig.simulationMode ? 'bg-green-600' : 'bg-zinc-700'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localConfig.simulationMode ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onSave(localConfig);
              onClose();
            }}
            className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-lg text-sm font-bold transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const DEFAULT_CONFIG: AppConfig = {
  ipAddress: '192.168.1.X',
  enableHotkeys: true,
  simulationMode: true,
};

function App() {
  const [config, setConfig] = useState<AppConfig>(() => {
    // Safety check for localStorage in some restricted environments
    try {
      const saved = localStorage.getItem('roku-commander-config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Persist config
  useEffect(() => {
    try {
      localStorage.setItem('roku-commander-config', JSON.stringify(config));
    } catch (e) {
      console.warn("Could not save to localStorage");
    }
  }, [config]);

  // Scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (command: string, status: CommandLog['status'], details?: string) => {
    const newLog: CommandLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      command,
      status,
      details,
    };
    setLogs(prev => [...prev.slice(-49), newLog]); // Keep last 50
  };

  const handleCommand = useCallback(async (key: string, name?: string) => {
    const displayCommand = name || key;
    
    // Check if IP is valid-ish before trying (unless simulation)
    if (!config.simulationMode && (config.ipAddress === '192.168.1.X' || !config.ipAddress)) {
      addLog(displayCommand, 'error', 'Missing IP Address');
      setIsSettingsOpen(true);
      return;
    }

    try {
      addLog(displayCommand, 'pending', 'Sending...');
      await sendRokuCommand(config.ipAddress, key, config.simulationMode);
      addLog(displayCommand, config.simulationMode ? 'simulated' : 'success');
    } catch (error) {
      addLog(displayCommand, 'error', 'Network Error / CORS / Mixed Content');
    }
  }, [config]);

  // Special macro for Power On + HDMI 1
  const handlePowerOnSequence = async () => {
    addLog('Macro', 'pending', 'Powering On + Switching to HDMI 1');
    
    try {
      // 1. Send Power On
      await handleCommand(RokuKey.PowerOn, 'Power On');
      
      // 2. Wait for TV to boot (4 seconds usually safe)
      // If simulation, we speed it up
      const delay = config.simulationMode ? 800 : 4000;
      addLog('Wait', 'pending', `Waiting ${delay/1000}s for TV boot...`);
      await new Promise(r => setTimeout(r, delay));
      
      // 3. Switch Input
      await handleCommand(RokuKey.InputHDMI1, 'Source: HDMI 1');
      addLog('Macro', 'success', 'TV Ready on HDMI 1');
    } catch (e) {
      addLog('Macro', 'error', 'Sequence interrupted');
    }
  };

  // AI Command Handler
  const handleSmartCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartInput.trim()) return;

    setIsProcessingAI(true);
    addLog('AI Request', 'pending', smartInput);

    try {
      const result = await parseNaturalLanguageCommand(smartInput);
      addLog('AI Analysis', 'success', result.explanation);
      
      // Execute sequence with slight delay between commands
      for (const cmd of result.commands) {
        await new Promise(r => setTimeout(r, 400));
        await handleCommand(cmd);
      }
      setSmartInput('');
    } catch (error) {
      addLog('AI Error', 'error', 'Failed (Check API Key?)');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (!config.enableHotkeys) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'p':
          // Lowercase p = Smart On
          handlePowerOnSequence();
          break;
        case 'P':
          // Uppercase P (Shift+p) = Power Off
          handleCommand(RokuKey.PowerOff, 'Power Off');
          break;
        case 'm':
        case 'M':
          handleCommand(RokuKey.VolumeMute, 'Shortcut: Mute');
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleCommand(RokuKey.Up);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleCommand(RokuKey.Down);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleCommand(RokuKey.Left);
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleCommand(RokuKey.Right);
          break;
        case 'Enter':
          e.preventDefault();
          handleCommand(RokuKey.Select);
          break;
        case 'Escape':
          handleCommand(RokuKey.Back);
          break;
        case 'h':
        case 'H':
          handleCommand(RokuKey.Home);
          break;
        case '+':
        case '=':
          handleCommand(RokuKey.VolumeUp);
          break;
        case '-':
        case '_':
          handleCommand(RokuKey.VolumeDown);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config.enableHotkeys, handleCommand, config.simulationMode]); // Added deps

  const needsSetup = !config.ipAddress || config.ipAddress === '192.168.1.X';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-roku-purple/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-roku-purple to-indigo-600 flex items-center justify-center shadow-lg shadow-roku-purple/20">
            <span className="material-symbols-rounded text-white text-lg">remote_gen</span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">Roku<span className="text-roku-accent">AI</span></h1>
        </div>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 rounded-full bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center transition-colors text-zinc-400 hover:text-white"
        >
          <span className="material-symbols-rounded">settings</span>
        </button>
      </header>

      {/* Setup Prompt */}
      {needsSetup && (
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="z-20 mt-16 md:mt-0 mb-4 bg-orange-500/10 border border-orange-500/50 text-orange-200 px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 backdrop-blur-md hover:bg-orange-500/20 transition-all animate-pulse"
        >
          <span className="material-symbols-rounded text-lg">link_off</span>
          Click here to connect your Roku TV
        </button>
      )}

      <main className="w-full max-w-5xl flex flex-col md:flex-row gap-8 items-start z-10 mt-4 md:mt-0">
        
        {/* Remote Control Panel */}
        <div className="flex-1 w-full flex justify-center">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-[3rem] p-6 shadow-2xl w-full max-w-[320px] relative">
            
            {/* Status Indicator */}
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-colors duration-300 ${isProcessingAI ? 'bg-roku-accent animate-ping' : 'bg-zinc-800'}`} />

            <div className="flex justify-between items-center mb-10 px-2 mt-4 gap-2">
               {/* Split Power Controls */}
               <div className="flex gap-2">
                 <RemoteButton 
                   icon="power_off" 
                   variant="danger" 
                   onClick={() => handleCommand(RokuKey.PowerOff, 'Power Off')}
                   className="w-12 h-14 rounded-2xl"
                   label=""
                 />
                 <RemoteButton 
                   icon="power_settings_new" 
                   variant="success" 
                   onClick={handlePowerOnSequence} 
                   className="w-16 h-14 rounded-2xl"
                   label="" 
                 />
               </div>
               
               <RemoteButton 
                 icon="home" 
                 onClick={() => handleCommand(RokuKey.Home)} 
               />
            </div>

            {/* D-PAD */}
            <div className="mb-10 relative h-48 w-48 mx-auto bg-zinc-800/50 rounded-full flex items-center justify-center border border-zinc-700/50 shadow-inner">
               <button 
                 onClick={() => handleCommand(RokuKey.Up)}
                 className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg active:scale-90 transition-all"
               >
                 <span className="material-symbols-rounded text-3xl">keyboard_arrow_up</span>
               </button>
               <button 
                 onClick={() => handleCommand(RokuKey.Down)}
                 className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg active:scale-90 transition-all"
               >
                 <span className="material-symbols-rounded text-3xl">keyboard_arrow_down</span>
               </button>
               <button 
                 onClick={() => handleCommand(RokuKey.Left)}
                 className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg active:scale-90 transition-all"
               >
                 <span className="material-symbols-rounded text-3xl">keyboard_arrow_left</span>
               </button>
               <button 
                 onClick={() => handleCommand(RokuKey.Right)}
                 className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg active:scale-90 transition-all"
               >
                 <span className="material-symbols-rounded text-3xl">keyboard_arrow_right</span>
               </button>
               
               <RemoteButton 
                 label="OK"
                 variant="primary"
                 onClick={() => handleCommand(RokuKey.Select)}
                 className="z-10 text-xl font-bold tracking-wider"
               />
            </div>

            {/* Playback Controls */}
            <div className="grid grid-cols-3 gap-4 mb-8">
               <RemoteButton icon="replay_10" onClick={() => handleCommand(RokuKey.InstantReplay)} className="rounded-xl h-12 w-auto" />
               <RemoteButton icon="keyboard_voice" onClick={() => {/* Voice search not implemented via ECP easily */}} disabled className="rounded-xl h-12 w-auto opacity-30" />
               <RemoteButton icon="info" onClick={() => handleCommand(RokuKey.Info)} className="rounded-xl h-12 w-auto" />
               
               <RemoteButton icon="fast_rewind" onClick={() => handleCommand(RokuKey.Rev)} className="rounded-xl h-12 w-auto" />
               <RemoteButton icon="play_pause" onClick={() => handleCommand(RokuKey.Play)} className="rounded-xl h-12 w-auto" />
               <RemoteButton icon="fast_forward" onClick={() => handleCommand(RokuKey.Fwd)} className="rounded-xl h-12 w-auto" />
            </div>

            {/* Volume */}
            <div className="flex gap-3 justify-center">
              <div className="flex flex-col gap-2 bg-zinc-800/50 p-2 rounded-2xl">
                <RemoteButton icon="add" onClick={() => handleCommand(RokuKey.VolumeUp)} className="h-12 w-12" />
                <RemoteButton icon="volume_off" onClick={() => handleCommand(RokuKey.VolumeMute)} className="h-12 w-12" />
                <RemoteButton icon="remove" onClick={() => handleCommand(RokuKey.VolumeDown)} className="h-12 w-12" />
              </div>
            </div>
            
            <button 
               onClick={() => handleCommand(RokuKey.Back)}
               className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <span className="material-symbols-rounded">arrow_back</span>
            </button>
          </div>
        </div>

        {/* Info Panel & Logs */}
        <div className="flex-1 w-full max-w-md flex flex-col gap-6 h-full md:h-[600px]">
          
          {/* AI Command Input */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-roku-accent to-transparent opacity-50" />
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded text-roku-accent">auto_awesome</span>
              Smart Command
            </h2>
            <form onSubmit={handleSmartCommand} className="relative">
              <input
                type="text"
                value={smartInput}
                onChange={(e) => setSmartInput(e.target.value)}
                placeholder="Type 'Mute and go Home'..."
                className="w-full bg-zinc-950/80 border border-zinc-700 rounded-xl pl-4 pr-12 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-roku-accent focus:ring-1 focus:ring-roku-accent transition-all"
                disabled={isProcessingAI}
              />
              <button 
                type="submit"
                disabled={isProcessingAI || !smartInput}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-zinc-800 hover:bg-roku-purple text-zinc-400 hover:text-white flex items-center justify-center transition-all disabled:opacity-50"
              >
                {isProcessingAI ? (
                  <span className="material-symbols-rounded text-lg animate-spin">refresh</span>
                ) : (
                  <span className="material-symbols-rounded text-lg">arrow_upward</span>
                )}
              </button>
            </form>
            <p className="text-xs text-zinc-500 mt-3">
              Powered by Gemini. Try "Switch to HDMI 1" or "Wake up the TV".
            </p>
          </div>

          {/* Activity Log */}
          <div className="flex-1 bg-zinc-950 border border-zinc-900 rounded-2xl p-4 overflow-hidden flex flex-col min-h-[300px]">
            <h3 className="text-sm font-medium text-zinc-400 mb-3 uppercase tracking-wider text-xs">Activity Log</h3>
            <div ref={logContainerRef} className="flex-1 overflow-y-auto space-y-2 pr-2 font-mono text-sm">
              {logs.length === 0 && (
                <div className="text-zinc-700 text-center mt-10 italic">No activity yet.</div>
              )}
              {logs.map((log) => (
                <div key={log.id} className="flex gap-3 text-xs border-l-2 border-zinc-800 pl-3 py-1">
                  <span className="text-zinc-600 shrink-0">
                    {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                  </span>
                  <div className="flex-1">
                    <span className="text-zinc-300 font-semibold">{log.command}</span>
                    {log.details && <span className="text-zinc-500 ml-2">- {log.details}</span>}
                  </div>
                  <span className={`
                    shrink-0 uppercase font-bold text-[10px] px-1.5 py-0.5 rounded
                    ${log.status === 'success' ? 'bg-green-900/30 text-green-400' : ''}
                    ${log.status === 'simulated' ? 'bg-blue-900/30 text-blue-400' : ''}
                    ${log.status === 'error' ? 'bg-red-900/30 text-red-400' : ''}
                    ${log.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' : ''}
                  `}>
                    {log.status === 'simulated' ? 'SIM' : log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shortcuts Hint */}
          <div className="bg-zinc-900/30 rounded-xl p-4 flex gap-4 text-xs text-zinc-500 border border-zinc-800/50">
            <div className="flex-1">
              <strong className="text-zinc-400 block mb-1">Hotkeys (when enabled)</strong>
              <div className="grid grid-cols-2 gap-y-1">
                <span><kbd className="bg-zinc-800 px-1 rounded text-zinc-300">P</kbd> Smart On (HDMI1)</span>
                <span><kbd className="bg-zinc-800 px-1 rounded text-zinc-300">Shift+P</kbd> Power Off</span>
                <span><kbd className="bg-zinc-800 px-1 rounded text-zinc-300">Arrows</kbd> Navigate</span>
                <span><kbd className="bg-zinc-800 px-1 rounded text-zinc-300">M</kbd> Mute</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={setConfig}
      />
    </div>
  );
}

// --- RENDER ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
