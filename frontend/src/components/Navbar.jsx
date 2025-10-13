import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FormInput, LogOut, User, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white/70 backdrop-blur-md shadow-md border-b border-white/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2 flex-shrink-0"
            onClick={closeMobileMenu}
          >
            <FormInput className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 hidden sm:block">FormApp</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition whitespace-nowrap"
                >
                  Dashboard
                </Link>

                <Link
                  to="/forms/new"
                  className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium shadow hover:shadow-lg transition whitespace-nowrap"
                >
                  Create Form
                </Link>

                <div className="flex items-center space-x-2 text-sm text-gray-700 whitespace-nowrap">
                  <User className="h-4 w-4" />
                  <span className="max-w-32 truncate">{user.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 p-2 rounded-md transition"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition whitespace-nowrap"
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md text-sm font-medium shadow hover:shadow-lg transition whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            {user && (
              <div className="flex items-center space-x-2 text-sm text-gray-700 mr-2">
                <User className="h-4 w-4" />
                <span className="max-w-20 truncate">{user.name}</span>
              </div>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 p-2 rounded-md transition"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 bg-white/90 backdrop-blur-sm">
            <div className="flex flex-col space-y-4">
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition"
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>

                  <Link
                    to="/forms/new"
                    className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-md text-base font-medium shadow text-center"
                    onClick={closeMobileMenu}
                  >
                    Create Form
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-base font-medium transition text-left flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium transition text-center"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>

                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md text-base font-medium shadow text-center"
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;