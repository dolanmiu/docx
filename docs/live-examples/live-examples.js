/*
 * Live examples for the docs.
 *
 * A code block written as ```ts live, and each demo a page includes from the repository's demo folder, is an example
 * people can change and see: the page runs it with docx, draws the document it makes next to the code with docx-preview,
 * and offers the .docx to download. The code and the pages can each be shown on their own too. Clicking the code turns
 * it into an editor (Monaco) that knows docx's types, and the document is drawn again as the code changes. View turns
 * the editor back into the code, as changed.
 *
 * An example is a whole file, like a demo. It imports what it uses from "docx", from an entry such as "docx/shapes", or
 * from one of the packages in PACKAGES, and can use fs and Buffer as it would in Node, to read files in the demo folder
 * and to write the .docx. The page shows the .docx it writes, or else the last Document it makes, so an example doesn't
 * have to write one.
 *
 * docx is loaded from live-examples/lib, which `npm run build.docs` fills from dist, so the examples use the docx the docs
 * describe rather than the last release.
 */
(() => {
    const MONACO = "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min";
    // jsDelivr builds 3.35.1 against a version of a dependency without the export it needs
    const SUCRASE = "https://cdn.jsdelivr.net/npm/sucrase@3.35.0/+esm";
    const DOCX_PREVIEW = "https://cdn.jsdelivr.net/npm/docx-preview@0.4.1/+esm";
    // Where fs.readFileSync("./demo/assets/images/pizza.gif") reads from
    const REPOSITORY = "https://raw.githubusercontent.com/dolanmiu/docx/master/";
    const LIB = "live-examples/lib/";

    // The modules an example can import, with the file in LIB that defines each one and the global it defines
    const MODULES = {
        docx: { file: "index", global: "docx" },
        "docx/shapes": { file: "shapes", global: "docxShapes" },
        "docx/watermarks": { file: "watermarks", global: "docxWatermarks" },
        "docx/charts": { file: "charts", global: "docxCharts" },
        "docx/math": { file: "math", global: "docxMath" },
        "docx/layout": { file: "layout", global: "docxLayout" },
    };

    // Packages from npm an example can import too, from jsDelivr at the version the docs are written for: where each is, and
    // its types, by the path the editor finds them at in node_modules and where they are in the package
    const PACKAGES = {
        "@chenglou/pretext": {
            root: "https://cdn.jsdelivr.net/npm/@chenglou/pretext@0.0.9/",
            types: { "index.d.ts": "dist/layout.d.ts", "analysis.d.ts": "dist/analysis.d.ts" },
        },
    };

    // docx-preview draws these as empty space
    const NOT_DRAWN = { "docx/shapes": "shapes", "docx/charts": "charts", "docx/watermarks": "watermarks" };

    // The editor's types for what docx's types use from Node, and for the parts of Node an example can use
    const NODE_TYPES = `
declare class Buffer extends Uint8Array {
    static from(data: string | ArrayBuffer | ArrayLike<number>, encoding?: "base64" | "utf8" | "utf-8"): Buffer;
    toString(encoding?: "base64" | "utf8" | "utf-8"): string;
}
declare module "fs" {
    export function readFileSync(path: string): Buffer;
    export function readFileSync(path: string, encoding: "base64" | "utf8" | "utf-8" | { encoding: "base64" | "utf8" | "utf-8" }): string;
    export function writeFileSync(path: string, data: string | Uint8Array, encoding?: "base64" | "utf8" | "utf-8"): void;
    export function createWriteStream(path: string): object;
}
declare module "stream" {
    export class Stream {
        pipe<T>(destination: T): T;
    }
}
`;

    const PREVIEW_OPTIONS = {
        className: "docx",
        inWrapper: true,
        // A page is as tall as what's on it, so a short example isn't a mostly empty A4 page
        ignoreHeight: true,
        ignoreLastRenderedPageBreak: true,
        experimental: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
        renderComments: true,
        renderChanges: true,
        // Blob URLs would have to be revoked each time the document is drawn again
        useBase64URL: true,
    };

    // The pages are drawn in a shadow root, so the docs' styles for paragraphs and tables don't change them
    const PREVIEW_STYLE = `
:host { all: initial; display: block; position: relative; }
.docx-wrapper { background: transparent !important; padding: 16px !important; }
.docx-wrapper > section.docx { margin-bottom: 16px !important; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25) !important; }
.pages.drawing { visibility: hidden; position: absolute; inset: 0 auto auto 0; width: 100%; }
`;

    /** Runs `load` the first time it's needed, and again after it fails */
    const once = (load) => {
        let promise;
        return () =>
            (promise ??= load().catch((error) => {
                promise = undefined;
                throw error;
            }));
    };

    const loadScript = (src) =>
        new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Couldn't load ${src}`));
            document.head.appendChild(script);
        });

    const loadSucrase = once(() => import(SUCRASE));
    const loadDocxPreview = once(() => import(DOCX_PREVIEW));
    const loadDocx = once(() => loadScript(`${LIB}index.iife.js`));
    // docx's entries, such as docx/shapes, use the docx global, so they're loaded after it
    const entryLoaders = Object.fromEntries(
        Object.entries(MODULES)
            .filter(([name]) => name !== "docx")
            .map(([name, { file }]) => [name, once(() => loadDocx().then(() => loadScript(`${LIB}${file}.iife.js`)))]),
    );
    const loadModule = (name) => (name === "docx" ? loadDocx() : entryLoaders[name]());
    const packageLoaders = Object.fromEntries(
        Object.entries(PACKAGES).map(([name, { root }]) => [name, once(() => import(`${root}+esm`))]),
    );

    const importsOf = (source) => [...source.matchAll(/from\s+["']([^"']+)["']/g)].map(([, name]) => name);

    /** A file's bytes, which turn into text as a Node Buffer's do, since some examples use them that way */
    class FileBuffer extends Uint8Array {
        toString(encoding) {
            if (encoding !== "base64") {
                return new TextDecoder().decode(this);
            }
            let binary = "";
            for (let start = 0; start < this.length; start += 0x8000) {
                binary += String.fromCharCode(...this.subarray(start, start + 0x8000));
            }
            return btoa(binary);
        }
    }

    /** Node's Buffer.from, for the encodings examples use */
    const bytesOf = (data, encoding) => {
        if (typeof data !== "string") {
            return new FileBuffer(data);
        }
        if (encoding === "base64") {
            return new FileBuffer(Array.from(atob(data), (character) => character.charCodeAt(0)));
        }
        return new FileBuffer(new TextEncoder().encode(data));
    };

    // Examples read files in the demo folder as the demos do, with or without "./" in front
    const repositoryPath = (path) => path.replace(/^\.\//, "");
    const repositoryFiles = new Map();
    /** Reads the files in the repository's demo folder that the example names, so fs.readFileSync has them straight away */
    const readRepositoryFiles = async (source) => {
        const paths = [...source.matchAll(/["'](?:\.\/)?(demo\/[^"'\s]+\.\w+)["']/g)].map(([, path]) => path);
        for (const path of paths) {
            if (!repositoryFiles.has(path)) {
                repositoryFiles.set(
                    path,
                    fetch(REPOSITORY + path).then(async (response) => {
                        if (!response.ok) {
                            repositoryFiles.delete(path);
                            throw new Error(`Couldn't read ${path}`);
                        }
                        return new Uint8Array(await response.arrayBuffer());
                    }),
                );
            }
        }
        return new Map(await Promise.all(paths.map(async (path) => [path, await repositoryFiles.get(path)])));
    };

    const AsyncFunction = (async () => {}).constructor;

    /** Runs an example, and returns the .docx it makes: the one it writes with fs.writeFileSync, or else its last Document */
    const make = async (source) => {
        const imports = importsOf(source).filter((name) => name in MODULES);
        const packageNames = importsOf(source).filter((name) => name in PACKAGES);
        const [{ transform }, files, packages] = await Promise.all([
            loadSucrase(),
            readRepositoryFiles(source),
            Promise.all(packageNames.map(async (name) => [name, await packageLoaders[name]()])).then((loaded) => new Map(loaded)),
            loadDocx(),
            ...imports.map(loadModule),
        ]);
        const { code } = transform(source, { transforms: ["typescript", "imports"] });

        const docx = window.docx;
        let lastDocument;
        let written;
        // What the example starts without waiting for, such as Packer.toBuffer(doc).then(...), which may write its file
        const started = [];
        const track = (promise) => {
            started.push(promise);
            return promise;
        };

        class Document extends docx.Document {
            constructor(...args) {
                super(...args);
                lastDocument = this;
            }
        }
        class Packer extends docx.Packer {
            // Browsers don't have Node's Buffer
            static toBuffer(...args) {
                return track(docx.Packer.toArrayBuffer(...args).then((buffer) => new FileBuffer(buffer)));
            }
            // Nor its streams, so what's shown is the Document rather than what the stream writes
            static toStream() {
                return { pipe: (destination) => destination };
            }
        }
        const patchDocument = (options) =>
            track(docx.patchDocument({ ...options, outputType: options.outputType === "nodebuffer" ? "uint8array" : options.outputType }));
        const fs = {
            readFileSync: (path, options) => {
                const bytes = files.get(repositoryPath(path));
                if (!bytes) {
                    throw new Error(`Examples can only read files in the repository's demo folder, such as ./demo/assets/images/pizza.gif`);
                }
                const encoding = typeof options === "string" ? options : options?.encoding;
                return encoding ? new FileBuffer(bytes).toString(encoding) : new FileBuffer(bytes);
            },
            writeFileSync: (path, data, encoding) => {
                if (/\.docx$/i.test(path)) {
                    written = bytesOf(data, encoding);
                }
            },
            createWriteStream: () => ({}),
        };
        const require = (name) => {
            if (name === "docx") {
                return { ...docx, Document, File: Document, Packer, patchDocument };
            }
            if (name === "fs") {
                return fs;
            }
            if (name in MODULES) {
                return window[MODULES[name].global];
            }
            if (packages.has(name)) {
                return packages.get(name);
            }
            throw new Error(
                `Examples can import docx, its entries such as docx/shapes, fs, and ${Object.keys(PACKAGES).join(", ")}, but not ${name}`,
            );
        };

        await new AsyncFunction("require", "exports", "module", "Buffer", code)(require, {}, { exports: {} }, { from: bytesOf });
        const results = await Promise.allSettled(started);
        // The example's own .then(...) callbacks, which write the file, run before this
        await new Promise((resolve) => setTimeout(resolve));

        if (written) {
            return new Blob([written]);
        }
        const failure = results.find((result) => result.status === "rejected");
        if (failure) {
            throw failure.reason;
        }
        if (lastDocument) {
            return docx.Packer.toBlob(lastDocument);
        }
        throw new Error("Make a new Document(...) to see it here");
    };

    const loadMonaco = once(async () => {
        // The editor's workers come from the CDN too, which a worker can only load through a script of the page's own
        window.MonacoEnvironment = {
            getWorkerUrl: () =>
                `data:text/javascript;charset=utf-8,${encodeURIComponent(
                    `self.MonacoEnvironment = { baseUrl: "${MONACO}/" }; importScripts("${MONACO}/vs/base/worker/workerMain.js");`,
                )}`,
        };
        await loadScript(`${MONACO}/vs/loader.js`);
        window.require.config({ paths: { vs: `${MONACO}/vs` } });
        await new Promise((resolve, reject) => window.require(["vs/editor/editor.main"], resolve, reject));

        const { typescript } = window.monaco.languages;
        typescript.typescriptDefaults.setCompilerOptions({
            target: typescript.ScriptTarget.ES2020,
            module: typescript.ModuleKind.ESNext,
            moduleResolution: typescript.ModuleResolutionKind.NodeJs,
            strict: true,
            allowNonTsExtensions: true,
            // Each example is its own module, even one without imports, so two can both have a const doc
            moduleDetection: 3,
        });
        // "docx" and "docx/shapes" resolve to these as they would in node_modules
        const types = await Promise.all(
            Object.values(MODULES).map(async ({ file }) => [file, await fetch(`${LIB}${file}.d.ts`).then((response) => response.text())]),
        );
        for (const [file, text] of types) {
            typescript.typescriptDefaults.addExtraLib(text, `file:///node_modules/docx/${file}.d.ts`);
        }
        typescript.typescriptDefaults.addExtraLib(NODE_TYPES, "file:///node-types.d.ts");
        const packageTypes = await Promise.all(
            Object.entries(PACKAGES).flatMap(([name, { root, types: files }]) =>
                Object.entries(files).map(async ([file, path]) => [
                    `file:///node_modules/${name}/${file}`,
                    await fetch(`${root}${path}`).then((response) => response.text()),
                ]),
            ),
        );
        for (const [path, text] of packageTypes) {
            typescript.typescriptDefaults.addExtraLib(text, path);
        }

        themeEditors();
        new MutationObserver(themeEditors).observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
        return window.monaco;
    });

    /** Gives the editors the docs theme's code colours, and follows it between light and dark */
    const themeEditors = () => {
        const style = document.documentElement.style;
        const dark = style.getPropertyValue("color-scheme") === "dark";
        const background = style.getPropertyValue("--codeBackgroundColor").trim();
        window.monaco.editor.defineTheme("docs", {
            base: dark ? "vs-dark" : "vs",
            inherit: true,
            rules: [],
            colors: /^#[0-9a-f]{6}$/i.test(background) ? { "editor.background": background } : {},
        });
        window.monaco.editor.setTheme("docs");
    };

    // The examples on the page that's open, dropped when another page is opened
    let examples = [];
    let modelCount = 0;

    const button = (text, onClick) => {
        const element = document.createElement("button");
        element.type = "button";
        element.textContent = text;
        element.addEventListener("click", onClick);
        return element;
    };

    /** Where in the code a click landed, as a character offset, so the editor can put its cursor there */
    const offsetAt = (code, event) => {
        const caret = document.caretPositionFromPoint?.(event.clientX, event.clientY);
        const range = caret ? { node: caret.offsetNode, offset: caret.offset } : undefined;
        const fallback = document.caretRangeFromPoint?.(event.clientX, event.clientY);
        const { node, offset } = range ?? (fallback ? { node: fallback.startContainer, offset: fallback.startOffset } : {});
        if (!node || !code.contains(node)) {
            return 0;
        }
        const before = document.createRange();
        before.setStart(code, 0);
        before.setEnd(node, offset);
        return before.toString().length;
    };

    // What an example shows: the code and pages side by side, or one of them
    const VIEWS = { split: "Split", code: "Code", preview: "Preview" };

    const createExample = (element) => {
        const original = decodeURIComponent(element.dataset.source);
        const pre = element.querySelector("pre");
        pre.classList.add("live-example__code");
        const status = document.createElement("span");
        status.className = "live-example__status";
        const preview = document.createElement("div");
        preview.className = "live-example__preview";
        const root = preview.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = PREVIEW_STYLE;
        root.appendChild(style);

        const example = { element, editor: undefined, model: undefined, editing: false, blob: undefined, runs: 0, observers: [] };

        const edit = button("Edit", () => (example.editing ? stopEditing() : startEditing(0)));
        const reset = button("Reset", () => {
            example.model.setValue(original);
            reset.hidden = true;
        });
        reset.hidden = true;
        const download = button("Download .docx", () => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(example.blob);
            link.download = "example.docx";
            link.click();
            // Some browsers start the download after click() returns
            setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
        });
        download.disabled = true;

        const views = document.createElement("div");
        views.className = "live-example__views";
        views.setAttribute("role", "group");
        views.setAttribute("aria-label", "View");
        const show = (view) => {
            element.dataset.view = view;
            for (const viewButton of views.children) {
                viewButton.setAttribute("aria-pressed", String(viewButton.dataset.view === view));
            }
            // There's no code to edit in the preview
            edit.hidden = view === "preview";
        };
        for (const [view, label] of Object.entries(VIEWS)) {
            const viewButton = button(label, () => show(view));
            viewButton.dataset.view = view;
            views.appendChild(viewButton);
        }

        const bar = document.createElement("div");
        bar.className = "live-example__bar";
        bar.append(views, status, edit, reset, download);
        const panes = document.createElement("div");
        panes.className = "live-example__panes";
        panes.append(pre, preview);
        element.append(bar, panes);
        show("split");

        const setStatus = (text, error = false) => {
            status.textContent = text;
            status.classList.toggle("live-example__status--error", error);
        };

        /** Scales the pages down to fit, so a whole page is seen without scrolling sideways */
        const fit = () => {
            const wrapper = root.querySelector(".pages:not(.drawing) > .docx-wrapper");
            // The pages aren't in sight in the code view
            if (!wrapper || preview.clientWidth === 0) {
                return;
            }
            wrapper.style.zoom = "";
            const widest = Math.max(...[...wrapper.children].map((page) => page.offsetWidth));
            wrapper.style.zoom = String(Math.min(1, preview.clientWidth / (widest + 32)));
        };

        const draw = async (source) => {
            const runNumber = ++example.runs;
            try {
                const blob = await make(source);
                const { renderAsync } = await loadDocxPreview();
                if (runNumber !== example.runs) {
                    return;
                }
                // Drawn out of sight first, so the pages being replaced stay until the new ones are ready
                const pages = document.createElement("div");
                pages.className = "pages drawing";
                root.appendChild(pages);
                await renderAsync(blob, pages, pages, PREVIEW_OPTIONS);
                if (runNumber !== example.runs) {
                    pages.remove();
                    return;
                }
                root.querySelectorAll(".pages:not(.drawing)").forEach((old) => old.remove());
                pages.classList.remove("drawing");
                fit();
                example.blob = blob;
                download.disabled = false;
                preview.classList.remove("live-example__preview--stale");
                const notDrawn = importsOf(source)
                    .filter((name) => name in NOT_DRAWN)
                    .map((name) => NOT_DRAWN[name]);
                setStatus(
                    notDrawn.length > 0 ? `The preview can't draw ${notDrawn.join(" or ")}. Download the file to see them in Word.` : "",
                );
            } catch (error) {
                if (runNumber === example.runs) {
                    preview.classList.add("live-example__preview--stale");
                    setStatus(error instanceof Error ? error.message : String(error), true);
                }
            }
        };

        // The code the block shows, which is the editor's when the editor is closed
        let shown = original;
        const showCode = (source) => {
            if (source === shown) {
                return;
            }
            shown = source;
            const code = pre.querySelector("code");
            const grammar = window.Prism?.languages.ts;
            if (grammar) {
                code.innerHTML = window.Prism.highlight(source, grammar, "ts");
            } else {
                code.textContent = source;
            }
        };

        const setEditing = (editing) => {
            example.editing = editing;
            edit.textContent = editing ? "View" : "Edit";
        };

        const stopEditing = () => {
            showCode(example.model.getValue());
            example.editor.getContainerDomNode().replaceWith(pre);
            setEditing(false);
        };

        const startEditing = async (offset) => {
            // The editor is still loading
            if (edit.disabled) {
                return;
            }
            if (example.editor) {
                if (!example.editing) {
                    pre.replaceWith(example.editor.getContainerDomNode());
                    setEditing(true);
                    example.editor.setPosition(example.model.getPositionAt(offset));
                }
                example.editor.focus();
                return;
            }
            edit.disabled = true;
            setStatus("Loading the editor…");
            try {
                const monaco = await loadMonaco();
                if (!examples.includes(example)) {
                    return;
                }
                // The editor's text is where the code's was, so nothing moves when it opens
                const code = pre.querySelector("code");
                const style = getComputedStyle(code);
                const text = {
                    lineDecorationsWidth:
                        code.getBoundingClientRect().left - pre.getBoundingClientRect().left + parseFloat(style.paddingLeft),
                    padding: { top: parseFloat(style.paddingTop), bottom: parseFloat(style.paddingBottom) },
                    fontFamily: style.fontFamily,
                    fontSize: parseFloat(style.fontSize),
                    lineHeight: parseFloat(style.lineHeight) || undefined,
                };
                const container = document.createElement("div");
                container.className = "live-example__code live-example__editor";
                container.style.height = `${pre.offsetHeight}px`;
                pre.replaceWith(container);

                example.model = monaco.editor.createModel(original, "typescript", monaco.Uri.parse(`file:///example-${++modelCount}.ts`));
                example.editor = monaco.editor.create(container, {
                    model: example.model,
                    automaticLayout: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    // The page scrolls when the wheel is used over the editor, as it does over the code before it's edited
                    scrollbar: { alwaysConsumeMouseWheel: false },
                    overviewRulerLanes: 0,
                    lineNumbers: "off",
                    folding: false,
                    glyphMargin: false,
                    ...text,
                    tabSize: 4,
                    fixedOverflowWidgets: true,
                });
                const grow = () => {
                    container.style.height = `${example.editor.getContentHeight()}px`;
                };
                example.editor.onDidContentSizeChange(grow);
                grow();

                let timer;
                example.model.onDidChangeContent(() => {
                    reset.hidden = example.model.getValue() === original;
                    // Reset changes the code while the editor is closed
                    if (!example.editing) {
                        showCode(example.model.getValue());
                    }
                    clearTimeout(timer);
                    timer = setTimeout(() => draw(example.model.getValue()), 300);
                });

                edit.disabled = false;
                setEditing(true);
                setStatus("");
                example.editor.setPosition(example.model.getPositionAt(offset));
                example.editor.focus();
            } catch (error) {
                edit.disabled = false;
                setStatus(error instanceof Error ? error.message : String(error), true);
            }
        };

        pre.tabIndex = 0;
        pre.title = "Click to edit";
        pre.addEventListener("click", (event) => {
            // The copy button in the code block copies it
            if (event.target.closest("button") || window.getSelection()?.toString()) {
                return;
            }
            startEditing(offsetAt(pre.querySelector("code"), event));
        });
        pre.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && event.target === pre) {
                event.preventDefault();
                startEditing(0);
            }
        });

        // docx and docx-preview are only loaded once an example is about to be seen
        const visible = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    visible.disconnect();
                    setStatus("Drawing…");
                    draw(original);
                }
            },
            { rootMargin: "200px" },
        );
        visible.observe(element);
        const resized = new ResizeObserver(fit);
        resized.observe(preview);
        example.observers.push(visible, resized);
        return example;
    };

    const dispose = (example) => {
        example.runs++;
        example.observers.forEach((observer) => observer.disconnect());
        example.editor?.dispose();
        example.model?.dispose();
    };

    window.$docsify = window.$docsify || {};
    const markdownOptions = (window.$docsify.markdown = window.$docsify.markdown || {});
    markdownOptions.renderer = markdownOptions.renderer || {};
    const renderCode = markdownOptions.renderer.code;
    markdownOptions.renderer.code = function (code, lang) {
        if (/^ts\s+live$/.test(lang ?? "")) {
            // docsify writes backticks in code as @DOCSIFY_QM@ until it's highlighted
            const source = code.replace(/@DOCSIFY_QM@/g, "`");
            return `<div class="live-example" data-source="${encodeURIComponent(source)}">${this.origin.code.call(this, code, "ts")}</div>`;
        }
        return (renderCode ?? this.origin.code).apply(this, arguments);
    };

    // A demo a page includes, as in [Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/tables/basic-table.ts ":include")
    const DEMO_INCLUDE =
        /\[[^\]]*\]\((https:\/\/raw\.githubusercontent\.com\/dolanmiu\/docx\/master\/demo\/[^\s)]+\.ts) ":include[^"]*"\)/g;

    /** Writes the demos a page includes into it as live examples */
    const includeDemos = async (markdown) => {
        const urls = [...new Set([...markdown.matchAll(DEMO_INCLUDE)].map(([, url]) => url))];
        const sources = new Map(
            await Promise.all(
                urls.map(async (url) => {
                    const response = await fetch(url).catch(() => undefined);
                    return [url, response?.ok ? await response.text() : undefined];
                }),
            ),
        );
        // A demo that can't be fetched is left for docsify to include as code
        return markdown.replace(DEMO_INCLUDE, (link, url) =>
            sources.get(url) === undefined ? link : `\`\`\`ts live\n${sources.get(url).trimEnd()}\n\`\`\``,
        );
    };

    window.$docsify.plugins = [
        (hook) => {
            hook.beforeEach((markdown, next) => {
                includeDemos(markdown).then(next, () => next(markdown));
            });
            hook.doneEach(() => {
                examples.forEach(dispose);
                examples = [...document.querySelectorAll(".markdown-section .live-example")].map(createExample);
            });
        },
        ...(window.$docsify.plugins || []),
    ];
})();
