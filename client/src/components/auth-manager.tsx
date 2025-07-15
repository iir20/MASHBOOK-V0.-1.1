import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Wifi, User as UserIcon, Shield, Smartphone } from 'lucide-react';
import type { User, InsertUser } from '@shared/schema';

interface AuthManagerProps {
  onUserAuthenticated: (user: User, deviceId: string) => void;
}

export function AuthManager({ onUserAuthenticated }: AuthManagerProps) {
  const [step, setStep] = useState<'checking' | 'register' | 'login'>('checking');
  const [deviceId, setDeviceId] = useState<string>('');
  const [username, setUsername] = useState('');
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [keyGenProgress, setKeyGenProgress] = useState(0);
  const { toast } = useToast();

  // Generate device ID on component mount
  useEffect(() => {
    const generateDeviceId = () => {
      // Create a unique device ID based on browser fingerprint
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
      }
      
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
        Date.now().toString()
      ].join('|');
      
      // Create a hash of the fingerprint
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return 'device_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
    };

    const id = generateDeviceId();
    setDeviceId(id);
    
    // Add a small delay to ensure the component is fully mounted
    setTimeout(() => {
      checkExistingUser(id);
    }, 100);
    
    // Add a fallback timeout to prevent being stuck indefinitely
    setTimeout(() => {
      if (step === 'checking') {
        console.log('Authentication timeout, forcing registration step');
        setStep('register');
      }
    }, 3000);
  }, [step]);

  const checkExistingUser = async (id: string) => {
    console.log('Checking existing user with device ID:', id);
    try {
      const response = await fetch(`/api/users/device/${id}`);
      console.log('User check response:', response.status);
      
      if (response.ok) {
        const user = await response.json();
        console.log('User found:', user);
        onUserAuthenticated(user, id);
      } else if (response.status === 404) {
        // User not found, show registration
        console.log('User not found, showing registration');
        setStep('register');
      } else {
        throw new Error('Failed to check user');
      }
    } catch (error) {
      console.error('Error checking user:', error);
      setStep('register');
    }
  };

  // Generate cryptographic keys
  const generateKeys = async (): Promise<string> => {
    setIsGeneratingKeys(true);
    setKeyGenProgress(0);

    try {
      // Simulate key generation progress
      for (let i = 0; i <= 100; i += 10) {
        setKeyGenProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Generate RSA key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Export public key
      const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyArray = new Uint8Array(publicKeyBuffer);
      const publicKeyBase64 = btoa(String.fromCharCode.apply(null, Array.from(publicKeyArray)));

      // Store private key in localStorage for this session
      const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKeyArray = new Uint8Array(privateKeyBuffer);
      const privateKeyBase64 = btoa(String.fromCharCode.apply(null, Array.from(privateKeyArray)));
      localStorage.setItem('meshPrivateKey', privateKeyBase64);

      return publicKeyBase64;
    } catch (error) {
      console.error('Key generation failed:', error);
      throw new Error('Failed to generate encryption keys');
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  // Register new user
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!username.trim()) {
        throw new Error('Username is required');
      }

      const publicKey = await generateKeys();
      
      const userData: InsertUser = {
        username: username.trim(),
        bio: '',
        profileImage: '',
        deviceId,
        publicKey,
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to register user');
      }

      return response.json();
    },
    onSuccess: (user) => {
      toast({
        title: "Welcome to the Mesh!",
        description: "Your account has been created successfully.",
      });
      onUserAuthenticated(user, deviceId);
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (step === 'checking') {
    return (
      <Card className="w-full max-w-md mx-auto bg-[var(--cyber-dark)]/95 border-[var(--cyber-cyan)]/30">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Wifi className="h-12 w-12 mx-auto text-[var(--cyber-cyan)] animate-pulse" />
            <p className="text-white">Connecting to mesh network...</p>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[var(--cyber-cyan)] to-[var(--cyber-magenta)] animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-[var(--cyber-dark)]/95 border-[var(--cyber-cyan)]/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-center text-[var(--cyber-cyan)] flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Join the Mesh Network
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Device Info */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <Smartphone className="h-4 w-4" />
            <span className="text-sm">Device Detected</span>
          </div>
          <p className="text-xs text-gray-400 font-mono bg-[var(--cyber-dark)]/50 p-2 rounded border border-[var(--cyber-cyan)]/20 break-all">
            {deviceId}
          </p>
        </div>

        {/* Key Generation Progress */}
        {isGeneratingKeys && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--cyber-cyan)]">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Generating Encryption Keys</span>
            </div>
            <Progress value={keyGenProgress} className="h-2" />
            <p className="text-xs text-gray-400 text-center">
              Creating secure RSA key pair for encrypted communication
            </p>
          </div>
        )}

        {/* Registration Form */}
        {!isGeneratingKeys && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Choose a Username
              </label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="bg-[var(--cyber-dark)]/50 border-[var(--cyber-cyan)]/30 text-white"
                maxLength={30}
                onKeyDown={(e) => e.key === 'Enter' && registerMutation.mutate()}
              />
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => registerMutation.mutate()}
                disabled={registerMutation.isPending || !username.trim()}
                className="w-full bg-[var(--cyber-cyan)] text-black hover:bg-[var(--cyber-cyan)]/80"
              >
                {registerMutation.isPending ? 'Creating Account...' : 'Join Network'}
              </Button>

              <div className="text-xs text-gray-400 text-center space-y-1">
                <p>• Your identity is tied to this device</p>
                <p>• End-to-end encryption is automatically enabled</p>
                <p>• No personal information required</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}