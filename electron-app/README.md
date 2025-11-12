## Sign Language Overlay

Transparent Electron overlay that shows live transcriptions of a webcam-based sign language recogniser. The UI pulls inspiration from the Cluely sales assistant mock-up (sans chat capability) and streams recognised words into a glassmorphic bubble. A Python + OpenCV backend performs gesture classification and the Electron main process can persist transcripts to Firebase.

### Features
- Always-on-top translucent window with drag handle, pause/resume, copy, and close controls.
- Python backend using MediaPipe Hands and OpenCV with lightweight gesture heuristics for `HELLO`, `YES`, `NO`, `GOOD`, and `ILY`.
- Streaming updates from Python to Electron using JSON lines over stdout.
- Optional Firebase persistence via the Admin SDK and a Firestore collection.

### Prerequisites
- Node.js v18+ (Electron 31 runtime).
- Python 3.9+ with access to a webcam.
- Firebase service account JSON (optional, only if you want to store transcripts).

### Setup
1. Install Node dependencies for the Electron shell:
   ```bash
   cd electron-app
   npm install
   ```

2. Install Python dependencies for the translator service:
   ```bash
   cd ../python-backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. Copy the sample environment file and adjust paths:
   ```bash
   cd ../electron-app
   cp .env.example .env
   ```
   - `PYTHON_PATH` (optional) points to the Python executable you want Electron to spawn (`python3` by default).
   - Set either `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_SERVICE_ACCOUNT_JSON` so that Firebase Admin can authenticate. Skip both if you do not need cloud persistence.
   - `FIREBASE_COLLECTION` defaults to `transcriptions`.

### Running the overlay
```bash
cd electron-app
npm start
```

The overlay launches, grabs focus, and immediately begins streaming recogniser status. Use the `Pause` pill to stop the Python backend without closing the window. `Copy transcript` places the full transcription string on the clipboard. Close the window using the `×` control.

### Recognised gestures
| Gesture | Sign | Phrase |
| ------- | ---- | ------ |
| Open palm | ✋ | `HELLO` |
| Closed fist | ✊ | `YES` |
| Index + middle extended | ✌️ | `NO` |
| Thumb extended | 👍 | `GOOD` |
| Thumb, index, pinky extended | 🤟 | `ILY` |

Hold a gesture steady for roughly half a second for it to register. When no hands are in view the consensus buffer resets.

### Firebase notes
- Firestore writes are best-effort. If credentials are missing, the Electron console logs a warning and the UI shows `Firebase offline`.
- Stored documents include `word`, the cumulative `transcript`, the recogniser timestamp, and a `createdAt` server timestamp. Adjust logic in `src/services/firebase.js` if you prefer batched writes or Realtime Database.

### Troubleshooting
- **Camera busy / blank window**: ensure no other application is locking the webcam.
- **Python not found**: set `PYTHON_PATH` to the absolute path of your interpreter.
- **Transparency issues (Linux)**: try running with a compositor enabled or comment out `transparent: true` in `src/main.js`.
- **Gesture accuracy**: replace `GestureClassifier` in `python-backend/translator_service.py` with your own ML model. The current implementation is intentionally simple for demo purposes.
