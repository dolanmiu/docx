// http://officeopenxml.com/WPalignment.php
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export type AlignmentOptions = "start" | "end" | "center" | "both" | "distribute" | "left" | "right";

export class AlignmentAttributes extends XmlAttributeComponent<{ val: AlignmentOptions }> {
    protected xmlKeys = { val: "w:val" };
}

export class Alignment extends XmlComponent {
    constructor(type: AlignmentOptions) {
        super("w:jc");
        this.root.push(new AlignmentAttributes({ val: type }));
    }
}
