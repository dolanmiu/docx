import { XmlAttributeComponent } from "@file/xml-components";

export class ExtentAttributes extends XmlAttributeComponent<{
    readonly cx?: number;
    readonly cy?: number;
}> {
    protected readonly xmlKeys = {
        cx: "cx",
        cy: "cy",
    };
}
