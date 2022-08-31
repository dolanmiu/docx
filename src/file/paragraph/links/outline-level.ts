// http://officeopenxml.com/WPparagraph.php
import { Attributes, XmlComponent } from "@file/xml-components";

export class OutlineLevel extends XmlComponent {
    public constructor(public readonly level: number) {
        super("w:outlineLvl");

        this.root.push(
            new Attributes({
                val: level,
            }),
        );
    }
}
