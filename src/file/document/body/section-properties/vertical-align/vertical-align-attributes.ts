import { XmlAttributeComponent } from "file/xml-components";
import { SectionVerticalAlignValue } from "./vertical-align";

export interface ISectionVerticalAlignAttributes {
    readonly verticalAlign?: SectionVerticalAlignValue;
}

export class SectionVerticalAlignAttributes extends XmlAttributeComponent<ISectionVerticalAlignAttributes> {
    protected readonly xmlKeys = {
        verticalAlign: "w:val",
    };
}
