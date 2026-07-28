import { useRef, useCallback } from 'react';
import { useUploads } from '../contexts/UploadContext';

export const useBackgroundUpload = (pageId: string, label: string) => {
  const { startUpload, updateProgress, completeUpload, failUpload, dismissUpload } = useUploads();
  const registeredRef = useRef(false);

  const register = useCallback(() => {
    if (!registeredRef.current) {
      startUpload(pageId, label);
      registeredRef.current = true;
    }
  }, [pageId, label, startUpload]);

  const progress = useCallback((pct: number) => {
    updateProgress(pageId, pct);
  }, [pageId, updateProgress]);

  const complete = useCallback(() => {
    completeUpload(pageId);
    registeredRef.current = false;
  }, [pageId, completeUpload]);

  const fail = useCallback((msg: string) => {
    failUpload(pageId, msg);
    registeredRef.current = false;
  }, [pageId, failUpload]);

  const dismiss = useCallback(() => {
    dismissUpload(pageId);
    registeredRef.current = false;
  }, [pageId, dismissUpload]);

  return { register, progress, complete, fail, dismiss };
};
