/**
 * Math Run module for Office MathML.
 *
 * This module provides the MathRun class for text content within math equations.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_r-1.html
 *
 * @module
 */
import { BuilderElement, XmlComponent } from "@file/xml-components";

import { MathText } from "./math-text";

/**
 * Options for a {@link MathRun}.
 */
export type MathRunOptions = {
    /** The text */
    readonly text: string;
    /**
     * Writes the text as ordinary text rather than math, as Word's "Normal Text" button does (`m:nor`): upright and in
     * the document's font, with its spaces kept. For words in an equation, such as "if" and "otherwise" in cases.
     * @default false
     */
    readonly normalText?: boolean;
};

/**
 * Represents a run of text within a math equation.
 *
 * MathRun is the container for text content in Office MathML,
 * similar to how Run contains text in regular paragraphs.
 *
 * Reference: http://www.datypic.com/sc/ooxml/e-m_r-1.html
 *
 * @publicApi
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_R">
 *   <xsd:sequence>
 *     <xsd:element name="rPr" type="CT_RPR" minOccurs="0"/>
 *     <xsd:group ref="EG_ScriptStyle" minOccurs="0"/>
 *     <xsd:choice minOccurs="0" maxOccurs="unbounded">
 *       <xsd:element ref="w:br"/>
 *       <xsd:element name="t" type="CT_Text"/>
 *     </xsd:choice>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * new MathRun("x + y");
 * new MathRun({ text: "if ", normalText: true });
 * ```
 */
export class MathRun extends XmlComponent {
    public constructor(options: string | MathRunOptions) {
        super("m:r");

        const { text, normalText } = typeof options === "string" ? { text: options, normalText: false } : options;

        if (normalText) {
            this.root.push(
                new BuilderElement({
                    name: "m:rPr",
                    children: [
                        new BuilderElement<{ readonly on: number }>({ name: "m:nor", attributes: { on: { key: "m:val", value: 1 } } }),
                    ],
                }),
            );
        }

        this.root.push(new MathText(text));
    }
}
