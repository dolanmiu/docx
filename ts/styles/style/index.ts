import {XmlComponent} from "../../docx/xml-components";
import {StyleAttributes} from "./attributes";
import {ParagraphProperties} from "../../docx/paragraph/properties";
import {RunProperties} from "../../docx/run/properties";
import {Name, BasedOn, Next, QuickFormat} from "./components";

export class Style extends XmlComponent {

    constructor(attributes: StyleAttributes) {
        super("w:style");
        this.root.push(attributes);
    }

    push(styleSegment: XmlComponent): void {
        this.root.push(styleSegment);
    }
}

export class ParagraphStyle extends Style {

    constructor(styleId: string, paragraphProperties: ParagraphProperties, runProperties: RunProperties) {
        var attributes = new StyleAttributes({
            type: "paragraph",
            styleId: styleId
        });
        super(attributes);
        this.root.push(paragraphProperties);
        this.root.push(runProperties);
    }
}

export class HeadingStyle extends ParagraphStyle {

    constructor(styleId: string, name: string, paragraphProperties: ParagraphProperties, runProperties: RunProperties) {
        super(styleId, paragraphProperties, runProperties);
        this.root.push(new Name(name));
        this.root.push(new BasedOn("Normal"));
        this.root.push(new Next("Normal"));
        this.root.push(new QuickFormat());
    }
}

export class Heading1Style extends HeadingStyle {
    
    constructor(paragraphProperties: ParagraphProperties, runProperties: RunProperties) {
        super("Heading1", "Heading 1", paragraphProperties, runProperties);
    }
}

export class Heading2Style extends HeadingStyle {
    
    constructor(paragraphProperties: ParagraphProperties, runProperties: RunProperties) {
        super("Heading2", "Heading 2", paragraphProperties, runProperties);
    }
}

export class Heading3Style extends HeadingStyle {
    
    constructor(paragraphProperties: ParagraphProperties, runProperties: RunProperties) {
        super("Heading3", "Heading 3", paragraphProperties, runProperties);
    }
}

export class Heading4Style extends HeadingStyle {
    
    constructor(paragraphProperties: ParagraphProperties, runProperties: RunProperties) {
        super("Heading4", "Heading 4", paragraphProperties, runProperties);
    }
}

export class Heading5Style extends HeadingStyle {
    
    constructor(paragraphProperties: ParagraphProperties, runProperties: RunProperties) {
        super("Heading5", "Heading 5", paragraphProperties, runProperties);
    }
}

export class Heading6Style extends HeadingStyle {
    
    constructor(paragraphProperties: ParagraphProperties, runProperties: RunProperties) {
        super("Heading6", "Heading 6", paragraphProperties, runProperties);
    }
}