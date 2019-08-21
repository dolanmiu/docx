# Bullet Points

## Example

To make a bullet point, simply make a paragraph into a bullet point:

```ts
const text = new TextRun("Bullet points");
const paragraph = new Paragraph({
    text: "Bullet points",
    bullet: {
        level: 0, // How deep you want the bullet to me
    },
});
```

### This will produce:

-   Bullet points
-   Are awesome
