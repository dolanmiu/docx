/**
 * Document module for WordprocessingML documents.
 *
 * Reference: http://officeopenxml.com/WPdocument.php
 *
 * @module
 */
import { XmlComponent } from "@file/xml-components";

import { ConcreteHyperlink, Paragraph } from "../paragraph";
import { Table } from "../table";
import { TableOfContents } from "../table-of-contents";
import { Body } from "./body";
import { DocumentAttributes } from "./document-attributes";
import { DocumentBackground, IDocumentBackgroundOptions } from "./document-background";

/**
 * Options for creating a Document element.
 *
 * @see {@link Document}
 */
export type IDocumentOptions = {
    /** Optional background settings for the document */
    readonly background?: IDocumentBackgroundOptions;
};

/**
 * Represents the main document element in a WordprocessingML document.
 *
 * The document element is the root element of the main document part. It contains
 * the body element which holds all the content of the document.
 *
 * Reference: http://officeopenxml.com/WPdocument.php
 *
 * ## XSD Schema
 * ```xml
 * <xsd:element name="document" type="CT_Document"/>
 *
 * <xsd:complexType name="CT_Document">
 *   <xsd:complexContent>
 *     <xsd:extension base="CT_DocumentBase">
 *       <xsd:sequence>
 *         <xsd:element name="body" type="CT_Body" minOccurs="0" maxOccurs="1"/>
 *       </xsd:sequence>
 *       <xsd:attribute name="conformance" type="s:ST_ConformanceClass"/>
 *       <xsd:attribute ref="mc:Ignorable" use="optional" />
 *     </xsd:extension>
 *   </xsd:complexContent>
 * </xsd:complexType>
 *
 * <xsd:complexType name="CT_DocumentBase">
 *   <xsd:sequence>
 *     <xsd:element name="background" type="CT_Background" minOccurs="0"/>
 *   </xsd:sequence>
 * </xsd:complexType>
 * ```
 */
export class Document extends XmlComponent {
    private readonly body: Body;

    public constructor(options: IDocumentOptions) {
        super("w:document");
        this.root.push(
            new DocumentAttributes(
                [
                    "wpc",
                    "mc",
                    "o",
                    "r",
                    "m",
                    "v",
                    "wp14",
                    "wp",
                    "w10",
                    "w",
                    "w14",
                    "w15",
                    "wpg",
                    "wpi",
                    "wne",
                    "wps",
                    "cx",
                    "cx1",
                    "cx2",
                    "cx3",
                    "cx4",
                    "cx5",
                    "cx6",
                    "cx7",
                    "cx8",
                    "aink",
                    "am3d",
                    "w16cex",
                    "w16cid",
                    "w16",
                    "w16sdtdh",
                    "w16se",
                ],
                "w14 w15 wp14",
            ),
        );
        this.body = new Body();
        if (options.background) {
            this.root.push(new DocumentBackground(options.background));
        }
        this.root.push(this.body);
    }

    public add(item: Paragraph | Table | TableOfContents | ConcreteHyperlink): Document {
        this.body.push(item);
        return this;
    }

    public get Body(): Body {
        return this.body;
    }
}
