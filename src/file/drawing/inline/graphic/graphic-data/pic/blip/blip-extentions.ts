/**
 * Blip extensions module for SVG support.
 *
 * This module provides extension elements that enable SVG image support
 * within blip elements using Office-specific extensions.
 *
 * Reference: http://officeopenxml.com/drwPic.php
 *
 * @module
 */
import { IMediaData } from "@file/media";
import { BuilderElement, XmlComponent } from "@file/xml-components";

/**
 * Creates an SVG blip element for embedding SVG images.
 *
 * This element is a Microsoft Office extension that allows SVG images
 * to be referenced within a blip.
 *
 * @param mediaData - The media data containing the SVG image information
 * @returns An XML component representing the SVG blip element
 * @internal
 */
const createSvgBlip = (mediaData: IMediaData): XmlComponent =>
    new BuilderElement({
        name: "asvg:svgBlip",
        attributes: {
            asvg: {
                key: "xmlns:asvg",
                value: "http://schemas.microsoft.com/office/drawing/2016/SVG/main",
            },
            embed: {
                key: "r:embed",
                value: `rId{${mediaData.fileName}}`,
            },
        },
    });

/**
 * Creates an extension element for SVG support.
 *
 * This element wraps the SVG blip extension with the appropriate URI
 * to identify it as an SVG extension.
 *
 * @param mediaData - The media data containing the SVG image information
 * @returns An XML component representing the extension element
 * @internal
 */
const createExtention = (mediaData: IMediaData): XmlComponent =>
    new BuilderElement({
        name: "a:ext",
        attributes: {
            uri: {
                key: "uri",
                value: "{96DAC541-7B7A-43D3-8B79-37D633B846F1}",
            },
        },
        children: [createSvgBlip(mediaData)],
    });

/**
 * Creates an extension list for SVG images.
 *
 * This element contains the extensions needed to embed SVG images
 * within a blip. It wraps the SVG-specific extension elements.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_OfficeArtExtensionList">
 *   <xsd:sequence>
 *     <xsd:element name="ext" type="CT_OfficeArtExtension" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 *
 * @param mediaData - The media data containing the SVG image information
 * @returns An XML component representing the extension list
 */
export const createExtentionList = (mediaData: IMediaData): XmlComponent =>
    new BuilderElement({
        name: "a:extLst",
        children: [createExtention(mediaData)],
    });
