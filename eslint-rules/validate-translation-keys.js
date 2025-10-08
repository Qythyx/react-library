/**
 * ESLint rule to validate translation keys exist in translation files
 *
 * This rule checks that all keys passed to the t() function from react-i18next
 * actually exist in the translation JSON files.
 */

import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TranslationsPath = '../public/locales';

// Cache translation files to avoid reading them multiple times
let translationCache;
let cacheTimestamp;

function loadTranslations() {
	const latest = Math.max(
		...fs
			.readdirSync(path.resolve(__dirname, TranslationsPath))
			.map(locale =>
				fs
					.readdirSync(path.resolve(__dirname, TranslationsPath, locale))
					.map(file => fs.statSync(path.resolve(__dirname, TranslationsPath, locale, file)).mtimeMs),
			)
			.flat(),
	);
	if (!translationCache || latest > cacheTimestamp) {
		const translationsPerLocale = new Map();
		const locales = fs.readdirSync(path.resolve(__dirname, TranslationsPath));
		console.log('Loaded locales for translation validation:', locales);

		for (const locale of locales) {
			try {
				const translations = JSON.parse(
					fs.readFileSync(path.resolve(__dirname, TranslationsPath, locale, 'translation.json'), 'utf8'),
				);

				// Flatten the nested translation keys and store both key and value
				function flattenKeysWithValues(obj, prefix = '') {
					const result = new Map();

					for (const [key, value] of Object.entries(obj)) {
						const fullKey = prefix ? `${prefix}.${key}` : key;

						if (typeof value === 'string') {
							result.set(fullKey, value);
						} else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
							const nestedResults = flattenKeysWithValues(value, fullKey);
							nestedResults.forEach((val, k) => result.set(k, val));
						}
					}

					return result;
				}

				translationsPerLocale.set(locale, flattenKeysWithValues(translations.translation));
			} catch (error) {
				console.warn(`Could not load ${locale} translation files for validation:`, error.message);
				throw error;
			}
		}
		translationCache = translationsPerLocale;
		cacheTimestamp = latest;
	}
	return translationCache;
}

// Extract placeholder variables from a translation string (e.g., "{{name}}" -> ["name"])
function extractPlaceholders(translationString) {
	const placeholderRegex = /\{\{([^}]+)\}\}/g;
	const placeholders = [];
	let match;

	while ((match = placeholderRegex.exec(translationString)) !== null) {
		placeholders.push(match[1].trim());
	}

	return placeholders;
}

// Extract parameter names from an object expression (e.g., { name: value, count: 5 })
function extractObjectProperties(objectExpression) {
	if (objectExpression.type !== 'ObjectExpression') {
		return null;
	}

	const properties = [];
	for (const prop of objectExpression.properties) {
		if (prop.type === 'Property' && prop.key.type === 'Identifier') {
			properties.push(prop.key.name);
		} else if (prop.type === 'Property' && prop.key.type === 'Literal') {
			properties.push(prop.key.value);
		}
	}

	return properties;
}

export default {
	create(context) {
		const translations = loadTranslations();

		return {
			CallExpression(node) {
				// Check for t() function calls
				if (node.callee.type === 'Identifier' && node.callee.name === 't' && node.arguments.length > 0) {
					const [firstArg, secondArg] = node.arguments;

					// Only validate string literals, not dynamic keys
					if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
						const key = firstArg.value;

						let foundError = false;
						for (const [locale, translationsMap] of translations) {
							if (!translationsMap.has(key)) {
								context.report({
									data: { key, locale },
									messageId: 'invalidKey',
									node: firstArg,
								});
							}
							if (foundError) {
								return;
							}
						}

						// Get the translation string and extract placeholders
						const translationsMap = translations.get('en'); // Use English as default
						const translationString = translationsMap.get(key);
						const requiredPlaceholders = extractPlaceholders(translationString);

						// Check if parameters were provided (second argument to t())
						if (secondArg) {
							// Extract provided parameter names
							const providedParams = extractObjectProperties(secondArg);

							if (providedParams) {
								// Check if translation needs parameters
								if (requiredPlaceholders.length === 0) {
									context.report({
										data: { key },
										messageId: 'noParametersNeeded',
										node: secondArg,
									});
									return;
								}

								// Check for missing parameters
								const missing = requiredPlaceholders.filter(param => !providedParams.includes(param));
								if (missing.length > 0) {
									context.report({
										data: {
											key,
											provided: `[${providedParams.join(', ')}]`,
											required: `[${requiredPlaceholders.join(', ')}]`,
										},
										messageId: 'missingParameters',
										node: secondArg,
									});
								}

								// Check for extra parameters
								const extra = providedParams.filter(param => !requiredPlaceholders.includes(param));
								if (extra.length > 0) {
									context.report({
										data: {
											extra: `[${extra.join(', ')}]`,
											key,
										},
										messageId: 'extraParameters',
										node: secondArg,
									});
								}
							}
						} else if (requiredPlaceholders.length > 0) {
							// Translation requires parameters but none were provided
							context.report({
								data: {
									key,
									provided: '[]',
									required: `[${requiredPlaceholders.join(', ')}]`,
								},
								messageId: 'missingParameters',
								node: firstArg,
							});
						}
					} else if (firstArg.type !== 'Literal') {
						// Warn about dynamic keys that can't be validated
						context.report({
							messageId: 'dynamicKey',
							node: firstArg,
						});
					}
				}
			},
		};
	},
	meta: {
		docs: {
			category: 'Possible Errors',
			description: 'Validate that translation keys exist in translation files',
		},
		messages: {
			dynamicKey:
				'Dynamic translation keys cannot be validated. Consider using a static key or adding a comment with the expected key format',
			extraParameters:
				"Translation key '{{key}}' has extra parameters {{extra}} that are not used in the translation",
			invalidKey: "Translation key '{{key}}' does not exist in {{locale}} translation files",
			missingParameters: "Translation key '{{key}}' requires parameters {{required}} but got {{provided}}",
			noParametersNeeded: "Translation key '{{key}}' does not use parameters but parameters were provided",
		},
		schema: [],
		type: 'problem',
	},
};
