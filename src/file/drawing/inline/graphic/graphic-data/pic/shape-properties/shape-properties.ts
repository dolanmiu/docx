/**
 * Shape properties for DrawingML pictures.
 *
 * This module provides the shape properties element which defines visual
 * characteristics of a picture including transformation, geometry, and outline.
 *
 * Reference: http://officeopenxml.com/drwSp-SpPr.php
 *
 * @module
 */
// http://officeopenxml.com/drwSp-SpPr.php
import { IMediaDataTransformation } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { Form } from "./form";
import { createNoFill } from "./outline/no-fill";
import { OutlineOptions, createOutline } from "./outline/outline";
import { PresetGeometry } from "./preset-geometry/preset-geometry";
import { ShapePropertiesAttributes } from "./shape-properties-attributes";

/**
 * Represents shape properties for a DrawingML picture.
 *
 * This element defines the visual formatting of a picture, including
 * its transform (size, position, rotation, flip), geometry preset,
 * and outline properties.
 *
 * Reference: http://officeopenxml.com/drwSp-SpPr.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_ShapeProperties">
 *   <xsd:sequence>
 *     <xsd:element name="xfrm" type="CT_Transform2D" minOccurs="0"/>
 *     <xsd:group ref="EG_Geometry" minOccurs="0"/>
 *     <xsd:group ref="EG_FillProperties" minOccurs="0"/>
 *     <xsd:element name="ln" type="CT_LineProperties" minOccurs="0"/>
 *     <xsd:group ref="EG_EffectProperties" minOccurs="0"/>
 *     <xsd:element name="scene3d" type="CT_Scene3D" minOccurs="0"/>
 *     <xsd:element name="sp3d" type="CT_Shape3D" minOccurs="0"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="bwMode" type="ST_BlackWhiteMode" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const shapeProps = new ShapeProperties({
 *   transform: {
 *     emus: { x: 914400, y: 914400 },
 *     flip: { horizontal: false, vertical: false },
 *     rotation: 0
 *   },
 *   outline: {
 *     width: 9525,
 *     type: "solidFill",
 *     solidFillType: "rgb",
 *     value: "FF0000"
 *   }
 * });
 * ```
 */
export class ShapeProperties extends XmlComponent {
    private readonly form: Form;

    public constructor({ outline, transform }: { readonly outline?: OutlineOptions; readonly transform: IMediaDataTransformation }) {
        super("pic:spPr");

        this.root.push(
            new ShapePropertiesAttributes({
                bwMode: "auto",
            }),
        );

        this.form = new Form(transform);

        this.root.push(this.form);
        this.root.push(new PresetGeometry());

        if (outline) {
            this.root.push(createNoFill());
            this.root.push(createOutline(outline));
        }
    }
}
