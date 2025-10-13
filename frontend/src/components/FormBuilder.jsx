import React, { useState, useEffect } from "react";
import QuestionImageUpload from './Questions/QuestionImageUpload';
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft, GripVertical, Copy, Settings, Minus, Plus as PlusIcon } from "lucide-react";
import { api } from "../api";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const questionTypes = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "radio", label: "Multiple Choice" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "select", label: "Dropdown" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "number_range", label: "Number Range" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "image", label: "Image Upload" },
];

// Number Range Settings Component
const NumberRangeSettings = ({ question, updateQuestion, index }) => {
  const [settings, setSettings] = useState({
    min: question.options?.[0] || 0,
    max: question.options?.[1] || 100,
    step: question.options?.[2] || 1
  });

  const handleSettingChange = (field, value) => {
    const numValue = parseInt(value);
    if (isNaN(numValue)) return;

    const newSettings = { ...settings, [field]: numValue };
    setSettings(newSettings);
    
    // Update the question options with the new settings
    updateQuestion(index, "options", [newSettings.min, newSettings.max, newSettings.step]);
  };

  const generateOptions = () => {
    const options = [];
    for (let i = settings.min; i <= settings.max; i += settings.step) {
      options.push(i);
    }
    return options;
  };

  const options = generateOptions();

  return (
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
            value={settings.min}
            onChange={(e) => handleSettingChange('min', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Max</label>
          <input
            type="number"
            value={settings.max}
            onChange={(e) => handleSettingChange('max', e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Step</label>
          <input
            type="number"
            value={settings.step}
            onChange={(e) => handleSettingChange('step', e.target.value)}
            min="1"
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Generated numbers: {options.join(', ')}
      </div>
    </div>
  );
};

// Sortable Question Component
const SortableQuestion = ({ 
  question, 
  index, 
  updateQuestion, 
  removeQuestion, 
  cloneQuestion,
  addOption, 
  updateOption, 
  removeOption, 
  needsOptions 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 rounded-lg p-4 bg-white shadow-sm ${
        isDragging ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1 space-y-4">
          <input
            type="text"
            required
            value={question.text}
            onChange={(e) => updateQuestion(index, "text", e.target.value)}
            placeholder={`Question ${index + 1}`}
            className="block w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          <QuestionImageUpload
            value={question.image_url}
            onChange={(imageData) => updateQuestion(index, "image_url", imageData)}
            onRemove={() => updateQuestion(index, "image_url", "")}
          />
          <div className="grid grid-cols-2 gap-4">
            <select
              value={question.type}
              onChange={(e) => updateQuestion(index, "type", e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {questionTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`required-${index}`}
                checked={question.is_required}
                onChange={(e) =>
                  updateQuestion(index, "is_required", e.target.checked)
                }
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor={`required-${index}`} className="ml-2 text-sm text-gray-700">
                Required
              </label>
            </div>
          </div>

          {/* Number Range Settings */}
          {question.type === "number_range" && (
            <NumberRangeSettings
              question={question}
              updateQuestion={updateQuestion}
              index={index}
            />
          )}

          {/* Options for radio, checkbox, select */}
          {needsOptions(question.type) && question.type !== "number_range" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Options</label>
              {(question.options || []).map((option, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, optIndex, e.target.value)}
                    placeholder={`Option ${optIndex + 1}`}
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(index, optIndex)}
                    className="p-2 text-red-600 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(index)}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </button>
            </div>
          )}

          {/* Image Upload Settings */}
          {question.type === "image" && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Settings className="h-4 w-4" />
                Image Settings
              </div>
              <div className="text-xs text-gray-500">
                Users will be able to upload images up to 5MB in size.
                Supported formats: JPG, PNG, GIF, WebP
              </div>
            </div>
          )}

          {/* Time Input Info */}
          {question.type === "time" && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Settings className="h-4 w-4" />
                Time Input
              </div>
              <div className="text-xs text-gray-500">
                Users will see a native time picker to select a specific time.
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          {/* ✅ NEW: Clone Question Button */}
          <button
            type="button"
            onClick={() => cloneQuestion(index)}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            title="Clone question"
          >
            <Copy className="h-4 w-4" />
          </button>
          
          {/* Delete Question Button */}
          <button
            type="button"
            onClick={() => removeQuestion(index)}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="Delete question"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const FormBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [form, setForm] = useState({
    title: "",
    description: "",
    allow_unauthenticated: false,
    questions: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isEditing) fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/forms/${id}`);
      setForm(response.data);
    } catch (error) {
      console.error("Error fetching form:", error);
      alert("Error loading form");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(), // Use numeric ID
      text: "",
      type: "text",
      is_required: false,
      options: [],
      order_index: form.questions.length,
    };
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  // ✅ NEW: Clone Question Function
  const cloneQuestion = (index) => {
    const questionToClone = form.questions[index];
    const clonedQuestion = {
      ...questionToClone,
      id: Date.now(), // New unique ID
      text: `${questionToClone.text} (Copy)`, // Append "Copy" to text
      order_index: form.questions.length, // Place at the end
    };

    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions.slice(0, index + 1),
        clonedQuestion,
        ...prev.questions.slice(index + 1)
      ],
    }));
  };

  const updateQuestion = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i === index) {
          const updated = { ...q, [field]: value };
          
          // Set default settings for number_range
          if (field === 'type' && value === 'number_range') {
            updated.options = [0, 100, 1]; // [min, max, step]
          }
          
          // Clear options for types that don't need them
          if (field === 'type' && !needsOptions(value)) {
            updated.options = [];
          }
          
          return updated;
        }
        return q;
      }),
    }));
  };

  const removeQuestion = (index) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const addOption = (questionIndex) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: [...(q.options || []), ""] }
          : q
      ),
    }));
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: (q.options || []).map((opt, j) =>
                j === optionIndex ? value : opt
              ),
            }
          : q
      ),
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: (q.options || []).filter((_, j) => j !== optionIndex) }
          : q
      ),
    }));
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      setForm((prev) => {
        const oldIndex = prev.questions.findIndex((q) => q.id === active.id);
        const newIndex = prev.questions.findIndex((q) => q.id === over.id);

        return {
          ...prev,
          questions: arrayMove(prev.questions, oldIndex, newIndex),
        };
      });
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setSaving(true);
  try {
    // Debug: Check if images are present before sending
    console.log('Questions before sending:', form.questions.map(q => ({
      text: q.text,
      hasImage: !!q.image_url,
      imageType: q.image_url ? (q.image_url.startsWith('data:') ? 'base64' : 'url') : 'none'
    })));

    // Ensure proper data structure for questions
    const formData = {
      title: form.title.trim(),
      description: form.description?.trim() || '',
      allow_unauthenticated: form.allow_unauthenticated || false,
      questions: form.questions.map((q, index) => {
        const questionData = {
          text: q.text.trim(),
          type: q.type,
          is_required: q.is_required || false,
          order_index: index,
          image_url: q.image_url || null, // This is now a server URL, not base64
        };
        
        // Handle options for different question types
        if (["radio", "checkbox", "select"].includes(q.type)) {
          // Filter out empty options for choice-based questions
          questionData.options = (q.options || []).filter(opt => opt && opt.trim() !== '');
        } else if (q.type === "number_range") {
          // Store number range settings as options [min, max, step]
          questionData.options = q.options || [0, 100, 1];
        } else {
          questionData.options = []; // Always include options as empty array
        }
        
        return questionData;
      }),
    };
    
    console.log('Sending form data:', JSON.stringify(formData, null, 2));
    
    let response;
    if (isEditing) {
      response = await api.put(`/forms/${id}`, formData);
    } else {
      response = await api.post(`/forms`, formData);
    }
    
    // If we get a successful response, navigate to dashboard
    navigate("/dashboard");
  } catch (error) {
    console.error("Error saving form:", error);
    console.error("Error response:", error.response?.data);
    alert("Error saving form: " + (error.response?.data?.error || 'Unknown error'));
  } finally {
    setSaving(false);
  }
};

  const needsOptions = (type) => ["radio", "checkbox", "select", "number_range"].includes(type);

  const activeQuestion = form.questions.find((q) => q.id === activeId);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-200 via-purple-100 to-pink-200 p-6 overflow-hidden">
      {/* Floating blobs */}
      <div className="absolute top-0 -left-16 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-20 -right-16 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-20 w-72 h-72 bg-green-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative max-w-4xl w-full bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 p-8 z-10">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? "Edit Form" : "Create New Form"}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Form Settings */}
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Form Settings</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Form Title *
                </label>
                <input
                  type="text"
                  id="title"
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter form title"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter form description"
                  className="mt-1 block w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allow_unauthenticated"
                  checked={form.allow_unauthenticated}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, allow_unauthenticated: e.target.checked }))
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allow_unauthenticated" className="ml-2 text-sm text-gray-700">
                  Allow unauthenticated responses
                </label>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Questions</h2>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </button>
            </div>

            <div className="space-y-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext items={form.questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                  {form.questions.map((question, index) => (
                    <SortableQuestion
                      key={question.id}
                      question={question}
                      index={index}
                      updateQuestion={updateQuestion}
                      removeQuestion={removeQuestion}
                      cloneQuestion={cloneQuestion} // ✅ NEW: Pass clone function
                      addOption={addOption}
                      updateOption={updateOption}
                      removeOption={removeOption}
                      needsOptions={needsOptions}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    <div className="border-2 border-blue-500 rounded-lg p-4 bg-white shadow-lg opacity-80">
                      <div className="flex items-start space-x-3">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-gray-700 font-medium">
                            {form.questions.find(q => q.id === activeId)?.text || "Question"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>

              {form.questions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No questions yet. Click "Add Question" to start.
                </div>
              )}
            </div>

            {form.questions.length > 0 && (
              <div className="mt-4 text-sm text-gray-500 flex items-center">
                <GripVertical className="h-4 w-4 mr-2" />
                Drag the grip icon to reorder questions
                <span className="mx-2">•</span>
                <Copy className="h-4 w-4 mr-1" />
                Click the copy icon to clone questions
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || form.questions.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 inline-block mr-2" />
              {saving ? "Saving..." : isEditing ? "Update Form" : "Create Form"}
            </button>
          </div>
        </form>
      </div>

      {/* Blob animation styles */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default FormBuilder;