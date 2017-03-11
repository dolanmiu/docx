import { XmlAttributeComponent, XmlComponent } from "../xml-components";

export type widthTypes = "dxa" | "pct" | "nil" | "auto";

export class TableProperties extends XmlComponent {
    constructor() {
        super("w:tblPr");
    }

    public setWidth(type: widthTypes, w: number | string): TableProperties {
        this.root.push(new PreferredTableWidth(type, w));
        return this;
    }

    public fixedWidthLayout(): TableProperties {
        this.root.push(new TableLayout("fixed"));
        return this;
    }
}

interface ITableWidth {
    type: widthTypes;
    w: number | string;
}

class TableWidthAttributes extends XmlAttributeComponent<ITableWidth> {
    protected xmlKeys = {type: "w:type", w: "w:w"};
}

class PreferredTableWidth extends XmlComponent {
    constructor(type: widthTypes, w: number | string) {
        super("w:tblW");
        this.root.push(new TableWidthAttributes({type, w}));
    }
}

type tableLayout = "autofit" | "fixed";

class TableLayoutAttributes extends XmlAttributeComponent<{type: tableLayout}> {
    protected xmlKeys = {type: "w:type"};
}

class TableLayout extends XmlComponent {
    constructor(type: tableLayout) {
        super("w:tblLayout");
        this.root.push(new TableLayoutAttributes({type}));
    }
}
