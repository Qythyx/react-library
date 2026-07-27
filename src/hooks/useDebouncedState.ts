import { SetStateAction, useCallback, useEffect, useState } from 'react';

/**
 * State this component owns, plus a debounced copy of it. Use it when the component itself changes
 * the value; for a value handed in from outside, use `useDebouncedValue`.
 * @param initialValue - The value to start from.
 * @param delay - The quiet period in milliseconds before the debounced value catches up.
 * @returns Tuple of [debouncedValue, setValue, immediateValue]. Passing `true` as setValue's second
 * argument moves the debounced value at once, skipping the quiet period.
 */
export const useDebouncedState = <T>(
	initialValue: T,
	delay = 400,
): [T, (value: SetStateAction<T>, bypassDebounce?: boolean) => void, T] => {
	const [immediateValue, setImmediateValue] = useState<T>(initialValue);
	const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
	const [bypassDebounce, setBypassDebounce] = useState<boolean>(false);

	useEffect(() => {
		if (bypassDebounce) {
			setDebouncedValue(immediateValue);
			setBypassDebounce(false);
		} else {
			const handler = setTimeout((): void => setDebouncedValue(immediateValue), delay);
			return (): void => {
				clearTimeout(handler);
			};
		}
	}, [immediateValue, delay]);

	const setValue = useCallback((value: SetStateAction<T>, bypassDebounce = false): void => {
		setBypassDebounce(bypassDebounce);
		setImmediateValue(value);
	}, []);

	return [debouncedValue, setValue, immediateValue];
};
