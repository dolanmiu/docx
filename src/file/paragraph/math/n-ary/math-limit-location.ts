// http://www.datypic.com/sc/ooxml/e-m_limLoc-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

type MathLimitLocationOptions = { readonly value?: string };

export const createMathLimitLocation = ({ value }: MathLimitLocationOptions): XmlComponent =>
    new BuilderElement<Required<MathLimitLocationOptions>>({
        name: "m:limLoc",
        attributes: {
            value: { key: "m:val", value: value || "undOvr" },
        },
    });
