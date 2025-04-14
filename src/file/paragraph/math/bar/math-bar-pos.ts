// https://www.datypic.com/sc/ooxml/e-m_pos-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

type MathBarPosOptions = { readonly val: string };

export const createMathBarPos = ({ val }: MathBarPosOptions): XmlComponent =>
    new BuilderElement<MathBarPosOptions>({
        name: "m:pos",
        attributes: {
            val: { key: "w:val", value: val },
        },
    });
