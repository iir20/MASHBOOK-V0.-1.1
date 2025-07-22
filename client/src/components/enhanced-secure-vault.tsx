import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Shield, 
  Lock, 
  Unlock, 
  Key, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Music,
  AlertTriangle,
  CheckCircle,
  Copy,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

interface SecureItem {
  id: string;
  type: 'note' | 'credential' | 'file' | 'media';
  title: string;
  content: string;
  metadata?: {
    url?: string;
    username?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };
  encryptedAt: Date;
  lastAccessed: Date;
}

interface VaultStats {
  totalItems: number;
  encryptedSize: number;
  lastBackup: Date | null;
  securityScore: number;
}

interface EnhancedSecureVaultProps {
  userId: number;
  currentUser?: User;
}

export function EnhancedSecureVault({ userId, currentUser }: EnhancedSecureVaultProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vaultPin, setVaultPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [hasVault, setHasVault] = useState(false);
  const [activeTab, setActiveTab] = useState('notes');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SecureItem | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  
  const [vaultItems, setVaultItems] = useState<SecureItem[]>([]);
  const [vaultStats, setVaultStats] = useState<VaultStats>({
    totalItems: 0,
    encryptedSize: 0,
    lastBackup: null,
    securityScore: 95
  });

  const [newItem, setNewItem] = useState({
    type: 'note' as SecureItem['type'],
    title: '',
    content: '',
    metadata: {}
  });

  const { toast } = useToast();

  // Check if vault exists on component mount
  useEffect(() => {
    checkVaultExists();
    loadVaultItems();
  }, [userId]);

  // Encryption utilities using Web Crypto API
  const generateSalt = () => {
    return crypto.getRandomValues(new Uint8Array(16));
  };

  const deriveKey = async (password: string, salt: Uint8Array) => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  };

  const encryptData = async (data: string, password: string) => {
    try {
      const encoder = new TextEncoder();
      const salt = generateSalt();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt);
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(data)
      );

      // Combine salt, iv, and encrypted data
      const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  };

  const decryptData = async (encryptedData: string, password: string) => {
    try {
      const combined = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);
      
      const key = await deriveKey(password, salt);
      
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  };

  const checkVaultExists = () => {
    const vaultKey = `phantom_vault_${userId}`;
    const exists = localStorage.getItem(vaultKey) !== null;
    setHasVault(exists);
  };

  const loadVaultItems = async () => {
    if (!isUnlocked || !vaultPin) return;
    
    try {
      const vaultKey = `phantom_vault_${userId}`;
      const encryptedVault = localStorage.getItem(vaultKey);
      
      if (encryptedVault) {
        const decryptedData = await decryptData(encryptedVault, vaultPin);
        const items = JSON.parse(decryptedData) as SecureItem[];
        
        setVaultItems(items);
        setVaultStats({
          totalItems: items.length,
          encryptedSize: encryptedVault.length,
          lastBackup: new Date(),
          securityScore: calculateSecurityScore(items)
        });
      }
    } catch (error) {
      toast({
        title: "Decryption Failed",
        description: "Unable to decrypt vault items. Check your PIN.",
        variant: "destructive",
      });
      setIsUnlocked(false);
    }
  };

  const saveVaultItems = async (items: SecureItem[]) => {
    if (!vaultPin) return;
    
    try {
      const vaultKey = `phantom_vault_${userId}`;
      const dataToEncrypt = JSON.stringify(items);
      const encryptedData = await encryptData(dataToEncrypt, vaultPin);
      
      localStorage.setItem(vaultKey, encryptedData);
      
      setVaultStats(prev => ({
        ...prev,
        totalItems: items.length,
        encryptedSize: encryptedData.length,
        lastBackup: new Date(),
        securityScore: calculateSecurityScore(items)
      }));
      
      toast({
        title: "Vault Secured",
        description: "Your data has been encrypted and saved.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to encrypt and save vault data.",
        variant: "destructive",
      });
    }
  };

  const calculateSecurityScore = (items: SecureItem[]): number => {
    let score = 100;
    
    // Deduct points for old items without recent access
    const now = new Date();
    items.forEach(item => {
      const daysSinceAccess = (now.getTime() - new Date(item.lastAccessed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceAccess > 90) score -= 5;
    });
    
    // Deduct points for weak credentials
    const credentials = items.filter(item => item.type === 'credential');
    credentials.forEach(cred => {
      if (cred.content.length < 12) score -= 10;
      if (!/[A-Z]/.test(cred.content)) score -= 5;
      if (!/[0-9]/.test(cred.content)) score -= 5;
      if (!/[^A-Za-z0-9]/.test(cred.content)) score -= 5;
    });
    
    return Math.max(0, Math.min(100, score));
  };

  const setupVault = async () => {
    if (!vaultPin || vaultPin !== confirmPin) {
      toast({
        title: "PIN Mismatch",
        description: "Please ensure your PIN entries match.",
        variant: "destructive",
      });
      return;
    }

    if (vaultPin.length < 6) {
      toast({
        title: "Weak PIN",
        description: "Please use at least 6 characters for your vault PIN.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Create empty vault
      await saveVaultItems([]);
      setHasVault(true);
      setIsUnlocked(true);
      setIsSettingUp(false);
      
      toast({
        title: "Vault Created",
        description: "Your secure vault has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Setup Failed",
        description: "Failed to create secure vault.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const unlockVault = async () => {
    if (!vaultPin) return;
    
    setIsProcessing(true);
    try {
      // Try to decrypt vault to verify PIN
      const vaultKey = `phantom_vault_${userId}`;
      const encryptedVault = localStorage.getItem(vaultKey);
      
      if (encryptedVault) {
        await decryptData(encryptedVault, vaultPin);
        setIsUnlocked(true);
        await loadVaultItems();
        
        toast({
          title: "Vault Unlocked",
          description: "Access granted to your secure vault.",
        });
      }
    } catch (error) {
      toast({
        title: "Access Denied",
        description: "Incorrect PIN. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addItem = async () => {
    if (!newItem.title || !newItem.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const item: SecureItem = {
      id: crypto.randomUUID(),
      type: newItem.type,
      title: newItem.title,
      content: newItem.content,
      metadata: newItem.metadata,
      encryptedAt: new Date(),
      lastAccessed: new Date()
    };

    const updatedItems = [...vaultItems, item];
    setVaultItems(updatedItems);
    await saveVaultItems(updatedItems);
    
    setNewItem({ type: 'note', title: '', content: '', metadata: {} });
    setShowAddDialog(false);
  };

  const deleteItem = async (itemId: string) => {
    const updatedItems = vaultItems.filter(item => item.id !== itemId);
    setVaultItems(updatedItems);
    await saveVaultItems(updatedItems);
    
    toast({
      title: "Item Deleted",
      description: "The item has been permanently removed from your vault.",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Content copied to clipboard.",
      });
    });
  };

  const exportVault = () => {
    const dataStr = JSON.stringify(vaultItems, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `phantom_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getItemIcon = (type: SecureItem['type']) => {
    switch (type) {
      case 'note': return <FileText className="h-4 w-4" />;
      case 'credential': return <Key className="h-4 w-4" />;
      case 'file': return <FileText className="h-4 w-4" />;
      case 'media': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const filterItemsByType = (type: string) => {
    if (type === 'all') return vaultItems;
    return vaultItems.filter(item => item.type === type);
  };

  if (!hasVault || isSettingUp) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <Card className="bg-gray-800/50 border-emerald-500/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-gray-900" />
            </div>
            <CardTitle className="text-xl text-emerald-400">Setup Secure Vault</CardTitle>
            <CardDescription className="text-gray-300">
              Create an encrypted vault to store sensitive information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vaultPin">Vault PIN</Label>
              <Input
                id="vaultPin"
                type="password"
                placeholder="Enter a secure PIN (6+ characters)"
                value={vaultPin}
                onChange={(e) => setVaultPin(e.target.value)}
                className="bg-gray-700/50 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                placeholder="Confirm your PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="bg-gray-700/50 border-gray-600"
              />
            </div>
            
            <Alert className="border-yellow-500/30 bg-yellow-900/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-yellow-300">
                Remember your PIN! It cannot be recovered if lost. All data will be encrypted with AES-256.
              </AlertDescription>
            </Alert>

            <Button
              onClick={setupVault}
              disabled={isProcessing || !vaultPin || vaultPin !== confirmPin}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Vault...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Create Secure Vault
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="w-full max-w-md mx-auto p-6">
        <Card className="bg-gray-800/50 border-emerald-500/30">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 bg-gray-700 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-xl text-emerald-400">Vault Locked</CardTitle>
            <CardDescription className="text-gray-300">
              Enter your PIN to access your secure vault
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="unlockPin">Vault PIN</Label>
              <Input
                id="unlockPin"
                type="password"
                placeholder="Enter your vault PIN"
                value={vaultPin}
                onChange={(e) => setVaultPin(e.target.value)}
                className="bg-gray-700/50 border-gray-600"
                onKeyPress={(e) => e.key === 'Enter' && unlockVault()}
              />
            </div>

            <Button
              onClick={unlockVault}
              disabled={isProcessing || !vaultPin}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Unlocking...
                </>
              ) : (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock Vault
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 flex items-center">
            <Unlock className="h-6 w-6 mr-2" />
            Secure Vault
          </h1>
          <p className="text-gray-400 mt-1">Encrypted storage for sensitive information</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportVault}
            className="border-gray-600"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Vault Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm text-gray-400">Total Items</p>
                <p className="text-xl font-bold text-white">{vaultStats.totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-sm text-gray-400">Security Score</p>
                <p className="text-xl font-bold text-cyan-400">{vaultStats.securityScore}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm text-gray-400">Encrypted Size</p>
                <p className="text-xl font-bold text-yellow-400">{(vaultStats.encryptedSize / 1024).toFixed(1)}KB</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Last Backup</p>
                <p className="text-sm font-medium text-green-400">
                  {vaultStats.lastBackup ? vaultStats.lastBackup.toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="note">Notes</TabsTrigger>
          <TabsTrigger value="credential">Credentials</TabsTrigger>
          <TabsTrigger value="file">Files</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {(['all', 'note', 'credential', 'file', 'media'] as const).map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterItemsByType(tabValue).map((item) => (
                <Card key={item.id} className="bg-gray-800/50 border-gray-700 hover:border-emerald-500/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getItemIcon(item.type)}
                        <h3 className="font-medium text-white truncate">{item.title}</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      {item.type === 'credential' ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            type={showPassword[item.id] ? 'text' : 'password'}
                            value={item.content}
                            readOnly
                            className="flex-1 text-xs bg-gray-700/50 border-gray-600"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowPassword(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                          >
                            {showPassword[item.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(item.content)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-300 line-clamp-3">{item.content}</p>
                      )}
                      
                      {item.metadata?.url && (
                        <p className="text-xs text-emerald-400 truncate">{item.metadata.url}</p>
                      )}
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Last accessed: {new Date(item.lastAccessed).toLocaleDateString()}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteItem(item.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filterItemsByType(tabValue).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No {tabValue === 'all' ? 'items' : tabValue + 's'} in your vault yet</p>
                <Button
                  variant="outline"
                  onClick={() => setShowAddDialog(true)}
                  className="mt-4 border-gray-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-emerald-400">Add New Item</DialogTitle>
            <DialogDescription className="text-gray-300">
              Add a new encrypted item to your secure vault
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Item Type</Label>
              <select
                value={newItem.type}
                onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as SecureItem['type'] }))}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="note">Note</option>
                <option value="credential">Credential</option>
                <option value="file">File</option>
                <option value="media">Media</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="itemTitle">Title</Label>
              <Input
                id="itemTitle"
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter item title"
                className="bg-gray-700/50 border-gray-600"
              />
            </div>
            
            <div>
              <Label htmlFor="itemContent">
                {newItem.type === 'credential' ? 'Password/Secret' : 'Content'}
              </Label>
              <Textarea
                id="itemContent"
                value={newItem.content}
                onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
                placeholder={newItem.type === 'credential' ? 'Enter password or secret' : 'Enter content'}
                className="bg-gray-700/50 border-gray-600"
                rows={4}
              />
            </div>
            
            {newItem.type === 'credential' && (
              <div>
                <Label htmlFor="itemUrl">Website/Service URL</Label>
                <Input
                  id="itemUrl"
                  value={newItem.metadata.url || ''}
                  onChange={(e) => setNewItem(prev => ({ 
                    ...prev, 
                    metadata: { ...prev.metadata, url: e.target.value } 
                  }))}
                  placeholder="https://example.com"
                  className="bg-gray-700/50 border-gray-600"
                />
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button
                onClick={addItem}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Vault
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="border-gray-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}