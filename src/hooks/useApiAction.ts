import { useCallback } from 'react';

import { ApiResponse, BadResponse } from '../utils/types.js';
import { getStatusMessage } from '../utils/StatusCodes.js';

export interface ExecuteActionOptions<TData> {
	action: () => Promise<ApiResponse<TData>>;
	errorHandler?: (error: unknown) => void;
	errorMessage: string;
	failedHandler?: (response: BadResponse) => void;
	finallyHandler?: () => void;
	okHandler?: (data: TData) => void;
}

export const useApiAction = (
	setError: (error: null | string) => void,
	setIsLoading: (isLoading: boolean) => void,
): {
	executeAction: <TData>(options: ExecuteActionOptions<TData>) => Promise<void>;
} => {
	const executeAction = useCallback(
		async <TData>(options: ExecuteActionOptions<TData>): Promise<void> => {
			const { action, errorHandler, errorMessage, failedHandler, finallyHandler, okHandler } = options;
			setIsLoading(true);
			setError(null);

			try {
				const response = await action();
				if (response.ok) {
					okHandler?.(response.data);
				} else if (failedHandler) {
					failedHandler(response);
				} else {
					setError(getStatusMessage(response.status, response.error ?? errorMessage));
				}
			} catch (err) {
				if (errorHandler) {
					errorHandler(err);
				} else {
					setError(errorMessage);
					console.error(errorMessage, err);
				}
			} finally {
				setIsLoading(false);
				finallyHandler?.();
			}
		},
		[setIsLoading, setError],
	);

	return { executeAction };
};
