import { XmlAttributeComponent, XmlComponent } from "file/xml-components";

interface IRunFontAttributesProperties {
    readonly ascii: string;
    readonly cs: string;
    readonly eastAsia: string;
    readonly hAnsi: string;
    readonly hint?: string;
}

class RunFontAttributes extends XmlAttributeComponent<IRunFontAttributesProperties> {
    protected readonly xmlKeys = {
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
