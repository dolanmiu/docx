import * as _ from "lodash";
import { DocumentAttributes } from "../docx/document/document-attributes";
import { MultiPropertyXmlComponent } from "../docx/xml-components";
import { AbstractNumbering } from "./abstract-numbering";
import { Indent } from "./indent";
import { Level } from "./level";
import { Num } from "./num";
import { RunFonts } from "./run-fonts";

export class Numbering extends MultiPropertyXmlComponent {
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

        const level0 = new Level(0, "bullet", "•", "left");
        level0.addParagraphProperty(new Indent(720, 360));
        level0.addRunProperty(new RunFonts("Symbol", "default"));
        abstractNumbering.addLevel(level0);

        const level1 = new Level(1, "bullet", "o", "left");
        level1.addParagraphProperty(new Indent(1440, 360));
        level1.addRunProperty(new RunFonts("Courier New", "default"));
        abstractNumbering.addLevel(level1);

        const level2 = new Level(2, "bullet", "•", "left");
        level2.addParagraphProperty(new Indent(2160, 360));
        level2.addRunProperty(new RunFonts("Wingdings", "default"));
        abstractNumbering.addLevel(level2);

        const level3 = new Level(3, "bullet", "•", "left");
        level3.addParagraphProperty(new Indent(2880, 360));
        level3.addRunProperty(new RunFonts("Symbol", "default"));
        abstractNumbering.addLevel(level3);

        const level4 = new Level(4, "bullet", "o", "left");
        level4.addParagraphProperty(new Indent(3600, 360));
        level4.addRunProperty(new RunFonts("Courier New", "default"));
        abstractNumbering.addLevel(level4);

        const level5 = new Level(5, "bullet", "•", "left");
        level5.addParagraphProperty(new Indent(4320, 360));
        level5.addRunProperty(new RunFonts("Wingdings", "default"));
        abstractNumbering.addLevel(level5);

        const level6 = new Level(6, "bullet", "•", "left");
        level6.addParagraphProperty(new Indent(5040, 360));
        level6.addRunProperty(new RunFonts("Symbol", "default"));
        abstractNumbering.addLevel(level6);

        const level7 = new Level(7, "bullet", "o", "left");
        level7.addParagraphProperty(new Indent(5760, 360));
        level7.addRunProperty(new RunFonts("Courier New", "default"));
        abstractNumbering.addLevel(level7);

        const level8 = new Level(8, "bullet", "•", "left");
        level8.addParagraphProperty(new Indent(6480, 360));
        level8.addRunProperty(new RunFonts("Wingdings", "default"));
        abstractNumbering.addLevel(level8);

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

    public clearVariables(): void {
        super.clearVariables();
        _.forEach(this.root, (element) => {
            element.clearVariables();
        });
        delete this.nextId;
    }
}
