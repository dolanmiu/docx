// http://officeopenxml.com/WPtableCellProperties-Margins.php
import { XmlComponent } from "file/xml-components";

import { BottomCellMargain, LeftCellMargain, RightCellMargain, TopCellMargain } from "./cell-margain";

export interface ITableCellMargainOptions {
    readonly top?: number;
    readonly left?: number;
    readonly bottom?: number;
    readonly right?: number;
}

export class TableCellMargain extends XmlComponent {
    constructor({ top = 0, left = 0, right = 0, bottom = 0 }: ITableCellMargainOptions) {
        super("w:tcMar");
        this.root.push(new TopCellMargain(top));
        this.root.push(new BottomCellMargain(bottom));
        this.root.push(new RightCellMargain(right));
        this.root.push(new LeftCellMargain(left));
    }
}
