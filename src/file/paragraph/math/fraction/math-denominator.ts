/**
 * Math Denominator module for Office MathML fractions.
 *
 * This module provides the denominator element for fractions.
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import type { MathComponent } from "../math-component";

/**
 * Represents the denominator (bottom part) of a fraction.
 *
 * @internal
 */
export class MathDenominator extends XmlComponent {
    public constructor(children: readonly MathComponent[]) {
        super("m:den");

        for (const child of children) {
            this.root.push(child);
        }
    }
}
