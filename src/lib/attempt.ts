const failSymbol = Symbol('fail');

type Ok<T> = T;
type Fail = { [failSymbol]: true; error: unknown };

type Result<T> = Ok<T> | Fail;

export async function attempt<T>(fn: () => Promise<T>): Promise<Result<T>> {
	try {
		return await fn();
	} catch (error) {
		return { [failSymbol]: true, error };
	}
}

export function isFail<T>(result: Result<T>): result is Fail {
	return typeof result === 'object' && result !== null && failSymbol in result;
}

export function isOk<T>(result: Result<T>): result is Ok<T> {
	return !isFail(result);
}

export function assertIsOk<T>(result: Result<T>): asserts result is Ok<T> {
	if (isFail(result)) {
		throw result.error;
	}
}
