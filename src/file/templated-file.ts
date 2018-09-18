import { ITemplateDocument } from "../importDocx";
import { BaseFile } from "./base-file";
import { IPropertiesOptions } from "./core-properties";
import { Document, SectionPropertiesOptions } from "./document";

export class TemplatedFile extends BaseFile {
    constructor(
        templateDocument: ITemplateDocument,
        options: IPropertiesOptions = {
            creator: "Un-named",
            revision: "1",
            lastModifiedBy: "Un-named",
        },
        sectionPropertiesOptions: SectionPropertiesOptions = {},
    ) {
        super(options);

        this.currentRelationshipId = templateDocument.currentRelationshipId + 1;

        this.addDefaultRelationships();

        if (templateDocument.headers) {
            for (const templateHeader of templateDocument.headers) {
                this.addHeaderToDocument(templateHeader.header, templateHeader.type);
            }
        } else {
            this.createHeader();
        }

        if (templateDocument.footers) {
            for (const templateFooter of templateDocument.footers) {
                this.addFooterToDocument(templateFooter.footer, templateFooter.type);
            }
        } else {
            this.createFooter();
        }

        sectionPropertiesOptions = {
            ...sectionPropertiesOptions,
            headers: this.headers.map((header) => ({
                headerId: header.header.Header.ReferenceId,
                headerType: header.type,
            })),
            footers: this.footers.map((footer) => ({
                footerId: footer.footer.Footer.ReferenceId,
                footerType: footer.type,
            })),
        };

        this.document = new Document(sectionPropertiesOptions);
    }
}
