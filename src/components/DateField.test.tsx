import React from 'react';
import { userEvent } from '@testing-library/user-event';

import { DateField } from './DateField.js';
import { render, screen } from '../test-utils/testUtils.js';

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
		const { container } = render(<DateField onChange={onChange} value="2024-01-15T10:30:00.000Z" />);
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
		const { container } = render(<DateField dateOnly={true} value="2024-01-15T10:30:00.000Z" />);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.value).toBe('2024-01-15');
	});

	it('should initialize with formatted datetime value', () => {
		const { container } = render(<DateField dateOnly={false} value="2024-01-15T10:30:00.000Z" />);
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
		const { container } = render(<DateField dateOnly={true} isEditing={false} value="2024-01-15T10:30:00.000Z" />);
		expect(container.textContent).toBe('2024-01-15');
	});

	it('should format display text correctly for datetime', () => {
		const { container } = render(<DateField dateOnly={false} isEditing={false} value="2024-01-15T10:30:00.000Z" />);
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

	it('should display a UTC instant as the wall clock of the given timeZone', () => {
		const { container } = render(
			<DateField isEditing={false} timeZone="Asia/Tokyo" value="2024-01-15T10:30:00.000Z" />,
		);
		// 10:30 UTC is 19:30 the same day in JST (UTC+9, no DST).
		expect(container.textContent).toBe('2024-01-15, 19:30');
	});

	it('should seed the input with the zoned wall clock', () => {
		const { container } = render(
			<DateField dateOnly={false} timeZone="Asia/Tokyo" value="2024-01-15T10:30:00.000Z" />,
		);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.value).toBe('2024-01-15T19:30');
	});

	it('should convert an entered zoned wall clock back to a UTC instant', async () => {
		const onValid = jest.fn();
		const user = userEvent.setup();
		const { container } = render(<DateField dateOnly={false} onValid={onValid} timeZone="Asia/Tokyo" />);
		const input = container.querySelector('input') as HTMLInputElement;

		await user.type(input, '2024-01-15T19:30');

		expect(onValid).toHaveBeenCalled();
		const [lastCall] = onValid.mock.calls[onValid.mock.calls.length - 1];
		// 19:30 JST is 10:30 UTC the same day.
		expect(lastCall).toBe('2024-01-15T10:30:00.000Z');
	});

	it('should re-derive the input value when the timeZone prop changes', () => {
		const { container, rerender } = render(
			<DateField dateOnly={false} timeZone="UTC" value="2024-01-15T10:30:00.000Z" />,
		);
		const input = (): HTMLInputElement => container.querySelector('input') as HTMLInputElement;
		expect(input().value).toBe('2024-01-15T10:30');

		rerender(<DateField dateOnly={false} timeZone="Asia/Tokyo" value="2024-01-15T10:30:00.000Z" />);
		expect(input().value).toBe('2024-01-15T19:30');
	});

	it('should re-derive the input value when the value prop changes', () => {
		const { container, rerender } = render(
			<DateField dateOnly={false} timeZone="Asia/Tokyo" value="2024-01-15T10:30:00.000Z" />,
		);
		const input = (): HTMLInputElement => container.querySelector('input') as HTMLInputElement;
		expect(input().value).toBe('2024-01-15T19:30');

		// A programmatic value change (not typed into this field) must refresh the input.
		rerender(<DateField dateOnly={false} timeZone="Asia/Tokyo" value="2024-02-20T00:00:00.000Z" />);
		expect(input().value).toBe('2024-02-20T09:00');
	});

	it('should resolve an entered wall clock just after a DST spring-forward without an hour error', async () => {
		const onValid = jest.fn();
		const user = userEvent.setup();
		const { container } = render(<DateField dateOnly={false} onValid={onValid} timeZone="America/New_York" />);
		const input = container.querySelector('input') as HTMLInputElement;

		// New York jumps 02:00 -> 03:00 local on 2024-03-10; 03:30 EDT is 07:30 UTC. A single-sample
		// offset would land on the pre-transition (EST) side and be an hour off.
		await user.type(input, '2024-03-10T03:30');

		expect(onValid).toHaveBeenCalled();
		const [lastCall] = onValid.mock.calls[onValid.mock.calls.length - 1];
		expect(lastCall).toBe('2024-03-10T07:30:00.000Z');
	});

	it('should keep the last valid timeZone when the prop becomes invalid, then adopt a later valid one', () => {
		const { container, rerender } = render(
			<DateField dateOnly={false} timeZone="Asia/Tokyo" value="2024-01-15T10:30:00.000Z" />,
		);
		const input = (): HTMLInputElement => container.querySelector('input') as HTMLInputElement;
		expect(input().value).toBe('2024-01-15T19:30');

		// An invalid zone (e.g. a half-typed identifier) is ignored — still JST.
		rerender(<DateField dateOnly={false} timeZone="Asia/Tok" value="2024-01-15T10:30:00.000Z" />);
		expect(input().value).toBe('2024-01-15T19:30');

		// A subsequent valid zone is adopted.
		rerender(<DateField dateOnly={false} timeZone="UTC" value="2024-01-15T10:30:00.000Z" />);
		expect(input().value).toBe('2024-01-15T10:30');
	});

	it('should fall back to UTC when the initial timeZone is invalid', () => {
		const { container } = render(
			<DateField dateOnly={false} timeZone="Not/AZone" value="2024-01-15T10:30:00.000Z" />,
		);
		const input = container.querySelector('input') as HTMLInputElement;
		expect(input.value).toBe('2024-01-15T10:30');
	});

	it('should not throw when rendered with an invalid timeZone', () => {
		expect(() =>
			render(<DateField isEditing={false} timeZone="garbage" value="2024-01-15T10:30:00.000Z" />),
		).not.toThrow();
	});

	it('should render blank rather than a stray comma for an empty datetime in display mode', () => {
		const { container } = render(<DateField dateOnly={false} isEditing={false} value="" />);
		expect(container.textContent).toBe('');
	});

	it('should treat a date-only value as a zone-independent calendar day', () => {
		const { container } = render(
			<DateField dateOnly={true} isEditing={false} timeZone="Asia/Tokyo" value="2024-01-15T20:00:00.000Z" />,
		);
		// A date-only field names a calendar day, not an instant projected into the zone, so 20:00 UTC
		// stays the 15th even though it is already the 16th in JST.
		expect(container.textContent).toBe('2024-01-15');
	});

	it('should round-trip a date-only entry through UTC midnight regardless of timeZone', async () => {
		const onValid = jest.fn();
		const user = userEvent.setup();
		const { container } = render(<DateField dateOnly={true} onValid={onValid} timeZone="Asia/Tokyo" />);
		const input = container.querySelector('input') as HTMLInputElement;

		await user.type(input, '2024-01-15');

		expect(onValid).toHaveBeenCalled();
		const [lastCall] = onValid.mock.calls[onValid.mock.calls.length - 1];
		expect(lastCall).toBe('2024-01-15T00:00:00.000Z');
	});
});
