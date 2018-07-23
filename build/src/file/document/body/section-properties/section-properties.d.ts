import { XmlComponent } from "file/xml-components";
import { IPageNumberTypeAttributes } from "./";
import { IColumnsAttributes } from "./columns/columns-attributes";
import { IDocGridAttributesProperties } from "./doc-grid/doc-grid-attributes";
import { IFooterOptions } from "./footer-reference/footer-reference";
import { IHeaderOptions } from "./header-reference/header-reference";
import { IPageMarginAttributes } from "./page-margin/page-margin-attributes";
import { IPageSizeAttributes } from "./page-size/page-size-attributes";
export declare type SectionPropertiesOptions = IPageSizeAttributes & IPageMarginAttributes & IColumnsAttributes & IDocGridAttributesProperties & IHeaderOptions & IFooterOptions & IPageNumberTypeAttributes;
export declare class SectionProperties extends XmlComponent {
    private options;
    constructor(options?: SectionPropertiesOptions);
    readonly Options: SectionPropertiesOptions;
}
