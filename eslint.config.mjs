import nextPlugin from '@next/eslint-plugin-next';
import { includeIgnoreFile } from '@eslint/compat';
import path from 'path';
import { fileURLToPath } from 'url';
import typescript from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default [
  includeIgnoreFile(gitignorePath),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
    },
    plugins: {
      '@next/next': nextPlugin,
      '@typescript-eslint': typescript,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...typescript.configs.recommended.rules,
    },
  },
];
