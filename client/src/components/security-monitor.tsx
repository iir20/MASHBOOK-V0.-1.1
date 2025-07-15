import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { 
  Shield, 
  Key, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Unlock,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityMonitorProps {
  nodeId: string;
}

interface SecurityHealth {
  totalNodes: number;
  secureNodes: number;
  vulnerableNodes: number;
  blacklistedKeys: number;
}

interface KeyPair {
  publicKey: string;
  walletAddress: string;
}

export function SecurityMonitor({ nodeId }: SecurityMonitorProps) {
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState<KeyPair | null>(null);
  const { toast } = useToast();
  
  // Fetch security status
  const { data: securityStatus, refetch: refetchSecurity } = useQuery({
    queryKey: ['/api/security/status'],
    queryFn: async () => {
      const response = await fetch('/api/security/status');
      return response.json() as Promise<{ securityHealth: SecurityHealth; timestamp: number }>;
    },
    refetchInterval: 10000,
    retry: 2
  });
  
  const generateKeys = async () => {
    try {
      const response = await fetch('/api/security/generate-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nodeId })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate keys');
      }
      
      const keyPair = await response.json();
      setGeneratedKeys(keyPair);
      
      toast({
        title: "Keys Generated",
        description: "New cryptographic keys have been generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate cryptographic keys",
        variant: "destructive",
      });
    }
  };
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: `${type} copied to clipboard`,
      });
    });
  };
  
  const downloadKey = (key: string, fileName: string) => {
    const element = document.createElement('a');
    const file = new Blob([key], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Downloaded",
      description: `${fileName} has been downloaded`,
    });
  };
  
  const getSecurityLevel = (secureNodes: number, totalNodes: number) => {
    if (totalNodes === 0) return { level: 'Unknown', color: 'text-gray-500', percentage: 0 };
    
    const percentage = (secureNodes / totalNodes) * 100;
    
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-500', percentage };
    if (percentage >= 70) return { level: 'Good', color: 'text-blue-500', percentage };
    if (percentage >= 50) return { level: 'Fair', color: 'text-yellow-500', percentage };
    return { level: 'Poor', color: 'text-red-500', percentage };
  };
  
  const formatKey = (key: string, maxLength: number = 40) => {
    if (key.length <= maxLength) return key;
    return `${key.substring(0, maxLength)}...`;
  };
  
  const securityHealth = securityStatus?.securityHealth;
  const securityLevel = securityHealth 
    ? getSecurityLevel(securityHealth.secureNodes, securityHealth.totalNodes)
    : { level: 'Unknown', color: 'text-gray-500', percentage: 0 };
  
  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--cyber-cyan)]">Security Monitor</h2>
          <p className="text-gray-400 mt-1">Cryptographic security and key management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={`${securityLevel.color} border-current`}>
            <Shield className="w-3 h-3 mr-1" />
            {securityLevel.level}
          </Badge>
          <Button variant="outline" size="sm" onClick={refetchSecurity}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Level</CardTitle>
            <Shield className={`w-4 h-4 ${securityLevel.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${securityLevel.color}`}>
              {securityLevel.level}
            </div>
            <p className="text-xs text-gray-400">
              {securityLevel.percentage.toFixed(1)}% secure nodes
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Secure Nodes</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {securityHealth?.secureNodes || 0}
            </div>
            <p className="text-xs text-gray-400">
              Out of {securityHealth?.totalNodes || 0} total nodes
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerable Nodes</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {securityHealth?.vulnerableNodes || 0}
            </div>
            <p className="text-xs text-gray-400">
              Nodes needing security updates
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-morphism">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blacklisted Keys</CardTitle>
            <Lock className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {securityHealth?.blacklistedKeys || 0}
            </div>
            <p className="text-xs text-gray-400">
              Compromised or revoked keys
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Security Progress */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Network Security Health</span>
          </CardTitle>
          <CardDescription>
            Overall security status across the mesh network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Secure Nodes</span>
              <span className="text-sm font-mono">
                {securityHealth?.secureNodes || 0}/{securityHealth?.totalNodes || 0}
              </span>
            </div>
            <Progress value={securityLevel.percentage} className="h-3" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--cyber-green)]">
                {securityLevel.percentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Security Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-[var(--cyber-cyan)]">
                AES-256
              </div>
              <div className="text-sm text-gray-400">Encryption Standard</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Key Generation */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>Cryptographic Key Management</span>
          </CardTitle>
          <CardDescription>
            Generate and manage encryption keys for secure communication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Generate New Key Pair</h4>
              <p className="text-sm text-gray-400">
                Creates RSA-2048 key pair for secure messaging
              </p>
            </div>
            <Button onClick={generateKeys}>
              <Key className="w-4 h-4 mr-2" />
              Generate Keys
            </Button>
          </div>
          
          {generatedKeys && (
            <div className="space-y-4 mt-6 p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Keys Generated Successfully</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Public Key</label>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(generatedKeys.publicKey, 'Public Key')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadKey(generatedKeys.publicKey, 'public-key.pem')}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-100 rounded font-mono text-sm">
                    {formatKey(generatedKeys.publicKey)}
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Wallet Address</label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedKeys.walletAddress, 'Wallet Address')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="p-3 bg-gray-100 rounded font-mono text-sm">
                    {generatedKeys.walletAddress}
                  </div>
                </div>
              </div>
              
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong> Store your private key securely. 
                  It's not displayed here for security reasons but is used internally for encryption.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Security Recommendations */}
      <Card className="glass-morphism">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Security Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Regular Key Rotation</h4>
                <p className="text-sm text-gray-400">
                  Rotate encryption keys every 30 days for maximum security
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Monitor Network Health</h4>
                <p className="text-sm text-gray-400">
                  Keep track of vulnerable nodes and address security issues promptly
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Secure Key Storage</h4>
                <p className="text-sm text-gray-400">
                  Private keys are encrypted and stored securely in the browser
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Backup Your Keys</h4>
                <p className="text-sm text-gray-400">
                  Always maintain secure backups of your encryption keys
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}