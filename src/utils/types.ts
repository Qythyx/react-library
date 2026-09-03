/**
 * An API response. `TReason` is the set of refusal reasons a failure can name.
 */
export type ApiResponse<TData, TReason = never> = FailedResponse<TReason> | OkResponse<TData>;

/**
 * A failed response. `reason` is the caller's own vocabulary — this library never defines the values
 * — and it is optional because a call can fail without one: a proxy or a gateway can refuse it before
 * the service ever sees it. A call with no refusal reasons writes `never`, leaving `reason` able to
 * hold nothing but `undefined`.
 */
export interface FailedResponse<TReason = never> {
	error?: string;
	ok: false;
	reason?: TReason;
	status: number;
}

export interface OkResponse<TData> {
	data: TData;
	ok: true;
	status: number;
}
