/**
 * Math Numerator module for Office MathML fractions.
 *
 * This module provides the numerator element for fractions.
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "../math-component";

/**
 * Represents the numerator (top part) of a fraction.
 *
 * @internal
 */
export class MathNumerator extends XmlComponent {
    public constructor(children: readonly MathComponent[]) {
        super("m:num");

        for (const child of children) {
            this.root.push(child);
        }
    }
}
