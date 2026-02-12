// http://officeopenxml.com/WPborders.php
import { BorderStyle, IBorderOptions, createBorderElement } from "@file/border";
import { IgnoreIfEmptyXmlComponent, XmlComponent } from "@file/xml-components";

export type IBordersOptions = {
    readonly top?: IBorderOptions;
    readonly bottom?: IBorderOptions;
    readonly left?: IBorderOptions;
    readonly right?: IBorderOptions;
    readonly between?: IBorderOptions;
};

export class Border extends IgnoreIfEmptyXmlComponent {
    public constructor(options: IBordersOptions) {
        super("w:pBdr");

        if (options.top) {
            this.root.push(createBorderElement("w:top", options.top));
        }

        if (options.bottom) {
            this.root.push(createBorderElement("w:bottom", options.bottom));
        }

        if (options.left) {
            this.root.push(createBorderElement("w:left", options.left));
        }

        if (options.right) {
            this.root.push(createBorderElement("w:right", options.right));
        }

        if (options.between) {
            this.root.push(createBorderElement("w:between", options.between));
        }
    }
}

export class ThematicBreak extends XmlComponent {
    public constructor() {
        super("w:pBdr");
        const bottom = createBorderElement("w:bottom", {
            color: "auto",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
        });
        this.root.push(bottom);
    }
}
