/**
 * VML handles module for WordprocessingML documents.
 *
 * Handles are the draggable points that let a user change a shape's adjustment
 * values in an editor.
 *
 * Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/handles.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "docx";

/**
 * Options for creating a single VML handle.
 */
export type IVmlHandleOptions = {
    /** Position of the handle, e.g. `#0,bottomRight`. */
    readonly position: string;
    /** Range the handle may move through horizontally, e.g. `6629,14971`. */
    readonly xRange?: string;
    /** Range the handle may move through vertically. */
    readonly yRange?: string;
};

/**
 * Creates a single VML handle element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_H">
 *   <xsd:attribute name="position" type="xsd:string"/>
 *   <xsd:attribute name="polar" type="xsd:string"/>
 *   <xsd:attribute name="map" type="xsd:string"/>
 *   <xsd:attribute name="invx" type="s:ST_TrueFalse"/>
 *   <xsd:attribute name="invy" type="s:ST_TrueFalse"/>
 *   <xsd:attribute name="switch" type="s:ST_TrueFalseBlank"/>
 *   <xsd:attribute name="xrange" type="xsd:string"/>
 *   <xsd:attribute name="yrange" type="xsd:string"/>
 *   <xsd:attribute name="radiusrange" type="xsd:string"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Configuration options for the handle
 * @returns An XmlComponent representing the v:h element
 */
export const createVmlHandle = ({ position, xRange, yRange }: IVmlHandleOptions): XmlComponent =>
    new BuilderElement<{ readonly position: string; readonly xRange?: string; readonly yRange?: string }>({
        name: "v:h",
        attributes: {
            position: { key: "position", value: position },
            xRange: { key: "xrange", value: xRange },
            yRange: { key: "yrange", value: yRange },
        },
    });

/**
 * Creates a VML handles element containing one handle per option.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Handles">
 *   <xsd:sequence>
 *     <xsd:element name="h" type="CT_H" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @param handles - The handles, in order
 * @returns An XmlComponent representing the v:handles element
 *
 * @example
 * ```typescript
 * createVmlHandles([{ position: "#0,bottomRight", xRange: "6629,14971" }]);
 * // <v:handles><v:h position="#0,bottomRight" xrange="6629,14971"/></v:handles>
 * ```
 */
export const createVmlHandles = (handles: readonly IVmlHandleOptions[]): XmlComponent =>
    new BuilderElement({
        name: "v:handles",
        children: handles.map(createVmlHandle),
    });
