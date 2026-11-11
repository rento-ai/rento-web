"use client";

import { PopupFrame } from "@/components/popups/popup-frame";

export function PhotoPopup({ src, label }: { src: string; label: string }) {
  return (
    <PopupFrame title={label}>
      <img src={src} alt={label} className="w-full rounded-[14px]" />
    </PopupFrame>
  );
}
