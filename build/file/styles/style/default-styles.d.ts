import { IBaseCharacterStyleOptions, StyleForCharacter } from "./character-style";
import { IBaseParagraphStyleOptions, IParagraphStyleOptions, StyleForParagraph } from "./paragraph-style";
export declare class HeadingStyle extends StyleForParagraph {
    constructor(options: IParagraphStyleOptions);
}
export declare class TitleStyle extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions);
}
export declare class Heading1Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions);
}
export declare class Heading2Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions);
}
export declare class Heading3Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions);
}
export declare class Heading4Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions);
}
export declare class Heading5Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions);
}
export declare class Heading6Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions);
}
export declare class StrongStyle extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions);
}
export declare class ListParagraph extends StyleForParagraph {
    constructor(options: IBaseParagraphStyleOptions);
}
export declare class FootnoteText extends StyleForParagraph {
    constructor(options: IBaseParagraphStyleOptions);
}
export declare class FootnoteReferenceStyle extends StyleForCharacter {
    constructor(options: IBaseCharacterStyleOptions);
}
export declare class FootnoteTextChar extends StyleForCharacter {
    constructor(options: IBaseCharacterStyleOptions);
}
export declare class HyperlinkStyle extends StyleForCharacter {
    constructor(options: IBaseCharacterStyleOptions);
}
