import {
    GridSpan,
    TableCellBorders,
    TableCellShading,
    TableCellWidth,
    VAlign,
    VerticalAlign,
    VMerge,
    VMergeType,
    WidthType,
} from "file/table/table-cell";
import { IXmlableObject, XmlComponent } from "file/xml-components";
import { Paragraph } from "../paragraph";
import { TableGrid } from "./grid";
import { TableProperties, WidthTypes } from "./properties";

export class Table extends XmlComponent {
    private readonly properties: TableProperties;
    private readonly rows: TableRow[];
    private readonly grid: TableGrid;

    constructor(rows: number, cols: number, colSizes?: number[]) {
        super("w:tbl");
        this.properties = new TableProperties();
        this.root.push(this.properties);
        this.properties.setBorder();

        if (colSizes && colSizes.length > 0) {
            this.grid = new TableGrid(colSizes);
        } else {
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
        }

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

    public setWidth(type: WidthTypes, width: number | string): Table {
        this.properties.setWidth(type, width);
        return this;
    }

    public setFixedWidthLayout(): Table {
        this.properties.setFixedWidthLayout();
        return this;
    }

    public get Properties(): TableProperties {
        return this.properties;
    }
}

export class TableRow extends XmlComponent {
    private readonly properties: TableRowProperties;

    constructor(private readonly cells: TableCell[]) {
        super("w:tr");
        this.properties = new TableRowProperties();
        this.root.push(this.properties);
        cells.forEach((c) => this.root.push(c));
    }

    public getCell(ix: number): TableCell {
        return this.cells[ix];
    }

    public addGridSpan(ix: number, cellSpan: number): TableCell {
        const remainCell = this.cells[ix];
        remainCell.CellProperties.addGridSpan(cellSpan);
        this.cells.splice(ix + 1, cellSpan - 1);
        this.root.splice(ix + 2, cellSpan - 1);

        return remainCell;
    }
}

export class TableRowProperties extends XmlComponent {
    constructor() {
        super("w:trPr");
    }
}

export class TableCell extends XmlComponent {
    private readonly properties: TableCellProperties;

    constructor() {
        super("w:tc");
        this.properties = new TableCellProperties();
        this.root.push(this.properties);
    }

    public addContent(content: Paragraph | Table): TableCell {
        this.root.push(content);
        return this;
    }

    public prepForXml(): IXmlableObject {
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

    public get CellProperties(): TableCellProperties {
        return this.properties;
    }
}

export class TableCellProperties extends XmlComponent {
    private readonly cellBorder: TableCellBorders;

    constructor() {
        super("w:tcPr");
        this.cellBorder = new TableCellBorders();
        this.root.push(this.cellBorder);
    }

    public get Borders(): TableCellBorders {
        return this.cellBorder;
    }

    public addGridSpan(cellSpan: number): TableCellProperties {
        this.root.push(new GridSpan(cellSpan));

        return this;
    }

    public addVerticalMerge(type: VMergeType): TableCellProperties {
        this.root.push(new VMerge(type));

        return this;
    }

    public setVerticalAlign(type: VerticalAlign): TableCellProperties {
        this.root.push(new VAlign(type));

        return this;
    }

    public setWidth(width: string | number, type: WidthType): TableCellProperties {
        this.root.push(new TableCellWidth(width, type));

        return this;
    }

    public setShading(attrs: object): TableCellProperties {
        this.root.push(new TableCellShading(attrs));

        return this;
    }
}
