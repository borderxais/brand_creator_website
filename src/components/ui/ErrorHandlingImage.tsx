"use client";

import Image from "next/image";
import { useState } from "react";

interface ErrorHandlingImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  fallback?: React.ReactNode;
}

export default function ErrorHandlingImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  className,
  priority = false,
  fallback
}: ErrorHandlingImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (fill) {
      return (
        <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
          <span className="text-gray-400">No Image</span>
        </div>
      );
    }
    
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width: width || 100, height: height || 100 }}
      >
        <span className="text-gray-400">No Image</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={sizes}
      className={className}
      priority={priority}
      onError={() => setHasError(true)}
    />
  );
}
