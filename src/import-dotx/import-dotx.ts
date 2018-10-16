import * as fastXmlParser from "fast-xml-parser";
import { xml2js, Element as XMLElement } from 'xml-js'
// var convertXmlJs = require('xml-js');
import * as JSZip from "jszip";


import { FooterReferenceType } from "file/document/body/section-properties/footer-reference";
import { HeaderReferenceType } from "file/document/body/section-properties/header-reference";
import { FooterWrapper, IDocumentFooter } from "file/footer-wrapper";
import { HeaderWrapper, IDocumentHeader } from "file/header-wrapper";
import { convertToXmlComponent, ImportedXmlComponent, parseOptions, convertToXmlComponentOld } from "file/xml-components";

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
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink": "hyperlink",
};

interface IDocumentRefs {
    headers: Array<{ id: number; type: HeaderReferenceType }>;
    footers: Array<{ id: number; type: FooterReferenceType }>;
}

interface IRelationshipFileInfo {
    id: number;
    target: string;
    type: "header" | "footer" | "image" | "hyperlink";
}

// Document Template
// https://fileinfo.com/extension/dotx
export interface IDocumentTemplate {
    currentRelationshipId: number;
    headers: IDocumentHeader[];
    footers: IDocumentFooter[];
    styles: Styles;
    titlePageIsDefined: boolean;
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
        const titlePageIsDefined = this.titlePageIsDefined(await documentContent.async("text"));

        const relationshipContent = zipContent.files["word/_rels/document.xml.rels"];
        const documentRelationships: IRelationshipFileInfo[] = this.findReferenceFiles(await relationshipContent.async("text"));

        const headers: IDocumentHeader[] = [];
        for (const headerRef of documentRefs.headers) {
            const headerKey = "w:hdr";
            const relationFileInfo = documentRelationships.find((rel) => rel.id === headerRef.id);
            if (relationFileInfo === null || !relationFileInfo) {
                throw new Error(`Can not find target file for id ${headerRef.id}`);
            }

            const xmlData = await zipContent.files[`word/${relationFileInfo.target}`].async("text");
            const xmlObjOld = fastXmlParser.parse(xmlData, importParseOptions);
            const xmlObj = xml2js(xmlData, {compact: false}) as XMLElement;
            if (xmlObj.elements === undefined || xmlObj.elements[0].name !== headerKey) {
                continue;
            }
            
            console.log('=========== fast-xml-parser header =======');
            console.log(JSON.stringify(xmlObjOld, null, 2));
            console.log('=========== xml-js header =======');
            console.log(JSON.stringify(xmlObj, null, 2));

            const headerXmlElement = xmlObj.elements[0];
            const importedComp = convertToXmlComponent(headerKey, headerXmlElement) as ImportedXmlComponent;
            console.log('=========== importedComp header =======');
            console.log(JSON.stringify(importedComp, null, 2));
            
            const importedCompOld = convertToXmlComponentOld(headerKey, xmlObjOld[headerKey]) as ImportedXmlComponent;
            console.log('=========== importedCompOld header =======');
            console.log(JSON.stringify(importedCompOld, null, 2));

            const header = new HeaderWrapper(this.currentRelationshipId++, importedCompOld);
            // const header = new HeaderWrapper(this.currentRelationshipId++, importedComp);
            await this.addRelationToWrapper(relationFileInfo, zipContent, header);
            headers.push({ type: headerRef.type, header });
        }

        const footers: IDocumentFooter[] = [];
        for (const footerRef of documentRefs.footers) {
            const footerKey = "w:ftr";
            const relationFileInfo = documentRelationships.find((rel) => rel.id === footerRef.id);
            if (relationFileInfo === null || !relationFileInfo) {
                throw new Error(`Can not find target file for id ${footerRef.id}`);
            }
            const xmlData = await zipContent.files[`word/${relationFileInfo.target}`].async("text");
            const xmlObj = fastXmlParser.parse(xmlData, importParseOptions);
            const importedComp = convertToXmlComponent(footerKey, xmlObj[footerKey]) as ImportedXmlComponent;

            const footer = new FooterWrapper(this.currentRelationshipId++, importedComp);
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
        relationFile: IRelationshipFileInfo,
        zipContent: JSZip,
        wrapper: HeaderWrapper | FooterWrapper,
    ): Promise<void> {
        let wrapperImagesReferences: IRelationshipFileInfo[] = [];
        let hyperLinkReferences: IRelationshipFileInfo[] = [];
        const refFile = zipContent.files[`word/_rels/${relationFile.target}.rels`];
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
        const xmlObj = fastXmlParser.parse(xmlData, importParseOptions);
        const relationXmlArray = Array.isArray(xmlObj.Relationships.Relationship)
            ? xmlObj.Relationships.Relationship
            : [xmlObj.Relationships.Relationship];
        const relations: IRelationshipFileInfo[] = relationXmlArray
            .map((item) => {
                return {
                    id: this.parseRefId(item._attr.Id),
                    type: schemeToType[item._attr.Type],
                    target: item._attr.Target,
                };
            })
            .filter((item) => item.type !== null);
        return relations;
    }

    public extractDocumentRefs(xmlData: string): IDocumentRefs {
        interface IAttributedXML {
            _attr: object;
        }
        const xmlObj = fastXmlParser.parse(xmlData, importParseOptions);
        const sectionProp = xmlObj["w:document"]["w:body"]["w:sectPr"];

        const headerProps: undefined | IAttributedXML | IAttributedXML[] = sectionProp["w:headerReference"];
        let headersXmlArray: IAttributedXML[];
        if (headerProps === undefined) {
            headersXmlArray = [];
        } else if (Array.isArray(headerProps)) {
            headersXmlArray = headerProps;
        } else {
            headersXmlArray = [headerProps];
        }
        const headers = headersXmlArray.map((item) => {
            return {
                type: item._attr["w:type"],
                id: this.parseRefId(item._attr["r:id"]),
            };
        });

        const footerProps: undefined | IAttributedXML | IAttributedXML[] = sectionProp["w:footerReference"];
        let footersXmlArray: IAttributedXML[];
        if (footerProps === undefined) {
            footersXmlArray = [];
        } else if (Array.isArray(footerProps)) {
            footersXmlArray = footerProps;
        } else {
            footersXmlArray = [footerProps];
        }

        const footers = footersXmlArray.map((item) => {
            return {
                type: item._attr["w:type"],
                id: this.parseRefId(item._attr["r:id"]),
            };
        });

        return { headers, footers };
    }

    public titlePageIsDefined(xmlData: string): boolean {
        const xmlObj = fastXmlParser.parse(xmlData, importParseOptions);
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
