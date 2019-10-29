import { XmlAttributeComponent } from "file/xml-components";
import { SectionVerticalAlignValue } from "./vertical-align";

export interface ISectionVerticalAlignAttributes {
    readonly valign?: SectionVerticalAlignValue;
}

export class SectionVerticalAlignAttributes extends XmlAttributeComponent<ISectionVerticalAlignAttributes> {
    protected readonly xmlKeys = {
        valign: "w:val",
    };
}
