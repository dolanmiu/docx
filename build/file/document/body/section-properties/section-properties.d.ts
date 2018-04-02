import { XmlComponent } from "../../../../file/xml-components";
import { IColumnsAttributes } from "./columns/columns-attributes";
import { IDocGridAttributesProperties } from "./doc-grid/doc-grid-attributes";
import { IPageMarginAttributes } from "./page-margin/page-margin-attributes";
import { IPageSizeAttributes } from "./page-size/page-size-attributes";
export declare type SectionPropertiesOptions = IPageSizeAttributes & IPageMarginAttributes & IColumnsAttributes & IDocGridAttributesProperties;
export declare class SectionProperties extends XmlComponent {
    constructor(options?: SectionPropertiesOptions);
}
