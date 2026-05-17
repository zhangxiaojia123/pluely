import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FILLER_WORDS = new Set([
  // 中文单字
  '嗯', '啊', '哦', '哈', '呃', '额', '好', '对', '行', '是', '噢', '哎', '诶',
  // 中文短语
  '嗯嗯', '哦哦', '啊啊', '好的', '好吧', '对对', '对的', '是的', '行吧', '嗯啊',
  '对对对', '好好', '嗯哦', '哦对', '就是', '然后', '那个',
  // 英文
  'ok', 'okay', 'uh', 'um', 'hmm', 'mm', 'mmm', 'ah', 'er', 'eh',
  'right', 'sure', 'yep', 'yup', 'yeah', 'hm', 'uh huh', 'mm hmm',
]);

export function isFillerText(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return true;
  if (FILLER_WORDS.has(normalized)) return true;
  // 纯标点符号
  if (/^[\s\p{P}]+$/u.test(normalized)) return true;
  // 中文字符数 ≤ 2（单字或双字，且不含英文/数字）
  const chineseChars = normalized.match(/\p{Script=Han}/gu) ?? [];
  const hasOnlyChinese = /^[\p{Script=Han}\s]+$/u.test(normalized);
  if (hasOnlyChinese && chineseChars.length <= 2) return true;
  return false;
}

export const floatArrayToWav = (
  audioData: Float32Array,
  sampleRate: number = 16000,
  format: "wav" | "mp3" | "ogg" = "wav"
): Blob => {
  const buffer = new ArrayBuffer(44 + audioData.length * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  const dataSize =
    format === "wav" ? 36 + audioData.length * 2 : 44 + audioData.length * 2;
  view.setUint32(4, dataSize, true);
  writeString(8, format === "wav" ? "WAVE" : "FORM");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, audioData.length * 2, true);

  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < audioData.length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: `audio/${format}` });
};
