import { XmlAttributeComponent } from "file/xml-components";

export interface IHeaderAttributesProperties {
    wpc?: string;
    mc?: string;
    o?: string;
    r?: string;
    m?: string;
    v?: string;
    wp14?: string;
    wp?: string;
    w10?: string;
    w?: string;
    w14?: string;
    w15?: string;
    wpg?: string;
    wpi?: string;
    wne?: string;
    wps?: string;
    cp?: string;
    dc?: string;
    dcterms?: string;
    dcmitype?: string;
    xsi?: string;
    type?: string;
    cx?: string;
    cx1?: string;
    cx2?: string;
    cx3?: string;
    cx4?: string;
    cx5?: string;
    cx6?: string;
    cx7?: string;
    cx8?: string;
    w16cid: string;
    w16se: string;
}

export class HeaderAttributes extends XmlAttributeComponent<IHeaderAttributesProperties> {
    protected xmlKeys = {
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
