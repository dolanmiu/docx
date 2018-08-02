// http://officeopenxml.com/WPdocument.php
import { IMediaData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { Paragraph, PictureRun } from "../paragraph";
import { Table } from "../table";
import { Body } from "./body";
import { SectionPropertiesOptions } from "./body/section-properties/section-properties";
import { DocumentAttributes } from "./document-attributes";

export class Document extends XmlComponent {
    private readonly body: Body;

    constructor(sectionPropertiesOptions?: SectionPropertiesOptions) {
        super("w:document");
        this.root.push(
            new DocumentAttributes({
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
        this.body = new Body(sectionPropertiesOptions);
        this.root.push(this.body);
    }

    public addParagraph(paragraph: Paragraph): void {
        this.body.push(paragraph);
    }

    public createParagraph(text?: string): Paragraph {
        const para = new Paragraph(text);
        this.addParagraph(para);
        return para;
    }

    public addTable(table: Table): void {
        this.body.push(table);
    }

    public createTable(rows: number, cols: number): Table {
        const table = new Table(rows, cols);
        this.addTable(table);
        return table;
    }

    public addDrawing(pictureParagraph: Paragraph): void {
        this.body.push(pictureParagraph);
    }

    public createDrawing(imageData: IMediaData): PictureRun {
        const paragraph = new Paragraph();
        const run = new PictureRun(imageData);

        paragraph.addRun(run);
        this.addDrawing(paragraph);

        return run;
    }

    get Body(): Body {
        return this.body;
    }
}
