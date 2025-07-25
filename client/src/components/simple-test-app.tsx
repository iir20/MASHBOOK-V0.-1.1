import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SimpleTestApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('SimpleTestApp: Starting to fetch users...');
    fetch('/api/users')
      .then(res => {
        console.log('SimpleTestApp: API response status:', res.status);
        return res.json();
      })
      .then(users => {
        console.log('SimpleTestApp: Got users:', users);
        if (users && users.length > 0) {
          setUser(users[0]);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('SimpleTestApp: Error fetching users:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-cyan-400">Loading Meshbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-6">
          Meshbook - Connectivity Test
        </h1>
        
        {user ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Connected as: {user.alias}
              </h2>
              <p className="text-slate-300 mb-4">
                Profile: {user.profile}
              </p>
              <p className="text-sm text-slate-400">
                Device ID: {user.deviceId}
              </p>
              <p className="text-sm text-slate-400">
                Security Level: {user.securityLevel}
              </p>
              
              <div className="mt-6">
                <Button 
                  onClick={() => console.log('Test button clicked!')}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Test Functionality
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold text-red-400 mb-4">
                No User Found
              </h2>
              <p className="text-slate-300">
                Unable to load user data from the API.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}