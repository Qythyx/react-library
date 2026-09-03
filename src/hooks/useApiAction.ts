import { i18n } from 'i18next';
import React, { useCallback, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { ApiResponse, FailedResponse } from '../utils/types.js';
import { getStatusMessage } from '../utils/StatusCodes.js';
import { loadTranslations } from '../utils/loadTranslations.js';

/**
 * A call to a service that resolves with `TData` on success. `TReason` is the set of refusal reasons
 * this call can report.
 */
export type ApiAction<TData, TReason = never> = (signal: AbortSignal) => Promise<ApiResponse<TData, TReason>>;

export interface ExecuteAction {
	<TData, TReason = never>(options: ExecuteActionOptions<TData, TReason>): Promise<void>;
	<TData, TReason = never>(
		action: ApiAction<TData, TReason>,
		errorMessage: React.ReactElement,
		okHandler?: (data: TData) => void,
		failedHandler?: FailedHandler<TReason>,
		errorHandler?: (error: unknown) => void,
		finallyHandler?: () => void,
	): Promise<void>;
}

export interface ExecuteActionOptions<TData, TReason = never> {
	action: ApiAction<TData, TReason>;
	errorHandler?: (error: unknown) => void;
	errorMessage: React.ReactElement;
	failedHandler?: FailedHandler<TReason>;
	finallyHandler?: () => void;
	okHandler?: (data: TData) => void;
	/**
	 * Groups calls that ask the same question, so that only the newest answer counts. Starting a call
	 * aborts the previous one under the same key, and an aborted call reports nothing at all — no
	 * handlers, no error. Keys are scoped to this hook instance.
	 */
	supersedeKey?: string;
}

/**
 * Called when an action resolves with a failure. A thrown error does not arrive here; it goes to the
 * `errorHandler`.
 */
export type FailedHandler<TReason = never> = (response: FailedResponse<TReason>) => void;

type PositionalArgs<TData, TReason = never> = [
	errorMessage: React.ReactElement,
	okHandler?: (data: TData) => void,
	failedHandler?: FailedHandler<TReason>,
	errorHandler?: (error: unknown) => void,
	finallyHandler?: () => void,
];

const toOptions = <TData, TReason>(
	optionsOrAction: ApiAction<TData, TReason> | ExecuteActionOptions<TData, TReason>,
	positional: PositionalArgs<TData, TReason>,
): ExecuteActionOptions<TData, TReason> => {
	if (typeof optionsOrAction !== 'function') {
		return optionsOrAction;
	}
	const [errorMessage, okHandler, failedHandler, errorHandler, finallyHandler] = positional;
	return { action: optionsOrAction, errorHandler, errorMessage, failedHandler, finallyHandler, okHandler };
};

export const useApiAction = (
	i18n: i18n,
	setError?: (...errors: (null | React.ReactElement)[]) => void,
	setIsLoading?: (isLoading: boolean) => void,
): {
	executeAction: ExecuteAction;
} => {
	loadTranslations(i18n);

	const inFlight = useRef(new Map<string, AbortController>());

	const executeAction = useCallback(
		async <TData, TReason>(
			optionsOrAction: ApiAction<TData, TReason> | ExecuteActionOptions<TData, TReason>,
			...positional: PositionalArgs<TData, TReason>
		): Promise<void> => {
			const { action, errorHandler, errorMessage, failedHandler, finallyHandler, okHandler, supersedeKey } =
				toOptions(optionsOrAction, positional);

			const filteredSetError = (...errors: (null | React.ReactElement)[]): void => {
				const filtered = errors.filter(Boolean);
				if (filtered.length > 0) {
					setError?.(...filtered);
				}
			};
			const { t } = i18n;
			const controller = new AbortController();
			if (supersedeKey !== undefined) {
				inFlight.current.get(supersedeKey)?.abort();
				inFlight.current.set(supersedeKey, controller);
			}
			setIsLoading?.(true);

			try {
				setError?.();
				const response = await action(controller.signal);
				if (controller.signal.aborted) {
					return;
				}
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
				if (controller.signal.aborted) {
					return;
				}
				console.error(renderToStaticMarkup(errorMessage), err);
				filteredSetError(
					errorMessage,
					err instanceof Error ? React.createElement('pre', null, err.message) : null,
				);
				errorHandler?.(err);
			} finally {
				if (supersedeKey !== undefined && inFlight.current.get(supersedeKey) === controller) {
					inFlight.current.delete(supersedeKey);
				}
				setIsLoading?.(false);
				if (!controller.signal.aborted) {
					finallyHandler?.();
				}
			}
		},
		[setIsLoading, setError],
	) as ExecuteAction;

	return { executeAction };
};
