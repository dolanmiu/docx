import { fillPartPageNumbers } from "@file/document/body/page-numbers";
import { type IContext, type IXmlableObject, XmlComponent } from "@file/xml-components";

import { EndnotesAttributes } from "./endnotes-attributes";
import { LineRuleType, Paragraph } from "../paragraph";
import { Endnote, EndnoteType } from "./endnote/endnote";
import { ContinuationSeperatorRun } from "../footnotes/footnote/run/continuation-seperator-run";
import type { NoteContent } from "../footnotes/footnote/run/reference-run";
import { SeperatorRun } from "../footnotes/footnote/run/seperator-run";

export class Endnotes extends XmlComponent {
    // The endnotes that reference runs bring with them, by their runs, with the ids they are given
    private readonly ownNotes = new Map<object, number>();
    // The highest id of the endnotes, so the one after it is free
    // eslint-disable-next-line functional/prefer-readonly-type
    private highestId = 0;

    public constructor() {
        super("w:endnotes");

        this.root.push(
            new EndnotesAttributes({
                wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
                mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
                o: "urn:schemas-microsoft-com:office:office",
                r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
                v: "urn:schemas-microsoft-com:vml",
                wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                w10: "urn:schemas-microsoft-com:office:word",
                w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                w14: "http://schemas.microsoft.com/office/word/2010/wordml",
                w15: "http://schemas.microsoft.com/office/word/2012/wordml",
                wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
                wne: "http://schemas.microsoft.com/office/word/2006/wordml",
                wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                Ignorable: "w14 w15 wp14",
            }),
        );

        const begin = new Endnote({
            id: -1,
            type: EndnoteType.SEPARATOR,
            children: [
                new Paragraph({
                    spacing: {
                        after: 0,
                        line: 240,
                        lineRule: LineRuleType.AUTO,
                    },
                    children: [new SeperatorRun()],
                }),
            ],
        });

        this.root.push(begin);

        const spacing = new Endnote({
            id: 0,
            type: EndnoteType.CONTINUATION_SEPARATOR,
            children: [
                new Paragraph({
                    spacing: {
                        after: 0,
                        line: 240,
                        lineRule: LineRuleType.AUTO,
                    },
                    children: [new ContinuationSeperatorRun()],
                }),
            ],
        });

        this.root.push(spacing);
    }

    public createEndnote(id: number, paragraph: readonly Paragraph[]): void {
        const endnote = new Endnote({
            id: id,
            children: paragraph,
        });

        this.root.push(endnote);
        if (Number.isFinite(id)) {
            // eslint-disable-next-line functional/immutable-data
            this.highestId = Math.max(this.highestId, Math.floor(id));
        }
    }

    /**
     * The id of the endnote that a reference run brings with it, which is added to the endnotes the first time the run
     * is written, with an id no other endnote has. Word has endnotes only in a document's body, so a run written
     * anywhere else, such as in a header, has none, and its endnote isn't added.
     *
     * @internal
     * @param reference - The run, which has the same endnote each time it is written
     * @param endnote - The endnote's content
     * @param context - The context the run is written in
     * @returns The endnote's id, or undefined outside the document's body
     */
    public idOf(reference: object, endnote: NoteContent, context: IContext): number | undefined {
        if (context.viewWrapper !== context.file.Document) {
            return undefined;
        }
        const existing = this.ownNotes.get(reference);
        if (existing !== undefined) {
            return existing;
        }
        const id = this.highestId + 1;
        this.createEndnote(id, endnote.children);
        // eslint-disable-next-line functional/immutable-data
        this.ownNotes.set(reference, id);
        return id;
    }

    /**
     * Formats the endnotes, with the page numbers worked out for their document written into their fields, when the
     * document's body is written with an estimate of its pages.
     */
    public override prepForXml(context: IContext): IXmlableObject | undefined {
        const xml = super.prepForXml(context);
        fillPartPageNumbers(xml, context);
        return xml;
    }
}
