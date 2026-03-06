/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import type React from 'react';
import { X } from 'lucide-react';
import type { Notification } from '../../domain/types';

interface NotificationToastProps {
  notification: Notification | null;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
}) => {
  if (!notification) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
      <div className="px-6 py-3 border-2 border-stone-900 bg-white flex items-center gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div
          className={`w-3 h-3 ${
            notification.type === 'error'
              ? 'bg-red-500'
              : notification.type === 'success'
                ? 'bg-green-500'
                : 'bg-yellow-400'
          }`}
        ></div>
        <p className="text-sm font-bold uppercase tracking-tight">{notification.message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-4 text-stone-400 hover:text-stone-900 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
