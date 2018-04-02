import { XmlAttributeComponent } from "../../../../../../../../file/xml-components";
export interface INonVisualPropertiesAttributes {
    id?: number;
    name?: string;
    descr?: string;
}
export declare class NonVisualPropertiesAttributes extends XmlAttributeComponent<INonVisualPropertiesAttributes> {
    protected xmlKeys: {
        id: string;
        name: string;
        descr: string;
    };
}
