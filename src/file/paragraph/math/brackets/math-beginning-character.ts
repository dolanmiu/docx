// http://www.datypic.com/sc/ooxml/e-m_begChr-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

type MathBeginningCharacterOptions = { readonly character: string };

export const createMathBeginningCharacter = ({ character }: MathBeginningCharacterOptions): XmlComponent =>
    new BuilderElement<MathBeginningCharacterOptions>({
        name: "m:begChr",
        attributes: {
            character: { key: "m:val", value: character },
        },
    });
