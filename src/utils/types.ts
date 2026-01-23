export type ApiResponse<T> = BadResponse | OkResponse<T>;

export interface BadResponse {
	error?: string;
	ok: false;
	status: number;
}

export interface OkResponse<T> {
	data: T;
	ok: true;
	status: number;
}
