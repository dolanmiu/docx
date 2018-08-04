# Headers and Footers

## Example

Creating Headers and footers is simple. Access the `Header` and `Footer` by doing so like this:

```ts
doc.Header;
doc.Footer;
```

You can call the same methods as you would with a `File`:

```ts
doc.Header.createParagraph("Header text");
doc.Footer.createParagraph("Footer text");
```

Even add images:

```ts
doc.Header.createImage([PATH_TO_YOUR_IMAGE]);
doc.Footer.createImage([PATH_TO_YOUR_IMAGE]);
```

Refer to `demo8.js` for more information

## Multiple Headers and Footers

Also all the supported section properties are implemented according to: http://officeopenxml.com/WPsection.php

### Example

```ts
    const header = this.document.createHeader();
    const footer = this.document.createFooter();

    // Add new section with another header and footer
    doc.addSection({
      headerId: header.Header.referenceId,
      footerId: footer.Footer.referenceId,
      pageNumberStart: 1,
      pageNumberFormatType: docx.PageNumberFormat.DECIMAL,
    });
```


