import { XmlAttributeComponent, XmlComponent } from "file/xml-components";
import { WidthType } from "./table-cell";
import { TableCellMargin } from "./table-cell-margin";

export class TableProperties extends XmlComponent {
    private readonly cellMargain: TableCellMargin;

    constructor() {
        super("w:tblPr");

        this.cellMargain = new TableCellMargin();
        this.root.push(this.cellMargain);
    }

    public setWidth(type: WidthType, w: number | string): TableProperties {
        this.root.push(new PreferredTableWidth(type, w));
        return this;
    }

    public setFixedWidthLayout(): TableProperties {
        this.root.push(new TableLayout("fixed"));
        return this;
    }

    public setBorder(): TableProperties {
        this.root.push(new TableBorders());
        return this;
    }

    public get CellMargin(): TableCellMargin {
        return this.cellMargain;
    }
}

interface ITableWidth {
    type: WidthType;
    w: number | string;
}

class TableWidthAttributes extends XmlAttributeComponent<ITableWidth> {
    protected xmlKeys = { type: "w:type", w: "w:w" };
}

class PreferredTableWidth extends XmlComponent {
    constructor(type: WidthType, w: number | string) {
        super("w:tblW");
        this.root.push(new TableWidthAttributes({ type, w }));
    }
}

type TableLayoutOptions = "autofit" | "fixed";

class TableLayoutAttributes extends XmlAttributeComponent<{ type: TableLayoutOptions }> {
    protected xmlKeys = { type: "w:type" };
}

class TableLayout extends XmlComponent {
    constructor(type: TableLayoutOptions) {
        super("w:tblLayout");
        this.root.push(new TableLayoutAttributes({ type }));
    }
}

class TableBorders extends XmlComponent {
    constructor() {
        super("w:tblBorders");
        this.root.push(new TableBordersElement("w:top", "single", 4, 0, "auto"));
        this.root.push(new TableBordersElement("w:left", "single", 4, 0, "auto"));
        this.root.push(new TableBordersElement("w:bottom", "single", 4, 0, "auto"));
        this.root.push(new TableBordersElement("w:right", "single", 4, 0, "auto"));
        this.root.push(new TableBordersElement("w:insideH", "single", 4, 0, "auto"));
        this.root.push(new TableBordersElement("w:insideV", "single", 4, 0, "auto"));
    }
}

class TableBordersElement extends XmlComponent {
    constructor(elementName: string, value: string, size: number, space: number, color: string) {
        super(elementName);
        this.root.push(
            new TableBordersAttributes({
                value,
                size,
                space,
                color,
            }),
        );
    }
}

class TableBordersAttributes extends XmlAttributeComponent<{ value: string; size: number; space: number; color: string }> {
    protected xmlKeys = {
        value: "w:val",
        size: "w:sz",
        space: "w:space",
        color: "w:color",
    };
}
