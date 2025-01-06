import { FontOptions } from "@file/fonts/font-table";
import { ICommentsOptions } from "@file/paragraph/run/comment-run";
import { IHyphenationOptions } from "@file/settings";
import { ICompatibilityOptions } from "@file/settings/compatibility";
import { StringContainer, XmlAttributeComponent, XmlComponent } from "@file/xml-components";
import { dateTimeValue } from "@util/values";

import { ICustomPropertyOptions } from "../custom-properties";
import { IDocumentBackgroundOptions } from "../document";
import { DocumentAttributes } from "../document/document-attributes";
import { ISectionOptions } from "../file";
import { INumberingOptions } from "../numbering";
import { Paragraph } from "../paragraph";
import { IStylesOptions } from "../styles";

export type IPropertiesOptions = {
    readonly sections: readonly ISectionOptions[];
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
    readonly comments?: ICommentsOptions;
    readonly footnotes?: Readonly<
        Record<
            string,
            {
                readonly children: readonly Paragraph[];
            }
        >
    >;
    readonly background?: IDocumentBackgroundOptions;
    readonly features?: {
        readonly trackRevisions?: boolean;
        readonly updateFields?: boolean;
    };
    readonly compatabilityModeVersion?: number;
    readonly compatibility?: ICompatibilityOptions;
    readonly customProperties?: readonly ICustomPropertyOptions[];
    readonly evenAndOddHeaderAndFooters?: boolean;
    readonly defaultTabStop?: number;
    readonly fonts?: readonly FontOptions[];
    readonly hyphenation?: IHyphenationOptions;
};

// <xs:element name="coreProperties" type="CT_CoreProperties"/>

/* cSpell:disable */
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
/* cSpell:enable */

export class CoreProperties extends XmlComponent {
    public constructor(options: Omit<IPropertiesOptions, "sections">) {
        super("cp:coreProperties");
        this.root.push(new DocumentAttributes(["cp", "dc", "dcterms", "dcmitype", "xsi"]));
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

class TimestampElementProperties extends XmlAttributeComponent<{ readonly type: string }> {
    protected readonly xmlKeys = { type: "xsi:type" };
}

class TimestampElement extends XmlComponent {
    public constructor(name: string) {
        super(name);
        this.root.push(
            new TimestampElementProperties({
                type: "dcterms:W3CDTF",
            }),
        );
        this.root.push(dateTimeValue(new Date()));
    }
}
