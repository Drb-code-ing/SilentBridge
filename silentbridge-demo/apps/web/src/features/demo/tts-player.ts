export interface TtsPlayer {
  isAvailable(): boolean;
  speak(text: string, onEnd?: () => void): boolean;
  stop(): void;
}

export function createTtsPlayer(): TtsPlayer {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;

  return {
    isAvailable() {
      return Boolean(synth);
    },
    speak(text: string, onEnd?: () => void) {
      if (!synth || !text.trim()) return false;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 0.95;
      if (onEnd) {
        utterance.onend = onEnd;
      }
      synth.speak(utterance);
      return true;
    },
    stop() {
      synth?.cancel();
    }
  };
}
