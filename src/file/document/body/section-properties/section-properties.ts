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
    constructor(options: SectionPropertiesOptions) {
        super("w:sectPr");

        this.root.push(new PageSize(11906, 16838));
        this.root.push(new PageMargin(1440, 1440, 1440, 1440, 708, 708, 0));
        this.root.push(new Columns(708));
        this.root.push(new DocumentGrid(308));
    }
}
