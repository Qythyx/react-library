import { createInstance } from 'i18next';

export const createMockI18n = () => {
	const i18n = createInstance();
	i18n.init({
		fallbackLng: 'en',
		lng: 'en',
		resources: {
			en: {
				translation: {
					dataTable: {
						emptyMessage: 'No data found.',
						goToPage: 'Go to page',
						itemsPerPage: 'Items per page',
						list: {
							itemsPerPage: 'Items per page:',
							next: 'Next',
							previous: 'Previous',
							showAll: 'All',
							total: '{{count}} Items',
						},
						sortBy: 'Sort by {{label}}',
					},
				},
			},
		},
	});
	return i18n;
};
