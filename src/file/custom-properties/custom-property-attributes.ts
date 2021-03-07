import { XmlAttributeComponent } from "file/xml-components";

export interface ICustomPropertyAttributes {
    readonly fmtid: string;
    readonly pid: string;
    readonly name: string;
}

export class CustomPropertyAttributes extends XmlAttributeComponent<ICustomPropertyAttributes> {
    protected readonly xmlKeys = {
        fmtid: "fmtid",
        pid: "pid",
        name: "name",
    };
}
