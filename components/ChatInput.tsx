"use client";

import React, { useEffect, useState } from "react";
import VoiceButton from "./VoiceButton";
import FileUpload from "./FileUpload";

type ChatInputProps = {
  message: string;
  setMessage: (value: string) => void;
  askVera: () => void;
  loading: boolean;

  // User voice input
  isListening: boolean;
  startVoiceInput: () => void;

  // AI voice output
  voiceEnabled: boolean;
  setVoiceEnabled: (value: boolean) => void;

  // File upload
  handleFileSelect: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  clearSelectedFile: () => void;
};

export default function ChatInput({
  message,
  setMessage,
  askVera,
  loading,
  isListening,
  startVoiceInput,
  voiceEnabled,
  setVoiceEnabled,
  handleFileSelect,
  fileInputRef,
  selectedFile,
  clearSelectedFile,
}: ChatInputProps) {
  // Preview URL for image files
  const [previewUrl, setPreviewUrl] =
    useState<string | null>(null);

  useEffect(() => {
    if (
      selectedFile &&
      selectedFile.type.startsWith("image/")
    ) {
      const url =
        URL.createObjectURL(selectedFile);

      setPreviewUrl(url);

      // Clean up object URL
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const isImageFile =
    selectedFile &&
    selectedFile.type.startsWith("image/");

  return (
    <div className="w-full">
      {/* =========================
          SELECTED FILE
      ========================= */}
      {selectedFile && (
        <div className="mb-3 flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 sm:gap-3 sm:px-4">
          {isImageFile && previewUrl ? (
            <img
              src={previewUrl}
              alt={selectedFile.name}
              className="h-10 w-10 shrink-0 rounded-lg object-cover sm:h-12 sm:w-12"
            />
          ) : (
            <span className="shrink-0">
              📎
            </span>
          )}

          <span className="min-w-0 flex-1 truncate">
            {selectedFile.name}
          </span>

          <button
            type="button"
            onClick={clearSelectedFile}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
            aria-label="Remove file"
          >
            ✕
          </button>
        </div>
      )}

      {/* =========================
          INPUT BOX
      ========================= */}
      <div className="flex w-full items-center rounded-2xl border border-white/10 bg-white/5 p-1.5 sm:p-2">

        {/* File Upload */}
        <FileUpload
          fileInputRef={fileInputRef}
          onSelect={handleFileSelect}
        />

        {/* User Voice / Mic */}
        <VoiceButton
          isListening={isListening}
          onClick={startVoiceInput}
        />

        {/* AI Voice Button */}
        <button
          type="button"
          onClick={() => {
            const nextState =
              !voiceEnabled;

            setVoiceEnabled(
              nextState
            );

            if (
              !nextState &&
              "speechSynthesis" in window
            ) {
              window.speechSynthesis.cancel();
            }
          }}
          title={
            voiceEnabled
              ? "Turn AI Voice off"
              : "Turn AI Voice on"
          }
          aria-label={
            voiceEnabled
              ? "Turn AI Voice off"
              : "Turn AI Voice on"
          }
          className={`mx-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm transition sm:mx-1 sm:h-11 sm:w-11 sm:text-base ${
            voiceEnabled
              ? "border-white bg-white text-black"
              : "border-white/10 text-white/70 hover:bg-white/10"
          }`}
        >
          {voiceEnabled
            ? "🔊"
            : "🔇"}
        </button>

        {/* Message Input */}
        <input
          type="text"
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !loading
            ) {
              e.preventDefault();
              askVera();
            }
          }}
          placeholder="Ask Vera anything..."
          disabled={loading}
          className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-white/40 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:py-4 sm:text-base"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={askVera}
          disabled={loading}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-lg text-black transition hover:bg-white/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-auto sm:px-5 sm:py-4"
        >
          {loading
            ? "..."
            : "↑"}
        </button>
      </div>
    </div>
  );
}