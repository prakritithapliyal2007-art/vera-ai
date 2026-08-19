"use client";

import { FaMicrophone } from "react-icons/fa";

type VoiceButtonProps = {
  isListening: boolean;
  onClick: () => void;
};

export default function VoiceButton({
  isListening,
  onClick,
}: VoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Voice Input"
      className={`rounded-xl p-3 transition ${
        isListening
          ? "bg-red-500 text-white"
          : "text-white/70 hover:bg-white/10"
      }`}
    >
      <FaMicrophone size={18} />
    </button>
  );
}