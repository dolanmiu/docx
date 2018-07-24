import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

interface IRunFontAttributesProperties {
    ascii: string;
    cs: string;
    eastAsia: string;
    hAnsi: string;
    hint?: string;
}

class RunFontAttributes extends XmlAttributeComponent<IRunFontAttributesProperties> {
    protected xmlKeys = {
        ascii: "w:ascii",
        cs: "w:cs",
        eastAsia: "w:eastAsia",
        hAnsi: "w:hAnsi",
        hint: "w:hint",
    };
}

export class RunFonts extends XmlComponent {
    constructor(ascii: string, hint?: string) {
        super("w:rFonts");
        this.root.push(
            new RunFontAttributes({
                ascii: ascii,
                cs: ascii,
                eastAsia: ascii,
                hAnsi: ascii,
                hint: hint,
            }),
        );
    }
}
