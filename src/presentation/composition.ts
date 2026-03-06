/**
 * PROPRIETARY LICENSE - Essay Architect (Pro Edition)
 * Copyright (c) 2025 Mumukshu D.C.
 * All Rights Reserved.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { DeviceService } from '../infrastructure/device/device-id';
import { RegisterSessionUseCase } from '../application/session/RegisterSessionUseCase';
import { ValidateSessionUseCase } from '../application/session/ValidateSessionUseCase';
import { DeactivateSessionUseCase } from '../application/session/DeactivateSessionUseCase';
import { AIClient } from '../infrastructure/api/api';
import { supabase } from '../infrastructure/db/supabase';

// Service Instantiation (DI Container logic)
export const deviceService = new DeviceService();
export const aiClient = new AIClient(supabase);
export const registerSessionUseCase = new RegisterSessionUseCase(supabase, deviceService);
export const validateSessionUseCase = new ValidateSessionUseCase(supabase, deviceService);
export const deactivateSessionUseCase = new DeactivateSessionUseCase(supabase);
