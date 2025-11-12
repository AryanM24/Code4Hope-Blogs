const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

let firestore = null;
let collectionName = "transcriptions";

const initFirebase = () => {
  if (firestore) {
    return { ok: true, reason: "already-initialized" };
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountPath && !serviceAccountJSON) {
    console.warn(
      "[firebase] FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON not set. Transcriptions will not be stored."
    );
    return { ok: false, reason: "missing-config" };
  }

  let credentials;
  try {
    if (serviceAccountJSON) {
      credentials = JSON.parse(serviceAccountJSON);
    } else {
      const resolved = path.resolve(serviceAccountPath);
      credentials = JSON.parse(fs.readFileSync(resolved, "utf8"));
    }
  } catch (error) {
    console.error("[firebase] Failed to load service account:", error.message);
    return { ok: false, reason: "load-error", error };
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
    firestore = admin.firestore();
    collectionName = process.env.FIREBASE_COLLECTION || collectionName;
    console.info(`[firebase] Connected. Using collection "${collectionName}"`);
    return { ok: true };
  } catch (error) {
    console.error("[firebase] Initialization error:", error.message);
    return { ok: false, reason: "init-error", error };
  }
};

const isEnabled = () => Boolean(firestore);

const storeTranscription = async (payload) => {
  if (!firestore) {
    return { ok: false, reason: "not-initialized" };
  }

  try {
    const doc = {
      word: payload.word,
      transcript: payload.full,
      confidence: payload.confidence ?? null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      eventTimestamp: new Date(payload.timestamp * 1000),
    };
    await firestore.collection(collectionName).add(doc);
    return { ok: true };
  } catch (error) {
    console.error("[firebase] Failed to persist transcription:", error.message);
    return { ok: false, reason: "write-error", error };
  }
};

module.exports = {
  initFirebase,
  isEnabled,
  storeTranscription,
};
