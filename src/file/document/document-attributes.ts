import { XmlAttributeComponent } from "@file/xml-components";

/* cSpell:disable */
export interface IDocumentAttributesProperties {
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
    readonly Ignorable?: string;
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
    readonly aink?: string;
    readonly am3d?: string;
    readonly w16cex?: string;
    readonly w16cid?: string;
    readonly w16?: string;
    readonly w16sdtdh?: string;
    readonly w16se?: string;
}
/* cSpell:enable */

export class DocumentAttributes extends XmlAttributeComponent<IDocumentAttributesProperties> {
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
        Ignorable: "mc:Ignorable",
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
        aink: "xmlns:aink",
        am3d: "xmlns:am3d",
        w16cex: "xmlns:w16cex",
        w16cid: "xmlns:w16cid",
        w16: "xmlns:w16",
        w16sdtdh: "xmlns:w16sdtdh",
        w16se: "xmlns:w16se",
    };
}
