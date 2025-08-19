/**
 * JS shim forwarding to the TypeScript module.
 * Keeps compatibility with any .js imports that target utils/templates.
 */
export { default } from './templates.ts';
export * from './templates.ts';
