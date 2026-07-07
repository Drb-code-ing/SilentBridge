/**
 * 录音器：使用 MediaRecorder API 采集音频，再解码为 16kHz PCM WAV。
 * 输出 16kHz 单声道 16-bit PCM WAV，适配百度语音识别。
 */
const TARGET_SAMPLE_RATE = 16000;

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private recording = false;
  private mimeType = "audio/webm";

  isRecording(): boolean {
    return this.recording;
  }

  async start(): Promise<void> {
    if (this.recording) {
      return;
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const options = this.pickMimeType();
    this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
    this.mimeType = this.mediaRecorder.mimeType || "audio/webm";

    this.chunks = [];
    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100);
    this.recording = true;
    console.log("[AudioRecorder] recording started, mimeType:", this.mimeType);
  }

  async stop(): Promise<{ blob: Blob; base64: string; length: number } | null> {
    if (!this.recording || !this.mediaRecorder) {
      console.log("[AudioRecorder] stop called but not recording");
      this.cleanup();
      return null;
    }

    const stopped = new Promise<void>((resolve) => {
      if (this.mediaRecorder!.state === "inactive") {
        resolve();
      } else {
        this.mediaRecorder!.onstop = () => resolve();
        this.mediaRecorder!.stop();
      }
    });

    await stopped;
    this.recording = false;

    console.log("[AudioRecorder] chunks:", this.chunks.length, "total size:", this.chunks.reduce((a, c) => a + c.size, 0));

    if (this.chunks.length === 0) {
      console.log("[AudioRecorder] no audio data captured");
      this.cleanup();
      return null;
    }

    const blob = new Blob(this.chunks, { type: this.mimeType });
    console.log("[AudioRecorder] blob size:", blob.size, "type:", blob.type);

    const wavBuffer = await this.convertToWav(blob);
    if (!wavBuffer) {
      console.log("[AudioRecorder] failed to convert to WAV");
      this.cleanup();
      return null;
    }

    const base64 = arrayBufferToBase64(wavBuffer);
    console.log("[AudioRecorder] WAV size:", wavBuffer.byteLength, "bytes");

    this.cleanup();
    return { blob: new Blob([wavBuffer], { type: "audio/wav" }), base64, length: wavBuffer.byteLength };
  }

  cancel(): void {
    this.recording = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      try {
        this.mediaRecorder.stop();
      } catch {
        // ignore
      }
    }
    this.cleanup();
  }

  private pickMimeType(): MediaRecorderOptions {
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];

    for (const type of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
        return { mimeType: type };
      }
    }

    return {};
  }

  private async convertToWav(blob: Blob): Promise<ArrayBuffer | null> {
    try {
      const arrayBuffer = await blob.arrayBuffer();

      const AudioContextCtor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const decodeCtx = new AudioContextCtor();

      const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
      console.log("[AudioRecorder] decoded:", audioBuffer.sampleRate, "Hz,", audioBuffer.numberOfChannels, "ch,", audioBuffer.duration.toFixed(2), "s");

      const channelData = audioBuffer.getChannelData(0);

      const resampled = audioBuffer.sampleRate !== TARGET_SAMPLE_RATE
        ? downsample(channelData, audioBuffer.sampleRate, TARGET_SAMPLE_RATE)
        : channelData;

      const wavBuffer = encodeWav(resampled, TARGET_SAMPLE_RATE);

      decodeCtx.close().catch(() => {});
      return wavBuffer;
    } catch (err) {
      console.error("[AudioRecorder] convertToWav failed:", err);
      return null;
    }
  }

  private cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    this.mediaRecorder = null;
    this.chunks = [];
  }
}

function downsample(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (toRate >= fromRate) {
    return buffer;
  }

  const ratio = fromRate / toRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;

  while (offsetResult < newLength) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }

  return result;
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const parts: string[] = [];

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    parts.push(String.fromCharCode.apply(null, Array.from(chunk)));
  }

  return btoa(parts.join(""));
}
