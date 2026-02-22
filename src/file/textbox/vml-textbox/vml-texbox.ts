/**
 * VML textbox module for WordprocessingML documents.
 *
 * Provides functionality for creating VML textbox elements that define text containers within shapes.
 *
 * Reference: http://webapp.docx4java.org/OnlineDemo/ecma376/VML/textbox.html
 *
 * @module
 */
import type { ParagraphChild } from "@file/paragraph";
import { BuilderElement, type XmlComponent } from "@file/xml-components";
import type { InsetMode } from "@util/types";

import { createTextboxContent } from "../texbox-content/textbox-content";
import type { LengthUnit } from "../types";

// type VMLTextboxStyle = {
//     readonly fontWeight?: "normal" | "lighter" | 100 | 200 | 300 | 400 | "bold" | "bolder" | 500 | 600 | 700 | 800 | 900;
// }

/**
 * Options for creating a VML textbox element.
 *
 * @property style - CSS-style string for textbox styling
 * @property children - Array of paragraph children to include in the textbox
 * @property inset - Custom inset margins for the textbox content
 */
export type IVTextboxOptions = {
    /** CSS-style string for textbox styling */
    readonly style?: string;
    /** Array of paragraph children to include in the textbox */
    readonly children?: readonly ParagraphChild[];
    /** Custom inset margins for the textbox content (top, left, bottom, right) */
    readonly inset?: {
        /** Top inset margin */
        readonly top: LengthUnit;
        /** Left inset margin */
        readonly left: LengthUnit;
        /** Bottom inset margin */
        readonly bottom: LengthUnit;
        /** Right inset margin */
        readonly right: LengthUnit;
    };
};

/**
 * Creates a VML textbox element.
 *
 * The VML textbox element (v:textbox) defines a text container within a VML shape.
 * It supports custom styling and inset margins to control text positioning within the shape.
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Textbox">
 *   <xsd:choice>
 *     <xsd:element ref="w:txbxContent" minOccurs="0"/>
 *     <xsd:any namespace="##local" processContents="skip"/>
 *   </xsd:choice>
 *   <xsd:attributeGroup ref="AG_Id"/>
 *   <xsd:attributeGroup ref="AG_Style"/>
 *   <xsd:attribute name="inset" type="xsd:string" use="optional"/>
 *   <xsd:attribute ref="o:singleclick"/>
 *   <xsd:attribute ref="o:insetmode"/>
 * </xsd:complexType>
 * ```
 *
 * @param options - Configuration options for the VML textbox
 * @returns An XmlComponent representing the v:textbox element
 *
 * @example
 * ```typescript
 * const vmlTextbox = createVmlTextbox({
 *   style: "mso-fit-shape-to-text:t;",
 *   children: [new TextRun("Hello World")],
 *   inset: {
 *     top: "0.1in",
 *     left: "0.1in",
 *     bottom: "0.1in",
 *     right: "0.1in"
 *   }
 * });
 * ```
 */
export const createVmlTextbox = ({ style, children, inset }: IVTextboxOptions): XmlComponent =>
    new BuilderElement<{ readonly style?: string; readonly inset?: string; readonly insetMode?: InsetMode }>({
        name: "v:textbox",
        attributes: {
            style: {
                key: "style",
                value: style,
            },
            insetMode: {
                key: "insetmode",
                value: inset ? "custom" : "auto",
            },
            inset: {
                key: "inset",
                value: inset ? `${inset.left}, ${inset.top}, ${inset.right}, ${inset.bottom}` : undefined,
            },
        },
        children: [createTextboxContent({ children })],
    });
