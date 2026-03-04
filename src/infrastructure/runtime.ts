/**
 * App-wide Effect Runtime
 *
 * A single ManagedRuntime with the JSON Logger layer baked in.
 * All components must use `appRuntime.runPromise` and `appRuntime.runSync`
 * instead of bare `Effect.runPromise` / `Effect.runSync` so every Effect
 * program inherits structured JSON logging automatically.
 *
 * RATIONALE: Providing the layer once at the boundary avoids threading it
 * through every call site and ensures consistent observability.
 */

import { ManagedRuntime } from 'effect';
import { JsonLoggerLayer } from './logging/json-logger';

export const appRuntime = ManagedRuntime.make(JsonLoggerLayer);
