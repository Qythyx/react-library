import { renderHook } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { useRequiredParams } from './useRequiredParams.js';

jest.mock('react-router-dom', () => ({
	useParams: jest.fn(),
}));

const mockedUseParams = useParams as jest.MockedFunction<typeof useParams>;

describe('useRequiredParams', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return params when all required params are present', () => {
		mockedUseParams.mockReturnValue({
			postId: '456',
			userId: '123',
		});

		const { result } = renderHook(() => useRequiredParams(['userId', 'postId'] as const));

		expect(result.current).toEqual({
			postId: '456',
			userId: '123',
		});
	});

	it('should throw error when a required param is missing', () => {
		mockedUseParams.mockReturnValue({
			userId: '123',
		});

		expect(() => {
			renderHook(() => useRequiredParams(['userId', 'postId'] as const));
		}).toThrow('Missing required route parameters: postId');
	});

	it('should throw error listing all missing parameters', () => {
		mockedUseParams.mockReturnValue({});

		expect(() => {
			renderHook(() => useRequiredParams(['userId', 'postId', 'commentId'] as const));
		}).toThrow('Missing required route parameters: userId, postId, commentId');
	});

	it('should work with a single parameter', () => {
		mockedUseParams.mockReturnValue({
			id: '789',
		});

		const { result } = renderHook(() => useRequiredParams(['id'] as const));

		expect(result.current).toEqual({ id: '789' });
	});

	it('should handle empty string as missing parameter', () => {
		mockedUseParams.mockReturnValue({
			postId: '456',
			userId: '',
		});

		expect(() => {
			renderHook(() => useRequiredParams(['userId', 'postId'] as const));
		}).toThrow('Missing required route parameters: userId');
	});

	it('should handle undefined parameters', () => {
		mockedUseParams.mockReturnValue({
			postId: '456',
			userId: undefined,
		});

		expect(() => {
			renderHook(() => useRequiredParams(['userId', 'postId'] as const));
		}).toThrow('Missing required route parameters: userId');
	});

	it('should type params correctly', () => {
		mockedUseParams.mockReturnValue({
			clientId: 'client123',
			venueId: 'venue456',
		});

		const { result } = renderHook(() => useRequiredParams(['clientId', 'venueId'] as const));

		const { clientId, venueId } = result.current;
		expect(typeof clientId).toBe('string');
		expect(typeof venueId).toBe('string');
		expect(clientId).toBe('client123');
		expect(venueId).toBe('venue456');
	});

	it('should ignore extra params not in required list', () => {
		mockedUseParams.mockReturnValue({
			extraParam: 'extra',
			postId: '456',
			userId: '123',
		});

		const { result } = renderHook(() => useRequiredParams(['userId', 'postId'] as const));

		expect(result.current).toEqual({
			postId: '456',
			userId: '123',
		});
	});
});
