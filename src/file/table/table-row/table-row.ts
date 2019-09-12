import { HeightRule } from "file/table/table-row/table-row-height";
import { XmlComponent } from "file/xml-components";
import { TableCell } from "../table-cell";
import { TableRowProperties } from "./table-row-properties";

export interface ITableRowOptions {
    readonly cantSplit?: boolean;
    readonly tableHeader?: boolean;
    readonly height?: {
        readonly height: number;
        readonly rule: HeightRule;
    };
    readonly children: TableCell[];
}

export class TableRow extends XmlComponent {
    private readonly properties: TableRowProperties;

    constructor(private readonly options: ITableRowOptions) {
        super("w:tr");
        this.properties = new TableRowProperties();
        this.root.push(this.properties);

        for (const child of options.children) {
            this.root.push(child);
        }

        if (options.cantSplit) {
            this.properties.setCantSplit();
        }

        if (options.tableHeader) {
            this.properties.setTableHeader();
        }

        if (options.height) {
            this.properties.setHeight(options.height.height, options.height.rule);
        }
    }

    public get CellCount(): number {
        return this.options.children.length;
    }

    // public mergeCells(startIndex: number, endIndex: number): TableCell {
    //     const cellSpan = endIndex - startIndex + 1;

    //     return this.addGridSpan(startIndex, cellSpan);
    // }

    // private addGridSpan(index: number, cellSpan: number): TableCell {
    //     const remainCell = this.options.children[index];
    //     remainCell.addGridSpan(cellSpan);
    //     this.options.children.splice(index + 1, cellSpan - 1);
    //     this.root.splice(index + 2, cellSpan - 1);

    //     return remainCell;
    // }
}
