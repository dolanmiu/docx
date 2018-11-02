import { XmlAttributeComponent } from "file/xml-components";

export interface IAppPropertiesAttributes {
    readonly xmlns: string;
    readonly vt: string;
}

export class AppPropertiesAttributes extends XmlAttributeComponent<IAppPropertiesAttributes> {
    protected readonly xmlKeys = {
        xmlns: "xmlns",
        vt: "xmlns:vt",
    };
}
