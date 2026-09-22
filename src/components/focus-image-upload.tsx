"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, X, Crosshair } from "lucide-react";

interface FocusImageUploadProps {
  onImageChange: (file: File | null) => void;
  onFocusChange: (focus: { x: number; y: number }) => void;
  initialImage?: string;
  initialFocus?: { x: number; y: number };
}

export function FocusImageUpload({
  onImageChange,
  onFocusChange,
  initialImage,
  initialFocus,
}: FocusImageUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage || null);
  const [focus, setFocus] = useState(initialFocus || { x: 50, y: 50 });
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp between 0 and 100
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setFocus({ x: clampedX, y: clampedY });
    onFocusChange({ x: clampedX, y: clampedY });
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl(null);
    setFocus({ x: 50, y: 50 });
    onImageChange(null);
    onFocusChange({ x: 50, y: 50 });
    
    // reset underlying file input if we had one here (but we manage state)
  };

  if (!previewUrl) {
    return (
      <div className="relative flex flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-[rgba(22,19,17,0.15)] bg-parchment py-12 transition-colors hover:border-[var(--color-brass)] hover:bg-[rgba(192,138,46,0.05)]">
        <UploadCloud size={40} className="mb-4 text-brass-light" />
        <p className="mb-1 text-sm font-semibold text-ink">
          Click to upload event flyer
        </p>
        <p className="text-xs text-warm-500">SVG, PNG, JPG (max 20MB)</p>
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) {
              setFile(selected);
              onImageChange(selected);
              onFocusChange({ x: 50, y: 50 }); // Reset focus on new image
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start rounded-[12px] border border-warm-200 bg-parchment p-6">
      {/* Interactive Image Area */}
      <div className="flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-ink">Set Focus Point</h3>
            <p className="text-xs text-warm-500">
              Click on the most important part of the flyer (e.g. faces or text).
            </p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-warm-500 shadow-sm hover:text-red-600 transition-colors"
            title="Remove image"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="relative overflow-hidden rounded-lg border border-warm-300 bg-warm-100 flex items-center justify-center select-none">
          <img
            ref={imageRef}
            src={previewUrl}
            alt="Upload preview"
            className="max-h-[500px] w-auto cursor-crosshair object-contain"
            onClick={handleImageClick}
            draggable={false}
          />
          {/* Target Reticle */}
          <div
            className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 transition-all duration-200"
            style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
          >
            <div className="relative h-full w-full">
              {/* Outer circle */}
              <div className="absolute inset-0 rounded-full border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.5)]"></div>
              {/* Inner cross */}
              <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
              <div className="absolute left-1/2 top-0 h-2 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
              <div className="absolute left-1/2 bottom-0 h-2 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
              <div className="absolute top-1/2 left-0 h-[2px] w-2 -translate-y-1/2 bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
              <div className="absolute top-1/2 right-0 h-[2px] w-2 -translate-y-1/2 bg-white shadow-[0_0_2px_rgba(0,0,0,0.5)]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Previews Area */}
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink">Preview your image</h3>
          <p className="text-xs text-warm-500">
            See how your image looks on different screen sizes.
          </p>
        </div>

        {/* Square (1:1) Preview */}
        <div>
          <h4 className="mb-2 text-xs font-semibold text-warm-600">Square (1:1)</h4>
          <div className="aspect-square w-[200px] max-w-full overflow-hidden rounded-xl border border-warm-200 bg-warm-100 shadow-sm">
            <img
              src={previewUrl}
              alt="Square preview"
              className="h-full w-full object-cover transition-all duration-200"
              style={{ objectPosition: `${focus.x}% ${focus.y}%` }}
            />
          </div>
        </div>

        {/* Rectangle (2:1) Preview */}
        <div>
          <h4 className="mb-2 text-xs font-semibold text-warm-600">Rectangle (2:1)</h4>
          <div className="aspect-[2/1] w-full overflow-hidden rounded-xl border border-warm-200 bg-warm-100 shadow-sm">
            <img
              src={previewUrl}
              alt="Rectangle preview"
              className="h-full w-full object-cover transition-all duration-200"
              style={{ objectPosition: `${focus.x}% ${focus.y}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
