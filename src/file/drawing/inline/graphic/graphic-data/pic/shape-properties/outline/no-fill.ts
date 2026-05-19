/**
 * No fill element for DrawingML shapes.
 *
 * This module provides the no-fill option for outline and shape fills.
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

/**
 * Creates a no-fill element.
 *
 * Specifies that the outline or shape should have no fill applied.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="noFill" type="CT_Empty"/>
 * ```
 *
 * @example
 * ```typescript
 * const noFill = createNoFill();
 * ```
 */
export const createNoFill = (): XmlComponent => new BuilderElement({ name: "a:noFill" });
