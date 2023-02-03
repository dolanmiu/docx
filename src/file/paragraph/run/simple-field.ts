// http://www.datypic.com/sc/ooxml/e-w_fldSimple-1.html
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { TextRun } from "./text-run";

class FldSimpleAttrs extends XmlAttributeComponent<{ readonly instr: string }> {
    protected readonly xmlKeys = { instr: "w:instr" };
}

export class SimpleField extends XmlComponent {
    public constructor(instruction: string, cachedValue?: string) {
        super("w:fldSimple");
        this.root.push(new FldSimpleAttrs({ instr: instruction }));
        if (cachedValue !== undefined) {
            this.root.push(new TextRun(cachedValue));
        }
    }
}

export class SimpleMailMergeField extends SimpleField {
    public constructor(fieldName: string) {
        super(` MERGEFIELD ${fieldName} `, `«${fieldName}»`);
    }
}
