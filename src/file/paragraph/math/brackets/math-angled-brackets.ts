/**
 * Math Angled Brackets module for Office MathML.
 *
 * This module provides the MathAngledBrackets class for angle brackets.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_d-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";
import { createMathBase } from "../n-ary";
import { createMathBracketProperties } from "./math-bracket-properties";

/**
 * Options for MathAngledBrackets.
 */
type MathAngledBracketsOptions = { readonly children: readonly MathComponent[] };

/**
 * Represents angle brackets in a math equation.
 *
 * MathAngledBrackets displays content surrounded by angle brackets ⟨ ⟩.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_d-1.html
 *
 * @example
 * ```typescript
 * new MathAngledBrackets({ children: [new MathRun("x, y")] });
 * ```
 */
export class MathAngledBrackets extends XmlComponent {
    public constructor(options: MathAngledBracketsOptions) {
        super("m:d");

        this.root.push(
            createMathBracketProperties({
                characters: {
                    beginningCharacter: "〈",
                    endingCharacter: "〉",
                },
            }),
        );
        this.root.push(createMathBase({ children: options.children }));
    }
}
