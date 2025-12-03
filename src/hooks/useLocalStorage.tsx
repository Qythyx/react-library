import { useEffect, useState } from 'react';

export function getStorageValue<T>(key: string, defaultValue: T): T {
	const saved = localStorage.getItem(key);
	try {
		return saved ? (JSON.parse(saved) as T) : defaultValue;
	} catch {
		localStorage.removeItem(key);
		return defaultValue;
	}
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
	const [value, setValue] = useState<T>(() => getStorageValue<T>(key, defaultValue));
	useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
	return [value, setValue];
}
