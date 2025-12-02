import { getStatusMessage, HttpStatus } from './StatusCodes.js';

describe('HttpStatus', () => {
	it('should have correct success status codes', () => {
		expect(HttpStatus.OK).toBe(200);
		expect(HttpStatus.CREATED).toBe(201);
		expect(HttpStatus.NO_CONTENT).toBe(204);
	});

	it('should have correct client error status codes', () => {
		expect(HttpStatus.BAD_REQUEST).toBe(400);
		expect(HttpStatus.UNAUTHORIZED).toBe(401);
		expect(HttpStatus.FORBIDDEN).toBe(403);
		expect(HttpStatus.NOT_FOUND).toBe(404);
		expect(HttpStatus.CONFLICT).toBe(409);
		expect(HttpStatus.PRECONDITION_FAILED).toBe(412);
		expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(422);
	});

	it('should have correct server error status codes', () => {
		expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
		expect(HttpStatus.NOT_IMPLEMENTED).toBe(501);
		expect(HttpStatus.BAD_GATEWAY).toBe(502);
		expect(HttpStatus.SERVICE_UNAVAILABLE).toBe(503);
	});
});

describe('getStatusMessage', () => {
	it('should return custom message for NOT_FOUND', () => {
		const result = getStatusMessage(HttpStatus.NOT_FOUND, 'Default message');
		expect(result).toBe('The requested resource was not found');
	});

	it('should return custom message for UNAUTHORIZED', () => {
		const result = getStatusMessage(HttpStatus.UNAUTHORIZED, 'Default message');
		expect(result).toBe('You do not have authorization');
	});

	it('should return default message for unknown status codes', () => {
		const result = getStatusMessage(HttpStatus.OK, 'Custom default');
		expect(result).toBe('Custom default');
	});

	it('should return default message for other status codes', () => {
		expect(getStatusMessage(HttpStatus.BAD_REQUEST, 'Bad request occurred')).toBe('Bad request occurred');
		expect(getStatusMessage(HttpStatus.INTERNAL_SERVER_ERROR, 'Server error')).toBe('Server error');
	});

	it('should handle all defined status codes without throwing', () => {
		const statusCodes = Object.values(HttpStatus).filter(v => typeof v === 'number');
		statusCodes.forEach(status => {
			expect(() => getStatusMessage(status as HttpStatus, 'default')).not.toThrow();
		});
	});
});
