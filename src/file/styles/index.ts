import { XmlComponent, BaseXmlComponent } from "file/xml-components";
import { DocumentDefaults } from "./defaults";
import { ParagraphStyle } from "./style";

export class Styles extends XmlComponent {
    constructor(_initialStyles?: BaseXmlComponent) {
        super("w:styles");
        if (_initialStyles) {
            this.root.push(_initialStyles);
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
        const para = new ParagraphStyle(styleId, name);
        this.push(para);
        return para;
    }
}
