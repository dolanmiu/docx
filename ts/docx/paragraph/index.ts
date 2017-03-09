import { Num } from "../../numbering/num";
import { TextRun } from "../run/text-run";
import { Attributes, XmlComponent } from "../xml-components";

import { ThematicBreak } from "./border";
import { Indent } from "./indent";
import { PageBreak } from "./page-break";
import { ParagraphProperties } from "./properties";
import { ISpacingProperties, Spacing } from "./spacing";
import { Style } from "./style";
import { LeftTabStop, MaxRightTabStop } from "./tab-stop";
import { NumberProperties } from "./unordered-list";

class Alignment extends XmlComponent {

    constructor(type: string) {
        super("w:jc");
        this.root.push(new Attributes({
            val: type,
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

    public addText(run: TextRun): Paragraph {
        this.root.push(run);
        return this;
    }

    public heading1(): Paragraph {
        this.properties.push(new Style("Heading1"));
        return this;
    }

    public heading2(): Paragraph {
        this.properties.push(new Style("Heading2"));
        return this;
    }

    public heading3(): Paragraph {
        this.properties.push(new Style("Heading3"));
        return this;
    }

    public heading4(): Paragraph {
        this.properties.push(new Style("Heading4"));
        return this;
    }

    public heading5(): Paragraph {
        this.properties.push(new Style("Heading5"));
        return this;
    }

    public title(): Paragraph {
        this.properties.push(new Style("Title"));
        return this;
    }

    public center(): Paragraph {
        this.properties.push(new Alignment("center"));
        return this;
    }

    public left(): Paragraph {
        this.properties.push(new Alignment("left"));
        return this;
    }

    public right(): Paragraph {
        this.properties.push(new Alignment("right"));
        return this;
    }

    public justified(): Paragraph {
        this.properties.push(new Alignment("both"));
        return this;
    }

    public thematicBreak(): Paragraph {
        this.properties.push(new ThematicBreak());
        return this;
    }

    public pageBreak(): Paragraph {
        this.properties.push(new PageBreak());
        return this;
    }

    public maxRightTabStop(): Paragraph {
        this.properties.push(new MaxRightTabStop());
        return this;
    }

    public leftTabStop(position: number): Paragraph {
        this.properties.push(new LeftTabStop(position));
        return this;
    }

    public bullet(): Paragraph {
        this.properties.push(new Style("ListParagraph"));
        this.properties.push(new NumberProperties(1, 0));
        return this;
    }

    public setNumbering(numbering: Num, indentLevel: number): Paragraph {
        this.properties.push(new Style("ListParagraph"));
        this.properties.push(new NumberProperties(numbering.id, indentLevel));
        return this;
    }

    public style(styleId: string): Paragraph {
        this.properties.push(new Style(styleId));
        return this;
    }

    public indent(start: number, hanging?: number): Paragraph {
        this.properties.push(new Indent(start, hanging));
        return this;
    }

    public spacing(params: ISpacingProperties): Paragraph {
        this.properties.push(new Spacing(params));
        return this;
    };
}
