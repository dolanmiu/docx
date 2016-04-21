import {XmlComponent, Attributes} from "../xml-components";
import {ThematicBreak} from "./border";
import {PageBreak} from "./page-break";
import {TextRun} from "../run/text-run";
import {ParagraphProperties} from "./properties";
import {TabStop} from "../tab-stop";
import {Style} from "./style";
import {NumberProperties} from "./unordered-list";

class Alignment extends XmlComponent {

    constructor(type: string) {
        super("w:jc");
        this.root.push(new Attributes({
            val: type
        }));
    }
}

export class Paragraph extends XmlComponent {
    private properties: ParagraphProperties;

    constructor(text?: string) {
        super("w:p");
        this.properties = new ParagraphProperties();
        this.root.push(this.properties);
        if (text !== undefined) {
            this.root.push(new TextRun(text));
        }
    }

    addText(run: TextRun): Paragraph {
        this.root.push(run);
        return this;
    }

    heading1(): Paragraph {
        this.properties.push(new Style("Heading1"));
        return this;
    }

    heading2(): Paragraph {
        this.properties.push(new Style("Heading2"));
        return this;
    }

    heading3(): Paragraph {
        this.properties.push(new Style("Heading3"));
        return this;
    }

    heading4(): Paragraph {
        this.properties.push(new Style("Heading4"));
        return this;
    }

    heading5(): Paragraph {
        this.properties.push(new Style("Heading5"));
        return this;
    }

    title(): Paragraph {
        this.properties.push(new Style("Title"));
        return this;
    }

    center(): Paragraph {
        this.properties.push(new Alignment("center"));
        return this;
    }

    left(): Paragraph {
        this.properties.push(new Alignment("left"));
        return this;
    }

    right(): Paragraph {
        this.properties.push(new Alignment("right"));
        return this;
    }

    justified(): Paragraph {
        this.properties.push(new Alignment("both"));
        return this;
    }

    thematicBreak(): Paragraph {
        this.properties.push(new ThematicBreak());
        return this;
    }

    pageBreak(): Paragraph {
        this.properties.push(new PageBreak());
        return this;
    }

    addTabStop(tabStop: TabStop): Paragraph {
        this.properties.push(tabStop);
        return this;
    }

    bullet(): Paragraph {
        this.properties.push(new Style("ListParagraph"));
        this.properties.push(new NumberProperties());
        return this;
    }
}