import { XmlAttributeComponent } from "file/xml-components";

export interface IOffsetAttributes {
    x?: number;
    y?: number;
}

export class OffsetAttributes extends XmlAttributeComponent<IOffsetAttributes> {
    protected xmlKeys = {
        x: "x",
        y: "y",
    };
}
