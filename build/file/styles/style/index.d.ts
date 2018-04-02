import { XmlComponent } from "../../../file/xml-components";
import * as paragraph from "../../paragraph";
export interface IStyleAttributes {
    type?: string;
    styleId?: string;
    default?: boolean;
    customStyle?: string;
}
export declare class Style extends XmlComponent {
    constructor(attributes: IStyleAttributes, name?: string);
    push(styleSegment: XmlComponent): void;
}
export declare class ParagraphStyle extends Style {
    private readonly paragraphProperties;
    private readonly runProperties;
    constructor(styleId: string, name?: string);
    addParagraphProperty(property: XmlComponent): void;
    addRunProperty(property: XmlComponent): void;
    basedOn(parentId: string): ParagraphStyle;
    quickFormat(): ParagraphStyle;
    next(nextId: string): ParagraphStyle;
    size(twips: number): ParagraphStyle;
    bold(): ParagraphStyle;
    italics(): ParagraphStyle;
    smallCaps(): ParagraphStyle;
    allCaps(): ParagraphStyle;
    strike(): ParagraphStyle;
    doubleStrike(): ParagraphStyle;
    subScript(): ParagraphStyle;
    superScript(): ParagraphStyle;
    underline(underlineType?: string, color?: string): ParagraphStyle;
    color(color: string): ParagraphStyle;
    font(fontName: string): ParagraphStyle;
    center(): ParagraphStyle;
    left(): ParagraphStyle;
    right(): ParagraphStyle;
    justified(): ParagraphStyle;
    thematicBreak(): ParagraphStyle;
    maxRightTabStop(): ParagraphStyle;
    leftTabStop(position: number): ParagraphStyle;
    indent(attrs: object): ParagraphStyle;
    spacing(params: paragraph.ISpacingProperties): ParagraphStyle;
    keepNext(): ParagraphStyle;
    keepLines(): ParagraphStyle;
}
export declare class HeadingStyle extends ParagraphStyle {
    constructor(styleId: string, name: string);
}
export declare class TitleStyle extends HeadingStyle {
    constructor();
}
export declare class Heading1Style extends HeadingStyle {
    constructor();
}
export declare class Heading2Style extends HeadingStyle {
    constructor();
}
export declare class Heading3Style extends HeadingStyle {
    constructor();
}
export declare class Heading4Style extends HeadingStyle {
    constructor();
}
export declare class Heading5Style extends HeadingStyle {
    constructor();
}
export declare class Heading6Style extends HeadingStyle {
    constructor();
}
export declare class ListParagraph extends ParagraphStyle {
    constructor();
}
