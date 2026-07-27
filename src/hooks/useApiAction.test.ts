import { act, renderHook } from '@testing-library/react';
import React from 'react';

import { ApiResponse } from '../utils/types.js';
import { createMockI18n } from '../test-utils/i18nMock.ts';
import { HttpStatus } from '../utils/StatusCodes.js';
import { useApiAction } from './useApiAction.js';

function createDeferred<T>() {
	let reject!: (reason: unknown) => void;
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((res, rej) => {
		reject = rej;
		resolve = res;
	});
	return { promise, reject, resolve };
}

function getElement(text: string, type: string = 'span') {
	return React.createElement(type, null, text);
}

const ok = (data: string): ApiResponse<string> => ({ data, ok: true, status: 200 });

const i18n = createMockI18n();

describe('useApiAction', () => {
	let setError: jest.Mock;
	let setIsLoading: jest.Mock;
	let consoleSpy: jest.SpyInstance;

	beforeEach(() => {
		setError = jest.fn();
		setIsLoading = jest.fn();
		consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it('should return executeAction function', () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		expect(result.current.executeAction).toBeDefined();
		expect(typeof result.current.executeAction).toBe('function');
	});

	it('should call okHandler when API response is ok', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'success data',
			ok: true,
			status: 200,
		});
		const okHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Error message'), okHandler);
		});

		expect(okHandler).toHaveBeenCalledWith('success data');
		expect(setError).toHaveBeenCalledWith();
		expect(setIsLoading).toHaveBeenCalledWith(true);
		expect(setIsLoading).toHaveBeenCalledWith(false);
	});

	it('should call setError when API response is not ok', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			error: 'Bad request error',
			ok: false,
			status: HttpStatus.BAD_REQUEST,
		});
		const okHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Default error'), okHandler);
		});

		expect(okHandler).not.toHaveBeenCalled();
		expect(setError).toHaveBeenCalledWith(...[getElement('Default error'), getElement('Bad request error')]);
	});

	it('should use getStatusMessage for NOT_FOUND status', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			ok: false,
			status: HttpStatus.NOT_FOUND,
		});

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Default error'));
		});

		expect(setError).toHaveBeenCalledWith(...[getElement('Default error'), getElement(i18n.t('errors.notFound'))]);
	});

	it('should use getStatusMessage for UNAUTHORIZED status', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			ok: false,
			status: HttpStatus.UNAUTHORIZED,
		});

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Default error'));
		});

		expect(setError).toHaveBeenCalledWith(
			...[getElement('Default error'), getElement('You do not have authorization')],
		);
	});

	it('should handle exceptions and log to console.error', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const error = new Error('Network error');
		const mockAction = jest.fn().mockRejectedValue(error);
		const okHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Action failed'), okHandler);
		});

		expect(okHandler).not.toHaveBeenCalled();
		expect(setError).toHaveBeenCalledWith(...[getElement('Action failed'), getElement('Network error', 'pre')]);
		expect(consoleSpy).toHaveBeenCalledWith('<span>Action failed</span>', error);
	});

	it('should set loading state correctly during execution', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'data',
			ok: true,
			status: 200,
		});

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Error'));
		});

		expect(setIsLoading).toHaveBeenNthCalledWith(1, true);
		expect(setIsLoading).toHaveBeenNthCalledWith(2, false);
	});

	it('should set loading to false even when action throws', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn().mockRejectedValue(new Error('Failed'));

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Error'));
		});

		expect(setIsLoading).toHaveBeenLastCalledWith(false);
	});

	it('should use error message from response when available', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			error: 'Custom server error',
			ok: false,
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Default error message'));
		});

		expect(setError).toHaveBeenCalledWith(
			...[getElement('Default error message'), getElement('Custom server error')],
		);
	});

	it('should use default error message when response has no error field', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			ok: false,
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Default error message'));
		});

		expect(setError).toHaveBeenCalledWith(...[getElement('Default error message')]);
	});

	it('should handle multiple sequential calls', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction1 = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'first',
			ok: true,
			status: 200,
		});
		const mockAction2 = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'second',
			ok: true,
			status: 200,
		});
		const okHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction1, getElement('Error'), okHandler);
		});

		expect(okHandler).toHaveBeenCalledWith('first');

		await act(async () => {
			await result.current.executeAction(mockAction2, getElement('Error'), okHandler);
		});

		expect(okHandler).toHaveBeenCalledWith('second');
		expect(okHandler).toHaveBeenCalledTimes(2);
	});

	it('should clear previous error before new action', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'data',
			ok: true,
			status: 200,
		});

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Error'));
		});

		expect(setError).toHaveBeenCalledWith(...[]);
	});

	it('should call failedHandler and setError when provided', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const badResponse = {
			error: 'Bad request error',
			ok: false as const,
			status: HttpStatus.BAD_REQUEST,
		};
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue(badResponse);
		const failedHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Default error'), undefined, failedHandler);
		});

		expect(failedHandler).toHaveBeenCalledWith(badResponse);
		expect(setError).toHaveBeenCalledWith(...[getElement('Default error'), getElement('Bad request error')]);
		expect(setError).toHaveBeenCalledTimes(2);
	});

	it('should call errorHandler and default error handling when provided', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const error = new Error('Network error');
		const mockAction = jest.fn().mockRejectedValue(error);
		const errorHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction(
				mockAction,
				getElement('Action failed'),
				undefined,
				undefined,
				errorHandler,
			);
		});

		expect(errorHandler).toHaveBeenCalledWith(error);
		expect(setError).toHaveBeenCalledWith(...[getElement('Action failed'), getElement('Network error', 'pre')]);
		expect(setError).toHaveBeenCalledTimes(2);
		expect(consoleSpy).toHaveBeenCalled();
	});

	it('should call finallyHandler after setIsLoading(false)', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'data',
			ok: true,
			status: 200,
		});
		const callOrder: string[] = [];
		setIsLoading.mockImplementation((loading: boolean) => {
			if (!loading) {
				callOrder.push('setIsLoading(false)');
			}
		});
		const finallyHandler = jest.fn(() => {
			callOrder.push('finallyHandler');
		});

		await act(async () => {
			await result.current.executeAction(
				mockAction,
				getElement('Error'),
				undefined,
				undefined,
				undefined,
				finallyHandler,
			);
		});

		expect(finallyHandler).toHaveBeenCalled();
		expect(callOrder).toEqual(['setIsLoading(false)', 'finallyHandler']);
	});

	it('should call finallyHandler even when action throws', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn().mockRejectedValue(new Error('Failed'));
		const finallyHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction(
				mockAction,
				getElement('Error'),
				undefined,
				undefined,
				undefined,
				finallyHandler,
			);
		});

		expect(finallyHandler).toHaveBeenCalled();
		expect(setIsLoading).toHaveBeenLastCalledWith(false);
	});

	it('should work without okHandler', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'data',
			ok: true,
			status: 200,
		});

		await act(async () => {
			await result.current.executeAction(mockAction, getElement('Error'));
		});

		expect(setIsLoading).toHaveBeenCalledWith(false);
		expect(setError).toHaveBeenCalledWith();
	});

	it('should accept an options object', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const okHandler = jest.fn();
		const finallyHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction({
				action: () => Promise.resolve(ok('data')),
				errorMessage: getElement('Error'),
				finallyHandler,
				okHandler,
			});
		});

		expect(okHandler).toHaveBeenCalledWith('data');
		expect(finallyHandler).toHaveBeenCalled();
		expect(setIsLoading).toHaveBeenLastCalledWith(false);
	});

	it('should apply only the newest result when calls share a supersedeKey', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const first = createDeferred<ApiResponse<string>>();
		const second = createDeferred<ApiResponse<string>>();
		const okHandler = jest.fn();

		await act(async () => {
			const calls = [
				result.current.executeAction({
					action: () => first.promise,
					errorMessage: getElement('Error'),
					okHandler,
					supersedeKey: 'list',
				}),
				result.current.executeAction({
					action: () => second.promise,
					errorMessage: getElement('Error'),
					okHandler,
					supersedeKey: 'list',
				}),
			];
			second.resolve(ok('second'));
			first.resolve(ok('first'));
			await Promise.all(calls);
		});

		expect(okHandler).toHaveBeenCalledTimes(1);
		expect(okHandler).toHaveBeenCalledWith('second');
	});

	it('should abort the signal given to a superseded action', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const deferreds = [createDeferred<ApiResponse<string>>(), createDeferred<ApiResponse<string>>()];
		const signals: AbortSignal[] = [];

		await act(async () => {
			const calls = deferreds.map(deferred =>
				result.current.executeAction({
					action: (signal: AbortSignal) => {
						signals.push(signal);
						return deferred.promise;
					},
					errorMessage: getElement('Error'),
					supersedeKey: 'list',
				}),
			);
			deferreds.forEach(deferred => deferred.resolve(ok('data')));
			await Promise.all(calls);
		});

		expect(signals.map(signal => signal.aborted)).toEqual([true, false]);
	});

	it('should not report an error from a superseded call', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const first = createDeferred<ApiResponse<string>>();
		const second = createDeferred<ApiResponse<string>>();
		const failedHandler = jest.fn();

		await act(async () => {
			const calls = [
				result.current.executeAction({
					action: () => first.promise,
					errorMessage: getElement('Load failed'),
					failedHandler,
					supersedeKey: 'list',
				}),
				result.current.executeAction({
					action: () => second.promise,
					errorMessage: getElement('Load failed'),
					failedHandler,
					supersedeKey: 'list',
				}),
			];
			second.resolve(ok('second'));
			first.resolve({ error: 'Gateway timeout', ok: false, status: HttpStatus.INTERNAL_SERVER_ERROR });
			await Promise.all(calls);
		});

		expect(failedHandler).not.toHaveBeenCalled();
		expect(setError).not.toHaveBeenCalledWith(getElement('Load failed'), getElement('Gateway timeout'));
		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it('should swallow the rejection from an aborted action', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const first = createDeferred<ApiResponse<string>>();
		const second = createDeferred<ApiResponse<string>>();
		const errorHandler = jest.fn();

		await act(async () => {
			const calls = [
				result.current.executeAction({
					action: () => first.promise,
					errorHandler,
					errorMessage: getElement('Load failed'),
					supersedeKey: 'list',
				}),
				result.current.executeAction({
					action: () => second.promise,
					errorHandler,
					errorMessage: getElement('Load failed'),
					supersedeKey: 'list',
				}),
			];
			second.resolve(ok('second'));
			first.reject(new DOMException('The operation was aborted.', 'AbortError'));
			await Promise.all(calls);
		});

		expect(errorHandler).not.toHaveBeenCalled();
		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it('should not call finallyHandler for a superseded call but should still clear its loading', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const first = createDeferred<ApiResponse<string>>();
		const second = createDeferred<ApiResponse<string>>();
		const finallyHandler = jest.fn();

		await act(async () => {
			const calls = [
				result.current.executeAction({
					action: () => first.promise,
					errorMessage: getElement('Error'),
					finallyHandler,
					supersedeKey: 'list',
				}),
				result.current.executeAction({
					action: () => second.promise,
					errorMessage: getElement('Error'),
					finallyHandler,
					supersedeKey: 'list',
				}),
			];
			second.resolve(ok('second'));
			first.resolve(ok('first'));
			await Promise.all(calls);
		});

		expect(finallyHandler).toHaveBeenCalledTimes(1);
		expect(setIsLoading.mock.calls).toEqual([[true], [true], [false], [false]]);
	});

	it('should not supersede calls under a different key', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const users = createDeferred<ApiResponse<string>>();
		const beverages = createDeferred<ApiResponse<string>>();
		const okHandler = jest.fn();

		await act(async () => {
			const calls = [
				result.current.executeAction({
					action: () => users.promise,
					errorMessage: getElement('Error'),
					okHandler,
					supersedeKey: 'users',
				}),
				result.current.executeAction({
					action: () => beverages.promise,
					errorMessage: getElement('Error'),
					okHandler,
					supersedeKey: 'beverages',
				}),
			];
			beverages.resolve(ok('beverages'));
			users.resolve(ok('users'));
			await Promise.all(calls);
		});

		expect(okHandler).toHaveBeenCalledWith('users');
		expect(okHandler).toHaveBeenCalledWith('beverages');
	});

	it('should not supersede a call made without a key', async () => {
		const { result } = renderHook(() => useApiAction(i18n, setError, setIsLoading));
		const first = createDeferred<ApiResponse<string>>();
		const second = createDeferred<ApiResponse<string>>();
		const okHandler = jest.fn();

		await act(async () => {
			const calls = [
				result.current.executeAction(() => first.promise, getElement('Error'), okHandler),
				result.current.executeAction(() => second.promise, getElement('Error'), okHandler),
			];
			second.resolve(ok('second'));
			first.resolve(ok('first'));
			await Promise.all(calls);
		});

		expect(okHandler).toHaveBeenCalledTimes(2);
	});
});
