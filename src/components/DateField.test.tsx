import { render, screen } from '../test-utils/testUtils.js';
import { DateField } from './DateField.js';
import React from 'react';
import { userEvent } from '@testing-library/user-event';

describe('DateField', () => {
	it('should render date input when dateOnly is true', () => {
		const { container } = render(<DateField dateOnly={true} />);
		const input = container.querySelector('input[type="date"]') as HTMLInputElement;
		expect(input).toBeInTheDocument();
		expect(input.type).toBe('date');
	});

	it('should render datetime-local input when dateOnly is false', () => {
		const { container } = render(<DateField dateOnly={false} />);
		const input = container.querySelector('input[type="datetime-local"]') as HTMLInputElement;
		expect(input).toBeInTheDocument();
		expect(input.type).toBe('datetime-local');
	});

	it('should render text when isEditing is false', () => {
		const { container } = render(<DateField isEditing={false} value="2024-01-15T10:30:00.000Z" />);
		expect(container.textContent).toContain('2024-01-15');
		expect(container.querySelector('input')).not.toBeInTheDocument();
	});

	it('should render input when isEditing is true', () => {
		const { container } = render(<DateField isEditing={true} />);
		expect(container.querySelector('input')).toBeInTheDocument();
	});

	it('should call onChange with valid ISO string for date input', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		const { container } = render(<DateField dateOnly={true} onChange={onChange} />);
		const input = container.querySelector('input') as HTMLInputElement;

		await user.type(input, '2024-03-15');

		expect(onChange).toHaveBeenCalled();
		const [lastCall] = onChange.mock.calls[onChange.mock.calls.length - 1];
		expect(lastCall).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
	});

	it('should call onValid when date is valid', async () => {
		const onValid = jest.fn();
		const user = userEvent.setup();
		const { container } = render(<DateField dateOnly={true} onValid={onValid} />);
		const input = container.querySelector('input') as HTMLInputElement;

		await user.type(input, '2024-03-15');

		expect(onValid).toHaveBeenCalled();
	});

	it('should call onChange with undefined for empty date', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		const { container } = render(<DateField value="2024-01-15T10:30:00.000Z" onChange={onChange} />);
		const input = container.querySelector('input') as HTMLInputElement;

		await user.clear(input);
		await user.tab(); // Trigger blur to fire onChange

		// When input is cleared, onChange should be called with undefined
		const { calls } = onChange.mock;
		const lastCall = calls[calls.length - 1];
		expect(lastCall[0]).toBeUndefined();
	});

	it('should set max date to 9999-12-31 for date only', () => {
		const { container } = render(<DateField dateOnly={true} />);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.max).toBe('9999-12-31');
	});

	it('should set max datetime for datetime-local', () => {
		const { container } = render(<DateField dateOnly={false} />);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.max).toBe('9999-12-31T23:59');
	});

	it('should initialize with formatted value', () => {
		const { container } = render(<DateField value="2024-01-15T10:30:00.000Z" dateOnly={true} />);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.value).toBe('2024-01-15');
	});

	it('should initialize with formatted datetime value', () => {
		const { container } = render(<DateField value="2024-01-15T10:30:00.000Z" dateOnly={false} />);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.value).toMatch(/2024-01-15T\d{2}:\d{2}/);
	});

	it('should handle empty initial value', () => {
		const { container } = render(<DateField value="" />);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.value).toBe('');
	});

	it('should handle undefined initial value', () => {
		const { container } = render(<DateField value={undefined} />);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.value).toBe('');
	});

	it('should format display text correctly for date only', () => {
		const { container } = render(<DateField isEditing={false} value="2024-01-15T10:30:00.000Z" dateOnly={true} />);
		expect(container.textContent).toBe('2024-01-15');
	});

	it('should format display text correctly for datetime', () => {
		const { container } = render(<DateField isEditing={false} value="2024-01-15T10:30:00.000Z" dateOnly={false} />);
		expect(container.textContent).toMatch(/2024-01-15, \d{2}:\d{2}/);
	});

	it('should pass through TextField props', () => {
		render(<DateField label="Select Date" placeholder="Choose a date" />);
		expect(screen.getByLabelText('Select Date')).toBeInTheDocument();
	});

	it('should not call onValid when date is invalid', async () => {
		const onValid = jest.fn();
		const user = userEvent.setup();
		const { container } = render(<DateField onValid={onValid} />);
		const input = container.querySelector('input') as HTMLInputElement;

		await user.clear(input);

		expect(onValid).not.toHaveBeenCalled();
	});

	it('should handle timezone offset conversion', async () => {
		const onChange = jest.fn();
		const user = userEvent.setup();
		const { container } = render(<DateField dateOnly={false} onChange={onChange} />);
		const input = container.querySelector('input') as HTMLInputElement;

		await user.type(input, '2024-01-15T10:30');

		expect(onChange).toHaveBeenCalled();
		const [lastCall] = onChange.mock.calls[onChange.mock.calls.length - 1];
		// Should return ISO string with timezone adjustment
		expect(lastCall).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
	});
});
