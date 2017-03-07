import {XmlComponent, Attributes} from "../xml-components";
import {Paragraph} from "../paragraph";
import {TableProperties} from "./properties";
import {TableGrid, GridCol} from './grid';

export class Table extends XmlComponent {
    properties: TableProperties;
    private rows: Array<TableRow>;
    private grid: TableGrid;

    constructor(rows: number, cols: number) {
        super('w:tbl');
        this.properties = new TableProperties();
        this.root.push(this.properties);

        const gridCols = [];
        for (let i = 0; i++; i < cols) {
            gridCols.push(new GridCol());
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

    getRow(ix: number): TableRow {
        return this.rows[ix];
    }
}

class TableRow extends XmlComponent {
    private properties: TableRowProperties;
    private cells: Array<TableCell>;

    constructor(cells: Array<TableCell>) {
        super('w:tr');
        this.properties = new TableRowProperties();
        this.root.push(this.properties);
        this.cells = cells;
        cells.forEach(c => this.root.push(c))
    }

    getCell(ix: number): TableCell {
        return this.cells[ix];
    }
}

class TableRowProperties extends XmlComponent {
    constructor() {
        super('w:trPr');
    }
}

class TableCell extends XmlComponent {
    private properties: TableCellProperties;
    content: any;

    constructor() {
        super('w:tc');
        this.properties = new TableCellProperties();
        this.root.push(this.properties);
        this.root.push()
        // Table cells can have any block-level content, but for now
        // we only allow a single paragraph:
        this.content = new Paragraph();
        this.root.push(this.content);
    }
}

class TableCellProperties extends XmlComponent {
    constructor() {
        super('w:tcPr');
    }
}
