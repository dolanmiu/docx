// http://officeopenxml.com/WPtableCellProperties-Margins.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

class CellMarginAttributes extends XmlAttributeComponent<{
    readonly type: string;
    readonly width: number;
}> {
    protected readonly xmlKeys = { width: "w:w", type: "w:type" };
}

export class TopCellMargin extends XmlComponent {
    constructor(value: number) {
        super("w:top");

        this.root.push(
            new CellMarginAttributes({
                width: value,
                type: "dxa",
            }),
        );
    }
}

export class BottomCellMargin extends XmlComponent {
    constructor(value: number) {
        super("w:bottom");

        this.root.push(
            new CellMarginAttributes({
                width: value,
                type: "dxa",
            }),
        );
    }
}

export class LeftCellMargin extends XmlComponent {
    constructor(value: number) {
        super("w:start");

        this.root.push(
            new CellMarginAttributes({
                width: value,
                type: "dxa",
            }),
        );
    }
}

export class RightCellMargin extends XmlComponent {
    constructor(value: number) {
        super("w:end");

        this.root.push(
            new CellMarginAttributes({
                width: value,
                type: "dxa",
            }),
        );
    }
}
