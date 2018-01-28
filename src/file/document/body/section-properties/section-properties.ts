// http://officeopenxml.com/WPsection.php
import { IColumnsAttributes } from "file/document/body/section-properties/columns/columns-attributes";
import { IPageMarginAttributes } from "file/document/body/section-properties/page-margin/page-margin-attributes";
import { IPageSizeAttributes } from "file/document/body/section-properties/page-size/page-size-attributes";
import { XmlComponent } from "file/xml-components";
import { Columns } from "./columns/columns";
import { DocumentGrid } from "./doc-grid/doc-grid";
import { IDocGridAttributesProperties } from "./doc-grid/doc-grid-attributes";
import { PageMargin } from "./page-margin/page-margin";
import { PageSize } from "./page-size/page-size";

export type SectionPropertiesOptions = IPageSizeAttributes & IPageMarginAttributes & IColumnsAttributes & IDocGridAttributesProperties;

export class SectionProperties extends XmlComponent {
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
            orientation: "portrait",
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
    }
}
