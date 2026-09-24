/**
 * VML (Vector Markup Language) module for WordprocessingML documents.
 *
 * VML is the legacy drawing format that Word still uses for text boxes, watermarks
 * and other objects placed in headers and footers. This module provides typed
 * builders for the VML elements that text boxes use. docx/watermarks has the
 * builders only watermarks use, such as WordArt text paths and image data.
 *
 * @module
 */
export * from "./types";
export * from "./vml-values";
export * from "./pict/pict";
export * from "./shape/vml-shape";
export * from "./shape/vml-shape-style";
