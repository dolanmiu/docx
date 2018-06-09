// http://officeopenxml.com/drwPicFloating-position.php
import { XmlComponent, XmlAttributeComponent } from "file/xml-components";

interface ISimplePosAttributes {
    x: number;
    y: number;
}

class SimplePosAttributes extends XmlAttributeComponent<ISimplePosAttributes> {
    protected xmlKeys = {
        x: "x",
        y: "y",
    };
}

export class SimplePos extends XmlComponent {
    constructor() {
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
