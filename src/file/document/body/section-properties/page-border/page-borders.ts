// http://officeopenxml.com/WPsectionBorders.php
import { BorderElement, IBorderOptions } from "file/border";
import { IgnoreIfEmptyXmlComponent, XmlAttributeComponent } from "file/xml-components";

export enum PageBorderDisplay {
    ALL_PAGES = "allPages",
    FIRST_PAGE = "firstPage",
    NOT_FIRST_PAGE = "notFirstPage",
}

export enum PageBorderOffsetFrom {
    PAGE = "page",
    TEXT = "text",
}

export enum PageBorderZOrder {
    BACK = "back",
    FRONT = "front",
}

export interface IPageBorderAttributes {
    readonly display?: PageBorderDisplay;
    readonly offsetFrom?: PageBorderOffsetFrom;
    readonly zOrder?: PageBorderZOrder;
}

export interface IPageBordersOptions {
    readonly pageBorders?: IPageBorderAttributes;
    readonly pageBorderTop?: IBorderOptions;
    readonly pageBorderRight?: IBorderOptions;
    readonly pageBorderBottom?: IBorderOptions;
    readonly pageBorderLeft?: IBorderOptions;
}

class PageBordersAttributes extends XmlAttributeComponent<IPageBorderAttributes> {
    protected readonly xmlKeys = {
        display: "w:display",
        offsetFrom: "w:offsetFrom",
        zOrder: "w:zOrder",
    };
}

export class PageBorders extends IgnoreIfEmptyXmlComponent {
    constructor(options?: IPageBordersOptions) {
        super("w:pgBorders");

        if (!options) {
            return;
        }

        if (options.pageBorders) {
            this.root.push(
                new PageBordersAttributes({
                    display: options.pageBorders.display,
                    offsetFrom: options.pageBorders.offsetFrom,
                    zOrder: options.pageBorders.zOrder,
                }),
            );
        } else {
            this.root.push(new PageBordersAttributes({}));
        }

        if (options.pageBorderTop) {
            this.root.push(new BorderElement("w:top", options.pageBorderTop));
        }
        if (options.pageBorderRight) {
            this.root.push(new BorderElement("w:right", options.pageBorderRight));
        }
        if (options.pageBorderBottom) {
            this.root.push(new BorderElement("w:bottom", options.pageBorderBottom));
        }
        if (options.pageBorderLeft) {
            this.root.push(new BorderElement("w:left", options.pageBorderLeft));
        }
    }
}
