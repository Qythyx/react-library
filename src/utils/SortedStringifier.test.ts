import { stringifySorted } from './SortedStringifier.js';

describe('stringifySorted', () => {
	it('should sort flat object keys alphabetically', () => {
		const obj = { apple: 2, mango: 3, zebra: 1 };
		const result = stringifySorted(obj);
		expect(result).toBe('{"apple":2,"mango":3,"zebra":1}');
	});

	it('should sort nested object keys recursively', () => {
		const obj = {
			a: { x: 4, y: 3 },
			z: { a: 2, b: 1 },
		};
		const result = stringifySorted(obj);
		expect(result).toBe('{"a":{"x":4,"y":3},"z":{"a":2,"b":1}}');
	});

	it('should preserve array order', () => {
		const obj = { array: [3, 1, 2] };
		const result = stringifySorted(obj);
		expect(result).toBe('{"array":[3,1,2]}');
	});

	it('should sort objects within arrays', () => {
		const obj = {
			items: [
				{ a: 2, z: 1 },
				{ a: 4, b: 3 },
			],
		};
		const result = stringifySorted(obj);
		expect(result).toBe('{"items":[{"a":2,"z":1},{"a":4,"b":3}]}');
	});

	it('should handle primitive types', () => {
		expect(stringifySorted('hello')).toBe('"hello"');
		expect(stringifySorted(42)).toBe('42');
		expect(stringifySorted(true)).toBe('true');
		expect(stringifySorted(null)).toBe('null');
	});

	it('should handle empty objects', () => {
		const result = stringifySorted({});
		expect(result).toBe('{}');
	});

	it('should handle empty arrays', () => {
		const result = stringifySorted([]);
		expect(result).toBe('[]');
	});

	it('should handle replacer parameter', () => {
		const obj = { a: 1, b: 2, c: 3 };
		const replacer = (key: string, value: unknown) => {
			if (key === 'b') {
				return undefined;
			}
			return value;
		};
		const result = stringifySorted(obj, replacer);
		expect(result).toBe('{"a":1,"c":3}');
	});

	it('should handle space parameter for pretty printing', () => {
		const obj = { a: 1, b: 2 };
		const result = stringifySorted(obj, undefined, 2);
		expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
	});

	it('should handle space parameter with tab character', () => {
		const obj = { a: 1, b: 2 };
		const result = stringifySorted(obj, undefined, '\t');
		expect(result).toBe('{\n\t"a": 1,\n\t"b": 2\n}');
	});

	it('should handle deeply nested structures', () => {
		const obj = {
			a: 1,
			z: { y: { x: { a: 3, b: 2, c: 1 } } },
		};
		const result = stringifySorted(obj);
		expect(result).toBe('{"a":1,"z":{"y":{"x":{"a":3,"b":2,"c":1}}}}');
	});

	it('should handle mixed types in object', () => {
		const obj = {
			array: [1, 2, 3],
			boolean: true,
			null: null,
			number: 42,
			object: { nested: true },
			string: 'hello',
		};
		const result = stringifySorted(obj);
		expect(result).toBe(
			'{"array":[1,2,3],"boolean":true,"null":null,"number":42,"object":{"nested":true},"string":"hello"}',
		);
	});
});
