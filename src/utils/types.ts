export interface OkResponse<T> {
	data: T;
	ok: true;
	status: number;
}

export interface BadResponse {
	error?: string;
	ok: false;
	status: number;
}

export type ApiResponse<T> = OkResponse<T> | BadResponse;
