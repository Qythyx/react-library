import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import globals from 'globals';
import jestDom from 'eslint-plugin-jest-dom';
import jsdoc from 'eslint-plugin-jsdoc';
import perfectionist from 'eslint-plugin-perfectionist';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';

import validateTranslationKeys from './eslint-rules/validate-translation-keys.js';

const isFixMode = process.argv.includes('--fix');

export default defineConfig(
	{
		ignores: ['**/generated/**', 'jest.config.ts'],
	},
	eslint.configs.recommended,
	tseslint.configs.recommended,
	prettier,
	jsdoc.configs['flat/recommended-typescript'],
	perfectionist.configs['recommended-alphabetical'],
	{
		ignores: ['**/dist/**', '**/node_modules/**'],
	},
	{
		files: ['**/*.{js,mjs,ts,jsx,tsx}'],
		...eslint.configs.all,
		...react.configs.flat.all,
		...jestDom.configs.recommended,
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				ecmaFeatures: { jsx: true },
				tsconfigRootDir: import.meta.dirname,
			},
		},
		plugins: {
			'@stylistic': stylistic,
			custom: {
				rules: {
					'validate-translation-keys': validateTranslationKeys,
				},
			},
			jestDom,
			jsdoc,
			prettier: eslintPluginPrettier,
			react,
		},
		rules: {
			'@stylistic/quotes': ['error', 'single', { allowTemplateLiterals: 'never', avoidEscape: true }],
			'arrow-parens': ['error', 'as-needed'],
			curly: ['error', 'all'],
			'custom/validate-translation-keys': isFixMode ? 'off' : 'error',
			'jsdoc/require-jsdoc': [
				'off', // turn this on later
				{
					contexts: [
						'ExportNamedDeclaration > FunctionDeclaration',
						'TSInterfaceDeclaration',
						'TSMethodSignature',
						'TSPropertySignature',
					],
					enableFixer: false,
					publicOnly: true,
				},
			],
			'jsdoc/require-param': ['warn', { checkDestructuredRoots: false, enableRootFixer: false }],
			'object-shorthand': ['error', 'always'],
			'perfectionist/sort-imports': ['error', { sortBy: 'specifier' }],
			'prefer-destructuring': [
				'warn',
				{
					array: true,
					object: true,
				},
				{
					enforceForRenamedProperties: false,
				},
			],
			'prettier/prettier': 'error',
		},
	},
	{
		files: ['**/*.{ts,tsx}'],
		ignores: ['**/*.test.{ts,tsx}', '**/test-utils/**'],
		languageOptions: {
			ecmaVersion: 'latest',
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				project: 'tsconfig.json',
				tsconfigRootDir: import.meta.dirname,
			},
			sourceType: 'module',
		},
		rules: {
			'@typescript-eslint/explicit-function-return-type': 'error',
			'@typescript-eslint/member-ordering': [
				'error',
				{
					default: {
						memberTypes: ['signature', 'field', 'method'],
						order: 'alphabetically',
					},
				},
			],
			'@typescript-eslint/no-explicit-any': 'error',
			'@typescript-eslint/no-unnecessary-condition': 'warn',
			'@typescript-eslint/no-unsafe-member-access': 'error',
		},
	},
	{
		files: ['**/*.test.{ts,tsx}', '**/test-utils/**/*.{ts,tsx}', 'jest.setup.js'],
		languageOptions: {
			ecmaVersion: 'latest',
			globals: {
				...globals.browser,
				...globals.node,
				...globals.jest,
			},
			parserOptions: {
				project: 'tsconfig.json',
				tsconfigRootDir: import.meta.dirname,
			},
			sourceType: 'module',
		},
	},
	// Also lint config, test, and dev files outside of src
	...tseslint.configs.recommendedTypeChecked.map(config => ({
		...config,
		files: ['*.ts', 'dev/*.{ts,tsx}'],
		languageOptions: {
			...config.languageOptions,
			parserOptions: {
				...config.languageOptions?.parserOptions,
				project: './tsconfig.dev.json',
			},
		},
	})),
);
