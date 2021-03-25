# Bullets and Numbering

`docx` is quite flexible in its bullets and numbering system, allowing
the user great freedom in how bullets and numbers are to be styled and
displayed. E.g., numbers can be shown using Arabic numerals, roman
numerals, or even ordinal words ("one", "two", "three", ...). The
format also supports re-using bullets/numbering styles throughout the
document, so that different lists using the same style need not
redefine them.

Because of this flexibility, bullets and numbering in DOCX involves a
couple of moving pieces:

1.  Document-level bullets/numbering definitions (abstract)
2.  Document-level bullets/numbering definitions (concrete)
3.  Paragraph-level bullets/numbering selection

## Document-level bullets/numbering definitions (abstract)

Every document contains a set of abstract bullets/numbering
definitions which define the formatting and layout of paragraphs using
those bullets/numbering. An abstract numbering system defines how
bullets/numbers are to be shown for lists, including any sublists that
may be used. Thus each abstract definition includes a series of
_levels_ which form a sequence starting at 0 indicating the top-level
list look and increasing from there to describe the sublists, then
sub-sublists, etc. Each level includes the following properties:

*   **level**: This is its 0-based index in the definition stack
*   **numberFormat**: This indicates how the bullet or number should be
    generated. Options include `bullet` (meaning don't count), `decimal`
    (arabic numerals), `upperRoman`, `lowerRoman`, `hex`, and many
    more.
*   **levelText**: This is a format string using the output of the
    `numberFormat` function and generating a string to insert before
    every item in the list. You may use `%1`, `%2`, ... to reference the
    numbers from each numbering level before this one. Thus a level
    text of `%d)` with a number format of `lowerLetter` would result in
    the sequence "a)", "b)", ...
*   and a few others, which you can see in the OXML spec section 17.9.6

## Document-level bullets/numbering definitions (concrete)

Concrete definitions are sort of like concrete subclasses of the
abstract definitions. They indicate their parent and are allowed to
override certain level definitions. Thus two lists that differ only in
how sub-sub-lists are to be displayed can share the same abstract
numbering definition and have slightly different concrete definitions.

## Paragraph-level bullets/numbering selection

In order to use a bullets/numbering definition (which must be
concrete), paragraphs need to select it, similar to applying a CSS
class to an element, using both the concrete numbering definition ID
and the level number that the paragraph should be at. Additionally, MS
Word and LibreOffice typically apply a "ListParagraph" style to
paragraphs that are being numbered.

## Using bullets/numbering in `docx`

`docx` includes a pre-defined bullet style which you can add to your
paragraphs using `para.bullets()`. If you require different bullet
styles or numbering of any kind, you'll have to use the
`docx.Numbering` class.

First you need to create a new numbering container class and use it to
create your abstract numbering style, define your levels, and create
your concrete numbering style:

```ts
const numbering = new docx.Numbering();

const abstractNum = numbering.createAbstractNumbering();
abstractNum.createLevel(0, "upperRoman", "%1", "start").addParagraphProperty(new Indent(720, 260));
abstractNum.createLevel(1, "decimal", "%2.", "start").addParagraphProperty(new Indent(1440, 980));
abstractNum.createLevel(2, "lowerLetter", "%3)", "start").addParagraphProperty(new Indent(2160, 1700));

const concrete = numbering.createConcreteNumbering(abstractNum);
```

You can then apply your concrete style to paragraphs using the
`setNumbering` method:

```ts
topLevelP.setNumbering(concrete, 0);
subP.setNumbering(concrete, 1);
subSubP.setNumbering(concrete, 2);
```
