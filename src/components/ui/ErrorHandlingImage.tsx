"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface ErrorHandlingImageProps extends ImageProps {
  fallback?: React.ReactNode;
}

export default function ErrorHandlingImage({ 
  src, 
  alt, 
  fallback = null, 
  ...props 
}: ErrorHandlingImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    return fallback || (
      <div className="bg-gray-200 flex items-center justify-center" 
        style={{ width: props.width, height: props.height }}>
        <span className="text-gray-400 text-sm">Image error</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      {...props}
      onError={() => setError(true)}
    />
  );
}
