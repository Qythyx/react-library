import React from 'react';
import { userEvent } from '@testing-library/user-event';

import { NumberField } from './NumberField.js';
import { render, screen } from '../test-utils/testUtils.js';

describe('NumberField', () => {
	it('should render with initial value', () => {
		render(<NumberField onChange={() => {}} value={42} />);
		const input = screen.getByRole('textbox') as HTMLInputElement;
		expect(input.value).toBe('42');
	});

	it('should render with empty value', () => {
		render(<NumberField onChange={() => {}} value="" />);
		const input = screen.getByRole('textbox') as HTMLInputElement;
		expect(input.value).toBe('');
	});

	it('should handle integer-only input when decimalPlaces is 0', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		render(<NumberField decimalPlaces={0} onChange={onChange} value="" />);
		const input = screen.getByRole('textbox');

		await user.type(input, '123');
		expect(onChange).toHaveBeenLastCalledWith(123);
	});

	it('should handle decimal input when decimalPlaces is set', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		render(<NumberField decimalPlaces={2} onChange={onChange} value="" />);
		const input = screen.getByRole('textbox');

		await user.type(input, '12.34');
		expect(onChange).toHaveBeenLastCalledWith(12.34);
	});

	it('should allow trailing decimal point without calling onChange', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		render(<NumberField decimalPlaces={2} onChange={onChange} value="" />);
		const input = screen.getByRole('textbox') as HTMLInputElement;

		await user.type(input, '12.');
		expect(input.value).toBe('12.');
		// onChange should not be called for trailing decimal
		expect(onChange).toHaveBeenLastCalledWith(12);
	});

	it('should reject non-numeric characters', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		render(<NumberField onChange={onChange} value={5} />);
		const input = screen.getByRole('textbox') as HTMLInputElement;

		await user.type(input, 'abc');
		expect(input.value).toBe('5');
		expect(onChange).not.toHaveBeenCalledWith(expect.stringContaining('abc'));
	});

	it('should convert empty input to 0', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		render(<NumberField onChange={onChange} value={42} />);
		const input = screen.getByRole('textbox');

		await user.clear(input);
		expect(onChange).toHaveBeenCalledWith(0);
	});

	it('should sync display value when external value changes', () => {
		const { rerender } = render(<NumberField onChange={() => {}} value={10} />);
		const input = screen.getByRole('textbox') as HTMLInputElement;
		expect(input.value).toBe('10');

		rerender(<NumberField onChange={() => {}} value={20} />);
		expect(input.value).toBe('20');
	});

	it('should respect decimal places limit', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		render(<NumberField decimalPlaces={2} onChange={onChange} value="" />);
		const input = screen.getByRole('textbox') as HTMLInputElement;

		await user.type(input, '12.345');
		// Should only accept up to 2 decimal places
		expect(input.value).toBe('12.34');
		expect(onChange).toHaveBeenLastCalledWith(12.34);
	});

	it('should handle negative numbers', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		render(<NumberField onChange={onChange} value="" />);
		const input = screen.getByRole('textbox');

		await user.type(input, '-5');
		// Pattern only allows positive numbers
		expect(onChange).not.toHaveBeenCalledWith(-5);
	});

	it('should pass through TextField props', () => {
		render(<NumberField label="Test Label" onChange={() => {}} value={42} />);
		expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
	});

	it('should render numeric input field', () => {
		const { container } = render(<NumberField onChange={() => {}} value={42} />);
		const input = container.querySelector('input');
		expect(input).toBeTruthy();
		expect(input?.type).toBe('text');
	});

	it('should handle zero as initial value', () => {
		render(<NumberField onChange={() => {}} value={0} />);
		const input = screen.getByRole('textbox') as HTMLInputElement;
		expect(input.value).toBe('0');
	});

	it('should handle decimal input with leading zero', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		render(<NumberField decimalPlaces={2} onChange={onChange} value="" />);
		const input = screen.getByRole('textbox');

		await user.type(input, '0.5');
		expect(onChange).toHaveBeenLastCalledWith(0.5);
	});

	it('should not allow more decimal places than specified', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		render(<NumberField decimalPlaces={1} onChange={onChange} value={1.2} />);
		const input = screen.getByRole('textbox') as HTMLInputElement;

		await user.type(input, '5');
		// Should not accept additional decimal places beyond the limit
		expect(input.value).toBe('1.2');
	});
});
