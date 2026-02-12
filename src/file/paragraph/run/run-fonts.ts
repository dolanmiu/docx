import { BuilderElement, XmlComponent } from "@file/xml-components";

export type IFontAttributesProperties = {
    readonly ascii?: string;
    readonly cs?: string;
    readonly eastAsia?: string;
    readonly hAnsi?: string;
    readonly hint?: string;
};

export const createRunFonts = (nameOrAttrs: string | IFontAttributesProperties, hint?: string): XmlComponent => {
    if (typeof nameOrAttrs === "string") {
        const name = nameOrAttrs;
        return new BuilderElement<IFontAttributesProperties>({
            name: "w:rFonts",
            attributes: {
                ascii: { key: "w:ascii", value: name },
                cs: { key: "w:cs", value: name },
                eastAsia: { key: "w:eastAsia", value: name },
                hAnsi: { key: "w:hAnsi", value: name },
                hint: { key: "w:hint", value: hint },
            },
        });
    }

    const attrs = nameOrAttrs;
    return new BuilderElement<IFontAttributesProperties>({
        name: "w:rFonts",
        attributes: {
            ascii: { key: "w:ascii", value: attrs.ascii },
            cs: { key: "w:cs", value: attrs.cs },
            eastAsia: { key: "w:eastAsia", value: attrs.eastAsia },
            hAnsi: { key: "w:hAnsi", value: attrs.hAnsi },
            hint: { key: "w:hint", value: attrs.hint },
        },
    });
};
