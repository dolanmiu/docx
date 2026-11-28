// The files specs read with Vite, as node:fs can't read files in the browser polyfills the specs run with. Vite gives a
// file imported with ?raw as text, and one imported with ?inline, such as a Word document or an image, as a data URL.
// Only these two are declared, rather than Vite's own types (vite/client), which would also type imports of images and
// other assets everywhere in src, where docx's own code mustn't use them.

declare module "*?raw" {
    const text: string;
    // eslint-disable-next-line import-x/no-default-export -- Vite gives the file as the module's default export
    export default text;
}

declare module "*?inline" {
    const dataUrl: string;
    // eslint-disable-next-line import-x/no-default-export -- Vite gives the file as the module's default export
    export default dataUrl;
}
