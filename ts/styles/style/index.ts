import { Indent } from "../../docx/paragraph/indent";
import { ParagraphProperties } from "../../docx/paragraph/properties";
import { ISpacingProperties, Spacing } from "../../docx/paragraph/spacing";
import * as formatting from "../../docx/run/formatting";
import { RunProperties } from "../../docx/run/properties";
import { XmlAttributeComponent, XmlComponent } from "../../docx/xml-components";

import { BasedOn, Name, Next, QuickFormat } from "./components";

export interface IStyleAttributes {
    type?: string;
    styleId?: string;
    default?: boolean;
    customStyle?: string;
}

class StyleAttributes extends XmlAttributeComponent {
    private _attr: IStyleAttributes;

    constructor(properties: IStyleAttributes) {
        super({
            type: "w:type",
            styleId: "w:styleId",
            default: "w:default",
            customStyle: "w:customStyle",
        }, properties);
    }
}

export class Style extends XmlComponent {

    constructor(attributes: IStyleAttributes, name?: string) {
        super("w:style");
        this.root.push(new StyleAttributes(attributes));
        if (name) {
            this.root.push(new Name(name));
        }
    }

    public push(styleSegment: XmlComponent): void {
        this.root.push(styleSegment);
    }
}

export class ParagraphStyle extends Style {

    private paragraphProperties: ParagraphProperties;
    private runProperties: RunProperties;

    constructor(styleId: string, name?: string) {
        super({type: "paragraph", styleId: styleId}, name);
        this.paragraphProperties = new ParagraphProperties();
        this.runProperties = new RunProperties();
        this.root.push(this.paragraphProperties);
        this.root.push(this.runProperties);
    }

    public clearVariables(): void {
        this.paragraphProperties.clearVariables();
        this.runProperties.clearVariables();
        delete this.paragraphProperties;
        delete this.runProperties;
    }

    public addParagraphProperty(property: XmlComponent): void {
        this.paragraphProperties.push(property);
    }

    public addRunProperty(property: XmlComponent): void {
        this.runProperties.push(property);
    }

    public basedOn(parentId: string): ParagraphStyle {
        this.root.push(new BasedOn(parentId));
        return this;
    }

    public quickFormat(): ParagraphStyle {
        this.root.push(new QuickFormat());
        return this;
    }

    public next(nextId: string): ParagraphStyle {
        this.root.push(new Next(nextId));
        return this;
    }

    public size(twips: number): ParagraphStyle {
        this.addRunProperty(new formatting.Size(twips));
        return this;
    }

    public bold(): ParagraphStyle {
        this.addRunProperty(new formatting.Bold());
        return this;
    }

    public italics(): ParagraphStyle {
        this.addRunProperty(new formatting.Italics());
        return this;
    }

    public underline(underlineType?: string, color?: string): ParagraphStyle {
        this.addRunProperty(new formatting.Underline(underlineType, color));
        return this;
    }

    public color(color: string): ParagraphStyle {
        this.addRunProperty(new formatting.Color(color));
        return this;
    }

    public indent(left: number, hanging?: number): ParagraphStyle {
        this.addParagraphProperty(new Indent(left, hanging));
        return this;
    }

    public spacing(params: ISpacingProperties): ParagraphStyle {
        this.addParagraphProperty(new Spacing(params));
        return this;
    };
}

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
        super("ListParagraph");
        this.root.push(new Name("List Paragraph"));
        this.root.push(new BasedOn("Normal"));
        this.root.push(new QuickFormat());
    }
}
