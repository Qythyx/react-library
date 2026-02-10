import { act, renderHook } from '@testing-library/react';

import { ApiResponse } from '../utils/types.js';
import { HttpStatus } from '../utils/StatusCodes.js';
import { useApiAction } from './useApiAction.js';

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
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		expect(result.current.executeAction).toBeDefined();
		expect(typeof result.current.executeAction).toBe('function');
	});

	it('should call okHandler when API response is ok', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'success data',
			ok: true,
			status: 200,
		});
		const okHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Error message',
				okHandler,
			});
		});

		expect(okHandler).toHaveBeenCalledWith('success data');
		expect(setError).toHaveBeenCalledWith(null);
		expect(setIsLoading).toHaveBeenCalledWith(true);
		expect(setIsLoading).toHaveBeenCalledWith(false);
	});

	it('should call setError when API response is not ok', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			error: 'Bad request error',
			ok: false,
			status: HttpStatus.BAD_REQUEST,
		});
		const okHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Default error',
				okHandler,
			});
		});

		expect(okHandler).not.toHaveBeenCalled();
		expect(setError).toHaveBeenCalledWith('Bad request error');
	});

	it('should use getStatusMessage for NOT_FOUND status', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			ok: false,
			status: HttpStatus.NOT_FOUND,
		});

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Default error',
			});
		});

		expect(setError).toHaveBeenCalledWith('The requested resource was not found');
	});

	it('should use getStatusMessage for UNAUTHORIZED status', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			ok: false,
			status: HttpStatus.UNAUTHORIZED,
		});

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Default error',
			});
		});

		expect(setError).toHaveBeenCalledWith('You do not have authorization');
	});

	it('should handle exceptions and log to console.error', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const error = new Error('Network error');
		const mockAction = jest.fn().mockRejectedValue(error);
		const okHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Action failed',
				okHandler,
			});
		});

		expect(okHandler).not.toHaveBeenCalled();
		expect(setError).toHaveBeenCalledWith('Action failed');
		expect(consoleSpy).toHaveBeenCalledWith('Action failed', error);
	});

	it('should set loading state correctly during execution', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'data',
			ok: true,
			status: 200,
		});

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Error',
			});
		});

		expect(setIsLoading).toHaveBeenNthCalledWith(1, true);
		expect(setIsLoading).toHaveBeenNthCalledWith(2, false);
	});

	it('should set loading to false even when action throws', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn().mockRejectedValue(new Error('Failed'));

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Error',
			});
		});

		expect(setIsLoading).toHaveBeenLastCalledWith(false);
	});

	it('should use error message from response when available', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			error: 'Custom server error',
			ok: false,
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Default error message',
			});
		});

		expect(setError).toHaveBeenCalledWith('Custom server error');
	});

	it('should use default error message when response has no error field', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			ok: false,
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Default error message',
			});
		});

		expect(setError).toHaveBeenCalledWith('Default error message');
	});

	it('should handle multiple sequential calls', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
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
			await result.current.executeAction({
				action: mockAction1,
				errorMessage: 'Error',
				okHandler,
			});
		});

		expect(okHandler).toHaveBeenCalledWith('first');

		await act(async () => {
			await result.current.executeAction({
				action: mockAction2,
				errorMessage: 'Error',
				okHandler,
			});
		});

		expect(okHandler).toHaveBeenCalledWith('second');
		expect(okHandler).toHaveBeenCalledTimes(2);
	});

	it('should clear previous error before new action', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'data',
			ok: true,
			status: 200,
		});

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Error',
			});
		});

		expect(setError).toHaveBeenCalledWith(null);
	});

	it('should call failedHandler instead of setError when provided', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const badResponse = {
			error: 'Bad request error',
			ok: false as const,
			status: HttpStatus.BAD_REQUEST,
		};
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue(badResponse);
		const failedHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Default error',
				failedHandler,
			});
		});

		expect(failedHandler).toHaveBeenCalledWith(badResponse);
		expect(setError).toHaveBeenCalledWith(null); // only the initial clear
		expect(setError).toHaveBeenCalledTimes(1);
	});

	it('should call errorHandler instead of default error handling when provided', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const error = new Error('Network error');
		const mockAction = jest.fn().mockRejectedValue(error);
		const errorHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorHandler,
				errorMessage: 'Action failed',
			});
		});

		expect(errorHandler).toHaveBeenCalledWith(error);
		expect(setError).toHaveBeenCalledWith(null); // only the initial clear
		expect(setError).toHaveBeenCalledTimes(1);
		expect(consoleSpy).not.toHaveBeenCalled();
	});

	it('should call finallyHandler after setIsLoading(false)', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
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
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Error',
				finallyHandler,
			});
		});

		expect(finallyHandler).toHaveBeenCalled();
		expect(callOrder).toEqual(['setIsLoading(false)', 'finallyHandler']);
	});

	it('should call finallyHandler even when action throws', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn().mockRejectedValue(new Error('Failed'));
		const finallyHandler = jest.fn();

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Error',
				finallyHandler,
			});
		});

		expect(finallyHandler).toHaveBeenCalled();
		expect(setIsLoading).toHaveBeenLastCalledWith(false);
	});

	it('should work without okHandler', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'data',
			ok: true,
			status: 200,
		});

		await act(async () => {
			await result.current.executeAction({
				action: mockAction,
				errorMessage: 'Error',
			});
		});

		expect(setIsLoading).toHaveBeenCalledWith(false);
		expect(setError).toHaveBeenCalledWith(null);
	});
});
