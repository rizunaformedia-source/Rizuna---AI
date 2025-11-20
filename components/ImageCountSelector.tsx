import React from 'react';

interface ImageCountSelectorProps {
  label: string;
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export const ImageCountSelector: React.FC<ImageCountSelectorProps> = ({ label, value, max, onChange }) => {
  const options = Array.from({ length: max }, (_, i) => i + 1);

  return (
    <div>
      <label className="block text-sm font-medium text-indigo-700 mb-2">
        {label}
      </label>
      <div className={`grid grid-cols-4 gap-2`}>
        {options.map((option) => {
          const isSelected = value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-200 h-14 ${
                isSelected
                  ? 'bg-indigo-50 border-orange-400 shadow-sm'
                  : 'bg-white/40 border-slate-200 hover:border-indigo-300 hover:bg-white/60'
              }`}
              aria-pressed={isSelected}
            >
              <span className={`text-xl font-bold transition-colors ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};