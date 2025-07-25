import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { offlineStorage } from '@/lib/offline-storage';
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

  // Encrypt data using Web Crypto API
  const encryptData = async (data: string, password: string): Promise<string> => {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const passwordBuffer = encoder.encode(password);
      
      const key = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        key,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        dataBuffer
      );
      
      const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      result.set(salt, 0);
      result.set(iv, salt.length);
      result.set(new Uint8Array(encrypted), salt.length + iv.length);
      
      return btoa(String.fromCharCode.apply(null, Array.from(result)));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  };

  // Decrypt data
  const decryptData = async (encryptedData: string, password: string): Promise<string> => {
    try {
      const data = new Uint8Array(atob(encryptedData).split('').map(c => c.charCodeAt(0)));
      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);
      
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
      
      const key = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        key,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data - check password');
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Files must be smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result as string;
        
        // Compress data
        const { compress } = await import('@/lib/lz-string');
        const compressedData = compress(data);
        const compressionRatio = compressedData.length / data.length;
        
        // Encrypt if password provided
        let finalData = compressedData;
        let isEncrypted = false;
        
        if (encryptionKey) {
          finalData = await encryptData(compressedData, encryptionKey);
          isEncrypted = true;
        }

        const newFile: VaultFile = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          encryptedData: finalData,
          isEncrypted,
          tags: [],
          createdAt: new Date(),
          lastAccessed: new Date(),
          isStarred: false,
          description: '',
          compressionRatio
        };

        const updatedFiles = [newFile, ...files];
        saveFiles(updatedFiles);
        
        toast({
          title: "File Uploaded",
          description: `${file.name} saved securely to vault`
        });
        
        setEncryptionKey('');
      };
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress((e.loaded / e.total) * 100);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to save file to vault",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file download
  const handleFileDownload = async (file: VaultFile) => {
    try {
      let data = file.encryptedData;
      
      // Decrypt if encrypted
      if (file.isEncrypted) {
        if (!encryptionKey) {
          toast({
            title: "Password Required",
            description: "Enter the encryption password to download this file",
            variant: "destructive"
          });
          return;
        }
        data = await decryptData(data, encryptionKey);
      }
      
      // Decompress
      const { decompress } = await import('@/lib/lz-string');
      const decompressedData = decompress(data);
      
      // Create download link
      const link = document.createElement('a');
      link.href = decompressedData || data;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Update last accessed
      const updatedFiles = files.map(f => 
        f.id === file.id ? { ...f, lastAccessed: new Date() } : f
      );
      saveFiles(updatedFiles);
      
      toast({
        title: "File Downloaded",
        description: `${file.name} downloaded successfully`
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download file - check password",
        variant: "destructive"
      });
    }
  };

  // Filter files
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         file.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || 
      (filterType === 'images' && file.type.startsWith('image/')) ||
      (filterType === 'videos' && file.type.startsWith('video/')) ||
      (filterType === 'audio' && file.type.startsWith('audio/')) ||
      (filterType === 'documents' && file.type.includes('document'));
    
    const matchesEncryption = showEncrypted || !file.isEncrypted;
    
    return matchesSearch && matchesType && matchesEncryption;
  });

  // Get file icon
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    return File;
  };

  // Format file size
  const formatSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Secure Vault</h2>
          <p className="text-gray-400">Local encrypted file storage</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-400 border-green-400">
            {isOffline ? 'Offline Mode' : 'Online Mode'}
          </Badge>
        </div>
      </div>

      {/* Storage Info */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Storage Used</span>
            <span className="text-sm text-white">
              {formatSize(storageInfo.used)} / {formatSize(storageInfo.total)}
            </span>
          </div>
          <Progress 
            value={(storageInfo.used / storageInfo.total) * 100} 
            className="h-2"
          />
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Compression: {formatSize(storageInfo.compressed)} saved</span>
            <span>{files.length} files stored</span>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Files
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1"
            />
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <Input
                type="password"
                placeholder="Encryption password (optional)"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                className="w-48"
              />
            </div>
          </div>
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Uploading...</span>
                <span className="text-white">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
          >
            <option value="all">All Files</option>
            <option value="images">Images</option>
            <option value="videos">Videos</option>
            <option value="audio">Audio</option>
            <option value="documents">Documents</option>
          </select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEncrypted(!showEncrypted)}
            className={showEncrypted ? "text-green-400 border-green-400" : ""}
          >
            {showEncrypted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Files Display */}
      <div className={viewMode === 'grid' ? 
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : 
        "space-y-2"
      }>
        {filteredFiles.map((file) => {
          const FileIcon = getFileIcon(file.type);
          
          return (
            <Card 
              key={file.id}
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer"
              onClick={() => setSelectedFile(file)}
            >
              <CardContent className={viewMode === 'grid' ? "p-4" : "p-3"}>
                <div className={viewMode === 'grid' ? "space-y-3" : "flex items-center space-x-3"}>
                  <div className="flex items-center space-x-2">
                    <FileIcon className="w-5 h-5 text-blue-400" />
                    {file.isEncrypted && <Lock className="w-3 h-3 text-yellow-400" />}
                    {file.isStarred && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{file.name}</h3>
                    <p className="text-sm text-gray-400">
                      {formatSize(file.size)} • {file.compressionRatio < 1 ? 
                        `${Math.round((1 - file.compressionRatio) * 100)}% compressed` : 
                        'No compression'
                      }
                    </p>
                    {viewMode === 'list' && (
                      <p className="text-xs text-gray-500">
                        {file.createdAt.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFileDownload(file);
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <Archive className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No files found</h3>
          <p className="text-gray-500">
            {files.length === 0 ? 
              "Upload your first file to get started" : 
              "Try adjusting your search or filter criteria"
            }
          </p>
        </div>
      )}

      {/* Decryption Password Input */}
      {selectedFile?.isEncrypted && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Key className="w-5 h-5 text-yellow-400" />
              <Input
                type="password"
                placeholder="Enter decryption password"
                value={encryptionKey}
                onChange={(e) => setEncryptionKey(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => handleFileDownload(selectedFile)}
                disabled={!encryptionKey}
              >
                Decrypt & Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}