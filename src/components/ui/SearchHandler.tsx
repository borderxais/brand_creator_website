'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function SearchParamsHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const platform = searchParams.get('platform');
    const category = searchParams.get('category');
    
    // Handle search params here
    console.log('Search params:', { platform, category });
  }, [searchParams]);

  return null;
}

// Export a pre-wrapped version for convenience
export function SuspenseSearchHandler() {
  return <SearchParamsHandler />;
}
