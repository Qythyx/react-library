import '@testing-library/jest-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

const theme = createTheme();

function AllTheProviders({ children }: { children: React.ReactNode }) {
	return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
	return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
