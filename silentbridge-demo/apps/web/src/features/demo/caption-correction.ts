import type { CaptionLine } from "./demo-content";

export function applyCaptionCorrection(
  captions: CaptionLine[],
  correctedText: string | undefined,
  latestCaptionId: string
): CaptionLine[] {
  if (!correctedText || !correctedText.trim() || captions.length === 0) {
    return captions;
  }
  const targetIndex = captions.findIndex((c) => c.id === latestCaptionId);
  if (targetIndex === -1) {
    return captions;
  }
  const updated = [...captions];
  const oldText = updated[targetIndex].text;
  updated[targetIndex] = {
    ...updated[targetIndex],
    text: correctedText,
    corrected: true,
    originalText: oldText
  };
  return updated;
}
