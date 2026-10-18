/**
 * The code page the VBA project's text is written in: its code, and the names of the project and its modules.
 *
 * @module
 */

/**
 * Windows-1252, the code page of VBA in Word set to English and the other Western European languages. Its number goes in
 * the project, which is how VBA knows it.
 */
export const CODE_PAGE = 1252;

// Windows-1252's characters from 0x80 to 0x9F, where Latin-1 has control characters. It has none at 0x81, 0x8D, 0x8F,
// 0x90 and 0x9D. From 0xA0 on, it has Latin-1's characters, as Unicode has them
const CHARACTERS_FROM_0X80 = "€_‚ƒ„…†‡ˆ‰Š‹Œ_Ž__‘’“”•–—˜™š›œ_žŸ";

const BYTES = new Map([...CHARACTERS_FROM_0X80].flatMap((character, index) => (character === "_" ? [] : [[character, 0x80 + index]])));

/**
 * Encodes text in Windows-1252.
 *
 * @param what - What the text is, for the error, such as `The code of module "Greetings"`
 * @throws If the text has a character Windows-1252 doesn't
 */
export const encodeWindows1252 = (text: string, what: string): Uint8Array =>
    Uint8Array.from([...text], (character) => {
        const code = character.codePointAt(0)!;
        const byte = code < 0x80 || (code >= 0xa0 && code <= 0xff) ? code : BYTES.get(character);
        if (byte === undefined) {
            // ChrW takes a UTF-16 code unit, up to U+FFFF, so a character beyond that is two: its surrogate pair
            const chrW = Array.from(
                { length: character.length },
                (_, index) => `ChrW(&H${character.charCodeAt(index).toString(16).toUpperCase()})`,
            );
            throw new Error(
                `${what} has "${character}", which VBA can't keep in its code page, Windows-1252. ` +
                    `Write it with ChrW instead, such as ${chrW.join(" & ")} in a string`,
            );
        }
        return byte;
    });
