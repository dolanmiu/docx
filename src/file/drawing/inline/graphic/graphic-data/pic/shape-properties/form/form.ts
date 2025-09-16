/**
 * 2D transform (form) for DrawingML shapes.
 *
 * This module provides transformation support including position, size,
 * rotation, and flip operations for shapes and pictures.
 *
 * Reference: http://officeopenxml.com/drwSp-size.php
 * Reference: http://officeopenxml.com/drwSp-rotate.php
 *
 * @module
 */
// http://officeopenxml.com/drwSp-size.php
// http://officeopenxml.com/drwSp-rotate.php
import { IMediaDataTransformation } from "@file/media";
import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { Extents } from "./extents/extents";
import { Offset } from "./offset/off";

/**
 * Attributes for 2D transformation.
 *
 * Defines flip and rotation properties.
 */
export class FormAttributes extends XmlAttributeComponent<{
    /** Flip vertically */
    readonly flipVertical?: boolean;
    /** Flip horizontally */
    readonly flipHorizontal?: boolean;
    /** Rotation angle in 60,000ths of a degree */
    readonly rotation?: number;
}> {
    protected readonly xmlKeys = {
        flipVertical: "flipV",
        flipHorizontal: "flipH",
        rotation: "rot",
    };
}

/**
 * Represents a 2D transformation for DrawingML objects.
 *
 * This element defines how a shape or picture is positioned, sized,
 * rotated, and flipped within the document.
 *
 * Reference: http://officeopenxml.com/drwSp-size.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Transform2D">
 *   <xsd:sequence>
 *     <xsd:element name="off" type="CT_Point2D" minOccurs="0"/>
 *     <xsd:element name="ext" type="CT_PositiveSize2D" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="rot" type="ST_Angle" use="optional"/>
 *   <xsd:attribute name="flipH" type="xsd:boolean" use="optional"/>
 *   <xsd:attribute name="flipV" type="xsd:boolean" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const form = new Form({
 *   emus: { x: 914400, y: 914400 },
 *   flip: { horizontal: true, vertical: false },
 *   rotation: 450000 // 7.5 degrees
 * });
 * ```
 */
export class Form extends XmlComponent {
    private readonly extents: Extents;
    private readonly offset: Offset;

    public constructor(options: IMediaDataTransformation) {
        super("a:xfrm");

        this.root.push(
            new FormAttributes({
                flipVertical: options.flip?.vertical,
                flipHorizontal: options.flip?.horizontal,
                rotation: options.rotation,
            }),
        );

        this.offset = new Offset(options.offset?.emus?.x, options.offset?.emus?.y);
        this.extents = new Extents(options.emus.x, options.emus.y);

        this.root.push(this.offset);
        this.root.push(this.extents);
    }
}
