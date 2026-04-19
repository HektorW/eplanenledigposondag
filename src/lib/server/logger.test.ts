import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLogger } from './logger';

describe('createLogger', () => {
	beforeEach(() => {
		vi.spyOn(console, 'log').mockImplementation(() => {});
		vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.spyOn(console, 'info').mockImplementation(() => {});
		vi.spyOn(console, 'debug').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
	});

	it('includes the logger name and level in output', () => {
		vi.stubEnv('LOG_LEVEL', 'debug');
		const logger = createLogger('my-module');

		logger.info('hello');

		expect(console.info).toHaveBeenCalledOnce();
		const formatString = (console.info as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
		expect(formatString).toMatch(/\[my-module\]/);
		expect(formatString).toMatch(/\[INFO\]/);
	});

	it('passes additional arguments through to console', () => {
		vi.stubEnv('LOG_LEVEL', 'debug');
		const logger = createLogger('test');

		logger.info('message', { key: 'value' }, 42);

		expect(console.info).toHaveBeenCalledOnce();
		const args = (console.info as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(args[1]).toBe('message');
		expect(args[2]).toEqual({ key: 'value' });
		expect(args[3]).toBe(42);
	});

	it('routes each level to the corresponding console method', () => {
		vi.stubEnv('LOG_LEVEL', 'debug');
		const logger = createLogger('test');

		logger.debug('d');
		logger.info('i');
		logger.warn('w');
		logger.error('e');
		logger.log('l');

		expect(console.debug).toHaveBeenCalledOnce();
		expect(console.info).toHaveBeenCalledOnce();
		expect(console.warn).toHaveBeenCalledOnce();
		expect(console.error).toHaveBeenCalledOnce();
		expect(console.log).toHaveBeenCalledOnce();
	});

	describe('log level filtering', () => {
		it('suppresses debug at info level', () => {
			vi.stubEnv('LOG_LEVEL', 'info');
			const logger = createLogger('test');

			logger.debug('d');
			logger.info('i');
			logger.warn('w');
			logger.error('e');

			expect(console.debug).not.toHaveBeenCalled();
			expect(console.info).toHaveBeenCalledOnce();
			expect(console.warn).toHaveBeenCalledOnce();
			expect(console.error).toHaveBeenCalledOnce();
		});

		it('suppresses debug and info at warn level', () => {
			vi.stubEnv('LOG_LEVEL', 'warn');
			const logger = createLogger('test');

			logger.debug('d');
			logger.info('i');
			logger.warn('w');
			logger.error('e');

			expect(console.debug).not.toHaveBeenCalled();
			expect(console.info).not.toHaveBeenCalled();
			expect(console.warn).toHaveBeenCalledOnce();
			expect(console.error).toHaveBeenCalledOnce();
		});

		it('suppresses everything below error at error level', () => {
			vi.stubEnv('LOG_LEVEL', 'error');
			const logger = createLogger('test');

			logger.debug('d');
			logger.info('i');
			logger.warn('w');
			logger.error('e');
			logger.log('l');

			expect(console.debug).not.toHaveBeenCalled();
			expect(console.info).not.toHaveBeenCalled();
			expect(console.warn).not.toHaveBeenCalled();
			expect(console.error).toHaveBeenCalledOnce();
			expect(console.log).toHaveBeenCalledOnce();
		});

		it('defaults to debug when LOG_LEVEL is not set', () => {
			vi.stubEnv('LOG_LEVEL', '');
			const logger = createLogger('test');

			logger.debug('d');
			logger.info('i');

			expect(console.debug).toHaveBeenCalledOnce();
			expect(console.info).toHaveBeenCalledOnce();
		});

		it('defaults to info for unknown LOG_LEVEL values', () => {
			vi.stubEnv('LOG_LEVEL', 'invalid');
			const logger = createLogger('test');

			logger.debug('d');
			logger.info('i');

			expect(console.debug).not.toHaveBeenCalled();
			expect(console.info).toHaveBeenCalledOnce();
		});
	});
});
