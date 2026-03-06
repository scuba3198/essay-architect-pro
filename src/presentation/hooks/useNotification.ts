/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { useState, useCallback } from 'react';
import type { Notification } from '../../domain/types';

export const useNotification = () => {
  const [notification, setNotification] = useState<Notification | null>(null);

  const show = useCallback((message: string, type: Notification['type']) => {
    setNotification({ message, type });
  }, []);

  const dismiss = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    setNotification,
    show,
    dismiss,
  };
};
