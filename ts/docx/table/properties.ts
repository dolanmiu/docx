import { XmlAttributeComponent, XmlComponent } from "../xml-components";

type widthTypes = "dxa" | "pct" | "nil" | "auto";

export class TableProperties extends XmlComponent {
    constructor() {
        super("w:tblPr");
    }

    public setWidth(type: widthTypes, w: number | string): TableProperties {
        this.root.push(new PreferredTableWidth(type, w));
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
