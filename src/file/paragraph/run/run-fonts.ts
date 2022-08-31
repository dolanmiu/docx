import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

export interface IFontAttributesProperties {
    readonly ascii?: string;
    readonly cs?: string;
    readonly eastAsia?: string;
    readonly hAnsi?: string;
    readonly hint?: string;
}

class RunFontAttributes extends XmlAttributeComponent<IFontAttributesProperties> {
    protected readonly xmlKeys = {
        ascii: "w:ascii",
        cs: "w:cs",
        eastAsia: "w:eastAsia",
        hAnsi: "w:hAnsi",
        hint: "w:hint",
    };
}

export class RunFonts extends XmlComponent {
    public constructor(name: string, hint?: string);
    public constructor(attrs: string | IFontAttributesProperties);
    public constructor(nameOrAttrs: string | IFontAttributesProperties, hint?: string) {
        super("w:rFonts");
        if (typeof nameOrAttrs === "string") {
            // use public constructor(name: string, hint?: string);
            const name = nameOrAttrs;
            this.root.push(
                new RunFontAttributes({
                    ascii: name,
                    cs: name,
                    eastAsia: name,
                    hAnsi: name,
                    hint: hint,
                }),
            );
        } else {
            // use public constructor(attrs: IRunFontAttributesProperties);
            const attrs = nameOrAttrs;
            this.root.push(new RunFontAttributes(attrs));
        }
    }
}
