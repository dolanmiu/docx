# Bullet Points

!> Bullet Points requires an understanding of [Paragraphs](usage/paragraph.md).
## Example

To make a bullet point, simply make a paragraph into a bullet point:

```ts
const doc = new Document({
    sections: [{
        children: [
            new Paragraph({
                text: "Bullet points",
                bullet: {
                    level: 0 //How deep you want the bullet to be
                }
            }),
            new Paragraph({
                text: "Are awesome",
                bullet: {
                    level: 0
                }
            })
        ],
    }];
});
```

### This will produce:

-   Bullet points
-   Are awesome
