/** This demo shows how to create bookmarks then link to them with internal hyperlinks */

const docx = require("../build");

const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam mi velit, convallis convallis scelerisque nec, faucibus nec leo. Phasellus at posuere mauris, tempus dignissim velit. Integer et tortor dolor. Duis auctor efficitur mattis. Vivamus ut metus accumsan tellus auctor sollicitudin venenatis et nibh. Cras quis massa ac metus fringilla venenatis. Proin rutrum mauris purus, ut suscipit magna consectetur id. Integer consectetur sollicitudin ante, vitae faucibus neque efficitur in. Praesent ultricies nibh lectus. Mauris pharetra id odio eget iaculis. Duis dictum, risus id pellentesque rutrum, lorem quam malesuada massa, quis ullamcorper turpis urna a diam. Cras vulputate metus vel massa porta ullamcorper. Etiam porta condimentum nulla nec tristique. Sed nulla urna, pharetra non tortor sed, sollicitudin molestie diam. Maecenas enim leo, feugiat eget vehicula id, sollicitudin vitae ante.";

const doc = new docx.Document({
    creator: 'Clippy',
    title: 'Sample Document',
    description: 'A brief example of using docx with bookmarks and internal hyperlinks',
});

const anchorId = "anchorID";

// First create the bookmark
const bookmark = doc.createBookmark(anchorId, "Lorem Ipsum");
// That has header styling
doc.createParagraph().addBookmark(bookmark).heading1();
doc.createParagraph("\n");

doc.createParagraph(loremIpsum);
doc.createParagraph().pageBreak();

// Now the link back up to the bookmark
const hyperlink = doc.createInternalHyperLink(anchorId, `Click me!`);
doc.createParagraph().addHyperLink(hyperlink);

var exporter = new docx.LocalPacker(doc);
exporter.pack("My Document");

console.log("Document created successfully at project root!");
