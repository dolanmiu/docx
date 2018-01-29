// http://officeopenxml.com/WPheaders.php
import { IMediaData } from "file/media";
import { XmlComponent } from "file/xml-components";
import { Paragraph, PictureRun } from "../paragraph";
import { Table } from "../table";
import { HeaderAttributes } from "./header-attributes";

export class Header extends XmlComponent {
    constructor() {
        super("w:hdr");
        this.root.push(
            new HeaderAttributes({
                o: "urn:schemas-microsoft-com:office:office",
                r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
                v: "urn:schemas-microsoft-com:vml",
                w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
                w10: "urn:schemas-microsoft-com:office:word",
                wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
                wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
                wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
                mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
                wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
                w14: "http://schemas.microsoft.com/office/word/2010/wordml",
            }),
        );
    }

    public addParagraph(paragraph: Paragraph): void {
        this.root.push(paragraph);
    }

    public createParagraph(text?: string): Paragraph {
        const para = new Paragraph(text);
        this.addParagraph(para);
        return para;
    }

    public addTable(table: Table): void {
        this.root.push(table);
    }

    public createTable(rows: number, cols: number): Table {
        const table = new Table(rows, cols);
        this.addTable(table);
        return table;
    }

    public addDrawing(imageData: IMediaData): void {
        const paragraph = new Paragraph();
        const run = new PictureRun(imageData);
        paragraph.addRun(run);

        this.root.push(paragraph);
    }

    public createDrawing(imageData: IMediaData): void {
        this.addDrawing(imageData);

        return;
    }
}
