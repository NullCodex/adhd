'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Check for saved locale preference or default to 'en'
    const savedLocale = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
    const locale = savedLocale && ['en', 'fr'].includes(savedLocale) ? savedLocale : 'en';
    
    // Redirect immediately
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      // Only redirect if we're on the root path
      if (currentPath === '/' || currentPath === '') {
        router.replace(`/${locale}`);
      }
    }
  }, [router]);

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

