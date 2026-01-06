import React from 'react';
import { Info } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  tooltip?: string;
  fullWidth?: boolean;
}

export function Input({
  label,
  helperText,
  error,
  tooltip,
  fullWidth = true,
  className = '',
  ...props
}: InputProps) {
  const widthClass = fullWidth ? 'w-full' : '';
  const errorClass = error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500';
  
  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <div className="flex items-center gap-2 mb-2">
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
      
      <input
        className={`${widthClass} px-4 py-2 bg-slate-800 border ${errorClass} rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-all`}
        {...props}
      />
      
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
}

export function Textarea({
  label,
  helperText,
  error,
  fullWidth = true,
  className = '',
  ...props
}: TextareaProps) {
  const widthClass = fullWidth ? 'w-full' : '';
  const errorClass = error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-blue-500';
  
  return (
    <div className={`${widthClass} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      
      <textarea
        className={`${widthClass} px-4 py-2 bg-slate-800 border ${errorClass} rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-all`}
        {...props}
      />
      
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}