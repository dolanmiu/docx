import { Indent } from "file/paragraph";
import { IXmlableObject, XmlComponent } from "file/xml-components";
import { DocumentAttributes } from "../document/document-attributes";
import { AbstractNumbering } from "./abstract-numbering";
import { Num } from "./num";

export class Numbering extends XmlComponent {
    // tslint:disable-next-line:readonly-keyword
    private nextId: number;

    private readonly abstractNumbering: XmlComponent[] = [];
    private readonly concreteNumbering: XmlComponent[] = [];

    constructor() {
        super("w:numbering");
        this.root.push(
            new DocumentAttributes({
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
            }),
        );

        this.nextId = 0;

        const abstractNumbering = this.createAbstractNumbering();

        abstractNumbering.createLevel(0, "bullet", "\u25CF", "left").addParagraphProperty(new Indent({ left: 720, hanging: 360 }));

        abstractNumbering.createLevel(1, "bullet", "\u25CB", "left").addParagraphProperty(new Indent({ left: 1440, hanging: 360 }));

        abstractNumbering.createLevel(2, "bullet", "\u25A0", "left").addParagraphProperty(new Indent({ left: 2160, hanging: 360 }));

        abstractNumbering.createLevel(3, "bullet", "\u25CF", "left").addParagraphProperty(new Indent({ left: 2880, hanging: 360 }));

        abstractNumbering.createLevel(4, "bullet", "\u25CB", "left").addParagraphProperty(new Indent({ left: 3600, hanging: 360 }));

        abstractNumbering.createLevel(5, "bullet", "\u25A0", "left").addParagraphProperty(new Indent({ left: 4320, hanging: 360 }));

        abstractNumbering.createLevel(6, "bullet", "\u25CF", "left").addParagraphProperty(new Indent({ left: 5040, hanging: 360 }));

        abstractNumbering.createLevel(7, "bullet", "\u25CB", "left").addParagraphProperty(new Indent({ left: 5760, hanging: 360 }));

        abstractNumbering.createLevel(8, "bullet", "\u25A0", "left").addParagraphProperty(new Indent({ left: 6480, hanging: 360 }));

        this.createConcreteNumbering(abstractNumbering);
    }

    public createAbstractNumbering(): AbstractNumbering {
        const num = new AbstractNumbering(this.nextId++);
        this.abstractNumbering.push(num);
        return num;
    }

    public createConcreteNumbering(abstractNumbering: AbstractNumbering): Num {
        const num = new Num(this.nextId++, abstractNumbering.id);
        this.concreteNumbering.push(num);
        return num;
    }

    public prepForXml(): IXmlableObject | undefined {
        this.abstractNumbering.forEach((x) => this.root.push(x));
        this.concreteNumbering.forEach((x) => this.root.push(x));
        return super.prepForXml();
    }
}
