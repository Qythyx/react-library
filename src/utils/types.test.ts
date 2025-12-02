import { ApiResponse, BadResponse, OkResponse } from './types.js';

describe('OkResponse', () => {
	it('should have correct structure with data', () => {
		const response: OkResponse<string> = {
			data: 'test data',
			ok: true,
			status: 200,
		};

		expect(response.data).toBe('test data');
		expect(response.ok).toBe(true);
		expect(response.status).toBe(200);
	});

	it('should work with different data types', () => {
		const stringResponse: OkResponse<string> = {
			data: 'hello',
			ok: true,
			status: 200,
		};
		expect(stringResponse.data).toBe('hello');

		const numberResponse: OkResponse<number> = {
			data: 42,
			ok: true,
			status: 201,
		};
		expect(numberResponse.data).toBe(42);

		const objectResponse: OkResponse<{ id: number }> = {
			data: { id: 1 },
			ok: true,
			status: 200,
		};
		expect(objectResponse.data).toEqual({ id: 1 });
	});
});

describe('BadResponse', () => {
	it('should have correct structure with error', () => {
		const response: BadResponse = {
			error: 'Something went wrong',
			ok: false,
			status: 400,
		};

		expect(response.error).toBe('Something went wrong');
		expect(response.ok).toBe(false);
		expect(response.status).toBe(400);
	});

	it('should work without error message', () => {
		const response: BadResponse = {
			ok: false,
			status: 500,
		};

		expect(response.error).toBeUndefined();
		expect(response.ok).toBe(false);
		expect(response.status).toBe(500);
	});
});

describe('ApiResponse', () => {
	it('should accept OkResponse', () => {
		const response: ApiResponse<string> = {
			data: 'success',
			ok: true,
			status: 200,
		};

		if (response.ok) {
			expect(response.data).toBe('success');
		}
	});

	it('should accept BadResponse', () => {
		const response: ApiResponse<string> = {
			error: 'failed',
			ok: false,
			status: 404,
		};

		if (!response.ok) {
			expect(response.error).toBe('failed');
		}
	});

	it('should discriminate between ok and bad responses using ok property', () => {
		const okResponse: ApiResponse<number> = {
			data: 123,
			ok: true,
			status: 200,
		};

		const badResponse: ApiResponse<number> = {
			error: 'error',
			ok: false,
			status: 400,
		};

		if (okResponse.ok) {
			expect(okResponse.data).toBe(123);
		}

		if (!badResponse.ok) {
			expect(badResponse.error).toBe('error');
		}
	});
});
