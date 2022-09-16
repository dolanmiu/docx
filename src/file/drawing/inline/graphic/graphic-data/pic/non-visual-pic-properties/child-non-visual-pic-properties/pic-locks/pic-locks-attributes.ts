import { XmlAttributeComponent } from "@file/xml-components";

export class PicLocksAttributes extends XmlAttributeComponent<{
    readonly noChangeAspect?: number;
    readonly noChangeArrowheads?: number;
}> {
    protected readonly xmlKeys = {
        noChangeAspect: "noChangeAspect",
        noChangeArrowheads: "noChangeArrowheads",
    };
}
