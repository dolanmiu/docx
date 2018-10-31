import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

import { WidthType } from "../table-cell";

interface ITableWidth {
    type: WidthType;
    w: number | string;
}

class TableWidthAttributes extends XmlAttributeComponent<ITableWidth> {
    protected xmlKeys = { type: "w:type", w: "w:w" };
}

export class PreferredTableWidth extends XmlComponent {
    constructor(type: WidthType, w: number | string) {
        super("w:tblW");
        this.root.push(new TableWidthAttributes({ type, w }));
    }
}
