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

export class Properties extends XmlComponent {

    constructor(options: PropertiesOptions) {
        super("cp:coreProperties");
        this.root.push(new DocumentAttributes({
            cp: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
            dc: "http://purl.org/dc/elements/1.1/",
            dcterms: "http://purl.org/dc/terms/",
            dcmitype: "http://purl.org/dc/dcmitype/",
            xsi: "http://www.w3.org/2001/XMLSchema-instance"
        }));
        this.root.push(new Title(options.title));
        this.root.push(new Subject(options.subject));
        this.root.push(new Creator(options.creator));
        this.root.push(new Keywords(options.keywords));
        this.root.push(new Description(options.description));
        this.root.push(new LastModifiedBy(options.lastModifiedBy));
        this.root.push(new Revision(options.revision));
        this.root.push(new Created());
        this.root.push(new Modified());
    }
}