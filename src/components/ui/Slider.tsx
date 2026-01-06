import React from 'react';
import { Info } from 'lucide-react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  tooltip?: string;
  showValue?: boolean;
  unit?: string;
  valueFormatter?: (value: number) => string;
  fullWidth?: boolean;
}

export function Slider({
  label,
  helperText,
  tooltip,
  showValue = true,
  unit = '',
  valueFormatter,
  fullWidth = true,
  value,
  className = '',
  ...props
}: SliderProps) {
  const widthClass = fullWidth ? 'w-full' : '';
  const displayValue = valueFormatter 
    ? valueFormatter(Number(value) || 0)
    : `${value}${unit}`;
  
  return (
    <div className={`${widthClass} ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && (
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-slate-300">
                {label}
              </label>
              {tooltip && (
                <div className="group relative">
                  <Info className="w-4 h-4 text-slate-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 z-10">
                    {tooltip}
                  </div>
                </div>
              )}
            </div>
          )}
          {showValue && (
            <span className="text-sm font-semibold text-blue-400">
              {displayValue}
            </span>
          )}
        </div>
      )}
      
      <input
        type="range"
        value={value}
        className={`${widthClass} h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-4
          [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-blue-500
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:hover:bg-blue-600
          [&::-webkit-slider-thumb]:transition-colors
          [&::-moz-range-thumb]:w-4
          [&::-moz-range-thumb]:h-4
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-blue-500
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer
          [&::-moz-range-thumb]:hover:bg-blue-600
          [&::-moz-range-thumb]:transition-colors
        `}
        {...props}
      />
      
      {helperText && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}