import {XmlAttributeComponent, XmlComponent} from "../xml-components";

interface IRunFontAttributesProperties {
    ascii: string;
    hAnsi: string;
    hint?: string;
}

class RunFontAttributes extends XmlAttributeComponent {

    constructor(properties: IRunFontAttributesProperties) {
        super({
            ascii: "w:ascii",
            hAnsi: "w:hAnsi",
            hint: "w:hint",
        }, properties);
    }
}

export class RunFonts extends XmlComponent {

    constructor(ascii: string, hint?: string) {
        super("w:rFonts");
        this.root.push(new RunFontAttributes({
            ascii: ascii,
            hAnsi: ascii,
            hint: hint,
        }));
    }
}
