// https://www.datypic.com/sc/ooxml/e-m_bar-1.html
import { BuilderElement, XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";
import { createMathBase } from "../n-ary";
import { createMathBarProperties } from "./math-bar-properties";

type MathBarOptions = {
    readonly type: "top" | "bot";
    readonly children: readonly MathComponent[];
};

export const createMathBar = ({ type, children }: MathBarOptions): XmlComponent =>
    new BuilderElement({
        name: "m:bar",
        children: [createMathBarProperties({ type }), createMathBase({ children })],
    });
