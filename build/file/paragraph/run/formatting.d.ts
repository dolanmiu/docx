import { XmlComponent } from "../../../file/xml-components";
export { Underline } from "./underline";
export { EmphasisMark } from "./emphasis-mark";
export { SubScript, SuperScript } from "./script";
export { RunFonts, IFontAttributesProperties } from "./run-fonts";
export declare class Bold extends XmlComponent {
    constructor();
}
export declare class BoldWithExactValue extends XmlComponent {
    constructor(value: string);
}
export declare class BoldComplexScript extends XmlComponent {
    constructor();
}
export declare class CharacterSpacing extends XmlComponent {
    constructor(value: number | string);
}
export declare class Color extends XmlComponent {
    constructor(color: string);
}
export declare class Highlight extends XmlComponent {
    constructor(color: string);
}
export declare class HighlightComplexScript extends XmlComponent {
    constructor(color: string);
}
