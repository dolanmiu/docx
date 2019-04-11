import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent, XmlComponent } from "file/xml-components";

import { WidthType } from "../table-cell";

class TableCellMarginAttributes extends XmlAttributeComponent<{ readonly type: WidthType; readonly value: number }> {
    protected readonly xmlKeys = { value: "w:w", type: "w:type" };
}

class BaseTableCellMargin extends XmlComponent {
    public setProperties(value: number, type: WidthType = WidthType.DXA): void {
        this.root.push(
            new TableCellMarginAttributes({
                type: type,
                value: value,
            }),
        );
    }
}

export class TableCellMargin extends IgnoreIfEmptyXmlComponent {
    constructor() {
        super("w:tblCellMar");
    }

    public addTopMargin(value: number, type: WidthType = WidthType.DXA): void {
        const top = new BaseTableCellMargin("w:top");

        top.setProperties(value, type);
        this.root.push(top);
    }

    public addLeftMargin(value: number, type: WidthType = WidthType.DXA): void {
        const left = new BaseTableCellMargin("w:left");

        left.setProperties(value, type);
        this.root.push(left);
    }

    public addBottomMargin(value: number, type: WidthType = WidthType.DXA): void {
        const bottom = new BaseTableCellMargin("w:bottom");

        bottom.setProperties(value, type);
        this.root.push(bottom);
    }

    public addRightMargin(value: number, type: WidthType = WidthType.DXA): void {
        const right = new BaseTableCellMargin("w:right");

        right.setProperties(value, type);
        this.root.push(right);
    }
}
