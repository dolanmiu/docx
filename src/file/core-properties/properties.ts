import { StringContainer, XmlComponent } from "file/xml-components";
import { ICustomPropertyOptions } from "../custom-properties";
import { IDocumentBackgroundOptions } from "../document";

import { DocumentAttributes } from "../document/document-attributes";
import { ISectionOptions } from "../file";
import { INumberingOptions } from "../numbering";
import { Paragraph } from "../paragraph";
import { IStylesOptions } from "../styles";
import { dateTimeValue } from "../values";

export interface IPropertiesOptions {
    readonly sections: ISectionOptions[];
    readonly title?: string;
    readonly subject?: string;
    readonly creator?: string;
    readonly keywords?: string;
    readonly description?: string;
    readonly lastModifiedBy?: string;
    readonly revision?: number;
    readonly externalStyles?: string;
    readonly styles?: IStylesOptions;
    readonly numbering?: INumberingOptions;
    readonly footnotes?: {
        readonly [key: string]: {
            readonly children: Paragraph[];
        };
    };
    readonly background?: IDocumentBackgroundOptions;
    readonly features?: {
        readonly trackRevisions?: boolean;
        readonly updateFields?: boolean;
    };
    readonly compatabilityModeVersion?: number;
    readonly customProperties?: ICustomPropertyOptions[];
    readonly evenAndOddHeaderAndFooters?: boolean;
}

// <xs:element name="coreProperties" type="CT_CoreProperties"/>

// <xs:complexType name="CT_CoreProperties">
//   <xs:all>
//     <xs:element name="category" minOccurs="0" maxOccurs="1" type="xs:string"/>
//     <xs:element name="contentStatus" minOccurs="0" maxOccurs="1" type="xs:string"/>
//     <xs:element ref="dcterms:created" minOccurs="0" maxOccurs="1"/>
//     <xs:element ref="dc:creator" minOccurs="0" maxOccurs="1"/>
//     <xs:element ref="dc:description" minOccurs="0" maxOccurs="1"/>
//     <xs:element ref="dc:identifier" minOccurs="0" maxOccurs="1"/>
//     <xs:element name="keywords" minOccurs="0" maxOccurs="1" type="CT_Keywords"/>
//     <xs:element ref="dc:language" minOccurs="0" maxOccurs="1"/>
//     <xs:element name="lastModifiedBy" minOccurs="0" maxOccurs="1" type="xs:string"/>
//     <xs:element name="lastPrinted" minOccurs="0" maxOccurs="1" type="xs:dateTime"/>
//     <xs:element ref="dcterms:modified" minOccurs="0" maxOccurs="1"/>
//     <xs:element name="revision" minOccurs="0" maxOccurs="1" type="xs:string"/>
//     <xs:element ref="dc:subject" minOccurs="0" maxOccurs="1"/>
//     <xs:element ref="dc:title" minOccurs="0" maxOccurs="1"/>
//     <xs:element name="version" minOccurs="0" maxOccurs="1" type="xs:string"/>
//   </xs:all>
// </xs:complexType>

export class CoreProperties extends XmlComponent {
    constructor(options: Omit<IPropertiesOptions, "sections">) {
        super("cp:coreProperties");
        this.root.push(
            new DocumentAttributes({
                cp: "http://schemas.openxmlformats.org/package/2006/metadata/core-properties",
                dc: "http://purl.org/dc/elements/1.1/",
                dcterms: "http://purl.org/dc/terms/",
                dcmitype: "http://purl.org/dc/dcmitype/",
                xsi: "http://www.w3.org/2001/XMLSchema-instance",
            }),
        );
        if (options.title) {
            this.root.push(new StringContainer("dc:title", options.title));
        }
        if (options.subject) {
            this.root.push(new StringContainer("dc:subject", options.subject));
        }
        if (options.creator) {
            this.root.push(new StringContainer("dc:creator", options.creator));
        }
        if (options.keywords) {
            this.root.push(new StringContainer("cp:keywords", options.keywords));
        }
        if (options.description) {
            this.root.push(new StringContainer("dc:description", options.description));
        }
        if (options.lastModifiedBy) {
            this.root.push(new StringContainer("cp:lastModifiedBy", options.lastModifiedBy));
        }
        if (options.revision) {
            this.root.push(new StringContainer("cp:revision", String(options.revision)));
        }
        this.root.push(new TimestampElement("dcterms:created"));
        this.root.push(new TimestampElement("dcterms:modified"));
    }
}

class TimestampElement extends XmlComponent {
    constructor(name: string) {
        super(name);
        this.root.push(
            new DocumentAttributes({
                type: "dcterms:W3CDTF",
            }),
        );
        this.root.push(dateTimeValue(new Date()));
    }
}
