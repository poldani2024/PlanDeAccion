import { cn } from '../../lib/utils';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  emoji?: boolean;
  className?: string;
}

const emojis: Record<number, string> = {
  1: '😞', 2: '😟', 3: '😐', 4: '😕', 5: '🙂',
  6: '😊', 7: '😄', 8: '😁', 9: '🤩', 10: '🌟',
};

export function Slider({ value, onChange, min = 1, max = 10, label, emoji, className }: SliderProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <div className="flex items-center gap-1.5">
            {emoji && <span className="text-xl">{emojis[value]}</span>}
            <span className="text-lg font-bold text-indigo-600">{value}</span>
            <span className="text-xs text-gray-400">/{max}</span>
          </div>
        </div>
      )}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-600 bg-gray-200"
          style={{
            background: `linear-gradient(to right, #6366f1 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%)`,
          }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-400">{min}</span>
          <span className="text-xs text-gray-400">{max}</span>
        </div>
      </div>
    </div>
  );
}
