import { XmlAttributeComponent } from "@file/xml-components";

export class ExtentsAttributes extends XmlAttributeComponent<{
    readonly cx?: number;
    readonly cy?: number;
}> {
    protected readonly xmlKeys = {
        cx: "cx",
        cy: "cy",
    };
}
