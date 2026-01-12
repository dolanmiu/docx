<p align="center">
    <img src="./logo/logo-animate.svg" width="100%" height="300" alt="docx logo">
</p>

<p align="center">
    Easily generate and modify .docx files with JS/TS. Works for Node and on the Browser.
</p>

<p align="center">
    A modern fork of <a href="https://github.com/dolanmiu/docx">docxjs</a>
</p>

---

## Installation

```bash
npm install --save @ddloop/docx
pnpm install @ddloop/docx
bun install @ddloop/docx

```

## Quick Start

```typescript
import { Document, Packer, Paragraph, TextRun } from "@ddloop/docx";
import * as fs from "fs";

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                children: [
                    new TextRun("Hello World"),
                    new TextRun({
                        text: "Foo Bar",
                        bold: true,
                    }),
                ],
            }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
```

# Demo

## Browser

Here are examples of `docx` being used with basic `HTML/JS` in a browser environment:

-   https://codepen.io/dolanmiu/pen/RwNeObg
-   https://jsfiddle.net/dolanmiu/onadx1gu/

Here are examples of `docx` working in `Angular`:

-   https://stackblitz.com/edit/angular-docx
-   https://stackblitz.com/edit/angular-wmd6k3

Here are examples of `docx` working in `React`:

-   https://stackblitz.com/edit/react-docx
-   https://stackblitz.com/edit/react-docx-images (adding images to Word Document)

Here is an example of `docx` working in `Vue.js`:

-   https://stackblitz.com/edit/vuejs-docx

## Node

More [here](https://github.com/dolanmiu/docx/tree/master/demo)

# Documentation

Comprehensive documentation is available at [docx.js.org](https://docx.js.org/), including:

- [Getting Started](https://docx.js.org/docs) - Installation and basic usage
- [Usage Guides](https://docx.js.org/docs/usage/document) - Detailed guides for all features
- [Exporting](https://docx.js.org/docs/exporting/packers) - How to generate .docx files
- [Modifying Documents](https://docx.js.org/docs/modifying-existing-documents/patcher) - Working with existing files
- [API Reference](https://docx.js.org/docs/utility/convenience-functions) - Utility functions and helpers

# Playground

Experience `docx` in action through [Docx.js Editor](https://docxjs-editor.vercel.app/), an interactive playground where you can code and preview the results in real-time.

# Examples

Check the [demo folder](https://github.com/dolanmiu/docx/tree/master/demo) for examples.

# Contributing

Read the [contribution guidelines](https://docx.js.org/docs/contribution-guidelines) to get started.

## License

MIT
