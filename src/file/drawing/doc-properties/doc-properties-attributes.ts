import { XmlAttributeComponent } from "file/xml-components";

export interface IDocPropertiesAttributes {
    id?: number;
    name?: string;
    descr?: string;
}

export class DocPropertiesAttributes extends XmlAttributeComponent<IDocPropertiesAttributes> {
    protected xmlKeys = {
        id: "id",
        name: "name",
        descr: "descr",
    };
}
