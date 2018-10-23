import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export enum TableLayoutType {
    AUTOFIT = "autofit",
    FIXED = "fixed",
}

class TableLayoutAttributes extends XmlAttributeComponent<{ type: TableLayoutType }> {
    protected xmlKeys = { type: "w:type" };
}

export class TableLayout extends XmlComponent {
    constructor(type: TableLayoutType) {
        super("w:tblLayout");
        this.root.push(new TableLayoutAttributes({ type }));
    }
}
