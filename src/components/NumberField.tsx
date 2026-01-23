import React, { useEffect, useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface NumberFieldProps extends Omit<TextFieldProps, 'inputMode' | 'onChange' | 'placeholder' | 'type' | 'value'> {
	decimalPlaces?: number;
	onChange: (value: number) => void;
	value: '' | number;
}

export function NumberField({
	decimalPlaces = 0,
	onChange,
	value,
	...textFieldProps
}: NumberFieldProps): React.ReactElement {
	const pattern = new RegExp(decimalPlaces > 0 ? `^[0-9]*\\.?[0-9]{0,${decimalPlaces}}$` : '^[0-9]*$');
	const [displayValue, setDisplayValue] = useState(value === '' ? '' : String(value));

	// Sync display value when the value prop changes externally
	useEffect(() => {
		setDisplayValue(value === '' ? '' : String(value));
	}, [value]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const inputValue = e.target.value;

		if (inputValue === '') {
			setDisplayValue('');
			onChange(0);
			return;
		}

		const numValue = decimalPlaces > 0 ? parseFloat(inputValue) : parseInt(inputValue);
		if (!isNaN(numValue) && pattern.test(inputValue)) {
			setDisplayValue(inputValue);
			if (decimalPlaces > 0 && inputValue.endsWith('.')) {
				return;
			}
			onChange(numValue);
		}
	};

	return (
		<TextField
			{...textFieldProps}
			inputMode="numeric"
			onChange={handleChange}
			slotProps={textFieldProps.slotProps}
			type="text"
			value={displayValue}
		/>
	);
}
