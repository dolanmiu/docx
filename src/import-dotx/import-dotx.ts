import * as JSZip from "jszip";
import { Element as XMLElement, ElementCompact as XMLElementCompact, xml2js } from "xml-js";

import { FooterReferenceType } from "file/document/body/section-properties/footer-reference";
import { HeaderReferenceType } from "file/document/body/section-properties/header-reference";
import { FooterWrapper, IDocumentFooter } from "file/footer-wrapper";
import { HeaderWrapper, IDocumentHeader } from "file/header-wrapper";
import { convertToXmlComponent, ImportedXmlComponent } from "file/xml-components";

import { Media } from "file/media";
import { Styles } from "file/styles";
import { ExternalStylesFactory } from "file/styles/external-styles-factory";

const schemeToType = {
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header": "header",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer": "footer",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image": "image",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink": "hyperlink",
};

interface IDocumentRefs {
    readonly headers: Array<{ readonly id: number; readonly type: HeaderReferenceType }>;
    readonly footers: Array<{ readonly id: number; readonly type: FooterReferenceType }>;
}

interface IRelationshipFileInfo {
    readonly id: number;
    readonly target: string;
    readonly type: "header" | "footer" | "image" | "hyperlink";
}

// Document Template
// https://fileinfo.com/extension/dotx
export interface IDocumentTemplate {
    readonly currentRelationshipId: number;
    readonly headers: IDocumentHeader[];
    readonly footers: IDocumentFooter[];
    readonly styles: Styles;
    readonly titlePageIsDefined: boolean;
}

export class ImportDotx {
    // tslint:disable-next-line:readonly-keyword
    private currentRelationshipId: number;

    constructor() {
        this.currentRelationshipId = 1;
    }

    public async extract(data: Buffer): Promise<IDocumentTemplate> {
        const zipContent = await JSZip.loadAsync(data);

        const stylesContent = await zipContent.files["word/styles.xml"].async("text");
        const stylesFactory = new ExternalStylesFactory();
        const styles = stylesFactory.newInstance(stylesContent);

        const documentContent = zipContent.files["word/document.xml"];
        const documentRefs: IDocumentRefs = this.extractDocumentRefs(await documentContent.async("text"));
        const titlePageIsDefined = this.titlePageIsDefined(await documentContent.async("text"));

        const relationshipContent = zipContent.files["word/_rels/document.xml.rels"];
        const documentRelationships: IRelationshipFileInfo[] = this.findReferenceFiles(await relationshipContent.async("text"));

        const media = new Media();

        const headers: IDocumentHeader[] = [];
        for (const headerRef of documentRefs.headers) {
            const relationFileInfo = documentRelationships.find((rel) => rel.id === headerRef.id);
            if (relationFileInfo === null || !relationFileInfo) {
                throw new Error(`Can not find target file for id ${headerRef.id}`);
            }

            const xmlData = await zipContent.files[`word/${relationFileInfo.target}`].async("text");
            const xmlObj = xml2js(xmlData, { compact: false, captureSpacesBetweenElements: true }) as XMLElement;
            let headerXmlElement: XMLElement | undefined;
            for (const xmlElm of xmlObj.elements || []) {
                if (xmlElm.name === "w:hdr") {
                    headerXmlElement = xmlElm;
                }
            }
            if (headerXmlElement === undefined) {
                continue;
            }
            const importedComp = convertToXmlComponent(headerXmlElement) as ImportedXmlComponent;
            const header = new HeaderWrapper(media, this.currentRelationshipId++, importedComp);
            await this.addRelationToWrapper(relationFileInfo, zipContent, header);
            headers.push({ type: headerRef.type, header });
        }

        const footers: IDocumentFooter[] = [];
        for (const footerRef of documentRefs.footers) {
            const relationFileInfo = documentRelationships.find((rel) => rel.id === footerRef.id);
            if (relationFileInfo === null || !relationFileInfo) {
                throw new Error(`Can not find target file for id ${footerRef.id}`);
            }
            const xmlData = await zipContent.files[`word/${relationFileInfo.target}`].async("text");
            const xmlObj = xml2js(xmlData, { compact: false, captureSpacesBetweenElements: true }) as XMLElement;
            let footerXmlElement: XMLElement | undefined;
            for (const xmlElm of xmlObj.elements || []) {
                if (xmlElm.name === "w:ftr") {
                    footerXmlElement = xmlElm;
                }
            }
            if (footerXmlElement === undefined) {
                continue;
            }
            const importedComp = convertToXmlComponent(footerXmlElement) as ImportedXmlComponent;
            const footer = new FooterWrapper(media, this.currentRelationshipId++, importedComp);
            await this.addRelationToWrapper(relationFileInfo, zipContent, footer);
            footers.push({ type: footerRef.type, footer });
        }

        const templateDocument: IDocumentTemplate = {
            headers,
            footers,
            currentRelationshipId: this.currentRelationshipId,
            styles,
            titlePageIsDefined,
        };
        return templateDocument;
    }

    public async addRelationToWrapper(
        relationhipFile: IRelationshipFileInfo,
        zipContent: JSZip,
        wrapper: HeaderWrapper | FooterWrapper,
    ): Promise<void> {
        let wrapperImagesReferences: IRelationshipFileInfo[] = [];
        let hyperLinkReferences: IRelationshipFileInfo[] = [];
        const refFile = zipContent.files[`word/_rels/${relationhipFile.target}.rels`];
        if (refFile) {
            const xmlRef = await refFile.async("text");
            wrapperImagesReferences = this.findReferenceFiles(xmlRef).filter((r) => r.type === "image");
            hyperLinkReferences = this.findReferenceFiles(xmlRef).filter((r) => r.type === "hyperlink");
        }
        for (const r of wrapperImagesReferences) {
            const buffer = await zipContent.files[`word/${r.target}`].async("nodebuffer");
            wrapper.addImageRelationship(buffer, r.id);
        }
        for (const r of hyperLinkReferences) {
            wrapper.addHyperlinkRelationship(r.target, r.id, "External");
        }
    }

    public findReferenceFiles(xmlData: string): IRelationshipFileInfo[] {
        const xmlObj = xml2js(xmlData, { compact: true }) as XMLElementCompact;
        const relationXmlArray = Array.isArray(xmlObj.Relationships.Relationship)
            ? xmlObj.Relationships.Relationship
            : [xmlObj.Relationships.Relationship];
        const relationships: IRelationshipFileInfo[] = relationXmlArray
            .map((item: XMLElementCompact) => {
                if (item._attributes === undefined) {
                    throw Error("relationship element has no attributes");
                }
                return {
                    id: this.parseRefId(item._attributes.Id as string),
                    type: schemeToType[item._attributes.Type as string],
                    target: item._attributes.Target as string,
                };
            })
            .filter((item) => item.type !== null);
        return relationships;
    }

    public extractDocumentRefs(xmlData: string): IDocumentRefs {
        const xmlObj = xml2js(xmlData, { compact: true }) as XMLElementCompact;
        const sectionProp = xmlObj["w:document"]["w:body"]["w:sectPr"];

        const headerProps: XMLElementCompact = sectionProp["w:headerReference"];
        let headersXmlArray: XMLElementCompact[];
        if (headerProps === undefined) {
            headersXmlArray = [];
        } else if (Array.isArray(headerProps)) {
            headersXmlArray = headerProps;
        } else {
            headersXmlArray = [headerProps];
        }
        const headers = headersXmlArray.map((item) => {
            if (item._attributes === undefined) {
                throw Error("header referecne element has no attributes");
            }
            return {
                type: item._attributes["w:type"] as HeaderReferenceType,
                id: this.parseRefId(item._attributes["r:id"] as string),
            };
        });

        const footerProps: XMLElementCompact = sectionProp["w:footerReference"];
        let footersXmlArray: XMLElementCompact[];
        if (footerProps === undefined) {
            footersXmlArray = [];
        } else if (Array.isArray(footerProps)) {
            footersXmlArray = footerProps;
        } else {
            footersXmlArray = [footerProps];
        }

        const footers = footersXmlArray.map((item) => {
            if (item._attributes === undefined) {
                throw Error("footer referecne element has no attributes");
            }
            return {
                type: item._attributes["w:type"] as FooterReferenceType,
                id: this.parseRefId(item._attributes["r:id"] as string),
            };
        });

        return { headers, footers };
    }

    public titlePageIsDefined(xmlData: string): boolean {
        const xmlObj = xml2js(xmlData, { compact: true }) as XMLElementCompact;
        const sectionProp = xmlObj["w:document"]["w:body"]["w:sectPr"];
        return sectionProp["w:titlePg"] !== undefined;
    }

    public parseRefId(str: string): number {
        const match = /^rId(\d+)$/.exec(str);
        if (match === null) {
            throw new Error("Invalid ref id");
        }
        return parseInt(match[1], 10);
    }
}
