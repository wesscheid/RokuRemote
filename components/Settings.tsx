import React, { useState } from 'react';
import { AppConfig } from '../types';

interface SettingsProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ config, onSave, isOpen, onClose }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);

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
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Roku IP Address
            </label>
            <input
              type="text"
              value={localConfig.ipAddress}
              onChange={(e) => setLocalConfig({ ...localConfig, ipAddress: e.target.value })}
              placeholder="e.g. 192.168.1.15"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-roku-purple focus:ring-1 focus:ring-roku-purple transition-all font-mono"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Find this in your Roku: Settings &gt; Network &gt; About.
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
            <div>
              <p className="text-white font-medium">Keyboard Shortcuts</p>
              <p className="text-xs text-zinc-500">Press keys to control TV (P, M, Arrows)</p>
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