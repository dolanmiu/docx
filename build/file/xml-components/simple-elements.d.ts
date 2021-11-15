import { XmlComponent } from "../../file/xml-components";
export declare class OnOffElement extends XmlComponent {
    constructor(name: string, val?: boolean | undefined);
}
export declare class HpsMeasureElement extends XmlComponent {
    constructor(name: string, val: number | string);
}
export declare class StringValueElement extends XmlComponent {
    constructor(name: string, val: string);
}
export declare class NumberValueElement extends XmlComponent {
    constructor(name: string, val: number);
}
export declare class StringContainer extends XmlComponent {
    constructor(name: string, val: string);
}
