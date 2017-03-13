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

# Guide

Please refer to [the Wiki](https://github.com/dolanmiu/docx/wiki) for details on how to use this library, examples and much more!

# Simple Usage

```js
// Used to create docx files
var docx = require('docx');

// Create document
var doc = new docx.Document();

// Add some content in the document
var paragraph = new docx.Paragraph("Some cool text here.");
// Add more text into the paragraph if you wish
paragraph.addText(new docx.TextRun('Lorem Ipsum Foo Bar'));
doc.addParagraph(paragraph);

// Used to export the file into a .docx file
var exporter = new docx.LocalPacker(doc);

// Or use the express packer to make the file downloadable.
// res is express' Response object
var exporter = new docx.ExpressPacker(doc, res);

exporter.pack('My First Document');

// done! A file called 'My First Document.docx'
// will be in your file system if you used LocalPacker
// Or it will start downloading if you are using Express
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
