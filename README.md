<p align="center">
    <img alt="clippy the assistant" src="http://i60.tinypic.com/339pvtt.png">
</p>

<p align="center">
    Generate .docx files with JS/TS very easily
</p>
---

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]

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
	- [Tab Stops](#)
		- [Left Tab Stop](#)
		- [Center Tab Stop](#)
		- [Right Tab Stop](#)
		- [Max Right Tab Stop](#)
		- [Example](#)
- [Exporting](#)
	- [Express](#)
	- [Standalone .docx file](#)
- [Examples](#)
- [License](#)

# Install

```sh
$ npm install --save docx
```


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

## Tab Stops
If you do not know why tab stops are useful, then I recommend you do a bit of research. It enables side by side text which is nicely laid out without the need for tables, or constantly pressing space bar.

**Note**: At the moment, the unit of measurement for a tab stop is counter intuitive for a human. It is using OpenXMLs own measuring system. For example, 2268 roughly translates to 3cm. Therefore in the future, I may consider changing it to percentages or even cm.

![Word 2013 Tabs](http://www.teachucomp.com/wp-content/uploads/blog-4-22-2015-UsingTabStopsInWord-1024x577.png "Word 2013 Tab Stops")

Simply call the relevant methods on the paragraph listed below. Then just add a `tab()` method call to a text object. Adding multiple `tabStops` will mean you would have to chain `tab()` until the desired `tabStop` is selected. Example is shown below.

### Left Tab Stop
```js
paragraph.leftTabStop(2268);
```
2268 is the distance from the left side.

### Center Tab Stop
```js
paragraph.centerTabStp(2268);
```
2268 is the distance from the left side.

### Right Tab Stop
```js
paragraph.rightTabStop(2268);
```
2268 is the distance from the left side.

### Max Right Tab Stop
```js
paragraph.maxRightTabStop();
```
This will create a tab stop on the very edge of the right hand side. Handy for right aligning and left aligning text on the same line.

### Example
```js
var paragraph = new docx.Paragraph().maxRightTabStop();
var leftText = new docx.TextRun("Hey everyone").bold();
var rightText = new docx.TextRun("11th November 2015").tab();
paragraph.addText(leftText);
paragraph.addText(rightText);
```
The example above will create a left aligned text, and a right aligned text on the same line. The laymans approach to this problem would be to either use text boxes or tables. YUK!

```js
var paragraph = new docx.Paragraph();
paragraph.maxRightTabStop();
paragraph.leftTabStop(1000);
var text = new docx.TextRun("Second tab stop here I come!").tab().tab();
paragraph.addText(text);
```
The above shows the use of two tab stops, and how to select/use it.

# Exporting
I used the express exporter in my [website](http://www.dolan.bio). It's very useful, and is the preferred way if you want to make a downloadable file for a visitor. it is much better than generating a physical file on the server, and then passing a download link to that file.
## Express
Simply use the exporter, and pass in the necessary parameters:
```js
var docx = require('docx');

var doc = new docx.Document();
var exporter = new docx.ExpressPacker(doc, res);
exporter.pack('My Document');
```
where `res` is the response object obtained through the Express router. It is that simple. The file will begin downloading in the browser.

## Standalone .docx file
```js
var docx = require('docx');

var doc = new docx.Document();
var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');
```

# Examples
## In practice
I used this library in my personal portfolio/CV website. Click generate CV for a demonstration. [http://www.dolan.bio](http://www.dolan.bio)

## General
#### Simple paragraph
```js
var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World");
var institutionText = new docx.TextRun("University College London").bold(),
var dateText = new docx.TextRun("5th Dec 2015").tab().bold();
paragraph.addText(institutionText);
paragraph.addText(dateText);

doc.addParagraph(paragraph);
var exporter = new docx.LocalPacker(doc);
exporter.pack('My Document');
```

Or:
```js
var doc = new docx.Document();

var paragraph = new docx.Paragraph("Hello World");
var institutionText = new docx.TextRun("University College London").bold(),
var dateText = new docx.TextRun("5th Dec 2015").tab().bold();
paragraph.addText(institutionText);
paragraph.addText(dateText);

var exporter = new docx.ExpressPacker(doc, res);
exporter.pack('My Document');
```
Would produce:

***University College London***

***5th Dec 2015***

Made with 💖 by Dolan Miu 🍆 💦 😝

# License

MIT © [Dolan Miu](http://www.dolan.bio)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[npm-image]: https://badge.fury.io/js/docx.svg
[npm-url]: https://npmjs.org/package/docx
[travis-image]: https://travis-ci.org/dolanmiu/docx.svg?branch=master
[travis-url]: https://travis-ci.org/dolanmiu/docx
[daviddm-image]: https://david-dm.org/dolanmiu/docx.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/dolanmiu/docx