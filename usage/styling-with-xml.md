# Styling with XML

## Setup

1.  Create a new word document in Microsoft Word
2.  Customize the styles on the Ribbon Bar.
    For example, modify the `Normal`, `Heading 1`, `Heading 2` like so:

    ![image](https://user-images.githubusercontent.com/2917613/41195113-65edebfa-6c1f-11e8-97b4-77de2d60044a.png)
    ![image](https://user-images.githubusercontent.com/2917613/41195126-ca99c36c-6c1f-11e8-9e58-19e5f69b3b87.png)

3.  You can even create a totally new `Style`:

    ![image](https://user-images.githubusercontent.com/2917613/41195135-f0f7862a-6c1f-11e8-8be4-dd6d8fe5be03.png)
    ![image](https://user-images.githubusercontent.com/2917613/41195139-0ec52130-6c20-11e8-8fae-f6b44b43fdf8.png)

4.  Save
5.  Re-name the saved `.docx` file to `.zip` and un-zip
6.  Find `styles.xml`

    ![image](https://user-images.githubusercontent.com/2917613/41195178-bb9ba9c4-6c20-11e8-850e-a7a6ada9a2f6.png)

## Usage

Read the styles using `fs`, and put it into the `Document` object in the constructor:

```ts
const styles = fs.readFileSync("./styles.xml", "utf-8");
const doc = new docx.Document({
    title: "Title",
    externalStyles: styles,
});
```

You can use paragraphs, `heading1()`, `heading2()` etc and it will be styled according to your `styles.xml` created earlier. You can even use your new style you made by calling the `style` method:

```ts
doc.createParagraph("Cool Heading Text").heading1();

const paragraph = new docx.Paragraph('This is a custom named style from the template "Cool New Style"');
paragraph.style("Cool New Style");
doc.add(paragraph);

doc.createParagraph("Some normal text");
```

Example: https://github.com/dolanmiu/docx/blob/master/demo/13-xml-styles.ts
