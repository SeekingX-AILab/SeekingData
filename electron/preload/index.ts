import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  send: (channel: string, data: unknown) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel: string, func: (...args: unknown[]) => void) => {
    const subscription = (_event: unknown, ...args: unknown[]) =>
      func(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  invoke: (channel: string, data?: unknown) => {
    return ipcRenderer.invoke(channel, data);
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  } catch (error) {
    console.error(error);
  }
} else {
  (window as unknown as Record<string, unknown>).electronAPI = electronAPI;
}
