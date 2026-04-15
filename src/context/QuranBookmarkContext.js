import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadBookmark, saveBookmark, clearBookmark } from '../storage/quranBookmarkStorage';

const QuranBookmarkContext = createContext(null);

export function QuranBookmarkProvider({ children }) {
  const [bookmark, setBookmark] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadBookmark().then((b) => {
      setBookmark(b);
      setIsLoaded(true);
    });
  }, []);

  const updateBookmark = useCallback(async (data) => {
    await saveBookmark(data);
    setBookmark({ ...data, updatedAt: new Date().toISOString() });
  }, []);

  const removeBookmark = useCallback(async () => {
    await clearBookmark();
    setBookmark(null);
  }, []);

  return (
    <QuranBookmarkContext.Provider value={{ bookmark, isLoaded, updateBookmark, removeBookmark }}>
      {children}
    </QuranBookmarkContext.Provider>
  );
}

export function useQuranBookmark() {
  const ctx = useContext(QuranBookmarkContext);
  if (!ctx) throw new Error('useQuranBookmark must be inside QuranBookmarkProvider');
  return ctx;
}
