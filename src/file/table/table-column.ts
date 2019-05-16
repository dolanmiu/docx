import { TableCell, VMergeType } from "./table-cell";

export class TableColumn {
    constructor(private readonly cells: TableCell[]) {}

    public getCell(index: number): TableCell {
        const cell = this.cells[index];

        if (!cell) {
            throw Error("Index out of bounds when trying to get cell on column");
        }

        return cell;
    }

    public mergeCells(startIndex: number, endIndex: number): TableCell {
        this.cells[startIndex].addVerticalMerge(VMergeType.RESTART);

        for (let i = startIndex + 1; i <= endIndex; i++) {
            this.cells[i].addVerticalMerge(VMergeType.CONTINUE);
        }

        return this.cells[startIndex];
    }
}
