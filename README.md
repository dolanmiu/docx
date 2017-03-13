<p align="center">
    <img alt="clippy the assistant" src="http://i60.tinypic.com/339pvtt.png">
</p>

<p align="center">
    Generate .docx files with JS/TS very easily
</p>

=====

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Known Vulnerabilities][snky-image]][snky-url]

# docx
> A tool to create Word Documents (.docx) with JS or TS, written in TS.

[![NPM](https://nodei.co/npm/docx.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/docx/)

# Table of Contents
- [Install](#)
- [Usage](#)
	- [Create simple Word Document](#)
	- [Create Paragraph](#)
		- [Styles](#)
			- [Heading1 - Heading5](#)
			- [Title](#)
		- [Text Alignment](#)
			- [Example](#)
		- [Thematic Break (Page Break)](#)
	- [Text](#)
		- [Typographical Emphasis](#)
			- [Bold](#)
			- [Italics](#)
			- [Underline](#)
		- [Break](#)
		- [Chaining](#)
	- [Bullet Points](#)
- [Exporting](#)
	- [Express](#)
	- [Standalone .docx file](#)
- [Examples](#)

# Install

```sh
$ npm install --save docx
```

# Demo

```sh
$ npm run demo
```

will run the demo app in the `demo` folder, which creates a file called "My Document.docx" in the root of the project


# Usage

```js
// Used to create docx files
var docx = require('docx');

// Create document
var doc = new docx.Document();

// Used to export the file into a .docx file
// res is express' Response object
var exporter = new docx.ExpressPacker(doc, res);
var exporter = new docx.LocalPacker(doc);
```
## Create simple Word Document
```js
var doc = new docx.Document();
        
var paragraph = new docx.Paragraph();
var text = new docx.TextRun('Hello World');
paragraph.addText(text);
doc.addParagraph(paragraph);
```

### Document properties
You can add properties to the Word document by specifying options, for example:
```js
var doc = new docx.Document({
    creator: 'Dolan Miu',
    description: 'My extremely interesting document',
    title: 'My Document'
});
```

#### Full list of options:
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

## Create Paragraph
Every text block in OpenXML is organised in paragraphs. You can add more text to the paragraph by doing this:
```js
var paragraph = new docx.Paragraph(),
```
```js
var text = new docx.TextRun('Lorem Ipsum Foo Bar');
var paragraph = new docx.Paragraph();
paragraph.addText(text);
```
```js
var paragraph = new docx.Paragraph("Short hand notation for adding text.");
```

After you create the paragraph, you must add the paragraph into the `document`:
```js
doc.addParagraph(paragraph);
```

### Styles
Styles is a very important part of the look of a word document. At the moment, only headings and title is supported, but son the rest will be supported along with custom styles!

![Word 2013 Styles menu](http://content.gcflearnfree.org/topics/233/style_apply_choose.png "Word 2013 Styles menu")

#### Heading1 - Heading5
```js
paragraph.heading1();
paragraph.heading2();
paragraph.heading3();
paragraph.heading4();
paragraph.heading5();
```

#### Title
```js
paragraph.title();
```

### Text Alignment
To change the text alignment of a paragraph, for center, left, right or justified:
```js
paragraph.center();
```
```js
paragraph.left();
```
```js
paragraph.right();
```
```js
paragraph.justified();
```

#### Example
```js
paragraph.heading1().center();
```
The above will create a `heading 1` which is `centered`.

### Thematic Break
To add a break in the page, simply add `.thematicBreak()` on a paragraph:

```js
var paragraph = new docx.Paragraph("Amazing Heading").heading1().thematicBreak();
```
The above example will create a heading with a page break directly under it.

### Page Break
To move to a new page (insert a page break), simply add `.pageBreak()` on a paragraph:

```js
var paragraph = new docx.Paragraph("Amazing Heading").heading1().pageBreak();
```
The above example will create a heading and start a new page immediately afterwards.

## Text
Paragraphs need `text run` objects. To create text:
```js
var text = new docx.TextRun("My awesome text here for my university dissertation");
paragraph.addText(text);
```
Text objects have methods inside which changes the way the text is displayed.

### Typographical Emphasis
More info [here](https://english.stackexchange.com/questions/97081/what-is-the-typography-term-which-refers-to-the-usage-of-bold-italics-and-unde)
#### Bold
```js
text.bold();
```

#### Italics
```js
text.italic();
```

#### Underline
```js
text.underline();
```

#### Strike through
```js
text.strike();
```

#### Double strike through
```js
text.doubleStrike();
```

#### Superscript
```js
text.superScript();
```

#### Subscript
```js
text.subScript();
```

#### All Capitals
```js
text.allCaps();
```

#### Small Capitals
```js
text.smallCaps();
```

### Break
Sometimes you would want to put text underneath another line of text but inside the same paragraph.
```js
text.break();
```

### Chaining
What if you want to create a paragraph which is ***bold*** and ***italic***?
```js
paragraph.bold().italic();
```

## Bullet Points
To make a bullet point, simply make a paragraph into a bullet point:
```js
var text = new docx.TextRun("Bullet points");
var paragraph = new docx.Paragraph(text).bullet();

var text2 = new docx.TextRun("Are awesome");
var paragraph2 = new docx.Paragraph(text2).bullet();

doc.addParagraph(paragraph);
doc.addParagraph(paragraph2);
```
This will produce:
* Bullet points
* Are awesome

# Exporting
Check the Wiki for exporting guide

# Examples
Check the Wiki for examples

=====

Made with 💖

[npm-image]: https://badge.fury.io/js/docx.svg
[npm-url]: https://npmjs.org/package/docx
[travis-image]: https://travis-ci.org/dolanmiu/docx.svg?branch=master
[travis-url]: https://travis-ci.org/dolanmiu/docx
[daviddm-image]: https://david-dm.org/dolanmiu/docx.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/dolanmiu/docx
[snky-image]: https://snyk.io/test/github/dolanmiu/docx/badge.svg
[snky-url]: https://snyk.io/test/github/dolanmiu/docx
