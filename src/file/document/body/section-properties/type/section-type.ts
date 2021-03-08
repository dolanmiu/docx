// http://officeopenxml.com/WPsection.php
import { XmlComponent } from "file/xml-components";
import { SectionType, SectionTypeAttributes } from "./section-type-attributes";

export class Type extends XmlComponent {
    constructor(value: SectionType) {
        super("w:type");
        this.root.push(new SectionTypeAttributes({ val: value }));
    }
}
