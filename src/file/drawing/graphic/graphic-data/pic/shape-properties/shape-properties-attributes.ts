import { XmlAttributeComponent } from "file/xml-components";

export interface IShapePropertiesAttributes {
    bwMode?: string;
}

export class ShapePropertiesAttributes extends XmlAttributeComponent<IShapePropertiesAttributes> {
    protected xmlKeys = {
        bwMode: "bwMode",
    };
}
