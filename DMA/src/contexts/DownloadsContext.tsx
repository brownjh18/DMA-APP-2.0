import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { useNetwork } from './NetworkContext';

export interface DownloadItem {
  id: string;
  title: string;
  type: 'sermon' | 'podcast';
  url: string;
  localPath?: string;
  thumbnailUrl: string;
  downloadedAt: number;
  fileSize?: number;
  duration?: string;
  status: 'downloading' | 'completed' | 'error' | 'pending';
  progress: number;
  error?: string;
  // Original ID for reference
  originalId: string;
}

interface DownloadsContextType {
  downloads: DownloadItem[];
  downloadMedia: (item: Omit<DownloadItem, 'id' | 'downloadedAt' | 'status' | 'progress'>) => Promise<void>;
  removeDownload: (id: string) => Promise<void>;
  getDownloadedMedia: () => DownloadItem[];
  isDownloaded: (originalId: string) => boolean;
  getLocalPath: (originalId: string) => string | undefined;
  clearAllDownloads: () => Promise<void>;
  getStorageUsage: () => Promise<{ used: number; available: number }>;
}

const DownloadsContext = createContext<DownloadsContextType | undefined>(undefined);

export const useDownloads = () => {
  const context = useContext(DownloadsContext);
  if (!context) {
    throw new Error('useDownloads must be used within a DownloadsProvider');
  }
  return context;
};

interface DownloadsProviderProps {
  children: ReactNode;
}

export const DownloadsProvider: React.FC<DownloadsProviderProps> = ({ children }) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const { isOnline } = useNetwork();

  // Load downloads from localStorage on mount
  useEffect(() => {
    const savedDownloads = localStorage.getItem('dma_downloads');
    if (savedDownloads) {
      try {
        setDownloads(JSON.parse(savedDownloads));
      } catch (error) {
        console.warn('Failed to load downloads from localStorage:', error);
      }
    }
  }, []);

  // Save downloads to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dma_downloads', JSON.stringify(downloads));
  }, [downloads]);

  const downloadMedia = async (item: Omit<DownloadItem, 'id' | 'downloadedAt' | 'status' | 'progress' | 'originalId'> & { originalId: string }) => {
    const id = `${item.type}_${item.originalId}_${Date.now()}`;
    const downloadItem: DownloadItem = {
      ...item,
      id,
      originalId: item.originalId,
      downloadedAt: Date.now(),
      status: 'downloading',
      progress: 0
    };

    setDownloads(prev => [...prev, downloadItem]);

    try {
      if (!isOnline) {
        throw new Error('Cannot download while offline');
      }

      // Create DMA downloads directory if it doesn't exist
      try {
        await Filesystem.mkdir({
          path: 'DMA/Downloads',
          directory: Directory.Documents,
          recursive: true
        });
      } catch (error) {
        // Directory might already exist, continue
      }

      // Generate safe filename
      const fileExtension = item.url.split('.').pop() || 'mp3';
      const safeTitle = item.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
      const fileName = `${item.type}_${safeTitle}_${id}.${fileExtension}`;
      const filePath = `DMA/Downloads/${fileName}`;

      // Download the file
      const response = await fetch(item.url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();
      
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      await Filesystem.writeFile({
        path: filePath,
        data: dataUrl,
        directory: Directory.Documents
      });

      // Update download status to completed
      setDownloads(prev => prev.map(d => 
        d.id === id 
          ? { ...d, status: 'completed', progress: 100, localPath: filePath }
          : d
      ));

      console.log(`✅ Downloaded ${item.title} successfully`);

    } catch (error) {
      console.error('Download failed:', error);
      setDownloads(prev => prev.map(d => 
        d.id === id 
          ? { ...d, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
          : d
      ));
    }
  };

  const removeDownload = async (id: string) => {
    const download = downloads.find(d => d.id === id);
    
    if (download?.localPath) {
      try {
        await Filesystem.rmdir({
          path: download.localPath,
          directory: Directory.Documents
        });
      } catch (error) {
        console.warn('Failed to delete file from filesystem:', error);
      }
    }

    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  const getDownloadedMedia = () => {
    return downloads.filter(d => d.status === 'completed');
  };

  const isDownloaded = (id: string) => {
    return downloads.some(d => d.id === id && d.status === 'completed');
  };

  const getLocalPath = (id: string) => {
    const download = downloads.find(d => d.id === id);
    return download?.localPath;
  };

  const clearAllDownloads = async () => {
    // Delete all files from filesystem
    for (const download of downloads) {
      if (download.localPath) {
        try {
          await Filesystem.rmdir({
            path: download.localPath,
            directory: Directory.Documents
          });
        } catch (error) {
          console.warn('Failed to delete file:', error);
        }
      }
    }

    setDownloads([]);
  };

  const getStorageUsage = async () => {
    try {
      const stat = await Filesystem.stat({
        path: 'DMA/Downloads',
        directory: Directory.Documents
      });
      
      return {
        used: stat.size || 0,
        available: 1024 * 1024 * 1024 // Assume 1GB available for now
      };
    } catch (error) {
      console.warn('Failed to get storage usage:', error);
      return { used: 0, available: 1024 * 1024 * 1024 };
    }
  };

  const value: DownloadsContextType = {
    downloads,
    downloadMedia,
    removeDownload,
    getDownloadedMedia,
    isDownloaded,
    getLocalPath,
    clearAllDownloads,
    getStorageUsage
  };

  return (
    <DownloadsContext.Provider value={value}>
      {children}
    </DownloadsContext.Provider>
  );
};