// HTML from rich-text editors and the clipboard (issue #2632): what TinyMCE, CKEditor 5, Quill, TipTap and Lexical
// write, what Word and Google Docs put on the clipboard, and what Markdown becomes, each in a section of its own after
// a heading that names it. See docs/usage/html.md.

import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { htmlToContent } from "docx/html";

const SOURCES = [
    ["TinyMCE", "tinymce"],
    ["CKEditor 5", "ckeditor5"],
    ["Quill", "quill"],
    ["TipTap", "tiptap"],
    ["Lexical", "lexical"],
    ["Google Docs", "google-docs"],
    ["Word", "word"],
    ["Markdown", "markdown"],
] as const;

const images = { "logo.png": fs.readFileSync("./demo/assets/html/logo.png") };

const doc = new Document({
    sections: SOURCES.map(([name, file]) => ({
        children: [
            new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(`From ${name}`)] }),
            ...htmlToContent(fs.readFileSync(`./demo/assets/html/${file}.html`, "utf8"), { images }),
        ],
    })),
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
