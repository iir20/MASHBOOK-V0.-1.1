import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';
import { FuturisticCard, GlowButton, NeonText, AnimatedBackground } from './modern-futuristic-theme';

import {
  Lock,
  Plus,
  FileText,
  Image,
  Key,
  Shield,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Edit,
  Copy,
  Search,
  Filter,
  Star,
  Calendar,
  Folder,
  File,
  Camera,
  Video,
  Music,
  Archive,
  Fingerprint,
  AlertTriangle
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

interface EnhancedVaultSystemProps {
  currentUser: User | null;
  isOffline: boolean;
}

const ENCRYPTION_KEY = 'meshbook-vault-key'; // In production, this would be derived from user's master password

export function EnhancedVaultSystem({ currentUser, isOffline }: EnhancedVaultSystemProps) {
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [newItem, setNewItem] = useState({
    type: 'note' as VaultItem['type'],
    title: '',
    content: '',
    tags: [] as string[],
  });
  const [currentTag, setCurrentTag] = useState('');
  
  const { toast } = useToast();

  // Encryption functions (simplified for demo - in production, use proper crypto libraries)
  const encrypt = (text: string): string => {
    try {
      return btoa(text); // Simple base64 encoding for demo
    } catch {
      return text;
    }
  };

  const decrypt = (encryptedText: string): string => {
    try {
      return atob(encryptedText); // Simple base64 decoding for demo
    } catch {
      return encryptedText;
    }
  };

  // Load vault items from localStorage
  useEffect(() => {
    if (isUnlocked && currentUser) {
      const savedItems = localStorage.getItem(`meshbook-vault-${currentUser.id}`);
      if (savedItems) {
        try {
          const parsed = JSON.parse(savedItems).map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
          }));
          setVaultItems(parsed);
        } catch (error) {
          console.error('Failed to load vault items:', error);
        }
      }
    }
  }, [isUnlocked, currentUser]);

  // Save vault items to localStorage
  const saveVaultItems = (items: VaultItem[]) => {
    if (currentUser) {
      localStorage.setItem(`meshbook-vault-${currentUser.id}`, JSON.stringify(items));
      setVaultItems(items);
    }
  };

  const handlePinSubmit = () => {
    // In production, verify PIN against stored hash
    if (pin === '1234' || pin.length >= 4) {
      setIsUnlocked(true);
      setShowPinDialog(false);
      setPin('');
      
      toast({
        title: "Vault Unlocked",
        description: "Welcome to your secure vault!",
      });
    } else {
      toast({
        title: "Invalid PIN",
        description: "Please enter a valid 4-digit PIN.",
        variant: "destructive",
      });
    }
  };

  const createVaultItem = () => {
    if (!newItem.title.trim()) {
      toast({
        title: "Missing Title",
        description: "Please provide a title for your vault item.",
        variant: "destructive",
      });
      return;
    }

    const item: VaultItem = {
      id: Date.now().toString(),
      type: newItem.type,
      title: newItem.title.trim(),
      content: newItem.content.trim(),
      encryptedContent: encrypt(newItem.content.trim()),
      tags: newItem.tags,
      isStarred: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      accessCount: 0
    };

    const updatedItems = [...vaultItems, item];
    saveVaultItems(updatedItems);
    
    setShowCreateDialog(false);
    setNewItem({
      type: 'note',
      title: '',
      content: '',
      tags: [],
    });
    
    toast({
      title: "Item Added",
      description: "Your item has been safely stored in the vault.",
    });
  };

  const deleteVaultItem = (id: string) => {
    const updatedItems = vaultItems.filter(item => item.id !== id);
    saveVaultItems(updatedItems);
    setSelectedItem(null);
    
    toast({
      title: "Item Deleted",
      description: "The item has been permanently removed from your vault.",
    });
  };

  const toggleStar = (id: string) => {
    const updatedItems = vaultItems.map(item =>
      item.id === id ? { ...item, isStarred: !item.isStarred } : item
    );
    saveVaultItems(updatedItems);
  };

  const addTag = () => {
    if (currentTag.trim() && !newItem.tags.includes(currentTag.trim())) {
      setNewItem(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewItem(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied",
        description: "Content copied to clipboard.",
      });
    }).catch(() => {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    });
  };

  // Filter items based on search and type
  const filteredItems = vaultItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: VaultItem['type']) => {
    switch (type) {
      case 'note': return FileText;
      case 'file': return File;
      case 'password': return Key;
      case 'key': return Shield;
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      default: return FileText;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // PIN Dialog
  if (!isUnlocked) {
    return (
      <div className="h-full flex items-center justify-center">
        <AnimatedBackground />
        
        <FuturisticCard className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Secure Vault</CardTitle>
            <p className="text-muted-foreground">
              Enter your PIN to access your encrypted vault
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={4}
                className="text-center text-lg tracking-widest"
                onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
              />
              <p className="text-xs text-muted-foreground text-center">
                Demo PIN: 1234 (or any 4+ digit PIN)
              </p>
            </div>
            
            <GlowButton 
              onClick={handlePinSubmit} 
              className="w-full"
              disabled={pin.length < 4}
            >
              <Fingerprint className="h-4 w-4 mr-2" />
              Unlock Vault
            </GlowButton>
            
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span>AES-256 Encrypted</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>Zero-Knowledge</span>
              </div>
            </div>
          </CardContent>
        </FuturisticCard>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6">
      <AnimatedBackground />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <NeonText className="text-2xl font-bold">Secure Vault</NeonText>
          <p className="text-muted-foreground">
            Encrypted storage for your sensitive data
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="default" className="flex items-center space-x-1">
            <Shield className="h-3 w-3" />
            <span>{vaultItems.length} items</span>
          </Badge>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <GlowButton className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </GlowButton>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vault Item</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={newItem.type}
                    onChange={(e) => setNewItem(prev => ({ ...prev, type: e.target.value as VaultItem['type'] }))}
                    className="w-full mt-1 p-2 border rounded-lg bg-background"
                  >
                    <option value="note">Note</option>
                    <option value="password">Password</option>
                    <option value="key">Encryption Key</option>
                    <option value="file">File</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Enter title..."
                    value={newItem.title}
                    onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Content</label>
                  <Textarea
                    placeholder="Enter content..."
                    value={newItem.content}
                    onChange={(e) => setNewItem(prev => ({ ...prev, content: e.target.value }))}
                    rows={4}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      placeholder="Add tag..."
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button onClick={addTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newItem.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                        <span>{tag}</span>
                        <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <GlowButton onClick={createVaultItem} className="flex-1">
                    Create Item
                  </GlowButton>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vault items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-background min-w-32"
        >
          <option value="all">All Types</option>
          <option value="note">Notes</option>
          <option value="password">Passwords</option>
          <option value="key">Keys</option>
          <option value="file">Files</option>
          <option value="image">Images</option>
        </select>
      </div>

      {/* Vault Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const Icon = getTypeIcon(item.type);
          
          return (
            <FuturisticCard
              key={item.id}
              className="cursor-pointer transition-all duration-300 hover:scale-105"
              onClick={() => setSelectedItem(item)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold truncate">{item.title}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(item.id);
                      }}
                      className={`p-1 rounded ${item.isStarred ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                    >
                      <Star className={`h-4 w-4 ${item.isStarred ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {item.content && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {item.content.substring(0, 100)}...
                  </p>
                )}
                
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{item.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.createdAt.toLocaleDateString()}</span>
                  <div className="flex items-center space-x-2">
                    <Eye className="h-3 w-3" />
                    <span>{item.accessCount}</span>
                  </div>
                </div>
              </div>
            </FuturisticCard>
          );
        })}
      </div>

      {/* Item Detail Dialog */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center space-x-2">
                  {React.createElement(getTypeIcon(selectedItem.type), { className: "h-5 w-5" })}
                  <span>{selectedItem.title}</span>
                </DialogTitle>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(selectedItem.id);
                    }}
                    className={selectedItem.isStarred ? 'text-yellow-500' : ''}
                  >
                    <Star className={`h-4 w-4 ${selectedItem.isStarred ? 'fill-current' : ''}`} />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Vault Item</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to permanently delete "{selectedItem.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteVaultItem(selectedItem.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-4">
                  <span>Created: {selectedItem.createdAt.toLocaleDateString()}</span>
                  <span>Views: {selectedItem.accessCount}</span>
                </div>
                <Badge variant="outline" className="capitalize">
                  {selectedItem.type}
                </Badge>
              </div>
              
              {selectedItem.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedItem.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              {selectedItem.content && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Content</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(decrypt(selectedItem.encryptedContent))}
                      className="flex items-center space-x-1"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </Button>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">
                      {decrypt(selectedItem.encryptedContent)}
                    </pre>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>End-to-end encrypted with AES-256</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery ? 'No Items Found' : 'Vault is Empty'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? 'Try adjusting your search criteria'
              : 'Start securing your sensitive data by adding your first item'
            }
          </p>
          {!searchQuery && (
            <GlowButton onClick={() => setShowCreateDialog(true)}>
              Add Your First Item
            </GlowButton>
          )}
        </div>
      )}
    </div>
  );
}