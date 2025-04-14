// http://www.datypic.com/sc/ooxml/e-m_sup-3.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";

type MathSuperScriptElementOptions = {
    readonly children: readonly MathComponent[];
};

export const createMathSuperScriptElement = ({ children }: MathSuperScriptElementOptions): XmlComponent =>
    new BuilderElement({
        name: "m:sup",
        children,
    });
