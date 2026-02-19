import { XmlAttributeComponent, XmlComponent } from "@file/xml-components";

/**
 * Properties for latent style exception attributes.
 *
 * @property name - The name of the style for this exception
 * @property uiPriority - UI priority for displaying the style
 * @property qFormat - Whether this style should appear in the quick format gallery
 * @property semiHidden - Whether the style is semi-hidden in the UI
 * @property unhideWhenUsed - Whether the style should unhide when used
 */
export type ILatentStyleExceptionAttributesProperties = {
    /** The name of the style for this exception */
    readonly name?: string;
    /** UI priority for displaying the style */
    readonly uiPriority?: string;
    /** Whether this style should appear in the quick format gallery */
    readonly qFormat?: string;
    /** Whether the style is semi-hidden in the UI */
    readonly semiHidden?: string;
    /** Whether the style should unhide when used */
    readonly unhideWhenUsed?: string;
};

/**
 * Represents attributes for a latent style exception.
 *
 * @internal
 */
export class LatentStyleExceptionAttributes extends XmlAttributeComponent<ILatentStyleExceptionAttributesProperties> {
    protected readonly xmlKeys = {
        name: "w:name",
        uiPriority: "w:uiPriority",
        qFormat: "w:qFormat",
        semiHidden: "w:semiHidden",
        unhideWhenUsed: "w:unhideWhenUsed",
    };
}

/**
 * Represents an exception to the default latent style properties.
 *
 * This element allows specific latent styles to have different properties
 * from the defaults specified in the parent LatentStyles element.
 *
 * Reference: http://officeopenxml.com/WPstyles.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:complexType name="CT_LsdException">
 *   <xsd:attribute name="name" type="s:ST_String" use="required"/>
 *   <xsd:attribute name="locked" type="s:ST_OnOff"/>
 *   <xsd:attribute name="uiPriority" type="ST_DecimalNumber"/>
 *   <xsd:attribute name="semiHidden" type="s:ST_OnOff"/>
 *   <xsd:attribute name="unhideWhenUsed" type="s:ST_OnOff"/>
 *   <xsd:attribute name="qFormat" type="s:ST_OnOff"/>
 * </xsd:complexType>
 * ```
 *
 * @example
 * ```typescript
 * // Create an exception for Heading 1
 * new LatentStyleException({
 *   name: "Heading 1",
 *   uiPriority: "9",
 *   qFormat: "1"
 * });
 * ```
 */
export class LatentStyleException extends XmlComponent {
    public constructor(attributes: ILatentStyleExceptionAttributesProperties) {
        super("w:lsdException");
        this.root.push(new LatentStyleExceptionAttributes(attributes));
    }
}
