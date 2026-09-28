# Styling with XML

## Setup

1.  Create a new word document in Microsoft Word
2.  Customize the styles on the Ribbon Bar.
    For example, modify the `Normal`, `Heading 1`, `Heading 2` like so:

    ![image](https://user-images.githubusercontent.com/2917613/41195113-65edebfa-6c1f-11e8-97b4-77de2d60044a.png)
    ![image](https://user-images.githubusercontent.com/2917613/41195126-ca99c36c-6c1f-11e8-9e58-19e5f69b3b87.png)

    _Note_: Font and color selection from the theme are currently not supported.

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

Your styles take the place of the library's default styles with the same ids, and your document defaults take the place of the library's. The library's default styles fill in the ones your `styles.xml` leaves out, such as `Hyperlink` or `FootnoteText`. A default style you set in `styles.default`, such as `heading1` or `document`, takes the place of yours.

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

Example: https://github.com/dolanmiu/docx/blob/master/demo/styles/xml-styles.ts
