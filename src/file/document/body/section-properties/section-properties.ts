// http://officeopenxml.com/WPsection.php
import { XmlComponent } from "file/xml-components";
import { Columns } from "./columns/columns";
import { IColumnsAttributes } from "./columns/columns-attributes";
import { DocumentGrid } from "./doc-grid/doc-grid";
import { IDocGridAttributesProperties } from "./doc-grid/doc-grid-attributes";
import { FooterReference, FooterOptions } from "./footer-reference/footer-reference";
import { HeaderReference, HeaderOptions } from "./header-reference/header-reference";
import { PageMargin } from "./page-margin/page-margin";
import { IPageMarginAttributes } from "./page-margin/page-margin-attributes";
import { PageSize } from "./page-size/page-size";
import { IPageSizeAttributes, PageOrientation } from "./page-size/page-size-attributes";
import { FooterReferenceType, IPageNumberTypeAttributes, PageNumberType, PageNumberFormat, PageBordersOptions, PageBorders } from ".";
import { HeaderReferenceType } from "./header-reference/header-reference-attributes";

export type SectionPropertiesOptions = IPageSizeAttributes &
    IPageMarginAttributes &
    IColumnsAttributes &
    IDocGridAttributesProperties &
    HeaderOptions &
    FooterOptions &
    IPageNumberTypeAttributes &
    PageBordersOptions;

export class SectionProperties extends XmlComponent {
    private options: SectionPropertiesOptions;
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
            space: 708,
            linePitch: 360,
            orientation: PageOrientation.PORTRAIT,
            headerType: HeaderReferenceType.DEFAULT,
            headerId: 0,
            footerType: FooterReferenceType.DEFAULT,
            footerId: 0,
            pageNumberStart: undefined,
            pageNumberFormatType: PageNumberFormat.DECIMAL,
            pageBorders: undefined,
            pageBorderTop: undefined,
            pageBorderRight: undefined,
            pageBorderBottom: undefined,
            pageBorderLeft: undefined,
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
            ),
        );
        this.root.push(new Columns(mergedOptions.space));
        this.root.push(new DocumentGrid(mergedOptions.linePitch));
        this.root.push(
            new HeaderReference({
                headerType: mergedOptions.headerType,
                headerId: mergedOptions.headerId,
            }),
        );
        this.root.push(
            new FooterReference({
                footerType: mergedOptions.footerType,
                footerId: mergedOptions.footerId,
            }),
        );

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

        this.options = mergedOptions;
    }

    get Options() {
        return this.options;
    }
}
