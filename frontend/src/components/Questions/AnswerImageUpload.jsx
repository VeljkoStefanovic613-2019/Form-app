// components/Questions/AnswerImageUpload.jsx
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Paperclip } from 'lucide-react';

const AnswerImageUpload = ({ value, onChange, disabled, maxSizeMB = 2 }) => {
  const [preview, setPreview] = useState(value || '');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileSelect = (file) => {
    if (!file) return;

    setError('');
    setUploading(true);

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, GIF, WebP, etc.)');
      setUploading(false);
      return;
    }

    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      setUploading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setPreview(base64);
      onChange(base64);
      setUploading(false);
    };
    
    reader.onerror = () => {
      setError('Error reading file. Please try again with a different image.');
      setUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const removeImage = () => {
    setPreview('');
    setError('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {/* Image Preview */}
      {preview ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 flex items-center">
              <Paperclip className="h-4 w-4 mr-2 text-blue-500" />
              Attached Image
            </p>
            {!disabled && (
              <button
                type="button"
                onClick={removeImage}
                className="inline-flex items-center px-2 py-1 text-xs text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </button>
            )}
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <img
              src={preview}
              alt="Attached to answer"
              className="max-w-full max-h-48 rounded-lg mx-auto shadow-sm"
            />
          </div>
        </div>
      ) : (
        /* Upload Button - Compact version */
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className={`inline-flex items-center px-3 py-1.5 text-xs border rounded-lg transition-colors ${
              disabled || uploading
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
          >
            {uploading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Paperclip className="h-3 w-3 mr-1" />
            )}
            {uploading ? 'Uploading...' : 'Add Image'}
          </button>
          
          <span className="text-xs text-gray-500">
            Optional image attachment
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={disabled || uploading}
            className="hidden"
          />
        </div>
      )}

      {/* Drag & Drop Area (hidden until needed) */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-transparent'
        } ${preview ? 'hidden' : ''}`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
      >
        <p className="text-xs text-gray-500">
          Or drag & drop an image here
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-xs text-red-700 flex items-center">
            <X className="h-3 w-3 mr-1 flex-shrink-0" />
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnswerImageUpload;