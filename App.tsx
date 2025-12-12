import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RokuKey, AppConfig, CommandLog } from './types';
import { sendRokuCommand, executePowerOnMacro } from './services/rokuService';
import { parseNaturalLanguageCommand } from './services/geminiService';
import { RemoteButton } from './components/RemoteButton';
import { Settings } from './components/Settings';

const DEFAULT_CONFIG: AppConfig = {
  ipAddress: '192.168.1.X',
  enableHotkeys: true,
  simulationMode: true,
};

function App() {
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('roku-commander-config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [smartInput, setSmartInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Persist config
  useEffect(() => {
    localStorage.setItem('roku-commander-config', JSON.stringify(config));
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
      addLog(displayCommand, 'error', 'Network/Proxy Error');
    }
  }, [config]);

  const handlePowerMacro = useCallback(async () => {
    addLog('Macro', 'pending', 'Power On + HDMI 1');
    try {
       await executePowerOnMacro(config.ipAddress, config.simulationMode);
       addLog('Macro', 'success', 'Sequence Complete');
    } catch (e) {
       addLog('Macro', 'error', 'Sequence Failed');
    }
  }, [config]);

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
      addLog('AI Error', 'error', 'Failed to generate commands');
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

      // Global Hotkeys (Alt + Key)
      if (e.altKey && e.key === '1') {
          e.preventDefault();
          handlePowerMacro();
          return;
      }

      switch (e.key) {
        case 'p':
        case 'P':
          handleCommand(RokuKey.Power, 'Shortcut: Power');
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
  }, [config.enableHotkeys, handleCommand]);

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
          className="px-4 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 flex items-center gap-2 transition-colors text-zinc-300 hover:text-white shadow-lg"
        >
          <span className="material-symbols-rounded">settings</span>
          <span className="text-sm font-medium">Settings</span>
        </button>
      </header>

      <main className="w-full max-w-5xl flex flex-col md:flex-row gap-8 items-start z-10 mt-12 md:mt-0">
        
        {/* Remote Control Panel */}
        <div className="flex-1 w-full flex justify-center">
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-[3rem] p-6 shadow-2xl w-full max-w-[320px] relative">
            
            {/* Status Indicator */}
            <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full transition-colors duration-300 ${isProcessingAI ? 'bg-roku-accent animate-ping' : 'bg-zinc-800'}`} />

            <div className="flex justify-between items-center mb-10 px-2 mt-4">
               <RemoteButton 
                 icon="power_settings_new" 
                 variant="danger" 
                 onClick={() => handleCommand(RokuKey.Power)} 
                 className="shadow-red-900/20"
               />
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
              Powered by Gemini. Try complex sequences like "Turn volume up 3 times and pause".
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
                <span><kbd className="bg-zinc-800 px-1 rounded text-zinc-300">P</kbd> Power</span>
                <span><kbd className="bg-zinc-800 px-1 rounded text-zinc-300">M</kbd> Mute</span>
                <span><kbd className="bg-zinc-800 px-1 rounded text-zinc-300">Arrows</kbd> Navigate</span>
                <span><kbd className="bg-zinc-800 px-1 rounded text-zinc-300">Enter</kbd> Select</span>
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

export default App;