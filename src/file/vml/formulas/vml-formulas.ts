/**
 * VML formulas module for WordprocessingML documents.
 *
 * Formulas compute the guide values (`@0`, `@1`, ...) that a shape's path and
 * handles refer to, allowing the geometry to respond to adjustment values.
 *
 * Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/formulas.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Creates a single VML formula element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_F">
 *   <xsd:attribute name="eqn" type="xsd:string"/>
 * </xsd:complexType>
 * ```
 *
 * @param equation - The equation, e.g. `sum #0 0 10800`
 * @returns An XmlComponent representing the v:f element
 */
export const createVmlFormula = (equation: string): XmlComponent =>
    new BuilderElement<{ readonly equation: string }>({
        name: "v:f",
        attributes: {
            equation: { key: "eqn", value: equation },
        },
    });

/**
 * Creates a VML formulas element containing one formula per equation.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Formulas">
 *   <xsd:sequence>
 *     <xsd:element name="f" type="CT_F" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @param equations - The equations, in order. Each is referenced by its index as `@n`.
 * @returns An XmlComponent representing the v:formulas element
 *
 * @example
 * ```typescript
 * createVmlFormulas(["sum #0 0 10800", "prod #0 2 1"]);
 * // <v:formulas><v:f eqn="sum #0 0 10800"/><v:f eqn="prod #0 2 1"/></v:formulas>
 * ```
 */
export const createVmlFormulas = (equations: readonly string[]): XmlComponent =>
    new BuilderElement({
        name: "v:formulas",
        children: equations.map(createVmlFormula),
    });
