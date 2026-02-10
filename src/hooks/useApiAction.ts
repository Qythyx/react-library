import { i18n, TFunction } from 'i18next';
import React, { useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ApiResponse, BadResponse } from '../utils/types.js';
import { getStatusMessage } from '../utils/StatusCodes.js';

export interface ExecuteActionOptions<TData> {
	action: () => Promise<ApiResponse<TData>>;
	errorHandler?: (error: unknown) => void;
	errorMessage: React.ReactElement;
	failedHandler?: (response: BadResponse) => void;
	finallyHandler?: () => void;
	i18n?: i18n;
	okHandler?: (data: TData) => void;
}

export const useApiAction = (
	setError?: (...errors: (null | React.ReactElement)[]) => void,
	setIsLoading?: (isLoading: boolean) => void,
): {
	executeAction: <TData>(options: ExecuteActionOptions<TData>) => Promise<void>;
} => {
	const executeAction = useCallback(
		async <TData>(options: ExecuteActionOptions<TData>): Promise<void> => {
			const filteredSetError = (...errors: (null | React.ReactElement)[]): void => {
				const filtered = errors.filter(Boolean);
				if (filtered.length > 0) {
					setError?.(...filtered);
				}
			};
			const { action, errorHandler, errorMessage, failedHandler, finallyHandler, i18n, okHandler } = options;
			const { t } = i18n ?? { t: ((key: string): string => key) as TFunction };
			setIsLoading?.(true);
			setError?.();

			try {
				const response = await action();
				if (response.ok) {
					okHandler?.(response.data);
				} else {
					const statusMessage = getStatusMessage(t, response.status, response.error);
					console.error(renderToStaticMarkup(errorMessage), statusMessage);
					filteredSetError(
						errorMessage,
						statusMessage ? React.createElement('span', null, statusMessage) : null,
					);
					failedHandler?.(response);
				}
			} catch (err) {
				console.error(renderToStaticMarkup(errorMessage), err);
				filteredSetError(
					errorMessage,
					err instanceof Error ? React.createElement('pre', null, err.message) : null,
				);
				errorHandler?.(err);
			} finally {
				setIsLoading?.(false);
				finallyHandler?.();
			}
		},
		[setIsLoading, setError],
	);

	return { executeAction };
};
