import React from 'react';

export default function Avatar({ user, size = 'md', className = '' }) {
  if (!user) return null;

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const dimensions = sizeClasses[size] || sizeClasses.md;

  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={`${user.username}'s avatar`}
        className={`${dimensions} rounded-full object-cover shadow-inner shrink-0 ${className}`}
      />
    );
  }

  // Fallback initial
  const initial = user.username ? user.username[0].toUpperCase() : '?';

  return (
    <div
      className={`${dimensions} rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center font-bold text-white shadow-inner shrink-0 ${className}`}
      title={user.username}
    >
      {initial}
    </div>
  );
}
