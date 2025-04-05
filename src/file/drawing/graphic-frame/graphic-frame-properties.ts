import { BuilderElement, XmlComponent } from "@file/xml-components";

import { GraphicFrameLocks } from "./graphic-frame-locks/graphic-frame-locks";

/**
 * # Common DrawingML Non-Visual Properties
 *
 * This element specifies common non-visual DrawingML object properties for the parent DrawingML object. These properties are specified as child elements of this element.
 *
 * References:
 * - https://c-rex.net/samples/ooxml/e1/Part4/OOXML_P4_DOCX_cNvGraphicFramePr_topic_ID0E6U2OB.html
 *
 * ## XSD Schema
 *
 * ```xml
 * <xsd:complexType name="CT_NonVisualGraphicFrameProperties">
 *   <xsd:sequence>
 *     <xsd:element name="graphicFrameLocks" type="CT_GraphicalObjectFrameLocking" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="extLst" type="CT_OfficeArtExtensionList" minOccurs="0" maxOccurs="1"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export const createGraphicFrameProperties = (): XmlComponent =>
    new BuilderElement({
        name: "wp:cNvGraphicFramePr",
        children: [new GraphicFrameLocks()],
    });
