import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent, XmlComponent } from "file/xml-components";

import { WidthType } from "../table-cell";

class TableCellMarginAttributes extends XmlAttributeComponent<{ readonly type: WidthType; readonly value: number }> {
    protected readonly xmlKeys = { value: "w:w", type: "w:type" };
}

interface IBaseTableCellMarginOptions {
    readonly value: number;
    readonly type?: WidthType;
}

class BaseTableCellMargin extends XmlComponent {
    constructor(rootKey: string, options: IBaseTableCellMarginOptions) {
        super(rootKey);

        this.root.push(
            new TableCellMarginAttributes({
                type: options.type ?? WidthType.DXA,
                value: options.value,
            }),
        );
    }
}

export interface ITableCellMarginOptions {
    readonly top?: IBaseTableCellMarginOptions;
    readonly bottom?: IBaseTableCellMarginOptions;
    readonly left?: IBaseTableCellMarginOptions;
    readonly right?: IBaseTableCellMarginOptions;
}

export class TableCellMargin extends IgnoreIfEmptyXmlComponent {
    constructor(options: ITableCellMarginOptions) {
        super("w:tblCellMar");

        if (options.bottom) {
            this.root.push(new BaseTableCellMargin("w:bottom", options.bottom));
        }

        if (options.top) {
            this.root.push(new BaseTableCellMargin("w:top", options.top));
        }

        if (options.left) {
            this.root.push(new BaseTableCellMargin("w:left", options.left));
        }

        if (options.right) {
            this.root.push(new BaseTableCellMargin("w:right", options.right));
        }
    }
}
