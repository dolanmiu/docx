import { XmlAttributeComponent } from "file/xml-components";

export interface IColumnsAttributes {
    readonly space?: number;
}

export class ColumnsAttributes extends XmlAttributeComponent<IColumnsAttributes> {
    protected readonly xmlKeys = {
        space: "w:space",
    };
}
