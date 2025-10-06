import React, { useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface DateFieldProps extends Omit<TextFieldProps, 'onChange' | 'type' | 'value'> {
	dateOnly?: boolean;
	isEditing?: boolean;
	onChange?: (date: string | undefined) => void;
	onValid?: (date: string) => void;
	value?: string;
}

export const DateField = React.memo(function DateField({
	dateOnly = false,
	isEditing = true,
	value,
	onChange,
	onValid,
	...props
}: DateFieldProps): React.ReactElement {
	const formatDate = (dateStr: string | undefined): string => {
		if (!dateStr) {
			return '';
		}
		const date = new Date(dateStr);
		return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, dateOnly ? 10 : 16);
	};

	const formatForDisplay = (dateStr: string | undefined): string => {
		const asISO = formatDate(dateStr);
		return dateOnly ? asISO.slice(0, 10) : asISO.slice(0, 10) + ', ' + asISO.slice(11, 16);
	};

	const [localValue, setLocalValue] = useState<string>(() => formatDate(value));

	const checkIsValid = (dateString: string): string | undefined => {
		if (!dateString || dateString.trim() === '') {
			return undefined;
		}

		try {
			// Convert ISO time so it shows as local time
			const date = new Date(dateString);
			date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
			const asStr = date.toISOString();
			return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(asStr) ? asStr : undefined;
		} catch {
			return undefined;
		}
	};

	return isEditing ? (
		<TextField
			{...props}
			type={dateOnly ? 'date' : 'datetime-local'}
			value={localValue}
			onChange={e => {
				setLocalValue(e.target.value);
				const validDate = checkIsValid(e.target.value);
				onChange?.(validDate);
				if (validDate) {
					onValid?.(validDate);
				}
			}}
			slotProps={{ htmlInput: { max: '9999-12-31' + (dateOnly ? '' : 'T23:59') }, inputLabel: { shrink: true } }}
		/>
	) : (
		<>{formatForDisplay(value)}</>
	);
});
