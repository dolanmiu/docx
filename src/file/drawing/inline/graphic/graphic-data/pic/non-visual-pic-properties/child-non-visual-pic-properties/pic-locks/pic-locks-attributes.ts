import { XmlAttributeComponent } from "file/xml-components";

export interface IPicLocksAttributes {
    noChangeAspect?: number;
    noChangeArrowheads?: number;
}

export class PicLocksAttributes extends XmlAttributeComponent<IPicLocksAttributes> {
    protected xmlKeys = {
        noChangeAspect: "noChangeAspect",
        noChangeArrowheads: "noChangeArrowheads",
    };
}
