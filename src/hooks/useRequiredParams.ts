import { useParams } from 'react-router-dom';

/**
 * This is intentionally empty to allow users to extend it with their own param types.
 * @example
 * In your project, create a types file like the following:
	declare module '@qythyx/react-library' {
		interface ParamTypeRegistry {
		venueId: VenueID;
		// Add more as needed
		}
	}
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ParamTypeRegistry {
	// Default - all strings
}

type ParamValues<T extends readonly string[]> = {
	[K in T[number]]: K extends keyof ParamTypeRegistry ? ParamTypeRegistry[K] : string;
};

/**
 * Hook to validate and extract required route parameters.
 * Throws an error if any required params are missing (which should never happen on a matched route).
 * @param requiredParams - Array of parameter names that must be present in the route
 * @returns Object with all required params as non-nullable strings
 * @example
 * const { clientId, venueId, screenName } = useRequiredParams(['clientId', 'venueId', 'screenName'] as const);
 * // clientId, venueId, screenName are guaranteed to be non-empty strings
 */
export function useRequiredParams<T extends readonly string[]>(requiredParams: T): ParamValues<T> {
	const allParams = useParams();
	const result: Partial<ParamValues<T>> = {};
	const missingParams: string[] = [];

	for (const paramName of requiredParams) {
		const value = allParams[paramName];
		if (!value) {
			missingParams.push(paramName);
		} else {
			result[paramName as T[number]] = value as ParamValues<T>[T[number]];
		}
	}

	if (missingParams.length > 0) {
		throw new Error(`Missing required route parameters: ${missingParams.join(', ')}`);
	}

	return result as ParamValues<T>;
}
