// http://officeopenxml.com/WPalignment.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export enum AlignmentOptions {
    START = "start",
    END = "end",
    CENTER = "center",
    BOTH = "both",
    DISTRIBUTE = "distribute",
    LEFT = "left",
    RIGHT = "right",
}

export class AlignmentAttributes extends XmlAttributeComponent<{ readonly val: AlignmentOptions }> {
    protected readonly xmlKeys = { val: "w:val" };
}

export class Alignment extends XmlComponent {
    constructor(type: AlignmentOptions) {
        super("w:jc");
        this.root.push(new AlignmentAttributes({ val: type }));
    }
}
