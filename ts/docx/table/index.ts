import { Paragraph } from "../paragraph";
import { XmlComponent } from "../xml-components";

import { TableGrid } from "./grid";
import { TableProperties } from "./properties";

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
            gridCols.push(0);
        }
        this.grid = new TableGrid(gridCols);
        this.root.push(this.grid);

        this.rows = [];
        for (let i = 0; i < rows; i++) {
            const cells = [];
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
    public content: Paragraph;
    private properties: TableCellProperties;

    constructor() {
        super("w:tc");
        this.properties = new TableCellProperties();
        this.root.push(this.properties);
        // Table cells can have any block-level content, but for now
        // we only allow a single paragraph:
        this.content = new Paragraph();
        this.root.push(this.content);
    }
}

class TableCellProperties extends XmlComponent {
    constructor() {
        super("w:tcPr");
    }
}
