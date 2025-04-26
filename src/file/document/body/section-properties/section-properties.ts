// http://officeopenxml.com/WPsection.php

import { FooterWrapper } from "@file/footer-wrapper";
import { HeaderWrapper } from "@file/header-wrapper";
import { SectionVerticalAlign, VerticalAlignElement } from "@file/vertical-align";
import { OnOffElement, XmlComponent } from "@file/xml-components";

import { Columns, IColumnsAttributes } from "./properties/columns";
import { IDocGridAttributesProperties, createDocumentGrid } from "./properties/doc-grid";
import { HeaderFooterReference, HeaderFooterReferenceType, HeaderFooterType } from "./properties/header-footer-reference";
import { ILineNumberAttributes, createLineNumberType } from "./properties/line-number";
import { IPageBordersOptions, PageBorders } from "./properties/page-borders";
import { IPageMarginAttributes, PageMargin } from "./properties/page-margin";
import { IPageNumberTypeAttributes, PageNumberType } from "./properties/page-number";
import { IPageSizeAttributes, PageOrientation, createPageSize } from "./properties/page-size";
import { PageTextDirection, PageTextDirectionType } from "./properties/page-text-direction";
import { SectionType, Type } from "./properties/section-type";

export type IHeaderFooterGroup<T> = {
    readonly default?: T;
    readonly first?: T;
    readonly even?: T;
};

export type ISectionPropertiesOptions = {
    readonly page?: {
        readonly size?: Partial<IPageSizeAttributes>;
        readonly margin?: IPageMarginAttributes;
        readonly pageNumbers?: IPageNumberTypeAttributes;
        readonly borders?: IPageBordersOptions;
        readonly textDirection?: (typeof PageTextDirectionType)[keyof typeof PageTextDirectionType];
    };
    readonly grid?: Partial<IDocGridAttributesProperties>;
    readonly headerWrapperGroup?: IHeaderFooterGroup<HeaderWrapper>;
    readonly footerWrapperGroup?: IHeaderFooterGroup<FooterWrapper>;
    readonly lineNumbers?: ILineNumberAttributes;
    readonly titlePage?: boolean;
    readonly verticalAlign?: SectionVerticalAlign;
    readonly column?: IColumnsAttributes;
    readonly type?: (typeof SectionType)[keyof typeof SectionType];
};

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
    TOP: 1440,
    RIGHT: 1440,
    BOTTOM: 1440,
    LEFT: 1440,
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

        this.root.push(createPageSize({ width, height, orientation }));
        this.root.push(new PageMargin(top, right, bottom, left, header, footer, gutter));

        if (borders) {
            this.root.push(new PageBorders(borders));
        }

        if (lineNumbers) {
            this.root.push(createLineNumberType(lineNumbers));
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

        this.root.push(createDocumentGrid({ linePitch, charSpace, type: gridType }));
    }

    private addHeaderFooterGroup(
        type: (typeof HeaderFooterType)[keyof typeof HeaderFooterType],
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
