import { SetStateAction, useCallback, useEffect, useState } from 'react';

export function useDebounce<T>(
	initialValue: T,
	delay = 400,
): [T, (value: SetStateAction<T>, bypassDebounce?: boolean) => void, T] {
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
}
