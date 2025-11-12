const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("translator", {
  control: (command) => ipcRenderer.invoke("translator:control", command),
  copyToClipboard: (text) => ipcRenderer.invoke("translator:clipboard", text),
  onEvent: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("translator:event", listener);
    return () => {
      ipcRenderer.removeListener("translator:event", listener);
    };
  },
});
