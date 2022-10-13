// http://officeopenxml.com/WPtableBorders.php
import { BorderElement, BorderStyle, IBorderOptions } from "@file/border";
import { XmlComponent } from "@file/xml-components";

export interface ITableBordersOptions {
    readonly top?: IBorderOptions;
    readonly bottom?: IBorderOptions;
    readonly left?: IBorderOptions;
    readonly right?: IBorderOptions;
    readonly insideHorizontal?: IBorderOptions;
    readonly insideVertical?: IBorderOptions;
}

const NONE_BORDER = {
    style: BorderStyle.NONE,
    size: 0,
    color: "auto",
};

const DEFAULT_BORDER = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: "auto",
};

export class TableBorders extends XmlComponent {
    public static readonly NONE = {
        top: NONE_BORDER,
        bottom: NONE_BORDER,
        left: NONE_BORDER,
        right: NONE_BORDER,
        insideHorizontal: NONE_BORDER,
        insideVertical: NONE_BORDER,
    };

    public constructor(options: ITableBordersOptions) {
        super("w:tblBorders");

        if (options.top) {
            this.root.push(new BorderElement("w:top", options.top));
        } else {
            this.root.push(new BorderElement("w:top", DEFAULT_BORDER));
        }

        if (options.left) {
            this.root.push(new BorderElement("w:left", options.left));
        } else {
            this.root.push(new BorderElement("w:left", DEFAULT_BORDER));
        }

        if (options.bottom) {
            this.root.push(new BorderElement("w:bottom", options.bottom));
        } else {
            this.root.push(new BorderElement("w:bottom", DEFAULT_BORDER));
        }

        if (options.right) {
            this.root.push(new BorderElement("w:right", options.right));
        } else {
            this.root.push(new BorderElement("w:right", DEFAULT_BORDER));
        }

        if (options.insideHorizontal) {
            this.root.push(new BorderElement("w:insideH", options.insideHorizontal));
        } else {
            this.root.push(new BorderElement("w:insideH", DEFAULT_BORDER));
        }

        if (options.insideVertical) {
            this.root.push(new BorderElement("w:insideV", options.insideVertical));
        } else {
            this.root.push(new BorderElement("w:insideV", DEFAULT_BORDER));
        }
    }
}
