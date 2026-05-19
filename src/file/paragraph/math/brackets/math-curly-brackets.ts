/**
 * Math Curly Brackets module for Office MathML.
 *
 * This module provides the MathCurlyBrackets class for curly braces.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_d-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";
import { createMathBase } from "../n-ary";
import { createMathBracketProperties } from "./math-bracket-properties";

/**
 * Represents curly braces in a math equation.
 *
 * MathCurlyBrackets displays content surrounded by curly braces { }.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_d-1.html
 *
 * @publicApi
 *
 * @example
 * ```typescript
 * new MathCurlyBrackets({ children: [new MathRun("x + y")] });
 * ```
 */
export class MathCurlyBrackets extends XmlComponent {
    public constructor(options: { readonly children: readonly MathComponent[] }) {
        super("m:d");

        this.root.push(
            createMathBracketProperties({
                characters: {
                    beginningCharacter: "{",
                    endingCharacter: "}",
                },
            }),
        );
        this.root.push(createMathBase({ children: options.children }));
    }
}
