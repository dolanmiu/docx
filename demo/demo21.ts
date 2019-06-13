// This demo shows how to create bookmarks then link to them with internal hyperlinks
// Import from 'docx' rather than '../build' if you install from npm
import * as fs from "fs";
import { Document, HeadingLevel, Packer, Paragraph } from "../build";

const loremIpsum =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam mi velit, convallis convallis scelerisque nec, faucibus nec leo. Phasellus at posuere mauris, tempus dignissim velit. Integer et tortor dolor. Duis auctor efficitur mattis. Vivamus ut metus accumsan tellus auctor sollicitudin venenatis et nibh. Cras quis massa ac metus fringilla venenatis. Proin rutrum mauris purus, ut suscipit magna consectetur id. Integer consectetur sollicitudin ante, vitae faucibus neque efficitur in. Praesent ultricies nibh lectus. Mauris pharetra id odio eget iaculis. Duis dictum, risus id pellentesque rutrum, lorem quam malesuada massa, quis ullamcorper turpis urna a diam. Cras vulputate metus vel massa porta ullamcorper. Etiam porta condimentum nulla nec tristique. Sed nulla urna, pharetra non tortor sed, sollicitudin molestie diam. Maecenas enim leo, feugiat eget vehicula id, sollicitudin vitae ante.";

const doc = new Document({
    creator: "Clippy",
    title: "Sample Document",
    description: "A brief example of using docx with bookmarks and internal hyperlinks",
});

const anchorId = "anchorID";

// First create the bookmark
const bookmark = doc.createBookmark(anchorId, "Lorem Ipsum");
// That has header styling
doc.addParagraph(
    new Paragraph({
        heading: HeadingLevel.HEADING_1,
    }).addBookmark(bookmark),
);

doc.addParagraph(new Paragraph("\n"));

doc.addParagraph(new Paragraph(loremIpsum));
doc.addParagraph(new Paragraph({}).pageBreak());

// Now the link back up to the bookmark
const hyperlink = doc.createInternalHyperLink(anchorId, `Click me!`);
doc.addParagraph(new Paragraph({}).addHyperLink(hyperlink));

const packer = new Packer();

packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("My Document.docx", buffer);
});
