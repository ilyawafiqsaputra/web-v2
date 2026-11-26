import React, { useState } from 'react';

interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
  fallbackIcon?: string;
  fallbackClassName?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackText,
  fallbackIcon = 'menu_book',
  fallbackClassName = 'bg-primary-fixed text-primary',
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center font-bold select-none ${fallbackClassName} ${className}`}
        aria-label={alt}
      >
        {fallbackText ? (
          <span className="text-xs font-display tracking-tight">{fallbackText}</span>
        ) : (
          <span className="material-symbols-outlined text-lg opacity-80">{fallbackIcon}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      className={className}
      onError={() => setFailed(true)}
    />
  );
};
