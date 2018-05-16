// This example shows 3 styles
const fs = require('fs');
const docx = require('../build');

const styles = fs.readFileSync('./demo/assets/custom-styles.xml', 'utf-8');
const doc = new docx.Document({
  title: 'Title',
  externalStyles: styles
});

doc.createParagraph('Cool Heading Text').heading1();

let paragraph = new docx.Paragraph('This is a custom named style from the template "MyFancyStyle"');
paragraph.style('MyFancyStyle');
doc.addParagraph(paragraph);

doc.createParagraph('Some normal text')

doc.createParagraph('MyFancyStyle again').style('MyFancyStyle');
paragraph.style('MyFancyStyle');
doc.addParagraph(paragraph);

var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');

console.log('Document created successfully at project root!');
