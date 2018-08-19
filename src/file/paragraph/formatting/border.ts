// http://officeopenxml.com/WPborders.php
import { Attributes, XmlComponent } from "file/xml-components";

class BorderProperty extends XmlComponent {
    public setProperties(space: string, value: string, size: string): XmlComponent {
        const attrs = new Attributes({
            space: space,
            val: value,
            sz: size
        });
        this.root.push(attrs);

        return this;
    }
}

export class Border extends XmlComponent {
    constructor() {
        super("w:pBdr");
    }

    public addTopBorder(space: string = "1", value: string = "single", size: string = "6"): XmlComponent {
        const top = new BorderProperty("w:top");
        top.setProperties(space, value, size);
        this.root.push(top);

        return this;
    }

    public addBottomBorder(space: string = "1", value: string = "single", size: string = "6"): XmlComponent {
        const bottom = new BorderProperty("w:bottom");
        bottom.setProperties(space, value, size);
        this.root.push(bottom);

        return this;
    }

    public addLeftBorder(space: string = "1", value: string = "single", size: string = "6"): XmlComponent {
        const left = new BorderProperty("w:left");
        left.setProperties(space, value, size);
        this.root.push(left);

        return this;
    }

    public addRightBorder(space: string = "1", value: string = "single", size: string = "6"): XmlComponent {
        const right = new BorderProperty("w:right");
        right.setProperties(space, value, size);
        this.root.push(right);

        return this;
    }
}

export class ThematicBreak extends XmlComponent {
    constructor() {
        super("w:pBdr");
        const bottom = new BorderProperty("w:bottom");
        this.root.push(bottom);
    }
}
