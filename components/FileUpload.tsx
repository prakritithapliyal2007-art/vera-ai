"use client";

import { FaPaperclip } from "react-icons/fa";

type FileUploadProps = {
  onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
};

export default function FileUpload({
  onSelect,
  fileInputRef,
}: FileUploadProps) {
  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
      />

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl p-3 text-white/70 hover:bg-white/10 transition"
      >
        <FaPaperclip />
      </button>
    </>
  );
}