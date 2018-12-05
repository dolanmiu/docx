import { CharacterStyle } from "./character-style";
import { ParagraphStyle } from "./paragraph-style";

export class HeadingStyle extends ParagraphStyle {
    constructor(styleId: string, name: string) {
        super(styleId, name);
        this.basedOn("Normal");
        this.next("Normal");
        this.quickFormat();
    }
}

export class TitleStyle extends HeadingStyle {
    constructor() {
        super("Title", "Title");
    }
}

export class Heading1Style extends HeadingStyle {
    constructor() {
        super("Heading1", "Heading 1");
    }
}

export class Heading2Style extends HeadingStyle {
    constructor() {
        super("Heading2", "Heading 2");
    }
}

export class Heading3Style extends HeadingStyle {
    constructor() {
        super("Heading3", "Heading 3");
    }
}

export class Heading4Style extends HeadingStyle {
    constructor() {
        super("Heading4", "Heading 4");
    }
}

export class Heading5Style extends HeadingStyle {
    constructor() {
        super("Heading5", "Heading 5");
    }
}

export class Heading6Style extends HeadingStyle {
    constructor() {
        super("Heading6", "Heading 6");
    }
}

export class ListParagraph extends ParagraphStyle {
    constructor() {
        super("ListParagraph", "List Paragraph");
        this.basedOn("Normal");
        this.quickFormat();
    }
}

export class FootnoteText extends ParagraphStyle {
    constructor() {
        super("FootnoteText", "footnote text");
        this.basedOn("Normal")
            .link("FootnoteTextChar")
            .uiPriority("99")
            .semiHidden()
            .unhideWhenUsed()
            .spacing({
                after: 0,
                line: 240,
                lineRule: "auto",
            })
            .size(20);
    }
}

export class FootnoteReferenceStyle extends CharacterStyle {
    constructor() {
        super("FootnoteReference", "footnote reference");
        this.basedOn("DefaultParagraphFont")
            .semiHidden()
            .superScript();
    }
}

export class FootnoteTextChar extends CharacterStyle {
    constructor() {
        super("FootnoteTextChar", "Footnote Text Char");
        this.basedOn("DefaultParagraphFont")
            .link("FootnoteText")
            .semiHidden()
            .size(20);
    }
}

export class HyperlinkStyle extends CharacterStyle {
    constructor() {
        super("Hyperlink", "Hyperlink");
        this.basedOn("DefaultParagraphFont")
            .color("0563C1")
            .underline("single");
    }
}
