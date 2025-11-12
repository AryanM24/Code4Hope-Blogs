const transcriptEl = document.getElementById("transcript");
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggle-btn");
const copyBtn = document.getElementById("copy-btn");
const closeBtn = document.getElementById("close-btn");
const firebaseIndicator = document.getElementById("firebase-indicator");
const bubbleEl = document.querySelector(".bubble");

let transcript = "";
let running = true;

const setStatus = (message, variant) => {
  statusEl.textContent = message;
  statusEl.classList.remove("ready", "error");
  if (variant) {
    statusEl.classList.add(variant);
  }
};

const setFirebaseState = (online) => {
  const dot = firebaseIndicator.querySelector(".dot");
  const label = firebaseIndicator.querySelector(".label");

  dot.classList.toggle("online", online);
  dot.classList.toggle("offline", !online);
  label.textContent = online ? "Firebase online" : "Firebase offline";
};

const updateTranscript = (value) => {
  transcript = value;
  transcriptEl.textContent = transcript || "Waiting for sign input…";
  bubbleEl.classList.remove("fade-in");
  void bubbleEl.offsetWidth; // restart animation
  bubbleEl.classList.add("fade-in");
};

const refreshStatus = async () => {
  const response = await window.translator.control("status");
  if (!response.ok) return;

  running = response.running;
  toggleBtn.textContent = running ? "Pause" : "Resume";
  setStatus(response.ready ? "Listening for signs…" : "Starting recognizer…", response.ready ? "ready" : null);
  setFirebaseState(Boolean(response.firebase));
};

window.translator.onEvent((event) => {
  if (event.type === "status") {
    if (event.status === "ready") {
      setStatus("Listening for signs…", "ready");
    } else if (event.status === "stopped") {
      setStatus("Recognizer stopped", null);
      running = false;
      toggleBtn.textContent = "Resume";
    }
  } else if (event.type === "transcription") {
    updateTranscript(event.full);
    setStatus(`Recognized: ${event.word}`, "ready");
  } else if (event.type === "error") {
    setStatus(event.message || "Unexpected error", "error");
  }
});

toggleBtn.addEventListener("click", async () => {
  toggleBtn.disabled = true;
  try {
    if (running) {
      await window.translator.control("stop");
      running = false;
      toggleBtn.textContent = "Resume";
      setStatus("Recognizer paused", null);
    } else {
      await window.translator.control("start");
      running = true;
      toggleBtn.textContent = "Pause";
      setStatus("Starting recognizer…", null);
    }
  } finally {
    toggleBtn.disabled = false;
  }
});

copyBtn.addEventListener("click", async () => {
  if (!transcript) return;
  const response = await window.translator.copyToClipboard(transcript);
  if (response?.ok) {
    setStatus("Transcript copied to clipboard", "ready");
  } else {
    setStatus("Clipboard unavailable", "error");
  }
});

closeBtn.addEventListener("click", () => {
  window.close();
});

refreshStatus();
