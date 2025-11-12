#!/usr/bin/env python3
"""
Sign language translation backend powered by MediaPipe and OpenCV.

The script continuously reads frames from the default webcam, detects hands, classifies
simple static gestures, and streams transcription events to stdout as JSON lines.

Each emitted line is a JSON document with the shape:

    {"type": "transcription", "word": "HELLO", "full": "HELLO", "timestamp": 1731436800.123}

Additional status messages use:

    {"type": "status", "status": "ready"}
    {"type": "status", "status": "stopped"}
    {"type": "error", "message": "..."}

The process can be stopped with SIGINT/SIGTERM.
"""

from __future__ import annotations

import argparse
import json
import signal
import sys
import threading
import time
from collections import Counter, deque
from dataclasses import dataclass
from typing import Deque, Optional, Tuple

import cv2
import mediapipe as mp


def emit(event: dict) -> None:
    """Write an event to stdout as a JSON line."""
    sys.stdout.write(json.dumps(event) + "\n")
    sys.stdout.flush()


def emit_status(status: str) -> None:
    emit({"type": "status", "status": status, "timestamp": time.time()})


def emit_error(message: str) -> None:
    emit({"type": "error", "message": message, "timestamp": time.time()})


@dataclass
class GestureResult:
    label: str
    confidence: float


class GestureClassifier:
    """
    A lightweight rules-based classifier for a handful of static ASL-inspired gestures.

    The classifier uses finger state heuristics derived from MediaPipe's 21 hand landmarks.
    It is not meant to be production-grade but provides a reasonable foundation that users
    can extend with their own ML models.
    """

    def __init__(self, min_consensus_frames: int = 6, history_size: int = 15) -> None:
        self.history: Deque[str] = deque(maxlen=history_size)
        self.last_word: Optional[str] = None
        self.min_consensus_frames = min_consensus_frames
        self.full_transcript: str = ""

    @staticmethod
    def _finger_states(hand_landmarks, handedness: str) -> Tuple[int, int, int, int, int]:
        """
        Determine whether each finger is extended (1) or folded (0).
        Landmark indices follow MediaPipe's specification.
        """
        landmarks = hand_landmarks.landmark

        def is_thumb_extended() -> int:
            # Compare thumb tip and MCP relative to wrist depending on handedness.
            wrist = landmarks[0]
            thumb_tip = landmarks[4]
            thumb_ip = landmarks[3]
            if handedness.upper() == "RIGHT":
                return int(thumb_tip.x > thumb_ip.x and thumb_tip.x > wrist.x)
            return int(thumb_tip.x < thumb_ip.x and thumb_tip.x < wrist.x)

        def is_finger_extended(tip_idx: int, pip_idx: int) -> int:
            return int(landmarks[tip_idx].y < landmarks[pip_idx].y)

        thumb = is_thumb_extended()
        index = is_finger_extended(8, 6)
        middle = is_finger_extended(12, 10)
        ring = is_finger_extended(16, 14)
        pinky = is_finger_extended(20, 18)
        return thumb, index, middle, ring, pinky

    @staticmethod
    def _gesture_from_states(
        states: Tuple[int, int, int, int, int], hand_orientation: str
    ) -> Optional[GestureResult]:
        """
        Map finger states to a gesture. Returns None if no confident gesture is found.
        """
        thumb, index, middle, ring, pinky = states
        extended_count = sum(states)

        if extended_count == 0:
            return GestureResult("YES", 0.9)

        if extended_count == 5:
            return GestureResult("HELLO", 0.85)

        if index and middle and not ring and not pinky:
            return GestureResult("NO", 0.7)

        if thumb and index and pinky and not middle and not ring:
            return GestureResult("ILY", 0.8)

        if thumb and not index and not middle and not ring and not pinky:
            # Use wrist orientation to differentiate thumbs-up vs thumbs-left/right.
            confidence = 0.75 if hand_orientation.upper() == "RIGHT" else 0.65
            return GestureResult("GOOD", confidence)

        return None

    def push(self, gesture: Optional[GestureResult]) -> Optional[dict]:
        """
        Register a new gesture observation. Returns transcription payload when a new
        consensus word emerges, otherwise None.
        """
        label = gesture.label if gesture else "UNKNOWN"
        self.history.append(label)

        if len(self.history) < self.min_consensus_frames:
            return None

        # Determine consensus by majority vote over the sliding window.
        counts = Counter(self.history)
        top_label, count = counts.most_common(1)[0]

        if top_label in {"UNKNOWN", "NONE"}:
            return None

        if count < self.min_consensus_frames:
            return None

        if self.last_word == top_label:
            return None

        self.last_word = top_label
        if self.full_transcript:
            self.full_transcript += " "
        self.full_transcript += top_label

        return {
            "type": "transcription",
            "word": top_label,
            "full": self.full_transcript,
            "timestamp": time.time(),
            "confidence": gesture.confidence if gesture else None,
        }

    def reset_consensus(self) -> None:
        self.history.clear()
        self.last_word = None


class TranslatorService:
    def __init__(self, camera_index: int = 0, frame_width: Optional[int] = None):
        self.camera_index = camera_index
        self.frame_width = frame_width
        self.stop_event = threading.Event()
        self.cap: Optional[cv2.VideoCapture] = None
        self.hands = mp.solutions.hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            model_complexity=1,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )
        self.classifier = GestureClassifier()

    def start(self) -> None:
        self.cap = cv2.VideoCapture(self.camera_index)
        if not self.cap.isOpened():
            raise RuntimeError(f"Unable to open webcam at index {self.camera_index}")

        if self.frame_width:
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, self.frame_width)

        emit_status("ready")

        while not self.stop_event.is_set():
            success, frame = self.cap.read()
            if not success:
                emit_error("Failed to read from camera")
                time.sleep(0.1)
                continue

            # MediaPipe expects RGB input.
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = self.hands.process(image)

            if results.multi_hand_landmarks and results.multi_handedness:
                landmark = results.multi_hand_landmarks[0]
                handedness = results.multi_handedness[0].classification[0].label
                finger_states = self.classifier._finger_states(landmark, handedness)
                gesture = self.classifier._gesture_from_states(finger_states, handedness)
                payload = self.classifier.push(gesture)
                if payload:
                    emit(payload)
            else:
                self.classifier.reset_consensus()

            # Sleep lightly to keep CPU usage reasonable.
            time.sleep(0.01)

        emit_status("stopped")

    def stop(self) -> None:
        self.stop_event.set()

    def cleanup(self) -> None:
        if self.cap and self.cap.isOpened():
            self.cap.release()
        self.hands.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Sign language translation backend")
    parser.add_argument("--camera", type=int, default=0, help="Camera index (default: 0)")
    parser.add_argument(
        "--width", type=int, default=None, help="Optional frame width to request"
    )
    args = parser.parse_args()

    service = TranslatorService(camera_index=args.camera, frame_width=args.width)

    def handle_signal(_: int, __) -> None:
        service.stop()

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    try:
        service.start()
    except Exception as exc:  # pylint: disable=broad-except
        emit_error(str(exc))
        return 1
    finally:
        service.cleanup()

    return 0


if __name__ == "__main__":
    sys.exit(main())
