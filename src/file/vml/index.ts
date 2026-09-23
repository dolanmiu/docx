/**
 * VML (Vector Markup Language) module for WordprocessingML documents.
 *
 * VML is the legacy drawing format that Word still uses for text boxes, watermarks
 * and other objects placed in headers and footers. This module provides typed
 * builders for the VML elements so that higher level features (text boxes,
 * watermarks and future drawing features) can compose them.
 *
 * @module
 */
export * from "./types";
export * from "./vml-values";
export * from "./pict/pict";
export * from "./shape/vml-shape";
export * from "./shape/vml-shape-style";
export * from "./shape-type/vml-shape-type";
export * from "./shape-type/word-art-shape-type";
export * from "./shape-type/picture-frame-shape-type";
export * from "./fill/vml-fill";
export * from "./stroke/vml-stroke";
export * from "./text-path/vml-text-path";
export * from "./image-data/vml-image-data";
export * from "./path/vml-path";
export * from "./formulas/vml-formulas";
export * from "./handles/vml-handles";
export * from "./lock/vml-lock";
