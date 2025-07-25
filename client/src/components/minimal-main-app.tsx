import React, { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { EnhancedAuthRegistration } from './enhanced-auth-registration';
import type { User } from '@shared/schema';

export function MinimalMainApp() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  console.log('MinimalMainApp: Component rendered');

  // Check for existing user session
  useEffect(() => {
    console.log('MinimalMainApp: Checking for saved user');
    const savedUser = localStorage.getItem('meshbook-user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        console.log('MinimalMainApp: Found saved user:', user);
        setCurrentUser(user);
      } catch (error) {
        console.error('MinimalMainApp: Failed to parse saved user:', error);
        localStorage.removeItem('meshbook-user');
      }
    }
  }, []);

  const handleAuthSuccess = (user: User) => {
    console.log('MinimalMainApp: Authentication successful:', user);
    setCurrentUser(user);
  };

  const handleUserLogout = () => {
    console.log('MinimalMainApp: User logout');
    setCurrentUser(null);
    localStorage.removeItem('meshbook-user');
  };

  // Render authentication if no user
  if (!currentUser) {
    console.log('MinimalMainApp: Rendering auth registration');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
        <EnhancedAuthRegistration onAuthSuccess={handleAuthSuccess} />
        <Toaster />
      </div>
    );
  }

  // Main application interface
  console.log('MinimalMainApp: Rendering main interface for user:', currentUser.alias);
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h1 className="text-3xl font-bold mb-4">Welcome to Meshbook</h1>
          <p className="text-lg mb-4">Hello, {currentUser.alias}!</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-500/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Stories</h3>
              <p className="text-sm opacity-80">Share your moments</p>
            </div>
            <div className="bg-green-500/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Messages</h3>
              <p className="text-sm opacity-80">Connect with others</p>
            </div>
            <div className="bg-purple-500/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Network</h3>
              <p className="text-sm opacity-80">Mesh connectivity</p>
            </div>
          </div>
          <button 
            onClick={handleUserLogout}
            className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
          >
            Logout
          </button>
        </div>
      </div>
      <Toaster />
    </div>
  );
}