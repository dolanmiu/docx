// http://officeopenxml.com/WPsectionBorders.php
import { BorderStyle } from "file/styles";
import { IXmlableObject, XmlAttributeComponent, XmlComponent } from "file/xml-components";

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

export interface IPageBorderConfiguration {
    readonly style?: BorderStyle;
    readonly size?: number;
    readonly color?: string;
    readonly space?: number;
}

export interface IPageBordersOptions {
    readonly pageBorders?: IPageBorderAttributes;
    readonly pageBorderTop?: IPageBorderConfiguration;
    readonly pageBorderRight?: IPageBorderConfiguration;
    readonly pageBorderBottom?: IPageBorderConfiguration;
    readonly pageBorderLeft?: IPageBorderConfiguration;
}

class PageBordeAttributes extends XmlAttributeComponent<IPageBorderConfiguration> {
    protected readonly xmlKeys = {
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
    protected readonly xmlKeys = {
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

    public prepForXml(): IXmlableObject | undefined {
        if (this.root.length > 0) {
            return super.prepForXml();
        }
    }
}
