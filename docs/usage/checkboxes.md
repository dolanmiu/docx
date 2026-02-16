# Checkboxes

!> Checkboxes require an understanding of [Paragraphs](usage/paragraph.md).

Checkboxes allow you to add interactive checkbox controls to your Word documents. These are commonly used in forms, checklists, and surveys.

?> These checkboxes are interactive in Word - users can click to toggle them on and off.

## Basic Checkbox

Create a simple checkbox:

```ts
import { CheckBox, Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new CheckBox(), new TextRun(" Unchecked item")],
                }),
            ],
        },
    ],
});
```

## Checked Checkbox

Create a pre-checked checkbox:

```ts
new Paragraph({
    children: [new CheckBox({ checked: true }), new TextRun(" Completed task")],
});
```

## Custom Checkbox Symbols

You can customize the symbols used for checked and unchecked states. This is useful for branding consistency, platform compatibility, or when the default symbols don't render correctly on certain systems:

```ts
new CheckBox({
    checked: true,
    checkedState: {
        value: "2611", // Unicode ballot box with check
        font: "MS Gothic",
    },
    uncheckedState: {
        value: "2610", // Unicode ballot box
        font: "MS Gothic",
    },
});
```

### Common Unicode Values

| Symbol   | Unicode | Description           |
| -------- | ------- | --------------------- |
| &#x2610; | `2610`  | Ballot Box            |
| &#x2611; | `2611`  | Ballot Box with Check |
| &#x2612; | `2612`  | Ballot Box with X     |
| &#x2713; | `2713`  | Check Mark            |
| &#x2717; | `2717`  | Ballot X              |

## Checkbox Options

| Property       | Type          | Notes    | Description                          |
| -------------- | ------------- | -------- | ------------------------------------ |
| checked        | `boolean`     | Optional | Whether the checkbox is checked      |
| checkedState   | `SymbolState` | Optional | Symbol and font for checked state    |
| uncheckedState | `SymbolState` | Optional | Symbol and font for unchecked state  |
| alias          | `string`      | Optional | Accessibility label for the checkbox |

### SymbolState Options

| Property | Type     | Notes    | Description                |
| -------- | -------- | -------- | -------------------------- |
| value    | `string` | Required | Unicode hex value          |
| font     | `string` | Optional | Font to use for the symbol |

## Accessibility

Use the `alias` property to provide an accessibility label:

```ts
new Paragraph({
    children: [
        new TextRun("Do you agree to the terms?"),
        new TextRun({ break: 1 }),
        new CheckBox({
            checked: false,
            alias: "Terms agreement checkbox",
        }),
        new TextRun(" Yes, I agree"),
    ],
});
```

## Building a Checklist

Create a complete checklist:

```ts
import { CheckBox, Document, Paragraph, TextRun } from "docx";

const tasks = [
    { text: "Review documentation", done: true },
    { text: "Write unit tests", done: true },
    { text: "Deploy to production", done: false },
    { text: "Update README", done: false },
];

const doc = new Document({
    sections: [
        {
            children: tasks.map(
                (task) =>
                    new Paragraph({
                        children: [new CheckBox({ checked: task.done }), new TextRun(` ${task.text}`)],
                    }),
            ),
        },
    ],
});
```

## Form with Multiple Checkboxes

```ts
import { CheckBox, Document, HeadingLevel, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    text: "Survey Form",
                    heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph({
                    text: "Which features do you use?",
                    heading: HeadingLevel.HEADING_2,
                }),
                new Paragraph({
                    children: [new CheckBox(), new TextRun(" Tables")],
                }),
                new Paragraph({
                    children: [new CheckBox(), new TextRun(" Images")],
                }),
                new Paragraph({
                    children: [new CheckBox(), new TextRun(" Headers/Footers")],
                }),
                new Paragraph({
                    children: [new CheckBox(), new TextRun(" Styles")],
                }),
            ],
        },
    ],
});
```

## Demo

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/90-check-boxes.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/90-check-boxes.ts_
