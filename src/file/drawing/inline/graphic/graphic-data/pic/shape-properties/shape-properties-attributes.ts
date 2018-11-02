import { XmlAttributeComponent } from "file/xml-components";

export interface IShapePropertiesAttributes {
    readonly bwMode?: string;
}

export class ShapePropertiesAttributes extends XmlAttributeComponent<IShapePropertiesAttributes> {
    protected readonly xmlKeys = {
        bwMode: "bwMode",
    };
}
