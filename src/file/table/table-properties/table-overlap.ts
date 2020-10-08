import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export enum OverlapType {
    NEVER = "never",
    OVERLAP = "overlap",
}

class TableOverlapAttributes extends XmlAttributeComponent<{ readonly val: OverlapType }> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class TableOverlap extends XmlComponent {
    constructor(type: OverlapType) {
        super("w:tblOverlap");
        this.root.push(new TableOverlapAttributes({ val: type }));
    }
}
