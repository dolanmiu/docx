/* eslint-disable */
// This will be deprecated soon
import * as JSZip from "jszip";
import { Element as XMLElement, ElementCompact as XMLElementCompact, xml2js } from "xml-js";

import { HeaderFooterReferenceType } from "@file/document/body/section-properties";
import { FooterWrapper, IDocumentFooter } from "@file/footer-wrapper";
import { HeaderWrapper, IDocumentHeader } from "@file/header-wrapper";
import { Media } from "@file/media";
import { TargetModeType } from "@file/relationships/relationship/relationship";
import { convertToXmlComponent, ImportedXmlComponent } from "@file/xml-components";

const schemeToType = {
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header": "header",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer": "footer",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image": "image",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink": "hyperlink",
};

interface IDocumentRefs {
    readonly headers: { readonly id: number; readonly type: HeaderFooterReferenceType }[];
    readonly footers: { readonly id: number; readonly type: HeaderFooterReferenceType }[];
}

enum RelationshipType {
    HEADER = "header",
    FOOTER = "footer",
    IMAGE = "image",
    HYPERLINK = "hyperlink",
}

interface IRelationshipFileInfo {
    readonly id: number;
    readonly target: string;
    readonly type: RelationshipType;
}

// Document Template
// https://fileinfo.com/extension/dotx
export interface IDocumentTemplate {
    readonly currentRelationshipId: number;
    readonly headers: IDocumentHeader[];
    readonly footers: IDocumentFooter[];
    readonly styles: string;
    readonly titlePageIsDefined: boolean;
    readonly media: Media;
}

export class ImportDotx {
    public async extract(
        data: Buffer | string | number[] | Uint8Array | ArrayBuffer | Blob | NodeJS.ReadableStream,
    ): Promise<IDocumentTemplate> {
        const zipContent = await JSZip.loadAsync(data);

        const documentContent = await zipContent.files["word/document.xml"].async("text");
        const relationshipContent = await zipContent.files["word/_rels/document.xml.rels"].async("text");

        const documentRefs = this.extractDocumentRefs(documentContent);
        const documentRelationships = this.findReferenceFiles(relationshipContent);

        const media = new Media();

        const templateDocument: IDocumentTemplate = {
            headers: await this.createHeaders(zipContent, documentRefs, documentRelationships, media, 0),
            footers: await this.createFooters(zipContent, documentRefs, documentRelationships, media, documentRefs.headers.length),
            currentRelationshipId: documentRefs.footers.length + documentRefs.headers.length,
            styles: await zipContent.files["word/styles.xml"].async("text"),
            titlePageIsDefined: this.checkIfTitlePageIsDefined(documentContent),
            media: media,
        };

        return templateDocument;
    }

    private async createFooters(
        zipContent: JSZip,
        documentRefs: IDocumentRefs,
        documentRelationships: IRelationshipFileInfo[],
        media: Media,
        startingRelationshipId: number,
    ): Promise<IDocumentFooter[]> {
        const result = documentRefs.footers
            .map(async (reference, i) => {
                const relationshipFileInfo = documentRelationships.find((rel) => rel.id === reference.id);

                if (relationshipFileInfo === null || !relationshipFileInfo) {
                    throw new Error(`Can not find target file for id ${reference.id}`);
                }

                const xmlData = await zipContent.files[`word/${relationshipFileInfo.target}`].async("text");
                const xmlObj = xml2js(xmlData, { compact: false, captureSpacesBetweenElements: true }) as XMLElement;

                if (!xmlObj.elements) {
                    return undefined;
                }

                const xmlElement = xmlObj.elements.reduce((acc, current) => (current.name === "w:ftr" ? current : acc));

                const importedComp = convertToXmlComponent(xmlElement) as ImportedXmlComponent;
                const wrapper = new FooterWrapper(media, startingRelationshipId + i, importedComp);
                await this.addRelationshipToWrapper(relationshipFileInfo, zipContent, wrapper, media);

                return { type: reference.type, footer: wrapper };
            })
            .filter((x) => !!x) as Promise<IDocumentFooter>[];

        return Promise.all(result);
    }

    private async createHeaders(
        zipContent: JSZip,
        documentRefs: IDocumentRefs,
        documentRelationships: IRelationshipFileInfo[],
        media: Media,
        startingRelationshipId: number,
    ): Promise<IDocumentHeader[]> {
        const result = documentRefs.headers
            .map(async (reference, i) => {
                const relationshipFileInfo = documentRelationships.find((rel) => rel.id === reference.id);

                if (relationshipFileInfo === null || !relationshipFileInfo) {
                    throw new Error(`Can not find target file for id ${reference.id}`);
                }

                const xmlData = await zipContent.files[`word/${relationshipFileInfo.target}`].async("text");
                const xmlObj = xml2js(xmlData, { compact: false, captureSpacesBetweenElements: true }) as XMLElement;

                if (!xmlObj.elements) {
                    return undefined;
                }

                const xmlElement = xmlObj.elements.reduce((acc, current) => (current.name === "w:hdr" ? current : acc));

                const importedComp = convertToXmlComponent(xmlElement) as ImportedXmlComponent;
                const wrapper = new HeaderWrapper(media, startingRelationshipId + i, importedComp);
                await this.addRelationshipToWrapper(relationshipFileInfo, zipContent, wrapper, media);

                return { type: reference.type, header: wrapper };
            })
            .filter((x) => !!x) as Promise<IDocumentHeader>[];

        return Promise.all(result);
    }

    private async addRelationshipToWrapper(
        relationshipFile: IRelationshipFileInfo,
        zipContent: JSZip,
        wrapper: HeaderWrapper | FooterWrapper,
        media: Media,
    ): Promise<void> {
        const refFile = zipContent.files[`word/_rels/${relationshipFile.target}.rels`];

        if (!refFile) {
            return;
        }

        const xmlRef = await refFile.async("text");
        const wrapperImagesReferences = this.findReferenceFiles(xmlRef).filter((r) => r.type === RelationshipType.IMAGE);
        const hyperLinkReferences = this.findReferenceFiles(xmlRef).filter((r) => r.type === RelationshipType.HYPERLINK);

        for (const r of wrapperImagesReferences) {
            const bufferType = JSZip.support.arraybuffer ? "arraybuffer" : "nodebuffer";
            const buffer = await zipContent.files[`word/${r.target}`].async(bufferType);
            const mediaData = media.addMedia(buffer, {
                width: 100,
                height: 100,
            });

            wrapper.Relationships.createRelationship(
                r.id,
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image",
                `media/${mediaData.fileName}`,
            );
        }

        for (const r of hyperLinkReferences) {
            wrapper.Relationships.createRelationship(
                r.id,
                "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
                r.target,
                TargetModeType.EXTERNAL,
            );
        }
    }

    private findReferenceFiles(xmlData: string): IRelationshipFileInfo[] {
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

    private extractDocumentRefs(xmlData: string): IDocumentRefs {
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
                throw Error("header reference element has no attributes");
            }
            return {
                type: item._attributes["w:type"] as HeaderFooterReferenceType,
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
                throw Error("footer reference element has no attributes");
            }
            return {
                type: item._attributes["w:type"] as HeaderFooterReferenceType,
                id: this.parseRefId(item._attributes["r:id"] as string),
            };
        });

        return { headers, footers };
    }

    private checkIfTitlePageIsDefined(xmlData: string): boolean {
        const xmlObj = xml2js(xmlData, { compact: true }) as XMLElementCompact;
        const sectionProp = xmlObj["w:document"]["w:body"]["w:sectPr"];

        return sectionProp["w:titlePg"] !== undefined;
    }

    private parseRefId(str: string): number {
        const match = /^rId(\d+)$/.exec(str);
        if (match === null) {
            throw new Error("Invalid ref id");
        }
        return parseInt(match[1], 10);
    }
}
