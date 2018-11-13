import { BaseXmlComponent, XmlComponent } from "file/xml-components";
import { DocumentDefaults } from "./defaults";
import { CharacterStyle, ParagraphStyle } from "./style";
export * from "./border";

export class Styles extends XmlComponent {
    constructor(initialStyles?: BaseXmlComponent) {
        super("w:styles");
        if (initialStyles) {
            this.root.push(initialStyles);
        }
    }

    public push(style: XmlComponent): Styles {
        this.root.push(style);
        return this;
    }

    public createDocumentDefaults(): DocumentDefaults {
        const defaults = new DocumentDefaults();
        this.push(defaults);
        return defaults;
    }

    public createParagraphStyle(styleId: string, name?: string): ParagraphStyle {
        const paragraphStyle = new ParagraphStyle(styleId, name);
        this.push(paragraphStyle);
        return paragraphStyle;
    }

    public createCharacterStyle(styleId: string, name?: string): CharacterStyle {
        const characterStyle = new CharacterStyle(styleId, name);
        this.push(characterStyle);
        return characterStyle;
    }
}
