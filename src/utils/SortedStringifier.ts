export function stringifySorted<T>(
	value: T,
	replacer?: (this: T, key: string, value: T) => T,
	space?: number | string,
): string {
	return JSON.stringify(sortKeys(value), replacer, space);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortKeys(obj: unknown): any {
	if (Array.isArray(obj)) {
		return obj.map(sortKeys);
	}
	if (obj !== null && typeof obj === 'object') {
		return Object.keys(obj)
			.sort()
			.reduce(
				(result: Record<string, unknown>, key) => {
					result[key] = sortKeys((obj as Record<string, unknown>)[key]);
					return result;
				},
				{} as Record<string, unknown>,
			);
	}
	return obj;
}
