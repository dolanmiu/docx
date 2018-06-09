import { XmlAttributeComponent } from "file/xml-components";

export interface INonVisualPropertiesAttributes {
    id?: number;
    name?: string;
    descr?: string;
}

export class NonVisualPropertiesAttributes extends XmlAttributeComponent<INonVisualPropertiesAttributes> {
    protected xmlKeys = {
        id: "id",
        name: "name",
        descr: "desc",
    };
}
