'use client';

import { useEffect } from 'react';

export default function RootPage() {
  useEffect(() => {
    // Check for saved locale preference or default to 'en'
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale');
      const locale = savedLocale && ['en', 'fr'].includes(savedLocale) ? savedLocale : 'en';
      
      const currentPath = window.location.pathname;
      // Normalize path (remove trailing slash and index.html)
      const normalizedPath = currentPath.replace(/\/index\.html$/, '').replace(/\/$/, '') || '/';
      
      // Check if we're on root path (with or without basePath)
      // Root paths: '/', '/adhd'
      const isRootPath = normalizedPath === '/' || normalizedPath === '/adhd';
      
      if (isRootPath) {
        // Extract basePath from current location
        // For '/adhd', basePath is '/adhd'
        // For '/', basePath is ''
        const basePath = normalizedPath === '/adhd' ? '/adhd' : '';
        
        // Use window.location.replace for immediate redirect (more reliable for static exports)
        // Using replace instead of href prevents adding to browser history
        const newPath = `${basePath}/${locale}`;
        window.location.replace(newPath);
      }
    }
  }, []);

  // Show loading state while redirecting
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <p>Redirecting...</p>
    </div>
  );
}

