import { XmlComponent } from "file/xml-components";
import { HeaderReferenceType } from "./header-reference-attributes";
export interface IHeaderOptions {
    headerType?: HeaderReferenceType;
    headerId?: number;
}
export declare class HeaderReference extends XmlComponent {
    constructor(options: IHeaderOptions);
}
