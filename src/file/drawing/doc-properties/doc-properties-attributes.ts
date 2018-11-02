import { XmlAttributeComponent } from "file/xml-components";

export interface IDocPropertiesAttributes {
    readonly id?: number;
    readonly name?: string;
    readonly descr?: string;
}

export class DocPropertiesAttributes extends XmlAttributeComponent<IDocPropertiesAttributes> {
    protected readonly xmlKeys = {
        id: "id",
        name: "name",
        descr: "descr",
    };
}
