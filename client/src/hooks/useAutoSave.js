import { useState, useEffect, useRef, useCallback } from 'react';

export default function useAutoSave(applicationId, formData, saveFunction, intervalMs = 120000) {
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef(null);
  const formDataRef = useRef(formData);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  const saveNow = useCallback(async () => {
    if (!applicationId || !saveFunction) return;
    setIsSaving(true);
    try {
      await saveFunction(applicationId, formDataRef.current);
      setLastSavedAt(new Date());
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [applicationId, saveFunction]);

  useEffect(() => {
    if (!applicationId || !saveFunction) return;

    timerRef.current = setInterval(() => {
      saveNow();
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [applicationId, saveFunction, intervalMs, saveNow]);

  return { lastSavedAt, isSaving, saveNow };
}
