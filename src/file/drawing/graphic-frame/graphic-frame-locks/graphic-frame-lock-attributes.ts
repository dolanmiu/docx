import { XmlAttributeComponent } from "@file/xml-components";

export class GraphicFrameLockAttributes extends XmlAttributeComponent<{
    readonly xmlns?: string;
    readonly noChangeAspect?: number;
}> {
    protected readonly xmlKeys = {
        xmlns: "xmlns:a",
        noChangeAspect: "noChangeAspect",
    };
}
