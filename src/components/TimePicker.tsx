import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimePickerProps {
  value: { hours: number; minutes: number };
  onChange: (time: { hours: number; minutes: number }) => void;
  intervalMinutes?: number;
}

export default function TimePicker({ value, onChange, intervalMinutes = 15 }: TimePickerProps) {
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 60; i += intervalMinutes) {
      arr.push(i);
    }
    return arr;
  }, [intervalMinutes]);

  const handleHourChange = (h: number) => {
    onChange({ ...value, hours: h });
    setMode('minute');
  };

  const handleMinuteChange = (m: number) => {
    onChange({ ...value, minutes: m });
  };

  return (
    <div className="space-y-3">
      {/* Mode Selector */}
      <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
        <button
          onClick={() => setMode('hour')}
          className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
            mode === 'hour'
              ? 'bg-white text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {String(value.hours).padStart(2, '0')}:00
        </button>
        <button
          onClick={() => setMode('minute')}
          className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
            mode === 'minute'
              ? 'bg-white text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {String(value.minutes).padStart(2, '0')}
        </button>
      </div>

      {/* Hour Selection */}
      {mode === 'hour' && (
        <div className="grid grid-cols-6 gap-2">
          {hours.map(h => (
            <button
              key={h}
              onClick={() => handleHourChange(h)}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                value.hours === h
                  ? 'bg-primary text-white'
                  : 'bg-muted/50 hover:bg-muted text-foreground'
              }`}
            >
              {String(h).padStart(2, '0')}
            </button>
          ))}
        </div>
      )}

      {/* Minute Selection */}
      {mode === 'minute' && (
        <div className="grid grid-cols-6 gap-2">
          {minutes.map(m => (
            <button
              key={m}
              onClick={() => handleMinuteChange(m)}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                value.minutes === m
                  ? 'bg-primary text-white'
                  : 'bg-muted/50 hover:bg-muted text-foreground'
              }`}
            >
              {String(m).padStart(2, '0')}
            </button>
          ))}
        </div>
      )}

      {/* Time Display */}
      <div className="flex items-center justify-center gap-2 py-4 bg-sky-50 rounded-xl">
        <span className="text-3xl font-bold text-primary">
          {String(value.hours).padStart(2, '0')}:{String(value.minutes).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
