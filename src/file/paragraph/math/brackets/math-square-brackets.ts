/**
 * Math Square Brackets module for Office MathML.
 *
 * This module provides the MathSquareBrackets class for square brackets.
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
 * Represents square brackets in a math equation.
 *
 * MathSquareBrackets displays content surrounded by square brackets [ ].
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_d-1.html
 *
 * @example
 * ```typescript
 * new MathSquareBrackets({ children: [new MathRun("x + y")] });
 * ```
 */
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
