const path = require("path");
const { app, BrowserWindow, ipcMain, nativeTheme, clipboard } = require("electron");
const { spawn } = require("child_process");
const readline = require("readline");
const dotenv = require("dotenv");

dotenv.config({
  path: path.resolve(__dirname, "..", ".env"),
});

const {
  initFirebase,
  isEnabled: isFirebaseEnabled,
  storeTranscription,
} = require("./services/firebase");

let mainWindow = null;
let pythonProcess = null;
let stdoutInterface = null;
let isReady = false;

const broadcast = (channel, payload) => {
  if (mainWindow?.webContents) {
    mainWindow.webContents.send(channel, payload);
  }
};

const startPythonProcess = () => {
  if (pythonProcess) {
    return;
  }

  const pythonExecutable = process.env.PYTHON_PATH || "python3";
  const scriptPath = path.resolve(
    __dirname,
    "..",
    "..",
    "python-backend",
    "translator_service.py"
  );

  pythonProcess = spawn(pythonExecutable, [scriptPath], {
    cwd: path.resolve(__dirname, "..", ".."),
    stdio: ["ignore", "pipe", "pipe"],
  });

  pythonProcess.on("error", (error) => {
    console.error("[python] Failed to spawn process:", error.message);
    broadcast("translator:event", {
      type: "error",
      message: error.message,
    });
  });

  stdoutInterface = readline.createInterface({
    input: pythonProcess.stdout,
  });

  stdoutInterface.on("line", async (line) => {
    if (!line.trim()) return;

    try {
      const event = JSON.parse(line);
      if (event.type === "transcription") {
        broadcast("translator:event", event);
        if (isFirebaseEnabled()) {
          await storeTranscription(event);
        }
      } else if (event.type === "status") {
        isReady = event.status === "ready";
        broadcast("translator:event", event);
      } else if (event.type === "error") {
        console.error("[python]", event.message);
        broadcast("translator:event", event);
      }
    } catch (error) {
      console.error("[python] Failed to parse message:", line);
    }
  });

  pythonProcess.stderr.on("data", (chunk) => {
    const message = chunk.toString();
    console.error("[python:stderr]", message.trim());
  });

  pythonProcess.on("exit", (code, signal) => {
    broadcast("translator:event", {
      type: "status",
      status: "stopped",
      code,
      signal,
    });
    cleanupPythonProcess();
  });
};

const cleanupPythonProcess = () => {
  if (stdoutInterface) {
    stdoutInterface.removeAllListeners();
    stdoutInterface.close();
    stdoutInterface = null;
  }

  if (pythonProcess) {
    pythonProcess.removeAllListeners();
    pythonProcess = null;
  }
};

const stopPythonProcess = () => {
  if (!pythonProcess) {
    return;
  }

  pythonProcess.kill("SIGTERM");
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 260,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  app.dock?.show?.();
  nativeTheme.themeSource = "dark";
  initFirebase();
  createWindow();
  startPythonProcess();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  stopPythonProcess();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle("translator:control", async (_event, command) => {
  if (command === "start") {
    startPythonProcess();
    return { ok: true };
  }

  if (command === "stop") {
    stopPythonProcess();
    return { ok: true };
  }

  if (command === "status") {
    return {
      ok: true,
      running: Boolean(pythonProcess),
      ready: isReady,
      firebase: isFirebaseEnabled(),
    };
  }

  return { ok: false, message: "Unknown command" };
});

ipcMain.handle("translator:clipboard", (_event, text) => {
  try {
    clipboard.writeText(String(text ?? ""));
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error.message };
  }
});
