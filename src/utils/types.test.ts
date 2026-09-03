import { ApiResponse, FailedResponse, OkResponse } from './types.js';

type StockReason = 'etag-conflict' | 'out-of-stock';

const reject = (reason: StockReason): ApiResponse<string, StockReason> => ({
	error: 'No unallocated stock',
	ok: false,
	reason,
	status: 412,
});

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

describe('FailedResponse', () => {
	it('should have correct structure with error', () => {
		const response: FailedResponse<never> = {
			error: 'Something went wrong',
			ok: false,
			status: 400,
		};

		expect(response.error).toBe('Something went wrong');
		expect(response.ok).toBe(false);
		expect(response.status).toBe(400);
	});

	it('should work without error message', () => {
		const response: FailedResponse<never> = {
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

	it('should accept a failure', () => {
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

describe('ApiResponse with a reason type', () => {
	it('should expose its reason after an ok check and a reason guard', () => {
		expect.assertions(1);
		const response = reject('out-of-stock');

		if (!response.ok && response.reason !== undefined) {
			expect(response.reason).toBe('out-of-stock');
		}
	});

	it('should treat a failure with no reason as possible', () => {
		const response: ApiResponse<string, StockReason> = {
			error: 'Bad gateway',
			ok: false,
			status: 502,
		};

		if (!response.ok) {
			expect(response.reason).toBeUndefined();
		}
	});

	it('should not offer a reason on the ok arm', () => {
		const response: ApiResponse<string, StockReason> = {
			data: 'success',
			ok: true,
			status: 200,
		};

		if (response.ok) {
			// @ts-expect-error an OkResponse has no reason
			expect(response.reason).toBeUndefined();
		}
	});

	it('should switch exhaustively over the reason', () => {
		const describeReason = (response: FailedResponse<StockReason>): string => {
			switch (response.reason) {
				case 'etag-conflict':
					return 'someone else edited this';
				case 'out-of-stock':
					return 'no unallocated stock';
				case undefined:
					return 'no reason given';
				default: {
					const unhandled: never = response.reason;
					return unhandled;
				}
			}
		};

		expect(describeReason({ ok: false, reason: 'out-of-stock', status: 412 })).toBe('no unallocated stock');
		expect(describeReason({ ok: false, status: 502 })).toBe('no reason given');
	});
});
