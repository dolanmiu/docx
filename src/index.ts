// Internally, the wrapper is a 'File', but export to the end user as a 'Document'
// Use of 'File' also works
export { File as Document } from "./file";
export * from "./file";
export * from "./export";
export * from "./import-dotx";
export * from "./util";
