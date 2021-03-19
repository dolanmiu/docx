import { XmlAttributeComponent } from "file/xml-components";
import { SectionVerticalAlignValue } from "./vertical-align";

export class SectionVerticalAlignAttributes extends XmlAttributeComponent<{
    readonly verticalAlign?: SectionVerticalAlignValue;
}> {
    protected readonly xmlKeys = {
        verticalAlign: "w:val",
    };
}
