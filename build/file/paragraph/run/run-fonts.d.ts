import { XmlComponent } from "../../../file/xml-components";
export interface IFontAttributesProperties {
    readonly ascii?: string;
    readonly cs?: string;
    readonly eastAsia?: string;
    readonly hAnsi?: string;
    readonly hint?: string;
}
export declare class RunFonts extends XmlComponent {
    constructor(name: string, hint?: string);
    constructor(attrs: string | IFontAttributesProperties);
}
