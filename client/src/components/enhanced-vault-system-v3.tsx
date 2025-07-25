import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { offlineStorage } from '@/lib/offline-storage';
import { vaultEncryption, type EncryptedFile } from '@/lib/vault-encryption';
import type { User } from '@shared/schema';

import {
  Upload, Download, Lock, Unlock, File, Image, Video, Music,
  Trash2, Eye, EyeOff, Shield, Key, Search, Filter, Grid,
  List, Calendar, Star, Archive, Share, Copy, CheckCircle,
  AlertCircle, HardDrive, Zap, Database
} from 'lucide-react';

interface VaultFile {
  id: string;
  name: string;
  size: number;
  type: string;
  encryptedData: string;
  isEncrypted: boolean;
  tags: string[];
  createdAt: Date;
  lastAccessed: Date;
  isStarred: boolean;
  description: string;
  compressionRatio: number;
  securityLevel: string;
  checksum: string;
}

interface EnhancedVaultSystemV3Props {
  currentUser: User | null;
  isOffline: boolean;
}

export function EnhancedVaultSystemV3({ currentUser, isOffline }: EnhancedVaultSystemV3Props) {
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'images' | 'videos' | 'audio' | 'documents'>('all');
  const [showEncrypted, setShowEncrypted] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<VaultFile | null>(null);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [storageInfo, setStorageInfo] = useState({ used: 0, total: 0, compressed: 0 });
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<'encrypt' | 'decrypt' | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [securityMode, setSecurityMode] = useState<'basic' | 'advanced' | 'military'>('military');
  
  const { toast } = useToast();

  // Load files from local storage
  useEffect(() => {
    loadFiles();
    updateStorageInfo();
  }, []);

  const loadFiles = () => {
    const savedFiles = offlineStorage.getSettings()?.vaultFiles || [];
    setFiles(savedFiles);
  };

  const saveFiles = (newFiles: VaultFile[]) => {
    setFiles(newFiles);
    offlineStorage.saveSettings({ vaultFiles: newFiles });
    updateStorageInfo();
  };

  const updateStorageInfo = () => {
    const info = offlineStorage.getStorageInfo();
    setStorageInfo({
      used: info.size,
      total: 50 * 1024 * 1024, // 50MB limit
      compressed: info.compressed
    });
  };

  // Enhanced file upload with military-grade encryption
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    for (const file of Array.from(uploadedFiles)) {
      if (!encryptionKey) {
        toast({
          title: "Encryption Required",
          description: "Please set an encryption password before uploading files.",
          variant: "destructive"
        });
        setShowPasswordDialog(true);
        setCurrentAction('encrypt');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Use military-grade encryption
        const encryptedFile = await vaultEncryption.encryptFile(file, encryptionKey);
        
        // Calculate compression ratio
        const originalSize = file.size;
        const encryptedSize = encryptedFile.encryptedData.byteLength;
        const compressionRatio = ((originalSize - encryptedSize) / originalSize) * 100;

        const vaultFile: VaultFile = {
          id: encryptedFile.id,
          name: encryptedFile.name,
          size: encryptedFile.size,
          type: encryptedFile.type,
          encryptedData: vaultEncryption.exportEncryptedFile(encryptedFile),
          isEncrypted: true,
          tags: [],
          createdAt: new Date(encryptedFile.timestamp),
          lastAccessed: new Date(),
          isStarred: false,
          description: '',
          compressionRatio: Math.max(0, compressionRatio),
          securityLevel: vaultEncryption.getEncryptionInfo().securityLevel,
          checksum: encryptedFile.checksum
        };

        const newFiles = [...files, vaultFile];
        saveFiles(newFiles);

        toast({
          title: "File Encrypted & Stored",
          description: `${file.name} has been secured with military-grade encryption`,
        });

        setUploadProgress(100);
      } catch (error: any) {
        toast({
          title: "Upload Failed",
          description: error.message || "Failed to encrypt and store file",
          variant: "destructive"
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  // Password strength calculator
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[a-z]/.test(password)) strength += 10;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    return Math.min(100, strength);
  };

  // Handle password change
  const handlePasswordChange = (password: string) => {
    setEncryptionKey(password);
    setPasswordStrength(calculatePasswordStrength(password));
  };

  // Decrypt and download file
  const handleFileDecrypt = async (file: VaultFile) => {
    if (!encryptionKey) {
      toast({
        title: "Password Required",
        description: "Please enter your encryption password to decrypt this file.",
        variant: "destructive"
      });
      setShowPasswordDialog(true);
      setCurrentAction('decrypt');
      setSelectedFile(file);
      return;
    }

    try {
      const encryptedFile = vaultEncryption.importEncryptedFile(file.encryptedData);
      const decryptedFile = await vaultEncryption.decryptFile(encryptedFile, encryptionKey);
      
      // Create download link
      const url = URL.createObjectURL(decryptedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = decryptedFile.name;
      a.click();
      URL.revokeObjectURL(url);

      // Update last accessed
      file.lastAccessed = new Date();
      const updatedFiles = files.map(f => f.id === file.id ? file : f);
      saveFiles(updatedFiles);

      toast({
        title: "File Decrypted",
        description: `${file.name} has been successfully decrypted and downloaded`,
      });
    } catch (error: any) {
      toast({
        title: "Decryption Failed",
        description: error.message || "Failed to decrypt file - check your password",
        variant: "destructive"
      });
    }
  };

  // Generate secure password
  const generateSecurePassword = () => {
    const password = vaultEncryption.generateSecurePassword(16);
    setEncryptionKey(password);
    setPasswordStrength(calculatePasswordStrength(password));
    toast({
      title: "Secure Password Generated",
      description: "A military-grade password has been generated. Please save it securely.",
    });
  };

  // Filter files based on search and type
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || 
                       (filterType === 'images' && file.type.startsWith('image/')) ||
                       (filterType === 'videos' && file.type.startsWith('video/')) ||
                       (filterType === 'audio' && file.type.startsWith('audio/')) ||
                       (filterType === 'documents' && !file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/'));
    const matchesEncryption = showEncrypted ? true : !file.isEncrypted;
    
    return matchesSearch && matchesType && matchesEncryption;
  });

  return (
    <div className="space-y-6">
      {/* Security Header */}
      <Card className="border-red-500/30 bg-gradient-to-r from-red-900/20 to-orange-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-400">
            <Shield className="w-5 h-5" />
            Military-Grade Vault Security
            <Badge variant="destructive">AES-256-GCM</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">Encryption Password</span>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Enter secure password..."
                  value={encryptionKey}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={generateSecurePassword}
                  variant="outline"
                  size="sm"
                  className="border-blue-500/50 hover:border-blue-400"
                >
                  Generate
                </Button>
              </div>
              {encryptionKey && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Password Strength</span>
                    <span className={passwordStrength >= 80 ? 'text-green-400' : passwordStrength >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                      {passwordStrength >= 80 ? 'Military' : passwordStrength >= 60 ? 'Strong' : passwordStrength >= 40 ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                  <Progress 
                    value={passwordStrength} 
                    className="h-2"
                    style={{
                      '--progress-background': passwordStrength >= 80 ? '#10b981' : passwordStrength >= 60 ? '#f59e0b' : '#ef4444'
                    } as any}
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">Storage Usage</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Used: {(storageInfo.used / 1024 / 1024).toFixed(1)} MB</span>
                  <span>Total: {(storageInfo.total / 1024 / 1024).toFixed(0)} MB</span>
                </div>
                <Progress value={(storageInfo.used / storageInfo.total) * 100} className="h-2" />
                <div className="text-xs text-green-400">
                  Compressed: {((storageInfo.compressed / storageInfo.used) * 100 || 0).toFixed(1)}% saved
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">Security Level</span>
              </div>
              <div className="space-y-1">
                <Badge variant="outline" className="border-green-500/50 text-green-400">
                  {vaultEncryption.getEncryptionInfo().securityLevel}
                </Badge>
                <div className="text-xs text-gray-400">
                  {vaultEncryption.getEncryptionInfo().iterations.toLocaleString()} iterations
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Secure File Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500/50 transition-colors">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
              <p className="text-sm text-gray-400">All files will be encrypted with military-grade security</p>
            </label>
            
            {isUploading && (
              <div className="mt-4 space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-sm text-blue-400">Encrypting and storing file...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Management */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Encrypted Files ({filteredFiles.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 bg-background border border-border rounded-md"
            >
              <option value="all">All Files</option>
              <option value="images">Images</option>
              <option value="videos">Videos</option>
              <option value="audio">Audio</option>
              <option value="documents">Documents</option>
            </select>
          </div>

          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
            {filteredFiles.map(file => (
              <Card key={file.id} className="border-blue-500/30 bg-gradient-to-br from-blue-900/10 to-purple-900/10">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {file.type.startsWith('image/') ? <Image className="w-4 h-4" /> :
                       file.type.startsWith('video/') ? <Video className="w-4 h-4" /> :
                       file.type.startsWith('audio/') ? <Music className="w-4 h-4" /> :
                       <File className="w-4 h-4" />}
                      <span className="text-sm font-medium truncate">{file.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {file.isEncrypted ? 'Encrypted' : 'Plain'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-400">
                    <div>Size: {(file.size / 1024).toFixed(1)} KB</div>
                    <div>Security: {file.securityLevel || 'Basic'}</div>
                    <div>Created: {file.createdAt.toLocaleDateString()}</div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <Button
                      onClick={() => handleFileDecrypt(file)}
                      size="sm"
                      variant="outline"
                      className="border-green-500/50 hover:border-green-400"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Decrypt
                    </Button>
                    <Button
                      onClick={() => {
                        const newFiles = files.filter(f => f.id !== file.id);
                        saveFiles(newFiles);
                      }}
                      size="sm"
                      variant="outline"
                      className="border-red-500/50 hover:border-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredFiles.length === 0 && (
            <div className="text-center py-12">
              <HardDrive className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No files found</p>
              <p className="text-sm text-gray-400">Upload some files to get started with secure storage</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}