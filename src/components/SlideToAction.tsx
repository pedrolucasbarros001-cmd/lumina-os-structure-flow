import { useRef, useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideToActionProps {
  label: string;
  color?: 'yellow' | 'green' | 'blue';
  onConfirm: () => void;
  loading?: boolean;
}

const COLOR_MAP = {
  yellow: {
    track: 'bg-amber-500/15 border-amber-500/30',
    thumb: 'bg-amber-500',
    text: 'text-amber-600',
    fill: 'bg-amber-500/20',
  },
  green: {
    track: 'bg-emerald-500/15 border-emerald-500/30',
    thumb: 'bg-emerald-500',
    text: 'text-emerald-600',
    fill: 'bg-emerald-500/20',
  },
  blue: {
    track: 'bg-sky-500/15 border-sky-500/30',
    thumb: 'bg-sky-500',
    text: 'text-sky-600',
    fill: 'bg-sky-500/20',
  },
};

const THUMB_SIZE = 52;
const THRESHOLD = 0.8;

export default function SlideToAction({ label, color = 'blue', onConfirm, loading = false }: SlideToActionProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const maxRef = useRef(0);
  const colors = COLOR_MAP[color];

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (loading) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const trackWidth = trackRef.current?.offsetWidth ?? 0;
    maxRef.current = trackWidth - THUMB_SIZE - 8; // 8 = padding
    startXRef.current = e.clientX;
    setDragging(true);
  }, [loading]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const delta = e.clientX - startXRef.current;
    setOffset(Math.max(0, Math.min(delta, maxRef.current)));
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    if (offset >= maxRef.current * THRESHOLD) {
      setOffset(maxRef.current);
      onConfirm();
    } else {
      setOffset(0);
    }
  }, [dragging, offset, onConfirm]);

  const progress = maxRef.current > 0 ? offset / maxRef.current : 0;

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative h-14 rounded-2xl border-2 overflow-hidden select-none',
        colors.track,
        loading && 'opacity-60 pointer-events-none'
      )}
    >
      {/* Fill bar */}
      <div
        className={cn('absolute inset-y-0 left-0 rounded-2xl transition-none', colors.fill)}
        style={{ width: `${(offset + THUMB_SIZE + 8)}px` }}
      />

      {/* Label */}
      <div className={cn(
        'absolute inset-0 flex items-center justify-center text-sm font-bold transition-opacity',
        colors.text,
        progress > 0.3 && 'opacity-0'
      )}>
        {label}
      </div>

      {/* Thumb */}
      <div
        className={cn(
          'absolute top-1 left-1 w-12 h-12 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing shadow-lg',
          colors.thumb,
          'text-white',
          !dragging && offset === 0 && 'transition-transform duration-300'
        )}
        style={{
          transform: `translateX(${offset}px)`,
          transition: dragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </div>
  );
}
