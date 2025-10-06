import { TextField, TextFieldProps } from '@mui/material';
import React from 'react';

interface NumberFieldProps extends Omit<TextFieldProps, 'onChange' | 'placeholder' | 'type' | 'inputMode' | 'value'> {
	decimalPlaces?: number;
	onChange: (value: number) => void;
	value: number | '';
}

export function NumberField({
	decimalPlaces = 0,
	onChange,
	value,
	...textFieldProps
}: NumberFieldProps): React.ReactElement {
	const pattern = decimalPlaces > 0 ? `[0-9]*\\.?[0-9]{0,${decimalPlaces}}` : '[0-9]*';

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		const inputValue = e.target.value;
		if (inputValue === '') {
			onChange(0);
			return;
		}

		if (decimalPlaces > 0) {
			const numValue = parseFloat(inputValue);
			if (!isNaN(numValue)) {
				onChange(numValue);
			}
		} else {
			const numValue = parseInt(inputValue);
			if (!isNaN(numValue)) {
				onChange(numValue);
			}
		}
	};

	return (
		<TextField
			{...textFieldProps}
			inputMode="numeric"
			onChange={handleChange}
			type="text"
			value={value}
			slotProps={{
				...textFieldProps.slotProps,
				htmlInput: {
					...textFieldProps.slotProps?.htmlInput,
					pattern,
				},
			}}
		/>
	);
}
