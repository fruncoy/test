import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    // This hook ensures the framework is properly initialized
    let timeoutId: ReturnType<typeof setTimeout>;
    
    try {
      // Check if window exists (important for SSR compatibility)
      if (typeof window !== 'undefined') {
        console.log('Framework ready check started');
        
        // Use a longer timeout to ensure the UI thread is ready
        timeoutId = setTimeout(() => {
          try {
            if (window.frameworkReady) {
              console.log('Calling frameworkReady function');
              window.frameworkReady();
              console.log('frameworkReady function completed');
            } else {
              console.log('frameworkReady function not available');
            }
          } catch (error) {
            console.error('Error calling frameworkReady:', error);
          }
        }, 100); // Slightly longer timeout to ensure framework is ready
      }
    } catch (error) {
      console.error('Error in useFrameworkReady hook:', error);
    }
    
    // Clean up timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);
}