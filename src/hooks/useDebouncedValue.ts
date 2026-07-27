import { useEffect, useState } from 'react';

/**
 * A debounced copy of a value this component does not own — a prop, or state that lives in a parent
 * or in the URL. The returned value only changes once the input has stopped changing for `delay` ms,
 * so it can drive expensive work while the source keeps updating on every keystroke. When the
 * component owns the value itself, use `useDebouncedState`.
 * @param value - The current (immediately-updating) value.
 * @param delay - The quiet period in milliseconds before the debounced value catches up.
 * @returns The debounced value.
 */
export const useDebouncedValue = <T>(value: T, delay: number): T => {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		const handle = setTimeout(() => setDebouncedValue(value), delay);
		return (): void => clearTimeout(handle);
	}, [value, delay]);

	return debouncedValue;
};
