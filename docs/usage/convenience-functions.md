# Convenience functions

OOXML and this library mainly uses a unit called twentieths of a point or `twip` for short. a twip is a typographical measurement, defined as 1/20 of a typographical point. One twip is 1/1440 inch, or 17.64 μm. This unit is not intuitive for many users, so some functions were created to help

More info here: https://en.wikipedia.org/wiki/Twip

## Convert Inches to Twip

```ts
import { convertInchesToTwip } from "docx";

const twip = convertInchesToTwip(1); // returns 1440
const twip = convertInchesToTwip(0.5); // returns 720
```

## Convert Millimeters to Twip

```ts
import { convertMillimetersToTwip } from "docx";

const twip = convertMillimetersToTwip(50); // returns 2834
```
