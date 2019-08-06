# Bullet Points

## Example

To make a bullet point, simply make a paragraph into a bullet point:

```ts
const text = new docx.TextRun("Bullet points");
const paragraph = new docx.Paragraph(text).bullet();

const text2 = new docx.TextRun("Are awesome");
const paragraph2 = new docx.Paragraph(text2).bullet();

doc.add(paragraph);
doc.add(paragraph2);
```

### This will produce:

*   Bullet points
*   Are awesome
