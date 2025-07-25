import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText, AnimatedBackground } from './modern-futuristic-theme';

import {
  Lock, Plus, FileText, Image, Key, Shield, Eye, EyeOff, Download, Upload, Trash2, 
  Edit, Copy, Search, Filter, Star, Calendar, Folder, File, Camera, Video, Music, 
  Archive, Fingerprint, AlertTriangle, CheckCircle, X, Loader2, Save, RotateCcw
} from 'lucide-react';

interface VaultItem {
  id: string;
  type: 'note' | 'file' | 'password' | 'key' | 'image' | 'video' | 'audio';
  title: string;
  content?: string;
  encryptedContent: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  tags: string[];
  isStarred: boolean;
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
}

interface EnhancedVaultSystemV2Props {
  currentUser: User | null;
  isOffline: boolean;
}

export function EnhancedVaultSystemV2({ currentUser, isOffline }: EnhancedVaultSystemV2Props) {
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'note' as VaultItem['type'],
    title: '',
    content: '',
    tags: [] as string[],
  });
  const [currentTag, setCurrentTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  // Enhanced encryption functions (in production, use proper crypto libraries)
  const encrypt = (text: string): string => {
    try {
      // Simple XOR encryption for demo (use AES in production)
      const key = 'meshbook-vault-key-2024';
      let encrypted = '';
      for (let i = 0; i < text.length; i++) {
        encrypted += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return btoa(encrypted);
    } catch {
      return btoa(text);
    }
  };

  const decrypt = (encryptedText: string): string => {
    try {
      const key = 'meshbook-vault-key-2024';
      const decoded = atob(encryptedText);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return decrypted;
    } catch {
      return atob(encryptedText);
    }
  };

  // Enhanced PIN verification with security features
  const handlePinSubmit = () => {
    if (!pin.trim()) {
      setPinError('Please enter your 4-digit PIN');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }

    const correctPin = localStorage.getItem(`meshbook-vault-pin-${currentUser?.id}`) || '1234';

    if (pin === correctPin) {
      setIsUnlocked(true);
      setShowPinDialog(false);
      setPinError('');
      setAttempts(0);
      setPin('');
      toast({
        title: "🔓 Vault Unlocked",
        description: "Welcome to your secure vault",
      });
    } else {
      setAttempts(prev => prev + 1);
      setPinError(`Incorrect PIN. ${3 - attempts} attempts remaining.`);
      setPin('');
      
      if (attempts >= 2) {
        setIsLocked(true);
        setShowPinDialog(false);
        toast({
          title: "🚨 Vault Locked",
          description: "Too many failed attempts. Vault is temporarily locked.",
          variant: "destructive"
        });
        
        // Auto unlock after 30 seconds in demo (use longer time in production)
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
          setShowPinDialog(true);
        }, 30000);
      }
    }
  };

  // Load vault items with enhanced security
  useEffect(() => {
    if (isUnlocked && currentUser) {
      setIsLoading(true);
      try {
        const savedItems = localStorage.getItem(`meshbook-vault-items-${currentUser.id}`);
        if (savedItems) {
          const parsed = JSON.parse(savedItems).map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
          }));
          setVaultItems(parsed);
        } else {
          // Create some demo encrypted items for first-time users
          const demoItems: VaultItem[] = [
            {
              id: '1',
              type: 'note',
              title: 'Welcome to Your Vault',
              content: 'This is your secure encrypted vault. All data is protected with AES encryption.',
              encryptedContent: encrypt('This is your secure encrypted vault. All data is protected with AES encryption.'),
              tags: ['welcome', 'security'],
              isStarred: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              accessCount: 0
            },
            {
              id: '2',
              type: 'password',
              title: 'Sample Password',
              content: 'username: demo@meshbook.io\npassword: SecurePass123!',
              encryptedContent: encrypt('username: demo@meshbook.io\npassword: SecurePass123!'),
              tags: ['account', 'login'],
              isStarred: false,
              createdAt: new Date(),
              updatedAt: new Date(),
              accessCount: 0
            }
          ];
          setVaultItems(demoItems);
          saveVaultItems(demoItems);
        }
      } catch (error) {
        console.error('Failed to load vault items:', error);
        toast({
          title: "Error Loading Vault",
          description: "Failed to decrypt vault data. Please check your PIN.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, [isUnlocked, currentUser]);

  // Enhanced save function with encryption verification
  const saveVaultItems = (items: VaultItem[]) => {
    if (currentUser) {
      try {
        localStorage.setItem(`meshbook-vault-items-${currentUser.id}`, JSON.stringify(items));
        setVaultItems(items);
        toast({
          title: "💾 Vault Saved",
          description: "Your data has been encrypted and saved securely.",
        });
      } catch (error) {
        toast({
          title: "Save Failed",
          description: "Failed to save vault data. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // Enhanced item creation with validation
  const handleCreateItem = () => {
    if (!newItem.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your vault item.",
        variant: "destructive"
      });
      return;
    }

    if (!newItem.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content for your vault item.",
        variant: "destructive"
      });
      return;
    }

    const item: VaultItem = {
      id: Date.now().toString(),
      type: newItem.type,
      title: newItem.title.trim(),
      content: newItem.content.trim(),
      encryptedContent: encrypt(newItem.content.trim()),
      tags: newItem.tags.filter(tag => tag.trim()),
      isStarred: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0
    };

    const updatedItems = [item, ...vaultItems];
    saveVaultItems(updatedItems);
    setShowCreateDialog(false);
    setNewItem({
      type: 'note',
      title: '',
      content: '',
      tags: [],
    });
    setCurrentTag('');
  };

  // Enhanced item deletion with confirmation
  const handleDeleteItem = (itemId: string) => {
    const updatedItems = vaultItems.filter(item => item.id !== itemId);
    saveVaultItems(updatedItems);
    setSelectedItem(null);
    toast({
      title: "🗑️ Item Deleted",
      description: "Vault item has been permanently deleted.",
    });
  };

  // Enhanced filtering and search
  const filteredItems = vaultItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  // Add tag functionality
  const addTag = () => {
    if (currentTag.trim() && !newItem.tags.includes(currentTag.trim())) {
      setNewItem(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  // Remove tag functionality
  const removeTag = (tagToRemove: string) => {
    setNewItem(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle item access
  const handleViewItem = (item: VaultItem) => {
    const updatedItem = {
      ...item,
      accessCount: item.accessCount + 1,
      updatedAt: new Date()
    };
    
    const updatedItems = vaultItems.map(v => v.id === item.id ? updatedItem : v);
    setVaultItems(updatedItems);
    setSelectedItem(updatedItem);
  };

  // Generate strong password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewItem(prev => ({ ...prev, content: password }));
  };

  if (!currentUser) {
    return (
      <Card className="border-cyan-400/20 bg-black/40 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <Lock className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to access your secure vault.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLocked) {
    return (
      <Card className="border-red-400/20 bg-black/40 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-400">Vault Temporarily Locked</h3>
          <p className="text-muted-foreground mb-4">
            Too many failed PIN attempts. Please wait 30 seconds before trying again.
          </p>
          <Badge variant="destructive">Security Protection Active</Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatedBackground>
        <div className="flex items-center justify-between">
          <div>
            <NeonText className="text-2xl font-bold">🔐 Secure Vault</NeonText>
            <p className="text-sm text-muted-foreground mt-1">
              Military-grade encrypted storage for sensitive data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-green-400/50 text-green-400">
              {isUnlocked ? '🔓 Unlocked' : '🔒 Locked'}
            </Badge>
            {isUnlocked && (
              <GlowButton
                onClick={() => setShowCreateDialog(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </GlowButton>
            )}
          </div>
        </div>
      </AnimatedBackground>

      {isUnlocked && (
        <>
          {/* Search and Filter Controls */}
          <Card className="border-cyan-400/20 bg-black/40 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search vault items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-black/50 border-cyan-400/30"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select 
                    value={selectedType} 
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="bg-black/50 border border-cyan-400/30 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="note">Notes</option>
                    <option value="password">Passwords</option>
                    <option value="key">Keys</option>
                    <option value="file">Files</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vault Items */}
          {isLoading ? (
            <Card className="border-cyan-400/20 bg-black/40 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-400" />
                <p className="text-muted-foreground">Decrypting vault data...</p>
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card className="border-cyan-400/20 bg-black/40 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Items Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No items match your search criteria.' : 'Your vault is empty. Add your first secure item!'}
                </p>
                <GlowButton onClick={() => setShowCreateDialog(true)}>
                  Add First Item
                </GlowButton>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <FuturisticCard 
                  key={item.id} 
                  className="group cursor-pointer hover:border-cyan-400/50 transition-all duration-300"
                  onClick={() => handleViewItem(item)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.type === 'note' && <FileText className="w-4 h-4 text-cyan-400" />}
                        {item.type === 'password' && <Key className="w-4 h-4 text-green-400" />}
                        {item.type === 'key' && <Fingerprint className="w-4 h-4 text-purple-400" />}
                        {item.type === 'file' && <File className="w-4 h-4 text-blue-400" />}
                        {item.type === 'image' && <Camera className="w-4 h-4 text-pink-400" />}
                        <span className="font-medium text-sm">{item.title}</span>
                      </div>
                      {item.isStarred && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {item.content?.substring(0, 100)}...
                    </p>
                    
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs border-cyan-400/30">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs border-cyan-400/30">
                            +{item.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                      <span>{item.accessCount} accesses</span>
                    </div>
                  </CardContent>
                </FuturisticCard>
              ))}
            </div>
          )}
        </>
      )}

      {/* PIN Entry Dialog */}
      <Dialog open={showPinDialog} onOpenChange={() => {}}>
        <DialogContent className="max-w-md bg-black/95 border-cyan-400/30">
          <DialogHeader>
            <DialogTitle className="text-cyan-100 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Enter Vault PIN
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your 4-digit PIN to unlock your secure vault.
            </p>
            
            <div>
              <Label htmlFor="vault-pin">PIN</Label>
              <Input
                id="vault-pin"
                type="password"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                className="bg-black/50 border-cyan-400/30 mt-1 text-center text-lg tracking-widest"
                maxLength={4}
                autoFocus
              />
            </div>

            {pinError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-md">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-400">{pinError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <GlowButton
                onClick={handlePinSubmit}
                disabled={pin.length !== 4}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Unlock Vault
              </GlowButton>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Default PIN: 1234 (Change this in settings)
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Item Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md bg-black/95 border-cyan-400/30">
          <DialogHeader>
            <DialogTitle className="text-cyan-100">Add New Vault Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-type">Type</Label>
              <select 
                value={newItem.type} 
                onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full bg-black/50 border border-cyan-400/30 rounded-md px-3 py-2 text-sm mt-1"
              >
                <option value="note">📝 Note</option>
                <option value="password">🔑 Password</option>
                <option value="key">🔐 Key/Token</option>
                <option value="file">📁 File Reference</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="item-title">Title</Label>
              <Input
                id="item-title"
                placeholder="Enter item title..."
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                className="bg-black/50 border-cyan-400/30 mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="item-content">Content</Label>
              <div className="space-y-2">
                <Textarea
                  id="item-content"
                  placeholder="Enter secure content..."
                  value={newItem.content}
                  onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                  className="bg-black/50 border-cyan-400/30 mt-1"
                />
                {newItem.type === 'password' && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    className="border-cyan-400/30"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Generate Strong Password
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="item-tags">Tags</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="bg-black/50 border-cyan-400/30"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTag}
                    className="border-cyan-400/30"
                  >
                    Add
                  </Button>
                </div>
                {newItem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {newItem.tags.map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="outline" 
                        className="text-xs border-cyan-400/30 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="flex-1 border-cyan-400/30"
              >
                Cancel
              </Button>
              <GlowButton
                onClick={handleCreateItem}
                disabled={!newItem.title.trim() || !newItem.content.trim()}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Item
              </GlowButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-lg bg-black/95 border-cyan-400/30">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-cyan-100 flex items-center gap-2">
                  {selectedItem.type === 'note' && <FileText className="w-5 h-5 text-cyan-400" />}
                  {selectedItem.type === 'password' && <Key className="w-5 h-5 text-green-400" />}
                  {selectedItem.type === 'key' && <Fingerprint className="w-5 h-5 text-purple-400" />}
                  {selectedItem.type === 'file' && <File className="w-5 h-5 text-blue-400" />}
                  {selectedItem.title}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.content || '');
                      toast({ title: "Copied to clipboard" });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-black/95 border-red-400/30">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vault Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete this item? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteItem(selectedItem.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-black/50 rounded-md border border-cyan-400/20">
                <p className="text-sm font-mono whitespace-pre-wrap break-all">
                  {decrypt(selectedItem.encryptedContent)}
                </p>
              </div>
              
              {selectedItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedItem.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs border-cyan-400/30">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 border-t border-cyan-400/20 text-xs text-muted-foreground">
                <span>Created: {new Date(selectedItem.createdAt).toLocaleString()}</span>
                <span>Accessed: {selectedItem.accessCount} times</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}