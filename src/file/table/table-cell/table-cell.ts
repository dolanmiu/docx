// http://officeopenxml.com/WPtableGrid.php
import { Paragraph } from "file/paragraph";
import { IXmlableObject, XmlComponent } from "file/xml-components";

import { Table } from "../table";
import { TableCellBorders, VerticalAlign } from "./table-cell-components";
import { TableCellProperties } from "./table-cell-properties";

export class TableCell extends XmlComponent {
    private readonly properties: TableCellProperties;

    constructor() {
        super("w:tc");
        this.properties = new TableCellProperties();
        this.root.push(this.properties);
    }

    public addParagraph(content: Paragraph): TableCell {
        this.root.push(content);
        return this;
    }

    public addTable(content: Table): TableCell {
        this.root.push(content);
        return this;
    }

    public prepForXml(): IXmlableObject | undefined {
        // Cells must end with a paragraph
        const retval = super.prepForXml();
        if (!retval) {
            return undefined;
        }

        const content = retval["w:tc"];
        if (!content[content.length - 1]["w:p"]) {
            content.push(new Paragraph().prepForXml());
        }
        return retval;
    }

    public createParagraph(text?: string): Paragraph {
        const para = new Paragraph(text);
        this.addParagraph(para);

        return para;
    }

    public setVerticalAlign(type: VerticalAlign): TableCell {
        this.properties.setVerticalAlign(type);

        return this;
    }

    public addGridSpan(cellSpan: number): TableCell {
        this.properties.addGridSpan(cellSpan);

        return this;
    }

    public get Borders(): TableCellBorders {
        return this.properties.Borders;
    }
}
