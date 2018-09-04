import * as JSZip from "jszip";
import * as fastXmlParser from "fast-xml-parser";
import { convertToXmlComponent, parseOptions, ImportedXmlComponent } from "file/xml-components";
import { HeaderWrapper } from 'file/header-wrapper';
import { FooterWrapper } from 'file/footer-wrapper';
import { HeaderReferenceType } from 'file/document/body/section-properties/header-reference';  
import { FooterReferenceType } from 'file/document/body/section-properties/footer-reference'; 
// import { RelationshipType } from 'file/relationships/relationship/relationship'; 

const schemeToType = {
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" : 'header',
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" : 'footer',
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" : 'image',
}

interface DocumentRefs {
    headers : {id : number, type: HeaderReferenceType}[], 
    footers : {id : number, type: FooterReferenceType}[]
}

type RelationFileInfo = {id : number, targetFile: string, type: 'header' | 'footer' | 'image'};

type DocumentHeaders = {type : HeaderReferenceType, header : HeaderWrapper}[];
type DocumentFooters = {type : FooterReferenceType, footer : FooterWrapper}[];

export interface TemplateDocument {
    currentRelationshipId : number;
    headers : DocumentHeaders,
    footers : DocumentFooters,
}

export class ImportDocx {

    private currentRelationshipId: number = 1;

    constructor() {
    }



    async extract(data : Buffer) : Promise<TemplateDocument> {
        let zipContent = await JSZip.loadAsync(data);

        let documentContent = zipContent['files']['word/document.xml'];
        const documentRefs : DocumentRefs = this.extractDocumentRefs(await documentContent.async('text'))

        let relationshipContent = zipContent['files']['word/_rels/document.xml.rels'];
        const documentRelations : RelationFileInfo[] = this.findReferenceFiles(await relationshipContent.async('text'));
        
        let headers : DocumentHeaders = [];
        for(let headerRef of documentRefs.headers) {
            const headerKey = 'w:hdr';
            const relationFileInfo = documentRelations.find(rel => rel.id === headerRef.id);
            if (relationFileInfo == null) {
                throw `can not find target file for id ${headerRef.id}`;
            }
            
            const xmlData = await zipContent['files'][`word/${relationFileInfo.targetFile}`].async('text');
            const xmlObj = fastXmlParser.parse(xmlData, parseOptions);

            let importedComp = convertToXmlComponent(headerKey, xmlObj[headerKey]) as ImportedXmlComponent;
            
            let header = new HeaderWrapper(this.currentRelationshipId++, importedComp);
            await this.addImagesToWrapper(relationFileInfo, zipContent, header);
            headers.push({type : headerRef.type, header})
        }

        let footers : DocumentFooters = [];
        for(let footerRef of documentRefs.footers) {
            const footerKey = 'w:ftr'
            const relationFileInfo = documentRelations.find(rel => rel.id === footerRef.id);
            if (relationFileInfo == null) {
                throw `can not find target file for id ${footerRef.id}`;
            }
            const xmlData = await zipContent['files'][`word/${relationFileInfo.targetFile}`].async('text');
            const xmlObj = fastXmlParser.parse(xmlData, parseOptions);
            let importedComp = convertToXmlComponent(footerKey, xmlObj[footerKey]) as ImportedXmlComponent;
            
            let footer = new FooterWrapper(this.currentRelationshipId++, importedComp);
            await this.addImagesToWrapper(relationFileInfo, zipContent, footer);
            footers.push({type : footerRef.type, footer})
        }

        let templateDocument : TemplateDocument = {headers, footers, currentRelationshipId : this.currentRelationshipId}
        return templateDocument;
    }

    async addImagesToWrapper(relationFile : RelationFileInfo, zipContent, wrapper : HeaderWrapper | FooterWrapper) {
        let wrapperImagesReferences : RelationFileInfo[] = [];
        const refFile = zipContent['files'][`word/_rels/${relationFile.targetFile}.rels`];
        if (refFile) {
            const xmlRef = await refFile.async('text');
            wrapperImagesReferences = this.findReferenceFiles(xmlRef).filter(r => r.type === 'image');
        }
        for (let r of wrapperImagesReferences) {
            const buffer = await zipContent['files'][`word/${r.targetFile}`].async('nodebuffer');
            wrapper.addImageRelation(buffer, r.id);
        }
    }


    findReferenceFiles(xmlData : string) : RelationFileInfo[] {
        const xmlObj = fastXmlParser.parse(xmlData, parseOptions);
        const relationXmlArray = Array.isArray(xmlObj['Relationships']['Relationship']) ? xmlObj['Relationships']['Relationship'] : [xmlObj['Relationships']['Relationship']];
        const relations : RelationFileInfo[] = relationXmlArray
            .map(item => {
                return {
                    id : this.parseRefId(item['_attr']['Id']), 
                    type : schemeToType[item['_attr']['Type']],
                    targetFile : item['_attr']['Target']
                }
            })
            .filter(item => item.type != null)
        return relations;
    }

    extractDocumentRefs(xmlData : string) : DocumentRefs {

        const xmlObj = fastXmlParser.parse(xmlData, parseOptions);
        const sectionProp = xmlObj['w:document']['w:body']['w:sectPr'];
        
        const headersXmlArray = Array.isArray(sectionProp['w:headerReference']) ? sectionProp['w:headerReference'] : [sectionProp['w:headerReference']];
        const headers = headersXmlArray
            .map(item => {
               return { 
                   type : item['_attr']['w:type'],
                   id :  this.parseRefId(item['_attr']['r:id'])
               } 
            });

        const footersXmlArray = Array.isArray(sectionProp['w:footerReference']) ? sectionProp['w:footerReference'] : [sectionProp['w:footerReference']];
        const footers = footersXmlArray
            .map(item => {
               return {
                   type : item['_attr']['w:type'],
                   id :  this.parseRefId(item['_attr']['r:id'])
               } 
            });
        
        return {headers, footers}
    }

    parseRefId(str : string) : number {
        let match = /^rId(\d+)$/.exec(str);
        if (match == null) {
            throw 'invalid ref id';
        }
        return parseInt(match[1]);
    } 

}

