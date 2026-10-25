/**
 * Utility functions and types for the docx library.
 *
 * This module re-exports all utility functions, type definitions, and validators
 * used throughout the library for unit conversion, ID generation, and value validation.
 *
 * @module
 */
export * from "./convenience-functions";
export * from "./values";
export type * from "./output-type";
export type * from "./xml/types";
// For docx's optional entries, such as docx/theme, which read the files they're given as docx reads templates
export * from "./xml/parse";
export { unzipFiles } from "./zip";
