import { XmlAttributeComponent, XmlComponent } from "../xml-components";

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
}

interface ITableWidth {
    type: WidthTypes;
    w: number | string;
}

class TableWidthAttributes extends XmlAttributeComponent<ITableWidth> {
    protected xmlKeys = {type: "w:type", w: "w:w"};
}

class PreferredTableWidth extends XmlComponent {
    constructor(type: WidthTypes, w: number | string) {
        super("w:tblW");
        this.root.push(new TableWidthAttributes({type, w}));
    }
}

type TableLayoutOptions = "autofit" | "fixed";

class TableLayoutAttributes extends XmlAttributeComponent<{type: TableLayoutOptions}> {
    protected xmlKeys = {type: "w:type"};
}

class TableLayout extends XmlComponent {
    constructor(type: TableLayoutOptions) {
        super("w:tblLayout");
        this.root.push(new TableLayoutAttributes({type}));
    }
}
