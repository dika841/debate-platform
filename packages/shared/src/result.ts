export type Result<T, E> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const isOk = <T, E>(
	result: Result<T, E>,
): result is { readonly ok: true; readonly value: T } => result.ok;

export const isErr = <T, E>(
	result: Result<T, E>,
): result is { readonly ok: false; readonly error: E } => !result.ok;

export const mapResult = <T, U, E>(result: Result<T, E>, map: (value: T) => U): Result<U, E> =>
	result.ok ? ok(map(result.value)) : result;

export const unwrapOr = <T, E>(result: Result<T, E>, fallback: T): T =>
	result.ok ? result.value : fallback;
