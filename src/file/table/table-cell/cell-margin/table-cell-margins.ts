// http://officeopenxml.com/WPtableCellProperties-Margins.php
import { XmlComponent } from "file/xml-components";

import { BottomCellMargin, LeftCellMargin, RightCellMargin, TopCellMargin } from "./cell-margin";

export interface ITableCellMarginOptions {
    readonly top?: number;
    readonly left?: number;
    readonly bottom?: number;
    readonly right?: number;
}

export class TableCellMargin extends XmlComponent {
    constructor({ top = 0, left = 0, right = 0, bottom = 0 }: ITableCellMarginOptions) {
        super("w:tcMar");
        this.root.push(new TopCellMargin(top));
        this.root.push(new BottomCellMargin(bottom));
        this.root.push(new RightCellMargin(right));
        this.root.push(new LeftCellMargin(left));
    }
}
