// This demo shows how to create bookmarks then link to them with internal hyperlinks

import * as fs from "fs";
import { Bookmark, Document, Footer, HeadingLevel, InternalHyperlink, Packer, PageBreak, Paragraph, TextRun, PageReference } from "docx";

const LOREM_IPSUM =
    /* cspell:disable-next-line */
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam mi velit, convallis convallis scelerisque nec, faucibus nec leo. Phasellus at posuere mauris, tempus dignissim velit. Integer et tortor dolor. Duis auctor efficitur mattis. Vivamus ut metus accumsan tellus auctor sollicitudin venenatis et nibh. Cras quis massa ac metus fringilla venenatis. Proin rutrum mauris purus, ut suscipit magna consectetur id. Integer consectetur sollicitudin ante, vitae faucibus neque efficitur in. Praesent ultricies nibh lectus. Mauris pharetra id odio eget iaculis. Duis dictum, risus id pellentesque rutrum, lorem quam malesuada massa, quis ullamcorper turpis urna a diam. Cras vulputate metus vel massa porta ullamcorper. Etiam porta condimentum nulla nec tristique. Sed nulla urna, pharetra non tortor sed, sollicitudin molestie diam. Maecenas enim leo, feugiat eget vehicula id, sollicitudin vitae ante.";

const doc = new Document({
    creator: "Clippy",
    title: "Sample Document",
    description: "A brief example of using docx with bookmarks and internal hyperlinks",
    sections: [
        {
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new InternalHyperlink({
                                    children: [
                                        new TextRun({
                                            text: "Click here!",
                                            style: "Hyperlink",
                                        }),
                                    ],
                                    anchor: "myAnchorId",
                                }),
                            ],
                        }),
                    ],
                }),
            },
            children: [
                new Paragraph({
                    heading: HeadingLevel.HEADING_1,
                    children: [
                        new Bookmark({
                            id: "myAnchorId",
                            children: [new TextRun("Lorem Ipsum")],
                        }),
                    ],
                }),
                new Paragraph("\n"),
                new Paragraph(LOREM_IPSUM),
                new Paragraph({
                    children: [new PageBreak()],
                }),
                new Paragraph({
                    children: [
                        new InternalHyperlink({
                            children: [
                                new TextRun({
                                    text: "Styled",
                                    bold: true,
                                    style: "Hyperlink",
                                }),
                                new TextRun({
                                    text: " Anchor Text",
                                    style: "Hyperlink",
                                }),
                            ],
                            anchor: "myAnchorId",
                        }),
                    ],
                }),
                new Paragraph({
                    children: [new TextRun("The bookmark can be seen on page "), new PageReference("myAnchorId")],
                }),
            ],
        },
    ],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
