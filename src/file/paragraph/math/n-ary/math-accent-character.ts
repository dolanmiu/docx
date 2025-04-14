// http://www.datypic.com/sc/ooxml/e-m_chr-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

type MathAccentCharacterOptions = { readonly accent: string };

export const createMathAccentCharacter = ({ accent }: MathAccentCharacterOptions): XmlComponent =>
    new BuilderElement<MathAccentCharacterOptions>({
        name: "m:chr",
        attributes: {
            accent: { key: "m:val", value: accent },
        },
    });
