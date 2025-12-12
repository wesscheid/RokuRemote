export enum RokuKey {
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
}

export interface AppConfig {
  ipAddress: string;
  enableHotkeys: boolean;
  simulationMode: boolean;
}

export interface CommandLog {
  id: string;
  timestamp: Date;
  command: string;
  status: 'pending' | 'success' | 'error' | 'simulated';
  details?: string;
}

export interface SmartCommandResponse {
  commands: string[];
  explanation: string;
}