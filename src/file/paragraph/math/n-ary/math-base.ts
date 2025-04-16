// http://www.datypic.com/sc/ooxml/e-m_e-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";

type MathBaseOptions = {
    readonly children: readonly MathComponent[];
};

export const createMathBase = ({ children }: MathBaseOptions): XmlComponent =>
    new BuilderElement({
        name: "m:e",
        children,
    });
