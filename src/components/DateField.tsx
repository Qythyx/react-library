import React, { useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface DateFieldProps extends Omit<TextFieldProps, 'onChange' | 'type' | 'value'> {
	dateOnly?: boolean;
	isEditing?: boolean;
	onChange?: (date: string | undefined) => void;
	onValid?: (date: string) => void;
	timeZone?: string;
	value?: string;
}

const UTC_TIME_ZONE = 'UTC';

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/**
 * A cached `Intl.DateTimeFormat` for `timeZone`. Formatters are reused across renders and keystrokes
 * because constructing one is comparatively expensive. Throws for an unknown/empty zone.
 * @param timeZone - The IANA time zone to format in
 * @returns A formatter exposing the 2-digit calendar/clock fields
 */
const getFormatter = (timeZone: string): Intl.DateTimeFormat => {
	let formatter = formatterCache.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat('en-US', {
			day: '2-digit',
			hour: '2-digit',
			hourCycle: 'h23',
			minute: '2-digit',
			month: '2-digit',
			second: '2-digit',
			timeZone,
			year: 'numeric',
		});
		formatterCache.set(timeZone, formatter);
	}
	return formatter;
};

/**
 * Whether the string is an IANA time zone the runtime can resolve. An unknown or empty zone makes
 * `Intl.DateTimeFormat` throw, so this probes it defensively.
 * @param timeZone - The candidate time zone identifier
 * @returns True when the zone is usable
 */
const isValidTimeZone = (timeZone: string): boolean => {
	try {
		getFormatter(timeZone);
		return true;
	} catch {
		return false;
	}
};

interface ZonedParts {
	day: number;
	hour: number;
	minute: number;
	month: number;
	second: number;
	year: number;
}

/**
 * Break an instant into its calendar/clock fields as seen in `timeZone`.
 * @param date - The instant to decompose
 * @param timeZone - The IANA time zone to read the fields in
 * @returns The numeric year/month/day/hour/minute/second in that zone
 */
const getZonedParts = (date: Date, timeZone: string): ZonedParts => {
	const parts = getFormatter(timeZone).formatToParts(date);
	const lookup = (type: string): number => Number(parts.find(part => part.type === type)?.value);
	return {
		day: lookup('day'),
		hour: lookup('hour'),
		minute: lookup('minute'),
		month: lookup('month'),
		second: lookup('second'),
		year: lookup('year'),
	};
};

/**
 * Offset, in milliseconds, between the wall-clock time shown in `timeZone` and true UTC for the
 * given instant: (the zoned wall clock reinterpreted as UTC) minus the actual instant. Resolved for
 * that specific instant, so it reflects whichever DST rules were in effect then.
 * @param date - The instant to resolve the offset for
 * @param timeZone - An IANA time zone identifier (e.g. 'Asia/Tokyo')
 * @returns The offset in milliseconds
 */
const zoneOffsetMs = (date: Date, timeZone: string): number => {
	const { day, hour, minute, month, second, year } = getZonedParts(date, timeZone);
	return Date.UTC(year, month - 1, day, hour, minute, second) - date.getTime();
};

/**
 * Render a UTC ISO instant as the wall-clock string for `timeZone`: 'YYYY-MM-DD' when dateOnly,
 * otherwise 'YYYY-MM-DDTHH:mm'.
 * @param dateStr - A UTC ISO instant, or empty/undefined
 * @param dateOnly - Whether to omit the time portion
 * @param timeZone - The IANA time zone to render in
 * @returns The wall-clock string, or '' when the input is empty or unparseable
 */
const toZonedWallClock = (dateStr: string | undefined, dateOnly: boolean, timeZone: string): string => {
	if (!dateStr) {
		return '';
	}
	const date = new Date(dateStr);
	if (isNaN(date.getTime())) {
		return '';
	}
	const { day, hour, minute, month, year } = getZonedParts(date, timeZone);
	const pad = (n: number): string => String(n).padStart(2, '0');
	const wallDay = `${year}-${pad(month)}-${pad(day)}`;
	return dateOnly ? wallDay : `${wallDay}T${pad(hour)}:${pad(minute)}`;
};

/**
 * Interpret a wall-clock string entered for `timeZone` and return the matching UTC ISO instant.
 * @param wallClock - A 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm' string
 * @param timeZone - The IANA time zone the wall clock is expressed in
 * @returns The UTC ISO instant, or undefined when the input is empty or unparseable
 */
const zonedWallClockToIso = (wallClock: string, timeZone: string): string | undefined => {
	if (!wallClock || wallClock.trim() === '') {
		return undefined;
	}

	try {
		const [datePart, timePart] = wallClock.split('T');
		if (!datePart) {
			return undefined;
		}
		const [yearStr, monthStr, dayStr] = datePart.split('-');
		const [hourStr, minuteStr] = timePart ? timePart.split(':') : [];
		const year = Number(yearStr);
		const month = Number(monthStr);
		const day = Number(dayStr);
		const hour = Number(hourStr ?? 0);
		const minute = Number(minuteStr ?? 0);
		if ([year, month, day, hour, minute].some(isNaN)) {
			return undefined;
		}
		// Treat the entered components as if they were UTC, then correct by the zone's offset. The
		// offset is sampled a second time at the corrected instant because it can differ from the naive
		// guess across a DST transition (the guess and the true instant fall on opposite sides).
		const asIfUtc = Date.UTC(year, month - 1, day, hour, minute);
		const guessOffset = zoneOffsetMs(new Date(asIfUtc), timeZone);
		const offset = zoneOffsetMs(new Date(asIfUtc - guessOffset), timeZone);
		const asStr = new Date(asIfUtc - offset).toISOString();
		return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(asStr) ? asStr : undefined;
	} catch {
		return undefined;
	}
};

export const DateField = React.memo(function DateField({
	dateOnly = false,
	isEditing = true,
	onChange,
	onValid,
	timeZone = UTC_TIME_ZONE,
	value,
	...props
}: DateFieldProps): React.ReactElement {
	// The last zone we could actually render with. An invalid `timeZone` prop is ignored so the field
	// keeps working while the user is mid-way through typing a new one.
	const [lastValidTimeZone, setLastValidTimeZone] = useState(() =>
		isValidTimeZone(timeZone) ? timeZone : UTC_TIME_ZONE,
	);
	const activeTimeZone = isValidTimeZone(timeZone) ? timeZone : lastValidTimeZone;
	if (activeTimeZone !== lastValidTimeZone) {
		setLastValidTimeZone(activeTimeZone);
	}

	// A date-only control names a calendar day, so it is zone-independent (converted in UTC); only a
	// date+time is projected into the active zone.
	const conversionTimeZone = dateOnly ? UTC_TIME_ZONE : activeTimeZone;

	// The editable buffer, re-derived whenever the incoming value or zone changes. Typing sets it
	// directly and the round-trip back through `value` is idempotent, so in-progress edits survive.
	const [localValue, setLocalValue] = useState<string>(() => toZonedWallClock(value, dateOnly, conversionTimeZone));
	const [derivedFrom, setDerivedFrom] = useState<{ timeZone: string; value: string | undefined }>({
		timeZone: conversionTimeZone,
		value,
	});
	if (derivedFrom.timeZone !== conversionTimeZone || derivedFrom.value !== value) {
		setDerivedFrom({ timeZone: conversionTimeZone, value });
		setLocalValue(toZonedWallClock(value, dateOnly, conversionTimeZone));
	}

	const formatForDisplay = (dateStr: string | undefined): string => {
		const wallClock = toZonedWallClock(dateStr, dateOnly, conversionTimeZone);
		if (!wallClock) {
			return '';
		}
		return dateOnly ? wallClock : wallClock.slice(0, 10) + ', ' + wallClock.slice(11, 16);
	};

	return isEditing ? (
		<TextField
			{...props}
			onChange={e => {
				setLocalValue(e.target.value);
				const validDate = zonedWallClockToIso(e.target.value, conversionTimeZone);
				onChange?.(validDate);
				if (validDate) {
					onValid?.(validDate);
				}
			}}
			slotProps={{ htmlInput: { max: '9999-12-31' + (dateOnly ? '' : 'T23:59') }, inputLabel: { shrink: true } }}
			type={dateOnly ? 'date' : 'datetime-local'}
			value={localValue}
		/>
	) : (
		<span>{formatForDisplay(value)}</span>
	);
});
