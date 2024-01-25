# Bullets and Numbering

!> Bullets and Numbering requires an understanding of [Sections](usage/sections.md) and [Paragraphs](usage/paragraph.md).

`docx` is quite flexible in its bullets and numbering system, allowing
the user great freedom in how bullets and numbers are to be styled and
displayed. E.g., numbers can be shown using Arabic numerals, roman
numerals, or even ordinal words ("one", "two", "three", ...). The
format also supports re-using bullets/numbering styles throughout the
document, so that different lists using the same style need not
redefine them.

## Configuration

Numbering is configured by adding config into `Document`:

```ts
new Document({
    numbering: {
        config: [...]
    }
})
```

Each `config` entry includes the following properties:

. Each level includes the following properties:

| Property  | Type              | Notes    | Possible Values                                                                                                                                                        |
| --------- | ----------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| reference | `string`          | Required | A unique `string`                                                                                                                                                      |
| levels    | `ILevelOptions[]` | Required | a series of _levels_ which form a sequence starting at 0 indicating the top-level list look and increasing from there to describe the sublists, then sub-sublists, etc |

### Level Options

Levels define the numbering definition itself, what it looks like, the indention, the alignment and the style. The reason why it is an array is because it allows the ability to create sub-lists. A sub list will have a different configuration because you may want the sub-list to have a different indentation or different bullet.

| Property  | Type          | Notes    | Possible Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| level     | `number`      | Required | The list level this definition is for. `0` is for the root level, `1` is for a sub list, `2` is for a sub-sub-list etc.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| format    | `LevelFormat` | Optional | `DECIMAL`, `UPPER_ROMAN`, `LOWER_ROMAN`, `UPPER_LETTER`, `LOWER_LETTER`, `ORDINAL`, `CARDINAL_TEXT`, `ORDINAL_TEXT`, `HEX`, `CHICAGO`, `IDEOGRAPH__DIGITAL`, `JAPANESE_COUNTING`, `AIUEO`, `IROHA`, `DECIMAL_FULL_WIDTH`, `DECIMAL_HALF_WIDTH`, `JAPANESE_LEGAL`, `JAPANESE_DIGITAL_TEN_THOUSAND`, `DECIMAL_ENCLOSED_CIRCLE`, `DECIMAL_FULL_WIDTH2`, `AIUEO_FULL_WIDTH`, `IROHA_FULL_WIDTH`, `DECIMAL_ZERO`, `BULLET`, `GANADA`, `CHOSUNG`, `DECIMAL_ENCLOSED_FULLSTOP`, `DECIMAL_ENCLOSED_PARENTHESES`, `DECIMAL_ENCLOSED_CIRCLE_CHINESE`, `IDEOGRAPH_ENCLOSED_CIRCLE`, `IDEOGRAPH_TRADITIONAL`, `IDEOGRAPH_ZODIAC`, `IDEOGRAPH_ZODIAC_TRADITIONAL`, `TAIWANESE_COUNTING`, `IDEOGRAPH_LEGAL_TRADITIONAL`, `TAIWANESE_COUNTING_THOUSAND`, `TAIWANESE_DIGITAL`, `CHINESE_COUNTING`, `CHINESE_LEGAL_SIMPLIFIED`, `CHINESE_COUNTING_THOUSAND`, `KOREAN_DIGITAL`, `KOREAN_COUNTING`, `KOREAN_LEGAL`, `KOREAN_DIGITAL2`, `VIETNAMESE_COUNTING`, `RUSSIAN_LOWER`, `RUSSIAN_UPPER`, `NONE`, `NUMBER_IN_DASH`, `HEBREW1`, `HEBREW2`, `ARABIC_ALPHA`, `ARABIC_ABJAD`, `HINDI_VOWELS`, `HINDI_CONSONANTS`, `HINDI_NUMBERS`, `HINDI_COUNTING`, `THAI_LETTERS`, `THAI_NUMBERS`, `THAI_COUNTING`, `BAHT_TEXT`, `DOLLAR_TEXT`, `CUSTOM` |
| text      | `string`      | Optional | A unique `string` to describe the shape of the bullet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| alignment | `string`      | Required | `START`, `CENTER`, `END`, `BOTH`, `MEDIUM_KASHIDA`, `DISTRIBUTE`, `NUM_TAB`, `HIGH_KASHIDA`, `LOW_KASHIDA`, `THAI_DISTRIBUTE`, `LEFT`, `RIGHT`, `JUSTIFIED`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| style     | `string`      | Optional | [Sections](usage/styling-with-js.md)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Using ordered lists in `docx`

Add a `numbering` section to the `Document` to numbering style, define your levels. Use `LevelFormat.UPPER_ROMAN` for the `format` in `levels`:

```ts
const doc = new Document({
    ...
    numbering: {
        config: [
            {
                reference: "my-numbering",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.UPPER_ROMAN,
                        text: "%1",
                        alignment: AlignmentType.START,
                        style: {
                            paragraph: {
                                indent: { left: 2880, hanging: 2420 },
                            },
                        },
                    },
                    ...
                ],
            },
        ],
    },
    ...
});
```

And then on a `Paragraph`, we can add use the numbering created:

```ts
new Paragraph({
    text: "Hey you!",
    numbering: {
        reference: "my-numbering",
        level: 0,
    },
}),
```

## Un-ordered lists / Bullet points

Add a `numbering` section to the `Document` to numbering style, define your levels. Use `LevelFormat.BULLET` for the `format` in `levels`:

```ts
const doc = new Document({
    ...
    numbering: {
        config: [
            {
                reference: "my-bullet-points",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.BULLET,
                        text: "\u1F60",
                        alignment: AlignmentType.LEFT,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                            },
                        },
                    },
                ],
            },
        ],
    },
    ...
});
```

And then on a `Paragraph`, we can add use the numbering created:

```ts
new Paragraph({
    text: "Hey you!",
    numbering: {
        reference: "my-bullet-points",
        level: 0,
    },
}),
```

## Disabling numbering inherited from paragraph style

If the numbering is set on a paragraph style, you may wish to disable it for a specific paragraph:

```ts
const doc = new Document({
    ...
    numbering: {
        config: [
            {
                reference: "my-bullet-points",
                levels: [
                    {
                        level: 0,
                        format: LevelFormat.BULLET,
                        text: "\u1F60",
                        alignment: AlignmentType.LEFT,
                        style: {
                            paragraph: {
                                indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                            },
                        },
                    },
                ],
            },
        ],
    },
    styles: {
        paragraphStyles: [
            {
                id: 'bullet',
                name: 'Bullet',
                basedOn: 'Normal',
                next: 'Normal',
                run: {},
                paragraph: {
                    numbering: {
                        reference: 'my-bullet-points',
                        level: 0,
                    },
                },
            },
        ],
    },
    ...
});
```

```ts
new Paragraph({
    text: "No bullet points!",
    style: "Bullet",
    numbering: false,
}),
```

## Full Example

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/3-numbering-and-bullet-points.ts ":include")

_Source: https://github.com/dolanmiu/docx/blob/master/demo/3-numbering-and-bullet-points.ts_
