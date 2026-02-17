/**
 * Result Type for functional error handling.
 * RATIONALE: Prohibits throwing raw errors for expected failure states,
 * forcing explicit handling of the error branch.
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Creates a successful result.
 * @template T - The type of the value
 * @param {T} value - The result value
 * @returns {Result<T, never>} - A successful result
 */
export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

/**
 * Creates an error result.
 * @template E - The type of the error
 * @param {E} error - The error value
 * @returns {Result<never, E>} - An error result
 */
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });
