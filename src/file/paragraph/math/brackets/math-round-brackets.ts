// http://www.datypic.com/sc/ooxml/e-m_d-1.html
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { MathBase } from "../n-ary";
import { MathBracketProperties } from "./math-bracket-properties";

export class MathRoundBrackets extends XmlComponent {
    public constructor(options: { readonly children: readonly MathComponent[] }) {
        super("m:d");

        this.root.push(new MathBracketProperties());
        this.root.push(new MathBase(options.children));
    }
}
