// http://officeopenxml.com/WPbookmark.php
import { XmlComponent } from "@file/xml-components";
import { uniqueNumericId } from "@util/convenience-functions";

import { ParagraphChild } from "../paragraph";
import { BookmarkEndAttributes, BookmarkStartAttributes } from "./bookmark-attributes";

export class Bookmark {
    public readonly start: BookmarkStart;
    public readonly children: readonly ParagraphChild[];
    public readonly end: BookmarkEnd;

    public constructor(options: { readonly id: string; readonly children: readonly ParagraphChild[] }) {
        const linkId = uniqueNumericId();

        this.start = new BookmarkStart(options.id, linkId);
        this.children = options.children;
        this.end = new BookmarkEnd(linkId);
    }
}

// <xsd:element name="bookmarkStart" type="CT_Bookmark"/>
// <xsd:element name="bookmarkEnd" type="CT_MarkupRange"/>

// <xsd:complexType name="CT_Bookmark">
//   <xsd:complexContent>
//     <xsd:extension base="CT_BookmarkRange">
//     <xsd:attribute name="name" type="s:ST_String" use="required"/>
//     </xsd:extension>
//   </xsd:complexContent>
// </xsd:complexType>

// <xsd:complexType name="CT_BookmarkRange">
//   <xsd:complexContent>
//     <xsd:extension base="CT_MarkupRange">
//       <xsd:attribute name="colFirst" type="ST_DecimalNumber" use="optional"/>
//       <xsd:attribute name="colLast" type="ST_DecimalNumber" use="optional"/>
//     </xsd:extension>
//   </xsd:complexContent>
// </xsd:complexType>

// <xsd:complexType name="CT_MarkupRange">
//   <xsd:complexContent>
//     <xsd:extension base="CT_Markup">
//       <xsd:attribute name="displacedByCustomXml" type="ST_DisplacedByCustomXml" use="optional"/>
//     </xsd:extension>
//   </xsd:complexContent>
// </xsd:complexType>

// <xsd:complexType name="CT_Markup">
//   <xsd:attribute name="id" type="ST_DecimalNumber" use="required"/>
// </xsd:complexType>

export class BookmarkStart extends XmlComponent {
    public constructor(id: string, linkId: number) {
        super("w:bookmarkStart");

        const attributes = new BookmarkStartAttributes({
            name: id,
            id: linkId,
        });
        this.root.push(attributes);
    }
}

export class BookmarkEnd extends XmlComponent {
    public constructor(linkId: number) {
        super("w:bookmarkEnd");

        const attributes = new BookmarkEndAttributes({
            id: linkId,
        });
        this.root.push(attributes);
    }
}
