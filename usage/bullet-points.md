# Bullet Points

## Example

To make a bullet point, simply make a paragraph into a bullet point:

```js
var text = new docx.TextRun("Bullet points");
var paragraph = new docx.Paragraph(text).bullet();

var text2 = new docx.TextRun("Are awesome");
var paragraph2 = new docx.Paragraph(text2).bullet();

doc.addParagraph(paragraph);
doc.addParagraph(paragraph2);
```

### This will produce:

*   Bullet points
*   Are awesome
