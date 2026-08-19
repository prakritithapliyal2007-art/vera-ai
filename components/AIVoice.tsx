"use client";

import { useEffect } from "react";

type AIVoiceProps = {
  text: string;
  trigger: number;
  enabled: boolean;
};

export default function AIVoice({
  text,
  trigger,
  enabled,
}: AIVoiceProps) {
  useEffect(() => {
    // Voice OFF hai to kuch mat karo
    if (!enabled || !text || trigger === 0) return;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-IN";
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;

    window.speechSynthesis.speak(speech);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [text, trigger, enabled]);

  return null;
}