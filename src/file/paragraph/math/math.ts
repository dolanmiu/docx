/**
 * Office Math module for WordprocessingML documents.
 *
 * This module provides support for mathematical equations and expressions
 * using Office MathML (OMML).
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_oMath-1.html
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { MathComponent } from "./math-component";

/**
 * Options for creating a Math element.
 *
 * @see {@link Math}
 */
export type IMathOptions = {
    /** Array of math components (fractions, radicals, runs, etc.) */
    readonly children: readonly MathComponent[];
};

/**
 * Represents a mathematical equation in a WordprocessingML document.
 *
 * Math is the container for Office MathML (OMML) content, supporting
 * fractions, radicals, integrals, sums, scripts, and more.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_oMath-1.html
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OMath">
 *   <xsd:sequence>
 *     <xsd:group ref="EG_OMathElements" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new Math({
 *   children: [
 *     new MathFraction({
 *       numerator: [new MathRun("a")],
 *       denominator: [new MathRun("b")],
 *     }),
 *   ],
 * });
 * ```
 */
export class Math extends XmlComponent {
    public constructor(options: IMathOptions) {
        super("m:oMath");

        for (const child of options.children) {
            this.root.push(child);
        }
    }
}
