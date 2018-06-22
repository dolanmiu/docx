// http://officeopenxml.com/WPsection.php
import { XmlComponent } from "file/xml-components";
import { FooterReferenceType, IPageNumberTypeAttributes, PageNumberFormat, PageNumberType } from "./";
import { Columns } from "./columns/columns";
import { IColumnsAttributes } from "./columns/columns-attributes";
import { DocumentGrid } from "./doc-grid/doc-grid";
import { IDocGridAttributesProperties } from "./doc-grid/doc-grid-attributes";
import { FooterOptions, FooterReference } from "./footer-reference/footer-reference";
import { HeaderOptions, HeaderReference } from "./header-reference/header-reference";
import { HeaderReferenceType } from "./header-reference/header-reference-attributes";
import { PageMargin } from "./page-margin/page-margin";
import { IPageMarginAttributes } from "./page-margin/page-margin-attributes";
import { PageSize } from "./page-size/page-size";
import { IPageSizeAttributes, PageOrientation } from "./page-size/page-size-attributes";
import { TitlePage } from "./title-page/title-page";

export type SectionPropertiesOptions = IPageSizeAttributes &
    IPageMarginAttributes &
    IColumnsAttributes &
    IDocGridAttributesProperties &
    HeaderOptions &
    FooterOptions &
    IPageNumberTypeAttributes;

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
            differentFirstPageHeader: false,
            headerType: HeaderReferenceType.DEFAULT,
            headerId: 0,
            footerType: FooterReferenceType.DEFAULT,
            footerId: 0,
            pageNumberStart: undefined,
            pageNumberFormatType: PageNumberFormat.DECIMAL,
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

        if (mergedOptions.differentFirstPageHeader) {
            this.root.push(
                new HeaderReference({
                    headerType: HeaderReferenceType.FIRST,
                    headerId: 5,
                }),
            );
            this.root.push(new TitlePage());
        }

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

        this.options = mergedOptions;
    }

    get Options(): SectionPropertiesOptions {
        return this.options;
    }
}
