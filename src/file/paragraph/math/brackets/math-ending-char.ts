// http://www.datypic.com/sc/ooxml/e-m_endChr-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

type MathEndingCharacterOptions = { readonly character: string };

export const createMathEndingCharacter = ({ character }: MathEndingCharacterOptions): XmlComponent =>
    new BuilderElement<MathEndingCharacterOptions>({
        name: "m:endChr",
        attributes: {
            character: { key: "m:val", value: character },
        },
    });
