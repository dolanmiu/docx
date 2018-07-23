import { XmlAttributeComponent } from "file/xml-components";
export interface IAppPropertiesAttributes {
    xmlns: string;
    vt: string;
}
export declare class AppPropertiesAttributes extends XmlAttributeComponent<IAppPropertiesAttributes> {
    protected xmlKeys: {
        xmlns: string;
        vt: string;
    };
}
