import { XmlAttributeComponent } from "@file/xml-components";

export class ShapePropertiesAttributes extends XmlAttributeComponent<{
    readonly bwMode?: string;
}> {
    protected readonly xmlKeys = {
        bwMode: "bwMode",
    };
}
