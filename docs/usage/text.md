# Text

Paragraphs need `text run` objects. To create text:

```js
var text = new docx.TextRun("My awesome text here for my university dissertation");
paragraph.addRun(text);
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
