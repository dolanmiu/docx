import { XmlAttributeComponent } from "@file/xml-components";

export class ContentTypeAttributes extends XmlAttributeComponent<{
    readonly xmlns?: string;
}> {
    protected readonly xmlKeys = {
        xmlns: "xmlns",
    };
}
