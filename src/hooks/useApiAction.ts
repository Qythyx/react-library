import { i18n } from 'i18next';
import React, { useCallback } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ApiResponse, BadResponse } from '../utils/types.js';
import { getStatusMessage } from '../utils/StatusCodes.js';
import { loadTranslations } from '../utils/loadTranslations.js';

export interface ExecuteActionOptions<TData> {
	action: () => Promise<ApiResponse<TData>>;
	errorHandler?: (error: unknown) => void;
	errorMessage: React.ReactElement;
	failedHandler?: (response: BadResponse) => void;
	finallyHandler?: () => void;
	okHandler?: (data: TData) => void;
}

export const useApiAction = (
	i18n: i18n,
	setError?: (...errors: (null | React.ReactElement)[]) => void,
	setIsLoading?: (isLoading: boolean) => void,
): {
	executeAction: <TData>(
		action: () => Promise<ApiResponse<TData>>,
		errorMessage: React.ReactElement,
		okHandler?: (data: TData) => void,
		failedHandler?: (response: BadResponse) => void,
		errorHandler?: (error: unknown) => void,
		finallyHandler?: () => void,
	) => Promise<void>;
} => {
	loadTranslations(i18n);

	const executeAction = useCallback(
		async <TData>(
			action: () => Promise<ApiResponse<TData>>,
			errorMessage: React.ReactElement,
			okHandler?: (data: TData) => void,
			failedHandler?: (response: BadResponse) => void,
			errorHandler?: (error: unknown) => void,
			finallyHandler?: () => void,
		): Promise<void> => {
			const filteredSetError = (...errors: (null | React.ReactElement)[]): void => {
				const filtered = errors.filter(Boolean);
				if (filtered.length > 0) {
					setError?.(...filtered);
				}
			};
			const { t } = i18n;
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
