// http://officeopenxml.com/WPparagraph.php
import * as shortid from "shortid";

import { FootnoteReferenceRun } from "file/footnotes/footnote/run/reference-run";
import { IXmlableObject, XmlComponent } from "file/xml-components";

import { File } from "../file";
import { TargetModeType } from "../relationships/relationship/relationship";
import { DeletedTextRun, InsertedTextRun } from "../track-revision";
import { PageBreak } from "./formatting/page-break";
import { Bookmark, ConcreteHyperlink, ExternalHyperlink, InternalHyperlink } from "./links";
import { Math } from "./math";
import { IParagraphPropertiesOptions, ParagraphProperties } from "./properties";
import { PictureRun, Run, SequentialIdentifier, SymbolRun, TextRun } from "./run";

export type ParagraphChild =
    | TextRun
    | PictureRun
    | SymbolRun
    | Bookmark
    | PageBreak
    | SequentialIdentifier
    | FootnoteReferenceRun
    | InternalHyperlink
    | ExternalHyperlink
    | InsertedTextRun
    | DeletedTextRun
    | Math;

export interface IParagraphOptions extends IParagraphPropertiesOptions {
    readonly text?: string;
    readonly children?: ParagraphChild[];
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
            if (element instanceof ExternalHyperlink) {
                const index = this.root.indexOf(element);
                const concreteHyperlink = new ConcreteHyperlink(element.options.child, shortid.generate().toLowerCase());
                file.Document.Relationships.createRelationship(
                    concreteHyperlink.linkId,
                    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
                    element.options.link,
                    TargetModeType.EXTERNAL,
                );
                this.root[index] = concreteHyperlink;
            }
        }

        return super.prepForXml();
    }

    public addRunToFront(run: Run): Paragraph {
        this.root.splice(1, 0, run);
        return this;
    }
}
