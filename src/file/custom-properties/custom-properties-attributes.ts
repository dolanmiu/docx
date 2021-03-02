import { XmlAttributeComponent } from "file/xml-components";

export interface ICustomPropertiesAttributes {
    readonly xmlns: string;
    readonly vt: string;
}

export class CustomPropertiesAttributes extends XmlAttributeComponent<ICustomPropertiesAttributes> {
    protected readonly xmlKeys = {
        xmlns: "xmlns",
        vt: "xmlns:vt",
    };
}
