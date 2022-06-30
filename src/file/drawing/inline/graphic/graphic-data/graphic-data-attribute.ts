import { XmlAttributeComponent } from "@file/xml-components";

export class GraphicDataAttributes extends XmlAttributeComponent<{
    readonly uri?: string;
}> {
    protected readonly xmlKeys = {
        uri: "uri",
    };
}
