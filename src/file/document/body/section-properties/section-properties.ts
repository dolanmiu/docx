// http://officeopenxml.com/WPsection.php
// tslint:disable: no-unnecessary-initializer

import { FooterWrapper } from "@file/footer-wrapper";
import { HeaderWrapper } from "@file/header-wrapper";
import { VerticalAlign, VerticalAlignElement } from "@file/vertical-align";
import { OnOffElement, XmlComponent } from "@file/xml-components";

import { HeaderFooterReference, HeaderFooterReferenceType, HeaderFooterType } from "./properties/header-footer-reference";

import { Columns, IColumnsAttributes } from "./properties/columns";
import { DocumentGrid, IDocGridAttributesProperties } from "./properties/doc-grid";
import { ILineNumberAttributes, LineNumberType } from "./properties/line-number";
import { IPageBordersOptions, PageBorders } from "./properties/page-borders";
import { IPageMarginAttributes, PageMargin } from "./properties/page-margin";
import { IPageNumberTypeAttributes, PageNumberType } from "./properties/page-number";
import { IPageSizeAttributes, PageOrientation, PageSize } from "./properties/page-size";
import { PageTextDirection, PageTextDirectionType } from "./properties/page-text-direction";
import { SectionType, Type } from "./properties/section-type";

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
        readonly textDirection?: PageTextDirectionType;
    };
    readonly grid?: IDocGridAttributesProperties;
    readonly headerWrapperGroup?: IHeaderFooterGroup<HeaderWrapper>;
    readonly footerWrapperGroup?: IHeaderFooterGroup<FooterWrapper>;
    readonly lineNumbers?: ILineNumberAttributes;
    readonly titlePage?: boolean;
    readonly verticalAlign?: VerticalAlign;
    readonly column?: IColumnsAttributes;
    readonly type?: SectionType;
}

// <xsd:complexType name="CT_SectPr">
//     <xsd:sequence>
//         <xsd:group ref="EG_HdrFtrReferences" minOccurs="0" maxOccurs="6"/>
//         <xsd:group ref="EG_SectPrContents" minOccurs="0"/>
//         <xsd:element name="sectPrChange" type="CT_SectPrChange" minOccurs="0"/>
//     </xsd:sequence>
//     <xsd:attributeGroup ref="AG_SectPrAttributes"/>
// </xsd:complexType>

// <xsd:group name="EG_SectPrContents">
// <xsd:sequence>
//   <xsd:element name="footnotePr" type="CT_FtnProps" minOccurs="0"/>
//   <xsd:element name="endnotePr" type="CT_EdnProps" minOccurs="0"/>
//   <xsd:element name="type" type="CT_SectType" minOccurs="0"/>
//   <xsd:element name="pgSz" type="CT_PageSz" minOccurs="0"/>
//   <xsd:element name="pgMar" type="CT_PageMar" minOccurs="0"/>
//   <xsd:element name="paperSrc" type="CT_PaperSource" minOccurs="0"/>
//   <xsd:element name="pgBorders" type="CT_PageBorders" minOccurs="0"/>
//   <xsd:element name="lnNumType" type="CT_LineNumber" minOccurs="0"/>
//   <xsd:element name="pgNumType" type="CT_PageNumber" minOccurs="0"/>
//   <xsd:element name="cols" type="CT_Columns" minOccurs="0"/>
//   <xsd:element name="formProt" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="vAlign" type="CT_VerticalJc" minOccurs="0"/>
//   <xsd:element name="noEndnote" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="titlePg" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="textDirection" type="CT_TextDirection" minOccurs="0"/>
//   <xsd:element name="bidi" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="rtlGutter" type="CT_OnOff" minOccurs="0"/>
//   <xsd:element name="docGrid" type="CT_DocGrid" minOccurs="0"/>
//   <xsd:element name="printerSettings" type="CT_Rel" minOccurs="0"/>
// </xsd:sequence>
// </xsd:group>

export const sectionMarginDefaults = {
    TOP: "1in",
    RIGHT: "1in",
    BOTTOM: "1in",
    LEFT: "1in",
    HEADER: 708,
    FOOTER: 708,
    GUTTER: 0,
};

export const sectionPageSizeDefaults = {
    WIDTH: 11906,
    HEIGHT: 16838,
    ORIENTATION: PageOrientation.PORTRAIT,
};

export class SectionProperties extends XmlComponent {
    public constructor({
        page: {
            size: {
                width = sectionPageSizeDefaults.WIDTH,
                height = sectionPageSizeDefaults.HEIGHT,
                orientation = sectionPageSizeDefaults.ORIENTATION,
            } = {},
            margin: {
                top = sectionMarginDefaults.TOP,
                right = sectionMarginDefaults.RIGHT,
                bottom = sectionMarginDefaults.BOTTOM,
                left = sectionMarginDefaults.LEFT,
                header = sectionMarginDefaults.HEADER,
                footer = sectionMarginDefaults.FOOTER,
                gutter = sectionMarginDefaults.GUTTER,
            } = {},
            pageNumbers = {},
            borders,
            textDirection,
        } = {},
        grid: { linePitch = 360, charSpace, type: gridType } = {},
        headerWrapperGroup = {},
        footerWrapperGroup = {},
        lineNumbers,
        titlePage,
        verticalAlign,
        column,
        type,
    }: ISectionPropertiesOptions = {}) {
        super("w:sectPr");

        this.addHeaderFooterGroup(HeaderFooterType.HEADER, headerWrapperGroup);
        this.addHeaderFooterGroup(HeaderFooterType.FOOTER, footerWrapperGroup);

        if (type) {
            this.root.push(new Type(type));
        }

        this.root.push(new PageSize(width, height, orientation));
        this.root.push(new PageMargin(top, right, bottom, left, header, footer, gutter));

        if (borders) {
            this.root.push(new PageBorders(borders));
        }

        if (lineNumbers) {
            this.root.push(new LineNumberType(lineNumbers));
        }

        this.root.push(new PageNumberType(pageNumbers));

        if (column) {
            this.root.push(new Columns(column));
        }

        if (verticalAlign) {
            this.root.push(new VerticalAlignElement(verticalAlign));
        }

        if (titlePage !== undefined) {
            this.root.push(new OnOffElement("w:titlePg", titlePage));
        }

        if (textDirection) {
            this.root.push(new PageTextDirection(textDirection));
        }

        this.root.push(new DocumentGrid(linePitch, charSpace, gridType));
    }

    private addHeaderFooterGroup(
        type: HeaderFooterType,
        group: IHeaderFooterGroup<HeaderWrapper> | IHeaderFooterGroup<FooterWrapper>,
    ): void {
        if (group.default) {
            this.root.push(
                new HeaderFooterReference(type, {
                    type: HeaderFooterReferenceType.DEFAULT,
                    id: group.default.View.ReferenceId,
                }),
            );
        }

        if (group.first) {
            this.root.push(
                new HeaderFooterReference(type, {
                    type: HeaderFooterReferenceType.FIRST,
                    id: group.first.View.ReferenceId,
                }),
            );
        }

        if (group.even) {
            this.root.push(
                new HeaderFooterReference(type, {
                    type: HeaderFooterReferenceType.EVEN,
                    id: group.even.View.ReferenceId,
                }),
            );
        }
    }
}
