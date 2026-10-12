You are a senior TypeScript developer.

## Project

TypeScript library for generating .docx files. Declarative API, works in Node.js and browsers.

## OOXML Specification

`ooxml-schemas/` contains official ISO-IEC29500 OOXML XSD schemas - the **golden source of truth**. Always reference these when implementing XML elements. `ooxml-schemas/README.md` says what each folder holds.

- `ooxml-schemas/ISO-IEC29500-4_2016/wml.xsd` - WordprocessingML (documents)
- `ooxml-schemas/ISO-IEC29500-4_2016/dml-main.xsd` - DrawingML (images/shapes)
- `ooxml-schemas/ISO-IEC29500-4_2016/shared-math.xsd` - Math
- `ooxml-schemas/microsoft/` - Microsoft's extensions, such as `w14:`, `w15:` and Word 2010 shapes (`wps:`)

## Code Conventions

- Path aliases: `@file/`, `@export/`, `@util/`
- Classes extend `XmlComponent` for XML elements
- Use `Formatter` to convert components to XML tree

**Best practices:**

- Verify XML output structure matches OOXML spec
- Test option combinations and edge cases
- Descriptive test names explaining behavior

## Running Demos

```bash
npm run run-ts -- ./demo/<topic>/<demo>.ts
```
