import { XmlAttributeComponent } from "file/xml-components";

export interface ITitlePageAttributes {
    readonly value: string;
}

export class TitlePageAttributes extends XmlAttributeComponent<ITitlePageAttributes> {
    protected readonly xmlKeys = {
        value: "w:val",
    };
}
