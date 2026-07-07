type BrowserSpeechRecognitionEvent = Event & {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResult>;
};

type BrowserSpeechRecognitionErrorEvent = Event & {
  error?: string;
  message?: string;
};

interface BrowserSpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: BrowserSpeechRecognitionConstructor;
  webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
};

export type BrowserSpeechSupport =
  | {
      supported: true;
      constructorName: "SpeechRecognition" | "webkitSpeechRecognition";
      Recognition: BrowserSpeechRecognitionConstructor;
    }
  | { supported: false; reason: "no-window" | "no-browser-api" };

export interface BrowserSpeechCaptureCallbacks {
  onStart: () => void;
  onPartialText: (text: string) => void;
  onFinalText: (text: string) => void;
  onComplete: (text: string) => void;
  onError: (reason: string) => void;
}

export interface BrowserSpeechCaptureController {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export function detectBrowserSpeechRecognition(): BrowserSpeechSupport {
  if (typeof window === "undefined") {
    return { supported: false, reason: "no-window" };
  }

  const speechWindow = window as SpeechWindow;
  if (speechWindow.SpeechRecognition) {
    return {
      supported: true,
      constructorName: "SpeechRecognition",
      Recognition: speechWindow.SpeechRecognition
    };
  }

  if (speechWindow.webkitSpeechRecognition) {
    return {
      supported: true,
      constructorName: "webkitSpeechRecognition",
      Recognition: speechWindow.webkitSpeechRecognition
    };
  }

  return { supported: false, reason: "no-browser-api" };
}

export function createBrowserSpeechCapture(
  callbacks: BrowserSpeechCaptureCallbacks,
  language = "zh-CN",
  silenceTimeoutMs = 7000
): BrowserSpeechCaptureController | undefined {
  const support = detectBrowserSpeechRecognition();
  if (!support.supported) {
    return undefined;
  }

  const recognition = new support.Recognition();
  const finalParts: string[] = [];
  let completed = false;
  let silenceTimer: number | undefined;

  const clearSilenceTimer = () => {
    if (silenceTimer === undefined) {
      return;
    }

    window.clearTimeout(silenceTimer);
    silenceTimer = undefined;
  };

  const scheduleSilenceTimer = () => {
    clearSilenceTimer();
    silenceTimer = window.setTimeout(() => {
      if (completed) {
        return;
      }

      if (finalParts.length > 0) {
        recognition.stop();
        return;
      }

      completed = true;
      callbacks.onError("speech-timeout");
      recognition.abort();
    }, silenceTimeoutMs);
  };

  recognition.lang = language;
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    scheduleSilenceTimer();
    callbacks.onStart();
  };

  recognition.onresult = (event) => {
    if (completed) {
      return;
    }

    let interimText = "";
    let hasSpeechText = false;

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const text = result[0]?.transcript.trim() ?? "";

      if (!text) {
        continue;
      }

      hasSpeechText = true;

      if (result.isFinal) {
        finalParts.push(text);
        callbacks.onFinalText(text);
      } else {
        interimText = `${interimText}${text}`.trim();
      }
    }

    if (interimText) {
      callbacks.onPartialText(interimText);
    }

    if (hasSpeechText) {
      scheduleSilenceTimer();
    }
  };

  recognition.onerror = (event) => {
    if (completed) {
      return;
    }

    completed = true;
    clearSilenceTimer();
    const reason = event.error || event.message || "speech-recognition-error";
    callbacks.onError(reason);
  };

  recognition.onend = () => {
    if (completed) {
      return;
    }

    completed = true;
    clearSilenceTimer();
    callbacks.onComplete(finalParts.join(""));
  };

  return {
    start() {
      completed = false;
      finalParts.length = 0;
      clearSilenceTimer();

      try {
        recognition.start();
      } catch (error) {
        completed = true;
        clearSilenceTimer();
        const reason = error instanceof Error ? error.message : "speech-start-error";
        callbacks.onError(reason);
      }
    },
    stop() {
      clearSilenceTimer();
      recognition.stop();
    },
    abort() {
      completed = true;
      clearSilenceTimer();
      recognition.abort();
    }
  };
}
