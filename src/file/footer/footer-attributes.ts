import { XmlAttributeComponent } from "@file/xml-components";

/**
 * XML namespace attributes for footer elements.
 *
 * This interface defines all XML namespace declarations that can be used in footer elements,
 * including WordprocessingML, DrawingML, VML, and various Office-specific namespaces.
 *
 * @property wpc - WordprocessingML Canvas namespace (Word 2010+)
 * @property mc - Markup Compatibility namespace
 * @property o - Office namespace
 * @property r - Relationships namespace
 * @property m - Math namespace
 * @property v - VML (Vector Markup Language) namespace
 * @property wp14 - WordprocessingDrawing namespace (Word 2010+)
 * @property wp - WordprocessingDrawing namespace
 * @property w10 - Word 2000 namespace
 * @property w - Main WordprocessingML namespace
 * @property w14 - WordprocessingML namespace (Word 2010+)
 * @property w15 - WordprocessingML namespace (Word 2012+)
 * @property wpg - WordprocessingGroup namespace (Word 2010+)
 * @property wpi - WordprocessingInk namespace (Word 2010+)
 * @property wne - WordprocessingML namespace extensions
 * @property wps - WordprocessingShape namespace (Word 2010+)
 * @property cp - Core Properties namespace
 * @property dc - Dublin Core namespace
 * @property dcterms - Dublin Core Terms namespace
 * @property dcmitype - Dublin Core DCMI Type namespace
 * @property xsi - XML Schema Instance namespace
 * @property type - XSI type attribute
 */
export type IFooterAttributesProperties = {
    readonly wpc?: string;
    readonly mc?: string;
    readonly o?: string;
    readonly r?: string;
    readonly m?: string;
    readonly v?: string;
    readonly wp14?: string;
    readonly wp?: string;
    readonly w10?: string;
    readonly w?: string;
    readonly w14?: string;
    readonly w15?: string;
    readonly wpg?: string;
    readonly wpi?: string;
    readonly wne?: string;
    readonly wps?: string;
    readonly cp?: string;
    readonly dc?: string;
    readonly dcterms?: string;
    readonly dcmitype?: string;
    readonly xsi?: string;
    readonly type?: string;
};

/**
 * Component for managing XML namespace attributes on footer elements.
 *
 * This class handles the serialization of namespace declarations that are required
 * for proper XML validation and processing of footer content in WordprocessingML documents.
 *
 * @example
 * ```typescript
 * new FooterAttributes({
 *   w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
 *   r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 * });
 * ```
 */
export class FooterAttributes extends XmlAttributeComponent<IFooterAttributesProperties> {
    protected readonly xmlKeys = {
        wpc: "xmlns:wpc",
        mc: "xmlns:mc",
        o: "xmlns:o",
        r: "xmlns:r",
        m: "xmlns:m",
        v: "xmlns:v",
        wp14: "xmlns:wp14",
        wp: "xmlns:wp",
        w10: "xmlns:w10",
        w: "xmlns:w",
        w14: "xmlns:w14",
        w15: "xmlns:w15",
        wpg: "xmlns:wpg",
        wpi: "xmlns:wpi",
        wne: "xmlns:wne",
        wps: "xmlns:wps",
        cp: "xmlns:cp",
        dc: "xmlns:dc",
        dcterms: "xmlns:dcterms",
        dcmitype: "xmlns:dcmitype",
        xsi: "xmlns:xsi",
        type: "xsi:type",
    };
}
