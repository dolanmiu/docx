// Public input types include Node's Buffer and streams.
/// <reference types="node" preserve="true" />

// Keep the document model and patchers independent of the platform packer.
export { File as Document } from "./file";
export * from "./file";
export * from "./util";
export * from "./patcher";
