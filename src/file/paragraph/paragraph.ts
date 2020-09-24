// http://officeopenxml.com/WPparagraph.php
import { FootnoteReferenceRun } from "file/footnotes/footnote/run/reference-run";
import { IXmlableObject, XmlComponent } from "file/xml-components";

import { File } from "../file";
import { InsertedTextRun, DeletedTextRun } from "../track-revision";
import { PageBreak } from "./formatting/page-break";
import { Bookmark, HyperlinkRef } from "./links";
import { IParagraphPropertiesOptions, ParagraphProperties } from "./properties";
import { PictureRun, Run, SequentialIdentifier, SymbolRun, TextRun } from "./run";

export interface IParagraphOptions extends IParagraphPropertiesOptions {
    readonly text?: string;
    readonly children?: (
        | TextRun
        | PictureRun
        | SymbolRun
        | Bookmark
        | PageBreak
        | SequentialIdentifier
        | FootnoteReferenceRun
        | HyperlinkRef
        | InsertedTextRun
        | DeletedTextRun
    )[];
}

export class Paragraph extends XmlComponent {
    private readonly properties: ParagraphProperties;

    constructor(options: string | PictureRun | IParagraphOptions) {
        super("w:p");

        if (typeof options === "string") {
            this.properties = new ParagraphProperties({});
            this.root.push(this.properties);
            this.root.push(new TextRun(options));
            return;
        }

        if (options instanceof PictureRun) {
            this.properties = new ParagraphProperties({});
            this.root.push(this.properties);
            this.root.push(options);
            return;
        }

        this.properties = new ParagraphProperties(options);

        this.root.push(this.properties);

        if (options.text) {
            this.root.push(new TextRun(options.text));
        }

        if (options.children) {
            for (const child of options.children) {
                if (child instanceof Bookmark) {
                    this.root.push(child.start);
                    this.root.push(child.text);
                    this.root.push(child.end);
                    continue;
                }

                this.root.push(child);
            }
        }
    }

    public prepForXml(file: File): IXmlableObject | undefined {
        for (const element of this.root) {
            if (element instanceof HyperlinkRef) {
                const index = this.root.indexOf(element);
                this.root[index] = file.HyperlinkCache[element.id];
            }
        }

        return super.prepForXml();
    }

    public addRunToFront(run: Run): Paragraph {
        this.root.splice(1, 0, run);
        return this;
    }
}
