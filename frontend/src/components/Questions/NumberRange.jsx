import React, { useState, useEffect } from 'react';
import { Settings, Minus, Plus } from 'lucide-react';

const NumberRange = ({ 
  value, 
  onChange, 
  required, 
  disabled,
  min = 0,
  max = 100,
  step = 1,
  showRangeSettings = false 
}) => {
  const [rangeSettings, setRangeSettings] = useState({
    min: parseInt(min),
    max: parseInt(max),
    step: parseInt(step)
  });

  const generateOptions = () => {
    const options = [];
    for (let i = rangeSettings.min; i <= rangeSettings.max; i += rangeSettings.step) {
      options.push(i);
    }
    return options;
  };

  const options = generateOptions();

  const handleRangeChange = (field, newValue) => {
    const numValue = parseInt(newValue);
    if (isNaN(numValue)) return;

    const updated = { ...rangeSettings, [field]: numValue };
    setRangeSettings(updated);
    
    // Regenerate options and reset value if current value is invalid
    const newOptions = generateOptions();
    if (!newOptions.includes(parseInt(value))) {
      onChange('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Range Settings (for form builder) */}
      {showRangeSettings && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Settings className="h-4 w-4" />
            Range Settings
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Min</label>
              <input
                type="number"
                value={rangeSettings.min}
                onChange={(e) => handleRangeChange('min', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Max</label>
              <input
                type="number"
                value={rangeSettings.max}
                onChange={(e) => handleRangeChange('max', e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Step</label>
              <input
                type="number"
                value={rangeSettings.step}
                onChange={(e) => handleRangeChange('step', e.target.value)}
                min="1"
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Generated numbers: {options.join(', ')}
          </div>
        </div>
      )}

      {/* Number Input */}
      <div className="flex items-center gap-3">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className="flex-1 border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="">Select a number</option>
          {options.map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
        
        {/* Quick increment/decrement buttons */}
        {!disabled && (
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                const current = parseInt(value) || rangeSettings.min;
                const next = Math.min(current + rangeSettings.step, rangeSettings.max);
                if (next <= rangeSettings.max) onChange(next.toString());
              }}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const current = parseInt(value) || rangeSettings.min;
                const prev = Math.max(current - rangeSettings.step, rangeSettings.min);
                if (prev >= rangeSettings.min) onChange(prev.toString());
              }}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NumberRange;