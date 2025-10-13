import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Download, Lock, Unlock, BarChart3, AlertCircle, Users, Share2, Menu, X } from 'lucide-react';

const FormResponses = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchFormAndResponses();
  }, [id]);

  const fetchFormAndResponses = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const [formResponse, responsesResponse] = await Promise.all([
        axios.get(`/api/forms/${id}`),
        axios.get(`/api/forms/${id}/responses`)
      ]);
      
      setForm(formResponse.data);
      setResponses(responsesResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      
      if (error.response?.status === 403) {
        setError('You do not have permission to view these form responses.');
      } else if (error.response?.status === 404) {
        setError('Form not found.');
      } else if (error.response?.status === 401) {
        setError('Please log in to view form responses.');
      } else {
        setError('Error loading form responses. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await axios.get(`/api/forms/${id}/responses/export`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form-${id}-responses.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      
      if (error.response?.status === 403) {
        alert('You do not have permission to export these responses.');
      } else if (error.response?.status === 404) {
        alert('Export feature is not available.');
      } else {
        alert('Error exporting responses');
      }
    } finally {
      setExporting(false);
    }
  };

  const toggleFormLock = async () => {
    try {
      await axios.patch(`/api/forms/${id}/lock`, {
        is_locked: !form.is_locked
      });
      
      setForm(prev => ({ ...prev, is_locked: !prev.is_locked }));
      alert(`Form ${!form.is_locked ? 'locked' : 'unlocked'} successfully`);
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Error toggling lock:', error);
      
      if (error.response?.status === 403) {
        alert('You do not have permission to modify this form.');
      } else {
        alert('Error updating form lock status');
      }
    }
  };

  const getAnswerText = (answers, questionId) => {
    const answer = answers.find(a => a.question_id === questionId);
    if (!answer) return '-';
    
    if (answer.answer_text) {
      return answer.answer_text;
    } else if (answer.answer_options) {
      return Array.isArray(answer.answer_options) 
        ? answer.answer_options.join(', ')
        : answer.answer_options;
    }
    
    return '-';
  };

  // Safe ID display function
  const displayResponseId = (id) => {
    if (typeof id === 'string') {
      return id.length > 8 ? `${id.slice(0, 8)}...` : id;
    } else if (typeof id === 'number') {
      return `#${id}`;
    }
    return id?.toString() || '-';
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-3">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="text-lg font-medium text-red-800">Error</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchFormAndResponses}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Form not found</h3>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </button>
        
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 truncate">
              {form.title || 'Untitled Form'}
            </h1>
            <p className="text-gray-600">Responses: {responses.length}</p>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden lg:flex flex-wrap gap-2 justify-end">
            <Link
              to={`/forms/${id}/collaborators`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 whitespace-nowrap"
            >
              <Users className="h-4 w-4 mr-2" />
              Collaborators
            </Link>

            <button
              onClick={toggleFormLock}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white whitespace-nowrap ${
                form.is_locked 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-yellow-600 hover:bg-yellow-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current`}
            >
              {form.is_locked ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock
                </>
              )}
            </button>
            
            <button
              onClick={handleExport}
              disabled={exporting || responses.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export'}
            </button>

            <Link
              to={`/forms/${id}`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Form
            </Link>

            <Link
              to={`/forms/${id}/share`}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 whitespace-nowrap"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Link>
          </div>

          {/* Mobile Actions Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
            >
              <Menu className="h-4 w-4 mr-2" />
              Actions
            </button>
          </div>
        </div>

        {/* Mobile Actions Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">Form Actions</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Link
                to={`/forms/${id}/collaborators`}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Users className="h-4 w-4 mr-2" />
                Collaborators
              </Link>

              <button
                onClick={toggleFormLock}
                className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                  form.is_locked 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {form.is_locked ? (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Unlock Form
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Lock Form
                  </>
                )}
              </button>
              
              <button
                onClick={handleExport}
                disabled={exporting || responses.length === 0}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export Excel'}
              </button>

              <Link
                to={`/forms/${id}`}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Form
              </Link>

              <Link
                to={`/forms/${id}/share`}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Form
              </Link>
            </div>
          </div>
        )}
      </div>

      {responses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 text-center">
          <BarChart3 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
          <p className="text-gray-600 mb-4">
            Share your form link to start collecting responses.
          </p>
          <div className="bg-gray-50 rounded-md p-4 max-w-md mx-auto">
            <p className="text-sm font-medium text-gray-700 mb-2">Form URL:</p>
            <code className="text-xs sm:text-sm bg-white px-2 py-1 rounded border break-all">
              {window.location.origin}/forms/{id}
            </code>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Response ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    User
                  </th>
                  {form.questions?.map(question => (
                    <th 
                      key={question.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[200px] truncate"
                      title={question.text}
                    >
                      {question.text}
                    </th>
                  )) || null}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {responses.map(response => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {displayResponseId(response.id)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 max-w-[120px] truncate">
                      {response.user_name || 'Anonymous'}
                    </td>
                    {form.questions?.map(question => (
                      <td 
                        key={question.id}
                        className="px-4 py-4 text-sm text-gray-500 max-w-[200px] truncate"
                        title={getAnswerText(response.answers, question.id)}
                      >
                        {getAnswerText(response.answers, question.id)}
                      </td>
                    )) || null}
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(response.submitted_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormResponses;