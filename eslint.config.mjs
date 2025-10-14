import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import eslintPluginPrettier from 'eslint-plugin-prettier';
import globals from 'globals';
import html from 'eslint-plugin-html';
import jestDom from 'eslint-plugin-jest-dom';
import jsdoc from 'eslint-plugin-jsdoc';
import prettier from 'eslint-config-prettier';
import react from 'eslint-plugin-react';
import stylistic from '@stylistic/eslint-plugin';
import tseslint from 'typescript-eslint';
import validateTranslationKeys from './eslint-rules/validate-translation-keys.js';

export default defineConfig(
	{
		ignores: ['**/generated/**'],
	},
	eslint.configs.recommended,
	tseslint.configs.recommended,
	prettier,
	jsdoc.configs['flat/recommended-typescript'],
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
			},
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		plugins: {
			'@stylistic': stylistic,
			custom: {
				rules: {
					'validate-translation-keys': validateTranslationKeys,
				},
			},
			html,
			jestDom,
			jsdoc,
			prettier: eslintPluginPrettier,
			react,
		},
		rules: {
			'@stylistic/quotes': ['error', 'single', { allowTemplateLiterals: 'never', avoidEscape: true }],
			'arrow-parens': ['error', 'as-needed'],
			curly: ['error', 'all'],
			'custom/validate-translation-keys': 'error',
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
			'sort-imports': ['error', { ignoreCase: true }],
			'sort-keys': 'error',
		},
	},
	{
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 'latest',
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				project: 'tsconfig.json',
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
			'@typescript-eslint/no-unsafe-member-access': 'error',
		},
	},
);
