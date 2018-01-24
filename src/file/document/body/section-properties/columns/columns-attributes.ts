import { XmlAttributeComponent } from "file/xml-components";

export interface IColumnsAttributes {
    space?: number;
}

export class ColumnsAttributes extends XmlAttributeComponent<IColumnsAttributes> {
    protected xmlKeys = {
        space: "w:space",
    };
}
