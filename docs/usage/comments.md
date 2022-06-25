# Comments

!> Comments requires an understanding of [Sections](usage/sections.md) and [Paragraphs](usage/paragraph.md).

## Intro

To add comments in `docx`, a `comments` block is specified in the `Document`. This block defines all the comments in your document. Each comment has an `id`, which you then reference later.

In the spot you want to add a comment, you simply add a `CommentRangeStart` and a `CommentRangeEnd` to specify where the comment starts and ends.

Alternatively, you can use `CommentReference` to specify a comment at a specific singular point.

### Example

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/73-comments.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/73-comments.ts_
