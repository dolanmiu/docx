/**
 * Blip fill module for DrawingML pictures.
 *
 * This module defines how an image (blip) fills a picture shape,
 * including stretching and cropping options.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
import { IMediaData } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { createBlip } from "./blip";
import { SourceRectangle } from "./source-rectangle";
import { Stretch } from "./stretch";

/**
 * Represents a blip fill for pictures in DrawingML.
 *
 * This element specifies the type of fill used for a picture. It contains the blip (image)
 * reference, an optional source rectangle, and the fill mode (typically stretch).
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_BlipFillProperties">
 *   <xsd:sequence>
 *     <xsd:element name="blip" type="CT_Blip" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="srcRect" type="CT_RelativeRect" minOccurs="0" maxOccurs="1"/>
 *     <xsd:group ref="EG_FillModeProperties" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="dpi" type="xsd:unsignedInt" use="optional"/>
 *   <xsd:attribute name="rotWithShape" type="xsd:boolean" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * const blipFill = new BlipFill(mediaData);
 * ```
 */
export class BlipFill extends XmlComponent {
    public constructor(mediaData: IMediaData) {
        super("pic:blipFill");

        this.root.push(createBlip(mediaData));
        this.root.push(new SourceRectangle());
        this.root.push(new Stretch());
    }
}
