// http://officeopenxml.com/WPborders.php
import { BorderElement, BorderStyle, IBorderOptions } from "@file/border";
import { IgnoreIfEmptyXmlComponent, XmlComponent } from "@file/xml-components";

export interface IBordersOptions {
    readonly top?: IBorderOptions;
    readonly bottom?: IBorderOptions;
    readonly left?: IBorderOptions;
    readonly right?: IBorderOptions;
}

export class Border extends IgnoreIfEmptyXmlComponent {
    public constructor(options: IBordersOptions) {
        super("w:pBdr");

        if (options.top) {
            this.root.push(new BorderElement("w:top", options.top));
        }

        if (options.bottom) {
            this.root.push(new BorderElement("w:bottom", options.bottom));
        }

        if (options.left) {
            this.root.push(new BorderElement("w:left", options.left));
        }

        if (options.right) {
            this.root.push(new BorderElement("w:right", options.right));
        }
    }
}

export class ThematicBreak extends XmlComponent {
    public constructor() {
        super("w:pBdr");
        const bottom = new BorderElement("w:bottom", {
            color: "auto",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
        });
        this.root.push(bottom);
    }
}
