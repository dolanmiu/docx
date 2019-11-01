// http://officeopenxml.com/WPsection.php

import { XmlComponent } from "file/xml-components";
import { SectionVerticalAlignAttributes } from "./vertical-align-attributes";

export enum SectionVerticalAlignValue {
    BOTH = "both",
    BOTTOM = "bottom",
    CENTER = "center",
    TOP = "top",
}

export class SectionVerticalAlign extends XmlComponent {
    constructor(value: SectionVerticalAlignValue) {
        super("w:vAlign");
        this.root.push(new SectionVerticalAlignAttributes({ verticalAlign: value }));
    }
}
