/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { useState, useEffect } from 'react';
import { Effect, Schedule, Fiber } from 'effect';

export const useTimer = () => {
  const [timer, setTimer] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isTimerRunning) return;

    const fiber = Effect.runFork(
      Effect.repeat(
        Effect.gen(function* () {
          yield* Effect.sleep('1 second');
          setTimer((prev) => prev + 1);
        }),
        Schedule.forever,
      ),
    );

    return () => {
      Effect.runFork(Fiber.interrupt(fiber));
    };
  }, [isTimerRunning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const toggle = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const reset = () => {
    setIsTimerRunning(false);
    setTimer(0);
  };

  return {
    timer,
    isTimerRunning,
    formatTime,
    toggle,
    reset,
    setIsTimerRunning,
  };
};
