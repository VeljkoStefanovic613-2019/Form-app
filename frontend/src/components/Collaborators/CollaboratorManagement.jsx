import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Users, Plus, AlertCircle } from 'lucide-react';
import CollaboratorList from './CollaboratorList';
import AddCollaboratorModal from './AddCollaboratorModal';

const CollaboratorManagement = () => {
  const { id } = useParams();
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(null);

  useEffect(() => {
    fetchCollaborators();
    fetchForm();
  }, [id]);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/forms/${id}/collaborators`);
      setCollaborators(response.data.collaborators || []);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      setError('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  const fetchForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${id}`);
      setForm(response.data);
    } catch (error) {
      console.error('Error fetching form:', error);
    }
  };

  const handleAddCollaborator = async (email, role) => {
    try {
      const response = await axios.post(`/api/forms/${id}/collaborators`, {
        collaborator_email: email,
        role: role
      });

      setCollaborators(prev => [...prev, response.data.collaborator]);
      setShowAddModal(false);
      setError('');
    } catch (error) {
      console.error('Error adding collaborator:', error);
      setError(error.response?.data?.error || 'Failed to add collaborator');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) {
      return;
    }

    try {
      await axios.delete(`/api/forms/${id}/collaborators/${collaboratorId}`);
      setCollaborators(prev => prev.filter(c => c.user_id !== collaboratorId));
      setError('');
    } catch (error) {
      console.error('Error removing collaborator:', error);
      setError(error.response?.data?.error || 'Failed to remove collaborator');
    }
  };

  const getRoleDisplay = (role) => {
    const roles = {
      'viewer': { label: 'Viewer', description: 'Can view responses and analytics', color: 'bg-blue-100 text-blue-800' },
      'editor': { label: 'Editor', description: 'Can edit form and view responses', color: 'bg-green-100 text-green-800' }
    };
    return roles[role] || { label: role, description: '', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-200 via-purple-100 to-pink-200 px-4">
        <div className="animate-pulse space-y-4 max-w-4xl w-full bg-white/70 backdrop-blur-lg p-8 rounded-3xl shadow-2xl">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-200 via-purple-100 to-pink-200 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white/70 backdrop-blur-lg p-8 rounded-3xl shadow-2xl border border-white/30">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
            Collaborators
          </h1>
        </div>
        <p className="text-gray-600 mb-6">
          Manage who can access and edit your form "<span className="font-semibold">{form?.title}</span>"
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Add Collaborator Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Collaborator
          </button>
        </div>

        {/* Collaborator List */}
        <div className="mb-8">
          <CollaboratorList
            collaborators={collaborators}
            onRemoveCollaborator={handleRemoveCollaborator}
            getRoleDisplay={getRoleDisplay}
          />
        </div>

        {/* Role Legend */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4 shadow-inner">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Role Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Viewer
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">View Responses</p>
                <p className="text-sm text-gray-600">Can view form responses and analytics</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Editor
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">Edit Form</p>
                <p className="text-sm text-gray-600">Can edit form and view responses</p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Collaborator Modal */}
        <AddCollaboratorModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAddCollaborator={handleAddCollaborator}
        />
      </div>
    </div>
  );
};

export default CollaboratorManagement;
