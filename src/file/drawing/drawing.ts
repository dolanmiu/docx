/**
 * Drawing module for WordprocessingML documents.
 *
 * This module provides support for images and shapes in documents.
 *
 * Reference: http://officeopenxml.com/drwOverview.php
 *
 * @module
 */
import { IMediaData } from "@file/media";
import { XmlComponent } from "@file/xml-components";

import { Anchor } from "./anchor";
import { DocPropertiesOptions } from "./doc-properties/doc-properties";
import { IFloating } from "./floating";
import { createInline } from "./inline";
import { OutlineOptions } from "./inline/graphic/graphic-data/pic/shape-properties/outline/outline";

/**
 * Distance options for drawing elements.
 *
 * Specifies the margins around a drawing element.
 */
export type IDistance = {
    readonly distT?: number;
    readonly distB?: number;
    readonly distL?: number;
    readonly distR?: number;
};

/**
 * Options for configuring a drawing element.
 *
 * @see {@link Drawing}
 */
export type IDrawingOptions = {
    readonly floating?: IFloating;
    readonly docProperties?: DocPropertiesOptions;
    readonly outline?: OutlineOptions;
};

/**
 * Represents a drawing element in a WordprocessingML document.
 *
 * Drawings can be either inline (positioned as part of the text flow) or
 * anchored (positioned relative to the page, column, or paragraph).
 *
 * Reference: http://officeopenxml.com/drwOverview.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Drawing">
 *   <xsd:choice minOccurs="1" maxOccurs="unbounded">
 *     <xsd:element ref="wp:anchor" minOccurs="0"/>
 *     <xsd:element ref="wp:inline" minOccurs="0"/>
 *   </xsd:choice>
 * </xsd:complexType>
 * ```
 */
export class Drawing extends XmlComponent {
    public constructor(imageData: IMediaData, drawingOptions: IDrawingOptions = {}) {
        super("w:drawing");

        if (!drawingOptions.floating) {
            this.root.push(
                createInline({
                    mediaData: imageData,
                    transform: imageData.transformation,
                    docProperties: drawingOptions.docProperties,
                    outline: drawingOptions.outline,
                }),
            );
        } else {
            this.root.push(new Anchor({ mediaData: imageData, transform: imageData.transformation, drawingOptions }));
        }
    }
}
