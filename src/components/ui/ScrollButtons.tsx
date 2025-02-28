'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollButtonsProps {
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
  direction?: 'left' | 'right';
  className?: string;
}

export function ScrollButtons({ onScrollLeft, onScrollRight, direction, className = '' }: ScrollButtonsProps) {
  if (direction === 'left') {
    return (
      <button
        onClick={onScrollLeft}
        className={`${className} focus:outline-none`}
        aria-label="Scroll left"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="black"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
    );
  }

  if (direction === 'right') {
    return (
      <button
        onClick={onScrollRight}
        className={`${className} focus:outline-none`}
        aria-label="Scroll right"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="black"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    );
  }

  // Fallback to both buttons if no direction specified
  return (
    <div className="flex gap-2">
      <button
        onClick={onScrollLeft}
        className={`${className} focus:outline-none`}
        aria-label="Scroll left"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>
      <button
        onClick={onScrollRight}
        className={`${className} focus:outline-none`}
        aria-label="Scroll right"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
