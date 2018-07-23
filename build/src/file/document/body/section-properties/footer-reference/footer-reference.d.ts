import { XmlComponent } from "file/xml-components";
import { FooterReferenceType } from "./footer-reference-attributes";
export interface IFooterOptions {
    footerType?: FooterReferenceType;
    footerId?: number;
}
export declare class FooterReference extends XmlComponent {
    constructor(options: IFooterOptions);
}
