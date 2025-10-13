import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Download, Lock, Unlock, BarChart3, AlertCircle, Users, Share2 } from 'lucide-react';

const FormResponses = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

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
        // Optionally redirect to login
        // navigate('/login');
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
    const response = await axios.get(`/api/forms/${id}/responses/export`, { // FIXED: Added /responses
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

  // Add null check for form before rendering
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
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {form?.title || 'Untitled Form'}
            </h1>
            <p className="text-gray-600">Responses: {responses.length}</p>
          </div>
          
          <div className="flex space-x-3">
              <Link
  to={`/forms/${id}/collaborators`}
  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
>
  <Users className="h-4 w-4 mr-2" />
  Collaborators
</Link>

            <button
              onClick={toggleFormLock}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                form.is_locked 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-yellow-600 hover:bg-yellow-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current`}
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
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>

            <Link
              to={`/forms/${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Form
            </Link>

            <Link
                  to={`/forms/${id}/share`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Form
          </Link>
          </div>
        </div>
      </div>

      {responses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
          <p className="text-gray-600 mb-4">
            Share your form link to start collecting responses.
          </p>
          <div className="bg-gray-50 rounded-md p-4 max-w-md mx-auto">
            <p className="text-sm font-medium text-gray-700 mb-2">Form URL:</p>
            <code className="text-sm bg-white px-2 py-1 rounded border">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  {/* Add null check for form.questions */}
                  {form.questions?.map(question => (
                    <th 
                      key={question.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-xs truncate"
                      title={question.text}
                    >
                      {question.text}
                    </th>
                  )) || null}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {responses.map(response => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {response.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {response.user_name || 'Anonymous'}
                    </td>
                    {/* Add null check for form.questions */}
                    {form.questions?.map(question => (
                      <td 
                        key={question.id}
                        className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate"
                        title={getAnswerText(response.answers, question.id)}
                      >
                        {getAnswerText(response.answers, question.id)}
                      </td>
                    )) || null}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(response.submitted_at).toLocaleString()}
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