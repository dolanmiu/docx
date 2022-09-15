import { XmlComponent } from "@file/xml-components";

import { LineRuleType, Paragraph } from "../paragraph";
import { Footnote, FootnoteType } from "./footnote/footnote";
import { ContinuationSeperatorRun } from "./footnote/run/continuation-seperator-run";
import { SeperatorRun } from "./footnote/run/seperator-run";
import { FootnotesAttributes } from "./footnotes-attributes";

export class FootNotes extends XmlComponent {
    public constructor() {
        super("w:footnotes");

        this.root.push(
            new FootnotesAttributes({
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

        const begin = new Footnote({
            id: -1,
            type: FootnoteType.SEPERATOR,
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

        const spacing = new Footnote({
            id: 0,
            type: FootnoteType.CONTINUATION_SEPERATOR,
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

    public createFootNote(id: number, paragraph: readonly Paragraph[]): void {
        const footnote = new Footnote({
            id: id,
            children: paragraph,
        });

        this.root.push(footnote);
    }
}
