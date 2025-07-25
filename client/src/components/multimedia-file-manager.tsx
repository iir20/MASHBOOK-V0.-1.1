import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FuturisticCard, GlowButton, NeonText } from './modern-futuristic-theme';

import {
  Upload, Download, File, Image, Mic, Video, Play, Pause, 
  Trash2, Share2, Eye, Music, FileText, Archive, Camera,
  Volume2, VolumeX, SkipBack, SkipForward, RotateCcw,
  Save, Edit3, Copy, FolderOpen, Search, Filter, Grid,
  List, Calendar, Clock, User, Lock, Globe, Zap
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'video' | 'document' | 'archive' | 'other';
  size: number;
  url: string;
  thumbnail?: string;
  duration?: number;
  uploadDate: Date;
  uploadedBy: string;
  isEncrypted: boolean;
  isShared: boolean;
  quality?: 'low' | 'medium' | 'high' | '4k';
  compression?: number;
  metadata?: {
    dimensions?: { width: number; height: number };
    bitrate?: number;
    codec?: string;
    tags?: string[];
  };
}

interface MultimediaFileManagerProps {
  currentUser: any;
  isOffline: boolean;
  onFileSelect?: (file: MediaFile) => void;
  allowedTypes?: string[];
  maxFileSize?: number; // in MB
}

export function MultimediaFileManager({ 
  currentUser, 
  isOffline, 
  onFileSelect,
  allowedTypes = ['image/*', 'audio/*', 'video/*', 'application/*'],
  maxFileSize = 100 
}: MultimediaFileManagerProps) {
  const [files, setFiles] = useState<MediaFile[]>([
    {
      id: '1',
      name: 'mesh-network-demo.mp4',
      type: 'video',
      size: 15724800, // 15MB
      url: '/demo-video.mp4',
      thumbnail: '/video-thumb.jpg',
      duration: 120,
      uploadDate: new Date(Date.now() - 3600000),
      uploadedBy: 'Alice',
      isEncrypted: true,
      isShared: false,
      quality: 'high',
      metadata: {
        dimensions: { width: 1920, height: 1080 },
        bitrate: 2000,
        codec: 'H.264'
      }
    },
    {
      id: '2',
      name: 'voice-message-001.webm',
      type: 'audio',
      size: 524288, // 512KB
      url: '/voice-001.webm',
      duration: 30,
      uploadDate: new Date(Date.now() - 1800000),
      uploadedBy: 'Bob',
      isEncrypted: true,
      isShared: true,
      quality: 'medium',
      metadata: {
        bitrate: 128,
        codec: 'Opus'
      }
    },
    {
      id: '3',
      name: 'mesh-topology.png',
      type: 'image',
      size: 2097152, // 2MB
      url: '/topology.png',
      thumbnail: '/topology-thumb.png',
      uploadDate: new Date(Date.now() - 7200000),
      uploadedBy: 'Charlie',
      isEncrypted: false,
      isShared: true,
      quality: 'high',
      metadata: {
        dimensions: { width: 2048, height: 1536 }
      }
    }
  ]);

  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(new Map());
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'images' | 'audio' | 'video' | 'documents'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { toast } = useToast();

  // File upload handler with compression and chunking
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    for (const file of selectedFiles) {
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the ${maxFileSize}MB limit`,
          variant: "destructive"
        });
        continue;
      }

      // Start upload progress simulation
      setUploadProgress(prev => new Map(prev.set(fileId, 0)));

      try {
        // Compress and process file
        const processedFile = await processFile(file);
        
        // Simulate chunked upload
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          setUploadProgress(prev => new Map(prev.set(fileId, progress)));
        }

        // Create media file object
        const newMediaFile: MediaFile = {
          id: fileId,
          name: file.name,
          type: getFileType(file.type),
          size: file.size,
          url: URL.createObjectURL(processedFile),
          thumbnail: await generateThumbnail(processedFile),
          duration: await getMediaDuration(processedFile),
          uploadDate: new Date(),
          uploadedBy: currentUser?.alias || 'Unknown',
          isEncrypted: true,
          isShared: false,
          quality: 'high',
          metadata: await extractMetadata(processedFile)
        };

        setFiles(prev => [newMediaFile, ...prev]);
        setUploadProgress(prev => {
          const updated = new Map(prev);
          updated.delete(fileId);
          return updated;
        });

        toast({
          title: "Upload Complete",
          description: `${file.name} uploaded successfully`,
        });

      } catch (error) {
        console.error('Upload failed:', error);
        setUploadProgress(prev => {
          const updated = new Map(prev);
          updated.delete(fileId);
          return updated;
        });
        
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [maxFileSize, currentUser, toast]);

  // File processing with compression
  const processFile = async (file: File): Promise<File> => {
    if (file.type.startsWith('image/')) {
      return await compressImage(file);
    } else if (file.type.startsWith('video/')) {
      return await compressVideo(file);
    } else if (file.type.startsWith('audio/')) {
      return await compressAudio(file);
    }
    return file;
  };

  // Image compression
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Video compression (placeholder - would need additional libraries)
  const compressVideo = async (file: File): Promise<File> => {
    // In a real implementation, you'd use ffmpeg.wasm or similar
    toast({
      title: "Video Processing",
      description: "Video compression not implemented in demo",
    });
    return file;
  };

  // Audio compression (placeholder)
  const compressAudio = async (file: File): Promise<File> => {
    // In a real implementation, you'd compress audio
    return file;
  };

  // Generate thumbnail for videos and images
  const generateThumbnail = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    } else if (file.type.startsWith('video/')) {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        video.onloadedmetadata = () => {
          video.currentTime = Math.min(5, video.duration / 2);
        };
        
        video.onseeked = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(URL.createObjectURL(blob));
            } else {
              resolve(undefined);
            }
          }, 'image/jpeg', 0.7);
        };
        
        video.src = URL.createObjectURL(file);
      });
    }
    return undefined;
  };

  // Get media duration
  const getMediaDuration = async (file: File): Promise<number | undefined> => {
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      return new Promise((resolve) => {
        const media = document.createElement(file.type.startsWith('audio/') ? 'audio' : 'video') as HTMLMediaElement;
        media.onloadedmetadata = () => {
          resolve(media.duration);
        };
        media.onerror = () => resolve(undefined);
        media.src = URL.createObjectURL(file);
      });
    }
    return undefined;
  };

  // Extract metadata
  const extractMetadata = async (file: File): Promise<MediaFile['metadata']> => {
    const metadata: MediaFile['metadata'] = {};
    
    if (file.type.startsWith('image/')) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise(resolve => img.onload = resolve);
      metadata.dimensions = { width: img.width, height: img.height };
    }
    
    return metadata;
  };

  // Utility functions
  const getFileType = (mimeType: string): MediaFile['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return 'archive';
    return 'other';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (type: MediaFile['type']) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'archive': return <Archive className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  // Filter files
  const filteredFiles = files.filter(file => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'images' && file.type === 'image') ||
                         (filter === 'audio' && file.type === 'audio') ||
                         (filter === 'video' && file.type === 'video') ||
                         (filter === 'documents' && file.type === 'document');
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Handle file selection
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const updated = new Set(prev);
      if (updated.has(fileId)) {
        updated.delete(fileId);
      } else {
        updated.add(fileId);
      }
      return updated;
    });
  };

  // Handle file preview
  const handlePreview = (file: MediaFile) => {
    setPreviewFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  // Media controls
  const togglePlayback = () => {
    if (previewFile?.type === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (previewFile?.type === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <FuturisticCard>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-400" />
              <NeonText>Media Library</NeonText>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept={allowedTypes.join(',')}
                className="hidden"
              />
              
              <GlowButton 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </GlowButton>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />
            </div>
            
            <div className="flex gap-1">
              {['all', 'images', 'audio', 'video', 'documents'].map((filterType) => (
                <Button
                  key={filterType}
                  variant={filter === filterType ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(filterType as any)}
                  className="capitalize"
                >
                  {filterType}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        {/* Upload Progress */}
        {uploadProgress.size > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              {Array.from(uploadProgress.entries()).map(([fileId, progress]) => (
                <div key={fileId} className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-blue-400" />
                  <div className="flex-1">
                    <Progress value={progress} className="h-2" />
                  </div>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </FuturisticCard>

      {/* File Grid/List */}
      <FuturisticCard>
        <CardContent className="p-4">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedFiles.has(file.id) 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-muted/20 hover:border-muted/40'
                  }`}
                  onClick={() => handlePreview(file)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square mb-2 rounded bg-muted/20 flex items-center justify-center overflow-hidden">
                    {file.thumbnail ? (
                      <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-muted-foreground">
                        {getFileIcon(file.type)}
                      </div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium truncate">{file.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      {file.duration && <span>{formatDuration(file.duration)}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {file.isEncrypted && <Lock className="h-3 w-3 text-green-400" />}
                      {file.isShared && <Globe className="h-3 w-3 text-blue-400" />}
                      <Badge variant="outline" className="text-xs">
                        {file.quality}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Selection checkbox */}
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded border border-muted-foreground cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFileSelection(file.id);
                    }}
                  >
                    {selectedFiles.has(file.id) && (
                      <div className="w-full h-full bg-blue-500 rounded flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                    selectedFiles.has(file.id) 
                      ? 'border-blue-500 bg-blue-500/10' 
                      : 'border-muted/20 hover:border-muted/40'
                  }`}
                  onClick={() => handlePreview(file)}
                >
                  <div className="w-12 h-12 rounded bg-muted/20 flex items-center justify-center">
                    {file.thumbnail ? (
                      <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      getFileIcon(file.type)
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{file.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Uploaded by {file.uploadedBy} • {formatFileSize(file.size)}
                      {file.duration && ` • ${formatDuration(file.duration)}`}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.isEncrypted && <Lock className="h-4 w-4 text-green-400" />}
                    {file.isShared && <Globe className="h-4 w-4 text-blue-400" />}
                    <Badge variant="outline">{file.quality}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </FuturisticCard>

      {/* Media Preview */}
      {previewFile && (
        <FuturisticCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getFileIcon(previewFile.type)}
              Preview: {previewFile.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {previewFile.type === 'image' && (
              <div className="max-w-md mx-auto">
                <img 
                  src={previewFile.url} 
                  alt={previewFile.name}
                  className="w-full rounded-lg"
                />
              </div>
            )}
            
            {previewFile.type === 'audio' && (
              <div className="space-y-4">
                <audio
                  ref={audioRef}
                  src={previewFile.url}
                  onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
                
                <div className="flex items-center gap-4">
                  <Button onClick={togglePlayback} variant="ghost" size="sm">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <div className="flex-1">
                    <Progress 
                      value={previewFile.duration ? (currentTime / previewFile.duration) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <span className="text-sm text-muted-foreground">
                    {formatDuration(currentTime)} / {formatDuration(previewFile.duration || 0)}
                  </span>
                </div>
              </div>
            )}
            
            {previewFile.type === 'video' && (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  src={previewFile.url}
                  onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                  onEnded={() => setIsPlaying(false)}
                  className="w-full max-w-2xl mx-auto rounded-lg"
                  controls
                />
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Size: {formatFileSize(previewFile.size)} • 
                Uploaded: {previewFile.uploadDate.toLocaleDateString()}
              </div>
              
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </FuturisticCard>
      )}
    </div>
  );
}