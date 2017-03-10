import { DocumentAttributes } from "../docx/document/document-attributes";
import { XmlComponent } from "../docx/xml-components";
import { ParagraphStyle } from "./style";

export class Styles extends XmlComponent {

    constructor() {
        super("w:styles");
        this.root.push(new DocumentAttributes({
            mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
            r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
            w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            w14: "http://schemas.microsoft.com/office/word/2010/wordml",
            w15: "http://schemas.microsoft.com/office/word/2012/wordml",
            Ignorable: "w14 w15",
        }));
        // let latentStyles = new LatentStyles();
        // latentStyles.push(new LatentStyleException(new LatentStyleExceptionAttributes({
        //    name: "Normal"
        // })));
        // this.root.push(latentStyles);
    }

    public push(style: XmlComponent): Styles {
        this.root.push(style);
        return this;
    }

    public createParagraphStyle(styleId: string, name?: string): ParagraphStyle {
        const para = new ParagraphStyle(styleId, name);
        this.push(para);
        return para;
    }
}
