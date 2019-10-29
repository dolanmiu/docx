// http://officeopenxml.com/WPsection.php

import { XmlComponent } from "file/xml-components";
import { SectionVerticalAlignAttributes } from "./vertical-align-attributes";

export enum SectionVerticalAlignValue {
    Both = "both",
    Bottom = "bottom",
    Center = "center",
    Top = "top",
}

export class SectionVerticalAlign extends XmlComponent {
    constructor(value: SectionVerticalAlignValue) {
        super("w:vAlign");
        this.root.push(new SectionVerticalAlignAttributes({ valign: value }));
    }
}
