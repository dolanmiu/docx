import * as fastXmlParser from "fast-xml-parser";
import * as JSZip from "jszip";

import { FooterReferenceType } from "file/document/body/section-properties/footer-reference";
import { HeaderReferenceType } from "file/document/body/section-properties/header-reference";
import { FooterWrapper, IDocumentFooter } from "file/footer-wrapper";
import { HeaderWrapper, IDocumentHeader } from "file/header-wrapper";
import { convertToXmlComponent, ImportedXmlComponent, parseOptions } from "file/xml-components";

import { Styles } from "file/styles";
import { ExternalStylesFactory } from "file/styles/external-styles-factory";

const importParseOptions = {
    ...parseOptions,
    textNodeName: "",
    trimValues: false,
};

const schemeToType = {
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header": "header",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer": "footer",
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image": "image",
};

interface IDocumentRefs {
    headers: Array<{ id: number; type: HeaderReferenceType }>;
    footers: Array<{ id: number; type: FooterReferenceType }>;
}

interface IRelationshipFileInfo {
    id: number;
    targetFile: string;
    type: "header" | "footer" | "image";
}

// Document Template
// https://fileinfo.com/extension/dotx
export interface IDocumentTemplate {
    currentRelationshipId: number;
    headers: IDocumentHeader[];
    footers: IDocumentFooter[];
    styles: Styles;
}

export class ImportDotx {
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

        const relationshipContent = zipContent.files["word/_rels/document.xml.rels"];
        const documentRelationships: IRelationshipFileInfo[] = this.findReferenceFiles(await relationshipContent.async("text"));

        const headers: IDocumentHeader[] = [];
        for (const headerRef of documentRefs.headers) {
            const headerKey = "w:hdr";
            const relationFileInfo = documentRelationships.find((rel) => rel.id === headerRef.id);
            if (relationFileInfo === null || !relationFileInfo) {
                throw new Error(`Can not find target file for id ${headerRef.id}`);
            }

            const xmlData = await zipContent.files[`word/${relationFileInfo.targetFile}`].async("text");
            const xmlObj = fastXmlParser.parse(xmlData, importParseOptions);

            const importedComp = convertToXmlComponent(headerKey, xmlObj[headerKey]) as ImportedXmlComponent;

            const header = new HeaderWrapper(this.currentRelationshipId++, importedComp);
            await this.addImagesToWrapper(relationFileInfo, zipContent, header);
            headers.push({ type: headerRef.type, header });
        }

        const footers: IDocumentFooter[] = [];
        for (const footerRef of documentRefs.footers) {
            const footerKey = "w:ftr";
            const relationFileInfo = documentRelationships.find((rel) => rel.id === footerRef.id);
            if (relationFileInfo === null || !relationFileInfo) {
                throw new Error(`Can not find target file for id ${footerRef.id}`);
            }
            const xmlData = await zipContent.files[`word/${relationFileInfo.targetFile}`].async("text");
            const xmlObj = fastXmlParser.parse(xmlData, importParseOptions);
            const importedComp = convertToXmlComponent(footerKey, xmlObj[footerKey]) as ImportedXmlComponent;

            const footer = new FooterWrapper(this.currentRelationshipId++, importedComp);
            await this.addImagesToWrapper(relationFileInfo, zipContent, footer);
            footers.push({ type: footerRef.type, footer });
        }

        const templateDocument: IDocumentTemplate = { headers, footers, currentRelationshipId: this.currentRelationshipId, styles };
        return templateDocument;
    }

    public async addImagesToWrapper(
        relationFile: IRelationshipFileInfo,
        zipContent: JSZip,
        wrapper: HeaderWrapper | FooterWrapper,
    ): Promise<void> {
        let wrapperImagesReferences: IRelationshipFileInfo[] = [];
        const refFile = zipContent.files[`word/_rels/${relationFile.targetFile}.rels`];
        if (refFile) {
            const xmlRef = await refFile.async("text");
            wrapperImagesReferences = this.findReferenceFiles(xmlRef).filter((r) => r.type === "image");
        }
        for (const r of wrapperImagesReferences) {
            const buffer = await zipContent.files[`word/${r.targetFile}`].async("nodebuffer");
            wrapper.addImageRelationship(buffer, r.id);
        }
    }

    public findReferenceFiles(xmlData: string): IRelationshipFileInfo[] {
        const xmlObj = fastXmlParser.parse(xmlData, importParseOptions);
        const relationXmlArray = Array.isArray(xmlObj.Relationships.Relationship)
            ? xmlObj.Relationships.Relationship
            : [xmlObj.Relationships.Relationship];
        const relations: IRelationshipFileInfo[] = relationXmlArray
            .map((item) => {
                return {
                    id: this.parseRefId(item._attr.Id),
                    type: schemeToType[item._attr.Type],
                    targetFile: item._attr.Target,
                };
            })
            .filter((item) => item.type !== null);
        return relations;
    }

    public extractDocumentRefs(xmlData: string): IDocumentRefs {
        const xmlObj = fastXmlParser.parse(xmlData, importParseOptions);
        const sectionProp = xmlObj["w:document"]["w:body"]["w:sectPr"];

        const headersXmlArray = Array.isArray(sectionProp["w:headerReference"])
            ? sectionProp["w:headerReference"]
            : [sectionProp["w:headerReference"]];
        const headers = headersXmlArray.map((item) => {
            return {
                type: item._attr["w:type"],
                id: this.parseRefId(item._attr["r:id"]),
            };
        });

        const footersXmlArray = Array.isArray(sectionProp["w:footerReference"])
            ? sectionProp["w:footerReference"]
            : [sectionProp["w:footerReference"]];
        const footers = footersXmlArray.map((item) => {
            return {
                type: item._attr["w:type"],
                id: this.parseRefId(item._attr["r:id"]),
            };
        });

        return { headers, footers };
    }

    public parseRefId(str: string): number {
        const match = /^rId(\d+)$/.exec(str);
        if (match === null) {
            throw new Error("Invalid ref id");
        }
        return parseInt(match[1], 10);
    }
}
