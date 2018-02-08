import { XmlAttributeComponent } from "file/xml-components";

export interface IAppPropertiesAttributes {
    xmlns: string;
    vt: string;
}

export class AppPropertiesAttributes extends XmlAttributeComponent<IAppPropertiesAttributes> {
    protected xmlKeys = {
        xmlns: "xmlns",
        vt: "xmlns:vt",
    };
}
