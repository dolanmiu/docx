// http://officeopenxml.com/WPparagraph.php
import { Attributes, XmlComponent } from "file/xml-components";

export class OutlineLevel extends XmlComponent {
    constructor(level: number) {
        super("w:outlineLvl");

        this.root.push(
            new Attributes({
                val: level,
            }),
        );
    }
}
