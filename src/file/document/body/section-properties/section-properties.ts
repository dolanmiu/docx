// http://officeopenxml.com/WPsection.php
import { FooterWrapper } from "file/footer-wrapper";
import { HeaderWrapper } from "file/header-wrapper";
import { XmlComponent } from "file/xml-components";

import { Columns } from "./columns/columns";
import { DocumentGrid } from "./doc-grid/doc-grid";
import { IDocGridAttributesProperties } from "./doc-grid/doc-grid-attributes";
import { FooterReferenceType } from "./footer-reference";
import { FooterReference } from "./footer-reference/footer-reference";
import { HeaderReferenceType } from "./header-reference";
import { HeaderReference } from "./header-reference/header-reference";
import { ILineNumberAttributes, LineNumberType } from "./line-number";
import { IPageBordersOptions, PageBorders } from "./page-border";
import { PageMargin } from "./page-margin/page-margin";
import { IPageMarginAttributes } from "./page-margin/page-margin-attributes";
import { IPageNumberTypeAttributes, PageNumberType } from "./page-number";
import { PageSize } from "./page-size/page-size";
import { IPageSizeAttributes, PageOrientation } from "./page-size/page-size-attributes";
import { TitlePage } from "./title-page/title-page";
import { ISectionVerticalAlignAttributes, SectionVerticalAlign } from "./vertical-align";

export interface IHeaderFooterGroup<T> {
    readonly default?: T;
    readonly first?: T;
    readonly even?: T;
}

interface IHeadersOptions {
    readonly headers?: IHeaderFooterGroup<HeaderWrapper>;
}

interface IFootersOptions {
    readonly footers?: IHeaderFooterGroup<FooterWrapper>;
}

interface ITitlePageOptions {
    readonly titlePage?: boolean;
}

export type SectionPropertiesOptions = IPageSizeAttributes &
    IPageMarginAttributes &
    IDocGridAttributesProperties &
    IHeadersOptions &
    IFootersOptions &
    IPageNumberTypeAttributes &
    ILineNumberAttributes &
    IPageBordersOptions &
    ITitlePageOptions &
    ISectionVerticalAlignAttributes & {
        readonly column?: {
            readonly space?: number;
            readonly count?: number;
        };
    };
// Need to decouple this from the attributes

export class SectionProperties extends XmlComponent {
    private readonly options: SectionPropertiesOptions;

    constructor(options: SectionPropertiesOptions = { column: {} }) {
        super("w:sectPr");

        const {
            width = 11906,
            height = 16838,
            top = 1440,
            right = 1440,
            bottom = 1440,
            left = 1440,
            header = 708,
            footer = 708,
            gutter = 0,
            mirror = false,
            column = {},
            linePitch = 360,
            orientation = PageOrientation.PORTRAIT,
            headers,
            footers,
            pageNumberFormatType,
            pageNumberStart,
            lineNumberCountBy,
            lineNumberStart,
            lineNumberRestart,
            lineNumberDistance,
            pageBorders,
            pageBorderTop,
            pageBorderRight,
            pageBorderBottom,
            pageBorderLeft,
            titlePage = false,
            verticalAlign,
        } = options;

        this.options = options;
        this.root.push(new PageSize(width, height, orientation));
        this.root.push(new PageMargin(top, right, bottom, left, header, footer, gutter, mirror));
        this.root.push(new Columns(column.space ? column.space : 708, column.count ? column.count : 1));
        this.root.push(new DocumentGrid(linePitch));

        this.addHeaders(headers);
        this.addFooters(footers);

        if (pageNumberStart || pageNumberFormatType) {
            this.root.push(new PageNumberType(pageNumberStart, pageNumberFormatType));
        }

        if (lineNumberCountBy || lineNumberStart || lineNumberRestart || lineNumberDistance) {
            this.root.push(new LineNumberType(lineNumberCountBy, lineNumberStart, lineNumberRestart, lineNumberDistance));
        }

        if (pageBorders || pageBorderTop || pageBorderRight || pageBorderBottom || pageBorderLeft) {
            this.root.push(
                new PageBorders({
                    pageBorders: pageBorders,
                    pageBorderTop: pageBorderTop,
                    pageBorderRight: pageBorderRight,
                    pageBorderBottom: pageBorderBottom,
                    pageBorderLeft: pageBorderLeft,
                }),
            );
        }

        if (titlePage) {
            this.root.push(new TitlePage());
        }

        if (verticalAlign) {
            this.root.push(new SectionVerticalAlign(verticalAlign));
        }
    }

    private addHeaders(headers?: IHeaderFooterGroup<HeaderWrapper>): void {
        if (headers) {
            if (headers.default) {
                this.root.push(
                    new HeaderReference({
                        headerType: HeaderReferenceType.DEFAULT,
                        headerId: headers.default.Header.ReferenceId,
                    }),
                );
            }

            if (headers.first) {
                this.root.push(
                    new HeaderReference({
                        headerType: HeaderReferenceType.FIRST,
                        headerId: headers.first.Header.ReferenceId,
                    }),
                );
            }

            if (headers.even) {
                this.root.push(
                    new HeaderReference({
                        headerType: HeaderReferenceType.EVEN,
                        headerId: headers.even.Header.ReferenceId,
                    }),
                );
            }
        }
    }

    private addFooters(footers?: IHeaderFooterGroup<FooterWrapper>): void {
        if (footers) {
            if (footers.default) {
                this.root.push(
                    new FooterReference({
                        footerType: FooterReferenceType.DEFAULT,
                        footerId: footers.default.Footer.ReferenceId,
                    }),
                );
            }

            if (footers.first) {
                this.root.push(
                    new FooterReference({
                        footerType: FooterReferenceType.FIRST,
                        footerId: footers.first.Footer.ReferenceId,
                    }),
                );
            }

            if (footers.even) {
                this.root.push(
                    new FooterReference({
                        footerType: FooterReferenceType.EVEN,
                        footerId: footers.even.Footer.ReferenceId,
                    }),
                );
            }
        }
    }

    public get Options(): SectionPropertiesOptions {
        return this.options;
    }
}
