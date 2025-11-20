import React from 'react';

interface CustomSelectProps<T extends string> {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  id: string;
}

export const CustomSelect = <T extends string,>({ label, value, options, onChange, id }: CustomSelectProps<T>) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-indigo-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="appearance-none w-full bg-white/60 border border-slate-300 rounded-lg shadow-sm py-2.5 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition hover:border-indigo-300 hover:bg-white"
        >
          {options.map((option) => (
            <option key={option} value={option} className="bg-white text-slate-800">
              {option}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
};