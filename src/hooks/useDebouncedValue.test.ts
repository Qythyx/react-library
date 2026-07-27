import { act, renderHook } from '@testing-library/react';

import { useDebouncedValue } from './useDebouncedValue.js';

describe('useDebouncedValue', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		act(() => {
			jest.runOnlyPendingTimers();
			jest.useRealTimers();
		});
	});

	it('returns the initial value immediately', () => {
		const { result } = renderHook(() => useDebouncedValue('a', 300));

		expect(result.current).toBe('a');
	});

	it('updates only after the delay elapses', () => {
		const { rerender, result } = renderHook(({ value }) => useDebouncedValue(value, 300), {
			initialProps: { value: 'a' },
		});

		rerender({ value: 'b' });
		expect(result.current).toBe('a');

		act(() => {
			jest.advanceTimersByTime(299);
		});
		expect(result.current).toBe('a');

		act(() => {
			jest.advanceTimersByTime(1);
		});
		expect(result.current).toBe('b');
	});

	it('collapses rapid changes into the final value', () => {
		const { rerender, result } = renderHook(({ value }) => useDebouncedValue(value, 300), {
			initialProps: { value: 'a' },
		});

		rerender({ value: 'ab' });
		act(() => {
			jest.advanceTimersByTime(100);
		});
		rerender({ value: 'abc' });
		act(() => {
			jest.advanceTimersByTime(100);
		});
		expect(result.current).toBe('a');

		act(() => {
			jest.advanceTimersByTime(300);
		});
		expect(result.current).toBe('abc');
	});

	it('restarts the quiet period when the delay changes', () => {
		const { rerender, result } = renderHook(({ delay, value }) => useDebouncedValue(value, delay), {
			initialProps: { delay: 300, value: 'a' },
		});

		rerender({ delay: 300, value: 'b' });
		act(() => {
			jest.advanceTimersByTime(200);
		});

		rerender({ delay: 1000, value: 'b' });
		act(() => {
			jest.advanceTimersByTime(999);
		});
		expect(result.current).toBe('a');

		act(() => {
			jest.advanceTimersByTime(1);
		});
		expect(result.current).toBe('b');
	});

	it('does not update after unmount', () => {
		const { rerender, result, unmount } = renderHook(({ value }) => useDebouncedValue(value, 300), {
			initialProps: { value: 'a' },
		});

		rerender({ value: 'b' });
		unmount();

		act(() => {
			jest.advanceTimersByTime(300);
		});

		expect(result.current).toBe('a');
	});
});
