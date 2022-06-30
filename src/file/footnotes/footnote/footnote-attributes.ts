import { XmlAttributeComponent } from "@file/xml-components";

export class FootnoteAttributes extends XmlAttributeComponent<{
    readonly type?: string;
    readonly id: number;
}> {
    protected readonly xmlKeys = {
        type: "w:type",
        id: "w:id",
    };
}
