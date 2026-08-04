import React, { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Fullscreen image viewer. Tap/click any thumbnail or the main photo to open,
 * then swipe/click through the rest of the gallery. Works for a single image
 * or an array of images with an activeIndex.
 */
const Lightbox = ({ images, activeIndex, onClose, onNavigate }) => {
  const goPrev = useCallback(
    () => onNavigate((activeIndex - 1 + images.length) % images.length),
    [activeIndex, images.length, onNavigate]
  );
  const goNext = useCallback(
    () => onNavigate((activeIndex + 1) % images.length),
    [activeIndex, images.length, onNavigate]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKeyDown);
    // Lock background scroll while the lightbox is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, goPrev, goNext]);

  if (!images || images.length === 0) return null;
  const current = images[activeIndex];

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-2 sm:left-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
      )}

      <img
        src={current?.url}
        alt=""
        className="max-h-[90vh] max-w-[92vw] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-2 sm:right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10"
          aria-label="Next image"
        >
          <ChevronRight className="h-7 w-7" />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/70">
          {activeIndex + 1} / {images.length}
        </div>
      )}
    </div>
  );
};

export default Lightbox;
