import { DocumentAttributes } from "../docx/document/document-attributes";
import { Indent } from "../docx/paragraph/indent";
import { RunFonts } from "../docx/run/run-fonts";
import { XmlComponent } from "../docx/xml-components";
import { AbstractNumbering } from "./abstract-numbering";
import { Num } from "./num";

export class Numbering extends XmlComponent {
    private nextId: number;

    constructor() {
        super("w:numbering");
        this.root.push(new DocumentAttributes({
            wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
            mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
            o: "urn:schemas-microsoft-com:office:office",
            r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
            m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
            v: "urn:schemas-microsoft-com:vml",
            wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
            wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
            w10: "urn:schemas-microsoft-com:office:word",
            w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
            w14: "http://schemas.microsoft.com/office/word/2010/wordml",
            w15: "http://schemas.microsoft.com/office/word/2012/wordml",
            wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
            wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
            wne: "http://schemas.microsoft.com/office/word/2006/wordml",
            wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
            Ignorable: "w14 w15 wp14",
        }));

        this.nextId = 0;

        const abstractNumbering = this.createAbstractNumbering();

        abstractNumbering.createLevel(0, "bullet", "•", "left")
            .addParagraphProperty(new Indent(720, 360))
            .addRunProperty(new RunFonts("Symbol", "default"));

        abstractNumbering.createLevel(1, "bullet", "o", "left")
            .addParagraphProperty(new Indent(1440, 360))
            .addRunProperty(new RunFonts("Courier New", "default"));

        abstractNumbering.createLevel(2, "bullet", "•", "left")
            .addParagraphProperty(new Indent(2160, 360))
            .addRunProperty(new RunFonts("Wingdings", "default"));

        abstractNumbering.createLevel(3, "bullet", "•", "left")
            .addParagraphProperty(new Indent(2880, 360))
            .addRunProperty(new RunFonts("Symbol", "default"));

        abstractNumbering.createLevel(4, "bullet", "o", "left")
            .addParagraphProperty(new Indent(3600, 360))
            .addRunProperty(new RunFonts("Courier New", "default"));

        abstractNumbering.createLevel(5, "bullet", "•", "left")
            .addParagraphProperty(new Indent(4320, 360))
            .addRunProperty(new RunFonts("Wingdings", "default"));

        abstractNumbering.createLevel(6, "bullet", "•", "left")
            .addParagraphProperty(new Indent(5040, 360))
            .addRunProperty(new RunFonts("Symbol", "default"));

        abstractNumbering.createLevel(7, "bullet", "o", "left")
            .addParagraphProperty(new Indent(5760, 360))
            .addRunProperty(new RunFonts("Courier New", "default"));

        abstractNumbering.createLevel(8, "bullet", "•", "left")
            .addParagraphProperty(new Indent(6480, 360))
            .addRunProperty(new RunFonts("Wingdings", "default"));

        this.createConcreteNumbering(abstractNumbering);
    }

    public createAbstractNumbering(): AbstractNumbering {
        const num = new AbstractNumbering(this.nextId++);
        this.root.push(num);
        return num;
    }

    public createConcreteNumbering(abstractNumbering: AbstractNumbering): Num {
        const num = new Num(this.nextId++, abstractNumbering.id);
        this.root.push(num);
        return num;
    }
}
