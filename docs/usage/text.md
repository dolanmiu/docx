# Text

You can add multiple `text runs` in `Paragraphs`. This is the most verbose way of writing a `Paragraph` but it is also the most flexible:

```js
import { Paragraph, Text } from "docx";

const paragraph = new Paragraph({
    children: [
        new TextRun("My awesome text here for my university dissertation"),
    ],
});
```

Text objects have methods inside which changes the way the text is displayed.

## Typographical Emphasis

More info [here](https://english.stackexchange.com/questions/97081/what-is-the-typography-term-which-refers-to-the-usage-of-bold-italics-and-unde)

### Bold

```js
text.bold();
```

### Italics

```js
text.italics();
```

### Underline

```js
text.underline();
```

### Strike through

```js
text.strike();
```

### Double strike through

```js
text.doubleStrike();
```

### Superscript

```js
text.superScript();
```

### Subscript

```js
text.subScript();
```

### All Capitals

```js
text.allCaps();
```

### Small Capitals

```js
text.smallCaps();
```

## Break

Sometimes you would want to put text underneath another line of text but inside the same paragraph.

```js
text.break();
```

## Chaining

What if you want to create a paragraph which is **_bold_** and **_italic_**?

```js
paragraph.bold().italics();
```
