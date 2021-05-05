# Fields

Fields are pieces of dynamic text that you can include in your document. Often used fields are page numbers or references, but you can also include document properties like the author name or last saved date.

## Simple fields

There are very complicated fields like the table of contents, but in many cases the whole field just has the same properties (like formatting). In those cases, you can use simple fields.

Word uses field codes to identify what the result of the field should be. You can find these field codes by adding a field in a document (`Insert -> Quick Parts -> Field...`) and clicking the 'Field codes'-button. Some examples include:

Field type  | Example         | Description
----------- | --------------- | ---------------------------------------------------------
= (Formula) | `=2*21`         | Calculates the result of a formula. You can also use bookmarks as variables, see below.
Author      | `AUTHOR`        | Includes the author mentioned in the document properties.
CreateDate  | `CREATEDATE`    | Date the document was created.
Date        | `DATE`          | Today's date.
FileName    | `FILENAME \p`   | The name of the document. Add `\p` for the complete path.
Info        | `INFO NumWords` | Data from the document properties, e.g. the number of words in the document.
NumPages    | `NUMPAGES`      | Number of pages in the document.
UserName    | `USERNAME`      | Your user name from the Office personalization settings.

Fields can be added as a child of a paragraph:

```ts
const paragraph = new Paragraph({
    children: [new TextRun("This document was created by: "), new SimpleField("AUTHOR")],
});
```

Fields can contain a cached value that gives the word processor a text to show without having to calculate all fields. The cached value can be updated by selecting the field and pressing F9. A cached value can be passed in as the second argument to the constructor.

```ts
const paragraph = new Paragraph({
    children: [new TextRun("This document was created by: "), new SimpleField("AUTHOR", "Richard Brodie")],
});
```

### Formulas

One type of field is the formula that can be used to do some basic calculations. This can be done with static values, e.g. `12 + 34`, but a value from a bookmark can also be used in a calculation. This can be seen in the following example:

```ts
const paragraph = new Paragraph({
    children: [
        new TextRun("Value one is: "),
        new Bookmark({ id: "One", children: [new TextRun("451")]}),
        new TextRun(". The second value is: "),
        new Bookmark({ id: "Two", children: [new TextRun("886")]}),
        new TextRun(". The sum of these values is: "),
        new SimpleField("=One+Two"),
    ],
});
```

### Mail merge fields

Fields are often used in a mail merge where a template document is created and data from another source (Excel or a database) is inserted in the document.

A convenience class was added to add these mail merge fields to the document easily. You can add these to a paragraph like any other field and only have to supply the name of the field in your data set:

```ts
const paragraph = new Paragraph({
    children: [new TextRun("Your score was "), new SimpleMailMergeField("Score"), new TextRun(" of 100 points")],
});
```

This code is equivalent to:

```ts
const paragraph = new Paragraph({
    children: [new TextRun("Your score was "), new SimpleField("MERGEFIELD Score", "«Score»"), new TextRun(" of 100 points")],
});
```
