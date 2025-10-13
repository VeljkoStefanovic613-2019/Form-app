// FormView.jsx - Complete updated version
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api"; // Import your custom API instance
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Edit, Settings, BarChart3 } from "lucide-react";
import TimeInput from "./Questions/TimeInput";
import NumberRange from "./Questions/NumberRange";
import ImageUpload from "./Questions/ImageUpload";
import AnswerImageUpload from "./Questions/AnswerImageUpload"; // NEW IMPORT

const FormView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [answerImages, setAnswerImages] = useState({}); // NEW STATE
  const [error, setError] = useState("");
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [id, user]);

  const fetchForm = async () => {
    try {
      const response = await api.get(`/forms/${id}`);
      setForm(response.data);
      setCanEdit(response.data.can_edit || false);

      const initialAnswers = {};
      const initialImages = {}; // NEW: Initialize images state
      response.data.questions.forEach((question) => {
        if (question.type === "checkbox") {
          initialAnswers[question.id] = [];
        } else {
          initialAnswers[question.id] = "";
        }
        initialImages[question.id] = ""; // Initialize empty images for all questions
      });
      setAnswers(initialAnswers);
      setAnswerImages(initialImages); // NEW: Set images state
    } catch (error) {
      console.error("Error fetching form:", error);
      
      // ✅ BETTER ERROR HANDLING: Show specific messages for auth issues
      if (error.response?.status === 401) {
        setError("This form requires authentication. Please log in to access it.");
      } else if (error.response?.status === 404) {
        setError("Form not found or has been deleted.");
      } else {
        setError("Error loading form. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditForm = () => {
    navigate(`/forms/${id}/edit`);
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // NEW: Image change handler
  const handleImageChange = (questionId, imageData) => {
    setAnswerImages((prev) => ({ ...prev, [questionId]: imageData }));
  };

  const handleCheckboxChange = (questionId, option, isChecked) => {
    setAnswers((prev) => {
      const currentAnswers = prev[questionId] || [];
      return {
        ...prev,
        [questionId]: isChecked
          ? [...currentAnswers, option]
          : currentAnswers.filter((item) => item !== option),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const missingRequired = form.questions.filter(
      (q) =>
        q.is_required &&
        (!answers[q.id] ||
          (Array.isArray(answers[q.id]) && answers[q.id].length === 0))
    );

    if (missingRequired.length > 0) {
      setError("Please fill in all required questions");
      setSubmitting(false);
      return;
    }

    try {
      const answersData = form.questions.map((question) => {
        const answerData = {
          questionId: question.id,
          answerText: "",
          answerOptions: null,
          answerImage: answerImages[question.id] || "", // NEW: Include image data
        };

        // Handle different question types
        if (["radio", "select", "text", "textarea", "email", "number", "date", "time"].includes(question.type)) {
          answerData.answerText = answers[question.id] || "";
        } else if (question.type === "checkbox") {
          answerData.answerOptions = answers[question.id] || null;
        } else if (question.type === "number_range") {
          answerData.answerText = answers[question.id] || "";
        } else if (question.type === "image") {
          answerData.answerText = answers[question.id] || ""; // Store base64 image data
        }

        return answerData;
      });

      await api.post(`/forms/${id}/responses`, {
        answers: answersData,
      });

      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting form:", error);
      setError(error.response?.data?.error || "Error submitting form");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-200 via-purple-100 to-pink-200 px-4">
        <div className="animate-pulse space-y-4 max-w-2xl w-full p-8 bg-white/50 backdrop-blur-lg rounded-3xl shadow-xl">
          <div className="h-10 bg-gray-300 rounded w-3/4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-6 bg-gray-300 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-200 via-purple-100 to-pink-200 px-4">
        <div className="max-w-2xl w-full bg-white/70 backdrop-blur-lg rounded-3xl shadow-lg border border-white/30 p-8">
          <div className="flex items-center gap-2 bg-red-50 p-4 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-200 via-purple-100 to-pink-200 px-4">
        <div className="max-w-2xl w-full bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            Your response has been recorded successfully.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-2xl shadow-lg text-white bg-gradient-to-r from-green-400 to-blue-500 hover:shadow-xl transform hover:-translate-y-1 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-200 via-purple-100 to-pink-200 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 p-8">
        {/* Header with Edit Button */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </button>
          
          {canEdit && (
            <div className="flex gap-2">
              <Link
                to={`/forms/${id}/responses`}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Responses
              </Link>
              <button
                onClick={handleEditForm}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Form
              </button>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-gray-600 mb-4">{form.description}</p>
          )}
          {form.is_locked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <span className="text-yellow-800 text-sm">
                This form is locked and not accepting responses.
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {form.questions.map((question) => (
            <div
              key={question.id}
              className="bg-white rounded-lg shadow p-6 border border-gray-200"
            >
              <label className="block text-lg font-medium text-gray-900 mb-2">
                {question.text}
                {question.is_required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              
              {/* Question image display */}
              {question.image_url && (
                <div className="mb-4">
                  <img
                    src={question.image_url}
                    alt="Question illustration"
                    className="max-w-full max-h-64 rounded-lg border border-gray-200 shadow-sm"
                  />
                </div>
              )}
              
              {question.description && (
                <p className="text-gray-500 text-sm mb-3">
                  {question.description}
                </p>
              )}

              {/* Text Input with Image Upload */}
              {question.type === "text" && (
                <div>
                  <input
                    type="text"
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required={question.is_required}
                    maxLength={512}
                  />
                  <AnswerImageUpload
                    value={answerImages[question.id] || ""}
                    onChange={(value) => handleImageChange(question.id, value)}
                    disabled={form.is_locked}
                  />
                </div>
              )}

              {/* Textarea with Image Upload */}
              {question.type === "textarea" && (
                <div>
                  <textarea
                    rows={4}
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required={question.is_required}
                    maxLength={4096}
                  />
                  <AnswerImageUpload
                    value={answerImages[question.id] || ""}
                    onChange={(value) => handleImageChange(question.id, value)}
                    disabled={form.is_locked}
                  />
                </div>
              )}

              {/* Email Input with Image Upload */}
              {question.type === "email" && (
                <div>
                  <input
                    type="email"
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required={question.is_required}
                  />
                  <AnswerImageUpload
                    value={answerImages[question.id] || ""}
                    onChange={(value) => handleImageChange(question.id, value)}
                    disabled={form.is_locked}
                  />
                </div>
              )}

              {/* Number Input with Image Upload */}
              {question.type === "number" && (
                <div>
                  <input
                    type="number"
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required={question.is_required}
                  />
                  <AnswerImageUpload
                    value={answerImages[question.id] || ""}
                    onChange={(value) => handleImageChange(question.id, value)}
                    disabled={form.is_locked}
                  />
                </div>
              )}

              {/* Number Range with Image Upload */}
              {question.type === "number_range" && (
                <div>
                  <NumberRange
                    value={answers[question.id] || ""}
                    onChange={(value) => handleAnswerChange(question.id, value)}
                    required={question.is_required}
                    min={question.options?.[0] || 0}
                    max={question.options?.[1] || 100}
                    step={question.options?.[2] || 1}
                  />
                  <AnswerImageUpload
                    value={answerImages[question.id] || ""}
                    onChange={(value) => handleImageChange(question.id, value)}
                    disabled={form.is_locked}
                  />
                </div>
              )}

              {/* Date Input with Image Upload */}
              {question.type === "date" && (
                <div>
                  <input
                    type="date"
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required={question.is_required}
                  />
                  <AnswerImageUpload
                    value={answerImages[question.id] || ""}
                    onChange={(value) => handleImageChange(question.id, value)}
                    disabled={form.is_locked}
                  />
                </div>
              )}

              {/* Time Input with Image Upload */}
              {question.type === "time" && (
                <div>
                  <TimeInput
                    value={answers[question.id] || ""}
                    onChange={(value) => handleAnswerChange(question.id, value)}
                    required={question.is_required}
                  />
                  <AnswerImageUpload
                    value={answerImages[question.id] || ""}
                    onChange={(value) => handleImageChange(question.id, value)}
                    disabled={form.is_locked}
                  />
                </div>
              )}

              {/* Image Upload Question (special case) */}
              {question.type === "image" && (
                <ImageUpload
                  value={answers[question.id] || ""}
                  onChange={(value) => handleAnswerChange(question.id, value)}
                  required={question.is_required}
                />
              )}

              {/* Radio Buttons with Image Upload */}
              {question.type === "radio" && (
                <div>
                  <div className="space-y-2">
                    {question.options?.map((option, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="radio"
                          id={`${question.id}-${index}`}
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) =>
                            handleAnswerChange(question.id, e.target.value)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          required={question.is_required}
                        />
                        <label
                          htmlFor={`${question.id}-${index}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  <AnswerImageUpload
                    value={answerImages[question.id] || ""}
                    onChange={(value) => handleImageChange(question.id, value)}
                    disabled={form.is_locked}
                  />
                </div>
              )}

              {/* Checkboxes with Image Upload */}
              {question.type === "checkbox" && (
                <div>
                  <div className="space-y-2">
                    {question.options?.map((option, index) => (
                      <div key={index} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`${question.id}-${index}`}
                          value={option}
                          checked={(answers[question.id] || []).includes(option)}
                          onChange={(e) =>
                            handleCheckboxChange(
                              question.id,
                              option,
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`${question.id}-${index}`}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {option}
                        </label>
                      </div>
                    ))}
                  </div>
                  <AnswerImageUpload
                    value={answerImages[question.id] || ""}
                    onChange={(value) => handleImageChange(question.id, value)}
                    disabled={form.is_locked}
                  />
                </div>
              )}

              {/* Dropdown Select with Image Upload */}
              {question.type === "select" && (
                <div>
                  <select
                    value={answers[question.id] || ""}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className="block w-full border border-gray-300 rounded-xl shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required={question.is_required}
                  >
                    <option value="">Select an option</option>
                    {question.options?.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <AnswerImageUpload
                    value={answerImages[question.id] || ""}
                    onChange={(value) => handleImageChange(question.id, value)}
                    disabled={form.is_locked}
                  />
                </div>
              )}
            </div>
          ))}

          {!form.is_locked && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-2xl shadow-lg text-white bg-gradient-to-r from-green-400 to-blue-500 hover:shadow-xl transform hover:-translate-y-1 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submit Response"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FormView;