# Checkboxes

!> Checkboxes require an understanding of [Paragraphs](usage/paragraph.md).

Checkboxes allow you to add interactive checkbox controls to your Word documents. These are commonly used in forms, checklists, and surveys.

?> These checkboxes are interactive in Word - users can click to toggle them on and off.

## Basic Checkbox

Create a simple checkbox:

```ts live
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

```ts live
import { CheckBox, Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [new CheckBox({ checked: true }), new TextRun(" Completed task")],
                }),
            ],
        },
    ],
});
```

## Custom Checkbox Symbols

A checked box shows ☒ (`2612`) and an unchecked one ☐ (`2610`), both in MS Gothic, as Word's own checkboxes do. `checkedState` and `uncheckedState` set another symbol for each, as its Unicode code point in hex, and the font to draw it in:

```ts live
import { CheckBox, Document, Paragraph } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
                new Paragraph({
                    children: [
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
                        }),
                    ],
                }),
            ],
        },
    ],
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

| Property       | Type                        | Notes    | Description                                                              |
| -------------- | --------------------------- | -------- | ------------------------------------------------------------------------ |
| checked        | `boolean`                   | Optional | Whether the box starts checked. Defaults to `false`                      |
| checkedState   | `ICheckboxSymbolProperties` | Optional | The symbol, and its font, when checked                                   |
| uncheckedState | `ICheckboxSymbolProperties` | Optional | The symbol, and its font, when not checked                               |
| alias          | `string`                    | Optional | The checkbox's title, which Word shows above it when the cursor is in it |

### checkedState and uncheckedState

| Property | Type     | Notes    | Description                                                                                                         |
| -------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| value    | `string` | Optional | The symbol's Unicode code point in hex, such as `2611`. Defaults to `2612` (☒) when checked and `2610` (☐) when not |
| font     | `string` | Optional | The font to draw the symbol in. Defaults to MS Gothic                                                               |

## Title

`alias` gives the checkbox a title. Word shows it on a tab above the checkbox when the cursor is in it:

```ts live
import { CheckBox, Document, Paragraph, TextRun } from "docx";

const doc = new Document({
    sections: [
        {
            children: [
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
                }),
            ],
        },
    ],
});
```

## Building a Checklist

Create a complete checklist:

```ts live
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

```ts live
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

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/text/check-boxes.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/text/check-boxes.ts_
