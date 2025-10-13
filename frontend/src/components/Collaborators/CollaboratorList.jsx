import React from 'react';
import { Mail, Trash2, Eye, Edit3, User } from 'lucide-react';

const CollaboratorList = ({ collaborators, onRemoveCollaborator, getRoleDisplay }) => {
  if (collaborators.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No collaborators yet</h3>
        <p className="text-gray-600">
          Add collaborators to share access to this form.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Current Collaborators</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {collaborators.map((collaborator) => {
          const roleInfo = getRoleDisplay(collaborator.role);
          return (
            <div key={collaborator.user_id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {collaborator.name?.charAt(0).toUpperCase() || collaborator.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-gray-900">{collaborator.name}</h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleInfo.color}`}>
                      {collaborator.role === 'viewer' ? <Eye className="h-3 w-3 mr-1" /> : <Edit3 className="h-3 w-3 mr-1" />}
                      {roleInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="h-4 w-4 mr-1" />
                    {collaborator.email}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onRemoveCollaborator(collaborator.user_id)}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove collaborator"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollaboratorList;