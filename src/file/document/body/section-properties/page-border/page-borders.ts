// http://officeopenxml.com/WPsectionBorders.php
import { IXmlableObject, XmlAttributeComponent, XmlComponent } from "file/xml-components";
import { BorderStyle } from "../../../../styles";

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
    display?: PageBorderDisplay;
    offsetFrom?: PageBorderOffsetFrom;
    zOrder?: PageBorderZOrder;
}

export interface IPageBorderConfiguration {
    style?: BorderStyle;
    size?: number;
    color?: string;
    space?: number;
}

export interface IPageBordersOptions {
    pageBorders?: IPageBorderAttributes;
    pageBorderTop?: IPageBorderConfiguration;
    pageBorderRight?: IPageBorderConfiguration;
    pageBorderBottom?: IPageBorderConfiguration;
    pageBorderLeft?: IPageBorderConfiguration;
}

class PageBordeAttributes extends XmlAttributeComponent<IPageBorderConfiguration> {
    protected xmlKeys = {
        style: "w:val",
        size: "w:size",
        color: "w:color",
        space: "w:space",
    };
}

class PageBorder extends XmlComponent {
    constructor(key: string, options: IPageBorderConfiguration) {
        super(key);

        this.root.push(new PageBordeAttributes(options));
    }
}

class PageBordersAttributes extends XmlAttributeComponent<IPageBorderAttributes> {
    protected xmlKeys = {
        display: "w:display",
        offsetFrom: "w:offsetFrom",
        zOrder: "w:zOrder",
    };
}

export class PageBorders extends XmlComponent {
    constructor(options?: IPageBordersOptions) {
        super("w:pgBorders");

        if (!options) {
            return;
        }

        let pageBordersAttributes = {};

        if (options.pageBorders) {
            pageBordersAttributes = {
                display: options.pageBorders.display,
                offsetFrom: options.pageBorders.offsetFrom,
                zOrder: options.pageBorders.zOrder,
            };
        }

        this.root.push(new PageBordersAttributes(pageBordersAttributes));

        if (options.pageBorderTop) {
            this.root.push(new PageBorder("w:top", options.pageBorderTop));
        }
        if (options.pageBorderRight) {
            this.root.push(new PageBorder("w:right", options.pageBorderRight));
        }
        if (options.pageBorderBottom) {
            this.root.push(new PageBorder("w:bottom", options.pageBorderBottom));
        }
        if (options.pageBorderLeft) {
            this.root.push(new PageBorder("w:left", options.pageBorderLeft));
        }
    }

    public prepForXml(): IXmlableObject {
        return this.root.length > 0 ? super.prepForXml() : "";
    }
}
