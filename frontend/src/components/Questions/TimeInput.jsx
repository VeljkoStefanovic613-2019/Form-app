import React from 'react';
import { Clock } from 'lucide-react';

const TimeInput = ({ value, onChange, required, disabled }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <input
        type="time"
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 pl-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
    </div>
  );
};

export default TimeInput;