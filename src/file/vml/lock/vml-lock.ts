/**
 * VML lock module for WordprocessingML documents.
 *
 * A lock prevents particular kinds of edits to a shape in an editor, for example
 * keeping a picture's aspect ratio or stopping WordArt text from being edited.
 *
 * Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/lock.html
 *
 * @module
 */
import { BuilderElement, type XmlComponent } from "@file/xml-components";

import { type VmlTrueFalse, vmlTrueFalse } from "../vml-values";

/**
 * Scope in which a VML extension element applies.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:simpleType name="ST_Ext">
 *   <xsd:restriction base="xsd:string">
 *     <xsd:enumeration value="view"/>
 *     <xsd:enumeration value="edit"/>
 *     <xsd:enumeration value="backwardCompatible"/>
 *   </xsd:restriction>
 * </xsd:simpleType>
 * ```
 */
export type VmlExtensionType = "view" | "edit" | "backwardCompatible";

/**
 * Options for creating a VML lock.
 */
export type IVmlLockOptions = {
    /** Scope of the lock (`v:ext`). Default is edit. */
    readonly extension?: VmlExtensionType;
    /** Whether the shape's position is locked. */
    readonly position?: boolean;
    /** Whether the shape cannot be selected. */
    readonly selection?: boolean;
    /** Whether the shape cannot be grouped. */
    readonly grouping?: boolean;
    /** Whether the shape cannot be ungrouped. */
    readonly ungrouping?: boolean;
    /** Whether the shape cannot be rotated. */
    readonly rotation?: boolean;
    /** Whether the shape cannot be cropped. */
    readonly cropping?: boolean;
    /** Whether the shape's vertices cannot be edited. */
    readonly vertices?: boolean;
    /** Whether the shape's adjustment handles cannot be moved. */
    readonly adjustHandles?: boolean;
    /** Whether the shape's text cannot be edited. */
    readonly text?: boolean;
    /** Whether the shape's aspect ratio is preserved when resizing. */
    readonly aspectRatio?: boolean;
    /** Whether the shape's type cannot be changed. */
    readonly shapeType?: boolean;
};

type VmlLockAttributes = {
    readonly extension: VmlExtensionType;
    readonly position?: VmlTrueFalse;
    readonly selection?: VmlTrueFalse;
    readonly grouping?: VmlTrueFalse;
    readonly ungrouping?: VmlTrueFalse;
    readonly rotation?: VmlTrueFalse;
    readonly cropping?: VmlTrueFalse;
    readonly vertices?: VmlTrueFalse;
    readonly adjustHandles?: VmlTrueFalse;
    readonly text?: VmlTrueFalse;
    readonly aspectRatio?: VmlTrueFalse;
    readonly shapeType?: VmlTrueFalse;
};

/**
 * Creates a VML lock element.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Lock">
 *   <xsd:attributeGroup ref="v:AG_Ext"/>
 *   <xsd:attribute name="position" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="selection" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="grouping" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="ungrouping" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="rotation" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="cropping" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="verticies" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="adjusthandles" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="text" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="aspectratio" type="s:ST_TrueFalse" use="optional"/>
 *   <xsd:attribute name="shapetype" type="s:ST_TrueFalse" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Configuration options for the lock
 * @returns An XmlComponent representing the o:lock element
 *
 * @example
 * ```typescript
 * createVmlLock({ aspectRatio: true });
 * // <o:lock v:ext="edit" aspectratio="t"/>
 * ```
 */
export const createVmlLock = ({
    extension = "edit",
    position,
    selection,
    grouping,
    ungrouping,
    rotation,
    cropping,
    vertices,
    adjustHandles,
    text,
    aspectRatio,
    shapeType,
}: IVmlLockOptions = {}): XmlComponent =>
    new BuilderElement<VmlLockAttributes>({
        name: "o:lock",
        attributes: {
            extension: { key: "v:ext", value: extension },
            position: { key: "position", value: vmlTrueFalse(position) },
            selection: { key: "selection", value: vmlTrueFalse(selection) },
            grouping: { key: "grouping", value: vmlTrueFalse(grouping) },
            ungrouping: { key: "ungrouping", value: vmlTrueFalse(ungrouping) },
            rotation: { key: "rotation", value: vmlTrueFalse(rotation) },
            cropping: { key: "cropping", value: vmlTrueFalse(cropping) },
            vertices: { key: "verticies", value: vmlTrueFalse(vertices) },
            adjustHandles: { key: "adjusthandles", value: vmlTrueFalse(adjustHandles) },
            text: { key: "text", value: vmlTrueFalse(text) },
            aspectRatio: { key: "aspectratio", value: vmlTrueFalse(aspectRatio) },
            shapeType: { key: "shapetype", value: vmlTrueFalse(shapeType) },
        },
    });
