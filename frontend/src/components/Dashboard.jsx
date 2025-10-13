// Dashboard.jsx - Updated with proper role-based permissions
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, FileText, Users, BarChart3, Calendar, ArrowRight, Sparkles, Share2, Edit, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api";

export default function Dashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const res = await api.get("/forms");
      setForms(res.data.forms || []);
    } catch (err) {
      console.error("Error fetching forms:", err);
    } finally {
      setLoading(false);
    }
  };

  const gradients = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-blue-500",
    "from-rose-500 to-pink-500",
  ];

  const getGradient = (index) => gradients[index % gradients.length];

  // Check if user can edit a form (owner or editor collaborator)
  const canEditForm = (form) => {
    if (!user) return false;
    
    // User is the owner
    if (form.created_by === user.id) return true;
    
    // User is a collaborator with editor role
    if (form.collaborator_role === 'editor') return true;
    
    // Fallback for legacy is_collaborator field
    if (form.is_collaborator && form.collaborator_role !== 'viewer') return true;
    
    return false;
  };

  // Check if user is the owner of a form
  const isFormOwner = (form) => {
    if (!user) return false;
    return form.created_by === user.id;
  };

  // Check if user is a collaborator (any role)
  const isCollaborator = (form) => {
    if (!user) return false;
    return form.collaborator_role || form.is_collaborator;
  };

  // Get collaborator role display
  const getCollaboratorRole = (form) => {
    if (isFormOwner(form)) return "Owner";
    if (form.collaborator_role === 'editor') return "Editor";
    if (form.collaborator_role === 'viewer') return "Viewer";
    if (form.is_collaborator) return "Collaborator"; // fallback
    return null;
  };

  // Delete form function (owners only)
  const handleDeleteForm = async (formId, formTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${formTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await api.delete(`/forms/${formId}`);
      setForms(forms.filter(form => form.id !== formId));
    } catch (err) {
      console.error("Error deleting form:", err);
      alert("Error deleting form: " + (err.response?.data?.error || 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gradient-to-r from-blue-300 to-purple-300 rounded-2xl w-48"></div>
          <div className="h-6 bg-gray-300 rounded-lg w-64"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-200 via-purple-100 to-pink-200 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg animate-blob animation-delay-2000" />
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                My Forms
              </h1>
            </div>
            <p className="text-lg text-slate-600 font-medium">
              Create and manage your stunning forms
            </p>
          </div>

          <Link
            to="/forms/new"
            className="relative inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <Plus className="h-5 w-5 mr-3" />
            New Form
            <span className="absolute inset-0 rounded-2xl bg-white/20 transform group-hover:scale-110 transition-transform" />
          </Link>
        </div>

        {/* Empty State */}
        {forms.length === 0 ? (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="relative mb-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-100 to-purple-100 rounded-3xl shadow-soft flex items-center justify-center animate-blob"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-blob animation-delay-4000">
                  <Plus className="h-4 w-4 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-3">No forms yet</h3>
              <p className="text-slate-600 text-lg mb-8">
                Start collecting responses with your first stunning form.
              </p>
              <Link
                to="/forms/new"
                className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <Plus className="h-5 w-5 mr-3" />
                Create Your First Form
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </div>
          </div>
        ) : (
          /* Forms Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {forms.map((form, idx) => {
              const stats = {
                responses: form.response_count || 0,
                completionRate: form.completion_rate || 0,
                lastResponse: form.last_response ? new Date(form.last_response) : null,
              };

              const canEdit = canEditForm(form);
              const isOwner = isFormOwner(form);
              const collaboratorRole = getCollaboratorRole(form);
              const isCollaborator = collaboratorRole && !isOwner;

              return (
                <div
                  key={form.id}
                  className="group relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-white/50 transform hover:-translate-y-2 transition-all duration-300"
                >
                  <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${getGradient(idx)} rounded-t-2xl`} />
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-800 mb-3 line-clamp-2 group-hover:text-slate-900">
                          {form.title}
                        </h3>
                        <p className="text-slate-600 text-sm line-clamp-2">
                          {form.description || "No description provided"}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {isOwner && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              Owner
                            </span>
                          )}
                          {isCollaborator && (
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              collaboratorRole === 'editor' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {collaboratorRole}
                            </span>
                          )}
                          {form.is_locked && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              Locked
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={`p-3 bg-gradient-to-br ${getGradient(idx)} rounded-xl shadow-md flex-shrink-0`}>
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="flex items-center p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <Users className="h-4 w-4 text-blue-500 mr-2" />
                        <div>
                          <div className="text-sm font-semibold text-blue-700">{stats.responses}</div>
                          <div className="text-xs text-blue-600/70">Responses</div>
                        </div>
                      </div>
                      <div className="flex items-center p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                        <BarChart3 className="h-4 w-4 text-purple-500 mr-2" />
                        <div>
                          <div className="text-sm font-semibold text-purple-700">{stats.completionRate}%</div>
                          <div className="text-xs text-purple-600/70">Complete</div>
                        </div>
                      </div>
                    </div>

                    {/* Last Response */}
                    <div className="flex items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100 mb-6">
                      <Calendar className="h-4 w-4 text-slate-500 mr-2" />
                      <div className="text-sm text-slate-600">
                        {stats.responses > 0 ? (
                          stats.lastResponse ? (
                            <>Last response <span className="font-semibold text-slate-700">{new Date(stats.lastResponse).toLocaleDateString()}</span></>
                          ) : (
                            <span className="text-slate-500">{stats.responses} responses</span>
                          )
                        ) : (
                          <span className="text-slate-500">No responses yet</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      <div className="flex gap-3">
                        <Link
                          to={`/forms/${form.id}`}
                          className="flex-1 text-center px-4 py-3 text-sm font-semibold text-blue-600 hover:text-blue-700 border-2 border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200"
                        >
                          View Form
                        </Link>
                        <Link
                          to={`/forms/${form.id}/responses`}
                          className="flex-1 text-center px-4 py-3 text-sm font-semibold text-slate-600 hover:text-slate-800 border-2 border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50/50 transition-all duration-200"
                        >
                          Responses
                        </Link>
                      </div>
                      
                      <div className="flex gap-3">
                        {/* Edit Button - Only show for owners and editors */}
                        {canEdit && (
                          <Link
                            to={`/forms/${form.id}/edit`}
                            className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-semibold text-green-600 hover:text-green-700 border-2 border-green-200 rounded-xl hover:border-green-300 hover:bg-green-50/50 transition-all duration-200"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        )}
                        
                        {/* Share Button */}
                        <Link
                          to={`/forms/${form.id}/share`}
                          className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-semibold text-purple-600 hover:text-purple-700 border-2 border-purple-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 transition-all duration-200"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Link>
                      </div>
                      
                      <div className="flex gap-3">
                        {/* Collaborators Button - Only show for owners */}
                        {isOwner && (
                          <Link
                            to={`/forms/${form.id}/collaborators`}
                            className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-semibold text-orange-600 hover:text-orange-700 border-2 border-orange-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-200"
                          >
                            <Users className="h-4 w-4 mr-2" />
                            Collaborators
                          </Link>
                        )}
                        
                        {/* Delete Button - Only show for owners */}
                        {isOwner && (
                          <button
                            onClick={() => handleDeleteForm(form.id, form.title)}
                            disabled={deleting}
                            className="flex-1 flex items-center justify-center px-4 py-3 text-sm font-semibold text-red-600 hover:text-red-700 border-2 border-red-200 rounded-xl hover:border-red-300 hover:bg-red-50/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleting ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}