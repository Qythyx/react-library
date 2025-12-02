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

	it('should call onSuccess when API response is ok', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'success data',
			ok: true,
			status: 200,
		});
		const onSuccess = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, onSuccess, 'Error message');
		});

		expect(onSuccess).toHaveBeenCalledWith('success data');
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
		const onSuccess = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, onSuccess, 'Default error');
		});

		expect(onSuccess).not.toHaveBeenCalled();
		expect(setError).toHaveBeenCalledWith('Bad request error');
	});

	it('should use getStatusMessage for NOT_FOUND status', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			ok: false,
			status: HttpStatus.NOT_FOUND,
		});
		const onSuccess = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, onSuccess, 'Default error');
		});

		expect(setError).toHaveBeenCalledWith('The requested resource was not found');
	});

	it('should use getStatusMessage for UNAUTHORIZED status', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			ok: false,
			status: HttpStatus.UNAUTHORIZED,
		});
		const onSuccess = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, onSuccess, 'Default error');
		});

		expect(setError).toHaveBeenCalledWith('You do not have authorization');
	});

	it('should handle exceptions and log to console.error', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const error = new Error('Network error');
		const mockAction = jest.fn().mockRejectedValue(error);
		const onSuccess = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, onSuccess, 'Action failed');
		});

		expect(onSuccess).not.toHaveBeenCalled();
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
		const onSuccess = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, onSuccess, 'Error');
		});

		expect(setIsLoading).toHaveBeenNthCalledWith(1, true);
		expect(setIsLoading).toHaveBeenNthCalledWith(2, false);
	});

	it('should set loading to false even when action throws', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn().mockRejectedValue(new Error('Failed'));
		const onSuccess = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, onSuccess, 'Error');
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
		const onSuccess = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, onSuccess, 'Default error message');
		});

		expect(setError).toHaveBeenCalledWith('Custom server error');
	});

	it('should use default error message when response has no error field', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			ok: false,
			status: HttpStatus.INTERNAL_SERVER_ERROR,
		});
		const onSuccess = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, onSuccess, 'Default error message');
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
		const onSuccess = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction1, onSuccess, 'Error');
		});

		expect(onSuccess).toHaveBeenCalledWith('first');

		await act(async () => {
			await result.current.executeAction(mockAction2, onSuccess, 'Error');
		});

		expect(onSuccess).toHaveBeenCalledWith('second');
		expect(onSuccess).toHaveBeenCalledTimes(2);
	});

	it('should clear previous error before new action', async () => {
		const { result } = renderHook(() => useApiAction(setError, setIsLoading));
		const mockAction = jest.fn<Promise<ApiResponse<string>>, []>().mockResolvedValue({
			data: 'data',
			ok: true,
			status: 200,
		});
		const onSuccess = jest.fn();

		await act(async () => {
			await result.current.executeAction(mockAction, onSuccess, 'Error');
		});

		expect(setError).toHaveBeenCalledWith(null);
	});
});
