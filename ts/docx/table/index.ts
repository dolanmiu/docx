import { Paragraph } from "../paragraph";
import { XmlComponent } from "../xml-components";

import { TableGrid } from "./grid";
import { TableProperties, widthTypes } from "./properties";

export class Table extends XmlComponent {
    private properties: TableProperties;
    private rows: TableRow[];
    private grid: TableGrid;

    constructor(rows: number, cols: number) {
        super("w:tbl");
        this.properties = new TableProperties();
        this.root.push(this.properties);

        const gridCols: number[] = [];
        for (let i = 0; i < cols; i++) {
            /*
              0-width columns don't get rendered correctly, so we need
              to give them some value. A reasonable default would be
              ~6in / numCols, but if we do that it becomes very hard
              to resize the table using setWidth, unless the layout
              algorithm is set to 'fixed'. Instead, the approach here
              means even in 'auto' layout, setting a width on the
              table will make it look reasonable, as the layout
              algorithm will expand columns to fit its content
             */
            gridCols.push(1);
        }
        this.grid = new TableGrid(gridCols);
        this.root.push(this.grid);

        this.rows = [];
        for (let i = 0; i < rows; i++) {
            const cells: TableCell[] = [];
            for (let j = 0; j < cols; j++) {
                cells.push(new TableCell());
            }
            const row = new TableRow(cells);
            this.rows.push(row);
            this.root.push(row);
        }
    }

    public getRow(ix: number): TableRow {
        return this.rows[ix];
    }

    public getCell(row: number, col: number): TableCell {
        return this.getRow(row).getCell(col);
    }

    public setWidth(type: widthTypes, width: number | string): Table {
        this.properties.setWidth(type, width);
        return this;
    }

    public fixedWidthLayout(): Table {
        this.properties.fixedWidthLayout();
        return this;
    }
}

class TableRow extends XmlComponent {
    private properties: TableRowProperties;
    private cells: TableCell[];

    constructor(cells: TableCell[]) {
        super("w:tr");
        this.properties = new TableRowProperties();
        this.root.push(this.properties);
        this.cells = cells;
        cells.forEach((c) => this.root.push(c));
    }

    public getCell(ix: number): TableCell {
        return this.cells[ix];
    }
}

class TableRowProperties extends XmlComponent {
    constructor() {
        super("w:trPr");
    }
}

class TableCell extends XmlComponent {
    private properties: TableCellProperties;

    constructor() {
        super("w:tc");
        this.properties = new TableCellProperties();
        this.root.push(this.properties);
    }

    public addContent(content: Paragraph | Table): TableCell {
        this.root.push(content);
        return this;
    }

    public prepForXml(): XmlableObject {
        // Cells must end with a paragraph
        const retval = super.prepForXml();
        const content = retval["w:tc"];
        if (!content[content.length - 1]["w:p"]) {
            content.push(new Paragraph().prepForXml());
        }
        return retval;
    }

    public createParagraph(text?: string): Paragraph {
        const para = new Paragraph(text);
        this.addContent(para);
        return para;
    }
}

class TableCellProperties extends XmlComponent {
    constructor() {
        super("w:tcPr");
    }
}
