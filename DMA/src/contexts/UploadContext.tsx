import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface ActiveUpload {
  id: string;
  label: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface UploadContextType {
  uploads: ActiveUpload[];
  startUpload: (id: string, label: string) => void;
  updateProgress: (id: string, progress: number) => void;
  completeUpload: (id: string) => void;
  failUpload: (id: string, errorMessage: string) => void;
  dismissUpload: (id: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const UploadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uploads, setUploads] = useState<ActiveUpload[]>([]);
  const uploadsRef = useRef(uploads);
  uploadsRef.current = uploads;

  const startUpload = useCallback((id: string, label: string) => {
    setUploads((prev) => {
      const filtered = prev.filter((u) => u.id !== id);
      return [...filtered, { id, label, progress: 0, status: 'uploading' }];
    });
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, progress } : u))
    );
  }, []);

  const completeUpload = useCallback((id: string) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, progress: 100, status: 'success' as const } : u))
    );
    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => u.id !== id));
    }, 3000);
  }, []);

  const failUpload = useCallback((id: string, errorMessage: string) => {
    setUploads((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: 'error' as const, errorMessage } : u))
    );
  }, []);

  const dismissUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  }, []);

  return (
    <UploadContext.Provider value={{ uploads, startUpload, updateProgress, completeUpload, failUpload, dismissUpload }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUploads = () => {
  const ctx = useContext(UploadContext);
  if (!ctx) throw new Error('useUploads must be used within UploadProvider');
  return ctx;
};
