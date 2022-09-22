// http://officeopenxml.com/drwPicFloating-position.php
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

class SimplePosAttributes extends XmlAttributeComponent<{
    readonly x: number;
    readonly y: number;
}> {
    protected readonly xmlKeys = {
        x: "x",
        y: "y",
    };
}

export class SimplePos extends XmlComponent {
    public constructor() {
        super("wp:simplePos");

        // NOTE: It's not fully supported in Microsoft Word, but this element is needed anyway
        this.root.push(
            new SimplePosAttributes({
                x: 0,
                y: 0,
            }),
        );
    }
}
