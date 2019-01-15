// http://officeopenxml.com/WPparagraph.php
import { Attributes, XmlComponent } from "file/xml-components";

export class OutlineLevel extends XmlComponent {
    public readonly level: string;

    constructor(level: string) {
        super("w:outlineLvl");
        this.level = level;
        this.root.push(
            new Attributes({
                val: level,
            }),
        );
    }
}
