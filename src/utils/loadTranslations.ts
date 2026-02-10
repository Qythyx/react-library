import { i18n } from 'i18next';

import en from '../../public/locales/en/translation.json' with { type: 'json' };
import ja from '../../public/locales/ja/translation.json' with { type: 'json' };

/**
 * Adds library translation bundles to the given i18n instance.
 * Safe to call multiple times — existing keys are not overwritten.
 * @param i18n The i18n to add translation resources to.
 */
export function loadTranslations(i18n?: i18n): void {
	if (i18n) {
		i18n.addResourceBundle('en', 'translation', en, true, false);
		i18n.addResourceBundle('ja', 'translation', ja, true, false);
	}
}
