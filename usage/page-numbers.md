# Page Numbers

> This feature allows you to set page numbers on each page

?> **Note:** This feature only works on Headers and Footers

```ts
doc.Header.createParagraph().addRun(new TextRun("Page Number: ").pageNumber()).addRun(new TextRun("to ").numberOfTotalPages());
```

## Current page number

To get the current page number, call the `.pageNumber()` method on a `TextRun`. Then add the newly created `TextRun` into a paragraph

```ts
pageNumber();
```

For example:

```ts
const currentPageRun = new TextRun("Current Page Number: ").pageNumber();
paragraph.addRun(currentPageRun);
```

## Total number of pages

```ts
numberOfTotalPages();
```

For example:

```ts
const lastPage = new TextRun("Total Page Number: ").numberOfTotalPages();
paragraph.addRun(lastPage);
```


## Both

You can combine the two to get "Page 2 of 10" effect:

```ts
const currentPageRun = new TextRun("Page ").pageNumber();
const lastPage = new TextRun("of ").numberOfTotalPages();

paragraph.addRun(currentPageRun);
paragraph.addRun(lastPage);
```

Or:

```ts
doc.Header.createParagraph().addRun(new TextRun("Page ").pageNumber()).addRun(new TextRun("of ").numberOfTotalPages());
```

## Examples

### Simple Example

Adding page numbers to Header and Footer

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/39-page-numbers.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/39-page-numbers.ts_
