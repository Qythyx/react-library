import { act, renderHook } from '@testing-library/react';

import { useLocalStorage } from './useLocalStorage.js';

describe('useLocalStorage', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should initialize with default value when key does not exist', () => {
		const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
		const [value] = result.current;

		expect(value).toBe('default');
	});

	it('should initialize from localStorage if key exists', () => {
		localStorage.setItem('test-key', JSON.stringify('stored'));
		const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
		const [value] = result.current;

		expect(value).toBe('stored');
	});

	it('should persist value to localStorage on update', () => {
		const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

		act(() => {
			result.current[1]('updated');
		});

		const stored = localStorage.getItem('test-key');
		expect(stored).toBe(JSON.stringify('updated'));
		expect(result.current[0]).toBe('updated');
	});

	it('should handle JSON serialization for objects', () => {
		const { result } = renderHook(() => useLocalStorage('test-key', { count: 0 }));

		act(() => {
			result.current[1]({ count: 5 });
		});

		const stored = localStorage.getItem('test-key');
		expect(stored).toBe('{"count":5}');
		expect(result.current[0]).toEqual({ count: 5 });
	});

	it('should handle JSON serialization for arrays', () => {
		const { result } = renderHook(() => useLocalStorage('test-key', [1, 2, 3]));

		act(() => {
			result.current[1]([4, 5, 6]);
		});

		const stored = localStorage.getItem('test-key');
		expect(stored).toBe('[4,5,6]');
		expect(result.current[0]).toEqual([4, 5, 6]);
	});

	it('should handle corrupted JSON gracefully', () => {
		localStorage.setItem('test-key', 'invalid-json{');
		const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
		const [value] = result.current;

		expect(value).toBe('fallback');
		// After initialization, useEffect persists the fallback value
		expect(localStorage.getItem('test-key')).toBe(JSON.stringify('fallback'));
	});

	it('should handle primitive types', () => {
		const { result: stringResult } = renderHook(() => useLocalStorage('string-key', 'text'));
		expect(stringResult.current[0]).toBe('text');

		const { result: numberResult } = renderHook(() => useLocalStorage('number-key', 42));
		expect(numberResult.current[0]).toBe(42);

		const { result: booleanResult } = renderHook(() => useLocalStorage('boolean-key', true));
		expect(booleanResult.current[0]).toBe(true);
	});

	it('should handle functional updates', () => {
		const { result } = renderHook(() => useLocalStorage('test-key', 10));

		act(() => {
			result.current[1](prev => prev + 5);
		});

		expect(result.current[0]).toBe(15);
	});

	it('should work with multiple instances using different keys', () => {
		const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
		const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));

		act(() => {
			result1.current[1]('updated1');
		});

		act(() => {
			result2.current[1]('updated2');
		});

		expect(result1.current[0]).toBe('updated1');
		expect(result2.current[0]).toBe('updated2');
		expect(localStorage.getItem('key1')).toBe(JSON.stringify('updated1'));
		expect(localStorage.getItem('key2')).toBe(JSON.stringify('updated2'));
	});

	it('should update localStorage when key changes', () => {
		const { rerender, result } = renderHook(({ key }) => useLocalStorage(key, 'value'), {
			initialProps: { key: 'key1' },
		});

		act(() => {
			result.current[1]('test-value');
		});

		expect(localStorage.getItem('key1')).toBe(JSON.stringify('test-value'));

		rerender({ key: 'key2' });

		// When key changes, it reads from localStorage for key2 (which doesn't exist)
		// so it uses default 'value', then useEffect persists current value from key1
		expect(localStorage.getItem('key2')).toBe(JSON.stringify('test-value'));
	});

	it('should handle null values', () => {
		const { result } = renderHook(() => useLocalStorage<null | string>('test-key', null));

		act(() => {
			result.current[1](null);
		});

		expect(result.current[0]).toBeNull();
		expect(localStorage.getItem('test-key')).toBe('null');
	});

	it('should remove corrupted data from localStorage', () => {
		localStorage.setItem('test-key', 'corrupted{data');
		const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

		expect(result.current[0]).toBe('default');
		// After initialization with default value, useEffect will persist it
		expect(localStorage.getItem('test-key')).toBe(JSON.stringify('default'));
	});
});
