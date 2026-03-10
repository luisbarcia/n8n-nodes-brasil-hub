/**
 * Advances Jest fake timers to resolve pending setTimeout-based delays.
 *
 * Must be used with `jest.useFakeTimers()`. Ticks the clock in 1.1s
 * increments (enough to trigger the 1s fallback delay) up to 5 times.
 */
export async function runWithTimers<T>(promise: Promise<T>): Promise<T> {
	const result = promise;
	for (let i = 0; i < 5; i++) {
		jest.advanceTimersByTime(1100);
		await Promise.resolve();
	}
	return result;
}
