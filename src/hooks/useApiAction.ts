import { useCallback } from 'react';

import { ApiResponse } from '../utils/types.js';
import { getStatusMessage } from '../utils/StatusCodes.js';

export const useApiAction = (
	setError: (error: null | string) => void,
	setIsLoading: (isLoading: boolean) => void,
): {
	executeAction: <TData>(
		action: () => Promise<ApiResponse<TData>>,
		onSuccess: (data: TData) => void,
		errorMessage: string,
	) => Promise<void>;
} => {
	const executeAction = useCallback(
		async <TData>(
			action: () => Promise<ApiResponse<TData>>,
			onSuccess: (data: TData) => void,
			errorMessage: string,
		): Promise<void> => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await action();
				if (response.ok) {
					onSuccess(response.data);
				} else {
					setError(getStatusMessage(response.status, response.error ?? errorMessage));
				}
			} catch (err) {
				setError(errorMessage);
				console.error(errorMessage, err);
			} finally {
				setIsLoading(false);
			}
		},
		[setIsLoading, setError],
	);

	return { executeAction };
};
