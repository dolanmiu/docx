# Examples

> All examples can run independently and can be found in the `/demo` folder of the project

All the examples below can be ran locally, to do so, run the following command:

```sh
npm run demo
```

This command will run the `demo selector app` in the `/demo` folder. It will prompt you to select a demo number, which will run a demo from that folder.

## Simple

A simple hello world of the `docx` library:

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo1.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo1.ts_

## Styles

### Styling with JS

This example shows how to customise the look and feel of a document using JS configuration

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo2.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo2.ts_

### Styling with XML

This example shows how to customise the look and feel of a document using XML configuration

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo13.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo13.ts_

## Numbering

This example shows many levels of numbering

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo3.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo3.ts_

## Table

Example of simple table

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo4.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo4.ts_

### Styling table borders

Styling the borders of a table

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo20.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo20.ts_

## Images

### Add image to the document

Importing Images from file system path

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo5.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo5.ts_

### Add images to header and footer

Example showing how to add image to headers and footers

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo9.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo9.ts_

### Scaling images

Example showing how to scale images

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo12.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo12.ts_

### Add Image to media before adding to document

This is the best way to add an image to a document because you can add the same image in two locations without increasing document size by re-using the same image

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo23.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo23.ts_

### Add image to table

As before, to add an image to a table, you would need to add it to the `Media` object first

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo24.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo24.ts_

### Images using Base64 URI

If you want to use a Base64 image instead

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo18.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo18.ts_

## Margins

Example showing how to set custom margins

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo6.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo6.ts_

## Orientation

Example showing how to set the document to `landscape` or `portrait`

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo7.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo7.ts_

## Headers & Footers

Example showing how to add headers and footers

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo8.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo8.ts_

## Multiple headers and footers

Check out `Sections` for this feature

## Page Breaks

### Normal page breaks

Example showing how to page break

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo14.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo14.ts_

### Page break before

Example showing how to page break before like in Word

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo15.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo15.ts_

## Sections

Example of how sections work. Sections allow multiple headers and footers, and `landscape`/`portrait` inside the same document. 
Also you can have different page number formats and starts for different sections.

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo16.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo16.ts_

## Footnotes

Example of how to add footnotes. Good for references

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo17.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo17.ts_

## Packers

## Buffer output

Example showing how to use the Buffer packer and then write that buffer to the file system

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo19.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo19.ts_


## Bookmarks

Example showing how to make bookmarks to make internal hyperlinks within the document

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo21.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo21.ts_

## Bidirectional text

Example showing how to use bidirectional text for certain languages such as Hebrew

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo22.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo22.ts_

## Showcase

### My CV

Example showing how to add headers and footers

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo10.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo10.ts_

### Style and Images

This example shows how to customise the look and feel of a document and add images

[Example](https://raw.githubusercontent.com/dolanmiu/docx/master/demo/demo11.ts ':include')

_Source: https://github.com/dolanmiu/docx/blob/master/demo/demo11.ts_
