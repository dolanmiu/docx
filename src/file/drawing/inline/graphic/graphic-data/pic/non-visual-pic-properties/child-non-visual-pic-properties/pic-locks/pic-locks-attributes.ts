import { XmlAttributeComponent } from "file/xml-components";

export interface IPicLocksAttributes {
    readonly noChangeAspect?: number;
    readonly noChangeArrowheads?: number;
}

export class PicLocksAttributes extends XmlAttributeComponent<IPicLocksAttributes> {
    protected readonly xmlKeys = {
        noChangeAspect: "noChangeAspect",
        noChangeArrowheads: "noChangeArrowheads",
    };
}
