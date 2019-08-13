// http://officeopenxml.com/WPborders.php
import { XmlComponent } from "file/xml-components";
import { BorderAttributes } from "./border-attributes";

interface IBorderPropertyOptions {
    readonly color: string;
    readonly space: number;
    readonly value: string;
    readonly size: number;
}

export interface IBorderOptions {
    readonly top?: IBorderPropertyOptions;
    readonly bottom?: IBorderPropertyOptions;
    readonly left?: IBorderPropertyOptions;
    readonly right?: IBorderPropertyOptions;
}

class BorderProperty extends XmlComponent {
    constructor(rootKey: string, options: IBorderPropertyOptions = { color: "auto", space: 1, value: "single", size: 6 }) {
        super(rootKey);

        const attrs = new BorderAttributes({
            color: options.color,
            space: options.space,
            val: options.value,
            sz: options.size,
        });
        this.root.push(attrs);
    }
}

export class Border extends XmlComponent {
    constructor(options: IBorderOptions) {
        super("w:pBdr");

        if (options.top !== undefined) {
            const borderProperty = new BorderProperty("w:top", options.top);
            this.root.push(borderProperty);
        }

        if (options.bottom !== undefined) {
            const borderProperty = new BorderProperty("w:bottom", options.bottom);
            this.root.push(borderProperty);
        }

        if (options.left !== undefined) {
            const borderProperty = new BorderProperty("w:left", options.left);
            this.root.push(borderProperty);
        }

        if (options.right !== undefined) {
            const borderProperty = new BorderProperty("w:right", options.right);
            this.root.push(borderProperty);
        }
    }
}

export class ThematicBreak extends XmlComponent {
    constructor() {
        super("w:pBdr");
        const bottom = new BorderProperty("w:bottom", {
            color: "auto",
            space: 1,
            value: "single",
            size: 6,
        });
        this.root.push(bottom);
    }
}
