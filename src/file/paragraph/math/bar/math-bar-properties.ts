// https://www.datypic.com/sc/ooxml/e-m_barPr-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { createMathBarPos } from "./math-bar-pos";

export const createMathBarProperties = ({ type }: { readonly type: string }): XmlComponent =>
    new BuilderElement({
        name: "m:barPr",
        children: [createMathBarPos({ val: type })],
    });
