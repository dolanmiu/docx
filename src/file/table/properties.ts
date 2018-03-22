import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export type WidthTypes = "dxa" | "pct" | "nil" | "auto";

export class TableProperties extends XmlComponent {
    constructor() {
        super("w:tblPr");
    }

    public setWidth(type: WidthTypes, w: number | string): TableProperties {
        this.root.push(new PreferredTableWidth(type, w));
        return this;
    }

    public fixedWidthLayout(): TableProperties {
        this.root.push(new TableLayout("fixed"));
        return this;
    }

    public setBorder(): TableProperties {
        this.root.push(new TableBorders());
        return this;
    }
}

interface ITableWidth {
    type: WidthTypes;
    w: number | string;
}

class TableWidthAttributes extends XmlAttributeComponent<ITableWidth> {
    protected xmlKeys = { type: "w:type", w: "w:w" };
}

class PreferredTableWidth extends XmlComponent {
    constructor(type: WidthTypes, w: number | string) {
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
