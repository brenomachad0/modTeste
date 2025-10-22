'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  isLoading: boolean;
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  isLoading,
  message = 'Salvando...',
  fullScreen = true,
}: LoadingSpinnerProps) {
  if (!isLoading) return null;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
        <div className="bg-gray-800 border-2 border-gray-700 rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-scaleIn">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <p className="text-white font-medium text-lg">{message}</p>
        </div>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes scaleIn {
            from {
              transform: scale(0.9);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }

          .animate-scaleIn {
            animation: scaleIn 0.2s ease-out;
          }

          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  // Inline spinner (não fullscreen)
  return (
    <div className="flex items-center gap-2">
      <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
      <span className="text-gray-300 text-sm">{message}</span>
    </div>
  );
}
