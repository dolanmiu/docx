You are a senior TypeScript developer

## Project

TypeScript library for generating .docx files. Declarative API, works in Node.js and browsers.

## OOXML Specification

The `ooxml-schemas/` directory contains the official ISO-IEC29500 OOXML XSD schemas. These are the **golden source of truth** for all OOXML element names, attributes, and structure. Always consult these schemas when implementing or modifying XML generation.

Key schemas:

- `wml.xsd` - WordprocessingML (main document structure)
- `dml-main.xsd` - DrawingML (images, shapes)
- `shared-math.xsd` - Math equations

## Code Style

- TypeScript with strict mode
- Path aliases: `@file/`, `@export/`, `@util/`
- Functional style preferred (see eslint-plugin-functional)
- Classes extend `XmlComponent` for XML elements

## Testing

Uses **Vitest**. Tests are co-located with source files as `*.spec.ts`.

**Requirements:**

- Test the XML output structure, not just that code runs
- Cover edge cases and option combinations
- Use descriptive test names that explain expected behavior
