// http://officeopenxml.com/WPsection.php
import { XmlComponent } from "file/xml-components";
import { IPageBordersOptions, IPageNumberTypeAttributes, PageBorders, PageNumberFormat, PageNumberType } from "./";
import { Columns } from "./columns/columns";
import { IColumnsAttributes } from "./columns/columns-attributes";
import { DocumentGrid } from "./doc-grid/doc-grid";
import { IDocGridAttributesProperties } from "./doc-grid/doc-grid-attributes";
import { FooterReference, IFooterOptions } from "./footer-reference/footer-reference";
import { HeaderReference, IHeaderOptions } from "./header-reference/header-reference";
import { PageMargin } from "./page-margin/page-margin";
import { IPageMarginAttributes } from "./page-margin/page-margin-attributes";
import { PageSize } from "./page-size/page-size";
import { IPageSizeAttributes, PageOrientation } from "./page-size/page-size-attributes";
import { TitlePage } from "./title-page/title-page";

interface IHeadersOptions {
    headers?: IHeaderOptions[];
}

interface IFootersOptions {
    footers?: IFooterOptions[];
}

export type SectionPropertiesOptions = IPageSizeAttributes &
    IPageMarginAttributes &
    IColumnsAttributes &
    IDocGridAttributesProperties &
    IHeadersOptions &
    IFootersOptions &
    IPageNumberTypeAttributes &
    IPageBordersOptions;

export class SectionProperties extends XmlComponent {
    private readonly options: SectionPropertiesOptions;

    constructor(options?: SectionPropertiesOptions) {
        super("w:sectPr");

        const defaultOptions = {
            width: 11906,
            height: 16838,
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
            header: 708,
            footer: 708,
            gutter: 0,
            mirror: false,
            space: 708,
            linePitch: 360,
            orientation: PageOrientation.PORTRAIT,
            headers: [],
            footers: [],
            pageNumberStart: undefined,
            pageNumberFormatType: PageNumberFormat.DECIMAL,
            pageBorders: undefined,
            pageBorderTop: undefined,
            pageBorderRight: undefined,
            pageBorderBottom: undefined,
            pageBorderLeft: undefined,
            titlePage: false,
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
        };

        this.root.push(new PageSize(mergedOptions.width, mergedOptions.height, mergedOptions.orientation));
        this.root.push(
            new PageMargin(
                mergedOptions.top,
                mergedOptions.right,
                mergedOptions.bottom,
                mergedOptions.left,
                mergedOptions.header,
                mergedOptions.footer,
                mergedOptions.gutter,
                mergedOptions.mirror,
            ),
        );
        this.root.push(new Columns(mergedOptions.space));
        this.root.push(new DocumentGrid(mergedOptions.linePitch));

        for (const header of mergedOptions.headers) {
            this.root.push(
                new HeaderReference({
                    headerType: header.headerType,
                    headerId: header.headerId,
                }),
            );
        }

        for (const footer of mergedOptions.footers) {
            this.root.push(
                new FooterReference({
                    footerType: footer.footerType,
                    footerId: footer.footerId,
                }),
            );
        }

        this.root.push(new PageNumberType(mergedOptions.pageNumberStart, mergedOptions.pageNumberFormatType));

        if (
            mergedOptions.pageBorders ||
            mergedOptions.pageBorderTop ||
            mergedOptions.pageBorderRight ||
            mergedOptions.pageBorderBottom ||
            mergedOptions.pageBorderLeft
        ) {
            this.root.push(
                new PageBorders({
                    pageBorders: mergedOptions.pageBorders,
                    pageBorderTop: mergedOptions.pageBorderTop,
                    pageBorderRight: mergedOptions.pageBorderRight,
                    pageBorderBottom: mergedOptions.pageBorderBottom,
                    pageBorderLeft: mergedOptions.pageBorderLeft,
                }),
            );
        }

        if (mergedOptions.titlePage) {
            this.root.push(new TitlePage());
        }

        this.options = mergedOptions;
    }

    public get Options(): SectionPropertiesOptions {
        return this.options;
    }
}
