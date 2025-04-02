const logLevel = process.env.LOG_LEVEL || 'debug';

const levels = ['debug', 'info', 'warn', 'error'];
const logLevelIndex = levels.indexOf(logLevel.toLowerCase());

export function createLogger(name: string) {
	const log = (...args: unknown[]) => {
		if (logLevelIndex <= 0) {
			console.log(`[${name}]`, ...args);
		}
	};

	const error = (...args: unknown[]) => {
		if (logLevelIndex <= 3) {
			console.error(`[${name}]`, ...args);
		}
	};

	const warn = (...args: unknown[]) => {
		if (logLevelIndex <= 2) {
			console.warn(`[${name}]`, ...args);
		}
	};

	const info = (...args: unknown[]) => {
		if (logLevelIndex <= 1) {
			console.info(`[${name}]`, ...args);
		}
	};

	const debug = (...args: unknown[]) => {
		if (logLevelIndex <= 0) {
			console.debug(`[${name}]`, ...args);
		}
	};

	return { log, error, warn, info, debug };
}
