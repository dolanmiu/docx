# Document

> The `Document` object is the starting point of your `.docx` journey, this is the literal Word Document. You add all your content such as `Paragraphs` to this `Document`, and at the end export it however you like.

To create a new document, it is very easy:

```js
var doc = new docx.Document();
```

## Document properties

You can add properties to the Word document by specifying options, for example:

```js
var doc = new docx.Document({
    creator: "Dolan Miu",
    description: "My extremely interesting document",
    title: "My Document",
});
```

### Full list of options:

```
creator
description
title
subject
keywords
lastModifiedBy
revision
```

You can mix and match whatever properties you want, or provide no properties.
