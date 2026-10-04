// Table of contents

import * as fs from "fs";
import { File, HeadingLevel, Packer, Paragraph, StyleLevel, TableOfContents } from "docx";

// WordprocessingML docs for TableOfContents can be found here:
// http://officeopenxml.com/WPtableOfContents.php

// Let's define the properties for generate a TOC for heading 1-5 and MySpectacularStyle,
// making the entries be hyperlinks for the paragraph. With updateFields off, Word doesn't update all
// of the document's fields when it opens it, so the table of contents stays empty until the reader
// updates it in Word. Without pageNumbers, the table is written dirty, so Word still asks to update it
const doc = new File({
    features: {
        updateFields: false,
    },
    styles: {
        paragraphStyles: [
            {
                id: "MySpectacularStyle",
                name: "My Spectacular Style",
                basedOn: "Heading1",
                next: "Heading1",
                quickFormat: true,
                run: {
                    italics: true,
                    color: "990000",
                },
            },
            {
                id: "TOC2",
                name: "TOC 2",
                basedOn: "Heading2",
                quickFormat: true,
                paragraph: {
                    indent: {
                        left: 240,
                    },
                },
            },
        ],
    },
    sections: [
        {
            children: [
                new TableOfContents("Summary", {
                    hyperlink: true,
                    headingStyleRange: "1-5",
                    stylesWithLevels: [new StyleLevel("MySpectacularStyle", 1)],
                }),
                new Paragraph({
                    text: "Header #1",
                    heading: HeadingLevel.HEADING_1,
                    pageBreakBefore: true,
                }),
                new Paragraph("I'm a little text very nicely written.'"),
                new Paragraph({
                    text: "Header #2",
                    heading: HeadingLevel.HEADING_1,
                    pageBreakBefore: true,
                }),
                new Paragraph("I'm a other text very nicely written.'"),
                new Paragraph({
                    text: "Header #2.1",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph("I'm a another text very nicely written.'"),
                new Paragraph({
                    text: "My Spectacular Style #1",
                    style: "MySpectacularStyle",
                    pageBreakBefore: true,
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
