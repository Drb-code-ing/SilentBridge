import "@testing-library/jest-dom";

class MockSpeechSynthesisUtterance {
  text: string;
  lang: string = "en-US";
  rate: number = 1;
  pitch: number = 1;
  volume: number = 1;
  voice: SpeechSynthesisVoice | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

if (typeof globalThis.SpeechSynthesisUtterance === "undefined") {
  (globalThis as unknown as { SpeechSynthesisUtterance: typeof MockSpeechSynthesisUtterance }).SpeechSynthesisUtterance =
    MockSpeechSynthesisUtterance;
}
