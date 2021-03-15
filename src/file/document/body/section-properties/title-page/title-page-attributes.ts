import { XmlAttributeComponent } from "file/xml-components";

export class TitlePageAttributes extends XmlAttributeComponent<{
    readonly value: string;
}> {
    protected readonly xmlKeys = {
        value: "w:val",
    };
}
