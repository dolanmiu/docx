// http://officeopenxml.com/WPtableBorders.php
import { BorderStyle } from "file/styles";
import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

export interface ITableBordersOptions {
    readonly top?: {
        readonly style: BorderStyle;
        readonly size: number;
        readonly color: string;
    };
    readonly bottom?: {
        readonly style: BorderStyle;
        readonly size: number;
        readonly color: string;
    };
    readonly left?: {
        readonly style: BorderStyle;
        readonly size: number;
        readonly color: string;
    };
    readonly right?: {
        readonly style: BorderStyle;
        readonly size: number;
        readonly color: string;
    };
    readonly insideHorizontal?: {
        readonly style: BorderStyle;
        readonly size: number;
        readonly color: string;
    };
    readonly insideVertical?: {
        readonly style: BorderStyle;
        readonly size: number;
        readonly color: string;
    };
}

export class TableBorders extends XmlComponent {
    public static readonly NONE = {
        top: {
            style: BorderStyle.NONE,
            size: 0,
            color: "auto",
        },
        bottom: {
            style: BorderStyle.NONE,
            size: 0,
            color: "auto",
        },
        left: {
            style: BorderStyle.NONE,
            size: 0,
            color: "auto",
        },
        right: {
            style: BorderStyle.NONE,
            size: 0,
            color: "auto",
        },
        insideHorizontal: {
            style: BorderStyle.NONE,
            size: 0,
            color: "auto",
        },
        insideVertical: {
            style: BorderStyle.NONE,
            size: 0,
            color: "auto",
        },
    };

    constructor(options: ITableBordersOptions) {
        super("w:tblBorders");

        if (options.top) {
            this.root.push(new TableBordersElement("w:top", options.top.style, options.top.size, 0, options.top.color));
        } else {
            this.root.push(new TableBordersElement("w:top", BorderStyle.SINGLE, 4, 0, "auto"));
        }

        if (options.left) {
            this.root.push(new TableBordersElement("w:left", options.left.style, options.left.size, 0, options.left.color));
        } else {
            this.root.push(new TableBordersElement("w:left", BorderStyle.SINGLE, 4, 0, "auto"));
        }

        if (options.bottom) {
            this.root.push(new TableBordersElement("w:bottom", options.bottom.style, options.bottom.size, 0, options.bottom.color));
        } else {
            this.root.push(new TableBordersElement("w:bottom", BorderStyle.SINGLE, 4, 0, "auto"));
        }

        if (options.right) {
            this.root.push(new TableBordersElement("w:right", options.right.style, options.right.size, 0, options.right.color));
        } else {
            this.root.push(new TableBordersElement("w:right", BorderStyle.SINGLE, 4, 0, "auto"));
        }

        if (options.insideHorizontal) {
            this.root.push(
                new TableBordersElement(
                    "w:insideH",
                    options.insideHorizontal.style,
                    options.insideHorizontal.size,
                    0,
                    options.insideHorizontal.color,
                ),
            );
        } else {
            this.root.push(new TableBordersElement("w:insideH", BorderStyle.SINGLE, 4, 0, "auto"));
        }

        if (options.insideVertical) {
            this.root.push(
                new TableBordersElement(
                    "w:insideV",
                    options.insideVertical.style,
                    options.insideVertical.size,
                    0,
                    options.insideVertical.color,
                ),
            );
        } else {
            this.root.push(new TableBordersElement("w:insideV", BorderStyle.SINGLE, 4, 0, "auto"));
        }
    }
}

class TableBordersElement extends XmlComponent {
    constructor(elementName: string, value: string, size: number, space: number, color: string) {
        super(elementName);
        this.root.push(
            new TableBordersAttributes({
                value,
                size,
                space,
                color,
            }),
        );
    }
}

class TableBordersAttributes extends XmlAttributeComponent<{
    readonly value: string;
    readonly size: number;
    readonly space: number;
    readonly color: string;
}> {
    protected readonly xmlKeys = {
        value: "w:val",
        size: "w:sz",
        space: "w:space",
        color: "w:color",
    };
}
