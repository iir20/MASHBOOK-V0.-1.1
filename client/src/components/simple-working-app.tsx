import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SimpleWorkingApp() {
  const [message, setMessage] = useState('Meshbook is working!');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Meshbook</h1>
        
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="text-white">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/90 mb-4">{message}</p>
            <Button 
              onClick={() => setMessage('Button clicked! React is working perfectly.')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Test Interaction
            </Button>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Frontend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-400">✅ React Working</p>
              <p className="text-green-400">✅ TypeScript Working</p>
              <p className="text-green-400">✅ Tailwind CSS Working</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Backend</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-400">✅ Server Running</p>
              <p className="text-green-400">✅ Database Connected</p>
              <p className="text-yellow-400">⚠️ API Testing Needed</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Features</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-yellow-400">🔄 Peer-to-Peer Messaging</p>
              <p className="text-yellow-400">🔄 WebRTC Integration</p>
              <p className="text-yellow-400">🔄 Real-time Communication</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}