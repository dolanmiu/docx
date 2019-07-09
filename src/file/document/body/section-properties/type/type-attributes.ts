import { XmlAttributeComponent } from "file/xml-components";

export interface ITypeAttributes {
    readonly val?: string;
}

export class TypeAttributes extends XmlAttributeComponent<ITypeAttributes> {
    protected readonly xmlKeys = {
        val: "w:val",
    };
}
