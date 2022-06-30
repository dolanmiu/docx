import { XmlAttributeComponent } from "@file/xml-components";

export interface IChangedAttributesProperties {
    readonly id: number;
    readonly author: string;
    readonly date: string;
}

export class ChangeAttributes extends XmlAttributeComponent<IChangedAttributesProperties> {
    protected readonly xmlKeys = {
        id: "w:id",
        author: "w:author",
        date: "w:date",
    };
}
