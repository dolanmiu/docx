import {XmlComponent} from "../docx/xml-components";
import {DocumentAttributes} from "../docx/xml-components/document-attributes";
import {Title, Subject, Creator, Keywords, Description, LastModifiedBy, Revision, Created, Modified} from "./components";

interface PropertiesOptions {
    title?: string;
    subject?: string;
    creator?: string;
    keywords?: string;
    description?: string;
    lastModifiedBy?: string;
    revision?: string;
}

export class Properties implements XmlComponent {
    private coreProperties: Array<XmlComponent>;

    xmlKeys = {
        coreProperties: "cp:coreProperties"
    }

    constructor(options: PropertiesOptions) {
        this.coreProperties = new Array<XmlComponent>();
        this.coreProperties.push(new DocumentAttributes({
            cp: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
            dc: "http://purl.org/dc/elements/1.1/",
            dcterms: "http://purl.org/dc/terms/",
            dcmitype: "http://purl.org/dc/dcmitype/",
            xsi: "http://www.w3.org/2001/XMLSchema-instance"
        }));
        this.coreProperties.push(new Title(options.title));
        this.coreProperties.push(new Subject(options.subject));
        this.coreProperties.push(new Creator(options.creator));
        this.coreProperties.push(new Keywords(options.keywords));
        this.coreProperties.push(new Description(options.description));
        this.coreProperties.push(new LastModifiedBy(options.lastModifiedBy));
        this.coreProperties.push(new Revision(options.revision));
        this.coreProperties.push(new Created());
        this.coreProperties.push(new Modified());
    }
}