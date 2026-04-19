import { Temporal } from '@js-temporal/polyfill';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'log';

const logLevels: Record<LogLevel, number> = {
	debug: 1,
	info: 2,
	warn: 3,
	error: 4,
	log: 5
};

export function createLogger(name: string) {
	const currentLogLevel = process.env.LOG_LEVEL || 'debug';
	const currentLogLevelValue = logLevels[currentLogLevel as LogLevel] || logLevels.info;

	function shouldLog(level: LogLevel): boolean {
		return logLevels[level] >= currentLogLevelValue;
	}

	function formatMessage(level: LogLevel): string {
		return `[${Temporal.Now.instant().toString()}] [${name}] [${level.toUpperCase()}]:`;
	}

	return {
		log: (...args: unknown[]) => {
			if (shouldLog('log')) console.log(formatMessage('log'), ...args);
		},
		error: (...args: unknown[]) => {
			if (shouldLog('error')) console.error(`${formatMessage('error')}`, ...args);
		},
		warn: (...args: unknown[]) => {
			if (shouldLog('warn')) console.warn(`${formatMessage('warn')}`, ...args);
		},
		info: (...args: unknown[]) => {
			if (shouldLog('info')) console.info(`${formatMessage('info')}`, ...args);
		},
		debug: (...args: unknown[]) => {
			if (shouldLog('debug')) console.debug(`${formatMessage('debug')}`, ...args);
		}
	};
}
