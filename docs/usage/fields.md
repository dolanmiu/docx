# Fields

Fields are pieces of dynamic text that you can include in your document. Often used fields are page numbers or references, but you can also include document properties like the author name or last saved date.

## Simple fields

There are very complicated fields like the table of contents, but in many cases the whole field just has the same properties (like formatting). In those cases, you can use simple fields.

Word uses field codes to identify what the result of the field should be. You can find these field codes by adding a field in a document (`Insert -> Quick Parts -> Field...`) and clicking the 'Field codes'-button. Some examples include:

| Field type  | Example         | Description                                                                             |
| ----------- | --------------- | --------------------------------------------------------------------------------------- |
| = (Formula) | `=2*21`         | Calculates the result of a formula. You can also use bookmarks as variables, see below. |
| Author      | `AUTHOR`        | Includes the author mentioned in the document properties.                               |
| CreateDate  | `CREATEDATE`    | Date the document was created.                                                          |
| Date        | `DATE`          | Today's date.                                                                           |
| FileName    | `FILENAME \p`   | The name of the document. Add `\p` for the complete path.                               |
| Info        | `INFO NumWords` | Data from the document properties, e.g. the number of words in the document.            |
| NumPages    | `NUMPAGES`      | Number of pages in the document.                                                        |
| UserName    | `USERNAME`      | Your user name from the Office personalization settings.                                |

Fields can be added as a child of a paragraph:

```ts live
import { Document, Paragraph, SimpleField, TextRun } from "docx";

const paragraph = new Paragraph({
    children: [new TextRun("This document was created by: "), new SimpleField("AUTHOR")],
});

const doc = new Document({
    sections: [
        {
            children: [paragraph],
        },
    ],
});
```

Fields can contain a cached value that gives the word processor a text to show without having to calculate all fields. The cached value can be updated by selecting the field and pressing F9. A cached value can be passed in as the second argument to the constructor.

```ts live
import { Document, Paragraph, SimpleField, TextRun } from "docx";

const paragraph = new Paragraph({
    children: [new TextRun("This document was created by: "), new SimpleField("AUTHOR", "Richard Brodie")],
});

const doc = new Document({
    sections: [
        {
            children: [paragraph],
        },
    ],
});
```

### Formulas

One type of field is the formula that can be used to do some basic calculations. This can be done with static values, e.g. `12 + 34`, but a value from a bookmark can also be used in a calculation. This can be seen in the following example:

```ts live
import { Bookmark, Document, Paragraph, SimpleField, TextRun } from "docx";

const paragraph = new Paragraph({
    children: [
        new TextRun("Value one is: "),
        new Bookmark({ id: "One", children: [new TextRun("451")] }),
        new TextRun(". The second value is: "),
        new Bookmark({ id: "Two", children: [new TextRun("886")] }),
        new TextRun(". The sum of these values is: "),
        new SimpleField("=One+Two"),
    ],
});

const doc = new Document({
    sections: [
        {
            children: [paragraph],
        },
    ],
});
```

### Index entries

An index entry (`XE`) marks a place in the document for an `INDEX` field to list, with its page number. The entry shows nothing itself. Word builds the index when its fields are updated, so give the `INDEX` field a cached value to show until then:

```ts live
import { Document, HeadingLevel, Paragraph, SimpleField, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new TextRun("Apples are red"), new SimpleField('XE "Apples"'), new TextRun(", and pears are green.")],
                }),
                new Paragraph({ children: [new TextRun("Bananas are yellow."), new SimpleField('XE "Bananas"')] }),
                new Paragraph({ text: "Index", heading: HeadingLevel.HEADING_1 }),
                new Paragraph({ children: [new SimpleField("INDEX", "Apples, 1")] }),
            ],
        },
    ],
});
```

Table of contents entries (`TC`) and table of authorities entries (`TA`) are added the same way. These fields have no result, so a cached value given to one isn't written.

### Mail merge fields

Fields are often used in a mail merge where a template document is created and data from another source (Excel or a database) is inserted in the document.

A convenience class was added to add these mail merge fields to the document easily. You can add these to a paragraph like any other field and only have to supply the name of the field in your data set:

```ts live
import { Document, Paragraph, SimpleMailMergeField, TextRun } from "docx";

const paragraph = new Paragraph({
    children: [new TextRun("Your score was "), new SimpleMailMergeField("Score"), new TextRun(" of 100 points")],
});

const doc = new Document({
    sections: [
        {
            children: [paragraph],
        },
    ],
});
```

This code is equivalent to:

```ts live
import { Document, Paragraph, SimpleField, TextRun } from "docx";

const paragraph = new Paragraph({
    children: [new TextRun("Your score was "), new SimpleField("MERGEFIELD Score", "«Score»"), new TextRun(" of 100 points")],
});

const doc = new Document({
    sections: [
        {
            children: [paragraph],
        },
    ],
});
```

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/fields/fields.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/fields/fields.ts_
