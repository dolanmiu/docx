// Track Revisions aka. "Track Changes"
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import {
    AlignmentType,
    DeletedTextRun,
    Document,
    Footer,
    FootnoteReferenceRun,
    InsertedTextRun,
    Packer,
    PageNumber,
    Paragraph,
    ShadingType,
    TextRun,
} from "../build";

/*
    For reference, see
    - https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.insertedrun
    - https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.deletedrun

    The setting `features: { trackRevisions: true }` adds an element `<w:trackRevisions />` to the `settings.xml` file.
    This specifies that the application shall track *new* revisions made to the existing document.
    See also https://docs.microsoft.com/en-us/dotnet/api/documentformat.openxml.wordprocessing.trackrevisions

    Note that this setting enables to track *new changes* after teh file is generated, so this example will still
    show inserted and deleted text runs when you remove it.
*/

const paragraph = new Paragraph({
    children: [
        new TextRun("This is a simple demo "),
        new TextRun({
            text: "on how to ",
        }),
        new InsertedTextRun({
            text: "mark a text as an insertion ",
            id: 0,
            author: "Firstname Lastname",
            date: "2020-10-06T09:00:00Z",
        }),
        new DeletedTextRun({
            text: "or a deletion.",
            id: 1,
            author: "Firstname Lastname",
            date: "2020-10-06T09:00:00Z",
        }),
    ],
});

const doc = new Document({
    footnotes: {
        1: {
            children: [
                new Paragraph({
                    children: [
                        new TextRun("This is a footnote"),
                        new DeletedTextRun({
                            text: " with some extra text which was deleted",
                            id: 0,
                            author: "Firstname Lastname",
                            date: "2020-10-06T09:05:00Z",
                        }),
                        new InsertedTextRun({
                            text: " and new content",
                            id: 1,
                            author: "Firstname Lastname",
                            date: "2020-10-06T09:05:00Z",
                        }),
                    ],
                }),
            ],
        },
    },
    features: {
        trackRevisions: true,
    },
    sections: [
        {
            properties: {},
            children: [
                paragraph,
                new Paragraph({
                    children: [
                        new TextRun("This is a demo "),
                        new DeletedTextRun({
                            break: 1,
                            text: "in order",
                            color: "ff0000",
                            bold: true,
                            size: 24,
                            font: {
                                name: "Garamond",
                            },
                            shading: {
                                type: ShadingType.REVERSE_DIAGONAL_STRIPE,
                                color: "00FFFF",
                                fill: "FF0000",
                            },
                            id: 2,
                            author: "Firstname Lastname",
                            date: "2020-10-06T09:00:00Z",
                        }),
                        new InsertedTextRun({
                            text: "to show how to ",
                            bold: false,
                            id: 3,
                            author: "Firstname Lastname",
                            date: "2020-10-06T09:05:00Z",
                        }),
                        new TextRun({
                            bold: true,
                            children: ["\tuse Inserted and Deleted TextRuns.", new FootnoteReferenceRun(1)],
                        }),
                        new TextRun({
                            bold: true,
                            text: "And some style changes",
                            revision: {
                                id: 4,
                                author: "Firstname Lastname",
                                date: "2020-10-06T09:05:00Z",
                                bold: false,
                            }
                        }),
                    ],
                }),
            ],
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                                new TextRun("Awesome LLC"),
                                new TextRun({
                                    children: ["Page Number: ", PageNumber.CURRENT],
                                }),
                                new DeletedTextRun({
                                    children: [" to ", PageNumber.TOTAL_PAGES],
                                    id: 4,
                                    author: "Firstname Lastname",
                                    date: "2020-10-06T09:05:00Z",
                                }),
                                new InsertedTextRun({
                                    children: [" from ", PageNumber.TOTAL_PAGES],
                                    bold: true,
                                    id: 5,
                                    author: "Firstname Lastname",
                                    date: "2020-10-06T09:05:00Z",
                                }),
                            ],
                        }),
                    ],
                }),
            },
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
