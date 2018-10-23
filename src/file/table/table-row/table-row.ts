import { XmlComponent } from "file/xml-components";

import { TableCell } from "../table-cell";
import { TableRowProperties } from "./table-row-properties";

export class TableRow extends XmlComponent {
    private readonly properties: TableRowProperties;

    constructor(private readonly cells: TableCell[]) {
        super("w:tr");
        this.properties = new TableRowProperties();
        this.root.push(this.properties);
        cells.forEach((c) => this.root.push(c));
    }

    public getCell(ix: number): TableCell {
        const cell = this.cells[ix];

        if (!cell) {
            throw Error("Index out of bounds when trying to get cell on row");
        }

        return cell;
    }

    public addGridSpan(index: number, cellSpan: number): TableCell {
        const remainCell = this.cells[index];
        remainCell.CellProperties.addGridSpan(cellSpan);
        this.cells.splice(index + 1, cellSpan - 1);
        this.root.splice(index + 2, cellSpan - 1);

        return remainCell;
    }

    public mergeCells(startIndex: number, endIndex: number): TableCell {
        const cellSpan = endIndex - startIndex + 1;

        return this.addGridSpan(startIndex, cellSpan);
    }
}
