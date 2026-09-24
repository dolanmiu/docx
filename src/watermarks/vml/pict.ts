/**
 * The picture element (`w:pict`) that holds a watermark's VML shape type and shape.
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "docx";

/**
 * Creates a `w:pict` element holding VML content, such as a `v:shapetype` followed by the `v:shape` that uses it.
 *
 * ```xml
 * <w:pict><v:shapetype .../><v:shape .../></w:pict>
 * ```
 */
export const createPict = ({ children }: { readonly children: readonly XmlComponent[] }): XmlComponent =>
    new BuilderElement({ name: "w:pict", children });
