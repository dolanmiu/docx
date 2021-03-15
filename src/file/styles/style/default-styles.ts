import { UnderlineType } from "file/paragraph/run/underline";

import { LineRuleType } from "file/paragraph";

import { IBaseCharacterStyleOptions, StyleForCharacter } from "./character-style";
import { IBaseParagraphStyleOptions, IParagraphStyleOptions, StyleForParagraph } from "./paragraph-style";

export class HeadingStyle extends StyleForParagraph {
    constructor(options: IParagraphStyleOptions) {
        super({
            ...options,
            basedOn: "Normal",
            next: "Normal",
            quickFormat: true,
        });
    }
}

export class TitleStyle extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions) {
        super({
            ...options,
            id: "Title",
            name: "Title",
        });
    }
}

export class Heading1Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions) {
        super({
            ...options,
            id: "Heading1",
            name: "Heading 1",
        });
    }
}

export class Heading2Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions) {
        super({
            ...options,
            id: "Heading2",
            name: "Heading 2",
        });
    }
}

export class Heading3Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions) {
        super({
            ...options,
            id: "Heading3",
            name: "Heading 3",
        });
    }
}

export class Heading4Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions) {
        super({
            ...options,
            id: "Heading4",
            name: "Heading 4",
        });
    }
}

export class Heading5Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions) {
        super({
            ...options,
            id: "Heading5",
            name: "Heading 5",
        });
    }
}

export class Heading6Style extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions) {
        super({
            ...options,
            id: "Heading6",
            name: "Heading 6",
        });
    }
}

export class StrongStyle extends HeadingStyle {
    constructor(options: IBaseParagraphStyleOptions) {
        super({
            ...options,
            id: "Strong",
            name: "Strong",
        });
    }
}

export class ListParagraph extends StyleForParagraph {
    constructor(options: IBaseParagraphStyleOptions) {
        super({
            ...options,
            id: "ListParagraph",
            name: "List Paragraph",
            basedOn: "Normal",
            quickFormat: true,
        });
    }
}

export class FootnoteText extends StyleForParagraph {
    constructor(options: IBaseParagraphStyleOptions) {
        super({
            ...options,
            id: "FootnoteText",
            name: "footnote text",
            link: "FootnoteTextChar",
            basedOn: "Normal",
            uiPriority: 99,
            semiHidden: true,
            unhideWhenUsed: true,
            paragraph: {
                spacing: {
                    after: 0,
                    line: 240,
                    lineRule: LineRuleType.AUTO,
                },
            },
            run: {
                size: 20,
            },
        });
    }
}

export class FootnoteReferenceStyle extends StyleForCharacter {
    constructor(options: IBaseCharacterStyleOptions) {
        super({
            ...options,
            id: "FootnoteReference",
            name: "footnote reference",
            basedOn: "DefaultParagraphFont",
            semiHidden: true,
            run: {
                superScript: true,
            },
        });
    }
}

export class FootnoteTextChar extends StyleForCharacter {
    constructor(options: IBaseCharacterStyleOptions) {
        super({
            ...options,
            id: "FootnoteTextChar",
            name: "Footnote Text Char",
            basedOn: "DefaultParagraphFont",
            link: "FootnoteText",
            semiHidden: true,
            run: {
                size: 20,
            },
        });
    }
}

export class HyperlinkStyle extends StyleForCharacter {
    constructor(options: IBaseCharacterStyleOptions) {
        super({
            ...options,
            id: "Hyperlink",
            name: "Hyperlink",
            basedOn: "DefaultParagraphFont",
            run: {
                color: "0563C1",
                underline: {
                    type: UnderlineType.SINGLE,
                },
            },
        });
    }
}
