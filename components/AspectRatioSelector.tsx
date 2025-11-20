import React from 'react';
import type { AspectRatio } from '../types';

interface AspectRatioSelectorProps {
  label: string;
  value: AspectRatio;
  options: readonly AspectRatio[];
  onChange: (value: AspectRatio) => void;
}

const ratioDimensions: Record<AspectRatio, { w: number; h: number }> = {
  '16:9': { w: 16, h: 9 },
  '1:1': { w: 1, h: 1 },
  '9:16': { w: 9, h: 16 },
  '4:3': { w: 4, h: 3 },
  '3:4': { w: 3, h: 4 },
};

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ label, value, options, onChange }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-indigo-700 mb-2">
        {label}
      </label>
      <div className="grid grid-cols-5 gap-2">
        {options.map((option) => {
          const isSelected = value === option;
          const { w, h } = ratioDimensions[option];
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 ${
                isSelected
                  ? 'bg-indigo-50 border-orange-400 shadow-sm'
                  : 'bg-white/40 border-slate-200 hover:border-indigo-300 hover:bg-white/60'
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-center h-8 w-8 mb-1">
                <div
                  className={`rounded-sm transition-colors ${isSelected ? 'bg-indigo-600' : 'bg-slate-400'}`}
                  style={{ 
                    width: `${(w / Math.max(w, h)) * 24}px`, 
                    height: `${(h / Math.max(w, h)) * 24}px` 
                  }}
                />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};