/**
 * File components module for WordprocessingML documents.
 *
 * This module exports all the building blocks needed to create DOCX documents,
 * including paragraphs, tables, styles, numbering, headers/footers, and more.
 *
 * The main `File` class (exported as `Document` from the root) coordinates all
 * these components to produce a complete OOXML document.
 *
 * @module
 */

export * from "./paragraph";
export * from "./table";
export * from "./file";
export * from "./file-child";
export * from "./numbering";
export * from "./media";
export * from "./drawing";
export * from "./document";
export * from "./shading";
export * from "./styles";
export * from "./table-of-contents";
export * from "./xml-components";
export * from "./header-wrapper";
export * from "./footer-wrapper";
export * from "./header";
export * from "./footnotes";
export * from "./endnotes";
export * from "./track-revision";
export * from "./shared";
export * from "./border";
export * from "./vertical-align";
export * from "./checkbox";
export * from "./fonts";
export * from "./textbox";
export { type IPropertiesOptions } from "./core-properties";
