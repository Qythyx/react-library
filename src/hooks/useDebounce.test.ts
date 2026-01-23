import { act, renderHook } from '@testing-library/react';

import { useDebounce } from './useDebounce.js';

describe('useDebounce', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		act(() => {
			jest.runOnlyPendingTimers();
			jest.useRealTimers();
		});
	});

	it('should return initial value immediately', () => {
		const { result } = renderHook(() => useDebounce('initial'));
		const [debouncedValue, , immediateValue] = result.current;

		expect(debouncedValue).toBe('initial');
		expect(immediateValue).toBe('initial');
	});

	it('should debounce value after default 400ms delay', () => {
		const { result } = renderHook(() => useDebounce('initial'));

		act(() => {
			result.current[1]('updated');
		});

		expect(result.current[2]).toBe('updated');
		expect(result.current[0]).toBe('initial');

		act(() => {
			jest.advanceTimersByTime(400);
		});

		expect(result.current[0]).toBe('updated');
	});

	it('should debounce value after custom delay', () => {
		const { result } = renderHook(() => useDebounce('initial', 1000));

		act(() => {
			result.current[1]('updated');
		});

		act(() => {
			jest.advanceTimersByTime(500);
		});

		expect(result.current[0]).toBe('initial');

		act(() => {
			jest.advanceTimersByTime(500);
		});

		expect(result.current[0]).toBe('updated');
	});

	it('should cancel previous timeout on rapid updates', () => {
		const { result } = renderHook(() => useDebounce('initial'));

		act(() => {
			result.current[1]('first');
		});

		act(() => {
			jest.advanceTimersByTime(200);
		});

		act(() => {
			result.current[1]('second');
		});

		act(() => {
			jest.advanceTimersByTime(200);
		});

		expect(result.current[0]).toBe('initial');

		act(() => {
			jest.advanceTimersByTime(200);
		});

		expect(result.current[0]).toBe('second');
	});

	it('should provide immediate update when bypass flag is true', () => {
		const { result } = renderHook(() => useDebounce('initial'));

		act(() => {
			result.current[1]('bypassed', true);
		});

		expect(result.current[0]).toBe('bypassed');
		expect(result.current[2]).toBe('bypassed');
	});

	it('should return tuple with debouncedValue, setValue, and immediateValue', () => {
		const { result } = renderHook(() => useDebounce(0));
		const [debouncedValue, setValue, immediateValue] = result.current;

		expect(typeof debouncedValue).toBe('number');
		expect(typeof setValue).toBe('function');
		expect(typeof immediateValue).toBe('number');
	});

	it('should handle functional updates', () => {
		const { result } = renderHook(() => useDebounce(5));

		act(() => {
			result.current[1](prev => prev + 1);
		});

		expect(result.current[2]).toBe(6);

		act(() => {
			jest.advanceTimersByTime(400);
		});

		expect(result.current[0]).toBe(6);
	});

	it('should work with different data types', () => {
		const { result: stringResult } = renderHook(() => useDebounce('text'));
		expect(stringResult.current[0]).toBe('text');

		const { result: numberResult } = renderHook(() => useDebounce(42));
		expect(numberResult.current[0]).toBe(42);

		const { result: objectResult } = renderHook(() => useDebounce({ key: 'value' }));
		expect(objectResult.current[0]).toEqual({ key: 'value' });
	});

	it('should cleanup timeout on unmount', () => {
		const { result, unmount } = renderHook(() => useDebounce('initial'));

		act(() => {
			result.current[1]('updated');
		});

		unmount();

		act(() => {
			jest.advanceTimersByTime(400);
		});

		// No error should be thrown and no state updates after unmount
	});

	it('should update immediateValue synchronously', () => {
		const { result } = renderHook(() => useDebounce('initial'));

		act(() => {
			result.current[1]('new value');
		});

		const [, , immediateValue] = result.current;
		expect(immediateValue).toBe('new value');
	});
});
