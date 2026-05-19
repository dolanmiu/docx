import { XmlAttributeComponent } from "@file/xml-components";

/**
 * XML namespace attributes for header elements.
 *
 * This interface defines all XML namespace declarations that can be used in header elements,
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
 * @property cx - ChartEx namespace (Office 2014+)
 * @property cx1 - ChartEx namespace (September 2015)
 * @property cx2 - ChartEx namespace (October 2015)
 * @property cx3 - ChartEx namespace (May 2016)
 * @property cx4 - ChartEx namespace (May 2016)
 * @property cx5 - ChartEx namespace (May 2016)
 * @property cx6 - ChartEx namespace (May 2016)
 * @property cx7 - ChartEx namespace (May 2016)
 * @property cx8 - ChartEx namespace (May 2016)
 * @property w16cid - WordprocessingML CID namespace (Word 2016+)
 * @property w16se - WordprocessingML SymEx namespace (Word 2015+)
 */
export type IHeaderAttributesProperties = {
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
    readonly cx?: string;
    readonly cx1?: string;
    readonly cx2?: string;
    readonly cx3?: string;
    readonly cx4?: string;
    readonly cx5?: string;
    readonly cx6?: string;
    readonly cx7?: string;
    readonly cx8?: string;
    readonly w16cid: string;
    readonly w16se: string;
};

/**
 * Component for managing XML namespace attributes on header elements.
 *
 * This class handles the serialization of namespace declarations that are required
 * for proper XML validation and processing of header content in WordprocessingML documents.
 *
 * @example
 * ```typescript
 * new HeaderAttributes({
 *   w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
 *   r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
 * });
 * ```
 */
export class HeaderAttributes extends XmlAttributeComponent<IHeaderAttributesProperties> {
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
        cx: "xmlns:cx",
        cx1: "xmlns:cx1",
        cx2: "xmlns:cx2",
        cx3: "xmlns:cx3",
        cx4: "xmlns:cx4",
        cx5: "xmlns:cx5",
        cx6: "xmlns:cx6",
        cx7: "xmlns:cx7",
        cx8: "xmlns:cx8",
        w16cid: "xmlns:w16cid",
        w16se: "xmlns:w16se",
    };
}
