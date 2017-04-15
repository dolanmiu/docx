<p align="center">
    <img alt="clippy the assistant" src="http://i60.tinypic.com/339pvtt.png">
</p>

<p align="center">
    Generate .docx files with JS/TS very easily, written in TS.
</p>

-----

[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][gemnasium-image]][gemnasium-url] [![Known Vulnerabilities][snky-image]][snky-url] [![Chat on Gitter][gitter-image]][gitter-url]

[![NPM](https://nodei.co/npm/docx.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/docx/)

# docx

## Install

```sh
$ npm install --save docx
```

## Demo

```sh
$ npm run demo
```

will run the demo app in the `demo` folder, which creates a file called "My Document.docx" in the root of the project

## Guide

Please refer to [the Wiki](https://github.com/dolanmiu/docx/wiki) for details on how to use this library, examples and much more!

Full documentation can be found here: [http://dolanmiu.github.io/docx](http://dolanmiu.github.io/docx)

## Simple Usage

```js
// Used to create docx files
var docx = require('docx');

// Create document
var doc = new docx.Document();

// Add some content in the document
var paragraph = new docx.Paragraph("Some cool text here.");
// Add more text into the paragraph if you wish
paragraph.addRun(new docx.TextRun('Lorem Ipsum Foo Bar'));
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

## Examples
Check [the Wiki](https://github.com/dolanmiu/docx/wiki/Examples) for examples.

-----

Made with 💖

Huge thanks to [@felipeochoa](https://github.com/felipeochoa) for awesome contributions to this project

[npm-image]: https://badge.fury.io/js/docx.svg
[npm-url]: https://npmjs.org/package/docx
[travis-image]: https://travis-ci.org/dolanmiu/docx.svg?branch=master
[travis-url]: https://travis-ci.org/dolanmiu/docx
[daviddm-image]: https://david-dm.org/dolanmiu/docx.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/dolanmiu/docx
[snky-image]: https://snyk.io/test/github/dolanmiu/docx/badge.svg
[snky-url]: https://snyk.io/test/github/dolanmiu/docx
[gitter-image]: https://badges.gitter.im/dolanmiu/docx.svg
[gitter-url]: https://gitter.im/docx-lib/Lobby
[gemnasium-image]: https://gemnasium.com/badges/github.com/dolanmiu/docx.svg
[gemnasium-url]: https://gemnasium.com/github.com/dolanmiu/docx

