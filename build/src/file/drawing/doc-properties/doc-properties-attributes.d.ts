import { XmlAttributeComponent } from "file/xml-components";
export interface IDocPropertiesAttributes {
    id?: number;
    name?: string;
    descr?: string;
}
export declare class DocPropertiesAttributes extends XmlAttributeComponent<IDocPropertiesAttributes> {
    protected xmlKeys: {
        id: string;
        name: string;
        descr: string;
    };
}
