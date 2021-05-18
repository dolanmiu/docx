# Page Numbers

> This feature allows you to set page numbers on each page

?> **Note:** This feature only works on Headers and Footers

```ts
new Paragraph({
    children: [
        new TextRun({
            children: ["Page #: ", PageNumber.CURRENT],
        })
    ]
})
```

## Current page number

```ts
PageNumber.CURRENT
```

For example:

```ts
new Paragraph({
    children: [
        new TextRun({
            children: ["Page Number ", PageNumber.CURRENT],
        })
    ]
})
```

## Total number of pages

```ts
PageNumber.TOTAL_PAGES
```

For example:

```ts
new Paragraph({
    children: [
        new TextRun({
            children: ["Total Pages Number: ", PageNumber.TOTAL_PAGES],
        })
    ]
})
```


## Both

You can combine the two to get "Page 2 of 10" effect:

```ts
new Paragraph({
    children: [
        new TextRun("My awesome text here for my university dissertation. ")
        new TextRun({
            children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
        })
    ]
})
```

## Examples

### Simple Example

Adding page numbers to Header and Footer

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/39-page-numbers.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/39-page-numbers.ts_
