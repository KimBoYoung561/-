import { TTSVoiceType } from '../types';

export interface TTSOptions {
  voiceType?: TTSVoiceType;
  speed?: number;
  pitch?: number;
}

export function playVoiceSample(text: string, options: TTSOptions = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';

  // Base speed & pitch config
  const baseSpeed = options.speed ?? 1.0;
  const basePitch = options.pitch ?? 1.0;

  switch (options.voiceType) {
    case 'female-clear':
      utterance.pitch = basePitch * 1.15;
      utterance.rate = baseSpeed * 1.0;
      break;
    case 'male-calm':
      utterance.pitch = basePitch * 0.85;
      utterance.rate = baseSpeed * 0.95;
      break;
    case 'female-friendly':
      utterance.pitch = basePitch * 1.05;
      utterance.rate = baseSpeed * 0.92;
      break;
    case 'male-energetic':
      utterance.pitch = basePitch * 0.98;
      utterance.rate = baseSpeed * 1.15;
      break;
    default:
      utterance.pitch = basePitch;
      utterance.rate = baseSpeed;
      break;
  }

  // Pick suitable voice if available
  const voices = window.speechSynthesis.getVoices();
  const koreanVoices = voices.filter((v) => v.lang.includes('ko') || v.lang.includes('KR'));

  if (koreanVoices.length > 0) {
    // Try to distinguish male/female if voice names give hints
    if (options.voiceType === 'male-calm' || options.voiceType === 'male-energetic') {
      const maleVoice = koreanVoices.find((v) => /male|nam|남/i.test(v.name));
      if (maleVoice) utterance.voice = maleVoice;
      else utterance.voice = koreanVoices[0];
    } else {
      const femaleVoice = koreanVoices.find((v) => /female|yeo|여/i.test(v.name));
      if (femaleVoice) utterance.voice = femaleVoice;
      else utterance.voice = koreanVoices[0];
    }
  }

  window.speechSynthesis.speak(utterance);
}

export function stopVoice() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
