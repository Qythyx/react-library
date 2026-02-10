import { createInstance } from 'i18next';

export const createMockI18n = () => {
	const i18n = createInstance();
	i18n.init({ fallbackLng: 'en', lng: 'en' });
	return i18n;
};
