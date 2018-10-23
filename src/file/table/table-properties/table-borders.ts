import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export class TableBorders extends XmlComponent {
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
