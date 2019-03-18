// http://officeopenxml.com/WPtableCellProperties-Margins.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export interface ICellMargainProperties {
    readonly type: string;
    readonly width: number;
}

class CellMargainAttributes extends XmlAttributeComponent<ICellMargainProperties> {
    protected readonly xmlKeys = { width: "w:w", type: "w:type" };
}

export class TopCellMargain extends XmlComponent {
    constructor(value: number) {
        super("w:top");

        this.root.push(
            new CellMargainAttributes({
                width: value,
                type: "dxa",
            }),
        );
    }
}

export class BottomCellMargain extends XmlComponent {
    constructor(value: number) {
        super("w:bottom");

        this.root.push(
            new CellMargainAttributes({
                width: value,
                type: "dxa",
            }),
        );
    }
}

export class LeftCellMargain extends XmlComponent {
    constructor(value: number) {
        super("w:start");

        this.root.push(
            new CellMargainAttributes({
                width: value,
                type: "dxa",
            }),
        );
    }
}

export class RightCellMargain extends XmlComponent {
    constructor(value: number) {
        super("w:end");

        this.root.push(
            new CellMargainAttributes({
                width: value,
                type: "dxa",
            }),
        );
    }
}
