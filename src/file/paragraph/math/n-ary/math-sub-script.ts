// http://www.datypic.com/sc/ooxml/e-m_sub-3.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";

type MathSubScriptElementOptions = {
    readonly children: readonly MathComponent[];
};

export const createMathSubScriptElement = ({ children }: MathSubScriptElementOptions): XmlComponent =>
    new BuilderElement({
        name: "m:sub",
        children,
    });
