# Styling with XML

## Setup

1.  Create a new word document in Microsoft Word
2.  Customize the styles on the Ribbon Bar.
    For example, modify the `Normal`, `Heading 1`, `Heading 2` like so:

    ![image](https://user-images.githubusercontent.com/2917613/41195113-65edebfa-6c1f-11e8-97b4-77de2d60044a.png)
    ![image](https://user-images.githubusercontent.com/2917613/41195126-ca99c36c-6c1f-11e8-9e58-19e5f69b3b87.png)

    _Note_: Fonts and colors picked from the theme, such as "(Headings)" or "Accent 1", come from the theme of the document `docx` writes. See [Theme fonts and colors](#theme-fonts-and-colors).

3.  You can even create a totally new `Style`:

    ![image](https://user-images.githubusercontent.com/2917613/41195135-f0f7862a-6c1f-11e8-8be4-dd6d8fe5be03.png)
    ![image](https://user-images.githubusercontent.com/2917613/41195139-0ec52130-6c20-11e8-8fae-f6b44b43fdf8.png)

    _Note_: When selecting the style type, it is important to consider the component being used.

4.  Save
5.  Re-name the saved `.docx` file to `.zip` and un-zip
6.  Find `styles.xml`

    ![image](https://user-images.githubusercontent.com/2917613/41195178-bb9ba9c4-6c20-11e8-850e-a7a6ada9a2f6.png)

## Usage

Read the styles using `fs`, and put it into the `Document` object in the constructor:

```ts live
import { Document, Paragraph } from "docx";
import * as fs from "fs";

const styles = fs.readFileSync("./demo/assets/custom-styles.xml", "utf-8");
const doc = new Document({
    title: "Title",
    externalStyles: styles,
    sections: [
        {
            children: [new Paragraph("Some normal text, in the Normal style of styles.xml")],
        },
    ],
});
```

Your styles take the place of the library's default styles with the same ids, and your document defaults take the place of the library's. The library's default styles fill in the ones your `styles.xml` leaves out, such as `Hyperlink` or `FootnoteText`. A default style you set in `styles.default`, such as `heading1` or `document`, takes the place of yours, and so does a style in `styles.paragraphStyles` or `styles.characterStyles` with the same id. Styles with new ids are added alongside yours.

You can use paragraphs, `HeadingLevel.HEADING_1`, `HeadingLevel.HEADING_2` etc and it will be styled according to your `styles.xml` created earlier. You can even use your new style you made with the `style` option:

```ts live
import { Document, HeadingLevel, Paragraph } from "docx";
import * as fs from "fs";

const styles = fs.readFileSync("./demo/assets/custom-styles.xml", "utf-8");
const doc = new Document({
    title: "Title",
    externalStyles: styles,
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Cool Heading Text",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: 'This is a custom named style from the template "MyFancyStyle"',
                    style: "MyFancyStyle",
                }),
                new Paragraph("Some normal text"),
            ],
        },
    ],
});
```

## Theme fonts and colors

Styles made in Word often name the theme's fonts and colors rather than a font or a color: "(Headings)" is written as `w:asciiTheme="majorHAnsi"`, and "Accent 1" as `w:themeColor="accent1"`. Word looks them up in the document's theme, which is the one `docx` writes, not the theme of the document your `styles.xml` came from. It's Office's theme, with Calibri Light for headings and Calibri for body text, unless the [`theme`](usage/themes.md) option changes it.

To keep the fonts and colors of the document the styles came from, give its theme's fonts and colors in `theme`. They're in that document's `word/theme/theme1.xml`: the `typeface` of `a:latin` in `a:majorFont` is the font for headings, the one in `a:minorFont` is the font for body text, and `a:clrScheme` has the colors.

```ts live
import { Document, HeadingLevel, Paragraph } from "docx";

// Heading 1 in Word's "(Headings)" font
const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:style w:type="paragraph" w:styleId="Heading1">
        <w:name w:val="heading 1"/>
        <w:basedOn w:val="Normal"/>
        <w:next w:val="Normal"/>
        <w:qFormat/>
        <w:pPr><w:keepNext/><w:outlineLvl w:val="0"/></w:pPr>
        <w:rPr>
            <w:rFonts w:asciiTheme="majorHAnsi" w:eastAsiaTheme="majorEastAsia" w:hAnsiTheme="majorHAnsi" w:cstheme="majorBidi"/>
            <w:b/>
            <w:caps/>
            <w:sz w:val="28"/>
        </w:rPr>
    </w:style>
</w:styles>`;

const doc = new Document({
    externalStyles: styles,
    // The fonts in the theme1.xml of the document the styles came from
    theme: { fonts: { headings: "Georgia", body: "Georgia" } },
    sections: [
        {
            children: [new Paragraph({ text: "In Georgia", heading: HeadingLevel.HEADING_1 })],
        },
    ],
});
```

Page sizes and margins aren't styles, so they aren't in `styles.xml`. Give them in each section's `properties`, as [Page Layout](usage/page-layout.md#page-margins) shows.

Example: https://github.com/dolanmiu/docx/blob/master/demo/styles/xml-styles.ts
