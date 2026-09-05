import { TTSVoiceType } from '../types';

export function playVoiceSample(
  text: string,
  options?: {
    voiceType?: TTSVoiceType;
    speed?: number;
    pitch?: number;
  }
) {
  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    return;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = options?.speed || 1.0;
    utterance.pitch = options?.pitch || 1.0;

    const voices = window.speechSynthesis.getVoices();
    const koreanVoices = voices.filter((v) => v.lang.includes('ko') || v.lang.includes('KO'));

    if (koreanVoices.length > 0) {
      if (options?.voiceType === 'male-calm' || options?.voiceType === 'male-energetic') {
        const maleVoice = koreanVoices.find((v) => v.name.includes('Male') || v.name.includes('남성'));
        if (maleVoice) utterance.voice = maleVoice;
        else utterance.voice = koreanVoices[0];
      } else {
        const femaleVoice = koreanVoices.find((v) => v.name.includes('Female') || v.name.includes('여성') || v.name.includes('Yuna') || v.name.includes('Google'));
        if (femaleVoice) utterance.voice = femaleVoice;
        else utterance.voice = koreanVoices[0];
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('TTS playback failed:', err);
  }
}

export function speakNavigation(text: string) {
  playVoiceSample(text, { voiceType: 'female-clear', speed: 1.05 });
}

export function stopVoice() {
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}
