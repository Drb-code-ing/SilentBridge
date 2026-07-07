export type AudioCaptureFailureReason =
  | "no-window"
  | "no-browser-api"
  | "permission-denied"
  | "no-device"
  | "hardware-error"
  | "insecure-context"
  | "unknown";

export type AudioCaptureSupport =
  | { supported: true; mode: "speech-recognition" | "media-recorder" }
  | { supported: false; reason: AudioCaptureFailureReason };

export interface AudioCaptureState {
  support: AudioCaptureSupport;
  permissionState: "unknown" | "granted" | "denied" | "prompt";
}

export function detectAudioCaptureSupport(): AudioCaptureSupport {
  if (typeof window === "undefined") {
    return { supported: false, reason: "no-window" };
  }

  const hasSpeechRecognition =
    "SpeechRecognition" in window || "webkitSpeechRecognition" in window;

  if (hasSpeechRecognition) {
    return { supported: true, mode: "speech-recognition" };
  }

  if (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
    typeof MediaRecorder !== "undefined"
  ) {
    return { supported: true, mode: "media-recorder" };
  }

  return { supported: false, reason: "no-browser-api" };
}

export async function requestMicrophoneAccess(): Promise<AudioCaptureState> {
  const support = detectAudioCaptureSupport();
  if (!support.supported) {
    return { support, permissionState: "denied" };
  }

  if (
    support.mode === "speech-recognition" &&
    (typeof navigator === "undefined" || typeof navigator.mediaDevices?.getUserMedia !== "function")
  ) {
    return { support, permissionState: "prompt" };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { support, permissionState: "granted" };
  } catch (error) {
    const errorName = (error as { name?: string })?.name ?? "";
    let reason: AudioCaptureFailureReason = "permission-denied";

    if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
      reason = "no-device";
    } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
      reason = "hardware-error";
    } else if (errorName === "SecurityError") {
      reason = "insecure-context";
    }

    return {
      support: { supported: false, reason },
      permissionState: "denied"
    };
  }
}
