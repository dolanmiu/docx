import { XmlAttributeComponent } from "@file/xml-components";

export class OffsetAttributes extends XmlAttributeComponent<{
    readonly x?: number;
    readonly y?: number;
}> {
    protected readonly xmlKeys = {
        x: "x",
        y: "y",
    };
}
