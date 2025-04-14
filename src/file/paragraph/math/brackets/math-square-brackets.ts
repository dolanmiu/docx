// http://www.datypic.com/sc/ooxml/e-m_d-1.html
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { createMathBase } from "../n-ary";
import { createMathBracketProperties } from "./math-bracket-properties";

export class MathSquareBrackets extends XmlComponent {
    public constructor(options: { readonly children: readonly MathComponent[] }) {
        super("m:d");

        this.root.push(
            createMathBracketProperties({
                characters: {
                    beginningCharacter: "[",
                    endingCharacter: "]",
                },
            }),
        );
        this.root.push(createMathBase({ children: options.children }));
    }
}
