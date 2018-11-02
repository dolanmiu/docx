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

class TableBordersAttributes extends XmlAttributeComponent<{
    readonly value: string;
    readonly size: number;
    readonly space: number;
    readonly color: string;
}> {
    protected readonly xmlKeys = {
        value: "w:val",
        size: "w:sz",
        space: "w:space",
        color: "w:color",
    };
}
