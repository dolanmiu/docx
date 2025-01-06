import { AttributeMap, XmlAttributeComponent } from "@file/xml-components";

/* cSpell:disable */
export const DocumentAttributeNamespaces = {
    wpc: "http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas",
    mc: "http://schemas.openxmlformats.org/markup-compatibility/2006",
    o: "urn:schemas-microsoft-com:office:office",
    r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    m: "http://schemas.openxmlformats.org/officeDocument/2006/math",
    v: "urn:schemas-microsoft-com:vml",
    wp14: "http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing",
    wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
    w10: "urn:schemas-microsoft-com:office:word",
    w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
    w14: "http://schemas.microsoft.com/office/word/2010/wordml",
    w15: "http://schemas.microsoft.com/office/word/2012/wordml",
    wpg: "http://schemas.microsoft.com/office/word/2010/wordprocessingGroup",
    wpi: "http://schemas.microsoft.com/office/word/2010/wordprocessingInk",
    wne: "http://schemas.microsoft.com/office/word/2006/wordml",
    wps: "http://schemas.microsoft.com/office/word/2010/wordprocessingShape",
    cp: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
    dc: "http://purl.org/dc/elements/1.1/",
    dcterms: "http://purl.org/dc/terms/",
    dcmitype: "http://purl.org/dc/dcmitype/",
    xsi: "http://www.w3.org/2001/XMLSchema-instance",
    cx: "http://schemas.microsoft.com/office/drawing/2014/chartex",
    cx1: "http://schemas.microsoft.com/office/drawing/2015/9/8/chartex",
    cx2: "http://schemas.microsoft.com/office/drawing/2015/10/21/chartex",
    cx3: "http://schemas.microsoft.com/office/drawing/2016/5/9/chartex",
    cx4: "http://schemas.microsoft.com/office/drawing/2016/5/10/chartex",
    cx5: "http://schemas.microsoft.com/office/drawing/2016/5/11/chartex",
    cx6: "http://schemas.microsoft.com/office/drawing/2016/5/12/chartex",
    cx7: "http://schemas.microsoft.com/office/drawing/2016/5/13/chartex",
    cx8: "http://schemas.microsoft.com/office/drawing/2016/5/14/chartex",
    aink: "http://schemas.microsoft.com/office/drawing/2016/ink",
    am3d: "http://schemas.microsoft.com/office/drawing/2017/model3d",
    w16cex: "http://schemas.microsoft.com/office/word/2018/wordml/cex",
    w16cid: "http://schemas.microsoft.com/office/word/2016/wordml/cid",
    w16: "http://schemas.microsoft.com/office/word/2018/wordml",
    w16sdtdh: "http://schemas.microsoft.com/office/word/2020/wordml/sdtdatahash",
    w16se: "http://schemas.microsoft.com/office/word/2015/wordml/symex",
};
/* cSpell:enable */

export type DocumentAttributeNamespace = keyof typeof DocumentAttributeNamespaces;

export type IDocumentAttributesProperties = Partial<Record<DocumentAttributeNamespace, string>> & {
    readonly Ignorable?: string;
};

export class DocumentAttributes extends XmlAttributeComponent<IDocumentAttributesProperties> {
    protected readonly xmlKeys = {
        Ignorable: "mc:Ignorable",
        ...Object.fromEntries(Object.keys(DocumentAttributeNamespaces).map((key) => [key, `xmlns:${key}`])),
    } as AttributeMap<IDocumentAttributesProperties>;

    public constructor(ns: readonly DocumentAttributeNamespace[], Ignorable?: string) {
        super({ Ignorable, ...Object.fromEntries(ns.map((n) => [n, DocumentAttributeNamespaces[n]])) });
    }
}
