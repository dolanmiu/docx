// http://officeopenxml.com/WPsection.php
// tslint:disable: no-unnecessary-initializer

import { convertInchesToTwip } from "convenience-functions";
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
import { Type } from "./type/section-type";
import { SectionType } from "./type/section-type-attributes";
import { SectionVerticalAlign, SectionVerticalAlignValue } from "./vertical-align";

export interface IHeaderFooterGroup<T> {
    readonly default?: T;
    readonly first?: T;
    readonly even?: T;
}

export interface ISectionPropertiesOptions {
    readonly page?: {
        readonly size?: IPageSizeAttributes;
        readonly margin?: IPageMarginAttributes;
        readonly pageNumbers?: IPageNumberTypeAttributes;
        readonly borders?: IPageBordersOptions;
    };
    readonly grid?: IDocGridAttributesProperties;
    readonly headerWrapperGroup?: IHeaderFooterGroup<HeaderWrapper>;
    readonly footerWrapperGroup?: IHeaderFooterGroup<FooterWrapper>;
    readonly lineNumbers?: ILineNumberAttributes;
    readonly titlePage?: boolean;
    readonly verticalAlign?: SectionVerticalAlignValue;
    readonly column?: {
        readonly space?: number;
        readonly count?: number;
        readonly separate?: boolean;
    };
    readonly type?: SectionType;
}
export class SectionProperties extends XmlComponent {
    constructor({
        page: {
            size: { width = 11906, height = 16838, orientation = PageOrientation.PORTRAIT } = {},
            margin: {
                top = convertInchesToTwip(1),
                right = convertInchesToTwip(1),
                bottom = convertInchesToTwip(1),
                left = convertInchesToTwip(1),
                header = 708,
                footer = 708,
                gutter = 0,
                mirror = false,
            } = {},
            pageNumbers: {
                start: pageNumberStart = undefined,
                formatType: pageNumberFormatType = undefined,
                separator: pageNumberSeparator = undefined,
            } = {},
            borders: {
                pageBorders = undefined,
                pageBorderTop = undefined,
                pageBorderRight = undefined,
                pageBorderBottom = undefined,
                pageBorderLeft = undefined,
            } = {},
        } = {},
        grid: { linePitch = 360 } = {},
        headerWrapperGroup = {},
        footerWrapperGroup = {},
        lineNumbers: { countBy: lineNumberCountBy, start: lineNumberStart, restart: lineNumberRestart, distance: lineNumberDistance } = {},
        titlePage = false,
        verticalAlign,
        column: { space = 708, count = 1, separate = false } = {},
        type,
    }: ISectionPropertiesOptions = {}) {
        super("w:sectPr");

        this.root.push(new PageSize(width, height, orientation));
        this.root.push(new PageMargin(top, right, bottom, left, header, footer, gutter, mirror));
        this.root.push(new Columns(space, count, separate));
        this.root.push(new DocumentGrid(linePitch));

        this.addHeaders(headerWrapperGroup);
        this.addFooters(footerWrapperGroup);

        this.root.push(new PageNumberType(pageNumberStart, pageNumberFormatType, pageNumberSeparator));

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

        if (type) {
            this.root.push(new Type(type));
        }
    }

    private addHeaders(headers: IHeaderFooterGroup<HeaderWrapper>): void {
        if (headers.default) {
            this.root.push(
                new HeaderReference({
                    headerType: HeaderReferenceType.DEFAULT,
                    headerId: headers.default.View.ReferenceId,
                }),
            );
        }

        if (headers.first) {
            this.root.push(
                new HeaderReference({
                    headerType: HeaderReferenceType.FIRST,
                    headerId: headers.first.View.ReferenceId,
                }),
            );
        }

        if (headers.even) {
            this.root.push(
                new HeaderReference({
                    headerType: HeaderReferenceType.EVEN,
                    headerId: headers.even.View.ReferenceId,
                }),
            );
        }
    }

    private addFooters(footers: IHeaderFooterGroup<FooterWrapper>): void {
        if (footers.default) {
            this.root.push(
                new FooterReference({
                    footerType: FooterReferenceType.DEFAULT,
                    footerId: footers.default.View.ReferenceId,
                }),
            );
        }

        if (footers.first) {
            this.root.push(
                new FooterReference({
                    footerType: FooterReferenceType.FIRST,
                    footerId: footers.first.View.ReferenceId,
                }),
            );
        }

        if (footers.even) {
            this.root.push(
                new FooterReference({
                    footerType: FooterReferenceType.EVEN,
                    footerId: footers.even.View.ReferenceId,
                }),
            );
        }
    }
}
