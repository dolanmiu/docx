/**
 * Style definition module for WordprocessingML documents.
 *
 * Provides base style functionality for paragraph and character styles.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * @module
 */
import { OnOffElement, StringValueElement, XmlAttributeComponent, XmlComponent } from "@file/xml-components";

import { Name, UiPriority } from "./components";

// <xsd:complexType name="CT_Style">
//     <xsd:sequence>
//         <xsd:element name="name" type="CT_String" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="aliases" type="CT_String" minOccurs="0"/>
//         <xsd:element name="basedOn" type="CT_String" minOccurs="0"/>
//         <xsd:element name="next" type="CT_String" minOccurs="0"/>
//         <xsd:element name="link" type="CT_String" minOccurs="0"/>
//         <xsd:element name="autoRedefine" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="hidden" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="uiPriority" type="CT_DecimalNumber" minOccurs="0"/>
//         <xsd:element name="semiHidden" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="unhideWhenUsed" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="qFormat" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="locked" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="personal" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="personalCompose" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="personalReply" type="CT_OnOff" minOccurs="0"/>
//         <xsd:element name="rsid" type="CT_LongHexNumber" minOccurs="0"/>
//         <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="rPr" type="CT_RPr" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblPr" type="CT_TblPrBase" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="trPr" type="CT_TrPr" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tcPr" type="CT_TcPr" minOccurs="0" maxOccurs="1"/>
//         <xsd:element name="tblStylePr" type="CT_TblStylePr" minOccurs="0" maxOccurs="unbounded"/>
//     </xsd:sequence>
//     <xsd:attribute name="type" type="ST_StyleType" use="optional"/>
//     <xsd:attribute name="styleId" type="s:ST_String" use="optional"/>
//     <xsd:attribute name="default" type="s:ST_OnOff" use="optional"/>
//     <xsd:attribute name="customStyle" type="s:ST_OnOff" use="optional"/>
// </xsd:complexType>

/**
 * Attributes for style elements.
 *
 * @property type - Type of style (paragraph, character, table, numbering)
 * @property styleId - Unique identifier for the style
 * @property default - Whether this is the default style for its type
 * @property customStyle - Whether this is a custom user-defined style
 */
export type IStyleAttributes = {
    /** Type of style (paragraph, character, table, numbering) */
    readonly type?: string;
    /** Unique identifier for the style */
    readonly styleId?: string;
    /** Whether this is the default style for its type */
    readonly default?: boolean;
    /** Whether this is a custom user-defined style */
    readonly customStyle?: string;
};

/**
 * Options for configuring a style.
 *
 * @property name - Display name of the style
 * @property basedOn - Style ID that this style inherits from (must be same type)
 * @property next - Style to automatically apply to the next paragraph
 * @property link - Linked style ID for paragraph/character style pairing
 * @property uiPriority - Priority for displaying in the UI (lower numbers appear first)
 * @property semiHidden - Whether the style is semi-hidden in the UI
 * @property unhideWhenUsed - Whether the style should unhide when used
 * @property quickFormat - Whether the style appears in the quick format gallery
 */
export type IStyleOptions = {
    /** Display name of the style */
    readonly name?: string;
    /**
     * Specifies the style upon which the current style is based-that is, the style from which the current style inherits. It is the mechanism for implementing style inheritance.
     * Note that if the type of the current style must match the type of the style upon which it is based or the basedOn element will be ignored.
     * However, if the current style is a numbering style, then the `basedOn` element is ignored.
     *
     * **WARNING**: You cannot set `basedOn` to be the same as `name`. This is akin to inheriting from itself. This creates a cyclic dependency and cause undesirable behavior.
     */
    readonly basedOn?: string;
    /** Style to automatically apply to the next paragraph */
    readonly next?: string;
    /** Linked style ID for paragraph/character style pairing */
    readonly link?: string;
    /** Priority for displaying in the UI (lower numbers appear first) */
    readonly uiPriority?: number;
    /** Whether the style is semi-hidden in the UI */
    readonly semiHidden?: boolean;
    /** Whether the style should unhide when used */
    readonly unhideWhenUsed?: boolean;
    /** Whether the style appears in the quick format gallery */
    readonly quickFormat?: boolean;
};

/**
 * Represents style attributes for XML serialization.
 *
 * @internal
 */
class StyleAttributes extends XmlAttributeComponent<IStyleAttributes> {
    protected readonly xmlKeys = {
        type: "w:type",
        styleId: "w:styleId",
        default: "w:default",
        customStyle: "w:customStyle",
    };
}

/**
 * Represents a base style definition in a WordprocessingML document.
 *
 * This is the base class for paragraph and character styles. It defines common
 * style properties such as name, inheritance (basedOn), UI priority, and visibility.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_Style">
 *   <xsd:sequence>
 *     <xsd:element name="name" type="CT_String" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="aliases" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="basedOn" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="next" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="link" type="CT_String" minOccurs="0"/>
 *     <xsd:element name="autoRedefine" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="hidden" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="uiPriority" type="CT_DecimalNumber" minOccurs="0"/>
 *     <xsd:element name="semiHidden" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="unhideWhenUsed" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="qFormat" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="locked" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="personal" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="personalCompose" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="personalReply" type="CT_OnOff" minOccurs="0"/>
 *     <xsd:element name="rsid" type="CT_LongHexNumber" minOccurs="0"/>
 *     <xsd:element name="pPr" type="CT_PPrGeneral" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="rPr" type="CT_RPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblPr" type="CT_TblPrBase" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="trPr" type="CT_TrPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tcPr" type="CT_TcPr" minOccurs="0" maxOccurs="1"/>
 *     <xsd:element name="tblStylePr" type="CT_TblStylePr" minOccurs="0" maxOccurs="unbounded"/>
 *   </xsd:sequence>
 *   <xsd:attribute name="type" type="ST_StyleType" use="optional"/>
 *   <xsd:attribute name="styleId" type="s:ST_String" use="optional"/>
 *   <xsd:attribute name="default" type="s:ST_OnOff" use="optional"/>
 *   <xsd:attribute name="customStyle" type="s:ST_OnOff" use="optional"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // This is typically extended by StyleForParagraph or StyleForCharacter
 * // See those classes for usage examples
 * ```
 */
export class Style extends XmlComponent {
    public constructor(attributes: IStyleAttributes, options: IStyleOptions) {
        super("w:style");
        this.root.push(new StyleAttributes(attributes));
        if (options.name) {
            this.root.push(new Name(options.name));
        }

        if (options.basedOn) {
            this.root.push(new StringValueElement("w:basedOn", options.basedOn));
        }

        if (options.next) {
            this.root.push(new StringValueElement("w:next", options.next));
        }

        if (options.link) {
            this.root.push(new StringValueElement("w:link", options.link));
        }

        if (options.uiPriority !== undefined) {
            this.root.push(new UiPriority(options.uiPriority));
        }

        if (options.semiHidden !== undefined) {
            this.root.push(new OnOffElement("w:semiHidden", options.semiHidden));
        }

        if (options.unhideWhenUsed !== undefined) {
            this.root.push(new OnOffElement("w:unhideWhenUsed", options.unhideWhenUsed));
        }

        if (options.quickFormat !== undefined) {
            this.root.push(new OnOffElement("w:qFormat", options.quickFormat));
        }
    }
}
