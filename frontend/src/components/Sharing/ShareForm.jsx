import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Link as LinkIcon, 
  Copy, 
  Share2, 
  Mail, 
  MessageCircle, 
  Facebook, 
  Twitter, 
  ArrowLeft, 
  CheckCircle,
  Code,
  Eye,
  Users
} from 'lucide-react';

const ShareForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [activeTab, setActiveTab] = useState('link');

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await axios.get(`/api/forms/${id}`);
      setForm(response.data);
    } catch (error) {
      console.error('Error fetching form:', error);
    } finally {
      setLoading(false);
    }
  };

  const formUrl = `${window.location.origin}/forms/${id}`;
  const embedCode = `<iframe 
  src="${formUrl}"
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: none; border-radius: 8px;"
  title="${form?.title || 'Form'}"
></iframe>`;

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareViaEmail = () => {
    const subject = `Form: ${form?.title}`;
    const body = `Please fill out this form: ${formUrl}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaWhatsApp = () => {
    const text = `Please fill out this form: ${formUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(formUrl)}`);
  };

  const shareViaTwitter = () => {
    const text = `Check out this form: ${form?.title}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(formUrl)}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-indigo-200 via-purple-100 to-pink-200 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-32 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-indigo-200 via-purple-100 to-pink-200 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Share Form</h1>
          </div>
          <p className="text-gray-600">
            Share "{form?.title}" and start collecting responses
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-xl border border-white/30 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('link')}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'link'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Form Link
              </button>
              <button
                onClick={() => setActiveTab('embed')}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'embed'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Code className="h-4 w-4 mr-2" />
                Embed Code
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'social'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Social Share
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Form Link Tab */}
            {activeTab === 'link' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Form Link</h3>
                  <p className="text-gray-600 mb-4">
                    Share this link with anyone you want to fill out your form. 
                    {form?.allow_unauthenticated ? ' No login required.' : ' Users need to be logged in.'}
                  </p>
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formUrl}
                      readOnly
                      className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      onClick={() => copyToClipboard(formUrl, 'link')}
                      className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                      {copiedField === 'link' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">Preview</h4>
                      <p className="text-sm text-blue-800">
                        You can preview how your form looks to respondents by{' '}
                        <a 
                          href={formUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:no-underline"
                        >
                          clicking here
                        </a>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Embed Code Tab */}
            {activeTab === 'embed' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Embed Code</h3>
                  <p className="text-gray-600 mb-4">
                    Add this form directly to your website using the embed code below.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-sm overflow-x-auto">
                        <code>{embedCode}</code>
                      </pre>
                      <button
                        onClick={() => copyToClipboard(embedCode, 'embed')}
                        className="absolute top-3 right-3 inline-flex items-center px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        {copiedField === 'embed' ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Code className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-amber-900 mb-1">Embed Instructions</h4>
                      <p className="text-sm text-amber-800">
                        Copy the code above and paste it into your website's HTML where you want the form to appear.
                        The form will automatically resize to fit its container.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Social Share Tab */}
            {activeTab === 'social' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Share on Social Media</h3>
                  <p className="text-gray-600 mb-6">
                    Share your form directly on social media platforms.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={shareViaEmail}
                      className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Mail className="h-8 w-8 text-gray-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">Email</span>
                    </button>

                    <button
                      onClick={shareViaWhatsApp}
                      className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:bg-green-50 transition-colors"
                    >
                      <MessageCircle className="h-8 w-8 text-green-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">WhatsApp</span>
                    </button>

                    <button
                      onClick={shareViaFacebook}
                      className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-colors"
                    >
                      <Facebook className="h-8 w-8 text-blue-600 mb-2" />
                      <span className="text-sm font-medium text-gray-700">Facebook</span>
                    </button>

                    <button
                      onClick={shareViaTwitter}
                      className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:bg-sky-50 transition-colors"
                    >
                      <Twitter className="h-8 w-8 text-sky-500 mb-2" />
                      <span className="text-sm font-medium text-gray-700">Twitter</span>
                    </button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">Quick Actions</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => copyToClipboard(formUrl, 'quick')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </button>
                    
                    <button
                      onClick={shareViaEmail}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Link
                    </button>

                    {navigator.share && (
                      <button
                        onClick={() => navigator.share({
                          title: form?.title,
                          text: 'Please fill out this form',
                          url: formUrl
                        })}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Native Share
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats & Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/30">
            <div className="flex items-center gap-3 mb-3">
              <LinkIcon className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Form Link</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Perfect for sharing in emails, messages, or any platform where you can paste a link.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/30">
            <div className="flex items-center gap-3 mb-3">
              <Code className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Embed Code</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Embed the form directly on your website, blog, or any platform that supports iframes.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/30">
            <div className="flex items-center gap-3 mb-3">
              <Users className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Collaborators</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Need help managing responses?{' '}
              <button
                onClick={() => navigate(`/forms/${id}/collaborators`)}
                className="text-green-600 hover:text-green-700 underline"
              >
                Add collaborators
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareForm;