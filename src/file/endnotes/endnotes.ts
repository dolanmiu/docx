import { XmlComponent } from "@file/xml-components";

import { EndnotesAttributes } from "./endnotes-attributes";
import { LineRuleType, Paragraph } from "../paragraph";
import { Endnote, EndnoteType } from "./endnote/endnote";
import { ContinuationSeperatorRun } from "../footnotes/footnote/run/continuation-seperator-run";
import { SeperatorRun } from "../footnotes/footnote/run/seperator-run";

export class Endnotes extends XmlComponent {
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
    }
}
