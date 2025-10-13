import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Eye, Loader2 } from 'lucide-react';
import { api } from '../../api';

const QuestionImageUpload = ({ value, onChange, onRemove }) => {
  const [preview, setPreview] = useState(value || '');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const maxSizeMB = 5; // 5MB limit for uploaded files

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.url; // Returns something like "/uploads/questions/question-123456789.jpg"
  };

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`Image must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    
    try {
      // Create preview URL immediately
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // Upload the file and get the server URL
      const imageUrl = await uploadImage(file);
      
      // Pass the server URL to the parent component
      onChange(imageUrl);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
      // Reset preview on error
      setPreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setUploading(false);
    }
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

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeImage = async () => {
    // If we have a server-stored image, try to delete it
    if (value && !value.startsWith('blob:') && !value.startsWith('data:')) {
      try {
        const filename = value.split('/').pop();
        await api.delete(`/uploads/${filename}`);
      } catch (error) {
        console.error('Failed to delete image from server:', error);
        // Continue with removal anyway
      }
    }
    
    // Clean up blob URL if it exists
    if (preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    
    setPreview('');
    onRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Use the actual image URL for preview if available, otherwise use the preview blob
  const displayUrl = preview || value;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Question Image
      </label>
      
      {preview ? (
        <div className="space-y-2">
          <div className="relative inline-block">
            <img
              src={displayUrl}
              alt="Question preview"
              className="max-w-full max-h-48 rounded-lg border border-gray-300 shadow-sm"
                crossOrigin="anonymous"
              onError={(e) => {
                // If image fails to load, try without the base URL
                if (displayUrl.includes('http')) {
                  e.target.src = value;
                }
              }}
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                type="button"
                onClick={() => window.open(displayUrl, '_blank')}
                className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                title="View full size"
              >
                <Eye className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={removeImage}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Image added to question. Respondents will see this image above the question text.
          </p>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } cursor-pointer relative`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="mx-auto h-8 w-8 text-blue-500 mb-2 animate-spin" />
              <p className="text-sm text-blue-600">Uploading image...</p>
            </div>
          ) : (
            <>
              <ImageIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Drag and drop an image, or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Maximum file size: {maxSizeMB}MB • Recommended: 800x400px
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionImageUpload;