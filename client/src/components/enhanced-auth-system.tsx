import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { InsertUser, User } from '@shared/schema';
import { UserPlus, LogIn, Wifi, Shield } from 'lucide-react';

interface AuthSystemProps {
  onUserAuthenticated: (user: User) => void;
}

export function EnhancedAuthSystem({ onUserAuthenticated }: AuthSystemProps) {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [formData, setFormData] = useState({
    alias: '',
    profile: '',
    avatar: '',
    deviceId: '',
    publicKey: '',
    privateKeyEncrypted: '',
    meshCallsign: '',
    securityLevel: 1,
    nodeCapabilities: ['mesh-relay', 'encryption']
  });

  const { toast } = useToast();

  // Generate device ID and keys
  const generateCredentials = () => {
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const publicKey = `pk_${Math.random().toString(36).substring(2, 50)}`;
    const privateKey = `sk_${Math.random().toString(36).substring(2, 50)}`;
    const meshCallsign = `NODE_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    setFormData(prev => ({
      ...prev,
      deviceId,
      publicKey,
      privateKeyEncrypted: privateKey,
      meshCallsign
    }));
  };

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      return apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
    },
    onSuccess: (user) => {
      localStorage.setItem('meshbook-user', JSON.stringify(user));
      onUserAuthenticated(user);
      toast({
        title: "Registration Successful",
        description: "Welcome to Meshbook! Your secure profile has been created."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account",
        variant: "destructive"
      });
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      return apiRequest(`/api/users/device/${deviceId}`);
    },
    onSuccess: (user) => {
      localStorage.setItem('meshbook-user', JSON.stringify(user));
      onUserAuthenticated(user);
      toast({
        title: "Login Successful",
        description: "Welcome back to Meshbook!"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed", 
        description: error.message || "Device not found",
        variant: "destructive"
      });
    }
  });

  const handleRegister = () => {
    if (!formData.alias.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    if (!formData.deviceId) {
      generateCredentials();
      return;
    }

    registerMutation.mutate(formData);
  };

  const handleLogin = () => {
    if (!formData.deviceId.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter your device ID",
        variant: "destructive"
      });
      return;
    }

    loginMutation.mutate(formData.deviceId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md bg-slate-800/80 border-cyan-500/30 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Meshbook
          </CardTitle>
          <p className="text-muted-foreground">
            Secure Decentralized Communication
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex rounded-lg bg-slate-700/50 p-1">
            <Button
              variant={mode === 'register' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setMode('register')}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Register
            </Button>
            <Button
              variant={mode === 'login' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setMode('login')}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
          </div>

          {mode === 'register' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="alias">Username / Alias</Label>
                <Input
                  id="alias"
                  value={formData.alias}
                  onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
                  placeholder="Choose your username"
                  className="bg-slate-700/50 border-slate-600"
                />
              </div>

              <div>
                <Label htmlFor="profile">Bio (Optional)</Label>
                <Textarea
                  id="profile"
                  value={formData.profile}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  rows={3}
                  className="bg-slate-700/50 border-slate-600"
                />
              </div>

              {formData.deviceId && (
                <div className="space-y-2 p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium">Security Credentials Generated</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Device ID: {formData.deviceId.substring(0, 20)}...</p>
                    <p>Mesh Callsign: {formData.meshCallsign}</p>
                  </div>
                </div>
              )}

              <Button 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                onClick={handleRegister}
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? 'Creating Account...' : 
                 !formData.deviceId ? 'Generate Credentials' : 'Create Account'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="device-id">Device ID</Label>
                <Input
                  id="device-id"
                  value={formData.deviceId}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
                  placeholder="Enter your device ID"
                  className="bg-slate-700/50 border-slate-600"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use the device ID from your previous registration
                </p>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                onClick={handleLogin}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Logging in...' : 'Login to Network'}
              </Button>
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Wifi className="w-3 h-3 text-blue-400" />
                <span className="font-medium">Mesh Ready</span>
              </div>
              <p className="text-muted-foreground">Connect without internet</p>
            </div>
            <div className="p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3 h-3 text-green-400" />
                <span className="font-medium">Encrypted</span>
              </div>
              <p className="text-muted-foreground">End-to-end security</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}