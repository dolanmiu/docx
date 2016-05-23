import {MultiPropertyXmlComponent} from "../docx/xml-components";
import {DocumentAttributes} from "../docx/document/document-attributes"
import {AbstractNumbering} from "./abstract-numbering";
import {Level} from "./level";
import {Indent} from "./indent";
import {RunFonts} from "./run-fonts";
import {Num} from "./num";
import * as _ from "lodash";

export class Numbering extends MultiPropertyXmlComponent {
    
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
            Ignorable: "w14 w15 wp14"
        }));
        
        var abstractNumbering = new AbstractNumbering(0);
        
        var level0 = new Level(0, "bullet", "", "left");
        level0.addParagraphProperty(new Indent(720, 360));
        level0.addRunProperty(new RunFonts("Symbol", "default"));
        abstractNumbering.addLevel(level0);
        
        var level1 = new Level(1, "bullet", "o", "left");
        level1.addParagraphProperty(new Indent(1440, 360));
        level1.addRunProperty(new RunFonts("Courier New", "default"));
        abstractNumbering.addLevel(level1);
        
        var level2 = new Level(2, "bullet", "", "left");
        level2.addParagraphProperty(new Indent(2160, 360));
        level2.addRunProperty(new RunFonts("Wingdings", "default"));
        abstractNumbering.addLevel(level2);
        
        var level3 = new Level(3, "bullet", "", "left");
        level3.addParagraphProperty(new Indent(2880, 360));
        level3.addRunProperty(new RunFonts("Symbol", "default"));
        abstractNumbering.addLevel(level3);
        
        var level4 = new Level(4, "bullet", "o", "left");
        level4.addParagraphProperty(new Indent(3600, 360));
        level4.addRunProperty(new RunFonts("Courier New", "default"));
        abstractNumbering.addLevel(level4);
        
        var level5 = new Level(5, "bullet", "", "left");
        level5.addParagraphProperty(new Indent(4320, 360));
        level5.addRunProperty(new RunFonts("Wingdings", "default"));
        abstractNumbering.addLevel(level5);
        
        var level6 = new Level(6, "bullet", "", "left");
        level6.addParagraphProperty(new Indent(5040, 360));
        level6.addRunProperty(new RunFonts("Symbol", "default"));
        abstractNumbering.addLevel(level6);
        
        var level7 = new Level(4, "bullet", "o", "left");
        level7.addParagraphProperty(new Indent(5760, 360));
        level7.addRunProperty(new RunFonts("Courier New", "default"));
        abstractNumbering.addLevel(level7);
        
        var level8 = new Level(5, "bullet", "", "left");
        level8.addParagraphProperty(new Indent(6480, 360));
        level8.addRunProperty(new RunFonts("Wingdings", "default"));
        abstractNumbering.addLevel(level8);
        
        this.root.push(abstractNumbering);
        this.root.push(new Num(1, 0));
    }
    
    clearVariables() {
        _.forEach(this.root, element => {
           element.clearVariables(); 
        });
    }
}