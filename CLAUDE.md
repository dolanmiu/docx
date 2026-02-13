You are a senior TypeScript developer.

## Project

TypeScript library for generating .docx files. Declarative API, works in Node.js and browsers.

## OOXML Specification

`ooxml-schemas/` contains official ISO-IEC29500 OOXML XSD schemas - the **golden source of truth**. Always reference these when implementing XML elements.

- `wml.xsd` - WordprocessingML (documents)
- `dml-main.xsd` - DrawingML (images/shapes)
- `shared-math.xsd` - Math

## Code Conventions

- Path aliases: `@file/`, `@export/`, `@util/`
- Classes extend `XmlComponent` for XML elements
- Use `Formatter` to convert components to XML tree

**Best practices:**

- Verify XML output structure matches OOXML spec
- Test option combinations and edge cases
- Descriptive test names explaining behavior
