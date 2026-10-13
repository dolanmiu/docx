var docxHtml = (function(exports, docx, docx_math) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region \0rolldown/runtime.js
	var __defProp = Object.defineProperty;
	var __exportAll = (all, no_symbols) => {
		let target = {};
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
		if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
		return target;
	};
	//#endregion
	//#region node_modules/parse5/dist/common/unicode.js
	var UNDEFINED_CODE_POINTS = /* @__PURE__ */ new Set([
		65534,
		65535,
		131070,
		131071,
		196606,
		196607,
		262142,
		262143,
		327678,
		327679,
		393214,
		393215,
		458750,
		458751,
		524286,
		524287,
		589822,
		589823,
		655358,
		655359,
		720894,
		720895,
		786430,
		786431,
		851966,
		851967,
		917502,
		917503,
		983038,
		983039,
		1048574,
		1048575,
		1114110,
		1114111
	]);
	var CODE_POINTS;
	(function(CODE_POINTS) {
		CODE_POINTS[CODE_POINTS["EOF"] = -1] = "EOF";
		CODE_POINTS[CODE_POINTS["NULL"] = 0] = "NULL";
		CODE_POINTS[CODE_POINTS["TABULATION"] = 9] = "TABULATION";
		CODE_POINTS[CODE_POINTS["CARRIAGE_RETURN"] = 13] = "CARRIAGE_RETURN";
		CODE_POINTS[CODE_POINTS["LINE_FEED"] = 10] = "LINE_FEED";
		CODE_POINTS[CODE_POINTS["FORM_FEED"] = 12] = "FORM_FEED";
		CODE_POINTS[CODE_POINTS["SPACE"] = 32] = "SPACE";
		CODE_POINTS[CODE_POINTS["EXCLAMATION_MARK"] = 33] = "EXCLAMATION_MARK";
		CODE_POINTS[CODE_POINTS["QUOTATION_MARK"] = 34] = "QUOTATION_MARK";
		CODE_POINTS[CODE_POINTS["AMPERSAND"] = 38] = "AMPERSAND";
		CODE_POINTS[CODE_POINTS["APOSTROPHE"] = 39] = "APOSTROPHE";
		CODE_POINTS[CODE_POINTS["HYPHEN_MINUS"] = 45] = "HYPHEN_MINUS";
		CODE_POINTS[CODE_POINTS["SOLIDUS"] = 47] = "SOLIDUS";
		CODE_POINTS[CODE_POINTS["DIGIT_0"] = 48] = "DIGIT_0";
		CODE_POINTS[CODE_POINTS["DIGIT_9"] = 57] = "DIGIT_9";
		CODE_POINTS[CODE_POINTS["SEMICOLON"] = 59] = "SEMICOLON";
		CODE_POINTS[CODE_POINTS["LESS_THAN_SIGN"] = 60] = "LESS_THAN_SIGN";
		CODE_POINTS[CODE_POINTS["EQUALS_SIGN"] = 61] = "EQUALS_SIGN";
		CODE_POINTS[CODE_POINTS["GREATER_THAN_SIGN"] = 62] = "GREATER_THAN_SIGN";
		CODE_POINTS[CODE_POINTS["QUESTION_MARK"] = 63] = "QUESTION_MARK";
		CODE_POINTS[CODE_POINTS["LATIN_CAPITAL_A"] = 65] = "LATIN_CAPITAL_A";
		CODE_POINTS[CODE_POINTS["LATIN_CAPITAL_Z"] = 90] = "LATIN_CAPITAL_Z";
		CODE_POINTS[CODE_POINTS["RIGHT_SQUARE_BRACKET"] = 93] = "RIGHT_SQUARE_BRACKET";
		CODE_POINTS[CODE_POINTS["GRAVE_ACCENT"] = 96] = "GRAVE_ACCENT";
		CODE_POINTS[CODE_POINTS["LATIN_SMALL_A"] = 97] = "LATIN_SMALL_A";
		CODE_POINTS[CODE_POINTS["LATIN_SMALL_Z"] = 122] = "LATIN_SMALL_Z";
	})(CODE_POINTS || (CODE_POINTS = {}));
	var SEQUENCES = {
		DASH_DASH: "--",
		CDATA_START: "[CDATA[",
		DOCTYPE: "doctype",
		SCRIPT: "script",
		PUBLIC: "public",
		SYSTEM: "system"
	};
	function isSurrogate(cp) {
		return cp >= 55296 && cp <= 57343;
	}
	function isSurrogatePair(cp) {
		return cp >= 56320 && cp <= 57343;
	}
	function getSurrogatePairCodePoint(cp1, cp2) {
		return (cp1 - 55296) * 1024 + 9216 + cp2;
	}
	function isControlCodePoint(cp) {
		return cp !== 32 && cp !== 10 && cp !== 13 && cp !== 9 && cp !== 12 && cp >= 1 && cp <= 31 || cp >= 127 && cp <= 159;
	}
	function isUndefinedCodePoint(cp) {
		return cp >= 64976 && cp <= 65007 || UNDEFINED_CODE_POINTS.has(cp);
	}
	//#endregion
	//#region node_modules/parse5/dist/common/error-codes.js
	var ERR;
	(function(ERR) {
		ERR["controlCharacterInInputStream"] = "control-character-in-input-stream";
		ERR["noncharacterInInputStream"] = "noncharacter-in-input-stream";
		ERR["surrogateInInputStream"] = "surrogate-in-input-stream";
		ERR["nonVoidHtmlElementStartTagWithTrailingSolidus"] = "non-void-html-element-start-tag-with-trailing-solidus";
		ERR["endTagWithAttributes"] = "end-tag-with-attributes";
		ERR["endTagWithTrailingSolidus"] = "end-tag-with-trailing-solidus";
		ERR["unexpectedSolidusInTag"] = "unexpected-solidus-in-tag";
		ERR["unexpectedNullCharacter"] = "unexpected-null-character";
		ERR["unexpectedQuestionMarkInsteadOfTagName"] = "unexpected-question-mark-instead-of-tag-name";
		ERR["invalidFirstCharacterOfTagName"] = "invalid-first-character-of-tag-name";
		ERR["unexpectedEqualsSignBeforeAttributeName"] = "unexpected-equals-sign-before-attribute-name";
		ERR["missingEndTagName"] = "missing-end-tag-name";
		ERR["unexpectedCharacterInAttributeName"] = "unexpected-character-in-attribute-name";
		ERR["unknownNamedCharacterReference"] = "unknown-named-character-reference";
		ERR["missingSemicolonAfterCharacterReference"] = "missing-semicolon-after-character-reference";
		ERR["unexpectedCharacterAfterDoctypeSystemIdentifier"] = "unexpected-character-after-doctype-system-identifier";
		ERR["unexpectedCharacterInUnquotedAttributeValue"] = "unexpected-character-in-unquoted-attribute-value";
		ERR["eofBeforeTagName"] = "eof-before-tag-name";
		ERR["eofInTag"] = "eof-in-tag";
		ERR["missingAttributeValue"] = "missing-attribute-value";
		ERR["missingWhitespaceBetweenAttributes"] = "missing-whitespace-between-attributes";
		ERR["missingWhitespaceAfterDoctypePublicKeyword"] = "missing-whitespace-after-doctype-public-keyword";
		ERR["missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers"] = "missing-whitespace-between-doctype-public-and-system-identifiers";
		ERR["missingWhitespaceAfterDoctypeSystemKeyword"] = "missing-whitespace-after-doctype-system-keyword";
		ERR["missingQuoteBeforeDoctypePublicIdentifier"] = "missing-quote-before-doctype-public-identifier";
		ERR["missingQuoteBeforeDoctypeSystemIdentifier"] = "missing-quote-before-doctype-system-identifier";
		ERR["missingDoctypePublicIdentifier"] = "missing-doctype-public-identifier";
		ERR["missingDoctypeSystemIdentifier"] = "missing-doctype-system-identifier";
		ERR["abruptDoctypePublicIdentifier"] = "abrupt-doctype-public-identifier";
		ERR["abruptDoctypeSystemIdentifier"] = "abrupt-doctype-system-identifier";
		ERR["cdataInHtmlContent"] = "cdata-in-html-content";
		ERR["incorrectlyOpenedComment"] = "incorrectly-opened-comment";
		ERR["eofInScriptHtmlCommentLikeText"] = "eof-in-script-html-comment-like-text";
		ERR["eofInDoctype"] = "eof-in-doctype";
		ERR["nestedComment"] = "nested-comment";
		ERR["abruptClosingOfEmptyComment"] = "abrupt-closing-of-empty-comment";
		ERR["eofInComment"] = "eof-in-comment";
		ERR["incorrectlyClosedComment"] = "incorrectly-closed-comment";
		ERR["eofInCdata"] = "eof-in-cdata";
		ERR["absenceOfDigitsInNumericCharacterReference"] = "absence-of-digits-in-numeric-character-reference";
		ERR["nullCharacterReference"] = "null-character-reference";
		ERR["surrogateCharacterReference"] = "surrogate-character-reference";
		ERR["characterReferenceOutsideUnicodeRange"] = "character-reference-outside-unicode-range";
		ERR["controlCharacterReference"] = "control-character-reference";
		ERR["noncharacterCharacterReference"] = "noncharacter-character-reference";
		ERR["missingWhitespaceBeforeDoctypeName"] = "missing-whitespace-before-doctype-name";
		ERR["missingDoctypeName"] = "missing-doctype-name";
		ERR["invalidCharacterSequenceAfterDoctypeName"] = "invalid-character-sequence-after-doctype-name";
		ERR["duplicateAttribute"] = "duplicate-attribute";
		ERR["nonConformingDoctype"] = "non-conforming-doctype";
		ERR["missingDoctype"] = "missing-doctype";
		ERR["misplacedDoctype"] = "misplaced-doctype";
		ERR["endTagWithoutMatchingOpenElement"] = "end-tag-without-matching-open-element";
		ERR["closingOfElementWithOpenChildElements"] = "closing-of-element-with-open-child-elements";
		ERR["disallowedContentInNoscriptInHead"] = "disallowed-content-in-noscript-in-head";
		ERR["openElementsLeftAfterEof"] = "open-elements-left-after-eof";
		ERR["abandonedHeadElementChild"] = "abandoned-head-element-child";
		ERR["misplacedStartTagForHeadElement"] = "misplaced-start-tag-for-head-element";
		ERR["nestedNoscriptInHead"] = "nested-noscript-in-head";
		ERR["eofInElementThatCanContainOnlyText"] = "eof-in-element-that-can-contain-only-text";
	})(ERR || (ERR = {}));
	//#endregion
	//#region node_modules/parse5/dist/tokenizer/preprocessor.js
	var DEFAULT_BUFFER_WATERLINE = 65536;
	var Preprocessor = class {
		constructor(handler) {
			this.handler = handler;
			this.html = "";
			this.pos = -1;
			this.lastGapPos = -2;
			this.gapStack = [];
			this.skipNextNewLine = false;
			this.lastChunkWritten = false;
			this.endOfChunkHit = false;
			this.bufferWaterline = DEFAULT_BUFFER_WATERLINE;
			this.isEol = false;
			this.lineStartPos = 0;
			this.droppedBufferSize = 0;
			this.line = 1;
			this.lastErrOffset = -1;
		}
		/** The column on the current line. If we just saw a gap (eg. a surrogate pair), return the index before. */
		get col() {
			return this.pos - this.lineStartPos + Number(this.lastGapPos !== this.pos);
		}
		get offset() {
			return this.droppedBufferSize + this.pos;
		}
		getError(code, cpOffset) {
			const { line, col, offset } = this;
			const startCol = col + cpOffset;
			const startOffset = offset + cpOffset;
			return {
				code,
				startLine: line,
				endLine: line,
				startCol,
				endCol: startCol,
				startOffset,
				endOffset: startOffset
			};
		}
		_err(code) {
			if (this.handler.onParseError && this.lastErrOffset !== this.offset) {
				this.lastErrOffset = this.offset;
				this.handler.onParseError(this.getError(code, 0));
			}
		}
		_addGap() {
			this.gapStack.push(this.lastGapPos);
			this.lastGapPos = this.pos;
		}
		_processSurrogate(cp) {
			if (this.pos !== this.html.length - 1) {
				const nextCp = this.html.charCodeAt(this.pos + 1);
				if (isSurrogatePair(nextCp)) {
					this.pos++;
					this._addGap();
					return getSurrogatePairCodePoint(cp, nextCp);
				}
			} else if (!this.lastChunkWritten) {
				this.endOfChunkHit = true;
				return CODE_POINTS.EOF;
			}
			this._err(ERR.surrogateInInputStream);
			return cp;
		}
		willDropParsedChunk() {
			return this.pos > this.bufferWaterline;
		}
		dropParsedChunk() {
			if (this.willDropParsedChunk()) {
				this.html = this.html.substring(this.pos);
				this.lineStartPos -= this.pos;
				this.droppedBufferSize += this.pos;
				this.pos = 0;
				this.lastGapPos = -2;
				this.gapStack.length = 0;
			}
		}
		write(chunk, isLastChunk) {
			if (this.html.length > 0) this.html += chunk;
			else this.html = chunk;
			this.endOfChunkHit = false;
			this.lastChunkWritten = isLastChunk;
		}
		insertHtmlAtCurrentPos(chunk) {
			this.html = this.html.substring(0, this.pos + 1) + chunk + this.html.substring(this.pos + 1);
			this.endOfChunkHit = false;
		}
		startsWith(pattern, caseSensitive) {
			if (this.pos + pattern.length > this.html.length) {
				this.endOfChunkHit = !this.lastChunkWritten;
				return false;
			}
			if (caseSensitive) return this.html.startsWith(pattern, this.pos);
			for (let i = 0; i < pattern.length; i++) if ((this.html.charCodeAt(this.pos + i) | 32) !== pattern.charCodeAt(i)) return false;
			return true;
		}
		peek(offset) {
			const pos = this.pos + offset;
			if (pos >= this.html.length) {
				this.endOfChunkHit = !this.lastChunkWritten;
				return CODE_POINTS.EOF;
			}
			const code = this.html.charCodeAt(pos);
			return code === CODE_POINTS.CARRIAGE_RETURN ? CODE_POINTS.LINE_FEED : code;
		}
		advance() {
			this.pos++;
			if (this.isEol) {
				this.isEol = false;
				this.line++;
				this.lineStartPos = this.pos;
			}
			if (this.pos >= this.html.length) {
				this.endOfChunkHit = !this.lastChunkWritten;
				return CODE_POINTS.EOF;
			}
			let cp = this.html.charCodeAt(this.pos);
			if (cp === CODE_POINTS.CARRIAGE_RETURN) {
				this.isEol = true;
				this.skipNextNewLine = true;
				return CODE_POINTS.LINE_FEED;
			}
			if (cp === CODE_POINTS.LINE_FEED) {
				this.isEol = true;
				if (this.skipNextNewLine) {
					this.line--;
					this.skipNextNewLine = false;
					this._addGap();
					return this.advance();
				}
			}
			this.skipNextNewLine = false;
			if (isSurrogate(cp)) cp = this._processSurrogate(cp);
			if (!(this.handler.onParseError === null || cp > 31 && cp < 127 || cp === CODE_POINTS.LINE_FEED || cp === CODE_POINTS.CARRIAGE_RETURN || cp > 159 && cp < 64976)) this._checkForProblematicCharacters(cp);
			return cp;
		}
		_checkForProblematicCharacters(cp) {
			if (isControlCodePoint(cp)) this._err(ERR.controlCharacterInInputStream);
			else if (isUndefinedCodePoint(cp)) this._err(ERR.noncharacterInInputStream);
		}
		retreat(count) {
			this.pos -= count;
			while (this.pos < this.lastGapPos) {
				this.lastGapPos = this.gapStack.pop();
				this.pos--;
			}
			this.isEol = false;
		}
	};
	//#endregion
	//#region node_modules/parse5/dist/common/token.js
	var TokenType;
	(function(TokenType) {
		TokenType[TokenType["CHARACTER"] = 0] = "CHARACTER";
		TokenType[TokenType["NULL_CHARACTER"] = 1] = "NULL_CHARACTER";
		TokenType[TokenType["WHITESPACE_CHARACTER"] = 2] = "WHITESPACE_CHARACTER";
		TokenType[TokenType["START_TAG"] = 3] = "START_TAG";
		TokenType[TokenType["END_TAG"] = 4] = "END_TAG";
		TokenType[TokenType["COMMENT"] = 5] = "COMMENT";
		TokenType[TokenType["DOCTYPE"] = 6] = "DOCTYPE";
		TokenType[TokenType["EOF"] = 7] = "EOF";
		TokenType[TokenType["HIBERNATION"] = 8] = "HIBERNATION";
	})(TokenType || (TokenType = {}));
	function getTokenAttr(token, attrName) {
		for (let i = token.attrs.length - 1; i >= 0; i--) if (token.attrs[i].name === attrName) return token.attrs[i].value;
		return null;
	}
	//#endregion
	//#region node_modules/parse5/node_modules/entities/dist/decode-codepoint.js
	var decodeMap = /* @__PURE__ */ new Map([
		[0, 65533],
		[128, 8364],
		[130, 8218],
		[131, 402],
		[132, 8222],
		[133, 8230],
		[134, 8224],
		[135, 8225],
		[136, 710],
		[137, 8240],
		[138, 352],
		[139, 8249],
		[140, 338],
		[142, 381],
		[145, 8216],
		[146, 8217],
		[147, 8220],
		[148, 8221],
		[149, 8226],
		[150, 8211],
		[151, 8212],
		[152, 732],
		[153, 8482],
		[154, 353],
		[155, 8250],
		[156, 339],
		[158, 382],
		[159, 376]
	]);
	/**
	* Replace the given code point with a replacement character if it is a
	* surrogate or is outside the valid range. Otherwise return the code
	* point unchanged.
	* @param codePoint Unicode code point to convert.
	*/
	function replaceCodePoint(codePoint) {
		var _decodeMap$get;
		if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) return 65533;
		return (_decodeMap$get = decodeMap.get(codePoint)) !== null && _decodeMap$get !== void 0 ? _decodeMap$get : codePoint;
	}
	//#endregion
	//#region node_modules/parse5/node_modules/entities/dist/internal/decode-shared.js
	/**
	* Shared base64 decode helper for generated decode data.
	* Assumes global atob is available.
	* @param input Input string to encode or decode.
	*/
	function decodeBase64$1(input) {
		const binary = atob(input);
		const evenLength = binary.length & -2;
		const out = new Uint16Array(evenLength / 2);
		for (let index = 0, outIndex = 0; index < evenLength; index += 2) {
			const lo = binary.charCodeAt(index);
			const hi = binary.charCodeAt(index + 1);
			out[outIndex++] = lo | hi << 8;
		}
		return out;
	}
	//#endregion
	//#region node_modules/parse5/node_modules/entities/dist/generated/decode-data-html.js
	/** Packed HTML decode trie data. */
	var htmlDecodeTree = /* #__PURE__ */ decodeBase64$1("QR08ALkAAgH6AYsDNQR2BO0EPgXZBQEGLAbdBxMISQrvCmQLfQurDKQNLw4fD4YPpA+6D/IPAAAAAAAAAAAAAAAAKhBMEY8TmxUWF2EYLBkxGuAa3RsJHDscWR8YIC8jSCSIJcMl6ie3Ku8rEC0CLjoupS7kLgAIRU1hYmNmZ2xtbm9wcnN0dVQAWgBeAGUAaQBzAHcAfgCBAIQAhwCSAJoAoACsALMAbABpAGcAO4DGAMZAUAA7gCYAJkBjAHUAdABlADuAwQDBQHIiZXZlAAJhAAFpeW0AcgByAGMAO4DCAMJAEGRyAADgNdgE3XIAYQB2AGUAO4DAAMBA8CFoYZFj4SFjcgBhZAAAoFMqAAFncIsAjgBvAG4ABGFmAADgNdg43fAlbHlGdW5jdGlvbgCgYSBpAG4AZwA7gMUAxUAAAWNzpACoAHIAAOA12Jzc6SFnbgCgVCJpAGwAZABlADuAwwDDQG0AbAA7gMQAxEAABGFjZWZvcnN1xQDYANoA7QDxAPYA+QD8AAABY3LJAM8AayNzbGFzaAAAoBYidgHTANUAAKDnKmUAZAAAoAYjeQARZIABY3J0AOAA5QDrAGEidXNlAACgNSLuI291bGxpcwCgLCFhAJJjcgAA4DXYBd1wAGYAAOA12Dnd5SF2ZdhiYwDyAOoAbSJwZXEAAKBOIgAHSE9hY2RlZmhpbG9yc3UXARoBHwE6AVIBVQFiAWQBZgGCAakB6QHtAfIBYwB5ACdkUABZADuAqQCpQIABY3B5ACUBKAE1AfUhdGUGYWmg0iJ0KGFsRGlmZmVyZW50aWFsRAAAoEUhbCJleXMAAKAtIQACYWVpb0EBRAFKAU0B8iFvbgxhZABpAGwAO4DHAMdAcgBjAAhhbiJpbnQAAKAwIm8AdAAKYQABZG5ZAV0BaSJsbGEAuGB0I2VyRG90ALdg8gA5AWkAp2NyImNsZQAAAkRNUFRwAXQBeQF9AW8AdAAAoJkiaSJudXMAAKCWIuwhdXMAoJUiaSJtZXMAAKCXIm8AAAFjc4cBlAFrKndpc2VDb250b3VySW50ZWdyYWwAAKAyImUjQ3VybHkAAAFEUZwBpAFvJXVibGVRdW90ZQAAoB0gdSJvdGUAAKAZIAACbG5wdbABtgHNAdgBbwBuAGWgNyIAoHQqgAFnaXQAvAHBAcUB8iJ1ZW50AKBhIm4AdAAAoC8i7yV1ckludGVncmFsAKAuIgABZnLRAdMBAKACIe8iZHVjdACgECJuLnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbAAAoDMi7yFzcwCgLypjAHIAAOA12J7ccABDoNMiYQBwAACgTSKABURKU1phY2VmaW9zAAsCEgIVAhgCGwIsAjQCOQI9AnMCfwNvoEUh9CJyYWhkAKARKWMAeQACZGMAeQAFZGMAeQAPZIABZ3JzACECJQIoAuchZXIAoCEgcgAAoKEhaAB2AACg5CoAAWF5MAIzAvIhb24OYRRkbAB0oAciYQCUY3IAAOA12AfdAAFhZkECawIAAWNtRQJnAvIjaXRpY2FsAAJBREdUUAJUAl8CYwJjInV0ZQC0YG8AdAFZAloC2WJiJGxlQWN1dGUA3WJyImF2ZQBgYGkibGRlANxi7yFuZACgxCJmJWVyZW50aWFsRAAAoEYhcAR9AgAAAAAAAIECjgIAABoDZgAA4DXYO91EoagAhQKJAm8AdAAAoNwgcSJ1YWwAAKBQIuIhbGUAA0NETFJVVpkCqAK1Au8C/wIRA28AbgB0AG8AdQByAEkAbgB0AGUAZwByAGEA7ADEAW8AdAKvAgAAAACwAqhgbiNBcnJvdwAAoNMhAAFlb7kC0AJmAHQAgAFBUlQAwQLGAs0CciJyb3cAAKDQIekkZ2h0QXJyb3cAoNQhZQDlACsCbgBnAAABTFLWAugC5SFmdAABQVLcAuECciJyb3cAAKD4J+kkZ2h0QXJyb3cAoPon6SRnaHRBcnJvdwCg+SdpImdodAAAAUFU9gL7AnIicm93AACg0iFlAGUAAKCoInAAQQIGAwAAAAALA3Iicm93AACg0SFvJHduQXJyb3cAAKDVIWUlcnRpY2FsQmFyAACgJSJuAAADQUJMUlRhJAM2AzoDWgNxA3oDciJyb3cAAKGTIUJVLAMwA2EAcgAAoBMpcCNBcnJvdwAAoPUhciJldmUAEWPlIWZ00gJDAwAASwMAAFIDaSVnaHRWZWN0b3IAAKBQKWUkZVZlY3RvcgAAoF4p5SJjdG9yQqC9IWEAcgAAoFYpaSJnaHQA1AFiAwAAaQNlJGVWZWN0b3IAAKBfKeUiY3RvckKgwSFhAHIAAKBXKWUAZQBBoKQiciJyb3cAAKCnIXIAcgBvAPcAtAIAAWN0gwOHA3IAAOA12J/c8iFvaxBhAAhOVGFjZGZnbG1vcHFzdHV4owOlA6kDsAO/A8IDxgPNA9ID8gP9AwEEFAQeBCAEJQRHAEphSAA7gNAA0EBjAHUAdABlADuAyQDJQIABYWl5ALYDuQO+A/Ihb24aYXIAYwA7gMoAykAtZG8AdAAWYXIAAOA12AjdcgBhAHYAZQA7gMgAyEDlIm1lbnQAoAgiAAFhcNYD2QNjAHIAEmF0AHkAUwLhAwAAAADpA20lYWxsU3F1YXJlAACg+yVlJ3J5U21hbGxTcXVhcmUAAKCrJQABZ3D2A/kDbwBuABhhZgAA4DXYPN3zImlsb26VY3UAAAFhaQYEDgRsAFSgdSppImxkZQAAoEIi7CNpYnJpdW0AoMwhAAFjaRgEGwRyAACgMCFtAACgcyphAJdjbQBsADuAywDLQAABaXApBC0E8yF0cwCgAyLvJG5lbnRpYWxFAKBHIYACY2Zpb3MAPQQ/BEMEXQRyBHkAJGRyAADgNdgJ3WwibGVkAFMCTAQAAAAAVARtJWFsbFNxdWFyZQAAoPwlZSdyeVNtYWxsU3F1YXJlAACgqiVwA2UEAABpBAAAAABtBGYAAOA12D3dwSFsbACgACLyI2llcnRyZgCgMSFjAPIAcQQABkpUYWJjZGZnb3JzdIgEiwSOBJMElwSkBKcEqwStBLIE5QTqBGMAeQADZDuAPgA+QO0hbWFkoJMD3GNyImV2ZQAeYYABZWl5AJ0EoASjBOQhaWwiYXIAYwAcYRNkbwB0ACBhcgAA4DXYCt0AoNkicABmAADgNdg+3eUiYXRlcgADRUZHTFNUvwTIBM8E1QTZBOAEcSJ1YWwATKBlIuUhc3MAoNsidSRsbEVxdWFsAACgZyJyI2VhdGVyAACgoirlIXNzAKB3IuwkYW50RXF1YWwAoH4qaSJsZGUAAKBzImMAcgAA4DXYotwAoGsiAARBYWNmaW9zdfkE/QQFBQgFCwUTBSIFKwVSIkRjeQAqZAABY3QBBQQFZQBrAMdiXmDpIXJjJGFyAACgDCFsJWJlcnRTcGFjZQAAoAsh8AEYBQAAGwVmAACgDSHpJXpvbnRhbExpbmUAoAAlAAFjdCYFKAXyABIF8iFvayZhbQBwAEQBMQU5BW8AdwBuAEgAdQBtAPAAAAFxInVhbAAAoE8iAAdFSk9hY2RmZ21ub3N0dVMFVgVZBVwFYwVtBXAFcwV6BZAFtgXFBckFzQVjAHkAFWTsIWlnMmFjAHkAAWRjAHUAdABlADuAzQDNQAABaXlnBWwFcgBjADuAzgDOQBhkbwB0ADBhcgAAoBEhcgBhAHYAZQA7gMwAzEAAoREhYXB/BYsFAAFjZ4MFhQVyACphaSNuYXJ5SQAAoEghbABpAGUA8wD6AvQBlQUAAKUFZaAsIgABZ3KaBZ4F8iFhbACgKyLzI2VjdGlvbgCgwiJpI3NpYmxlAAABQ1SsBbEFbyJtbWEAAKBjIGkibWVzAACgYiCAAWdwdAC8Bb8FwwVvAG4ALmFmAADgNdhA3WEAmWNjAHIAAKAQIWkibGRlAChh6wHSBQAA1QVjAHkABmRsADuAzwDPQIACY2Zvc3UA4QXpBe0F8gX9BQABaXnlBegFcgBjADRhGWRyAADgNdgN3XAAZgAA4DXYQd3jAfcFAAD7BXIAAOA12KXc8iFjeQhk6yFjeQRkgANISmFjZm9zAAwGDwYSBhUGHQYhBiYGYwB5ACVkYwB5AAxk8CFwYZpjAAFleRkGHAbkIWlsNmEaZHIAAOA12A7dcABmAADgNdhC3WMAcgAA4DXYptyABUpUYWNlZmxtb3N0AD0GQAZDBl4GawZkB2gHcAd0B80H2gdjAHkACWQ7gDwAPECAAmNtbnByAEwGTwZSBlUGWwb1IXRlOWHiIWRhm2NnAACg6ifsI2FjZXRyZgCgEiFyAACgniGAAWFleQBkBmcGagbyIW9uPWHkIWlsO2EbZAABZnNvBjQHdAAABUFDREZSVFVWYXKABp4GpAbGBssG3AYDByEHwQIqBwABbnKEBowGZyVsZUJyYWNrZXQAAKDoJ/Ihb3cAoZAhQlKTBpcGYQByAACg5CHpJGdodEFycm93AKDGIWUjaWxpbmcAAKAII28A9QGqBgAAsgZiJWxlQnJhY2tldAAAoOYnbgDUAbcGAAC+BmUkZVZlY3RvcgAAoGEp5SJjdG9yQqDDIWEAcgAAoFkpbCJvb3IAAKAKI2kiZ2h0AAABQVbSBtcGciJyb3cAAKCUIeUiY3RvcgCgTikAAWVy4AbwBmUAAKGjIkFW5gbrBnIicm93AACgpCHlImN0b3IAoFopaSNhbmdsZQBCorIi+wYAAAAA/wZhAHIAAKDPKXEidWFsAACgtCJwAIABRFRWAAoHEQcYB+8kd25WZWN0b3IAoFEpZSRlVmVjdG9yAACgYCnlImN0b3JCoL8hYQByAACgWCnlImN0b3JCoLwhYQByAACgUilpAGcAaAB0AGEAcgByAG8A9wDMAnMAAANFRkdMU1Q/B0cHTgdUB1gHXwfxJXVhbEdyZWF0ZXIAoNoidSRsbEVxdWFsAACgZiJyI2VhdGVyAACgdiLlIXNzAKChKuwkYW50RXF1YWwAoH0qaSJsZGUAAKByInIAAOA12A/dZaDYIuYjdGFycm93AKDaIWkiZG90AD9hgAFucHcAege1B7kHZwAAAkxSbHKCB5QHmwerB+UhZnQAAUFSiAeNB3Iicm93AACg9SfpJGdodEFycm93AKD3J+kkZ2h0QXJyb3cAoPYn5SFmdAABYXLcAqEHaQBnAGgAdABhAHIAcgBvAPcA5wJpAGcAaAB0AGEAcgByAG8A9wDuAmYAAOA12EPdZQByAAABTFK/B8YHZSRmdEFycm93AACgmSHpJGdodEFycm93AKCYIYABY2h0ANMH1QfXB/IAWgYAoLAh8iFva0FhAKBqIgAEYWNlZmlvc3XpB+wH7gf/BwMICQgOCBEIcAAAoAUpeQAcZAABZGzyB/kHaSR1bVNwYWNlAACgXyBsI2ludHJmAACgMyFyAADgNdgQ3e4jdXNQbHVzAKATInAAZgAA4DXYRN1jAPIA/gecY4AESmFjZWZvc3R1ACEIJAgoCDUIgQiFCDsKQApHCmMAeQAKZGMidXRlAENhgAFhZXkALggxCDQI8iFvbkdh5CFpbEVhHWSAAWdzdwA7CGEIfQjhInRpdmWAAU1UVgBECEwIWQhlJWRpdW1TcGFjZQAAoAsgaABpAAABY25SCFMIawBTAHAAYQBjAOUASwhlAHIAeQBUAGgAaQDuAFQI9CFlZAABR0xnCHUIcgBlAGEAdABlAHIARwByAGUAYQB0AGUA8gDrBGUAcwBzAEwAZQBzAPMA2wdMImluZQAKYHIAAOA12BHdAAJCbnB0jAiRCJkInAhyImVhawAAoGAgwiZyZWFraW5nU3BhY2WgYGYAAKAVIUOq7CqzCMIIzQgAAOcIGwkAAAAAAAAtCQAAbwkAAIcJAACdCcAJGQoAADQKAAFvdbYIvAjuI2dydWVudACgYiJwIkNhcAAAoG0ibyh1YmxlVmVydGljYWxCYXIAAKAmIoABbHF4ANII1wjhCOUibWVudACgCSL1IWFsVKBgImkibGRlAADgQiI4A2kic3RzAACgBCJyI2VhdGVyAACjbyJFRkdMU1T1CPoIAgkJCQ0JFQlxInVhbAAAoHEidSRsbEVxdWFsAADgZyI4A3IjZWF0ZXIAAOBrIjgD5SFzcwCgeSLsJGFudEVxdWFsAOB+KjgDaSJsZGUAAKB1IvUhbXBEASAJJwnvI3duSHVtcADgTiI4A3EidWFsAADgTyI4A2UAAAFmczEJRgn0JFRyaWFuZ2xlQqLqIj0JAAAAAEIJYQByAADgzyk4A3EidWFsAACg7CJzAICibiJFR0xTVABRCVYJXAlhCWkJcSJ1YWwAAKBwInIjZWF0ZXIAAKB4IuUhc3MA4GoiOAPsJGFudEVxdWFsAOB9KjgDaSJsZGUAAKB0IuUic3RlZAABR0x1CX8J8iZlYXRlckdyZWF0ZXIA4KIqOAPlI3NzTGVzcwDgoSo4A/IjZWNlZGVzAKGAIkVTjwmVCXEidWFsAADgryo4A+wkYW50RXF1YWwAoOAiAAFlaaAJqQl2JmVyc2VFbGVtZW50AACgDCLnJWh0VHJpYW5nbGVCousitgkAAAAAuwlhAHIAAODQKTgDcSJ1YWwAAKDtIgABcXXDCeAJdSNhcmVTdQAAAWJwywnVCfMhZXRF4I8iOANxInVhbAAAoOIi5SJyc2V0ReCQIjgDcSJ1YWwAAKDjIoABYmNwAOYJ8AkNCvMhZXRF4IIi0iBxInVhbAAAoIgi4yJlZWRzgKGBIkVTVAD6CQAKBwpxInVhbAAA4LAqOAPsJGFudEVxdWFsAKDhImkibGRlAADgfyI4A+UicnNldEXggyLSIHEidWFsAACgiSJpImxkZQCAoUEiRUZUACIKJwouCnEidWFsAACgRCJ1JGxsRXF1YWwAAKBHImkibGRlAACgSSJlJXJ0aWNhbEJhcgAAoCQiYwByAADgNdip3GkAbABkAGUAO4DRANFAnWMAB0VhY2RmZ21vcHJzdHV2XgphCmgKcgp2CnoKgQqRCpYKqwqtCrsKyArNCuwhaWdSYWMAdQB0AGUAO4DTANNAAAFpeWwKcQpyAGMAO4DUANRAHmRiImxhYwBQYXIAAOA12BLdcgBhAHYAZQA7gNIA0kCAAWFlaQCHCooKjQpjAHIATGFnAGEAqWNjInJvbgCfY3AAZgAA4DXYRt3lI25DdXJseQABRFGeCqYKbyV1YmxlUXVvdGUAAKAcIHUib3RlAACgGCAAoFQqAAFjbLEKtQpyAADgNdiq3GEAcwBoADuA2ADYQGkAbAHACsUKZABlADuA1QDVQGUAcwAAoDcqbQBsADuA1gDWQGUAcgAAAUJQ0wrmCgABYXLXCtoKcgAAoD4gYQBjAAABZWvgCuIKAKDeI2UAdAAAoLQjYSVyZW50aGVzaXMAAKDcI4AEYWNmaGlsb3JzAP0KAwsFCwkLCwsMCxELIwtaC3IjdGlhbEQAAKACInkAH2RyAADgNdgT3WkApmOgY/Ujc01pbnVzsWAAAWlwFQsgC24AYwBhAHIAZQBwAGwAYQBuAOUACgVmAACgGSGAobsqZWlvACoLRQtJC+MiZWRlc4CheiJFU1QANAs5C0ALcSJ1YWwAAKCvKuwkYW50RXF1YWwAoHwiaSJsZGUAAKB+Im0AZQAAoDMgAAFkcE0LUQv1IWN0AKAPIm8jcnRpb24AYaA3ImwAAKAdIgABY2leC2ILcgAA4DXYq9yoYwACVWZvc2oLbwtzC3cLTwBUADuAIgAiQHIAAOA12BTdcABmAACgGiFjAHIAAOA12KzcAAZCRWFjZWZoaW9yc3WPC5MLlwupC7YL2AvbC90LhQyTDJoMowzhIXJyAKAQKUcAO4CuAK5AgAFjbnIAnQugC6ML9SF0ZVRhZwAAoOsncgB0oKAhbAAAoBYpgAFhZXkArwuyC7UL8iFvblhh5CFpbFZhIGR2oBwhZSJyc2UAAAFFVb8LzwsAAWxxwwvIC+UibWVudACgCyL1JGlsaWJyaXVtAKDLIXAmRXF1aWxpYnJpdW0AAKBvKXIAAKAcIW8AoWPnIWh0AARBQ0RGVFVWYewLCgwQDDIMNwxeDHwM9gIAAW5y8Av4C2clbGVCcmFja2V0AACg6SfyIW93AKGSIUJM/wsDDGEAcgAAoOUhZSRmdEFycm93AACgxCFlI2lsaW5nAACgCSNvAPUBFgwAAB4MYiVsZUJyYWNrZXQAAKDnJ24A1AEjDAAAKgxlJGVWZWN0b3IAAKBdKeUiY3RvckKgwiFhAHIAAKBVKWwib29yAACgCyMAAWVyOwxLDGUAAKGiIkFWQQxGDHIicm93AACgpiHlImN0b3IAoFspaSNhbmdsZQBCorMiVgwAAAAAWgxhAHIAAKDQKXEidWFsAACgtSJwAIABRFRWAGUMbAxzDO8kd25WZWN0b3IAoE8pZSRlVmVjdG9yAACgXCnlImN0b3JCoL4hYQByAACgVCnlImN0b3JCoMAhYQByAACgUykAAXB1iQyMDGYAAKAdIe4kZEltcGxpZXMAoHAp6SRnaHRhcnJvdwCg2yEAAWNongyhDHIAAKAbIQCgsSHsJGVEZWxheWVkAKD0KYAGSE9hY2ZoaW1vcXN0dQC/DMgMzAzQDOIM5gwKDQ0NFA0ZDU8NVA1YDQABQ2PDDMYMyCFjeSlkeQAoZEYiVGN5ACxkYyJ1dGUAWmEAorwqYWVpedgM2wzeDOEM8iFvbmBh5CFpbF5hcgBjAFxhIWRyAADgNdgW3e8hcnQAAkRMUlXvDPYM/QwEDW8kd25BcnJvdwAAoJMhZSRmdEFycm93AACgkCHpJGdodEFycm93AKCSIXAjQXJyb3cAAKCRIechbWGjY+EkbGxDaXJjbGUAoBgicABmAADgNdhK3XICHw0AAAAAIg10AACgGiLhIXJlgKGhJUlTVQAqDTINSg3uJXRlcnNlY3Rpb24AoJMidQAAAWJwNw1ADfMhZXRFoI8icSJ1YWwAAKCRIuUicnNldEWgkCJxInVhbAAAoJIibiJpb24AAKCUImMAcgAA4DXYrtxhAHIAAKDGIgACYmNtcF8Nag2ODZANc6DQImUAdABFoNAicSJ1YWwAAKCGIgABY2huDYkNZSJlZHMAgKF7IkVTVAB4DX0NhA1xInVhbAAAoLAq7CRhbnRFcXVhbACgfSJpImxkZQAAoH8iVABoAGEA9ADHCwCgESIAodEiZXOVDZ8NciJzZXQARaCDInEidWFsAACghyJlAHQAAKDRIoAFSFJTYWNmaGlvcnMAtQ27Db8NyA3ODdsN3w3+DRgOHQ4jDk8AUgBOADuA3gDeQMEhREUAoCIhAAFIY8MNxg1jAHkAC2R5ACZkAAFidcwNzQ0JYKRjgAFhZXkA1A3XDdoN8iFvbmRh5CFpbGJhImRyAADgNdgX3QABZWnjDe4N8gHoDQAA7Q3lImZvcmUAoDQiYQCYYwABY27yDfkNayNTcGFjZQAA4F8gCiDTInBhY2UAoAkg7CFkZYChPCJFRlQABw4MDhMOcSJ1YWwAAKBDInUkbGxFcXVhbAAAoEUiaSJsZGUAAKBIInAAZgAA4DXYS93pI3BsZURvdACg2yAAAWN0Jw4rDnIAAOA12K/c8iFva2Zh4QpFDlYOYA5qDgAAbg5yDgAAAAAAAAAAAAB5DnwOqA6zDgAADg8RDxYPGg8AAWNySA5ODnUAdABlADuA2gDaQHIAb6CfIeMhaXIAoEkpcgDjAVsOAABdDnkADmR2AGUAbGEAAWl5Yw5oDnIAYwA7gNsA20AjZGIibGFjAHBhcgAA4DXYGN1yAGEAdgBlADuA2QDZQOEhY3JqYQABZGl/Dp8OZQByAAABQlCFDpcOAAFhcokOiw5yAF9gYQBjAAABZWuRDpMOAKDfI2UAdAAAoLUjYSVyZW50aGVzaXMAAKDdI28AbgBQoMMi7CF1cwCgjiIAAWdwqw6uDm8AbgByYWYAAOA12EzdAARBREVUYWRwc78O0g7ZDuEOBQPqDvMOBw9yInJvdwDCoZEhyA4AAMwOYQByAACgEilvJHduQXJyb3cAAKDFIW8kd25BcnJvdwAAoJUhcSV1aWxpYnJpdW0AAKBuKWUAZQBBoKUiciJyb3cAAKClIW8AdwBuAGEAcgByAG8A9wAQA2UAcgAAAUxS+Q4AD2UkZnRBcnJvdwAAoJYh6SRnaHRBcnJvdwCglyFpAGyg0gNvAG4ApWPpIW5nbmFjAHIAAOA12LDcaSJsZGUAaGFtAGwAO4DcANxAgAREYmNkZWZvc3YALQ8xDzUPNw89D3IPdg97D4AP4SFzaACgqyJhAHIAAKDrKnkAEmThIXNobKCpIgCg5ioAAWVyQQ9DDwCgwSKAAWJ0eQBJD00Paw9hAHIAAKAWIGmgFiDjIWFsAAJCTFNUWA9cD18PZg9hAHIAAKAjIukhbmV8YGUkcGFyYXRvcgAAoFgnaSJsZGUAAKBAItQkaGluU3BhY2UAoAogcgAA4DXYGd1wAGYAAOA12E3dYwByAADgNdix3GQiYXNoAACgqiKAAmNlZm9zAI4PkQ+VD5kPng/pIXJjdGHkIWdlAKDAInIAAOA12BrdcABmAADgNdhO3WMAcgAA4DXYstwAAmZpb3OqD64Prw+0D3IAAOA12BvdnmNwAGYAAOA12E/dYwByAADgNdiz3IAEQUlVYWNmb3N1AMgPyw/OD9EP2A/gD+QP6Q/uD2MAeQAvZGMAeQAHZGMAeQAuZGMAdQB0AGUAO4DdAN1AAAFpedwP3w9yAGMAdmErZHIAAOA12BzdcABmAADgNdhQ3WMAcgAA4DXYtNxtAGwAeGEABEhhY2RlZm9z/g8BEAUQDRAQEB0QIBAkEGMAeQAWZGMidXRlAHlhAAFheQkQDBDyIW9ufWEXZG8AdAB7YfIBFRAAABwQbwBXAGkAZAB0AOgAVAhhAJZjcgAAoCghcABmAACgJCFjAHIAAOA12LXc4QtCEEkQTRAAAGcQbRByEAAAAAAAAAAAeRCKEJcQ8hD9EAAAGxEhETIROREAAD4RYwB1AHQAZQA7gOEA4UByImV2ZQADYYCiPiJFZGl1eQBWEFkQWxBgEGUQAOA+IjMDAKA/InIAYwA7gOIA4kB0AGUAO4C0ALRAMGRsAGkAZwA7gOYA5kByoGEgAOA12B7dcgBhAHYAZQA7gOAA4EAAAWVwfBCGEAABZnCAEIQQ8yF5bQCgNSHoAIMQaABhALFjAAFhcI0QWwAAAWNskRCTEHIAAWFnAACgPypkApwQAAAAALEQAKInImFkc3ajEKcQqRCuEG4AZAAAoFUqAKBcKmwib3BlAACgWCoAoFoqAKMgImVsbXJzersQvRDAEN0Q5RDtEACgpCllAACgICJzAGQAYaAhImEEzhDQENIQ1BDWENgQ2hDcEACgqCkAoKkpAKCqKQCgqykAoKwpAKCtKQCgrikAoK8pdAB2oB8iYgBkoL4iAKCdKQABcHTpEOwQaAAAoCIixWDhIXJyAKB8IwABZ3D1EPgQbwBuAAVhZgAA4DXYUt0Ao0giRWFlaW9wBxEJEQ0RDxESERQRAKBwKuMhaXIAoG8qAKBKImQAAKBLInMAJ2DyIW94ZaBIIvEADhFpAG4AZwA7gOUA5UCAAWN0eQAmESoRKxFyAADgNdi23CpgbQBwAGWgSCLxAPgBaQBsAGQAZQA7gOMA40BtAGwAO4DkAORAAAFjaUERRxFvAG4AaQBuAPQA6AFuAHQAAKARKgAITmFiY2RlZmlrbG5vcHJzdWQRaBGXEZ8RpxGrEdIR1hErEjASexKKEn0RThNbE3oTbwB0AACg7SoAAWNybBGJEWsAAAJjZXBzdBF4EX0RghHvIW5nAKBMInAjc2lsb24A9mNyImltZQAAoDUgaQBtAGWgPSJxAACgzSJ2AY0RkRFlAGUAAKC9ImUAZABnoAUjZQAAoAUjcgBrAHSgtSPiIXJrAKC2IwABb3mjEaYRbgDnAHcRMWTxIXVvAKAeIIACY21wcnQAtBG5Eb4RwRHFEeEhdXPloDUi5ABwInR5dgAAoLApcwDpAH0RbgBvAPUA6gCAAWFodwDLEcwRzhGyYwCgNiHlIWVuAKBsInIAAOA12B/dZwCAA2Nvc3R1dncA4xHyEQUSEhIhEiYSKRKAAWFpdQDpEesR7xHwAKMFcgBjAACg7yVwAACgwyKAAWRwdAD4EfwRABJvAHQAAKAAKuwhdXMAoAEqaSJtZXMAAKACKnECCxIAAAAADxLjIXVwAKAGKmEAcgAAoAUm8iNpYW5nbGUAAWR1GhIeEu8hd24AoL0lcAAAoLMlcCJsdXMAAKAEKmUA5QBCD+UAkg9hInJvdwAAoA0pgAFha28ANhJoEncSAAFjbjoSZRJrAIABbHN0AEESRxJNEm8jemVuZ2UAAKDrKXEAdQBhAHIA5QBcBPIjaWFuZ2xlgKG0JWRscgBYElwSYBLvIXduAKC+JeUhZnQAoMIlaSJnaHQAAKC4JWsAAKAjJLEBbRIAAHUSsgFxEgAAcxIAoJIlAKCRJTQAAKCTJWMAawAAoIglAAFlb38ShxJx4D0A5SD1IWl2AOBhIuUgdAAAoBAjAAJwdHd4kRKVEpsSnxJmAADgNdhT3XSgpSJvAG0AAKClIvQhaWUAoMgiAAZESFVWYmRobXB0dXayEsES0RLgEvcS+xIKExoTHxMjEygTNxMAAkxSbHK5ErsSvRK/EgCgVyUAoFQlAKBWJQCgUyUAolAlRFVkdckSyxLNEs8SAKBmJQCgaSUAoGQlAKBnJQACTFJsctgS2hLcEt4SAKBdJQCgWiUAoFwlAKBZJQCjUSVITFJobHLrEu0S7xLxEvMS9RIAoGwlAKBjJQCgYCUAoGslAKBiJQCgXyVvAHgAAKDJKQACTFJscgITBBMGEwgTAKBVJQCgUiUAoBAlAKAMJQCiACVEVWR1EhMUExYTGBMAoGUlAKBoJQCgLCUAoDQlaSJudXMAAKCfIuwhdXMAoJ4iaSJtZXMAAKCgIgACTFJsci8TMRMzEzUTAKBbJQCgWCUAoBglAKAUJQCjAiVITFJobHJCE0QTRhNIE0oTTBMAoGolAKBhJQCgXiUAoDwlAKAkJQCgHCUAAWV2UhNVE3YA5QD5AGIAYQByADuApgCmQAACY2Vpb2ITZhNqE24TcgAA4DXYt9xtAGkAAKBPIG0A5aA9IogRbAAAoVwAYmh0E3YTAKDFKfMhdWIAoMgnbAF+E4QTbABloCIgdAAAoCIgcAAAoU4iRWWJE4sTAKCuKvGgTyI8BeEMqRMAAN8TABQDFB8UAAAjFDQUAAAAAIUUAAAAAI0UAAAAANcU4xT3FPsUAACIFQAAlhWAAWNwcgCuE7ET1RP1IXRlB2GAoikiYWJjZHMAuxO/E8QTzhPSE24AZAAAoEQqciJjdXAAAKBJKgABYXXIE8sTcAAAoEsqcAAAoEcqbwB0AACgQCoA4CkiAP4AAWVv2RPcE3QAAKBBIO4ABAUAAmFlaXXlE+8T9RP4E/AB6hMAAO0TcwAAoE0qbwBuAA1hZABpAGwAO4DnAOdAcgBjAAlhcABzAHOgTCptAACgUCpvAHQAC2GAAWRtbgAIFA0UEhRpAGwAO4C4ALhAcCJ0eXYAAKCyKXQAAIGiADtlGBQZFKJAcgBkAG8A9ABiAXIAAOA12CDdgAFjZWkAKBQqFDIUeQBHZGMAawBtoBMn4SFyawCgEyfHY3IAAKPLJUVjZWZtcz8UQRRHFHcUfBSAFACgwykAocYCZWxGFEkUcQAAoFciZQBhAlAUAAAAAGAUciJyb3cAAAFsclYUWhTlIWZ0AKC6IWkiZ2h0AACguyGAAlJTYWNkAGgUaRRrFG8UcxSuYACgyCRzAHQAAKCbIukhcmMAoJoi4SFzaACgnSJuImludAAAoBAqaQBkAACg7yrjIWlyAKDCKfUhYnN1oGMmaQB0AACgYybsApMUmhS2FAAAwxRvAG4AZaA6APGgVCKrAG0CnxQAAAAAoxRhAHSgLABAYAChASJmbKcUqRTuABMNZQAAAW14rhSyFOUhbnQAoAEiZQDzANIB5wG6FAAAwBRkoEUibwB0AACgbSpuAPQAzAGAAWZyeQDIFMsUzhQA4DXYVN1vAOQA1wEAgakAO3MeAdMUcgAAoBchAAFhb9oU3hRyAHIAAKC1IXMAcwAAoBcnAAFjdeYU6hRyAADgNdi43AABYnDuFPIUZaDPKgCg0SploNAqAKDSKuQhb3QAoO8igANkZWxwcnZ3AAYVEBUbFSEVRBVlFYQV4SFycgABbHIMFQ4VAKA4KQCgNSlwAhYVAAAAABkVcgAAoN4iYwAAoN8i4SFycnCgtiEAoD0pgKIqImJjZG9zACsVMBU6FT4VQRVyImNhcAAAoEgqAAFhdTQVNxVwAACgRipwAACgSipvAHQAAKCNInIAAKBFKgDgKiIA/gACYWxydksVURVuFXMVcgByAG2gtyEAoDwpeQCAAWV2dwBYFWUVaRVxAHACXxUAAAAAYxVyAGUA4wAXFXUA4wAZFWUAZQAAoM4iZSJkZ2UAAKDPImUAbgA7gKQApEBlI2Fycm93AAABbHJ7FX8V5SFmdACgtiFpImdodAAAoLchZQDkAG0VAAFjaYsVkRVvAG4AaQBuAPQAkwFuAHQAAKAxImwiY3R5AACgLSOACUFIYWJjZGVmaGlqbG9yc3R1d3oAuBW7Fb8V1RXgFegV+RUKFhUWHxZUFlcWZRbFFtsW7xb7FgUXChdyAPIAtAJhAHIAAKBlKQACZ2xyc8YVyhXOFdAV5yFlcgCgICDlIXRoAKA4IfIA9QxoAHagECAAoKMiawHZFd4VYSJyb3cAAKAPKWEA4wBfAgABYXnkFecV8iFvbg9hNGQAoUYhYW/tFfQVAAFnciEC8RVyAACgyiF0InNlcQAAoHcqgAFnbG0A/xUCFgUWO4CwALBAdABhALRjcCJ0eXYAAKCxKQABaXIOFhIW8yFodACgfykA4DXYId1hAHIAAAFschsWHRYAoMMhAKDCIYACYWVnc3YAKBauAjYWOhY+Fm0AAKHEIm9zLhY0Fm4AZABzoMQi9SFpdACgZiZhIm1tYQDdY2kAbgAAoPIiAKH3AGlvQxZRFmQAZQAAgfcAO29KFksW90BuI3RpbWVzAACgxyJuAPgAUBZjAHkAUmRjAG8CXhYAAAAAYhZyAG4AAKAeI28AcAAAoA0jgAJscHR1dwBuFnEWdRaSFp4W7CFhciRgZgAA4DXYVd0AotkCZW1wc30WhBaJFo0WcQBkoFAibwB0AACgUSJpIm51cwAAoDgi7CF1cwCgFCLxInVhcmUAoKEiYgBsAGUAYgBhAHIAdwBlAGQAZwDlANcAbgCAAWFkaAClFqoWtBZyAHIAbwD3APUMbwB3AG4AYQByAHIAbwB3APMA8xVhI3Jwb29uAAABbHK8FsAWZQBmAPQAHBZpAGcAaAD0AB4WYgHJFs8WawBhAHIAbwD3AJILbwLUFgAAAADYFnIAbgAAoB8jbwBwAACgDCOAAWNvdADhFukW7BYAAXJ55RboFgDgNdi53FVkbAAAoPYp8iFvaxFhAAFkcvMW9xZvAHQAAKDxImkA5qC/JVsSAAFhaP8WAhdyAPIANQNhAPIA1wvhIm5nbGUAoKYpAAFjaQ4XEBd5AF9k5yJyYXJyAKD/JwAJRGFjZGVmZ2xtbm9wcXJzdHV4MRc4F0YXWxcyBF4XaRd5F40XrBe0F78X2RcVGCEYLRg1GEAYAAFEbzUXgRZvAPQA+BUAAWNzPBdCF3UAdABlADuA6QDpQPQhZXIAoG4qAAJhaW95TRdQF1YXWhfyIW9uG2FyAGOgViI7gOoA6kDsIW9uAKBVIk1kbwB0ABdhAAFEcmIXZhdvAHQAAKBSIgDgNdgi3XKhmipuF3QXYQB2AGUAO4DoAOhAZKCWKm8AdAAAoJgqgKGZKmlscwCAF4UXhxfuInRlcnMAoOcjAKATIWSglSpvAHQAAKCXKoABYXBzAJMXlheiF2MAcgATYXQAeQBzogUinxcAAAAAoRdlAHQAAKAFInAAMaADIDMBqRerFwCgBCAAoAUgAAFnc7AXsRdLYXAAAKACIAABZ3C4F7sXbwBuABlhZgAA4DXYVt2AAWFscwDFF8sXzxdyAHOg1SJsAACg4yl1AHMAAKBxKmkAAKG1A2x21RfYF28AbgC1Y/VjAAJjc3V24BfoF/0XEBgAAWlv5BdWF3IAYwAAoFYiaQLuFwAAAADwF+0ADQThIW50AAFnbPUX+Rd0AHIAAKCWKuUhc3MAoJUqgAFhZWkAAxgGGAoYbABzAD1gcwB0AACgXyJ2AESgYSJEAACgeCrwImFyc2wAoOUpAAFEYRkYHRhvAHQAAKBTInIAcgAAoHEpgAFjZGkAJxgqGO0XcgAAoC8hbwD0AIwCAAFhaDEYMhi3YzuA8ADwQAABbXI5GD0YbAA7gOsA60BvAACgrCCAAWNpcABGGEgYSxhsACFgcwD0ACwEAAFlb08YVxhjAHQAYQB0AGkAbwDuABoEbgBlAG4AdABpAGEAbADlADME4Ql1GAAAgRgAAIMYiBgAAAAAoRilGAAAqhgAALsYvhjRGAAA1xgnGWwAbABpAG4AZwBkAG8AdABzAGUA8QBlF3kARGRtImFsZQAAoEAmgAFpbHIAjRiRGJ0Y7CFpZwCgA/tpApcYAAAAAJoYZwAAoAD7aQBnAACgBPsA4DXYI93sIWlnAKAB++whaWcA4GYAagCAAWFsdACvGLIYthh0AACgbSZpAGcAAKAC+24AcwAAoLElbwBmAJJh8AHCGAAAxhhmAADgNdhX3QABYWvJGMwYbADsAGsEdqDUIgCg2SphI3J0aW50AACgDSoAAWFv2hgiGQABY3PeGB8ZsQPnGP0YBRkSGRUZAAAdGbID7xjyGPQY9xj5GAAA+xg7gL0AvUAAoFMhO4C8ALxAAKBVIQCgWSEAoFshswEBGQAAAxkAoFQhAKBWIbQCCxkOGQAAAAAQGTuAvgC+QACgVyEAoFwhNQAAoFghtgEZGQAAGxkAoFohAKBdITgAAKBeIWwAAKBEIHcAbgAAoCIjYwByAADgNdi73IAIRWFiY2RlZmdpamxub3JzdHYARhlKGVoZXhlmGWkZkhmWGZkZnRmgGa0ZxhnLGc8Z4BkjGmygZyIAoIwqgAFjbXAAUBlTGVgZ9SF0ZfVhbQBhAOSgswM6FgCghipyImV2ZQAfYQABaXliGWUZcgBjAB1hM2RvAHQAIWGAoWUibHFzAMYEcBl6GfGhZSLOBAAAdhlsAGEAbgD0AN8EgKF+KmNkbACBGYQZjBljAACgqSpvAHQAb6CAKmyggioAoIQqZeDbIgD+cwAAoJQqcgAA4DXYJN3noGsirATtIWVsAKA3IWMAeQBTZIChdyJFYWoApxmpGasZAKCSKgCgpSoAoKQqAAJFYWVztBm2Gb0ZwhkAoGkicABwoIoq8iFveACgiipxoIgq8aCIKrUZaQBtAACg5yJwAGYAAOA12FjdYQB2AOUAYwIAAWNp0xnWGXIAAKAKIW0AAKFzImVs3BneGQCgjioAoJAqAIM+ADtjZGxxco0E6xn0GfgZ/BkBGgABY2nvGfEZAKCnKnIAAKB6Km8AdAAAoNci0CFhcgCglSl1ImVzdAAAoHwqgAJhZGVscwAKGvQZFhrVBCAa8AEPGgAAFBpwAHIAbwD4AFkZcgAAoHgpcQAAAWxxxAQbGmwAZQBzAPMASRlpAO0A5AQAAWVuJxouGnIjdG5lcXEAAOBpIgD+xQAsGgAFQWFiY2Vma29zeUAaQxpmGmoabRqDGocalhrCGtMacgDyAMwCAAJpbG1yShpOGlAaVBpyAHMA8ABxD2YAvWBpAGwA9AASBQABZHJYGlsaYwB5AEpkAKGUIWN3YBpkGmkAcgAAoEgpAKCtIWEAcgAAoA8h6SFyYyVhgAFhbHIAcxp7Gn8a8iF0c3WgZSZpAHQAAKBlJuwhaXAAoCYg4yFvbgCguSJyAADgNdgl3XMAAAFld4wakRphInJvdwAAoCUpYSJyb3cAAKAmKYACYW1vcHIAnxqjGqcauhq+GnIAcgAAoP8h9CFodACgOyJrAAABbHKsGrMaZSRmdGFycm93AACgqSHpJGdodGFycm93AKCqIWYAAOA12Fnd4iFhcgCgFSCAAWNsdADIGswa0BpyAADgNdi93GEAcwDoAGka8iFvaydhAAFicNca2xr1IWxsAKBDIOghZW4AoBAg4Qr2GgAA/RoAAAgbExsaGwAAIRs7GwAAAAA+G2IbmRuVG6sbAACyG80b0htjAHUAdABlADuA7QDtQAChYyBpeQEbBhtyAGMAO4DuAO5AOGQAAWN4CxsNG3kANWRjAGwAO4ChAKFAAAFmcssCFhsA4DXYJt1yAGEAdgBlADuA7ADsQIChSCFpbm8AJxsyGzYbAAFpbisbLxtuAHQAAKAMKnQAAKAtIuYhaW4AoNwpdABhAACgKSHsIWlnM2GAAWFvcABDG1sbXhuAAWNndABJG0sbWRtyACthgAFlbHAAcQVRG1UbaQBuAOUAyAVhAHIA9AByBWgAMWFmAACgtyJlAGQAtWEAoggiY2ZvdGkbbRt1G3kb4SFyZQCgBSFpAG4AdKAeImkAZQAAoN0pZABvAPQAWxsAoisiY2VscIEbhRuPG5QbYQBsAACguiIAAWdyiRuNG2UAcgDzACMQ4wCCG2EicmhrAACgFyryIW9kAKA8KgACY2dwdJ8boRukG6gbeQBRZG8AbgAvYWYAAOA12FrdYQC5Y3UAZQBzAHQAO4C/AL9AAAFjabUbuRtyAADgNdi+3G4AAKIIIkVkc3bCG8QbyBvQAwCg+SJvAHQAAKD1Inag9CIAoPMiaaBiIOwhZGUpYesB1hsAANkbYwB5AFZkbAA7gO8A70AAA2NmbW9zdeYb7hvyG/Ub+hsFHAABaXnqG+0bcgBjADVhOWRyAADgNdgn3eEhdGg3YnAAZgAA4DXYW93jAf8bAAADHHIAAOA12L/c8iFjeVhk6yFjeVRkAARhY2ZnaGpvcxUcGhwiHCYcKhwtHDAcNRzwIXBhdqC6A/BjAAFleR4cIRzkIWlsN2E6ZHIAAOA12CjdciJlZW4AOGFjAHkARWRjAHkAXGRwAGYAAOA12FzdYwByAADgNdjA3IALQUJFSGFiY2RlZmdoamxtbm9wcnN0dXYAXhxtHHEcdRx5HN8cBx0dHTwd3B3tHfEdAR4EHh0eLB5FHrwewx7hHgkfPR9LH4ABYXJ0AGQcZxxpHHIA8gBvB/IAxQLhIWlsAKAbKeEhcnIAoA4pZ6BmIgCgiyphAHIAAKBiKWMJjRwAAJAcAACVHAAAAAAAAAAAAACZHJwcAACmHKgcrRwAANIc9SF0ZTph7SJwdHl2AKC0KXIAYQDuAFoG4iFkYbtjZwAAoegnZGyhHKMcAKCRKeUAiwYAoIUqdQBvADuAqwCrQHIAgKOQIWJmaGxwc3QAuhy/HMIcxBzHHMoczhxmoOQhcwAAoB8pcwAAoB0p6wCyGnAAAKCrIWwAAKA5KWkAbQAAoHMpbAAAoKIhAKGrKmFl1hzaHGkAbAAAoBkpc6CtKgDgrSoA/oABYWJyAOUc6RztHHIAcgAAoAwpcgBrAACgcicAAWFr8Rz4HGMAAAFla/Yc9xx7YFtgAAFlc/wc/hwAoIspbAAAAWR1Ax0FHQCgjykAoI0pAAJhZXV5Dh0RHRodHB3yIW9uPmEAAWRpFR0YHWkAbAA8YewAowbiAPccO2QAAmNxcnMkHScdLB05HWEAAKA2KXUAbwDyoBwgqhEAAWR1MB00HeghYXIAoGcpcyJoYXIAAKBLKWgAAKCyIQCiZCJmZ3FzRB1FB5Qdnh10AIACYWhscnQATh1WHWUdbB2NHXIicm93AHSgkCFhAOkAzxxhI3Jwb29uAAABZHVeHWId7yF3bgCgvSFwAACgvCHlJGZ0YXJyb3dzAKDHIWkiZ2h0AIABYWhzAHUdex2DHXIicm93APOglCGdBmEAcgBwAG8AbwBuAPMAzgtxAHUAaQBnAGEAcgByAG8A9wBlGugkcmVldGltZXMAoMsi8aFkIk0HAACaHWwAYQBuAPQAXgcAon0qY2Rnc6YdqR2xHbcdYwAAoKgqbwB0AG+gfypyoIEqAKCDKmXg2iIA/nMAAKCTKoACYWRlZ3MAwB3GHcod1h3ZHXAAcAByAG8A+ACmHG8AdAAAoNYicQAAAWdxzx3SHXQA8gBGB2cAdADyAHQcdADyAFMHaQDtAGMHgAFpbHIA4h3mHeod8yFodACgfClvAG8A8gDKBgDgNdgp3UWgdiIAoJEqYQH1Hf4dcgAAAWR1YB35HWygvCEAoGopbABrAACghCVjAHkAWWQAomoiYWNodAweDx4VHhkecgDyAGsdbwByAG4AZQDyAGAW4SFyZACgaylyAGkAAKD6JQABaW8hHiQe5CFvdEBh9SFzdGGgsCPjIWhlAKCwIwACRWFlczMeNR48HkEeAKBoInAAcKCJKvIhb3gAoIkqcaCHKvGghyo0HmkAbQAAoOYiAARhYm5vcHR3elIeXB5fHoUelh6mHqsetB4AAW5yVh5ZHmcAAKDsJ3IAAKD9IXIA6wCwBmcAgAFsbXIAZh52Hnse5SFmdAABYXKIB2weaQBnAGgAdABhAHIAcgBvAPcAkwfhInBzdG8AoPwnaQBnAGgAdABhAHIAcgBvAPcAmgdwI2Fycm93AAABbHKNHpEeZQBmAPQAxhxpImdodAAAoKwhgAFhZmwAnB6fHqIecgAAoIUpAOA12F3ddQBzAACgLSppIm1lcwAAoDQqYQGvHrMecwB0AACgFyLhAIoOZaHKJbkeRhLuIWdlAKDKJWEAcgBsoCgAdAAAoJMpgAJhY2htdADMHs8e1R7bHt0ecgDyAJ0GbwByAG4AZQDyANYWYQByAGSgyyEAoG0pAKAOIHIAaQAAoL8iAANhY2hpcXTrHu8e1QfzHv0eBh/xIXVvAKA5IHIAAOA12MHcbQDloXIi+h4AAPweAKCNKgCgjyoAAWJ19xwBH28AcqAYIACgGiDyIW9rQmEAhDwAO2NkaGlscXJCBhcfxh0gHyQfKB8sHzEfAAFjaRsfHR8AoKYqcgAAoHkqcgBlAOUAkx3tIWVzAKDJIuEhcnIAoHYpdSJlc3QAAKB7KgABUGk1HzkfYQByAACglillocMlAgdfEnIAAAFkdUIfRx9zImhhcgAAoEop6CFhcgCgZikAAWVuTx9WH3IjdG5lcXEAAOBoIgD+xQBUHwAHRGFjZGVmaGlsbm9wc3VuH3Ifoh+rH68ftx+7H74f5h/uH/MfBwj/HwsgxCFvdACgOiIAAmNscHJ5H30fiR+eH3IAO4CvAK9AAAFldIEfgx8AoEImZaAgJ3MAZQAAoCAnc6CmIXQAbwCAoaYhZGx1AJQfmB+cH28AdwDuAHkDZQBmAPQA6gbwAOkO6yFlcgCgriUAAW95ph+qH+0hbWEAoCkqPGThIXNoAKAUIOElc3VyZWRhbmdsZQCgISJyAADgNdgq3W8AAKAnIYABY2RuAMQfyR/bH3IAbwA7gLUAtUBhoiMi0B8AANMf1x9zAPQAKxFpAHIAAKDwKm8AdAA7gLcAt0B1AHMA4qESIh4TAADjH3WgOCIAoCoqYwHqH+0fcAAAoNsq8gB+GnAAbAB1APMACAgAAWRw9x/7H+UhbHMAoKciZgAA4DXYXt0AAWN0AyAHIHIAAOA12MLc8CFvcwCgPiJsobwDECAVIPQiaW1hcACguCJhAPAAEyAADEdMUlZhYmNkZWZnaGlqbG1vcHJzdHV2dzwgRyBmIG0geSCqILgg2iDeIBEhFSEyIUMhTSFQIZwhnyHSIQAiIyKLIrEivyIUIwABZ3RAIEMgAODZIjgD9uBrItIgBwmAAWVsdABNIF8gYiBmAHQAAAFhclMgWCByInJvdwAAoM0h6SRnaHRhcnJvdwCgziEA4NgiOAP24Goi0iBfCekkZ2h0YXJyb3cAoM8hAAFEZHEgdSDhIXNoAKCvIuEhc2gAoK4igAJiY25wdACCIIYgiSCNIKIgbABhAACgByL1IXRlRGFnAADgICLSIACiSSJFaW9wlSCYIJwgniAA4HAqOANkAADgSyI4A3MASWFyAG8A+AAyCnUAcgBhoG4mbADzoG4mmwjzAa8gAACzIHAAO4CgAKBAbQBwAOXgTiI4AyoJgAJhZW91eQDBIMogzSDWINkg8AHGIAAAyCAAoEMqbwBuAEhh5CFpbEZhbgBnAGSgRyJvAHQAAOBtKjgDcAAAoEIqPWThIXNoAKATIACjYCJBYWRxc3jpIO0g+SD+IAIhDCFyAHIAAKDXIXIAAAFocvIg9SBrAACgJClvoJch9wAGD28AdAAA4FAiOAN1AGkA9gC7CAABZWkGIQohYQByAACgKCntAN8I6SFzdPOgBCLlCHIAAOA12CvdAAJFZXN0/wgcISshLiHxoXEiIiEAABMJ8aFxIgAJAAAnIWwAYQBuAPQAEwlpAO0AGQlyoG8iAKBvIoABQWFwADghOyE/IXIA8gBeIHIAcgAAoK4hYQByAACg8ipzogsiSiEAAAAAxwtkoPwiAKD6ImMAeQBaZIADQUVhZGVzdABcIV8hYiFmIWkhkyGWIXIA8gBXIADgZiI4A3IAcgAAoJohcgAAoCUggKFwImZxcwBwIYQhjiF0AAABYXJ1IXohcgByAG8A9wBlIWkAZwBoAHQAYQByAHIAbwD3AD4h8aFwImAhAACKIWwAYQBuAPQAZwlz4H0qOAMAoG4iaQDtAG0JcqBuImkA5aDqIkUJaQDkADoKAAFwdKMhpyFmAADgNdhf3YCBrAA7aW4AriGvIcchrEBuAIChCSJFZHYAtyG6Ib8hAOD5IjgDbwB0AADg9SI4A+EB1gjEIcYhAKD3IgCg9iJpAHagDCLhAagJzyHRIQCg/iIAoP0igAFhb3IA2CHsIfEhcgCAoSYiYXN0AOAh5SHpIWwAbABlAOwAywhsAADg/SrlIADgAiI4A2wiaW50AACgFCrjoYAi9yEAAPohdQDlAJsJY+CvKjgDZaCAIvEAkwkAAkFhaXQHIgoiFyIeInIA8gBsIHIAcgAAoZshY3cRIhQiAOAzKTgDAOCdITgDZyRodGFycm93AACgmyFyAGkA5aDrIr4JgANjaGltcHF1AC8iPCJHIpwhTSJQIloigKGBImNlcgA2Iv0JOSJ1AOUABgoA4DXYw9zvIXJ0bQKdIQAAAABEImEAcgDhAOEhbQBloEEi8aBEIiYKYQDyAMsIcwB1AAABYnBWIlgi5QDUCeUA3wmAAWJjcABgInMieCKAoYQiRWVzAGci7glqIgDgxSo4A2UAdABl4IIi0iBxAPGgiCJoImMAZaCBIvEA/gmAoYUiRWVzAH8iFgqCIgDgxio4A2UAdABl4IMi0iBxAPGgiSKAIgACZ2lscpIilCKaIpwi7AAMCWwAZABlADuA8QDxQOcAWwlpI2FuZ2xlAAABbHKkIqoi5SFmdGWg6iLxAEUJaSJnaHQAZaDrIvEAvgltoL0DAKEjAGVzuCK8InIAbwAAoBYhcAAAoAcggARESGFkZ2lscnMAziLSItYi2iLeIugi7SICIw8j4SFzaACgrSLhIXJyAKAEKXAAAOBNItIg4SFzaACgrCIAAWV04iLlIgDgZSLSIADgPgDSIG4iZmluAACg3imAAUFldADzIvci+iJyAHIAAKACKQDgZCLSIHLgPADSIGkAZQAA4LQi0iAAAUF0BiMKI3IAcgAAoAMp8iFpZQDgtSLSIGkAbQAA4Dwi0iCAAUFhbgAaIx4jKiNyAHIAAKDWIXIAAAFociMjJiNrAACgIylvoJYh9wD/DuUhYXIAoCcpUxJqFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVCMAAF4jaSN/I4IjjSOeI8AUAAAAAKYjwCMAANoj3yMAAO8jHiQvJD8kRCQAAWNzVyNsFHUAdABlADuA8wDzQAABaXlhI2cjcgBjoJoiO4D0APRAPmSAAmFiaW9zAHEjdCN3I3EBeiNzAOgAdhTsIWFjUWF2AACgOCrvIWxkAKC8KewhaWdTYQABY3KFI4kjaQByAACgvykA4DXYLN1vA5QjAAAAAJYjAACcI24A22JhAHYAZQA7gPIA8kAAoMEpAAFibaEjjAphAHIAAKC1KQACYWNpdKwjryO6I70jcgDyAFkUAAFpcrMjtiNyAACgvinvIXNzAKC7KW4A5QDZCgCgwCmAAWFlaQDFI8gjyyNjAHIATWFnAGEAyWOAAWNkbgDRI9Qj1iPyIW9uv2MAoLYpdQDzAHgBcABmAADgNdhg3YABYWVsAOQj5yPrI3IAAKC3KXIAcAAAoLkpdQDzAHwBAKMoImFkaW9zdvkj/CMPJBMkFiQbJHIA8gBeFIChXSplZm0AAyQJJAwkcgBvoDQhZgAAoDQhO4CqAKpAO4C6ALpA5yFvZgCgtiJyAACgVipsIm9wZQAAoFcqAKBbKoABY2xvACMkJSQrJPIACCRhAHMAaAA7gPgA+EBsAACgmCJpAGwBMyQ4JGQAZQA7gPUA9UBlAHMAYaCXInMAAKA2Km0AbAA7gPYA9kDiIWFyAKA9I+EKXiQAAHokAAB8JJQkAACYJKkkAAAAALUkEQsAAPAkAAAAAAQleiUAAIMlcgCAoSUiYXN0AGUkbyQBCwCBtgA7bGokayS2QGwAZQDsABgDaQJ1JAAAAAB4JG0AAKDzKgCg/Sp5AD9kcgCAAmNpbXB0AIUkiCSLJJkSjyRuAHQAJWBvAGQALmBpAGwAAKAwIOUhbmsAoDEgcgAA4DXYLd2AAWltbwCdJKAkpCR2oMYD1WNtAGEA9AD+B24AZQAAoA4m9KHAA64kAAC0JGMjaGZvcmsAAKDUItZjAAFhdbgkxCRuAAABY2u9JMIkawBooA8hAKAOIfYAaRpzAACkKwBhYmNkZW1zdNMkIRPXJNsk4STjJOck6yTjIWlyAKAjKmkAcgAAoCIqAAFvdYsW3yQAoCUqAKByKm4AO4CxALFAaQBtAACgJip3AG8AAKAnKoABaXB1APUk+iT+JO4idGludACgFSpmAADgNdhh3W4AZAA7gKMAo0CApHoiRWFjZWlub3N1ABMlFSUYJRslTCVRJVklSSV1JQCgsypwAACgtyp1AOUAPwtjoK8qgKJ6ImFjZW5zACclLSU0JTYlSSVwAHAAcgBvAPgAFyV1AHIAbAB5AGUA8QA/C/EAOAuAAWFlcwA8JUElRSXwInByb3gAoLkqcQBxAACgtSppAG0AAKDoImkA7QBEC20AZQDzoDIgIguAAUVhcwBDJVclRSXwAEAlgAFkZnAATwtfJXElgAFhbHMAZSVpJW0l7CFhcgCgLiPpIW5lAKASI/UhcmYAoBMjdKAdIu8AWQvyIWVsAKCwIgABY2l9JYElcgAA4DXYxdzIY24iY3NwAACgCCAAA2Zpb3BzdZElKxuVJZolnyWkJXIAAOA12C7dcABmAADgNdhi3XIiaW1lAACgVyBjAHIAAOA12MbcgAFhZW8AqiW6JcAldAAAAWVpryW2JXIAbgBpAG8AbgDzABkFbgB0AACgFipzAHQAZaA/APEACRj0AG0LgApBQkhhYmNkZWZoaWxtbm9wcnN0dXgA4yXyJfYl+iVpJpAmpia9JtUm5ib4JlonaCdxJ3UnnietJ7EnyCfiJ+cngAFhcnQA6SXsJe4lcgDyAJkM8gD6AuEhaWwAoBwpYQByAPIA3BVhAHIAAKBkKYADY2RlbnFydAAGJhAmEyYYJiYmKyZaJgABZXUKJg0mAOA9IjEDdABlAFVhaQDjACAN7SJwdHl2AKCzKWcAgKHpJ2RlbAAgJiImJCYAoJIpAKClKeUA9wt1AG8AO4C7ALtAcgAApZIhYWJjZmhscHN0dz0mQCZFJkcmSiZMJk4mUSZVJlgmcAAAoHUpZqDlIXMAAKAgKQCgMylzAACgHinrALka8ACVHmwAAKBFKWkAbQAAoHQpbAAAoKMhAKCdIQABYWleJmImaQBsAACgGilvAG6gNiJhAGwA8wB2C4ABYWJyAG8mciZ2JnIA8gAvEnIAawAAoHMnAAFha3omgSZjAAABZWt/JoAmfWBdYAABZXOFJocmAKCMKWwAAAFkdYwmjiYAoI4pAKCQKQACYWV1eZcmmiajJqUm8iFvbllhAAFkaZ4moSZpAGwAV2HsAA8M4gCAJkBkAAJjbHFzrSawJrUmuiZhAACgNylkImhhcgAAoGkpdQBvAPKgHSCjAWgAAKCzIYABYWNnAMMm0iaUC2wAgKEcIWlwcwDLJs4migxuAOUAoAxhAHIA9ADaC3QAAKCtJYABaWxyANsm3ybjJvMhaHQAoH0pbwBvAPIANgwA4DXYL90AAWFv6ib1JnIAAAFkde8m8SYAoMEhbKDAIQCgbCl2oMED8WOAAWducwD+Jk4nUCdoAHQAAANhaGxyc3QKJxInISc1Jz0nRydyInJvdwB0oJIhYQDpAFYmYSNycG9vbgAAAWR1GiceJ28AdwDuAPAmcAAAoMAh5SFmdAABYWgnJy0ncgByAG8AdwDzAAkMYQByAHAAbwBvAG4A8wATBGklZ2h0YXJyb3dzAACgySFxAHUAaQBnAGEAcgByAG8A9wBZJugkcmVldGltZXMAoMwiZwDaYmkAbgBnAGQAbwB0AHMAZQDxABwYgAFhaG0AYCdjJ2YncgDyAAkMYQDyABMEAKAPIG8idXN0AGGgsSPjIWhlAKCxI+0haWQAoO4qAAJhYnB0fCeGJ4knmScAAW5ygCeDJ2cAAKDtJ3IAAKD+IXIA6wAcDIABYWZsAI8nkieVJ3IAAKCGKQDgNdhj3XUAcwAAoC4qaSJtZXMAAKA1KgABYXCiJ6gncgBnoCkAdAAAoJQp7yJsaW50AKASKmEAcgDyADwnAAJhY2hxuCe8J6EMwCfxIXVvAKA6IHIAAOA12MfcAAFidYAmxCdvAPKgGSCoAYABaGlyAM4n0ifWJ3IAZQDlAE0n7SFlcwCgyiJpAIChuSVlZmwAXAxjEt4n9CFyaQCgzinsInVoYXIAoGgpAKAeIWENBSgJKA0oSyhVKIYoAACLKLAoAAAAAOMo5ygAABApJCkxKW0pcSmHKaYpAACYKgAAAACxKmMidXRlAFthcQB1AO8ABR+ApHsiRWFjZWlucHN5ABwoHignKCooLygyKEEoRihJKACgtCrwASMoAAAlKACguCpvAG4AYWF1AOUAgw1koLAqaQBsAF9hcgBjAF1hgAFFYXMAOCg6KD0oAKC2KnAAAKC6KmkAbQAAoOki7yJsaW50AKATKmkA7QCIDUFkbwB0AGKixSKRFgAAAABTKACgZiqAA0FhY21zdHgAYChkKG8ocyh1KHkogihyAHIAAKDYIXIAAAFocmkoayjrAJAab6CYIfcAzAd0ADuApwCnQGkAO2D3IWFyAKApKW0AAAFpbn4ozQBuAHUA8wDOAHQAAKA2J3IA7+A12DDdIxkAAmFjb3mRKJUonSisKHIAcAAAoG8mAAFoeZkonChjAHkASWRIZHIAdABtAqUoAAAAAKgoaQDkAFsPYQByAGEA7ABsJDuArQCtQAABZ22zKLsobQBhAAChwwNmdroouijCY4CjPCJkZWdsbnByAMgozCjPKNMo1yjaKN4obwB0AACgairxoEMiCw5FoJ4qAKCgKkWgnSoAoJ8qZQAAoEYi7CF1cwCgJCrhIXJyAKByKWEAcgDyAPwMAAJhZWl07Sj8KAEpCCkAAWxz8Sj4KGwAcwBlAHQAbQDpAH8oaABwAACgMyrwImFyc2wAoOQpAAFkbFoPBSllAACgIyNloKoqc6CsKgDgrCoA/oABZmxwABUpGCkfKfQhY3lMZGKgLwBhoMQpcgAAoD8jZgAA4DXYZN1hAAABZHIoKRcDZQBzAHWgYCZpAHQAAKBgJoABY3N1ADYpRilhKQABYXU6KUApcABzoJMiAOCTIgD+cABzoJQiAOCUIgD+dQAAAWJwSylWKQChjyJlcz4NUCllAHQAZaCPIvEAPw0AoZAiZXNIDVspZQB0AGWgkCLxAEkNAKGhJWFmZilbBHIAZQFrKVwEAKChJWEAcgDyAAMNAAJjZW10dyl7KX8pgilyAADgNdjI3HQAbQDuAM4AaQDsAAYpYQByAOYAVw0AAWFyiimOKXIA5qAGJhESAAFhbpIpoylpImdodAAAAWVwmSmgKXAAcwBpAGwAbwDuANkXaADpAKAkcwCvYIACYmNtbnAArin8KY4NJSooKgCkgiJFZGVtbnByc7wpvinCKcgpzCnUKdgp3CkAoMUqbwB0AACgvSpkoIYibwB0AACgwyr1IWx0AKDBKgABRWXQKdIpAKDLKgCgiiLsIXVzAKC/KuEhcnIAoHkpgAFlaXUA4inxKfQpdAAAoYIiZW7oKewpcQDxoIYivSllAHEA8aCKItEpbQAAoMcqAAFicPgp+ikAoNUqAKDTKmMAgKJ7ImFjZW5zAAcqDSoUKhYqRihwAHAAcgBvAPgAIyh1AHIAbAB5AGUA8QCDDfEAfA2AAWFlcwAcKiIqPShwAHAAcgBvAPgAPChxAPEAOShnAACgaiYApoMiMTIzRWRlaGxtbnBzPCo/KkIqRSpHKlIqWCpjKmcqaypzKncqO4C5ALlAO4CyALJAO4CzALNAAKDGKgABb3NLKk4qdAAAoL4qdQBiAACg2CpkoIcibwB0AACgxCpzAAABb3VdKmAqbAAAoMknYgAAoNcq4SFycgCgeyn1IWx0AKDCKgABRWVvKnEqAKDMKgCgiyLsIXVzAKDAKoABZWl1AH0qjCqPKnQAAKGDImVugyqHKnEA8aCHIkYqZQBxAPGgiyJwKm0AAKDIKgABYnCTKpUqAKDUKgCg1iqAAUFhbgCdKqEqrCpyAHIAAKDZIXIAAAFocqYqqCrrAJUab6CZIfcAxQf3IWFyAKAqKWwAaQBnADuA3wDfQOELzyrZKtwq6SrsKvEqAAD1KjQrAAAAAAAAAAAAAEwrbCsAAHErvSsAAAAAAADRK3IC1CoAAAAA2CrnIWV0AKAWI8RjcgDrAOUKgAFhZXkA4SrkKucq8iFvbmVh5CFpbGNhQmRvAPQAIg5sInJlYwAAoBUjcgAA4DXYMd0AAmVpa2/7KhIrKCsuK/IBACsAAAkrZQAAATRm6g0EK28AcgDlAOsNYQBzorgDECsAAAAAEit5AG0A0WMAAWNuFislK2sAAAFhcxsrIStwAHAAcgBvAPgAFw5pAG0AAKA8InMA8AD9DQABYXMsKyEr8AAXDnIAbgA7gP4A/kDsATgrOyswG2QA5QBnAmUAcwCAgdcAO2JkAEMrRCtJK9dAYaCgInIAAKAxKgCgMCqAAWVwcwBRK1MraSvhAAkh4qKkIlsrXysAAAAAYytvAHQAAKA2I2kAcgAAoPEqb+A12GXdcgBrAACg2irhAHgociJpbWUAAKA0IIABYWlwAHYreSu3K2QA5QC+DYADYWRlbXBzdACFK6MrmiunK6wrsCuzK24iZ2xlAACitSVkbHFykCuUK5ornCvvIXduAKC/JeUhZnRloMMl8QACBwCgXCJpImdodABloLkl8QBdDG8AdAAAoOwlaSJudXMAAKA6KuwhdXMAoDkqYgAAoM0p6SFtZQCgOyrlInppdW0AoOIjgAFjaHQAwivKK80rAAFyecYrySsA4DXYydxGZGMAeQBbZPIhb2tnYQABaW/UK9creAD0ANERaCJlYWQAAAFsct4r5ytlAGYAdABhAHIAcgBvAPcAXQbpJGdodGFycm93AKCgIQAJQUhhYmNkZmdobG1vcHJzdHV3CiwNLBEsHSwnLDEsQCxLLFIsYix6LIQsjyzLLOgs7Sz/LAotcgDyAAkDYQByAACgYykAAWNyFSwbLHUAdABlADuA+gD6QPIACQ1yAOMBIywAACUseQBeZHYAZQBtYQABaXkrLDAscgBjADuA+wD7QENkgAFhYmgANyw6LD0scgDyANEO7CFhY3FhYQDyAOAOAAFpckQsSCzzIWh0AKB+KQDgNdgy3XIAYQB2AGUAO4D5APlAYQFWLF8scgAAAWxyWixcLACgvyEAoL4hbABrAACggCUAAWN0Zix2LG8CbCwAAAAAcyxyAG4AZaAcI3IAAKAcI28AcAAAoA8jcgBpAACg+CUAAWFsfiyBLGMAcgBrYTuAqACoQAABZ3CILIssbwBuAHNhZgAA4DXYZt0AA2FkaGxzdZksniynLLgsuyzFLHIAcgBvAPcACQ1vAHcAbgBhAHIAcgBvAPcA2A5hI3Jwb29uAAABbHKvLLMsZQBmAPQAWyxpAGcAaAD0AF0sdQDzAKYOaQAAocUDaGzBLMIs0mNvAG4AxWPwI2Fycm93cwCgyCGAAWNpdADRLOEs5CxvAtcsAAAAAN4scgBuAGWgHSNyAACgHSNvAHAAAKAOI24AZwBvYXIAaQAAoPklYwByAADgNdjK3IABZGlyAPMs9yz6LG8AdAAAoPAi7CFkZWlhaQBmoLUlAKC0JQABYW0DLQYtcgDyAMosbAA7gPwA/EDhIm5nbGUAoKcpgAdBQkRhY2RlZmxub3Byc3oAJy0qLTAtNC2bLZ0toS2/LcMtxy3TLdgt3C3gLfwtcgDyABADYQByAHag6CoAoOkqYQBzAOgA/gIAAW5yOC08LechcnQAoJwpgANla25wcnN0AJkpSC1NLVQtXi1iLYItYQBwAHAA4QAaHG8AdABoAGkAbgDnAKEXgAFoaXIAoSmzJFotbwBwAPQAdCVooJUh7wD4JgABaXVmLWotZwBtAOEAuygAAWJwbi14LXMjZXRuZXEAceCKIgD+AODLKgD+cyNldG5lcQBx4IsiAP4A4MwqAP4AAWhyhi2KLWUAdADhABIraSNhbmdsZQAAAWxyki2WLeUhZnQAoLIiaSJnaHQAAKCzInkAMmThIXNoAKCiIoABZWxyAKcttC24LWKiKCKuLQAAAACyLWEAcgAAoLsicQAAoFoi7CFpcACg7iIAAWJ0vC1eD2EA8gBfD3IAAOA12DPddAByAOkAlS1zAHUAAAFicM0t0C0A4IIi0iAA4IMi0iBwAGYAAOA12GfdcgBvAPAAWQt0AHIA6QCaLQABY3XkLegtcgAA4DXYy9wAAWJw7C30LW4AAAFFZXUt8S0A4IoiAP5uAAABRWV/LfktAOCLIgD+6SJnemFnAKCaKYADY2Vmb3BycwANLhAuJS4pLiMuLi40LukhcmN1YQABZGkULiEuAAFiZxguHC5hAHIAAKBfKmUAcaAnIgCgWSLlIXJwAKAYIXIAAOA12DTdcABmAADgNdho3WWgQCJhAHQA6ABqD2MAcgAA4DXYzNzjCuQRUC4AAFQuAABYLmIuAAAAAGMubS5wLnQuAAAAAIguki4AAJouJxIqEnQAcgDpAB0ScgAA4DXYNd0AAUFhWy5eLnIA8gDnAnIA8gCTB75jAAFBYWYuaS5yAPIA4AJyAPIAjAdhAPAAeh5pAHMAAKD7IoABZHB0APgReS6DLgABZmx9LoAuAOA12GnddQDzAP8RaQBtAOUABBIAAUFhiy6OLnIA8gDuAnIA8gCaBwABY3GVLgoScgAA4DXYzdwAAXB0nS6hLmwAdQDzACUScgDpACASAARhY2VmaW9zdbEuvC7ELsguzC7PLtQu2S5jAAABdXm2LrsudABlADuA/QD9QE9kAAFpecAuwy5yAGMAd2FLZG4AO4ClAKVAcgAA4DXYNt1jAHkAV2RwAGYAAOA12GrdYwByAADgNdjO3AABY23dLt8ueQBOZGwAO4D/AP9AAAVhY2RlZmhpb3N38y73Lv8uAi8MLxAvEy8YLx0vIi9jInV0ZQB6YQABYXn7Lv4u8iFvbn5hN2RvAHQAfGEAAWV0Bi8KL3QAcgDmAB8QYQC2Y3IAAOA12DfdYwB5ADZk5yJyYXJyAKDdIXAAZgAA4DXYa91jAHIAAOA12M/cAAFqbiYvKC8AoA0gagAAoAwg");
	//#endregion
	//#region node_modules/parse5/node_modules/entities/dist/internal/bin-trie-flags.js
	/**
	* Bit flags & masks for the binary trie encoding used for entity decoding.
	*
	* Bit layout (16 bits total):
	* 15..14 VALUE_LENGTH   (+1 encoding; 0 => no value)
	* 13     FLAG13.        If valueLength>0: semicolon required flag (implicit ';').
	*                       If valueLength==0: compact run flag.
	* 12..7  BRANCH_LENGTH  Branch length (0 => single branch in 6..0 if jumpOffset==char) OR run length (when compact run)
	* 6..0   JUMP_TABLE     Jump offset (jump table) OR single-branch char code OR first run char
	*/
	var BinTrieFlags;
	(function(BinTrieFlags) {
		BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
		BinTrieFlags[BinTrieFlags["FLAG13"] = 8192] = "FLAG13";
		BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
		BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
	})(BinTrieFlags || (BinTrieFlags = {}));
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/toPrimitive.js
	function toPrimitive(t, r) {
		if ("object" != _typeof(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	//#endregion
	//#region node_modules/parse5/node_modules/entities/dist/decode.js
	var CharCodes;
	(function(CharCodes) {
		CharCodes[CharCodes["NUM"] = 35] = "NUM";
		CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
		CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
		CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
		CharCodes[CharCodes["NINE"] = 57] = "NINE";
		CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
		CharCodes[CharCodes["LOWER_F"] = 102] = "LOWER_F";
		CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
		CharCodes[CharCodes["LOWER_Z"] = 122] = "LOWER_Z";
		CharCodes[CharCodes["UPPER_A"] = 65] = "UPPER_A";
		CharCodes[CharCodes["UPPER_F"] = 70] = "UPPER_F";
		CharCodes[CharCodes["UPPER_Z"] = 90] = "UPPER_Z";
	})(CharCodes || (CharCodes = {}));
	/** Bit that needs to be set to convert an upper case ASCII character to lower case */
	var TO_LOWER_BIT = 32;
	function isNumber(code) {
		return code >= CharCodes.ZERO && code <= CharCodes.NINE;
	}
	function isHexadecimalCharacter(code) {
		return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F;
	}
	function isAsciiAlphaNumeric$1(code) {
		return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z || isNumber(code);
	}
	/**
	* Checks if the given character is a valid end character for an entity in an attribute.
	*
	* Attribute values that aren't terminated properly aren't parsed, and shouldn't lead to a parser error.
	* See the example in https://html.spec.whatwg.org/multipage/parsing.html#named-character-reference-state
	* @param code Code point to decode.
	*/
	function isEntityInAttributeInvalidEnd(code) {
		return code === CharCodes.EQUALS || isAsciiAlphaNumeric$1(code);
	}
	var EntityDecoderState;
	(function(EntityDecoderState) {
		EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
		EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
		EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
		EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
		EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
	})(EntityDecoderState || (EntityDecoderState = {}));
	/**
	* Decoding mode for named entities.
	*/
	var DecodingMode;
	(function(DecodingMode) {
		/** Entities in text nodes that can end with any character. */
		DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
		/** Only allow entities terminated with a semicolon. */
		DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
		/** Entities in attributes have limitations on ending characters. */
		DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
	})(DecodingMode || (DecodingMode = {}));
	/**
	* Token decoder with support of writing partial entities.
	*/
	var EntityDecoder = class {
		constructor(decodeTree, emitCodePoint, errors) {
			_defineProperty(this, "decodeTree", void 0);
			_defineProperty(this, "emitCodePoint", void 0);
			_defineProperty(this, "errors", void 0);
			_defineProperty(
				this,
				/** The current state of the decoder. */
				"state",
				EntityDecoderState.EntityStart
			);
			_defineProperty(
				this,
				/** Characters that were consumed while parsing an entity. */
				"consumed",
				1
			);
			_defineProperty(
				this,
				/**
				* The result of the entity.
				*
				* Either the result index of a numeric entity, or the codepoint of a
				* numeric entity.
				*/
				"result",
				0
			);
			_defineProperty(
				this,
				/** The current index in the decode tree. */
				"treeIndex",
				0
			);
			_defineProperty(
				this,
				/** The number of characters that were consumed in excess. */
				"excess",
				1
			);
			_defineProperty(
				this,
				/** The mode in which the decoder is operating. */
				"decodeMode",
				DecodingMode.Strict
			);
			_defineProperty(
				this,
				/** The number of characters that have been consumed in the current run. */
				"runConsumed",
				0
			);
			this.decodeTree = decodeTree;
			this.emitCodePoint = emitCodePoint;
			this.errors = errors;
		}
		/**
		* Resets the instance to make it reusable.
		* @param decodeMode Entity decoding mode to use.
		*/
		startEntity(decodeMode) {
			this.decodeMode = decodeMode;
			this.state = EntityDecoderState.EntityStart;
			this.result = 0;
			this.treeIndex = 0;
			this.excess = 1;
			this.consumed = 1;
			this.runConsumed = 0;
		}
		/**
		* Write an entity to the decoder. This can be called multiple times with partial entities.
		* If the entity is incomplete, the decoder will return -1.
		*
		* Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
		* entity is incomplete, and resume when the next string is written.
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		write(input, offset) {
			switch (this.state) {
				case EntityDecoderState.EntityStart:
					if (input.charCodeAt(offset) === CharCodes.NUM) {
						this.state = EntityDecoderState.NumericStart;
						this.consumed += 1;
						return this.stateNumericStart(input, offset + 1);
					}
					this.state = EntityDecoderState.NamedEntity;
					return this.stateNamedEntity(input, offset);
				case EntityDecoderState.NumericStart: return this.stateNumericStart(input, offset);
				case EntityDecoderState.NumericDecimal: return this.stateNumericDecimal(input, offset);
				case EntityDecoderState.NumericHex: return this.stateNumericHex(input, offset);
				case EntityDecoderState.NamedEntity: return this.stateNamedEntity(input, offset);
			}
		}
		/**
		* Switches between the numeric decimal and hexadecimal states.
		*
		* Equivalent to the `Numeric character reference state` in the HTML spec.
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNumericStart(input, offset) {
			if (offset >= input.length) return -1;
			if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
				this.state = EntityDecoderState.NumericHex;
				this.consumed += 1;
				return this.stateNumericHex(input, offset + 1);
			}
			this.state = EntityDecoderState.NumericDecimal;
			return this.stateNumericDecimal(input, offset);
		}
		/**
		* Parses a hexadecimal numeric entity.
		*
		* Equivalent to the `Hexademical character reference state` in the HTML spec.
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNumericHex(input, offset) {
			while (offset < input.length) {
				const char = input.charCodeAt(offset);
				if (isNumber(char) || isHexadecimalCharacter(char)) {
					const digit = char <= CharCodes.NINE ? char - CharCodes.ZERO : (char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10;
					this.result = this.result * 16 + digit;
					this.consumed++;
					offset++;
				} else return this.emitNumericEntity(char, 3);
			}
			return -1;
		}
		/**
		* Parses a decimal numeric entity.
		*
		* Equivalent to the `Decimal character reference state` in the HTML spec.
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNumericDecimal(input, offset) {
			while (offset < input.length) {
				const char = input.charCodeAt(offset);
				if (isNumber(char)) {
					this.result = this.result * 10 + (char - CharCodes.ZERO);
					this.consumed++;
					offset++;
				} else return this.emitNumericEntity(char, 2);
			}
			return -1;
		}
		/**
		* Validate and emit a numeric entity.
		*
		* Implements the logic from the `Hexademical character reference start
		* state` and `Numeric character reference end state` in the HTML spec.
		* @param lastCp The last code point of the entity. Used to see if the
		*               entity was terminated with a semicolon.
		* @param expectedLength The minimum number of characters that should be
		*                       consumed. Used to validate that at least one digit
		*                       was consumed.
		* @returns The number of characters that were consumed.
		*/
		emitNumericEntity(lastCp, expectedLength) {
			if (this.consumed <= expectedLength) {
				var _this$errors;
				(_this$errors = this.errors) === null || _this$errors === void 0 || _this$errors.absenceOfDigitsInNumericCharacterReference(this.consumed);
				return 0;
			}
			if (lastCp === CharCodes.SEMI) this.consumed += 1;
			else if (this.decodeMode === DecodingMode.Strict) return 0;
			this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
			if (this.errors) {
				if (lastCp !== CharCodes.SEMI) this.errors.missingSemicolonAfterCharacterReference();
				this.errors.validateNumericCharacterReference(this.result);
			}
			return this.consumed;
		}
		/**
		* Parses a named entity.
		*
		* Equivalent to the `Named character reference state` in the HTML spec.
		* @param input The string containing the entity (or a continuation of the entity).
		* @param offset The current offset.
		* @returns The number of characters that were consumed, or -1 if the entity is incomplete.
		*/
		stateNamedEntity(input, offset) {
			const { decodeTree } = this;
			let current = decodeTree[this.treeIndex];
			let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
			while (offset < input.length) {
				if (valueLength === 0 && (current & BinTrieFlags.FLAG13) !== 0) {
					const runLength = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
					if (this.runConsumed === 0) {
						const firstChar = current & BinTrieFlags.JUMP_TABLE;
						if (input.charCodeAt(offset) !== firstChar) return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
						offset++;
						this.excess++;
						this.runConsumed++;
					}
					while (this.runConsumed < runLength) {
						if (offset >= input.length) return -1;
						const charIndexInPacked = this.runConsumed - 1;
						const packedWord = decodeTree[this.treeIndex + 1 + (charIndexInPacked >> 1)];
						const expectedChar = charIndexInPacked % 2 === 0 ? packedWord & 255 : packedWord >> 8 & 255;
						if (input.charCodeAt(offset) !== expectedChar) {
							this.runConsumed = 0;
							return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
						}
						offset++;
						this.excess++;
						this.runConsumed++;
					}
					this.runConsumed = 0;
					this.treeIndex += 1 + (runLength >> 1);
					current = decodeTree[this.treeIndex];
					valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
				}
				if (offset >= input.length) break;
				const char = input.charCodeAt(offset);
				if (char === CharCodes.SEMI && valueLength !== 0 && (current & BinTrieFlags.FLAG13) !== 0) return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
				this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
				if (this.treeIndex < 0) return this.result === 0 || this.decodeMode === DecodingMode.Attribute && (valueLength === 0 || isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
				current = decodeTree[this.treeIndex];
				valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
				if (valueLength !== 0) {
					if (char === CharCodes.SEMI) return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
					if (this.decodeMode !== DecodingMode.Strict && (current & BinTrieFlags.FLAG13) === 0) {
						this.result = this.treeIndex;
						this.consumed += this.excess;
						this.excess = 0;
					}
				}
				offset++;
				this.excess++;
			}
			return -1;
		}
		/**
		* Emit a named entity that was not terminated with a semicolon.
		* @returns The number of characters consumed.
		*/
		emitNotTerminatedNamedEntity() {
			var _this$errors2;
			const { result, decodeTree } = this;
			const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
			this.emitNamedEntityData(result, valueLength, this.consumed);
			(_this$errors2 = this.errors) === null || _this$errors2 === void 0 || _this$errors2.missingSemicolonAfterCharacterReference();
			return this.consumed;
		}
		/**
		* Emit a named entity.
		* @param result The index of the entity in the decode tree.
		* @param valueLength The number of bytes in the entity.
		* @param consumed The number of characters consumed.
		* @returns The number of characters consumed.
		*/
		emitNamedEntityData(result, valueLength, consumed) {
			const { decodeTree } = this;
			this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~(BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13) : decodeTree[result + 1], consumed);
			if (valueLength === 3) this.emitCodePoint(decodeTree[result + 2], consumed);
			return consumed;
		}
		/**
		* Signal to the parser that the end of the input was reached.
		*
		* Remaining data will be emitted and relevant errors will be produced.
		* @returns The number of characters consumed.
		*/
		end() {
			switch (this.state) {
				case EntityDecoderState.NamedEntity: return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
				case EntityDecoderState.NumericDecimal: return this.emitNumericEntity(0, 2);
				case EntityDecoderState.NumericHex: return this.emitNumericEntity(0, 3);
				case EntityDecoderState.NumericStart:
					var _this$errors3;
					(_this$errors3 = this.errors) === null || _this$errors3 === void 0 || _this$errors3.absenceOfDigitsInNumericCharacterReference(this.consumed);
					return 0;
				case EntityDecoderState.EntityStart: return 0;
			}
		}
	};
	/**
	* Determines the branch of the current node that is taken given the current
	* character. This function is used to traverse the trie.
	* @param decodeTree The trie.
	* @param current The current node.
	* @param nodeIndex Index immediately after the current node header.
	* @param char The current character.
	* @returns The index of the next node, or -1 if no branch is taken.
	*/
	function determineBranch(decodeTree, current, nodeIndex, char) {
		const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
		const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
		if (branchCount === 0) return jumpOffset !== 0 && char === jumpOffset ? nodeIndex : -1;
		if (jumpOffset) {
			const value = char - jumpOffset;
			return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIndex + value] - 1;
		}
		const packedKeySlots = branchCount + 1 >> 1;
		let lo = 0;
		let hi = branchCount - 1;
		while (lo <= hi) {
			const mid = lo + hi >>> 1;
			const midKey = decodeTree[nodeIndex + (mid >> 1)] >> (mid & 1) * 8 & 255;
			if (midKey < char) lo = mid + 1;
			else if (midKey > char) hi = mid - 1;
			else return decodeTree[nodeIndex + packedKeySlots + mid];
		}
		return -1;
	}
	//#endregion
	//#region node_modules/parse5/dist/common/html.js
	/** All valid namespaces in HTML. */
	var NS;
	(function(NS) {
		NS["HTML"] = "http://www.w3.org/1999/xhtml";
		NS["MATHML"] = "http://www.w3.org/1998/Math/MathML";
		NS["SVG"] = "http://www.w3.org/2000/svg";
		NS["XLINK"] = "http://www.w3.org/1999/xlink";
		NS["XML"] = "http://www.w3.org/XML/1998/namespace";
		NS["XMLNS"] = "http://www.w3.org/2000/xmlns/";
	})(NS || (NS = {}));
	var ATTRS;
	(function(ATTRS) {
		ATTRS["TYPE"] = "type";
		ATTRS["ACTION"] = "action";
		ATTRS["ENCODING"] = "encoding";
		ATTRS["PROMPT"] = "prompt";
		ATTRS["NAME"] = "name";
		ATTRS["COLOR"] = "color";
		ATTRS["FACE"] = "face";
		ATTRS["SIZE"] = "size";
	})(ATTRS || (ATTRS = {}));
	/**
	* The mode of the document.
	*
	* @see {@link https://dom.spec.whatwg.org/#concept-document-limited-quirks}
	*/
	var DOCUMENT_MODE;
	(function(DOCUMENT_MODE) {
		DOCUMENT_MODE["NO_QUIRKS"] = "no-quirks";
		DOCUMENT_MODE["QUIRKS"] = "quirks";
		DOCUMENT_MODE["LIMITED_QUIRKS"] = "limited-quirks";
	})(DOCUMENT_MODE || (DOCUMENT_MODE = {}));
	var TAG_NAMES;
	(function(TAG_NAMES) {
		TAG_NAMES["A"] = "a";
		TAG_NAMES["ADDRESS"] = "address";
		TAG_NAMES["ANNOTATION_XML"] = "annotation-xml";
		TAG_NAMES["APPLET"] = "applet";
		TAG_NAMES["AREA"] = "area";
		TAG_NAMES["ARTICLE"] = "article";
		TAG_NAMES["ASIDE"] = "aside";
		TAG_NAMES["B"] = "b";
		TAG_NAMES["BASE"] = "base";
		TAG_NAMES["BASEFONT"] = "basefont";
		TAG_NAMES["BGSOUND"] = "bgsound";
		TAG_NAMES["BIG"] = "big";
		TAG_NAMES["BLOCKQUOTE"] = "blockquote";
		TAG_NAMES["BODY"] = "body";
		TAG_NAMES["BR"] = "br";
		TAG_NAMES["BUTTON"] = "button";
		TAG_NAMES["CAPTION"] = "caption";
		TAG_NAMES["CENTER"] = "center";
		TAG_NAMES["CODE"] = "code";
		TAG_NAMES["COL"] = "col";
		TAG_NAMES["COLGROUP"] = "colgroup";
		TAG_NAMES["DD"] = "dd";
		TAG_NAMES["DESC"] = "desc";
		TAG_NAMES["DETAILS"] = "details";
		TAG_NAMES["DIALOG"] = "dialog";
		TAG_NAMES["DIR"] = "dir";
		TAG_NAMES["DIV"] = "div";
		TAG_NAMES["DL"] = "dl";
		TAG_NAMES["DT"] = "dt";
		TAG_NAMES["EM"] = "em";
		TAG_NAMES["EMBED"] = "embed";
		TAG_NAMES["FIELDSET"] = "fieldset";
		TAG_NAMES["FIGCAPTION"] = "figcaption";
		TAG_NAMES["FIGURE"] = "figure";
		TAG_NAMES["FONT"] = "font";
		TAG_NAMES["FOOTER"] = "footer";
		TAG_NAMES["FOREIGN_OBJECT"] = "foreignObject";
		TAG_NAMES["FORM"] = "form";
		TAG_NAMES["FRAME"] = "frame";
		TAG_NAMES["FRAMESET"] = "frameset";
		TAG_NAMES["H1"] = "h1";
		TAG_NAMES["H2"] = "h2";
		TAG_NAMES["H3"] = "h3";
		TAG_NAMES["H4"] = "h4";
		TAG_NAMES["H5"] = "h5";
		TAG_NAMES["H6"] = "h6";
		TAG_NAMES["HEAD"] = "head";
		TAG_NAMES["HEADER"] = "header";
		TAG_NAMES["HGROUP"] = "hgroup";
		TAG_NAMES["HR"] = "hr";
		TAG_NAMES["HTML"] = "html";
		TAG_NAMES["I"] = "i";
		TAG_NAMES["IMG"] = "img";
		TAG_NAMES["IMAGE"] = "image";
		TAG_NAMES["INPUT"] = "input";
		TAG_NAMES["IFRAME"] = "iframe";
		TAG_NAMES["KEYGEN"] = "keygen";
		TAG_NAMES["LABEL"] = "label";
		TAG_NAMES["LI"] = "li";
		TAG_NAMES["LINK"] = "link";
		TAG_NAMES["LISTING"] = "listing";
		TAG_NAMES["MAIN"] = "main";
		TAG_NAMES["MALIGNMARK"] = "malignmark";
		TAG_NAMES["MARQUEE"] = "marquee";
		TAG_NAMES["MATH"] = "math";
		TAG_NAMES["MENU"] = "menu";
		TAG_NAMES["META"] = "meta";
		TAG_NAMES["MGLYPH"] = "mglyph";
		TAG_NAMES["MI"] = "mi";
		TAG_NAMES["MO"] = "mo";
		TAG_NAMES["MN"] = "mn";
		TAG_NAMES["MS"] = "ms";
		TAG_NAMES["MTEXT"] = "mtext";
		TAG_NAMES["NAV"] = "nav";
		TAG_NAMES["NOBR"] = "nobr";
		TAG_NAMES["NOFRAMES"] = "noframes";
		TAG_NAMES["NOEMBED"] = "noembed";
		TAG_NAMES["NOSCRIPT"] = "noscript";
		TAG_NAMES["OBJECT"] = "object";
		TAG_NAMES["OL"] = "ol";
		TAG_NAMES["OPTGROUP"] = "optgroup";
		TAG_NAMES["OPTION"] = "option";
		TAG_NAMES["P"] = "p";
		TAG_NAMES["PARAM"] = "param";
		TAG_NAMES["PLAINTEXT"] = "plaintext";
		TAG_NAMES["PRE"] = "pre";
		TAG_NAMES["RB"] = "rb";
		TAG_NAMES["RP"] = "rp";
		TAG_NAMES["RT"] = "rt";
		TAG_NAMES["RTC"] = "rtc";
		TAG_NAMES["RUBY"] = "ruby";
		TAG_NAMES["S"] = "s";
		TAG_NAMES["SCRIPT"] = "script";
		TAG_NAMES["SEARCH"] = "search";
		TAG_NAMES["SECTION"] = "section";
		TAG_NAMES["SELECT"] = "select";
		TAG_NAMES["SOURCE"] = "source";
		TAG_NAMES["SMALL"] = "small";
		TAG_NAMES["SPAN"] = "span";
		TAG_NAMES["STRIKE"] = "strike";
		TAG_NAMES["STRONG"] = "strong";
		TAG_NAMES["STYLE"] = "style";
		TAG_NAMES["SUB"] = "sub";
		TAG_NAMES["SUMMARY"] = "summary";
		TAG_NAMES["SUP"] = "sup";
		TAG_NAMES["TABLE"] = "table";
		TAG_NAMES["TBODY"] = "tbody";
		TAG_NAMES["TEMPLATE"] = "template";
		TAG_NAMES["TEXTAREA"] = "textarea";
		TAG_NAMES["TFOOT"] = "tfoot";
		TAG_NAMES["TD"] = "td";
		TAG_NAMES["TH"] = "th";
		TAG_NAMES["THEAD"] = "thead";
		TAG_NAMES["TITLE"] = "title";
		TAG_NAMES["TR"] = "tr";
		TAG_NAMES["TRACK"] = "track";
		TAG_NAMES["TT"] = "tt";
		TAG_NAMES["U"] = "u";
		TAG_NAMES["UL"] = "ul";
		TAG_NAMES["SVG"] = "svg";
		TAG_NAMES["VAR"] = "var";
		TAG_NAMES["WBR"] = "wbr";
		TAG_NAMES["XMP"] = "xmp";
	})(TAG_NAMES || (TAG_NAMES = {}));
	/**
	* Tag IDs are numeric IDs for known tag names.
	*
	* We use tag IDs to improve the performance of tag name comparisons.
	*/
	var TAG_ID;
	(function(TAG_ID) {
		TAG_ID[TAG_ID["UNKNOWN"] = 0] = "UNKNOWN";
		TAG_ID[TAG_ID["A"] = 1] = "A";
		TAG_ID[TAG_ID["ADDRESS"] = 2] = "ADDRESS";
		TAG_ID[TAG_ID["ANNOTATION_XML"] = 3] = "ANNOTATION_XML";
		TAG_ID[TAG_ID["APPLET"] = 4] = "APPLET";
		TAG_ID[TAG_ID["AREA"] = 5] = "AREA";
		TAG_ID[TAG_ID["ARTICLE"] = 6] = "ARTICLE";
		TAG_ID[TAG_ID["ASIDE"] = 7] = "ASIDE";
		TAG_ID[TAG_ID["B"] = 8] = "B";
		TAG_ID[TAG_ID["BASE"] = 9] = "BASE";
		TAG_ID[TAG_ID["BASEFONT"] = 10] = "BASEFONT";
		TAG_ID[TAG_ID["BGSOUND"] = 11] = "BGSOUND";
		TAG_ID[TAG_ID["BIG"] = 12] = "BIG";
		TAG_ID[TAG_ID["BLOCKQUOTE"] = 13] = "BLOCKQUOTE";
		TAG_ID[TAG_ID["BODY"] = 14] = "BODY";
		TAG_ID[TAG_ID["BR"] = 15] = "BR";
		TAG_ID[TAG_ID["BUTTON"] = 16] = "BUTTON";
		TAG_ID[TAG_ID["CAPTION"] = 17] = "CAPTION";
		TAG_ID[TAG_ID["CENTER"] = 18] = "CENTER";
		TAG_ID[TAG_ID["CODE"] = 19] = "CODE";
		TAG_ID[TAG_ID["COL"] = 20] = "COL";
		TAG_ID[TAG_ID["COLGROUP"] = 21] = "COLGROUP";
		TAG_ID[TAG_ID["DD"] = 22] = "DD";
		TAG_ID[TAG_ID["DESC"] = 23] = "DESC";
		TAG_ID[TAG_ID["DETAILS"] = 24] = "DETAILS";
		TAG_ID[TAG_ID["DIALOG"] = 25] = "DIALOG";
		TAG_ID[TAG_ID["DIR"] = 26] = "DIR";
		TAG_ID[TAG_ID["DIV"] = 27] = "DIV";
		TAG_ID[TAG_ID["DL"] = 28] = "DL";
		TAG_ID[TAG_ID["DT"] = 29] = "DT";
		TAG_ID[TAG_ID["EM"] = 30] = "EM";
		TAG_ID[TAG_ID["EMBED"] = 31] = "EMBED";
		TAG_ID[TAG_ID["FIELDSET"] = 32] = "FIELDSET";
		TAG_ID[TAG_ID["FIGCAPTION"] = 33] = "FIGCAPTION";
		TAG_ID[TAG_ID["FIGURE"] = 34] = "FIGURE";
		TAG_ID[TAG_ID["FONT"] = 35] = "FONT";
		TAG_ID[TAG_ID["FOOTER"] = 36] = "FOOTER";
		TAG_ID[TAG_ID["FOREIGN_OBJECT"] = 37] = "FOREIGN_OBJECT";
		TAG_ID[TAG_ID["FORM"] = 38] = "FORM";
		TAG_ID[TAG_ID["FRAME"] = 39] = "FRAME";
		TAG_ID[TAG_ID["FRAMESET"] = 40] = "FRAMESET";
		TAG_ID[TAG_ID["H1"] = 41] = "H1";
		TAG_ID[TAG_ID["H2"] = 42] = "H2";
		TAG_ID[TAG_ID["H3"] = 43] = "H3";
		TAG_ID[TAG_ID["H4"] = 44] = "H4";
		TAG_ID[TAG_ID["H5"] = 45] = "H5";
		TAG_ID[TAG_ID["H6"] = 46] = "H6";
		TAG_ID[TAG_ID["HEAD"] = 47] = "HEAD";
		TAG_ID[TAG_ID["HEADER"] = 48] = "HEADER";
		TAG_ID[TAG_ID["HGROUP"] = 49] = "HGROUP";
		TAG_ID[TAG_ID["HR"] = 50] = "HR";
		TAG_ID[TAG_ID["HTML"] = 51] = "HTML";
		TAG_ID[TAG_ID["I"] = 52] = "I";
		TAG_ID[TAG_ID["IMG"] = 53] = "IMG";
		TAG_ID[TAG_ID["IMAGE"] = 54] = "IMAGE";
		TAG_ID[TAG_ID["INPUT"] = 55] = "INPUT";
		TAG_ID[TAG_ID["IFRAME"] = 56] = "IFRAME";
		TAG_ID[TAG_ID["KEYGEN"] = 57] = "KEYGEN";
		TAG_ID[TAG_ID["LABEL"] = 58] = "LABEL";
		TAG_ID[TAG_ID["LI"] = 59] = "LI";
		TAG_ID[TAG_ID["LINK"] = 60] = "LINK";
		TAG_ID[TAG_ID["LISTING"] = 61] = "LISTING";
		TAG_ID[TAG_ID["MAIN"] = 62] = "MAIN";
		TAG_ID[TAG_ID["MALIGNMARK"] = 63] = "MALIGNMARK";
		TAG_ID[TAG_ID["MARQUEE"] = 64] = "MARQUEE";
		TAG_ID[TAG_ID["MATH"] = 65] = "MATH";
		TAG_ID[TAG_ID["MENU"] = 66] = "MENU";
		TAG_ID[TAG_ID["META"] = 67] = "META";
		TAG_ID[TAG_ID["MGLYPH"] = 68] = "MGLYPH";
		TAG_ID[TAG_ID["MI"] = 69] = "MI";
		TAG_ID[TAG_ID["MO"] = 70] = "MO";
		TAG_ID[TAG_ID["MN"] = 71] = "MN";
		TAG_ID[TAG_ID["MS"] = 72] = "MS";
		TAG_ID[TAG_ID["MTEXT"] = 73] = "MTEXT";
		TAG_ID[TAG_ID["NAV"] = 74] = "NAV";
		TAG_ID[TAG_ID["NOBR"] = 75] = "NOBR";
		TAG_ID[TAG_ID["NOFRAMES"] = 76] = "NOFRAMES";
		TAG_ID[TAG_ID["NOEMBED"] = 77] = "NOEMBED";
		TAG_ID[TAG_ID["NOSCRIPT"] = 78] = "NOSCRIPT";
		TAG_ID[TAG_ID["OBJECT"] = 79] = "OBJECT";
		TAG_ID[TAG_ID["OL"] = 80] = "OL";
		TAG_ID[TAG_ID["OPTGROUP"] = 81] = "OPTGROUP";
		TAG_ID[TAG_ID["OPTION"] = 82] = "OPTION";
		TAG_ID[TAG_ID["P"] = 83] = "P";
		TAG_ID[TAG_ID["PARAM"] = 84] = "PARAM";
		TAG_ID[TAG_ID["PLAINTEXT"] = 85] = "PLAINTEXT";
		TAG_ID[TAG_ID["PRE"] = 86] = "PRE";
		TAG_ID[TAG_ID["RB"] = 87] = "RB";
		TAG_ID[TAG_ID["RP"] = 88] = "RP";
		TAG_ID[TAG_ID["RT"] = 89] = "RT";
		TAG_ID[TAG_ID["RTC"] = 90] = "RTC";
		TAG_ID[TAG_ID["RUBY"] = 91] = "RUBY";
		TAG_ID[TAG_ID["S"] = 92] = "S";
		TAG_ID[TAG_ID["SCRIPT"] = 93] = "SCRIPT";
		TAG_ID[TAG_ID["SEARCH"] = 94] = "SEARCH";
		TAG_ID[TAG_ID["SECTION"] = 95] = "SECTION";
		TAG_ID[TAG_ID["SELECT"] = 96] = "SELECT";
		TAG_ID[TAG_ID["SOURCE"] = 97] = "SOURCE";
		TAG_ID[TAG_ID["SMALL"] = 98] = "SMALL";
		TAG_ID[TAG_ID["SPAN"] = 99] = "SPAN";
		TAG_ID[TAG_ID["STRIKE"] = 100] = "STRIKE";
		TAG_ID[TAG_ID["STRONG"] = 101] = "STRONG";
		TAG_ID[TAG_ID["STYLE"] = 102] = "STYLE";
		TAG_ID[TAG_ID["SUB"] = 103] = "SUB";
		TAG_ID[TAG_ID["SUMMARY"] = 104] = "SUMMARY";
		TAG_ID[TAG_ID["SUP"] = 105] = "SUP";
		TAG_ID[TAG_ID["TABLE"] = 106] = "TABLE";
		TAG_ID[TAG_ID["TBODY"] = 107] = "TBODY";
		TAG_ID[TAG_ID["TEMPLATE"] = 108] = "TEMPLATE";
		TAG_ID[TAG_ID["TEXTAREA"] = 109] = "TEXTAREA";
		TAG_ID[TAG_ID["TFOOT"] = 110] = "TFOOT";
		TAG_ID[TAG_ID["TD"] = 111] = "TD";
		TAG_ID[TAG_ID["TH"] = 112] = "TH";
		TAG_ID[TAG_ID["THEAD"] = 113] = "THEAD";
		TAG_ID[TAG_ID["TITLE"] = 114] = "TITLE";
		TAG_ID[TAG_ID["TR"] = 115] = "TR";
		TAG_ID[TAG_ID["TRACK"] = 116] = "TRACK";
		TAG_ID[TAG_ID["TT"] = 117] = "TT";
		TAG_ID[TAG_ID["U"] = 118] = "U";
		TAG_ID[TAG_ID["UL"] = 119] = "UL";
		TAG_ID[TAG_ID["SVG"] = 120] = "SVG";
		TAG_ID[TAG_ID["VAR"] = 121] = "VAR";
		TAG_ID[TAG_ID["WBR"] = 122] = "WBR";
		TAG_ID[TAG_ID["XMP"] = 123] = "XMP";
	})(TAG_ID || (TAG_ID = {}));
	var TAG_NAME_TO_ID = /* @__PURE__ */ new Map([
		[TAG_NAMES.A, TAG_ID.A],
		[TAG_NAMES.ADDRESS, TAG_ID.ADDRESS],
		[TAG_NAMES.ANNOTATION_XML, TAG_ID.ANNOTATION_XML],
		[TAG_NAMES.APPLET, TAG_ID.APPLET],
		[TAG_NAMES.AREA, TAG_ID.AREA],
		[TAG_NAMES.ARTICLE, TAG_ID.ARTICLE],
		[TAG_NAMES.ASIDE, TAG_ID.ASIDE],
		[TAG_NAMES.B, TAG_ID.B],
		[TAG_NAMES.BASE, TAG_ID.BASE],
		[TAG_NAMES.BASEFONT, TAG_ID.BASEFONT],
		[TAG_NAMES.BGSOUND, TAG_ID.BGSOUND],
		[TAG_NAMES.BIG, TAG_ID.BIG],
		[TAG_NAMES.BLOCKQUOTE, TAG_ID.BLOCKQUOTE],
		[TAG_NAMES.BODY, TAG_ID.BODY],
		[TAG_NAMES.BR, TAG_ID.BR],
		[TAG_NAMES.BUTTON, TAG_ID.BUTTON],
		[TAG_NAMES.CAPTION, TAG_ID.CAPTION],
		[TAG_NAMES.CENTER, TAG_ID.CENTER],
		[TAG_NAMES.CODE, TAG_ID.CODE],
		[TAG_NAMES.COL, TAG_ID.COL],
		[TAG_NAMES.COLGROUP, TAG_ID.COLGROUP],
		[TAG_NAMES.DD, TAG_ID.DD],
		[TAG_NAMES.DESC, TAG_ID.DESC],
		[TAG_NAMES.DETAILS, TAG_ID.DETAILS],
		[TAG_NAMES.DIALOG, TAG_ID.DIALOG],
		[TAG_NAMES.DIR, TAG_ID.DIR],
		[TAG_NAMES.DIV, TAG_ID.DIV],
		[TAG_NAMES.DL, TAG_ID.DL],
		[TAG_NAMES.DT, TAG_ID.DT],
		[TAG_NAMES.EM, TAG_ID.EM],
		[TAG_NAMES.EMBED, TAG_ID.EMBED],
		[TAG_NAMES.FIELDSET, TAG_ID.FIELDSET],
		[TAG_NAMES.FIGCAPTION, TAG_ID.FIGCAPTION],
		[TAG_NAMES.FIGURE, TAG_ID.FIGURE],
		[TAG_NAMES.FONT, TAG_ID.FONT],
		[TAG_NAMES.FOOTER, TAG_ID.FOOTER],
		[TAG_NAMES.FOREIGN_OBJECT, TAG_ID.FOREIGN_OBJECT],
		[TAG_NAMES.FORM, TAG_ID.FORM],
		[TAG_NAMES.FRAME, TAG_ID.FRAME],
		[TAG_NAMES.FRAMESET, TAG_ID.FRAMESET],
		[TAG_NAMES.H1, TAG_ID.H1],
		[TAG_NAMES.H2, TAG_ID.H2],
		[TAG_NAMES.H3, TAG_ID.H3],
		[TAG_NAMES.H4, TAG_ID.H4],
		[TAG_NAMES.H5, TAG_ID.H5],
		[TAG_NAMES.H6, TAG_ID.H6],
		[TAG_NAMES.HEAD, TAG_ID.HEAD],
		[TAG_NAMES.HEADER, TAG_ID.HEADER],
		[TAG_NAMES.HGROUP, TAG_ID.HGROUP],
		[TAG_NAMES.HR, TAG_ID.HR],
		[TAG_NAMES.HTML, TAG_ID.HTML],
		[TAG_NAMES.I, TAG_ID.I],
		[TAG_NAMES.IMG, TAG_ID.IMG],
		[TAG_NAMES.IMAGE, TAG_ID.IMAGE],
		[TAG_NAMES.INPUT, TAG_ID.INPUT],
		[TAG_NAMES.IFRAME, TAG_ID.IFRAME],
		[TAG_NAMES.KEYGEN, TAG_ID.KEYGEN],
		[TAG_NAMES.LABEL, TAG_ID.LABEL],
		[TAG_NAMES.LI, TAG_ID.LI],
		[TAG_NAMES.LINK, TAG_ID.LINK],
		[TAG_NAMES.LISTING, TAG_ID.LISTING],
		[TAG_NAMES.MAIN, TAG_ID.MAIN],
		[TAG_NAMES.MALIGNMARK, TAG_ID.MALIGNMARK],
		[TAG_NAMES.MARQUEE, TAG_ID.MARQUEE],
		[TAG_NAMES.MATH, TAG_ID.MATH],
		[TAG_NAMES.MENU, TAG_ID.MENU],
		[TAG_NAMES.META, TAG_ID.META],
		[TAG_NAMES.MGLYPH, TAG_ID.MGLYPH],
		[TAG_NAMES.MI, TAG_ID.MI],
		[TAG_NAMES.MO, TAG_ID.MO],
		[TAG_NAMES.MN, TAG_ID.MN],
		[TAG_NAMES.MS, TAG_ID.MS],
		[TAG_NAMES.MTEXT, TAG_ID.MTEXT],
		[TAG_NAMES.NAV, TAG_ID.NAV],
		[TAG_NAMES.NOBR, TAG_ID.NOBR],
		[TAG_NAMES.NOFRAMES, TAG_ID.NOFRAMES],
		[TAG_NAMES.NOEMBED, TAG_ID.NOEMBED],
		[TAG_NAMES.NOSCRIPT, TAG_ID.NOSCRIPT],
		[TAG_NAMES.OBJECT, TAG_ID.OBJECT],
		[TAG_NAMES.OL, TAG_ID.OL],
		[TAG_NAMES.OPTGROUP, TAG_ID.OPTGROUP],
		[TAG_NAMES.OPTION, TAG_ID.OPTION],
		[TAG_NAMES.P, TAG_ID.P],
		[TAG_NAMES.PARAM, TAG_ID.PARAM],
		[TAG_NAMES.PLAINTEXT, TAG_ID.PLAINTEXT],
		[TAG_NAMES.PRE, TAG_ID.PRE],
		[TAG_NAMES.RB, TAG_ID.RB],
		[TAG_NAMES.RP, TAG_ID.RP],
		[TAG_NAMES.RT, TAG_ID.RT],
		[TAG_NAMES.RTC, TAG_ID.RTC],
		[TAG_NAMES.RUBY, TAG_ID.RUBY],
		[TAG_NAMES.S, TAG_ID.S],
		[TAG_NAMES.SCRIPT, TAG_ID.SCRIPT],
		[TAG_NAMES.SEARCH, TAG_ID.SEARCH],
		[TAG_NAMES.SECTION, TAG_ID.SECTION],
		[TAG_NAMES.SELECT, TAG_ID.SELECT],
		[TAG_NAMES.SOURCE, TAG_ID.SOURCE],
		[TAG_NAMES.SMALL, TAG_ID.SMALL],
		[TAG_NAMES.SPAN, TAG_ID.SPAN],
		[TAG_NAMES.STRIKE, TAG_ID.STRIKE],
		[TAG_NAMES.STRONG, TAG_ID.STRONG],
		[TAG_NAMES.STYLE, TAG_ID.STYLE],
		[TAG_NAMES.SUB, TAG_ID.SUB],
		[TAG_NAMES.SUMMARY, TAG_ID.SUMMARY],
		[TAG_NAMES.SUP, TAG_ID.SUP],
		[TAG_NAMES.TABLE, TAG_ID.TABLE],
		[TAG_NAMES.TBODY, TAG_ID.TBODY],
		[TAG_NAMES.TEMPLATE, TAG_ID.TEMPLATE],
		[TAG_NAMES.TEXTAREA, TAG_ID.TEXTAREA],
		[TAG_NAMES.TFOOT, TAG_ID.TFOOT],
		[TAG_NAMES.TD, TAG_ID.TD],
		[TAG_NAMES.TH, TAG_ID.TH],
		[TAG_NAMES.THEAD, TAG_ID.THEAD],
		[TAG_NAMES.TITLE, TAG_ID.TITLE],
		[TAG_NAMES.TR, TAG_ID.TR],
		[TAG_NAMES.TRACK, TAG_ID.TRACK],
		[TAG_NAMES.TT, TAG_ID.TT],
		[TAG_NAMES.U, TAG_ID.U],
		[TAG_NAMES.UL, TAG_ID.UL],
		[TAG_NAMES.SVG, TAG_ID.SVG],
		[TAG_NAMES.VAR, TAG_ID.VAR],
		[TAG_NAMES.WBR, TAG_ID.WBR],
		[TAG_NAMES.XMP, TAG_ID.XMP]
	]);
	function getTagID(tagName) {
		var _a;
		return (_a = TAG_NAME_TO_ID.get(tagName)) !== null && _a !== void 0 ? _a : TAG_ID.UNKNOWN;
	}
	var $ = TAG_ID;
	var SPECIAL_ELEMENTS = {
		[NS.HTML]: /* @__PURE__ */ new Set([
			$.ADDRESS,
			$.APPLET,
			$.AREA,
			$.ARTICLE,
			$.ASIDE,
			$.BASE,
			$.BASEFONT,
			$.BGSOUND,
			$.BLOCKQUOTE,
			$.BODY,
			$.BR,
			$.BUTTON,
			$.CAPTION,
			$.CENTER,
			$.COL,
			$.COLGROUP,
			$.DD,
			$.DETAILS,
			$.DIR,
			$.DIV,
			$.DL,
			$.DT,
			$.EMBED,
			$.FIELDSET,
			$.FIGCAPTION,
			$.FIGURE,
			$.FOOTER,
			$.FORM,
			$.FRAME,
			$.FRAMESET,
			$.H1,
			$.H2,
			$.H3,
			$.H4,
			$.H5,
			$.H6,
			$.HEAD,
			$.HEADER,
			$.HGROUP,
			$.HR,
			$.HTML,
			$.IFRAME,
			$.IMG,
			$.INPUT,
			$.LI,
			$.LINK,
			$.LISTING,
			$.MAIN,
			$.MARQUEE,
			$.MENU,
			$.META,
			$.NAV,
			$.NOEMBED,
			$.NOFRAMES,
			$.NOSCRIPT,
			$.OBJECT,
			$.OL,
			$.P,
			$.PARAM,
			$.PLAINTEXT,
			$.PRE,
			$.SCRIPT,
			$.SECTION,
			$.SELECT,
			$.SOURCE,
			$.STYLE,
			$.SUMMARY,
			$.TABLE,
			$.TBODY,
			$.TD,
			$.TEMPLATE,
			$.TEXTAREA,
			$.TFOOT,
			$.TH,
			$.THEAD,
			$.TITLE,
			$.TR,
			$.TRACK,
			$.UL,
			$.WBR,
			$.XMP
		]),
		[NS.MATHML]: /* @__PURE__ */ new Set([
			$.MI,
			$.MO,
			$.MN,
			$.MS,
			$.MTEXT,
			$.ANNOTATION_XML
		]),
		[NS.SVG]: /* @__PURE__ */ new Set([
			$.TITLE,
			$.FOREIGN_OBJECT,
			$.DESC
		]),
		[NS.XLINK]: /* @__PURE__ */ new Set(),
		[NS.XML]: /* @__PURE__ */ new Set(),
		[NS.XMLNS]: /* @__PURE__ */ new Set()
	};
	var NUMBERED_HEADERS = /* @__PURE__ */ new Set([
		$.H1,
		$.H2,
		$.H3,
		$.H4,
		$.H5,
		$.H6
	]);
	TAG_NAMES.STYLE, TAG_NAMES.SCRIPT, TAG_NAMES.XMP, TAG_NAMES.IFRAME, TAG_NAMES.NOEMBED, TAG_NAMES.NOFRAMES, TAG_NAMES.PLAINTEXT;
	//#endregion
	//#region node_modules/parse5/dist/tokenizer/index.js
	var State;
	(function(State) {
		State[State["DATA"] = 0] = "DATA";
		State[State["RCDATA"] = 1] = "RCDATA";
		State[State["RAWTEXT"] = 2] = "RAWTEXT";
		State[State["SCRIPT_DATA"] = 3] = "SCRIPT_DATA";
		State[State["PLAINTEXT"] = 4] = "PLAINTEXT";
		State[State["TAG_OPEN"] = 5] = "TAG_OPEN";
		State[State["END_TAG_OPEN"] = 6] = "END_TAG_OPEN";
		State[State["TAG_NAME"] = 7] = "TAG_NAME";
		State[State["RCDATA_LESS_THAN_SIGN"] = 8] = "RCDATA_LESS_THAN_SIGN";
		State[State["RCDATA_END_TAG_OPEN"] = 9] = "RCDATA_END_TAG_OPEN";
		State[State["RCDATA_END_TAG_NAME"] = 10] = "RCDATA_END_TAG_NAME";
		State[State["RAWTEXT_LESS_THAN_SIGN"] = 11] = "RAWTEXT_LESS_THAN_SIGN";
		State[State["RAWTEXT_END_TAG_OPEN"] = 12] = "RAWTEXT_END_TAG_OPEN";
		State[State["RAWTEXT_END_TAG_NAME"] = 13] = "RAWTEXT_END_TAG_NAME";
		State[State["SCRIPT_DATA_LESS_THAN_SIGN"] = 14] = "SCRIPT_DATA_LESS_THAN_SIGN";
		State[State["SCRIPT_DATA_END_TAG_OPEN"] = 15] = "SCRIPT_DATA_END_TAG_OPEN";
		State[State["SCRIPT_DATA_END_TAG_NAME"] = 16] = "SCRIPT_DATA_END_TAG_NAME";
		State[State["SCRIPT_DATA_ESCAPE_START"] = 17] = "SCRIPT_DATA_ESCAPE_START";
		State[State["SCRIPT_DATA_ESCAPE_START_DASH"] = 18] = "SCRIPT_DATA_ESCAPE_START_DASH";
		State[State["SCRIPT_DATA_ESCAPED"] = 19] = "SCRIPT_DATA_ESCAPED";
		State[State["SCRIPT_DATA_ESCAPED_DASH"] = 20] = "SCRIPT_DATA_ESCAPED_DASH";
		State[State["SCRIPT_DATA_ESCAPED_DASH_DASH"] = 21] = "SCRIPT_DATA_ESCAPED_DASH_DASH";
		State[State["SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN"] = 22] = "SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN";
		State[State["SCRIPT_DATA_ESCAPED_END_TAG_OPEN"] = 23] = "SCRIPT_DATA_ESCAPED_END_TAG_OPEN";
		State[State["SCRIPT_DATA_ESCAPED_END_TAG_NAME"] = 24] = "SCRIPT_DATA_ESCAPED_END_TAG_NAME";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPE_START"] = 25] = "SCRIPT_DATA_DOUBLE_ESCAPE_START";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPED"] = 26] = "SCRIPT_DATA_DOUBLE_ESCAPED";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPED_DASH"] = 27] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH"] = 28] = "SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN"] = 29] = "SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN";
		State[State["SCRIPT_DATA_DOUBLE_ESCAPE_END"] = 30] = "SCRIPT_DATA_DOUBLE_ESCAPE_END";
		State[State["BEFORE_ATTRIBUTE_NAME"] = 31] = "BEFORE_ATTRIBUTE_NAME";
		State[State["ATTRIBUTE_NAME"] = 32] = "ATTRIBUTE_NAME";
		State[State["AFTER_ATTRIBUTE_NAME"] = 33] = "AFTER_ATTRIBUTE_NAME";
		State[State["BEFORE_ATTRIBUTE_VALUE"] = 34] = "BEFORE_ATTRIBUTE_VALUE";
		State[State["ATTRIBUTE_VALUE_DOUBLE_QUOTED"] = 35] = "ATTRIBUTE_VALUE_DOUBLE_QUOTED";
		State[State["ATTRIBUTE_VALUE_SINGLE_QUOTED"] = 36] = "ATTRIBUTE_VALUE_SINGLE_QUOTED";
		State[State["ATTRIBUTE_VALUE_UNQUOTED"] = 37] = "ATTRIBUTE_VALUE_UNQUOTED";
		State[State["AFTER_ATTRIBUTE_VALUE_QUOTED"] = 38] = "AFTER_ATTRIBUTE_VALUE_QUOTED";
		State[State["SELF_CLOSING_START_TAG"] = 39] = "SELF_CLOSING_START_TAG";
		State[State["BOGUS_COMMENT"] = 40] = "BOGUS_COMMENT";
		State[State["MARKUP_DECLARATION_OPEN"] = 41] = "MARKUP_DECLARATION_OPEN";
		State[State["COMMENT_START"] = 42] = "COMMENT_START";
		State[State["COMMENT_START_DASH"] = 43] = "COMMENT_START_DASH";
		State[State["COMMENT"] = 44] = "COMMENT";
		State[State["COMMENT_LESS_THAN_SIGN"] = 45] = "COMMENT_LESS_THAN_SIGN";
		State[State["COMMENT_LESS_THAN_SIGN_BANG"] = 46] = "COMMENT_LESS_THAN_SIGN_BANG";
		State[State["COMMENT_LESS_THAN_SIGN_BANG_DASH"] = 47] = "COMMENT_LESS_THAN_SIGN_BANG_DASH";
		State[State["COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH"] = 48] = "COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH";
		State[State["COMMENT_END_DASH"] = 49] = "COMMENT_END_DASH";
		State[State["COMMENT_END"] = 50] = "COMMENT_END";
		State[State["COMMENT_END_BANG"] = 51] = "COMMENT_END_BANG";
		State[State["DOCTYPE"] = 52] = "DOCTYPE";
		State[State["BEFORE_DOCTYPE_NAME"] = 53] = "BEFORE_DOCTYPE_NAME";
		State[State["DOCTYPE_NAME"] = 54] = "DOCTYPE_NAME";
		State[State["AFTER_DOCTYPE_NAME"] = 55] = "AFTER_DOCTYPE_NAME";
		State[State["AFTER_DOCTYPE_PUBLIC_KEYWORD"] = 56] = "AFTER_DOCTYPE_PUBLIC_KEYWORD";
		State[State["BEFORE_DOCTYPE_PUBLIC_IDENTIFIER"] = 57] = "BEFORE_DOCTYPE_PUBLIC_IDENTIFIER";
		State[State["DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED"] = 58] = "DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED";
		State[State["DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED"] = 59] = "DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED";
		State[State["AFTER_DOCTYPE_PUBLIC_IDENTIFIER"] = 60] = "AFTER_DOCTYPE_PUBLIC_IDENTIFIER";
		State[State["BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS"] = 61] = "BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS";
		State[State["AFTER_DOCTYPE_SYSTEM_KEYWORD"] = 62] = "AFTER_DOCTYPE_SYSTEM_KEYWORD";
		State[State["BEFORE_DOCTYPE_SYSTEM_IDENTIFIER"] = 63] = "BEFORE_DOCTYPE_SYSTEM_IDENTIFIER";
		State[State["DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED"] = 64] = "DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED";
		State[State["DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED"] = 65] = "DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED";
		State[State["AFTER_DOCTYPE_SYSTEM_IDENTIFIER"] = 66] = "AFTER_DOCTYPE_SYSTEM_IDENTIFIER";
		State[State["BOGUS_DOCTYPE"] = 67] = "BOGUS_DOCTYPE";
		State[State["CDATA_SECTION"] = 68] = "CDATA_SECTION";
		State[State["CDATA_SECTION_BRACKET"] = 69] = "CDATA_SECTION_BRACKET";
		State[State["CDATA_SECTION_END"] = 70] = "CDATA_SECTION_END";
		State[State["CHARACTER_REFERENCE"] = 71] = "CHARACTER_REFERENCE";
		State[State["AMBIGUOUS_AMPERSAND"] = 72] = "AMBIGUOUS_AMPERSAND";
	})(State || (State = {}));
	var TokenizerMode = {
		DATA: State.DATA,
		RCDATA: State.RCDATA,
		RAWTEXT: State.RAWTEXT,
		SCRIPT_DATA: State.SCRIPT_DATA,
		PLAINTEXT: State.PLAINTEXT,
		CDATA_SECTION: State.CDATA_SECTION
	};
	function isAsciiDigit(cp) {
		return cp >= CODE_POINTS.DIGIT_0 && cp <= CODE_POINTS.DIGIT_9;
	}
	function isAsciiUpper(cp) {
		return cp >= CODE_POINTS.LATIN_CAPITAL_A && cp <= CODE_POINTS.LATIN_CAPITAL_Z;
	}
	function isAsciiLower(cp) {
		return cp >= CODE_POINTS.LATIN_SMALL_A && cp <= CODE_POINTS.LATIN_SMALL_Z;
	}
	function isAsciiLetter(cp) {
		return isAsciiLower(cp) || isAsciiUpper(cp);
	}
	function isAsciiAlphaNumeric(cp) {
		return isAsciiLetter(cp) || isAsciiDigit(cp);
	}
	function toAsciiLower(cp) {
		return cp + 32;
	}
	function isWhitespace$1(cp) {
		return cp === CODE_POINTS.SPACE || cp === CODE_POINTS.LINE_FEED || cp === CODE_POINTS.TABULATION || cp === CODE_POINTS.FORM_FEED;
	}
	function isScriptDataDoubleEscapeSequenceEnd(cp) {
		return isWhitespace$1(cp) || cp === CODE_POINTS.SOLIDUS || cp === CODE_POINTS.GREATER_THAN_SIGN;
	}
	function getErrorForNumericCharacterReference(code) {
		if (code === CODE_POINTS.NULL) return ERR.nullCharacterReference;
		else if (code > 1114111) return ERR.characterReferenceOutsideUnicodeRange;
		else if (isSurrogate(code)) return ERR.surrogateCharacterReference;
		else if (isUndefinedCodePoint(code)) return ERR.noncharacterCharacterReference;
		else if (isControlCodePoint(code) || code === CODE_POINTS.CARRIAGE_RETURN) return ERR.controlCharacterReference;
		return null;
	}
	var Tokenizer = class {
		constructor(options, handler) {
			this.options = options;
			this.handler = handler;
			this.paused = false;
			/** Ensures that the parsing loop isn't run multiple times at once. */
			this.inLoop = false;
			/**
			* Indicates that the current adjusted node exists, is not an element in the HTML namespace,
			* and that it is not an integration point for either MathML or HTML.
			*
			* @see {@link https://html.spec.whatwg.org/multipage/parsing.html#tree-construction}
			*/
			this.inForeignNode = false;
			this.lastStartTagName = "";
			this.active = false;
			this.state = State.DATA;
			this.returnState = State.DATA;
			this.entityStartPos = 0;
			this.consumedAfterSnapshot = -1;
			this.currentCharacterToken = null;
			this.currentToken = null;
			this.currentAttr = {
				name: "",
				value: ""
			};
			this.preprocessor = new Preprocessor(handler);
			this.currentLocation = this.getCurrentLocation(-1);
			this.entityDecoder = new EntityDecoder(htmlDecodeTree, (cp, consumed) => {
				this.preprocessor.pos = this.entityStartPos + consumed - 1;
				this._flushCodePointConsumedAsCharacterReference(cp);
			}, handler.onParseError ? {
				missingSemicolonAfterCharacterReference: () => {
					this._err(ERR.missingSemicolonAfterCharacterReference, 1);
				},
				absenceOfDigitsInNumericCharacterReference: (consumed) => {
					this._err(ERR.absenceOfDigitsInNumericCharacterReference, this.entityStartPos - this.preprocessor.pos + consumed);
				},
				validateNumericCharacterReference: (code) => {
					const error = getErrorForNumericCharacterReference(code);
					if (error) this._err(error, 1);
				}
			} : void 0);
		}
		_err(code, cpOffset = 0) {
			var _a, _b;
			(_b = (_a = this.handler).onParseError) === null || _b === void 0 || _b.call(_a, this.preprocessor.getError(code, cpOffset));
		}
		getCurrentLocation(offset) {
			if (!this.options.sourceCodeLocationInfo) return null;
			return {
				startLine: this.preprocessor.line,
				startCol: this.preprocessor.col - offset,
				startOffset: this.preprocessor.offset - offset,
				endLine: -1,
				endCol: -1,
				endOffset: -1
			};
		}
		_runParsingLoop() {
			if (this.inLoop) return;
			this.inLoop = true;
			while (this.active && !this.paused) {
				this.consumedAfterSnapshot = 0;
				const cp = this._consume();
				if (!this._ensureHibernation()) this._callState(cp);
			}
			this.inLoop = false;
		}
		pause() {
			this.paused = true;
		}
		resume(writeCallback) {
			if (!this.paused) throw new Error("Parser was already resumed");
			this.paused = false;
			if (this.inLoop) return;
			this._runParsingLoop();
			if (!this.paused) writeCallback === null || writeCallback === void 0 || writeCallback();
		}
		write(chunk, isLastChunk, writeCallback) {
			this.active = true;
			this.preprocessor.write(chunk, isLastChunk);
			this._runParsingLoop();
			if (!this.paused) writeCallback === null || writeCallback === void 0 || writeCallback();
		}
		insertHtmlAtCurrentPos(chunk) {
			this.active = true;
			this.preprocessor.insertHtmlAtCurrentPos(chunk);
			this._runParsingLoop();
		}
		_ensureHibernation() {
			if (this.preprocessor.endOfChunkHit) {
				this.preprocessor.retreat(this.consumedAfterSnapshot);
				this.consumedAfterSnapshot = 0;
				this.active = false;
				return true;
			}
			return false;
		}
		_consume() {
			this.consumedAfterSnapshot++;
			return this.preprocessor.advance();
		}
		_advanceBy(count) {
			this.consumedAfterSnapshot += count;
			for (let i = 0; i < count; i++) this.preprocessor.advance();
		}
		_consumeSequenceIfMatch(pattern, caseSensitive) {
			if (this.preprocessor.startsWith(pattern, caseSensitive)) {
				this._advanceBy(pattern.length - 1);
				return true;
			}
			return false;
		}
		_createStartTagToken() {
			this.currentToken = {
				type: TokenType.START_TAG,
				tagName: "",
				tagID: TAG_ID.UNKNOWN,
				selfClosing: false,
				ackSelfClosing: false,
				attrs: [],
				location: this.getCurrentLocation(1)
			};
		}
		_createEndTagToken() {
			this.currentToken = {
				type: TokenType.END_TAG,
				tagName: "",
				tagID: TAG_ID.UNKNOWN,
				selfClosing: false,
				ackSelfClosing: false,
				attrs: [],
				location: this.getCurrentLocation(2)
			};
		}
		_createCommentToken(offset) {
			this.currentToken = {
				type: TokenType.COMMENT,
				data: "",
				location: this.getCurrentLocation(offset)
			};
		}
		_createDoctypeToken(initialName) {
			this.currentToken = {
				type: TokenType.DOCTYPE,
				name: initialName,
				forceQuirks: false,
				publicId: null,
				systemId: null,
				location: this.currentLocation
			};
		}
		_createCharacterToken(type, chars) {
			this.currentCharacterToken = {
				type,
				chars,
				location: this.currentLocation
			};
		}
		_createAttr(attrNameFirstCh) {
			this.currentAttr = {
				name: attrNameFirstCh,
				value: ""
			};
			this.currentLocation = this.getCurrentLocation(0);
		}
		_leaveAttrName() {
			var _a;
			var _b;
			const token = this.currentToken;
			if (getTokenAttr(token, this.currentAttr.name) === null) {
				token.attrs.push(this.currentAttr);
				if (token.location && this.currentLocation) {
					const attrLocations = (_a = (_b = token.location).attrs) !== null && _a !== void 0 ? _a : _b.attrs = Object.create(null);
					attrLocations[this.currentAttr.name] = this.currentLocation;
					this._leaveAttrValue();
				}
			} else this._err(ERR.duplicateAttribute);
		}
		_leaveAttrValue() {
			if (this.currentLocation) {
				this.currentLocation.endLine = this.preprocessor.line;
				this.currentLocation.endCol = this.preprocessor.col;
				this.currentLocation.endOffset = this.preprocessor.offset;
			}
		}
		prepareToken(ct) {
			this._emitCurrentCharacterToken(ct.location);
			this.currentToken = null;
			if (ct.location) {
				ct.location.endLine = this.preprocessor.line;
				ct.location.endCol = this.preprocessor.col + 1;
				ct.location.endOffset = this.preprocessor.offset + 1;
			}
			this.currentLocation = this.getCurrentLocation(-1);
		}
		emitCurrentTagToken() {
			const ct = this.currentToken;
			this.prepareToken(ct);
			ct.tagID = getTagID(ct.tagName);
			if (ct.type === TokenType.START_TAG) {
				this.lastStartTagName = ct.tagName;
				this.handler.onStartTag(ct);
			} else {
				if (ct.attrs.length > 0) this._err(ERR.endTagWithAttributes);
				if (ct.selfClosing) this._err(ERR.endTagWithTrailingSolidus);
				this.handler.onEndTag(ct);
			}
			this.preprocessor.dropParsedChunk();
		}
		emitCurrentComment(ct) {
			this.prepareToken(ct);
			this.handler.onComment(ct);
			this.preprocessor.dropParsedChunk();
		}
		emitCurrentDoctype(ct) {
			this.prepareToken(ct);
			this.handler.onDoctype(ct);
			this.preprocessor.dropParsedChunk();
		}
		_emitCurrentCharacterToken(nextLocation) {
			if (this.currentCharacterToken) {
				if (nextLocation && this.currentCharacterToken.location) {
					this.currentCharacterToken.location.endLine = nextLocation.startLine;
					this.currentCharacterToken.location.endCol = nextLocation.startCol;
					this.currentCharacterToken.location.endOffset = nextLocation.startOffset;
				}
				switch (this.currentCharacterToken.type) {
					case TokenType.CHARACTER:
						this.handler.onCharacter(this.currentCharacterToken);
						break;
					case TokenType.NULL_CHARACTER:
						this.handler.onNullCharacter(this.currentCharacterToken);
						break;
					case TokenType.WHITESPACE_CHARACTER: this.handler.onWhitespaceCharacter(this.currentCharacterToken);
				}
				this.currentCharacterToken = null;
			}
		}
		_emitEOFToken() {
			const location = this.getCurrentLocation(0);
			if (location) {
				location.endLine = location.startLine;
				location.endCol = location.startCol;
				location.endOffset = location.startOffset;
			}
			this._emitCurrentCharacterToken(location);
			this.handler.onEof({
				type: TokenType.EOF,
				location
			});
			this.active = false;
		}
		_appendCharToCurrentCharacterToken(type, ch) {
			if (this.currentCharacterToken) {
				if (this.currentCharacterToken.type === type) {
					this.currentCharacterToken.chars += ch;
					return;
				} else {
					this.currentLocation = this.getCurrentLocation(0);
					this._emitCurrentCharacterToken(this.currentLocation);
					this.preprocessor.dropParsedChunk();
				}
			}
			this._createCharacterToken(type, ch);
		}
		_emitCodePoint(cp) {
			const type = isWhitespace$1(cp) ? TokenType.WHITESPACE_CHARACTER : cp === CODE_POINTS.NULL ? TokenType.NULL_CHARACTER : TokenType.CHARACTER;
			this._appendCharToCurrentCharacterToken(type, cp < 65536 ? String.fromCharCode(cp) : String.fromCodePoint(cp));
		}
		_emitChars(ch) {
			this._appendCharToCurrentCharacterToken(TokenType.CHARACTER, ch);
		}
		_startCharacterReference() {
			this.returnState = this.state;
			this.state = State.CHARACTER_REFERENCE;
			this.entityStartPos = this.preprocessor.pos;
			this.entityDecoder.startEntity(this._isCharacterReferenceInAttribute() ? DecodingMode.Attribute : DecodingMode.Legacy);
		}
		_isCharacterReferenceInAttribute() {
			return this.returnState === State.ATTRIBUTE_VALUE_DOUBLE_QUOTED || this.returnState === State.ATTRIBUTE_VALUE_SINGLE_QUOTED || this.returnState === State.ATTRIBUTE_VALUE_UNQUOTED;
		}
		_flushCodePointConsumedAsCharacterReference(cp) {
			if (this._isCharacterReferenceInAttribute()) this.currentAttr.value += String.fromCodePoint(cp);
			else this._emitCodePoint(cp);
		}
		_callState(cp) {
			switch (this.state) {
				case State.DATA:
					this._stateData(cp);
					break;
				case State.RCDATA:
					this._stateRcdata(cp);
					break;
				case State.RAWTEXT:
					this._stateRawtext(cp);
					break;
				case State.SCRIPT_DATA:
					this._stateScriptData(cp);
					break;
				case State.PLAINTEXT:
					this._statePlaintext(cp);
					break;
				case State.TAG_OPEN:
					this._stateTagOpen(cp);
					break;
				case State.END_TAG_OPEN:
					this._stateEndTagOpen(cp);
					break;
				case State.TAG_NAME:
					this._stateTagName(cp);
					break;
				case State.RCDATA_LESS_THAN_SIGN:
					this._stateRcdataLessThanSign(cp);
					break;
				case State.RCDATA_END_TAG_OPEN:
					this._stateRcdataEndTagOpen(cp);
					break;
				case State.RCDATA_END_TAG_NAME:
					this._stateRcdataEndTagName(cp);
					break;
				case State.RAWTEXT_LESS_THAN_SIGN:
					this._stateRawtextLessThanSign(cp);
					break;
				case State.RAWTEXT_END_TAG_OPEN:
					this._stateRawtextEndTagOpen(cp);
					break;
				case State.RAWTEXT_END_TAG_NAME:
					this._stateRawtextEndTagName(cp);
					break;
				case State.SCRIPT_DATA_LESS_THAN_SIGN:
					this._stateScriptDataLessThanSign(cp);
					break;
				case State.SCRIPT_DATA_END_TAG_OPEN:
					this._stateScriptDataEndTagOpen(cp);
					break;
				case State.SCRIPT_DATA_END_TAG_NAME:
					this._stateScriptDataEndTagName(cp);
					break;
				case State.SCRIPT_DATA_ESCAPE_START:
					this._stateScriptDataEscapeStart(cp);
					break;
				case State.SCRIPT_DATA_ESCAPE_START_DASH:
					this._stateScriptDataEscapeStartDash(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED:
					this._stateScriptDataEscaped(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED_DASH:
					this._stateScriptDataEscapedDash(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED_DASH_DASH:
					this._stateScriptDataEscapedDashDash(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN:
					this._stateScriptDataEscapedLessThanSign(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:
					this._stateScriptDataEscapedEndTagOpen(cp);
					break;
				case State.SCRIPT_DATA_ESCAPED_END_TAG_NAME:
					this._stateScriptDataEscapedEndTagName(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPE_START:
					this._stateScriptDataDoubleEscapeStart(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPED:
					this._stateScriptDataDoubleEscaped(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH:
					this._stateScriptDataDoubleEscapedDash(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH:
					this._stateScriptDataDoubleEscapedDashDash(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN:
					this._stateScriptDataDoubleEscapedLessThanSign(cp);
					break;
				case State.SCRIPT_DATA_DOUBLE_ESCAPE_END:
					this._stateScriptDataDoubleEscapeEnd(cp);
					break;
				case State.BEFORE_ATTRIBUTE_NAME:
					this._stateBeforeAttributeName(cp);
					break;
				case State.ATTRIBUTE_NAME:
					this._stateAttributeName(cp);
					break;
				case State.AFTER_ATTRIBUTE_NAME:
					this._stateAfterAttributeName(cp);
					break;
				case State.BEFORE_ATTRIBUTE_VALUE:
					this._stateBeforeAttributeValue(cp);
					break;
				case State.ATTRIBUTE_VALUE_DOUBLE_QUOTED:
					this._stateAttributeValueDoubleQuoted(cp);
					break;
				case State.ATTRIBUTE_VALUE_SINGLE_QUOTED:
					this._stateAttributeValueSingleQuoted(cp);
					break;
				case State.ATTRIBUTE_VALUE_UNQUOTED:
					this._stateAttributeValueUnquoted(cp);
					break;
				case State.AFTER_ATTRIBUTE_VALUE_QUOTED:
					this._stateAfterAttributeValueQuoted(cp);
					break;
				case State.SELF_CLOSING_START_TAG:
					this._stateSelfClosingStartTag(cp);
					break;
				case State.BOGUS_COMMENT:
					this._stateBogusComment(cp);
					break;
				case State.MARKUP_DECLARATION_OPEN:
					this._stateMarkupDeclarationOpen(cp);
					break;
				case State.COMMENT_START:
					this._stateCommentStart(cp);
					break;
				case State.COMMENT_START_DASH:
					this._stateCommentStartDash(cp);
					break;
				case State.COMMENT:
					this._stateComment(cp);
					break;
				case State.COMMENT_LESS_THAN_SIGN:
					this._stateCommentLessThanSign(cp);
					break;
				case State.COMMENT_LESS_THAN_SIGN_BANG:
					this._stateCommentLessThanSignBang(cp);
					break;
				case State.COMMENT_LESS_THAN_SIGN_BANG_DASH:
					this._stateCommentLessThanSignBangDash(cp);
					break;
				case State.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH:
					this._stateCommentLessThanSignBangDashDash(cp);
					break;
				case State.COMMENT_END_DASH:
					this._stateCommentEndDash(cp);
					break;
				case State.COMMENT_END:
					this._stateCommentEnd(cp);
					break;
				case State.COMMENT_END_BANG:
					this._stateCommentEndBang(cp);
					break;
				case State.DOCTYPE:
					this._stateDoctype(cp);
					break;
				case State.BEFORE_DOCTYPE_NAME:
					this._stateBeforeDoctypeName(cp);
					break;
				case State.DOCTYPE_NAME:
					this._stateDoctypeName(cp);
					break;
				case State.AFTER_DOCTYPE_NAME:
					this._stateAfterDoctypeName(cp);
					break;
				case State.AFTER_DOCTYPE_PUBLIC_KEYWORD:
					this._stateAfterDoctypePublicKeyword(cp);
					break;
				case State.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER:
					this._stateBeforeDoctypePublicIdentifier(cp);
					break;
				case State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED:
					this._stateDoctypePublicIdentifierDoubleQuoted(cp);
					break;
				case State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED:
					this._stateDoctypePublicIdentifierSingleQuoted(cp);
					break;
				case State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER:
					this._stateAfterDoctypePublicIdentifier(cp);
					break;
				case State.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS:
					this._stateBetweenDoctypePublicAndSystemIdentifiers(cp);
					break;
				case State.AFTER_DOCTYPE_SYSTEM_KEYWORD:
					this._stateAfterDoctypeSystemKeyword(cp);
					break;
				case State.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER:
					this._stateBeforeDoctypeSystemIdentifier(cp);
					break;
				case State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED:
					this._stateDoctypeSystemIdentifierDoubleQuoted(cp);
					break;
				case State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED:
					this._stateDoctypeSystemIdentifierSingleQuoted(cp);
					break;
				case State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER:
					this._stateAfterDoctypeSystemIdentifier(cp);
					break;
				case State.BOGUS_DOCTYPE:
					this._stateBogusDoctype(cp);
					break;
				case State.CDATA_SECTION:
					this._stateCdataSection(cp);
					break;
				case State.CDATA_SECTION_BRACKET:
					this._stateCdataSectionBracket(cp);
					break;
				case State.CDATA_SECTION_END:
					this._stateCdataSectionEnd(cp);
					break;
				case State.CHARACTER_REFERENCE:
					this._stateCharacterReference();
					break;
				case State.AMBIGUOUS_AMPERSAND:
					this._stateAmbiguousAmpersand(cp);
					break;
				default: throw new Error("Unknown state");
			}
		}
		_stateData(cp) {
			switch (cp) {
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.TAG_OPEN;
					break;
				case CODE_POINTS.AMPERSAND:
					this._startCharacterReference();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitCodePoint(cp);
					break;
				case CODE_POINTS.EOF:
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateRcdata(cp) {
			switch (cp) {
				case CODE_POINTS.AMPERSAND:
					this._startCharacterReference();
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.RCDATA_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateRawtext(cp) {
			switch (cp) {
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.RAWTEXT_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateScriptData(cp) {
			switch (cp) {
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_statePlaintext(cp) {
			switch (cp) {
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this._createStartTagToken();
				this.state = State.TAG_NAME;
				this._stateTagName(cp);
			} else switch (cp) {
				case CODE_POINTS.EXCLAMATION_MARK:
					this.state = State.MARKUP_DECLARATION_OPEN;
					break;
				case CODE_POINTS.SOLIDUS:
					this.state = State.END_TAG_OPEN;
					break;
				case CODE_POINTS.QUESTION_MARK:
					this._err(ERR.unexpectedQuestionMarkInsteadOfTagName);
					this._createCommentToken(1);
					this.state = State.BOGUS_COMMENT;
					this._stateBogusComment(cp);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofBeforeTagName);
					this._emitChars("<");
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.invalidFirstCharacterOfTagName);
					this._emitChars("<");
					this.state = State.DATA;
					this._stateData(cp);
			}
		}
		_stateEndTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this._createEndTagToken();
				this.state = State.TAG_NAME;
				this._stateTagName(cp);
			} else switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingEndTagName);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofBeforeTagName);
					this._emitChars("</");
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.invalidFirstCharacterOfTagName);
					this._createCommentToken(2);
					this.state = State.BOGUS_COMMENT;
					this._stateBogusComment(cp);
			}
		}
		_stateTagName(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					break;
				case CODE_POINTS.SOLIDUS:
					this.state = State.SELF_CLOSING_START_TAG;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.tagName += "�";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default: token.tagName += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
			}
		}
		_stateRcdataLessThanSign(cp) {
			if (cp === CODE_POINTS.SOLIDUS) this.state = State.RCDATA_END_TAG_OPEN;
			else {
				this._emitChars("<");
				this.state = State.RCDATA;
				this._stateRcdata(cp);
			}
		}
		_stateRcdataEndTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this.state = State.RCDATA_END_TAG_NAME;
				this._stateRcdataEndTagName(cp);
			} else {
				this._emitChars("</");
				this.state = State.RCDATA;
				this._stateRcdata(cp);
			}
		}
		handleSpecialEndTag(_cp) {
			if (!this.preprocessor.startsWith(this.lastStartTagName, false)) return !this._ensureHibernation();
			this._createEndTagToken();
			const token = this.currentToken;
			token.tagName = this.lastStartTagName;
			switch (this.preprocessor.peek(this.lastStartTagName.length)) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this._advanceBy(this.lastStartTagName.length);
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					return false;
				case CODE_POINTS.SOLIDUS:
					this._advanceBy(this.lastStartTagName.length);
					this.state = State.SELF_CLOSING_START_TAG;
					return false;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._advanceBy(this.lastStartTagName.length);
					this.emitCurrentTagToken();
					this.state = State.DATA;
					return false;
				default: return !this._ensureHibernation();
			}
		}
		_stateRcdataEndTagName(cp) {
			if (this.handleSpecialEndTag(cp)) {
				this._emitChars("</");
				this.state = State.RCDATA;
				this._stateRcdata(cp);
			}
		}
		_stateRawtextLessThanSign(cp) {
			if (cp === CODE_POINTS.SOLIDUS) this.state = State.RAWTEXT_END_TAG_OPEN;
			else {
				this._emitChars("<");
				this.state = State.RAWTEXT;
				this._stateRawtext(cp);
			}
		}
		_stateRawtextEndTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this.state = State.RAWTEXT_END_TAG_NAME;
				this._stateRawtextEndTagName(cp);
			} else {
				this._emitChars("</");
				this.state = State.RAWTEXT;
				this._stateRawtext(cp);
			}
		}
		_stateRawtextEndTagName(cp) {
			if (this.handleSpecialEndTag(cp)) {
				this._emitChars("</");
				this.state = State.RAWTEXT;
				this._stateRawtext(cp);
			}
		}
		_stateScriptDataLessThanSign(cp) {
			switch (cp) {
				case CODE_POINTS.SOLIDUS:
					this.state = State.SCRIPT_DATA_END_TAG_OPEN;
					break;
				case CODE_POINTS.EXCLAMATION_MARK:
					this.state = State.SCRIPT_DATA_ESCAPE_START;
					this._emitChars("<!");
					break;
				default:
					this._emitChars("<");
					this.state = State.SCRIPT_DATA;
					this._stateScriptData(cp);
			}
		}
		_stateScriptDataEndTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this.state = State.SCRIPT_DATA_END_TAG_NAME;
				this._stateScriptDataEndTagName(cp);
			} else {
				this._emitChars("</");
				this.state = State.SCRIPT_DATA;
				this._stateScriptData(cp);
			}
		}
		_stateScriptDataEndTagName(cp) {
			if (this.handleSpecialEndTag(cp)) {
				this._emitChars("</");
				this.state = State.SCRIPT_DATA;
				this._stateScriptData(cp);
			}
		}
		_stateScriptDataEscapeStart(cp) {
			if (cp === CODE_POINTS.HYPHEN_MINUS) {
				this.state = State.SCRIPT_DATA_ESCAPE_START_DASH;
				this._emitChars("-");
			} else {
				this.state = State.SCRIPT_DATA;
				this._stateScriptData(cp);
			}
		}
		_stateScriptDataEscapeStartDash(cp) {
			if (cp === CODE_POINTS.HYPHEN_MINUS) {
				this.state = State.SCRIPT_DATA_ESCAPED_DASH_DASH;
				this._emitChars("-");
			} else {
				this.state = State.SCRIPT_DATA;
				this._stateScriptData(cp);
			}
		}
		_stateScriptDataEscaped(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.SCRIPT_DATA_ESCAPED_DASH;
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateScriptDataEscapedDash(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.SCRIPT_DATA_ESCAPED_DASH_DASH;
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.state = State.SCRIPT_DATA_ESCAPED;
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default:
					this.state = State.SCRIPT_DATA_ESCAPED;
					this._emitCodePoint(cp);
			}
		}
		_stateScriptDataEscapedDashDash(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.SCRIPT_DATA;
					this._emitChars(">");
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.state = State.SCRIPT_DATA_ESCAPED;
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default:
					this.state = State.SCRIPT_DATA_ESCAPED;
					this._emitCodePoint(cp);
			}
		}
		_stateScriptDataEscapedLessThanSign(cp) {
			if (cp === CODE_POINTS.SOLIDUS) this.state = State.SCRIPT_DATA_ESCAPED_END_TAG_OPEN;
			else if (isAsciiLetter(cp)) {
				this._emitChars("<");
				this.state = State.SCRIPT_DATA_DOUBLE_ESCAPE_START;
				this._stateScriptDataDoubleEscapeStart(cp);
			} else {
				this._emitChars("<");
				this.state = State.SCRIPT_DATA_ESCAPED;
				this._stateScriptDataEscaped(cp);
			}
		}
		_stateScriptDataEscapedEndTagOpen(cp) {
			if (isAsciiLetter(cp)) {
				this.state = State.SCRIPT_DATA_ESCAPED_END_TAG_NAME;
				this._stateScriptDataEscapedEndTagName(cp);
			} else {
				this._emitChars("</");
				this.state = State.SCRIPT_DATA_ESCAPED;
				this._stateScriptDataEscaped(cp);
			}
		}
		_stateScriptDataEscapedEndTagName(cp) {
			if (this.handleSpecialEndTag(cp)) {
				this._emitChars("</");
				this.state = State.SCRIPT_DATA_ESCAPED;
				this._stateScriptDataEscaped(cp);
			}
		}
		_stateScriptDataDoubleEscapeStart(cp) {
			if (this.preprocessor.startsWith(SEQUENCES.SCRIPT, false) && isScriptDataDoubleEscapeSequenceEnd(this.preprocessor.peek(SEQUENCES.SCRIPT.length))) {
				this._emitCodePoint(cp);
				for (let i = 0; i < SEQUENCES.SCRIPT.length; i++) this._emitCodePoint(this._consume());
				this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
			} else if (!this._ensureHibernation()) {
				this.state = State.SCRIPT_DATA_ESCAPED;
				this._stateScriptDataEscaped(cp);
			}
		}
		_stateScriptDataDoubleEscaped(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH;
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
					this._emitChars("<");
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateScriptDataDoubleEscapedDash(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH;
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
					this._emitChars("<");
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
					this._emitCodePoint(cp);
			}
		}
		_stateScriptDataDoubleEscapedDashDash(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this._emitChars("-");
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN;
					this._emitChars("<");
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.SCRIPT_DATA;
					this._emitChars(">");
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
					this._emitChars("�");
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInScriptHtmlCommentLikeText);
					this._emitEOFToken();
					break;
				default:
					this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
					this._emitCodePoint(cp);
			}
		}
		_stateScriptDataDoubleEscapedLessThanSign(cp) {
			if (cp === CODE_POINTS.SOLIDUS) {
				this.state = State.SCRIPT_DATA_DOUBLE_ESCAPE_END;
				this._emitChars("/");
			} else {
				this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
				this._stateScriptDataDoubleEscaped(cp);
			}
		}
		_stateScriptDataDoubleEscapeEnd(cp) {
			if (this.preprocessor.startsWith(SEQUENCES.SCRIPT, false) && isScriptDataDoubleEscapeSequenceEnd(this.preprocessor.peek(SEQUENCES.SCRIPT.length))) {
				this._emitCodePoint(cp);
				for (let i = 0; i < SEQUENCES.SCRIPT.length; i++) this._emitCodePoint(this._consume());
				this.state = State.SCRIPT_DATA_ESCAPED;
			} else if (!this._ensureHibernation()) {
				this.state = State.SCRIPT_DATA_DOUBLE_ESCAPED;
				this._stateScriptDataDoubleEscaped(cp);
			}
		}
		_stateBeforeAttributeName(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.SOLIDUS:
				case CODE_POINTS.GREATER_THAN_SIGN:
				case CODE_POINTS.EOF:
					this.state = State.AFTER_ATTRIBUTE_NAME;
					this._stateAfterAttributeName(cp);
					break;
				case CODE_POINTS.EQUALS_SIGN:
					this._err(ERR.unexpectedEqualsSignBeforeAttributeName);
					this._createAttr("=");
					this.state = State.ATTRIBUTE_NAME;
					break;
				default:
					this._createAttr("");
					this.state = State.ATTRIBUTE_NAME;
					this._stateAttributeName(cp);
			}
		}
		_stateAttributeName(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
				case CODE_POINTS.SOLIDUS:
				case CODE_POINTS.GREATER_THAN_SIGN:
				case CODE_POINTS.EOF:
					this._leaveAttrName();
					this.state = State.AFTER_ATTRIBUTE_NAME;
					this._stateAfterAttributeName(cp);
					break;
				case CODE_POINTS.EQUALS_SIGN:
					this._leaveAttrName();
					this.state = State.BEFORE_ATTRIBUTE_VALUE;
					break;
				case CODE_POINTS.QUOTATION_MARK:
				case CODE_POINTS.APOSTROPHE:
				case CODE_POINTS.LESS_THAN_SIGN:
					this._err(ERR.unexpectedCharacterInAttributeName);
					this.currentAttr.name += String.fromCodePoint(cp);
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.currentAttr.name += "�";
					break;
				default: this.currentAttr.name += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
			}
		}
		_stateAfterAttributeName(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.SOLIDUS:
					this.state = State.SELF_CLOSING_START_TAG;
					break;
				case CODE_POINTS.EQUALS_SIGN:
					this.state = State.BEFORE_ATTRIBUTE_VALUE;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default:
					this._createAttr("");
					this.state = State.ATTRIBUTE_NAME;
					this._stateAttributeName(cp);
			}
		}
		_stateBeforeAttributeValue(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.QUOTATION_MARK:
					this.state = State.ATTRIBUTE_VALUE_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					this.state = State.ATTRIBUTE_VALUE_SINGLE_QUOTED;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingAttributeValue);
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				default:
					this.state = State.ATTRIBUTE_VALUE_UNQUOTED;
					this._stateAttributeValueUnquoted(cp);
			}
		}
		_stateAttributeValueDoubleQuoted(cp) {
			switch (cp) {
				case CODE_POINTS.QUOTATION_MARK:
					this.state = State.AFTER_ATTRIBUTE_VALUE_QUOTED;
					break;
				case CODE_POINTS.AMPERSAND:
					this._startCharacterReference();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.currentAttr.value += "�";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default: this.currentAttr.value += String.fromCodePoint(cp);
			}
		}
		_stateAttributeValueSingleQuoted(cp) {
			switch (cp) {
				case CODE_POINTS.APOSTROPHE:
					this.state = State.AFTER_ATTRIBUTE_VALUE_QUOTED;
					break;
				case CODE_POINTS.AMPERSAND:
					this._startCharacterReference();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.currentAttr.value += "�";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default: this.currentAttr.value += String.fromCodePoint(cp);
			}
		}
		_stateAttributeValueUnquoted(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this._leaveAttrValue();
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					break;
				case CODE_POINTS.AMPERSAND:
					this._startCharacterReference();
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._leaveAttrValue();
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this.currentAttr.value += "�";
					break;
				case CODE_POINTS.QUOTATION_MARK:
				case CODE_POINTS.APOSTROPHE:
				case CODE_POINTS.LESS_THAN_SIGN:
				case CODE_POINTS.EQUALS_SIGN:
				case CODE_POINTS.GRAVE_ACCENT:
					this._err(ERR.unexpectedCharacterInUnquotedAttributeValue);
					this.currentAttr.value += String.fromCodePoint(cp);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default: this.currentAttr.value += String.fromCodePoint(cp);
			}
		}
		_stateAfterAttributeValueQuoted(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this._leaveAttrValue();
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					break;
				case CODE_POINTS.SOLIDUS:
					this._leaveAttrValue();
					this.state = State.SELF_CLOSING_START_TAG;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._leaveAttrValue();
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingWhitespaceBetweenAttributes);
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					this._stateBeforeAttributeName(cp);
			}
		}
		_stateSelfClosingStartTag(cp) {
			switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN: {
					const token = this.currentToken;
					token.selfClosing = true;
					this.state = State.DATA;
					this.emitCurrentTagToken();
					break;
				}
				case CODE_POINTS.EOF:
					this._err(ERR.eofInTag);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.unexpectedSolidusInTag);
					this.state = State.BEFORE_ATTRIBUTE_NAME;
					this._stateBeforeAttributeName(cp);
			}
		}
		_stateBogusComment(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentComment(token);
					break;
				case CODE_POINTS.EOF:
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.data += "�";
					break;
				default: token.data += String.fromCodePoint(cp);
			}
		}
		_stateMarkupDeclarationOpen(cp) {
			if (this._consumeSequenceIfMatch(SEQUENCES.DASH_DASH, true)) {
				this._createCommentToken(SEQUENCES.DASH_DASH.length + 1);
				this.state = State.COMMENT_START;
			} else if (this._consumeSequenceIfMatch(SEQUENCES.DOCTYPE, false)) {
				this.currentLocation = this.getCurrentLocation(SEQUENCES.DOCTYPE.length + 1);
				this.state = State.DOCTYPE;
			} else if (this._consumeSequenceIfMatch(SEQUENCES.CDATA_START, true)) {
				if (this.inForeignNode) this.state = State.CDATA_SECTION;
				else {
					this._err(ERR.cdataInHtmlContent);
					this._createCommentToken(SEQUENCES.CDATA_START.length + 1);
					this.currentToken.data = "[CDATA[";
					this.state = State.BOGUS_COMMENT;
				}
			} else if (!this._ensureHibernation()) {
				this._err(ERR.incorrectlyOpenedComment);
				this._createCommentToken(2);
				this.state = State.BOGUS_COMMENT;
				this._stateBogusComment(cp);
			}
		}
		_stateCommentStart(cp) {
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.COMMENT_START_DASH;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN: {
					this._err(ERR.abruptClosingOfEmptyComment);
					this.state = State.DATA;
					const token = this.currentToken;
					this.emitCurrentComment(token);
					break;
				}
				default:
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateCommentStartDash(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.COMMENT_END;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.abruptClosingOfEmptyComment);
					this.state = State.DATA;
					this.emitCurrentComment(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInComment);
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				default:
					token.data += "-";
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateComment(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.COMMENT_END_DASH;
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					token.data += "<";
					this.state = State.COMMENT_LESS_THAN_SIGN;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.data += "�";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInComment);
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				default: token.data += String.fromCodePoint(cp);
			}
		}
		_stateCommentLessThanSign(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.EXCLAMATION_MARK:
					token.data += "!";
					this.state = State.COMMENT_LESS_THAN_SIGN_BANG;
					break;
				case CODE_POINTS.LESS_THAN_SIGN:
					token.data += "<";
					break;
				default:
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateCommentLessThanSignBang(cp) {
			if (cp === CODE_POINTS.HYPHEN_MINUS) this.state = State.COMMENT_LESS_THAN_SIGN_BANG_DASH;
			else {
				this.state = State.COMMENT;
				this._stateComment(cp);
			}
		}
		_stateCommentLessThanSignBangDash(cp) {
			if (cp === CODE_POINTS.HYPHEN_MINUS) this.state = State.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH;
			else {
				this.state = State.COMMENT_END_DASH;
				this._stateCommentEndDash(cp);
			}
		}
		_stateCommentLessThanSignBangDashDash(cp) {
			if (cp !== CODE_POINTS.GREATER_THAN_SIGN && cp !== CODE_POINTS.EOF) this._err(ERR.nestedComment);
			this.state = State.COMMENT_END;
			this._stateCommentEnd(cp);
		}
		_stateCommentEndDash(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					this.state = State.COMMENT_END;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInComment);
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				default:
					token.data += "-";
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateCommentEnd(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentComment(token);
					break;
				case CODE_POINTS.EXCLAMATION_MARK:
					this.state = State.COMMENT_END_BANG;
					break;
				case CODE_POINTS.HYPHEN_MINUS:
					token.data += "-";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInComment);
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				default:
					token.data += "--";
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateCommentEndBang(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.HYPHEN_MINUS:
					token.data += "--!";
					this.state = State.COMMENT_END_DASH;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.incorrectlyClosedComment);
					this.state = State.DATA;
					this.emitCurrentComment(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInComment);
					this.emitCurrentComment(token);
					this._emitEOFToken();
					break;
				default:
					token.data += "--!";
					this.state = State.COMMENT;
					this._stateComment(cp);
			}
		}
		_stateDoctype(cp) {
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.BEFORE_DOCTYPE_NAME;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.BEFORE_DOCTYPE_NAME;
					this._stateBeforeDoctypeName(cp);
					break;
				case CODE_POINTS.EOF: {
					this._err(ERR.eofInDoctype);
					this._createDoctypeToken(null);
					const token = this.currentToken;
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				}
				default:
					this._err(ERR.missingWhitespaceBeforeDoctypeName);
					this.state = State.BEFORE_DOCTYPE_NAME;
					this._stateBeforeDoctypeName(cp);
			}
		}
		_stateBeforeDoctypeName(cp) {
			if (isAsciiUpper(cp)) {
				this._createDoctypeToken(String.fromCharCode(toAsciiLower(cp)));
				this.state = State.DOCTYPE_NAME;
			} else switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					this._createDoctypeToken("�");
					this.state = State.DOCTYPE_NAME;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN: {
					this._err(ERR.missingDoctypeName);
					this._createDoctypeToken(null);
					const token = this.currentToken;
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				}
				case CODE_POINTS.EOF: {
					this._err(ERR.eofInDoctype);
					this._createDoctypeToken(null);
					const token = this.currentToken;
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				}
				default:
					this._createDoctypeToken(String.fromCodePoint(cp));
					this.state = State.DOCTYPE_NAME;
			}
		}
		_stateDoctypeName(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.AFTER_DOCTYPE_NAME;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.name += "�";
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: token.name += String.fromCodePoint(isAsciiUpper(cp) ? toAsciiLower(cp) : cp);
			}
		}
		_stateAfterDoctypeName(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: if (this._consumeSequenceIfMatch(SEQUENCES.PUBLIC, false)) this.state = State.AFTER_DOCTYPE_PUBLIC_KEYWORD;
				else if (this._consumeSequenceIfMatch(SEQUENCES.SYSTEM, false)) this.state = State.AFTER_DOCTYPE_SYSTEM_KEYWORD;
				else if (!this._ensureHibernation()) {
					this._err(ERR.invalidCharacterSequenceAfterDoctypeName);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
				}
			}
		}
		_stateAfterDoctypePublicKeyword(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER;
					break;
				case CODE_POINTS.QUOTATION_MARK:
					this._err(ERR.missingWhitespaceAfterDoctypePublicKeyword);
					token.publicId = "";
					this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					this._err(ERR.missingWhitespaceAfterDoctypePublicKeyword);
					token.publicId = "";
					this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateBeforeDoctypePublicIdentifier(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.QUOTATION_MARK:
					token.publicId = "";
					this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					token.publicId = "";
					this.state = State.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateDoctypePublicIdentifierDoubleQuoted(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.QUOTATION_MARK:
					this.state = State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.publicId += "�";
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.abruptDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: token.publicId += String.fromCodePoint(cp);
			}
		}
		_stateDoctypePublicIdentifierSingleQuoted(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.APOSTROPHE:
					this.state = State.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.publicId += "�";
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.abruptDoctypePublicIdentifier);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: token.publicId += String.fromCodePoint(cp);
			}
		}
		_stateAfterDoctypePublicIdentifier(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.QUOTATION_MARK:
					this._err(ERR.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers);
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					this._err(ERR.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers);
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateBetweenDoctypePublicAndSystemIdentifiers(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.QUOTATION_MARK:
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateAfterDoctypeSystemKeyword(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED:
					this.state = State.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER;
					break;
				case CODE_POINTS.QUOTATION_MARK:
					this._err(ERR.missingWhitespaceAfterDoctypeSystemKeyword);
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					this._err(ERR.missingWhitespaceAfterDoctypeSystemKeyword);
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateBeforeDoctypeSystemIdentifier(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.QUOTATION_MARK:
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED;
					break;
				case CODE_POINTS.APOSTROPHE:
					token.systemId = "";
					this.state = State.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED;
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.missingDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.DATA;
					this.emitCurrentDoctype(token);
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.missingQuoteBeforeDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateDoctypeSystemIdentifierDoubleQuoted(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.QUOTATION_MARK:
					this.state = State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.systemId += "�";
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.abruptDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: token.systemId += String.fromCodePoint(cp);
			}
		}
		_stateDoctypeSystemIdentifierSingleQuoted(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.APOSTROPHE:
					this.state = State.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					token.systemId += "�";
					break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this._err(ERR.abruptDoctypeSystemIdentifier);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default: token.systemId += String.fromCodePoint(cp);
			}
		}
		_stateAfterDoctypeSystemIdentifier(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.SPACE:
				case CODE_POINTS.LINE_FEED:
				case CODE_POINTS.TABULATION:
				case CODE_POINTS.FORM_FEED: break;
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInDoctype);
					token.forceQuirks = true;
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
					break;
				default:
					this._err(ERR.unexpectedCharacterAfterDoctypeSystemIdentifier);
					this.state = State.BOGUS_DOCTYPE;
					this._stateBogusDoctype(cp);
			}
		}
		_stateBogusDoctype(cp) {
			const token = this.currentToken;
			switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.emitCurrentDoctype(token);
					this.state = State.DATA;
					break;
				case CODE_POINTS.NULL:
					this._err(ERR.unexpectedNullCharacter);
					break;
				case CODE_POINTS.EOF:
					this.emitCurrentDoctype(token);
					this._emitEOFToken();
			}
		}
		_stateCdataSection(cp) {
			switch (cp) {
				case CODE_POINTS.RIGHT_SQUARE_BRACKET:
					this.state = State.CDATA_SECTION_BRACKET;
					break;
				case CODE_POINTS.EOF:
					this._err(ERR.eofInCdata);
					this._emitEOFToken();
					break;
				default: this._emitCodePoint(cp);
			}
		}
		_stateCdataSectionBracket(cp) {
			if (cp === CODE_POINTS.RIGHT_SQUARE_BRACKET) this.state = State.CDATA_SECTION_END;
			else {
				this._emitChars("]");
				this.state = State.CDATA_SECTION;
				this._stateCdataSection(cp);
			}
		}
		_stateCdataSectionEnd(cp) {
			switch (cp) {
				case CODE_POINTS.GREATER_THAN_SIGN:
					this.state = State.DATA;
					break;
				case CODE_POINTS.RIGHT_SQUARE_BRACKET:
					this._emitChars("]");
					break;
				default:
					this._emitChars("]]");
					this.state = State.CDATA_SECTION;
					this._stateCdataSection(cp);
			}
		}
		_stateCharacterReference() {
			let length = this.entityDecoder.write(this.preprocessor.html, this.preprocessor.pos);
			if (length < 0) {
				if (this.preprocessor.lastChunkWritten) length = this.entityDecoder.end();
				else {
					this.active = false;
					this.preprocessor.pos = this.preprocessor.html.length - 1;
					this.consumedAfterSnapshot = 0;
					this.preprocessor.endOfChunkHit = true;
					return;
				}
			}
			if (length === 0) {
				this.preprocessor.pos = this.entityStartPos;
				this._flushCodePointConsumedAsCharacterReference(CODE_POINTS.AMPERSAND);
				this.state = !this._isCharacterReferenceInAttribute() && isAsciiAlphaNumeric(this.preprocessor.peek(1)) ? State.AMBIGUOUS_AMPERSAND : this.returnState;
			} else this.state = this.returnState;
		}
		_stateAmbiguousAmpersand(cp) {
			if (isAsciiAlphaNumeric(cp)) this._flushCodePointConsumedAsCharacterReference(cp);
			else {
				if (cp === CODE_POINTS.SEMICOLON) this._err(ERR.unknownNamedCharacterReference);
				this.state = this.returnState;
				this._callState(cp);
			}
		}
	};
	//#endregion
	//#region node_modules/parse5/dist/parser/open-element-stack.js
	var IMPLICIT_END_TAG_REQUIRED = /* @__PURE__ */ new Set([
		TAG_ID.DD,
		TAG_ID.DT,
		TAG_ID.LI,
		TAG_ID.OPTGROUP,
		TAG_ID.OPTION,
		TAG_ID.P,
		TAG_ID.RB,
		TAG_ID.RP,
		TAG_ID.RT,
		TAG_ID.RTC
	]);
	var IMPLICIT_END_TAG_REQUIRED_THOROUGHLY = /* @__PURE__ */ new Set([
		...IMPLICIT_END_TAG_REQUIRED,
		TAG_ID.CAPTION,
		TAG_ID.COLGROUP,
		TAG_ID.TBODY,
		TAG_ID.TD,
		TAG_ID.TFOOT,
		TAG_ID.TH,
		TAG_ID.THEAD,
		TAG_ID.TR
	]);
	var SCOPING_ELEMENTS_HTML = /* @__PURE__ */ new Set([
		TAG_ID.APPLET,
		TAG_ID.CAPTION,
		TAG_ID.HTML,
		TAG_ID.MARQUEE,
		TAG_ID.OBJECT,
		TAG_ID.TABLE,
		TAG_ID.TD,
		TAG_ID.TEMPLATE,
		TAG_ID.TH
	]);
	var SCOPING_ELEMENTS_HTML_LIST = /* @__PURE__ */ new Set([
		...SCOPING_ELEMENTS_HTML,
		TAG_ID.OL,
		TAG_ID.UL
	]);
	var SCOPING_ELEMENTS_HTML_BUTTON = /* @__PURE__ */ new Set([...SCOPING_ELEMENTS_HTML, TAG_ID.BUTTON]);
	var SCOPING_ELEMENTS_MATHML = /* @__PURE__ */ new Set([
		TAG_ID.ANNOTATION_XML,
		TAG_ID.MI,
		TAG_ID.MN,
		TAG_ID.MO,
		TAG_ID.MS,
		TAG_ID.MTEXT
	]);
	var SCOPING_ELEMENTS_SVG = /* @__PURE__ */ new Set([
		TAG_ID.DESC,
		TAG_ID.FOREIGN_OBJECT,
		TAG_ID.TITLE
	]);
	var TABLE_ROW_CONTEXT = /* @__PURE__ */ new Set([
		TAG_ID.TR,
		TAG_ID.TEMPLATE,
		TAG_ID.HTML
	]);
	var TABLE_BODY_CONTEXT = /* @__PURE__ */ new Set([
		TAG_ID.TBODY,
		TAG_ID.TFOOT,
		TAG_ID.THEAD,
		TAG_ID.TEMPLATE,
		TAG_ID.HTML
	]);
	var TABLE_CONTEXT = /* @__PURE__ */ new Set([
		TAG_ID.TABLE,
		TAG_ID.TEMPLATE,
		TAG_ID.HTML
	]);
	var TABLE_CELLS = /* @__PURE__ */ new Set([TAG_ID.TD, TAG_ID.TH]);
	var OpenElementStack = class {
		get currentTmplContentOrNode() {
			return this._isInTemplate() ? this.treeAdapter.getTemplateContent(this.current) : this.current;
		}
		constructor(document, treeAdapter, handler) {
			this.treeAdapter = treeAdapter;
			this.handler = handler;
			this.items = [];
			this.tagIDs = [];
			this.stackTop = -1;
			this.tmplCount = 0;
			this.currentTagId = TAG_ID.UNKNOWN;
			this.current = document;
		}
		_indexOf(element) {
			return this.items.lastIndexOf(element, this.stackTop);
		}
		_isInTemplate() {
			return this.currentTagId === TAG_ID.TEMPLATE && this.treeAdapter.getNamespaceURI(this.current) === NS.HTML;
		}
		_updateCurrentElement() {
			this.current = this.items[this.stackTop];
			this.currentTagId = this.tagIDs[this.stackTop];
		}
		push(element, tagID) {
			this.stackTop++;
			this.items[this.stackTop] = element;
			this.current = element;
			this.tagIDs[this.stackTop] = tagID;
			this.currentTagId = tagID;
			if (this._isInTemplate()) this.tmplCount++;
			this.handler.onItemPush(element, tagID, true);
		}
		pop() {
			const popped = this.current;
			if (this.tmplCount > 0 && this._isInTemplate()) this.tmplCount--;
			this.stackTop--;
			this._updateCurrentElement();
			this.handler.onItemPop(popped, true);
		}
		replace(oldElement, newElement) {
			const idx = this._indexOf(oldElement);
			this.items[idx] = newElement;
			if (idx === this.stackTop) this.current = newElement;
		}
		insertAfter(referenceElement, newElement, newElementID) {
			const insertionIdx = this._indexOf(referenceElement) + 1;
			this.items.splice(insertionIdx, 0, newElement);
			this.tagIDs.splice(insertionIdx, 0, newElementID);
			this.stackTop++;
			if (insertionIdx === this.stackTop) this._updateCurrentElement();
			if (this.current && this.currentTagId !== void 0) this.handler.onItemPush(this.current, this.currentTagId, insertionIdx === this.stackTop);
		}
		popUntilTagNamePopped(tagName) {
			let targetIdx = this.stackTop + 1;
			do
				targetIdx = this.tagIDs.lastIndexOf(tagName, targetIdx - 1);
			while (targetIdx > 0 && this.treeAdapter.getNamespaceURI(this.items[targetIdx]) !== NS.HTML);
			this.shortenToLength(Math.max(targetIdx, 0));
		}
		shortenToLength(idx) {
			while (this.stackTop >= idx) {
				const popped = this.current;
				if (this.tmplCount > 0 && this._isInTemplate()) this.tmplCount -= 1;
				this.stackTop--;
				this._updateCurrentElement();
				this.handler.onItemPop(popped, this.stackTop < idx);
			}
		}
		popUntilElementPopped(element) {
			const idx = this._indexOf(element);
			this.shortenToLength(Math.max(idx, 0));
		}
		popUntilPopped(tagNames, targetNS) {
			const idx = this._indexOfTagNames(tagNames, targetNS);
			this.shortenToLength(Math.max(idx, 0));
		}
		popUntilNumberedHeaderPopped() {
			this.popUntilPopped(NUMBERED_HEADERS, NS.HTML);
		}
		popUntilTableCellPopped() {
			this.popUntilPopped(TABLE_CELLS, NS.HTML);
		}
		popAllUpToHtmlElement() {
			this.tmplCount = 0;
			this.shortenToLength(1);
		}
		_indexOfTagNames(tagNames, namespace) {
			for (let i = this.stackTop; i >= 0; i--) if (tagNames.has(this.tagIDs[i]) && this.treeAdapter.getNamespaceURI(this.items[i]) === namespace) return i;
			return -1;
		}
		clearBackTo(tagNames, targetNS) {
			const idx = this._indexOfTagNames(tagNames, targetNS);
			this.shortenToLength(idx + 1);
		}
		clearBackToTableContext() {
			this.clearBackTo(TABLE_CONTEXT, NS.HTML);
		}
		clearBackToTableBodyContext() {
			this.clearBackTo(TABLE_BODY_CONTEXT, NS.HTML);
		}
		clearBackToTableRowContext() {
			this.clearBackTo(TABLE_ROW_CONTEXT, NS.HTML);
		}
		remove(element) {
			const idx = this._indexOf(element);
			if (idx >= 0) {
				if (idx === this.stackTop) this.pop();
				else {
					this.items.splice(idx, 1);
					this.tagIDs.splice(idx, 1);
					this.stackTop--;
					this._updateCurrentElement();
					this.handler.onItemPop(element, false);
				}
			}
		}
		tryPeekProperlyNestedBodyElement() {
			return this.stackTop >= 1 && this.tagIDs[1] === TAG_ID.BODY ? this.items[1] : null;
		}
		contains(element) {
			return this._indexOf(element) > -1;
		}
		getCommonAncestor(element) {
			const elementIdx = this._indexOf(element) - 1;
			return elementIdx >= 0 ? this.items[elementIdx] : null;
		}
		isRootHtmlElementCurrent() {
			return this.stackTop === 0 && this.tagIDs[0] === TAG_ID.HTML;
		}
		hasInDynamicScope(tagName, htmlScope) {
			for (let i = this.stackTop; i >= 0; i--) {
				const tn = this.tagIDs[i];
				switch (this.treeAdapter.getNamespaceURI(this.items[i])) {
					case NS.HTML:
						if (tn === tagName) return true;
						if (htmlScope.has(tn)) return false;
						break;
					case NS.SVG:
						if (SCOPING_ELEMENTS_SVG.has(tn)) return false;
						break;
					case NS.MATHML: if (SCOPING_ELEMENTS_MATHML.has(tn)) return false;
				}
			}
			return true;
		}
		hasInScope(tagName) {
			return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML);
		}
		hasInListItemScope(tagName) {
			return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML_LIST);
		}
		hasInButtonScope(tagName) {
			return this.hasInDynamicScope(tagName, SCOPING_ELEMENTS_HTML_BUTTON);
		}
		hasNumberedHeaderInScope() {
			for (let i = this.stackTop; i >= 0; i--) {
				const tn = this.tagIDs[i];
				switch (this.treeAdapter.getNamespaceURI(this.items[i])) {
					case NS.HTML:
						if (NUMBERED_HEADERS.has(tn)) return true;
						if (SCOPING_ELEMENTS_HTML.has(tn)) return false;
						break;
					case NS.SVG:
						if (SCOPING_ELEMENTS_SVG.has(tn)) return false;
						break;
					case NS.MATHML: if (SCOPING_ELEMENTS_MATHML.has(tn)) return false;
				}
			}
			return true;
		}
		hasInTableScope(tagName) {
			for (let i = this.stackTop; i >= 0; i--) {
				if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) continue;
				switch (this.tagIDs[i]) {
					case tagName: return true;
					case TAG_ID.TABLE:
					case TAG_ID.HTML: return false;
				}
			}
			return true;
		}
		hasTableBodyContextInTableScope() {
			for (let i = this.stackTop; i >= 0; i--) {
				if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) continue;
				switch (this.tagIDs[i]) {
					case TAG_ID.TBODY:
					case TAG_ID.THEAD:
					case TAG_ID.TFOOT: return true;
					case TAG_ID.TABLE:
					case TAG_ID.HTML: return false;
				}
			}
			return true;
		}
		hasInSelectScope(tagName) {
			for (let i = this.stackTop; i >= 0; i--) {
				if (this.treeAdapter.getNamespaceURI(this.items[i]) !== NS.HTML) continue;
				switch (this.tagIDs[i]) {
					case tagName: return true;
					case TAG_ID.OPTION:
					case TAG_ID.OPTGROUP: break;
					default: return false;
				}
			}
			return true;
		}
		generateImpliedEndTags() {
			while (this.currentTagId !== void 0 && IMPLICIT_END_TAG_REQUIRED.has(this.currentTagId)) this.pop();
		}
		generateImpliedEndTagsThoroughly() {
			while (this.currentTagId !== void 0 && IMPLICIT_END_TAG_REQUIRED_THOROUGHLY.has(this.currentTagId)) this.pop();
		}
		generateImpliedEndTagsWithExclusion(exclusionId) {
			while (this.currentTagId !== void 0 && this.currentTagId !== exclusionId && IMPLICIT_END_TAG_REQUIRED_THOROUGHLY.has(this.currentTagId)) this.pop();
		}
	};
	//#endregion
	//#region node_modules/parse5/dist/parser/formatting-element-list.js
	var NOAH_ARK_CAPACITY = 3;
	var EntryType;
	(function(EntryType) {
		EntryType[EntryType["Marker"] = 0] = "Marker";
		EntryType[EntryType["Element"] = 1] = "Element";
	})(EntryType || (EntryType = {}));
	var MARKER = { type: EntryType.Marker };
	var FormattingElementList = class {
		constructor(treeAdapter) {
			this.treeAdapter = treeAdapter;
			this.entries = [];
			this.bookmark = null;
		}
		_getNoahArkConditionCandidates(newElement, neAttrs) {
			const candidates = [];
			const neAttrsLength = neAttrs.length;
			const neTagName = this.treeAdapter.getTagName(newElement);
			const neNamespaceURI = this.treeAdapter.getNamespaceURI(newElement);
			for (let i = 0; i < this.entries.length; i++) {
				const entry = this.entries[i];
				if (entry.type === EntryType.Marker) break;
				const { element } = entry;
				if (this.treeAdapter.getTagName(element) === neTagName && this.treeAdapter.getNamespaceURI(element) === neNamespaceURI) {
					const elementAttrs = this.treeAdapter.getAttrList(element);
					if (elementAttrs.length === neAttrsLength) candidates.push({
						idx: i,
						attrs: elementAttrs
					});
				}
			}
			return candidates;
		}
		_ensureNoahArkCondition(newElement) {
			if (this.entries.length < NOAH_ARK_CAPACITY) return;
			const neAttrs = this.treeAdapter.getAttrList(newElement);
			const candidates = this._getNoahArkConditionCandidates(newElement, neAttrs);
			if (candidates.length < NOAH_ARK_CAPACITY) return;
			const neAttrsMap = new Map(neAttrs.map((neAttr) => [neAttr.name, neAttr.value]));
			let validCandidates = 0;
			for (let i = 0; i < candidates.length; i++) {
				const candidate = candidates[i];
				if (candidate.attrs.every((cAttr) => neAttrsMap.get(cAttr.name) === cAttr.value)) {
					validCandidates += 1;
					if (validCandidates >= NOAH_ARK_CAPACITY) this.entries.splice(candidate.idx, 1);
				}
			}
		}
		insertMarker() {
			this.entries.unshift(MARKER);
		}
		pushElement(element, token) {
			this._ensureNoahArkCondition(element);
			this.entries.unshift({
				type: EntryType.Element,
				element,
				token
			});
		}
		insertElementAfterBookmark(element, token) {
			const bookmarkIdx = this.entries.indexOf(this.bookmark);
			this.entries.splice(bookmarkIdx, 0, {
				type: EntryType.Element,
				element,
				token
			});
		}
		removeEntry(entry) {
			const entryIndex = this.entries.indexOf(entry);
			if (entryIndex !== -1) this.entries.splice(entryIndex, 1);
		}
		/**
		* Clears the list of formatting elements up to the last marker.
		*
		* @see https://html.spec.whatwg.org/multipage/parsing.html#clear-the-list-of-active-formatting-elements-up-to-the-last-marker
		*/
		clearToLastMarker() {
			const markerIdx = this.entries.indexOf(MARKER);
			if (markerIdx === -1) this.entries.length = 0;
			else this.entries.splice(0, markerIdx + 1);
		}
		getElementEntryInScopeWithTagName(tagName) {
			const entry = this.entries.find((entry) => entry.type === EntryType.Marker || this.treeAdapter.getTagName(entry.element) === tagName);
			return entry && entry.type === EntryType.Element ? entry : null;
		}
		getElementEntry(element) {
			return this.entries.find((entry) => entry.type === EntryType.Element && entry.element === element);
		}
	};
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/objectSpread2.js
	function ownKeys(e, r) {
		var t = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var o = Object.getOwnPropertySymbols(e);
			r && (o = o.filter(function(r) {
				return Object.getOwnPropertyDescriptor(e, r).enumerable;
			})), t.push.apply(t, o);
		}
		return t;
	}
	function _objectSpread2(e) {
		for (var r = 1; r < arguments.length; r++) {
			var t = null != arguments[r] ? arguments[r] : {};
			r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
				_defineProperty(e, r, t[r]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
				Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
			});
		}
		return e;
	}
	//#endregion
	//#region node_modules/parse5/dist/tree-adapters/default.js
	var defaultTreeAdapter = {
		createDocument() {
			return {
				nodeName: "#document",
				mode: DOCUMENT_MODE.NO_QUIRKS,
				childNodes: []
			};
		},
		createDocumentFragment() {
			return {
				nodeName: "#document-fragment",
				childNodes: []
			};
		},
		createElement(tagName, namespaceURI, attrs) {
			return {
				nodeName: tagName,
				tagName,
				attrs,
				namespaceURI,
				childNodes: [],
				parentNode: null
			};
		},
		createCommentNode(data) {
			return {
				nodeName: "#comment",
				data,
				parentNode: null
			};
		},
		createTextNode(value) {
			return {
				nodeName: "#text",
				value,
				parentNode: null
			};
		},
		appendChild(parentNode, newNode) {
			parentNode.childNodes.push(newNode);
			newNode.parentNode = parentNode;
		},
		insertBefore(parentNode, newNode, referenceNode) {
			const insertionIdx = parentNode.childNodes.indexOf(referenceNode);
			parentNode.childNodes.splice(insertionIdx, 0, newNode);
			newNode.parentNode = parentNode;
		},
		setTemplateContent(templateElement, contentElement) {
			templateElement.content = contentElement;
		},
		getTemplateContent(templateElement) {
			return templateElement.content;
		},
		setDocumentType(document, name, publicId, systemId) {
			const doctypeNode = document.childNodes.find((node) => node.nodeName === "#documentType");
			if (doctypeNode) {
				doctypeNode.name = name;
				doctypeNode.publicId = publicId;
				doctypeNode.systemId = systemId;
			} else {
				const node = {
					nodeName: "#documentType",
					name,
					publicId,
					systemId,
					parentNode: null
				};
				defaultTreeAdapter.appendChild(document, node);
			}
		},
		setDocumentMode(document, mode) {
			document.mode = mode;
		},
		getDocumentMode(document) {
			return document.mode;
		},
		detachNode(node) {
			if (node.parentNode) {
				const idx = node.parentNode.childNodes.indexOf(node);
				node.parentNode.childNodes.splice(idx, 1);
				node.parentNode = null;
			}
		},
		insertText(parentNode, text) {
			if (parentNode.childNodes.length > 0) {
				const prevNode = parentNode.childNodes[parentNode.childNodes.length - 1];
				if (defaultTreeAdapter.isTextNode(prevNode)) {
					prevNode.value += text;
					return;
				}
			}
			defaultTreeAdapter.appendChild(parentNode, defaultTreeAdapter.createTextNode(text));
		},
		insertTextBefore(parentNode, text, referenceNode) {
			const prevNode = parentNode.childNodes[parentNode.childNodes.indexOf(referenceNode) - 1];
			if (prevNode && defaultTreeAdapter.isTextNode(prevNode)) prevNode.value += text;
			else defaultTreeAdapter.insertBefore(parentNode, defaultTreeAdapter.createTextNode(text), referenceNode);
		},
		adoptAttributes(recipient, attrs) {
			const recipientAttrsMap = new Set(recipient.attrs.map((attr) => attr.name));
			for (let j = 0; j < attrs.length; j++) if (!recipientAttrsMap.has(attrs[j].name)) recipient.attrs.push(attrs[j]);
		},
		getFirstChild(node) {
			return node.childNodes[0];
		},
		getChildNodes(node) {
			return node.childNodes;
		},
		getParentNode(node) {
			return node.parentNode;
		},
		getAttrList(element) {
			return element.attrs;
		},
		getTagName(element) {
			return element.tagName;
		},
		getNamespaceURI(element) {
			return element.namespaceURI;
		},
		getTextNodeContent(textNode) {
			return textNode.value;
		},
		getCommentNodeContent(commentNode) {
			return commentNode.data;
		},
		getDocumentTypeNodeName(doctypeNode) {
			return doctypeNode.name;
		},
		getDocumentTypeNodePublicId(doctypeNode) {
			return doctypeNode.publicId;
		},
		getDocumentTypeNodeSystemId(doctypeNode) {
			return doctypeNode.systemId;
		},
		isTextNode(node) {
			return node.nodeName === "#text";
		},
		isCommentNode(node) {
			return node.nodeName === "#comment";
		},
		isDocumentTypeNode(node) {
			return node.nodeName === "#documentType";
		},
		isElementNode(node) {
			return Object.prototype.hasOwnProperty.call(node, "tagName");
		},
		setNodeSourceCodeLocation(node, location) {
			node.sourceCodeLocation = location;
		},
		getNodeSourceCodeLocation(node) {
			return node.sourceCodeLocation;
		},
		updateNodeSourceCodeLocation(node, endLocation) {
			node.sourceCodeLocation = _objectSpread2(_objectSpread2({}, node.sourceCodeLocation), endLocation);
		}
	};
	//#endregion
	//#region node_modules/parse5/dist/common/doctype.js
	var VALID_DOCTYPE_NAME = "html";
	var VALID_SYSTEM_ID = "about:legacy-compat";
	var QUIRKS_MODE_SYSTEM_ID = "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd";
	var QUIRKS_MODE_PUBLIC_ID_PREFIXES = [
		"+//silmaril//dtd html pro v0r11 19970101//",
		"-//as//dtd html 3.0 aswedit + extensions//",
		"-//advasoft ltd//dtd html 3.0 aswedit + extensions//",
		"-//ietf//dtd html 2.0 level 1//",
		"-//ietf//dtd html 2.0 level 2//",
		"-//ietf//dtd html 2.0 strict level 1//",
		"-//ietf//dtd html 2.0 strict level 2//",
		"-//ietf//dtd html 2.0 strict//",
		"-//ietf//dtd html 2.0//",
		"-//ietf//dtd html 2.1e//",
		"-//ietf//dtd html 3.0//",
		"-//ietf//dtd html 3.2 final//",
		"-//ietf//dtd html 3.2//",
		"-//ietf//dtd html 3//",
		"-//ietf//dtd html level 0//",
		"-//ietf//dtd html level 1//",
		"-//ietf//dtd html level 2//",
		"-//ietf//dtd html level 3//",
		"-//ietf//dtd html strict level 0//",
		"-//ietf//dtd html strict level 1//",
		"-//ietf//dtd html strict level 2//",
		"-//ietf//dtd html strict level 3//",
		"-//ietf//dtd html strict//",
		"-//ietf//dtd html//",
		"-//metrius//dtd metrius presentational//",
		"-//microsoft//dtd internet explorer 2.0 html strict//",
		"-//microsoft//dtd internet explorer 2.0 html//",
		"-//microsoft//dtd internet explorer 2.0 tables//",
		"-//microsoft//dtd internet explorer 3.0 html strict//",
		"-//microsoft//dtd internet explorer 3.0 html//",
		"-//microsoft//dtd internet explorer 3.0 tables//",
		"-//netscape comm. corp.//dtd html//",
		"-//netscape comm. corp.//dtd strict html//",
		"-//o'reilly and associates//dtd html 2.0//",
		"-//o'reilly and associates//dtd html extended 1.0//",
		"-//o'reilly and associates//dtd html extended relaxed 1.0//",
		"-//sq//dtd html 2.0 hotmetal + extensions//",
		"-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//",
		"-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//",
		"-//spyglass//dtd html 2.0 extended//",
		"-//sun microsystems corp.//dtd hotjava html//",
		"-//sun microsystems corp.//dtd hotjava strict html//",
		"-//w3c//dtd html 3 1995-03-24//",
		"-//w3c//dtd html 3.2 draft//",
		"-//w3c//dtd html 3.2 final//",
		"-//w3c//dtd html 3.2//",
		"-//w3c//dtd html 3.2s draft//",
		"-//w3c//dtd html 4.0 frameset//",
		"-//w3c//dtd html 4.0 transitional//",
		"-//w3c//dtd html experimental 19960712//",
		"-//w3c//dtd html experimental 970421//",
		"-//w3c//dtd w3 html//",
		"-//w3o//dtd w3 html 3.0//",
		"-//webtechs//dtd mozilla html 2.0//",
		"-//webtechs//dtd mozilla html//"
	];
	var QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
		...QUIRKS_MODE_PUBLIC_ID_PREFIXES,
		"-//w3c//dtd html 4.01 frameset//",
		"-//w3c//dtd html 4.01 transitional//"
	];
	var QUIRKS_MODE_PUBLIC_IDS = /* @__PURE__ */ new Set([
		"-//w3o//dtd w3 html strict 3.0//en//",
		"-/w3c/dtd html 4.0 transitional/en",
		"html"
	]);
	var LIMITED_QUIRKS_PUBLIC_ID_PREFIXES = ["-//w3c//dtd xhtml 1.0 frameset//", "-//w3c//dtd xhtml 1.0 transitional//"];
	var LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES = [
		...LIMITED_QUIRKS_PUBLIC_ID_PREFIXES,
		"-//w3c//dtd html 4.01 frameset//",
		"-//w3c//dtd html 4.01 transitional//"
	];
	function hasPrefix(publicId, prefixes) {
		return prefixes.some((prefix) => publicId.startsWith(prefix));
	}
	function isConforming(token) {
		return token.name === VALID_DOCTYPE_NAME && token.publicId === null && (token.systemId === null || token.systemId === VALID_SYSTEM_ID);
	}
	function getDocumentMode(token) {
		if (token.name !== VALID_DOCTYPE_NAME) return DOCUMENT_MODE.QUIRKS;
		const { systemId } = token;
		if (systemId && systemId.toLowerCase() === QUIRKS_MODE_SYSTEM_ID) return DOCUMENT_MODE.QUIRKS;
		let { publicId } = token;
		if (publicId !== null) {
			publicId = publicId.toLowerCase();
			if (QUIRKS_MODE_PUBLIC_IDS.has(publicId)) return DOCUMENT_MODE.QUIRKS;
			let prefixes = systemId === null ? QUIRKS_MODE_NO_SYSTEM_ID_PUBLIC_ID_PREFIXES : QUIRKS_MODE_PUBLIC_ID_PREFIXES;
			if (hasPrefix(publicId, prefixes)) return DOCUMENT_MODE.QUIRKS;
			prefixes = systemId === null ? LIMITED_QUIRKS_PUBLIC_ID_PREFIXES : LIMITED_QUIRKS_WITH_SYSTEM_ID_PUBLIC_ID_PREFIXES;
			if (hasPrefix(publicId, prefixes)) return DOCUMENT_MODE.LIMITED_QUIRKS;
		}
		return DOCUMENT_MODE.NO_QUIRKS;
	}
	//#endregion
	//#region node_modules/parse5/dist/common/foreign-content.js
	var MIME_TYPES = {
		TEXT_HTML: "text/html",
		APPLICATION_XML: "application/xhtml+xml"
	};
	var DEFINITION_URL_ATTR = "definitionurl";
	var ADJUSTED_DEFINITION_URL_ATTR = "definitionURL";
	var SVG_ATTRS_ADJUSTMENT_MAP = new Map([
		"attributeName",
		"attributeType",
		"baseFrequency",
		"baseProfile",
		"calcMode",
		"clipPathUnits",
		"diffuseConstant",
		"edgeMode",
		"filterUnits",
		"glyphRef",
		"gradientTransform",
		"gradientUnits",
		"kernelMatrix",
		"kernelUnitLength",
		"keyPoints",
		"keySplines",
		"keyTimes",
		"lengthAdjust",
		"limitingConeAngle",
		"markerHeight",
		"markerUnits",
		"markerWidth",
		"maskContentUnits",
		"maskUnits",
		"numOctaves",
		"pathLength",
		"patternContentUnits",
		"patternTransform",
		"patternUnits",
		"pointsAtX",
		"pointsAtY",
		"pointsAtZ",
		"preserveAlpha",
		"preserveAspectRatio",
		"primitiveUnits",
		"refX",
		"refY",
		"repeatCount",
		"repeatDur",
		"requiredExtensions",
		"requiredFeatures",
		"specularConstant",
		"specularExponent",
		"spreadMethod",
		"startOffset",
		"stdDeviation",
		"stitchTiles",
		"surfaceScale",
		"systemLanguage",
		"tableValues",
		"targetX",
		"targetY",
		"textLength",
		"viewBox",
		"viewTarget",
		"xChannelSelector",
		"yChannelSelector",
		"zoomAndPan"
	].map((attr) => [attr.toLowerCase(), attr]));
	var XML_ATTRS_ADJUSTMENT_MAP = /* @__PURE__ */ new Map([
		["xlink:actuate", {
			prefix: "xlink",
			name: "actuate",
			namespace: NS.XLINK
		}],
		["xlink:arcrole", {
			prefix: "xlink",
			name: "arcrole",
			namespace: NS.XLINK
		}],
		["xlink:href", {
			prefix: "xlink",
			name: "href",
			namespace: NS.XLINK
		}],
		["xlink:role", {
			prefix: "xlink",
			name: "role",
			namespace: NS.XLINK
		}],
		["xlink:show", {
			prefix: "xlink",
			name: "show",
			namespace: NS.XLINK
		}],
		["xlink:title", {
			prefix: "xlink",
			name: "title",
			namespace: NS.XLINK
		}],
		["xlink:type", {
			prefix: "xlink",
			name: "type",
			namespace: NS.XLINK
		}],
		["xml:lang", {
			prefix: "xml",
			name: "lang",
			namespace: NS.XML
		}],
		["xml:space", {
			prefix: "xml",
			name: "space",
			namespace: NS.XML
		}],
		["xmlns", {
			prefix: "",
			name: "xmlns",
			namespace: NS.XMLNS
		}],
		["xmlns:xlink", {
			prefix: "xmlns",
			name: "xlink",
			namespace: NS.XMLNS
		}]
	]);
	var SVG_TAG_NAMES_ADJUSTMENT_MAP = new Map([
		"altGlyph",
		"altGlyphDef",
		"altGlyphItem",
		"animateColor",
		"animateMotion",
		"animateTransform",
		"clipPath",
		"feBlend",
		"feColorMatrix",
		"feComponentTransfer",
		"feComposite",
		"feConvolveMatrix",
		"feDiffuseLighting",
		"feDisplacementMap",
		"feDistantLight",
		"feFlood",
		"feFuncA",
		"feFuncB",
		"feFuncG",
		"feFuncR",
		"feGaussianBlur",
		"feImage",
		"feMerge",
		"feMergeNode",
		"feMorphology",
		"feOffset",
		"fePointLight",
		"feSpecularLighting",
		"feSpotLight",
		"feTile",
		"feTurbulence",
		"foreignObject",
		"glyphRef",
		"linearGradient",
		"radialGradient",
		"textPath"
	].map((tn) => [tn.toLowerCase(), tn]));
	var EXITS_FOREIGN_CONTENT = /* @__PURE__ */ new Set([
		TAG_ID.B,
		TAG_ID.BIG,
		TAG_ID.BLOCKQUOTE,
		TAG_ID.BODY,
		TAG_ID.BR,
		TAG_ID.CENTER,
		TAG_ID.CODE,
		TAG_ID.DD,
		TAG_ID.DIV,
		TAG_ID.DL,
		TAG_ID.DT,
		TAG_ID.EM,
		TAG_ID.EMBED,
		TAG_ID.H1,
		TAG_ID.H2,
		TAG_ID.H3,
		TAG_ID.H4,
		TAG_ID.H5,
		TAG_ID.H6,
		TAG_ID.HEAD,
		TAG_ID.HR,
		TAG_ID.I,
		TAG_ID.IMG,
		TAG_ID.LI,
		TAG_ID.LISTING,
		TAG_ID.MENU,
		TAG_ID.META,
		TAG_ID.NOBR,
		TAG_ID.OL,
		TAG_ID.P,
		TAG_ID.PRE,
		TAG_ID.RUBY,
		TAG_ID.S,
		TAG_ID.SMALL,
		TAG_ID.SPAN,
		TAG_ID.STRONG,
		TAG_ID.STRIKE,
		TAG_ID.SUB,
		TAG_ID.SUP,
		TAG_ID.TABLE,
		TAG_ID.TT,
		TAG_ID.U,
		TAG_ID.UL,
		TAG_ID.VAR
	]);
	function causesExit(startTagToken) {
		const tn = startTagToken.tagID;
		return tn === TAG_ID.FONT && startTagToken.attrs.some(({ name }) => name === ATTRS.COLOR || name === ATTRS.SIZE || name === ATTRS.FACE) || EXITS_FOREIGN_CONTENT.has(tn);
	}
	function adjustTokenMathMLAttrs(token) {
		for (let i = 0; i < token.attrs.length; i++) if (token.attrs[i].name === DEFINITION_URL_ATTR) {
			token.attrs[i].name = ADJUSTED_DEFINITION_URL_ATTR;
			break;
		}
	}
	function adjustTokenSVGAttrs(token) {
		for (let i = 0; i < token.attrs.length; i++) {
			const adjustedAttrName = SVG_ATTRS_ADJUSTMENT_MAP.get(token.attrs[i].name);
			if (adjustedAttrName != null) token.attrs[i].name = adjustedAttrName;
		}
	}
	function adjustTokenXMLAttrs(token) {
		for (let i = 0; i < token.attrs.length; i++) {
			const adjustedAttrEntry = XML_ATTRS_ADJUSTMENT_MAP.get(token.attrs[i].name);
			if (adjustedAttrEntry) {
				token.attrs[i].prefix = adjustedAttrEntry.prefix;
				token.attrs[i].name = adjustedAttrEntry.name;
				token.attrs[i].namespace = adjustedAttrEntry.namespace;
			}
		}
	}
	function adjustTokenSVGTagName(token) {
		const adjustedTagName = SVG_TAG_NAMES_ADJUSTMENT_MAP.get(token.tagName);
		if (adjustedTagName != null) {
			token.tagName = adjustedTagName;
			token.tagID = getTagID(token.tagName);
		}
	}
	function isMathMLTextIntegrationPoint(tn, ns) {
		return ns === NS.MATHML && (tn === TAG_ID.MI || tn === TAG_ID.MO || tn === TAG_ID.MN || tn === TAG_ID.MS || tn === TAG_ID.MTEXT);
	}
	function isHtmlIntegrationPoint(tn, ns, attrs) {
		if (ns === NS.MATHML && tn === TAG_ID.ANNOTATION_XML) {
			for (let i = 0; i < attrs.length; i++) if (attrs[i].name === ATTRS.ENCODING) {
				const value = attrs[i].value.toLowerCase();
				return value === MIME_TYPES.TEXT_HTML || value === MIME_TYPES.APPLICATION_XML;
			}
		}
		return ns === NS.SVG && (tn === TAG_ID.FOREIGN_OBJECT || tn === TAG_ID.DESC || tn === TAG_ID.TITLE);
	}
	function isIntegrationPoint(tn, ns, attrs, foreignNS) {
		return (!foreignNS || foreignNS === NS.HTML) && isHtmlIntegrationPoint(tn, ns, attrs) || (!foreignNS || foreignNS === NS.MATHML) && isMathMLTextIntegrationPoint(tn, ns);
	}
	//#endregion
	//#region node_modules/parse5/dist/parser/index.js
	var HIDDEN_INPUT_TYPE = "hidden";
	var AA_OUTER_LOOP_ITER = 8;
	var AA_INNER_LOOP_ITER = 3;
	var InsertionMode;
	(function(InsertionMode) {
		InsertionMode[InsertionMode["INITIAL"] = 0] = "INITIAL";
		InsertionMode[InsertionMode["BEFORE_HTML"] = 1] = "BEFORE_HTML";
		InsertionMode[InsertionMode["BEFORE_HEAD"] = 2] = "BEFORE_HEAD";
		InsertionMode[InsertionMode["IN_HEAD"] = 3] = "IN_HEAD";
		InsertionMode[InsertionMode["IN_HEAD_NO_SCRIPT"] = 4] = "IN_HEAD_NO_SCRIPT";
		InsertionMode[InsertionMode["AFTER_HEAD"] = 5] = "AFTER_HEAD";
		InsertionMode[InsertionMode["IN_BODY"] = 6] = "IN_BODY";
		InsertionMode[InsertionMode["TEXT"] = 7] = "TEXT";
		InsertionMode[InsertionMode["IN_TABLE"] = 8] = "IN_TABLE";
		InsertionMode[InsertionMode["IN_TABLE_TEXT"] = 9] = "IN_TABLE_TEXT";
		InsertionMode[InsertionMode["IN_CAPTION"] = 10] = "IN_CAPTION";
		InsertionMode[InsertionMode["IN_COLUMN_GROUP"] = 11] = "IN_COLUMN_GROUP";
		InsertionMode[InsertionMode["IN_TABLE_BODY"] = 12] = "IN_TABLE_BODY";
		InsertionMode[InsertionMode["IN_ROW"] = 13] = "IN_ROW";
		InsertionMode[InsertionMode["IN_CELL"] = 14] = "IN_CELL";
		InsertionMode[InsertionMode["IN_SELECT"] = 15] = "IN_SELECT";
		InsertionMode[InsertionMode["IN_SELECT_IN_TABLE"] = 16] = "IN_SELECT_IN_TABLE";
		InsertionMode[InsertionMode["IN_TEMPLATE"] = 17] = "IN_TEMPLATE";
		InsertionMode[InsertionMode["AFTER_BODY"] = 18] = "AFTER_BODY";
		InsertionMode[InsertionMode["IN_FRAMESET"] = 19] = "IN_FRAMESET";
		InsertionMode[InsertionMode["AFTER_FRAMESET"] = 20] = "AFTER_FRAMESET";
		InsertionMode[InsertionMode["AFTER_AFTER_BODY"] = 21] = "AFTER_AFTER_BODY";
		InsertionMode[InsertionMode["AFTER_AFTER_FRAMESET"] = 22] = "AFTER_AFTER_FRAMESET";
	})(InsertionMode || (InsertionMode = {}));
	var BASE_LOC = {
		startLine: -1,
		startCol: -1,
		startOffset: -1,
		endLine: -1,
		endCol: -1,
		endOffset: -1
	};
	var TABLE_STRUCTURE_TAGS = /* @__PURE__ */ new Set([
		TAG_ID.TABLE,
		TAG_ID.TBODY,
		TAG_ID.TFOOT,
		TAG_ID.THEAD,
		TAG_ID.TR
	]);
	var defaultParserOptions = {
		scriptingEnabled: true,
		sourceCodeLocationInfo: false,
		treeAdapter: defaultTreeAdapter,
		onParseError: null
	};
	var Parser = class {
		constructor(options, document, fragmentContext = null, scriptHandler = null) {
			this.fragmentContext = fragmentContext;
			this.scriptHandler = scriptHandler;
			this.currentToken = null;
			this.stopped = false;
			/** @internal */
			this.insertionMode = InsertionMode.INITIAL;
			/** @internal */
			this.originalInsertionMode = InsertionMode.INITIAL;
			/** @internal */
			this.headElement = null;
			/** @internal */
			this.formElement = null;
			/** Indicates that the current node is not an element in the HTML namespace */
			this.currentNotInHTML = false;
			/**
			* The template insertion mode stack is maintained from the left.
			* Ie. the topmost element will always have index 0.
			*
			* @internal
			*/
			this.tmplInsertionModeStack = [];
			/** @internal */
			this.pendingCharacterTokens = [];
			/** @internal */
			this.hasNonWhitespacePendingCharacterToken = false;
			/** @internal */
			this.framesetOk = true;
			/** @internal */
			this.skipNextNewLine = false;
			/** @internal */
			this.fosterParentingEnabled = false;
			this.options = _objectSpread2(_objectSpread2({}, defaultParserOptions), options);
			this.treeAdapter = this.options.treeAdapter;
			this.onParseError = this.options.onParseError;
			if (this.onParseError) this.options.sourceCodeLocationInfo = true;
			this.document = document !== null && document !== void 0 ? document : this.treeAdapter.createDocument();
			this.tokenizer = new Tokenizer(this.options, this);
			this.activeFormattingElements = new FormattingElementList(this.treeAdapter);
			this.fragmentContextID = fragmentContext ? getTagID(this.treeAdapter.getTagName(fragmentContext)) : TAG_ID.UNKNOWN;
			this._setContextModes(fragmentContext !== null && fragmentContext !== void 0 ? fragmentContext : this.document, this.fragmentContextID);
			this.openElements = new OpenElementStack(this.document, this.treeAdapter, this);
		}
		static parse(html, options) {
			const parser = new this(options);
			parser.tokenizer.write(html, true);
			return parser.document;
		}
		static getFragmentParser(fragmentContext, options) {
			const opts = _objectSpread2(_objectSpread2({}, defaultParserOptions), options);
			fragmentContext !== null && fragmentContext !== void 0 || (fragmentContext = opts.treeAdapter.createElement(TAG_NAMES.TEMPLATE, NS.HTML, []));
			const documentMock = opts.treeAdapter.createElement("documentmock", NS.HTML, []);
			const parser = new this(opts, documentMock, fragmentContext);
			if (parser.fragmentContextID === TAG_ID.TEMPLATE) parser.tmplInsertionModeStack.unshift(InsertionMode.IN_TEMPLATE);
			parser._initTokenizerForFragmentParsing();
			parser._insertFakeRootElement();
			parser._resetInsertionMode();
			parser._findFormInFragmentContext();
			return parser;
		}
		getFragment() {
			const rootElement = this.treeAdapter.getFirstChild(this.document);
			const fragment = this.treeAdapter.createDocumentFragment();
			this._adoptNodes(rootElement, fragment);
			return fragment;
		}
		/** @internal */
		_err(token, code, beforeToken) {
			var _a;
			if (!this.onParseError) return;
			const loc = (_a = token.location) !== null && _a !== void 0 ? _a : BASE_LOC;
			const err = {
				code,
				startLine: loc.startLine,
				startCol: loc.startCol,
				startOffset: loc.startOffset,
				endLine: beforeToken ? loc.startLine : loc.endLine,
				endCol: beforeToken ? loc.startCol : loc.endCol,
				endOffset: beforeToken ? loc.startOffset : loc.endOffset
			};
			this.onParseError(err);
		}
		/** @internal */
		onItemPush(node, tid, isTop) {
			var _a, _b;
			(_b = (_a = this.treeAdapter).onItemPush) === null || _b === void 0 || _b.call(_a, node);
			if (isTop && this.openElements.stackTop > 0) this._setContextModes(node, tid);
		}
		/** @internal */
		onItemPop(node, isTop) {
			var _a, _b;
			if (this.options.sourceCodeLocationInfo) this._setEndLocation(node, this.currentToken);
			(_b = (_a = this.treeAdapter).onItemPop) === null || _b === void 0 || _b.call(_a, node, this.openElements.current);
			if (isTop) {
				let current;
				let currentTagId;
				if (this.openElements.stackTop === 0 && this.fragmentContext) {
					current = this.fragmentContext;
					currentTagId = this.fragmentContextID;
				} else ({current, currentTagId} = this.openElements);
				this._setContextModes(current, currentTagId);
			}
		}
		_setContextModes(current, tid) {
			const isHTML = current === this.document || current && this.treeAdapter.getNamespaceURI(current) === NS.HTML;
			this.currentNotInHTML = !isHTML;
			this.tokenizer.inForeignNode = !isHTML && current !== void 0 && tid !== void 0 && !this._isIntegrationPoint(tid, current);
		}
		/** @protected */
		_switchToTextParsing(currentToken, nextTokenizerState) {
			this._insertElement(currentToken, NS.HTML);
			this.tokenizer.state = nextTokenizerState;
			this.originalInsertionMode = this.insertionMode;
			this.insertionMode = InsertionMode.TEXT;
		}
		switchToPlaintextParsing() {
			this.insertionMode = InsertionMode.TEXT;
			this.originalInsertionMode = InsertionMode.IN_BODY;
			this.tokenizer.state = TokenizerMode.PLAINTEXT;
		}
		/** @protected */
		_getAdjustedCurrentElement() {
			return this.openElements.stackTop === 0 && this.fragmentContext ? this.fragmentContext : this.openElements.current;
		}
		/** @protected */
		_findFormInFragmentContext() {
			let node = this.fragmentContext;
			while (node) {
				if (this.treeAdapter.getTagName(node) === TAG_NAMES.FORM) {
					this.formElement = node;
					break;
				}
				node = this.treeAdapter.getParentNode(node);
			}
		}
		_initTokenizerForFragmentParsing() {
			if (!this.fragmentContext || this.treeAdapter.getNamespaceURI(this.fragmentContext) !== NS.HTML) return;
			switch (this.fragmentContextID) {
				case TAG_ID.TITLE:
				case TAG_ID.TEXTAREA:
					this.tokenizer.state = TokenizerMode.RCDATA;
					break;
				case TAG_ID.STYLE:
				case TAG_ID.XMP:
				case TAG_ID.IFRAME:
				case TAG_ID.NOEMBED:
				case TAG_ID.NOFRAMES:
				case TAG_ID.NOSCRIPT:
					this.tokenizer.state = TokenizerMode.RAWTEXT;
					break;
				case TAG_ID.SCRIPT:
					this.tokenizer.state = TokenizerMode.SCRIPT_DATA;
					break;
				case TAG_ID.PLAINTEXT: this.tokenizer.state = TokenizerMode.PLAINTEXT;
			}
		}
		/** @protected */
		_setDocumentType(token) {
			const name = token.name || "";
			const publicId = token.publicId || "";
			const systemId = token.systemId || "";
			this.treeAdapter.setDocumentType(this.document, name, publicId, systemId);
			if (token.location) {
				const docTypeNode = this.treeAdapter.getChildNodes(this.document).find((node) => this.treeAdapter.isDocumentTypeNode(node));
				if (docTypeNode) this.treeAdapter.setNodeSourceCodeLocation(docTypeNode, token.location);
			}
		}
		/** @protected */
		_attachElementToTree(element, location) {
			if (this.options.sourceCodeLocationInfo) {
				const loc = location && _objectSpread2(_objectSpread2({}, location), {}, { startTag: location });
				this.treeAdapter.setNodeSourceCodeLocation(element, loc);
			}
			if (this._shouldFosterParentOnInsertion()) this._fosterParentElement(element);
			else {
				const parent = this.openElements.currentTmplContentOrNode;
				this.treeAdapter.appendChild(parent !== null && parent !== void 0 ? parent : this.document, element);
			}
		}
		/**
		* For self-closing tags. Add an element to the tree, but skip adding it
		* to the stack.
		*/
		/** @protected */
		_appendElement(token, namespaceURI) {
			const element = this.treeAdapter.createElement(token.tagName, namespaceURI, token.attrs);
			this._attachElementToTree(element, token.location);
		}
		/** @protected */
		_insertElement(token, namespaceURI) {
			const element = this.treeAdapter.createElement(token.tagName, namespaceURI, token.attrs);
			this._attachElementToTree(element, token.location);
			this.openElements.push(element, token.tagID);
		}
		/** @protected */
		_insertFakeElement(tagName, tagID) {
			const element = this.treeAdapter.createElement(tagName, NS.HTML, []);
			this._attachElementToTree(element, null);
			this.openElements.push(element, tagID);
		}
		/** @protected */
		_insertTemplate(token) {
			const tmpl = this.treeAdapter.createElement(token.tagName, NS.HTML, token.attrs);
			const content = this.treeAdapter.createDocumentFragment();
			this.treeAdapter.setTemplateContent(tmpl, content);
			this._attachElementToTree(tmpl, token.location);
			this.openElements.push(tmpl, token.tagID);
			if (this.options.sourceCodeLocationInfo) this.treeAdapter.setNodeSourceCodeLocation(content, null);
		}
		/** @protected */
		_insertFakeRootElement() {
			const element = this.treeAdapter.createElement(TAG_NAMES.HTML, NS.HTML, []);
			if (this.options.sourceCodeLocationInfo) this.treeAdapter.setNodeSourceCodeLocation(element, null);
			this.treeAdapter.appendChild(this.openElements.current, element);
			this.openElements.push(element, TAG_ID.HTML);
		}
		/** @protected */
		_appendCommentNode(token, parent) {
			const commentNode = this.treeAdapter.createCommentNode(token.data);
			this.treeAdapter.appendChild(parent, commentNode);
			if (this.options.sourceCodeLocationInfo) this.treeAdapter.setNodeSourceCodeLocation(commentNode, token.location);
		}
		/** @protected */
		_insertCharacters(token) {
			let parent;
			let beforeElement;
			if (this._shouldFosterParentOnInsertion()) {
				({parent, beforeElement} = this._findFosterParentingLocation());
				if (beforeElement) this.treeAdapter.insertTextBefore(parent, token.chars, beforeElement);
				else this.treeAdapter.insertText(parent, token.chars);
			} else {
				parent = this.openElements.currentTmplContentOrNode;
				this.treeAdapter.insertText(parent, token.chars);
			}
			if (!token.location) return;
			const siblings = this.treeAdapter.getChildNodes(parent);
			const textNode = siblings[(beforeElement ? siblings.lastIndexOf(beforeElement) : siblings.length) - 1];
			if (this.treeAdapter.getNodeSourceCodeLocation(textNode)) {
				const { endLine, endCol, endOffset } = token.location;
				this.treeAdapter.updateNodeSourceCodeLocation(textNode, {
					endLine,
					endCol,
					endOffset
				});
			} else if (this.options.sourceCodeLocationInfo) this.treeAdapter.setNodeSourceCodeLocation(textNode, token.location);
		}
		/** @protected */
		_adoptNodes(donor, recipient) {
			for (let child = this.treeAdapter.getFirstChild(donor); child; child = this.treeAdapter.getFirstChild(donor)) {
				this.treeAdapter.detachNode(child);
				this.treeAdapter.appendChild(recipient, child);
			}
		}
		/** @protected */
		_setEndLocation(element, closingToken) {
			if (this.treeAdapter.getNodeSourceCodeLocation(element) && closingToken.location) {
				const ctLoc = closingToken.location;
				const tn = this.treeAdapter.getTagName(element);
				const endLoc = closingToken.type === TokenType.END_TAG && tn === closingToken.tagName ? {
					endTag: _objectSpread2({}, ctLoc),
					endLine: ctLoc.endLine,
					endCol: ctLoc.endCol,
					endOffset: ctLoc.endOffset
				} : {
					endLine: ctLoc.startLine,
					endCol: ctLoc.startCol,
					endOffset: ctLoc.startOffset
				};
				this.treeAdapter.updateNodeSourceCodeLocation(element, endLoc);
			}
		}
		shouldProcessStartTagTokenInForeignContent(token) {
			if (!this.currentNotInHTML) return false;
			let current;
			let currentTagId;
			if (this.openElements.stackTop === 0 && this.fragmentContext) {
				current = this.fragmentContext;
				currentTagId = this.fragmentContextID;
			} else ({current, currentTagId} = this.openElements);
			if (token.tagID === TAG_ID.SVG && this.treeAdapter.getTagName(current) === TAG_NAMES.ANNOTATION_XML && this.treeAdapter.getNamespaceURI(current) === NS.MATHML) return false;
			return this.tokenizer.inForeignNode || (token.tagID === TAG_ID.MGLYPH || token.tagID === TAG_ID.MALIGNMARK) && currentTagId !== void 0 && !this._isIntegrationPoint(currentTagId, current, NS.HTML);
		}
		/** @protected */
		_processToken(token) {
			switch (token.type) {
				case TokenType.CHARACTER:
					this.onCharacter(token);
					break;
				case TokenType.NULL_CHARACTER:
					this.onNullCharacter(token);
					break;
				case TokenType.COMMENT:
					this.onComment(token);
					break;
				case TokenType.DOCTYPE:
					this.onDoctype(token);
					break;
				case TokenType.START_TAG:
					this._processStartTag(token);
					break;
				case TokenType.END_TAG:
					this.onEndTag(token);
					break;
				case TokenType.EOF:
					this.onEof(token);
					break;
				case TokenType.WHITESPACE_CHARACTER: this.onWhitespaceCharacter(token);
			}
		}
		/** @protected */
		_isIntegrationPoint(tid, element, foreignNS) {
			return isIntegrationPoint(tid, this.treeAdapter.getNamespaceURI(element), this.treeAdapter.getAttrList(element), foreignNS);
		}
		/** @protected */
		_reconstructActiveFormattingElements() {
			const listLength = this.activeFormattingElements.entries.length;
			if (listLength) {
				const endIndex = this.activeFormattingElements.entries.findIndex((entry) => entry.type === EntryType.Marker || this.openElements.contains(entry.element));
				const unopenIdx = endIndex === -1 ? listLength - 1 : endIndex - 1;
				for (let i = unopenIdx; i >= 0; i--) {
					const entry = this.activeFormattingElements.entries[i];
					this._insertElement(entry.token, this.treeAdapter.getNamespaceURI(entry.element));
					entry.element = this.openElements.current;
				}
			}
		}
		/** @protected */
		_closeTableCell() {
			this.openElements.generateImpliedEndTags();
			this.openElements.popUntilTableCellPopped();
			this.activeFormattingElements.clearToLastMarker();
			this.insertionMode = InsertionMode.IN_ROW;
		}
		/** @protected */
		_closePElement() {
			this.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.P);
			this.openElements.popUntilTagNamePopped(TAG_ID.P);
		}
		/** @protected */
		_resetInsertionMode() {
			for (let i = this.openElements.stackTop; i >= 0; i--) switch (i === 0 && this.fragmentContext ? this.fragmentContextID : this.openElements.tagIDs[i]) {
				case TAG_ID.TR:
					this.insertionMode = InsertionMode.IN_ROW;
					return;
				case TAG_ID.TBODY:
				case TAG_ID.THEAD:
				case TAG_ID.TFOOT:
					this.insertionMode = InsertionMode.IN_TABLE_BODY;
					return;
				case TAG_ID.CAPTION:
					this.insertionMode = InsertionMode.IN_CAPTION;
					return;
				case TAG_ID.COLGROUP:
					this.insertionMode = InsertionMode.IN_COLUMN_GROUP;
					return;
				case TAG_ID.TABLE:
					this.insertionMode = InsertionMode.IN_TABLE;
					return;
				case TAG_ID.BODY:
					this.insertionMode = InsertionMode.IN_BODY;
					return;
				case TAG_ID.FRAMESET:
					this.insertionMode = InsertionMode.IN_FRAMESET;
					return;
				case TAG_ID.SELECT:
					this._resetInsertionModeForSelect(i);
					return;
				case TAG_ID.TEMPLATE:
					this.insertionMode = this.tmplInsertionModeStack[0];
					return;
				case TAG_ID.HTML:
					this.insertionMode = this.headElement ? InsertionMode.AFTER_HEAD : InsertionMode.BEFORE_HEAD;
					return;
				case TAG_ID.TD:
				case TAG_ID.TH:
					if (i > 0) {
						this.insertionMode = InsertionMode.IN_CELL;
						return;
					}
					break;
				case TAG_ID.HEAD: if (i > 0) {
					this.insertionMode = InsertionMode.IN_HEAD;
					return;
				}
			}
			this.insertionMode = InsertionMode.IN_BODY;
		}
		/** @protected */
		_resetInsertionModeForSelect(selectIdx) {
			if (selectIdx > 0) for (let i = selectIdx - 1; i > 0; i--) {
				const tn = this.openElements.tagIDs[i];
				if (tn === TAG_ID.TEMPLATE) break;
				else if (tn === TAG_ID.TABLE) {
					this.insertionMode = InsertionMode.IN_SELECT_IN_TABLE;
					return;
				}
			}
			this.insertionMode = InsertionMode.IN_SELECT;
		}
		/** @protected */
		_isElementCausesFosterParenting(tn) {
			return TABLE_STRUCTURE_TAGS.has(tn);
		}
		/** @protected */
		_shouldFosterParentOnInsertion() {
			return this.fosterParentingEnabled && this.openElements.currentTagId !== void 0 && this._isElementCausesFosterParenting(this.openElements.currentTagId);
		}
		/** @protected */
		_findFosterParentingLocation() {
			for (let i = this.openElements.stackTop; i >= 0; i--) {
				const openElement = this.openElements.items[i];
				switch (this.openElements.tagIDs[i]) {
					case TAG_ID.TEMPLATE:
						if (this.treeAdapter.getNamespaceURI(openElement) === NS.HTML) return {
							parent: this.treeAdapter.getTemplateContent(openElement),
							beforeElement: null
						};
						break;
					case TAG_ID.TABLE: {
						const parent = this.treeAdapter.getParentNode(openElement);
						if (parent) return {
							parent,
							beforeElement: openElement
						};
						return {
							parent: this.openElements.items[i - 1],
							beforeElement: null
						};
					}
				}
			}
			return {
				parent: this.openElements.items[0],
				beforeElement: null
			};
		}
		/** @protected */
		_fosterParentElement(element) {
			const location = this._findFosterParentingLocation();
			if (location.beforeElement) this.treeAdapter.insertBefore(location.parent, element, location.beforeElement);
			else this.treeAdapter.appendChild(location.parent, element);
		}
		/** @protected */
		_isSpecialElement(element, id) {
			return SPECIAL_ELEMENTS[this.treeAdapter.getNamespaceURI(element)].has(id);
		}
		/** @internal */
		onCharacter(token) {
			this.skipNextNewLine = false;
			if (this.tokenizer.inForeignNode) {
				characterInForeignContent(this, token);
				return;
			}
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					tokenInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HTML:
					tokenBeforeHtml(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
					tokenBeforeHead(this, token);
					break;
				case InsertionMode.IN_HEAD:
					tokenInHead(this, token);
					break;
				case InsertionMode.IN_HEAD_NO_SCRIPT:
					tokenInHeadNoScript(this, token);
					break;
				case InsertionMode.AFTER_HEAD:
					tokenAfterHead(this, token);
					break;
				case InsertionMode.IN_BODY:
				case InsertionMode.IN_CAPTION:
				case InsertionMode.IN_CELL:
				case InsertionMode.IN_TEMPLATE:
					characterInBody(this, token);
					break;
				case InsertionMode.TEXT:
				case InsertionMode.IN_SELECT:
				case InsertionMode.IN_SELECT_IN_TABLE:
					this._insertCharacters(token);
					break;
				case InsertionMode.IN_TABLE:
				case InsertionMode.IN_TABLE_BODY:
				case InsertionMode.IN_ROW:
					characterInTable(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					characterInTableText(this, token);
					break;
				case InsertionMode.IN_COLUMN_GROUP:
					tokenInColumnGroup(this, token);
					break;
				case InsertionMode.AFTER_BODY:
					tokenAfterBody(this, token);
					break;
				case InsertionMode.AFTER_AFTER_BODY: tokenAfterAfterBody(this, token);
			}
		}
		/** @internal */
		onNullCharacter(token) {
			this.skipNextNewLine = false;
			if (this.tokenizer.inForeignNode) {
				nullCharacterInForeignContent(this, token);
				return;
			}
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					tokenInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HTML:
					tokenBeforeHtml(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
					tokenBeforeHead(this, token);
					break;
				case InsertionMode.IN_HEAD:
					tokenInHead(this, token);
					break;
				case InsertionMode.IN_HEAD_NO_SCRIPT:
					tokenInHeadNoScript(this, token);
					break;
				case InsertionMode.AFTER_HEAD:
					tokenAfterHead(this, token);
					break;
				case InsertionMode.TEXT:
					this._insertCharacters(token);
					break;
				case InsertionMode.IN_TABLE:
				case InsertionMode.IN_TABLE_BODY:
				case InsertionMode.IN_ROW:
					characterInTable(this, token);
					break;
				case InsertionMode.IN_COLUMN_GROUP:
					tokenInColumnGroup(this, token);
					break;
				case InsertionMode.AFTER_BODY:
					tokenAfterBody(this, token);
					break;
				case InsertionMode.AFTER_AFTER_BODY: tokenAfterAfterBody(this, token);
			}
		}
		/** @internal */
		onComment(token) {
			this.skipNextNewLine = false;
			if (this.currentNotInHTML) {
				appendComment(this, token);
				return;
			}
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
				case InsertionMode.BEFORE_HTML:
				case InsertionMode.BEFORE_HEAD:
				case InsertionMode.IN_HEAD:
				case InsertionMode.IN_HEAD_NO_SCRIPT:
				case InsertionMode.AFTER_HEAD:
				case InsertionMode.IN_BODY:
				case InsertionMode.IN_TABLE:
				case InsertionMode.IN_CAPTION:
				case InsertionMode.IN_COLUMN_GROUP:
				case InsertionMode.IN_TABLE_BODY:
				case InsertionMode.IN_ROW:
				case InsertionMode.IN_CELL:
				case InsertionMode.IN_SELECT:
				case InsertionMode.IN_SELECT_IN_TABLE:
				case InsertionMode.IN_TEMPLATE:
				case InsertionMode.IN_FRAMESET:
				case InsertionMode.AFTER_FRAMESET:
					appendComment(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					tokenInTableText(this, token);
					break;
				case InsertionMode.AFTER_BODY:
					appendCommentToRootHtmlElement(this, token);
					break;
				case InsertionMode.AFTER_AFTER_BODY:
				case InsertionMode.AFTER_AFTER_FRAMESET: appendCommentToDocument(this, token);
			}
		}
		/** @internal */
		onDoctype(token) {
			this.skipNextNewLine = false;
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					doctypeInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
				case InsertionMode.IN_HEAD:
				case InsertionMode.IN_HEAD_NO_SCRIPT:
				case InsertionMode.AFTER_HEAD:
					this._err(token, ERR.misplacedDoctype);
					break;
				case InsertionMode.IN_TABLE_TEXT: tokenInTableText(this, token);
			}
		}
		/** @internal */
		onStartTag(token) {
			this.skipNextNewLine = false;
			this.currentToken = token;
			this._processStartTag(token);
			if (token.selfClosing && !token.ackSelfClosing) this._err(token, ERR.nonVoidHtmlElementStartTagWithTrailingSolidus);
		}
		/**
		* Processes a given start tag.
		*
		* `onStartTag` checks if a self-closing tag was recognized. When a token
		* is moved inbetween multiple insertion modes, this check for self-closing
		* could lead to false positives. To avoid this, `_processStartTag` is used
		* for nested calls.
		*
		* @param token The token to process.
		* @protected
		*/
		_processStartTag(token) {
			if (this.shouldProcessStartTagTokenInForeignContent(token)) startTagInForeignContent(this, token);
			else this._startTagOutsideForeignContent(token);
		}
		/** @protected */
		_startTagOutsideForeignContent(token) {
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					tokenInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HTML:
					startTagBeforeHtml(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
					startTagBeforeHead(this, token);
					break;
				case InsertionMode.IN_HEAD:
					startTagInHead(this, token);
					break;
				case InsertionMode.IN_HEAD_NO_SCRIPT:
					startTagInHeadNoScript(this, token);
					break;
				case InsertionMode.AFTER_HEAD:
					startTagAfterHead(this, token);
					break;
				case InsertionMode.IN_BODY:
					startTagInBody(this, token);
					break;
				case InsertionMode.IN_TABLE:
					startTagInTable(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					tokenInTableText(this, token);
					break;
				case InsertionMode.IN_CAPTION:
					startTagInCaption(this, token);
					break;
				case InsertionMode.IN_COLUMN_GROUP:
					startTagInColumnGroup(this, token);
					break;
				case InsertionMode.IN_TABLE_BODY:
					startTagInTableBody(this, token);
					break;
				case InsertionMode.IN_ROW:
					startTagInRow(this, token);
					break;
				case InsertionMode.IN_CELL:
					startTagInCell(this, token);
					break;
				case InsertionMode.IN_SELECT:
					startTagInSelect(this, token);
					break;
				case InsertionMode.IN_SELECT_IN_TABLE:
					startTagInSelectInTable(this, token);
					break;
				case InsertionMode.IN_TEMPLATE:
					startTagInTemplate(this, token);
					break;
				case InsertionMode.AFTER_BODY:
					startTagAfterBody(this, token);
					break;
				case InsertionMode.IN_FRAMESET:
					startTagInFrameset(this, token);
					break;
				case InsertionMode.AFTER_FRAMESET:
					startTagAfterFrameset(this, token);
					break;
				case InsertionMode.AFTER_AFTER_BODY:
					startTagAfterAfterBody(this, token);
					break;
				case InsertionMode.AFTER_AFTER_FRAMESET: startTagAfterAfterFrameset(this, token);
			}
		}
		/** @internal */
		onEndTag(token) {
			this.skipNextNewLine = false;
			this.currentToken = token;
			if (this.currentNotInHTML) endTagInForeignContent(this, token);
			else this._endTagOutsideForeignContent(token);
		}
		/** @protected */
		_endTagOutsideForeignContent(token) {
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					tokenInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HTML:
					endTagBeforeHtml(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
					endTagBeforeHead(this, token);
					break;
				case InsertionMode.IN_HEAD:
					endTagInHead(this, token);
					break;
				case InsertionMode.IN_HEAD_NO_SCRIPT:
					endTagInHeadNoScript(this, token);
					break;
				case InsertionMode.AFTER_HEAD:
					endTagAfterHead(this, token);
					break;
				case InsertionMode.IN_BODY:
					endTagInBody(this, token);
					break;
				case InsertionMode.TEXT:
					endTagInText(this, token);
					break;
				case InsertionMode.IN_TABLE:
					endTagInTable(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					tokenInTableText(this, token);
					break;
				case InsertionMode.IN_CAPTION:
					endTagInCaption(this, token);
					break;
				case InsertionMode.IN_COLUMN_GROUP:
					endTagInColumnGroup(this, token);
					break;
				case InsertionMode.IN_TABLE_BODY:
					endTagInTableBody(this, token);
					break;
				case InsertionMode.IN_ROW:
					endTagInRow(this, token);
					break;
				case InsertionMode.IN_CELL:
					endTagInCell(this, token);
					break;
				case InsertionMode.IN_SELECT:
					endTagInSelect(this, token);
					break;
				case InsertionMode.IN_SELECT_IN_TABLE:
					endTagInSelectInTable(this, token);
					break;
				case InsertionMode.IN_TEMPLATE:
					endTagInTemplate(this, token);
					break;
				case InsertionMode.AFTER_BODY:
					endTagAfterBody(this, token);
					break;
				case InsertionMode.IN_FRAMESET:
					endTagInFrameset(this, token);
					break;
				case InsertionMode.AFTER_FRAMESET:
					endTagAfterFrameset(this, token);
					break;
				case InsertionMode.AFTER_AFTER_BODY: tokenAfterAfterBody(this, token);
			}
		}
		/** @internal */
		onEof(token) {
			switch (this.insertionMode) {
				case InsertionMode.INITIAL:
					tokenInInitialMode(this, token);
					break;
				case InsertionMode.BEFORE_HTML:
					tokenBeforeHtml(this, token);
					break;
				case InsertionMode.BEFORE_HEAD:
					tokenBeforeHead(this, token);
					break;
				case InsertionMode.IN_HEAD:
					tokenInHead(this, token);
					break;
				case InsertionMode.IN_HEAD_NO_SCRIPT:
					tokenInHeadNoScript(this, token);
					break;
				case InsertionMode.AFTER_HEAD:
					tokenAfterHead(this, token);
					break;
				case InsertionMode.IN_BODY:
				case InsertionMode.IN_TABLE:
				case InsertionMode.IN_CAPTION:
				case InsertionMode.IN_COLUMN_GROUP:
				case InsertionMode.IN_TABLE_BODY:
				case InsertionMode.IN_ROW:
				case InsertionMode.IN_CELL:
				case InsertionMode.IN_SELECT:
				case InsertionMode.IN_SELECT_IN_TABLE:
					eofInBody(this, token);
					break;
				case InsertionMode.TEXT:
					eofInText(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT:
					tokenInTableText(this, token);
					break;
				case InsertionMode.IN_TEMPLATE:
					eofInTemplate(this, token);
					break;
				case InsertionMode.AFTER_BODY:
				case InsertionMode.IN_FRAMESET:
				case InsertionMode.AFTER_FRAMESET:
				case InsertionMode.AFTER_AFTER_BODY:
				case InsertionMode.AFTER_AFTER_FRAMESET: stopParsing(this, token);
			}
		}
		/** @internal */
		onWhitespaceCharacter(token) {
			if (this.skipNextNewLine) {
				this.skipNextNewLine = false;
				if (token.chars.charCodeAt(0) === CODE_POINTS.LINE_FEED) {
					if (token.chars.length === 1) return;
					token.chars = token.chars.substr(1);
				}
			}
			if (this.tokenizer.inForeignNode) {
				this._insertCharacters(token);
				return;
			}
			switch (this.insertionMode) {
				case InsertionMode.IN_HEAD:
				case InsertionMode.IN_HEAD_NO_SCRIPT:
				case InsertionMode.AFTER_HEAD:
				case InsertionMode.TEXT:
				case InsertionMode.IN_COLUMN_GROUP:
				case InsertionMode.IN_SELECT:
				case InsertionMode.IN_SELECT_IN_TABLE:
				case InsertionMode.IN_FRAMESET:
				case InsertionMode.AFTER_FRAMESET:
					this._insertCharacters(token);
					break;
				case InsertionMode.IN_BODY:
				case InsertionMode.IN_CAPTION:
				case InsertionMode.IN_CELL:
				case InsertionMode.IN_TEMPLATE:
				case InsertionMode.AFTER_BODY:
				case InsertionMode.AFTER_AFTER_BODY:
				case InsertionMode.AFTER_AFTER_FRAMESET:
					whitespaceCharacterInBody(this, token);
					break;
				case InsertionMode.IN_TABLE:
				case InsertionMode.IN_TABLE_BODY:
				case InsertionMode.IN_ROW:
					characterInTable(this, token);
					break;
				case InsertionMode.IN_TABLE_TEXT: whitespaceCharacterInTableText(this, token);
			}
		}
	};
	function aaObtainFormattingElementEntry(p, token) {
		let formattingElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName(token.tagName);
		if (formattingElementEntry) {
			if (!p.openElements.contains(formattingElementEntry.element)) {
				p.activeFormattingElements.removeEntry(formattingElementEntry);
				formattingElementEntry = null;
			} else if (!p.openElements.hasInScope(token.tagID)) formattingElementEntry = null;
		} else genericEndTagInBody(p, token);
		return formattingElementEntry;
	}
	function aaObtainFurthestBlock(p, formattingElementEntry) {
		let furthestBlock = null;
		let idx = p.openElements.stackTop;
		for (; idx >= 0; idx--) {
			const element = p.openElements.items[idx];
			if (element === formattingElementEntry.element) break;
			if (p._isSpecialElement(element, p.openElements.tagIDs[idx])) furthestBlock = element;
		}
		if (!furthestBlock) {
			p.openElements.shortenToLength(Math.max(idx, 0));
			p.activeFormattingElements.removeEntry(formattingElementEntry);
		}
		return furthestBlock;
	}
	function aaInnerLoop(p, furthestBlock, formattingElement) {
		let lastElement = furthestBlock;
		let nextElement = p.openElements.getCommonAncestor(furthestBlock);
		for (let i = 0, element = nextElement; element !== formattingElement; i++, element = nextElement) {
			nextElement = p.openElements.getCommonAncestor(element);
			const elementEntry = p.activeFormattingElements.getElementEntry(element);
			const counterOverflow = elementEntry && i >= AA_INNER_LOOP_ITER;
			if (!elementEntry || counterOverflow) {
				if (counterOverflow) p.activeFormattingElements.removeEntry(elementEntry);
				p.openElements.remove(element);
			} else {
				element = aaRecreateElementFromEntry(p, elementEntry);
				if (lastElement === furthestBlock) p.activeFormattingElements.bookmark = elementEntry;
				p.treeAdapter.detachNode(lastElement);
				p.treeAdapter.appendChild(element, lastElement);
				lastElement = element;
			}
		}
		return lastElement;
	}
	function aaRecreateElementFromEntry(p, elementEntry) {
		const ns = p.treeAdapter.getNamespaceURI(elementEntry.element);
		const newElement = p.treeAdapter.createElement(elementEntry.token.tagName, ns, elementEntry.token.attrs);
		p.openElements.replace(elementEntry.element, newElement);
		elementEntry.element = newElement;
		return newElement;
	}
	function aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement) {
		const tid = getTagID(p.treeAdapter.getTagName(commonAncestor));
		if (p._isElementCausesFosterParenting(tid)) p._fosterParentElement(lastElement);
		else {
			const ns = p.treeAdapter.getNamespaceURI(commonAncestor);
			if (tid === TAG_ID.TEMPLATE && ns === NS.HTML) commonAncestor = p.treeAdapter.getTemplateContent(commonAncestor);
			p.treeAdapter.appendChild(commonAncestor, lastElement);
		}
	}
	function aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry) {
		const ns = p.treeAdapter.getNamespaceURI(formattingElementEntry.element);
		const { token } = formattingElementEntry;
		const newElement = p.treeAdapter.createElement(token.tagName, ns, token.attrs);
		p._adoptNodes(furthestBlock, newElement);
		p.treeAdapter.appendChild(furthestBlock, newElement);
		p.activeFormattingElements.insertElementAfterBookmark(newElement, token);
		p.activeFormattingElements.removeEntry(formattingElementEntry);
		p.openElements.remove(formattingElementEntry.element);
		p.openElements.insertAfter(furthestBlock, newElement, token.tagID);
	}
	function callAdoptionAgency(p, token) {
		for (let i = 0; i < AA_OUTER_LOOP_ITER; i++) {
			const formattingElementEntry = aaObtainFormattingElementEntry(p, token);
			if (!formattingElementEntry) break;
			const furthestBlock = aaObtainFurthestBlock(p, formattingElementEntry);
			if (!furthestBlock) break;
			p.activeFormattingElements.bookmark = formattingElementEntry;
			const lastElement = aaInnerLoop(p, furthestBlock, formattingElementEntry.element);
			const commonAncestor = p.openElements.getCommonAncestor(formattingElementEntry.element);
			p.treeAdapter.detachNode(lastElement);
			if (commonAncestor) aaInsertLastNodeInCommonAncestor(p, commonAncestor, lastElement);
			aaReplaceFormattingElement(p, furthestBlock, formattingElementEntry);
		}
	}
	function appendComment(p, token) {
		p._appendCommentNode(token, p.openElements.currentTmplContentOrNode);
	}
	function appendCommentToRootHtmlElement(p, token) {
		p._appendCommentNode(token, p.openElements.items[0]);
	}
	function appendCommentToDocument(p, token) {
		p._appendCommentNode(token, p.document);
	}
	function stopParsing(p, token) {
		p.stopped = true;
		if (token.location) {
			const target = p.fragmentContext ? 0 : 2;
			for (let i = p.openElements.stackTop; i >= target; i--) p._setEndLocation(p.openElements.items[i], token);
			if (!p.fragmentContext && p.openElements.stackTop >= 0) {
				const htmlElement = p.openElements.items[0];
				const htmlLocation = p.treeAdapter.getNodeSourceCodeLocation(htmlElement);
				if (htmlLocation && !htmlLocation.endTag) {
					p._setEndLocation(htmlElement, token);
					if (p.openElements.stackTop >= 1) {
						const bodyElement = p.openElements.items[1];
						const bodyLocation = p.treeAdapter.getNodeSourceCodeLocation(bodyElement);
						if (bodyLocation && !bodyLocation.endTag) p._setEndLocation(bodyElement, token);
					}
				}
			}
		}
	}
	function doctypeInInitialMode(p, token) {
		p._setDocumentType(token);
		const mode = token.forceQuirks ? DOCUMENT_MODE.QUIRKS : getDocumentMode(token);
		if (!isConforming(token)) p._err(token, ERR.nonConformingDoctype);
		p.treeAdapter.setDocumentMode(p.document, mode);
		p.insertionMode = InsertionMode.BEFORE_HTML;
	}
	function tokenInInitialMode(p, token) {
		p._err(token, ERR.missingDoctype, true);
		p.treeAdapter.setDocumentMode(p.document, DOCUMENT_MODE.QUIRKS);
		p.insertionMode = InsertionMode.BEFORE_HTML;
		p._processToken(token);
	}
	function startTagBeforeHtml(p, token) {
		if (token.tagID === TAG_ID.HTML) {
			p._insertElement(token, NS.HTML);
			p.insertionMode = InsertionMode.BEFORE_HEAD;
		} else tokenBeforeHtml(p, token);
	}
	function endTagBeforeHtml(p, token) {
		const tn = token.tagID;
		if (tn === TAG_ID.HTML || tn === TAG_ID.HEAD || tn === TAG_ID.BODY || tn === TAG_ID.BR) tokenBeforeHtml(p, token);
	}
	function tokenBeforeHtml(p, token) {
		p._insertFakeRootElement();
		p.insertionMode = InsertionMode.BEFORE_HEAD;
		p._processToken(token);
	}
	function startTagBeforeHead(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.HEAD:
				p._insertElement(token, NS.HTML);
				p.headElement = p.openElements.current;
				p.insertionMode = InsertionMode.IN_HEAD;
				break;
			default: tokenBeforeHead(p, token);
		}
	}
	function endTagBeforeHead(p, token) {
		const tn = token.tagID;
		if (tn === TAG_ID.HEAD || tn === TAG_ID.BODY || tn === TAG_ID.HTML || tn === TAG_ID.BR) tokenBeforeHead(p, token);
		else p._err(token, ERR.endTagWithoutMatchingOpenElement);
	}
	function tokenBeforeHead(p, token) {
		p._insertFakeElement(TAG_NAMES.HEAD, TAG_ID.HEAD);
		p.headElement = p.openElements.current;
		p.insertionMode = InsertionMode.IN_HEAD;
		p._processToken(token);
	}
	function startTagInHead(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.BASE:
			case TAG_ID.BASEFONT:
			case TAG_ID.BGSOUND:
			case TAG_ID.LINK:
			case TAG_ID.META:
				p._appendElement(token, NS.HTML);
				token.ackSelfClosing = true;
				break;
			case TAG_ID.TITLE:
				p._switchToTextParsing(token, TokenizerMode.RCDATA);
				break;
			case TAG_ID.NOSCRIPT:
				if (p.options.scriptingEnabled) p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
				else {
					p._insertElement(token, NS.HTML);
					p.insertionMode = InsertionMode.IN_HEAD_NO_SCRIPT;
				}
				break;
			case TAG_ID.NOFRAMES:
			case TAG_ID.STYLE:
				p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
				break;
			case TAG_ID.SCRIPT:
				p._switchToTextParsing(token, TokenizerMode.SCRIPT_DATA);
				break;
			case TAG_ID.TEMPLATE:
				p._insertTemplate(token);
				p.activeFormattingElements.insertMarker();
				p.framesetOk = false;
				p.insertionMode = InsertionMode.IN_TEMPLATE;
				p.tmplInsertionModeStack.unshift(InsertionMode.IN_TEMPLATE);
				break;
			case TAG_ID.HEAD:
				p._err(token, ERR.misplacedStartTagForHeadElement);
				break;
			default: tokenInHead(p, token);
		}
	}
	function endTagInHead(p, token) {
		switch (token.tagID) {
			case TAG_ID.HEAD:
				p.openElements.pop();
				p.insertionMode = InsertionMode.AFTER_HEAD;
				break;
			case TAG_ID.BODY:
			case TAG_ID.BR:
			case TAG_ID.HTML:
				tokenInHead(p, token);
				break;
			case TAG_ID.TEMPLATE:
				templateEndTagInHead(p, token);
				break;
			default: p._err(token, ERR.endTagWithoutMatchingOpenElement);
		}
	}
	function templateEndTagInHead(p, token) {
		if (p.openElements.tmplCount > 0) {
			p.openElements.generateImpliedEndTagsThoroughly();
			if (p.openElements.currentTagId !== TAG_ID.TEMPLATE) p._err(token, ERR.closingOfElementWithOpenChildElements);
			p.openElements.popUntilTagNamePopped(TAG_ID.TEMPLATE);
			p.activeFormattingElements.clearToLastMarker();
			p.tmplInsertionModeStack.shift();
			p._resetInsertionMode();
		} else p._err(token, ERR.endTagWithoutMatchingOpenElement);
	}
	function tokenInHead(p, token) {
		p.openElements.pop();
		p.insertionMode = InsertionMode.AFTER_HEAD;
		p._processToken(token);
	}
	function startTagInHeadNoScript(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.BASEFONT:
			case TAG_ID.BGSOUND:
			case TAG_ID.HEAD:
			case TAG_ID.LINK:
			case TAG_ID.META:
			case TAG_ID.NOFRAMES:
			case TAG_ID.STYLE:
				startTagInHead(p, token);
				break;
			case TAG_ID.NOSCRIPT:
				p._err(token, ERR.nestedNoscriptInHead);
				break;
			default: tokenInHeadNoScript(p, token);
		}
	}
	function endTagInHeadNoScript(p, token) {
		switch (token.tagID) {
			case TAG_ID.NOSCRIPT:
				p.openElements.pop();
				p.insertionMode = InsertionMode.IN_HEAD;
				break;
			case TAG_ID.BR:
				tokenInHeadNoScript(p, token);
				break;
			default: p._err(token, ERR.endTagWithoutMatchingOpenElement);
		}
	}
	function tokenInHeadNoScript(p, token) {
		const errCode = token.type === TokenType.EOF ? ERR.openElementsLeftAfterEof : ERR.disallowedContentInNoscriptInHead;
		p._err(token, errCode);
		p.openElements.pop();
		p.insertionMode = InsertionMode.IN_HEAD;
		p._processToken(token);
	}
	function startTagAfterHead(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.BODY:
				p._insertElement(token, NS.HTML);
				p.framesetOk = false;
				p.insertionMode = InsertionMode.IN_BODY;
				break;
			case TAG_ID.FRAMESET:
				p._insertElement(token, NS.HTML);
				p.insertionMode = InsertionMode.IN_FRAMESET;
				break;
			case TAG_ID.BASE:
			case TAG_ID.BASEFONT:
			case TAG_ID.BGSOUND:
			case TAG_ID.LINK:
			case TAG_ID.META:
			case TAG_ID.NOFRAMES:
			case TAG_ID.SCRIPT:
			case TAG_ID.STYLE:
			case TAG_ID.TEMPLATE:
			case TAG_ID.TITLE:
				p._err(token, ERR.abandonedHeadElementChild);
				p.openElements.push(p.headElement, TAG_ID.HEAD);
				startTagInHead(p, token);
				p.openElements.remove(p.headElement);
				break;
			case TAG_ID.HEAD:
				p._err(token, ERR.misplacedStartTagForHeadElement);
				break;
			default: tokenAfterHead(p, token);
		}
	}
	function endTagAfterHead(p, token) {
		switch (token.tagID) {
			case TAG_ID.BODY:
			case TAG_ID.HTML:
			case TAG_ID.BR:
				tokenAfterHead(p, token);
				break;
			case TAG_ID.TEMPLATE:
				templateEndTagInHead(p, token);
				break;
			default: p._err(token, ERR.endTagWithoutMatchingOpenElement);
		}
	}
	function tokenAfterHead(p, token) {
		p._insertFakeElement(TAG_NAMES.BODY, TAG_ID.BODY);
		p.insertionMode = InsertionMode.IN_BODY;
		modeInBody(p, token);
	}
	function modeInBody(p, token) {
		switch (token.type) {
			case TokenType.CHARACTER:
				characterInBody(p, token);
				break;
			case TokenType.WHITESPACE_CHARACTER:
				whitespaceCharacterInBody(p, token);
				break;
			case TokenType.COMMENT:
				appendComment(p, token);
				break;
			case TokenType.START_TAG:
				startTagInBody(p, token);
				break;
			case TokenType.END_TAG:
				endTagInBody(p, token);
				break;
			case TokenType.EOF: eofInBody(p, token);
		}
	}
	function whitespaceCharacterInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertCharacters(token);
	}
	function characterInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertCharacters(token);
		p.framesetOk = false;
	}
	function htmlStartTagInBody(p, token) {
		if (p.openElements.tmplCount === 0) p.treeAdapter.adoptAttributes(p.openElements.items[0], token.attrs);
	}
	function bodyStartTagInBody(p, token) {
		const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
		if (bodyElement && p.openElements.tmplCount === 0) {
			p.framesetOk = false;
			p.treeAdapter.adoptAttributes(bodyElement, token.attrs);
		}
	}
	function framesetStartTagInBody(p, token) {
		const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
		if (p.framesetOk && bodyElement) {
			p.treeAdapter.detachNode(bodyElement);
			p.openElements.popAllUpToHtmlElement();
			p._insertElement(token, NS.HTML);
			p.insertionMode = InsertionMode.IN_FRAMESET;
		}
	}
	function addressStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._insertElement(token, NS.HTML);
	}
	function numberedHeaderStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		if (p.openElements.currentTagId !== void 0 && NUMBERED_HEADERS.has(p.openElements.currentTagId)) p.openElements.pop();
		p._insertElement(token, NS.HTML);
	}
	function preStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._insertElement(token, NS.HTML);
		p.skipNextNewLine = true;
		p.framesetOk = false;
	}
	function formStartTagInBody(p, token) {
		const inTemplate = p.openElements.tmplCount > 0;
		if (!p.formElement || inTemplate) {
			if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
			p._insertElement(token, NS.HTML);
			if (!inTemplate) p.formElement = p.openElements.current;
		}
	}
	function listItemStartTagInBody(p, token) {
		p.framesetOk = false;
		const tn = token.tagID;
		for (let i = p.openElements.stackTop; i >= 0; i--) {
			const elementId = p.openElements.tagIDs[i];
			if (tn === TAG_ID.LI && elementId === TAG_ID.LI || (tn === TAG_ID.DD || tn === TAG_ID.DT) && (elementId === TAG_ID.DD || elementId === TAG_ID.DT)) {
				p.openElements.generateImpliedEndTagsWithExclusion(elementId);
				p.openElements.popUntilTagNamePopped(elementId);
				break;
			}
			if (elementId !== TAG_ID.ADDRESS && elementId !== TAG_ID.DIV && elementId !== TAG_ID.P && p._isSpecialElement(p.openElements.items[i], elementId)) break;
		}
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._insertElement(token, NS.HTML);
	}
	function plaintextStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._insertElement(token, NS.HTML);
		p.tokenizer.state = TokenizerMode.PLAINTEXT;
	}
	function buttonStartTagInBody(p, token) {
		if (p.openElements.hasInScope(TAG_ID.BUTTON)) {
			p.openElements.generateImpliedEndTags();
			p.openElements.popUntilTagNamePopped(TAG_ID.BUTTON);
		}
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
		p.framesetOk = false;
	}
	function aStartTagInBody(p, token) {
		const activeElementEntry = p.activeFormattingElements.getElementEntryInScopeWithTagName(TAG_NAMES.A);
		if (activeElementEntry) {
			callAdoptionAgency(p, token);
			p.openElements.remove(activeElementEntry.element);
			p.activeFormattingElements.removeEntry(activeElementEntry);
		}
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
		p.activeFormattingElements.pushElement(p.openElements.current, token);
	}
	function bStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
		p.activeFormattingElements.pushElement(p.openElements.current, token);
	}
	function nobrStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		if (p.openElements.hasInScope(TAG_ID.NOBR)) {
			callAdoptionAgency(p, token);
			p._reconstructActiveFormattingElements();
		}
		p._insertElement(token, NS.HTML);
		p.activeFormattingElements.pushElement(p.openElements.current, token);
	}
	function appletStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
		p.activeFormattingElements.insertMarker();
		p.framesetOk = false;
	}
	function tableStartTagInBody(p, token) {
		if (p.treeAdapter.getDocumentMode(p.document) !== DOCUMENT_MODE.QUIRKS && p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._insertElement(token, NS.HTML);
		p.framesetOk = false;
		p.insertionMode = InsertionMode.IN_TABLE;
	}
	function areaStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._appendElement(token, NS.HTML);
		p.framesetOk = false;
		token.ackSelfClosing = true;
	}
	function isHiddenInput(token) {
		const inputType = getTokenAttr(token, ATTRS.TYPE);
		return inputType != null && inputType.toLowerCase() === HIDDEN_INPUT_TYPE;
	}
	function inputStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._appendElement(token, NS.HTML);
		if (!isHiddenInput(token)) p.framesetOk = false;
		token.ackSelfClosing = true;
	}
	function paramStartTagInBody(p, token) {
		p._appendElement(token, NS.HTML);
		token.ackSelfClosing = true;
	}
	function hrStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._appendElement(token, NS.HTML);
		p.framesetOk = false;
		token.ackSelfClosing = true;
	}
	function imageStartTagInBody(p, token) {
		token.tagName = TAG_NAMES.IMG;
		token.tagID = TAG_ID.IMG;
		areaStartTagInBody(p, token);
	}
	function textareaStartTagInBody(p, token) {
		p._insertElement(token, NS.HTML);
		p.skipNextNewLine = true;
		p.tokenizer.state = TokenizerMode.RCDATA;
		p.originalInsertionMode = p.insertionMode;
		p.framesetOk = false;
		p.insertionMode = InsertionMode.TEXT;
	}
	function xmpStartTagInBody(p, token) {
		if (p.openElements.hasInButtonScope(TAG_ID.P)) p._closePElement();
		p._reconstructActiveFormattingElements();
		p.framesetOk = false;
		p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
	}
	function iframeStartTagInBody(p, token) {
		p.framesetOk = false;
		p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
	}
	function rawTextStartTagInBody(p, token) {
		p._switchToTextParsing(token, TokenizerMode.RAWTEXT);
	}
	function selectStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
		p.framesetOk = false;
		p.insertionMode = p.insertionMode === InsertionMode.IN_TABLE || p.insertionMode === InsertionMode.IN_CAPTION || p.insertionMode === InsertionMode.IN_TABLE_BODY || p.insertionMode === InsertionMode.IN_ROW || p.insertionMode === InsertionMode.IN_CELL ? InsertionMode.IN_SELECT_IN_TABLE : InsertionMode.IN_SELECT;
	}
	function optgroupStartTagInBody(p, token) {
		if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
	}
	function rbStartTagInBody(p, token) {
		if (p.openElements.hasInScope(TAG_ID.RUBY)) p.openElements.generateImpliedEndTags();
		p._insertElement(token, NS.HTML);
	}
	function rtStartTagInBody(p, token) {
		if (p.openElements.hasInScope(TAG_ID.RUBY)) p.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.RTC);
		p._insertElement(token, NS.HTML);
	}
	function mathStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		adjustTokenMathMLAttrs(token);
		adjustTokenXMLAttrs(token);
		if (token.selfClosing) p._appendElement(token, NS.MATHML);
		else p._insertElement(token, NS.MATHML);
		token.ackSelfClosing = true;
	}
	function svgStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		adjustTokenSVGAttrs(token);
		adjustTokenXMLAttrs(token);
		if (token.selfClosing) p._appendElement(token, NS.SVG);
		else p._insertElement(token, NS.SVG);
		token.ackSelfClosing = true;
	}
	function genericStartTagInBody(p, token) {
		p._reconstructActiveFormattingElements();
		p._insertElement(token, NS.HTML);
	}
	function startTagInBody(p, token) {
		switch (token.tagID) {
			case TAG_ID.I:
			case TAG_ID.S:
			case TAG_ID.B:
			case TAG_ID.U:
			case TAG_ID.EM:
			case TAG_ID.TT:
			case TAG_ID.BIG:
			case TAG_ID.CODE:
			case TAG_ID.FONT:
			case TAG_ID.SMALL:
			case TAG_ID.STRIKE:
			case TAG_ID.STRONG:
				bStartTagInBody(p, token);
				break;
			case TAG_ID.A:
				aStartTagInBody(p, token);
				break;
			case TAG_ID.H1:
			case TAG_ID.H2:
			case TAG_ID.H3:
			case TAG_ID.H4:
			case TAG_ID.H5:
			case TAG_ID.H6:
				numberedHeaderStartTagInBody(p, token);
				break;
			case TAG_ID.P:
			case TAG_ID.DL:
			case TAG_ID.OL:
			case TAG_ID.UL:
			case TAG_ID.DIV:
			case TAG_ID.DIR:
			case TAG_ID.NAV:
			case TAG_ID.MAIN:
			case TAG_ID.MENU:
			case TAG_ID.ASIDE:
			case TAG_ID.CENTER:
			case TAG_ID.FIGURE:
			case TAG_ID.FOOTER:
			case TAG_ID.HEADER:
			case TAG_ID.HGROUP:
			case TAG_ID.DIALOG:
			case TAG_ID.DETAILS:
			case TAG_ID.ADDRESS:
			case TAG_ID.ARTICLE:
			case TAG_ID.SEARCH:
			case TAG_ID.SECTION:
			case TAG_ID.SUMMARY:
			case TAG_ID.FIELDSET:
			case TAG_ID.BLOCKQUOTE:
			case TAG_ID.FIGCAPTION:
				addressStartTagInBody(p, token);
				break;
			case TAG_ID.LI:
			case TAG_ID.DD:
			case TAG_ID.DT:
				listItemStartTagInBody(p, token);
				break;
			case TAG_ID.BR:
			case TAG_ID.IMG:
			case TAG_ID.WBR:
			case TAG_ID.AREA:
			case TAG_ID.EMBED:
			case TAG_ID.KEYGEN:
				areaStartTagInBody(p, token);
				break;
			case TAG_ID.HR:
				hrStartTagInBody(p, token);
				break;
			case TAG_ID.RB:
			case TAG_ID.RTC:
				rbStartTagInBody(p, token);
				break;
			case TAG_ID.RT:
			case TAG_ID.RP:
				rtStartTagInBody(p, token);
				break;
			case TAG_ID.PRE:
			case TAG_ID.LISTING:
				preStartTagInBody(p, token);
				break;
			case TAG_ID.XMP:
				xmpStartTagInBody(p, token);
				break;
			case TAG_ID.SVG:
				svgStartTagInBody(p, token);
				break;
			case TAG_ID.HTML:
				htmlStartTagInBody(p, token);
				break;
			case TAG_ID.BASE:
			case TAG_ID.LINK:
			case TAG_ID.META:
			case TAG_ID.STYLE:
			case TAG_ID.TITLE:
			case TAG_ID.SCRIPT:
			case TAG_ID.BGSOUND:
			case TAG_ID.BASEFONT:
			case TAG_ID.TEMPLATE:
				startTagInHead(p, token);
				break;
			case TAG_ID.BODY:
				bodyStartTagInBody(p, token);
				break;
			case TAG_ID.FORM:
				formStartTagInBody(p, token);
				break;
			case TAG_ID.NOBR:
				nobrStartTagInBody(p, token);
				break;
			case TAG_ID.MATH:
				mathStartTagInBody(p, token);
				break;
			case TAG_ID.TABLE:
				tableStartTagInBody(p, token);
				break;
			case TAG_ID.INPUT:
				inputStartTagInBody(p, token);
				break;
			case TAG_ID.PARAM:
			case TAG_ID.TRACK:
			case TAG_ID.SOURCE:
				paramStartTagInBody(p, token);
				break;
			case TAG_ID.IMAGE:
				imageStartTagInBody(p, token);
				break;
			case TAG_ID.BUTTON:
				buttonStartTagInBody(p, token);
				break;
			case TAG_ID.APPLET:
			case TAG_ID.OBJECT:
			case TAG_ID.MARQUEE:
				appletStartTagInBody(p, token);
				break;
			case TAG_ID.IFRAME:
				iframeStartTagInBody(p, token);
				break;
			case TAG_ID.SELECT:
				selectStartTagInBody(p, token);
				break;
			case TAG_ID.OPTION:
			case TAG_ID.OPTGROUP:
				optgroupStartTagInBody(p, token);
				break;
			case TAG_ID.NOEMBED:
			case TAG_ID.NOFRAMES:
				rawTextStartTagInBody(p, token);
				break;
			case TAG_ID.FRAMESET:
				framesetStartTagInBody(p, token);
				break;
			case TAG_ID.TEXTAREA:
				textareaStartTagInBody(p, token);
				break;
			case TAG_ID.NOSCRIPT:
				if (p.options.scriptingEnabled) rawTextStartTagInBody(p, token);
				else genericStartTagInBody(p, token);
				break;
			case TAG_ID.PLAINTEXT:
				plaintextStartTagInBody(p, token);
				break;
			case TAG_ID.COL:
			case TAG_ID.TH:
			case TAG_ID.TD:
			case TAG_ID.TR:
			case TAG_ID.HEAD:
			case TAG_ID.FRAME:
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
			case TAG_ID.CAPTION:
			case TAG_ID.COLGROUP: break;
			default: genericStartTagInBody(p, token);
		}
	}
	function bodyEndTagInBody(p, token) {
		if (p.openElements.hasInScope(TAG_ID.BODY)) {
			p.insertionMode = InsertionMode.AFTER_BODY;
			if (p.options.sourceCodeLocationInfo) {
				const bodyElement = p.openElements.tryPeekProperlyNestedBodyElement();
				if (bodyElement) p._setEndLocation(bodyElement, token);
			}
		}
	}
	function htmlEndTagInBody(p, token) {
		if (p.openElements.hasInScope(TAG_ID.BODY)) {
			p.insertionMode = InsertionMode.AFTER_BODY;
			endTagAfterBody(p, token);
		}
	}
	function addressEndTagInBody(p, token) {
		const tn = token.tagID;
		if (p.openElements.hasInScope(tn)) {
			p.openElements.generateImpliedEndTags();
			p.openElements.popUntilTagNamePopped(tn);
		}
	}
	function formEndTagInBody(p) {
		const inTemplate = p.openElements.tmplCount > 0;
		const { formElement } = p;
		if (!inTemplate) p.formElement = null;
		if ((formElement || inTemplate) && p.openElements.hasInScope(TAG_ID.FORM)) {
			p.openElements.generateImpliedEndTags();
			if (inTemplate) p.openElements.popUntilTagNamePopped(TAG_ID.FORM);
			else if (formElement) p.openElements.remove(formElement);
		}
	}
	function pEndTagInBody(p) {
		if (!p.openElements.hasInButtonScope(TAG_ID.P)) p._insertFakeElement(TAG_NAMES.P, TAG_ID.P);
		p._closePElement();
	}
	function liEndTagInBody(p) {
		if (p.openElements.hasInListItemScope(TAG_ID.LI)) {
			p.openElements.generateImpliedEndTagsWithExclusion(TAG_ID.LI);
			p.openElements.popUntilTagNamePopped(TAG_ID.LI);
		}
	}
	function ddEndTagInBody(p, token) {
		const tn = token.tagID;
		if (p.openElements.hasInScope(tn)) {
			p.openElements.generateImpliedEndTagsWithExclusion(tn);
			p.openElements.popUntilTagNamePopped(tn);
		}
	}
	function numberedHeaderEndTagInBody(p) {
		if (p.openElements.hasNumberedHeaderInScope()) {
			p.openElements.generateImpliedEndTags();
			p.openElements.popUntilNumberedHeaderPopped();
		}
	}
	function appletEndTagInBody(p, token) {
		const tn = token.tagID;
		if (p.openElements.hasInScope(tn)) {
			p.openElements.generateImpliedEndTags();
			p.openElements.popUntilTagNamePopped(tn);
			p.activeFormattingElements.clearToLastMarker();
		}
	}
	function brEndTagInBody(p) {
		p._reconstructActiveFormattingElements();
		p._insertFakeElement(TAG_NAMES.BR, TAG_ID.BR);
		p.openElements.pop();
		p.framesetOk = false;
	}
	function genericEndTagInBody(p, token) {
		const tn = token.tagName;
		const tid = token.tagID;
		for (let i = p.openElements.stackTop; i > 0; i--) {
			const element = p.openElements.items[i];
			const elementId = p.openElements.tagIDs[i];
			if (tid === elementId && (tid !== TAG_ID.UNKNOWN || p.treeAdapter.getTagName(element) === tn)) {
				p.openElements.generateImpliedEndTagsWithExclusion(tid);
				if (p.openElements.stackTop >= i) p.openElements.shortenToLength(i);
				break;
			}
			if (p._isSpecialElement(element, elementId)) break;
		}
	}
	function endTagInBody(p, token) {
		switch (token.tagID) {
			case TAG_ID.A:
			case TAG_ID.B:
			case TAG_ID.I:
			case TAG_ID.S:
			case TAG_ID.U:
			case TAG_ID.EM:
			case TAG_ID.TT:
			case TAG_ID.BIG:
			case TAG_ID.CODE:
			case TAG_ID.FONT:
			case TAG_ID.NOBR:
			case TAG_ID.SMALL:
			case TAG_ID.STRIKE:
			case TAG_ID.STRONG:
				callAdoptionAgency(p, token);
				break;
			case TAG_ID.P:
				pEndTagInBody(p);
				break;
			case TAG_ID.DL:
			case TAG_ID.UL:
			case TAG_ID.OL:
			case TAG_ID.DIR:
			case TAG_ID.DIV:
			case TAG_ID.NAV:
			case TAG_ID.PRE:
			case TAG_ID.MAIN:
			case TAG_ID.MENU:
			case TAG_ID.ASIDE:
			case TAG_ID.BUTTON:
			case TAG_ID.CENTER:
			case TAG_ID.FIGURE:
			case TAG_ID.FOOTER:
			case TAG_ID.HEADER:
			case TAG_ID.HGROUP:
			case TAG_ID.DIALOG:
			case TAG_ID.ADDRESS:
			case TAG_ID.ARTICLE:
			case TAG_ID.DETAILS:
			case TAG_ID.SEARCH:
			case TAG_ID.SECTION:
			case TAG_ID.SUMMARY:
			case TAG_ID.LISTING:
			case TAG_ID.FIELDSET:
			case TAG_ID.BLOCKQUOTE:
			case TAG_ID.FIGCAPTION:
				addressEndTagInBody(p, token);
				break;
			case TAG_ID.LI:
				liEndTagInBody(p);
				break;
			case TAG_ID.DD:
			case TAG_ID.DT:
				ddEndTagInBody(p, token);
				break;
			case TAG_ID.H1:
			case TAG_ID.H2:
			case TAG_ID.H3:
			case TAG_ID.H4:
			case TAG_ID.H5:
			case TAG_ID.H6:
				numberedHeaderEndTagInBody(p);
				break;
			case TAG_ID.BR:
				brEndTagInBody(p);
				break;
			case TAG_ID.BODY:
				bodyEndTagInBody(p, token);
				break;
			case TAG_ID.HTML:
				htmlEndTagInBody(p, token);
				break;
			case TAG_ID.FORM:
				formEndTagInBody(p);
				break;
			case TAG_ID.APPLET:
			case TAG_ID.OBJECT:
			case TAG_ID.MARQUEE:
				appletEndTagInBody(p, token);
				break;
			case TAG_ID.TEMPLATE:
				templateEndTagInHead(p, token);
				break;
			default: genericEndTagInBody(p, token);
		}
	}
	function eofInBody(p, token) {
		if (p.tmplInsertionModeStack.length > 0) eofInTemplate(p, token);
		else stopParsing(p, token);
	}
	function endTagInText(p, token) {
		var _a;
		if (token.tagID === TAG_ID.SCRIPT) (_a = p.scriptHandler) === null || _a === void 0 || _a.call(p, p.openElements.current);
		p.openElements.pop();
		p.insertionMode = p.originalInsertionMode;
	}
	function eofInText(p, token) {
		p._err(token, ERR.eofInElementThatCanContainOnlyText);
		p.openElements.pop();
		p.insertionMode = p.originalInsertionMode;
		p.onEof(token);
	}
	function characterInTable(p, token) {
		if (p.openElements.currentTagId !== void 0 && TABLE_STRUCTURE_TAGS.has(p.openElements.currentTagId)) {
			p.pendingCharacterTokens.length = 0;
			p.hasNonWhitespacePendingCharacterToken = false;
			p.originalInsertionMode = p.insertionMode;
			p.insertionMode = InsertionMode.IN_TABLE_TEXT;
			switch (token.type) {
				case TokenType.CHARACTER:
					characterInTableText(p, token);
					break;
				case TokenType.WHITESPACE_CHARACTER: whitespaceCharacterInTableText(p, token);
			}
		} else tokenInTable(p, token);
	}
	function captionStartTagInTable(p, token) {
		p.openElements.clearBackToTableContext();
		p.activeFormattingElements.insertMarker();
		p._insertElement(token, NS.HTML);
		p.insertionMode = InsertionMode.IN_CAPTION;
	}
	function colgroupStartTagInTable(p, token) {
		p.openElements.clearBackToTableContext();
		p._insertElement(token, NS.HTML);
		p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
	}
	function colStartTagInTable(p, token) {
		p.openElements.clearBackToTableContext();
		p._insertFakeElement(TAG_NAMES.COLGROUP, TAG_ID.COLGROUP);
		p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
		startTagInColumnGroup(p, token);
	}
	function tbodyStartTagInTable(p, token) {
		p.openElements.clearBackToTableContext();
		p._insertElement(token, NS.HTML);
		p.insertionMode = InsertionMode.IN_TABLE_BODY;
	}
	function tdStartTagInTable(p, token) {
		p.openElements.clearBackToTableContext();
		p._insertFakeElement(TAG_NAMES.TBODY, TAG_ID.TBODY);
		p.insertionMode = InsertionMode.IN_TABLE_BODY;
		startTagInTableBody(p, token);
	}
	function tableStartTagInTable(p, token) {
		if (p.openElements.hasInTableScope(TAG_ID.TABLE)) {
			p.openElements.popUntilTagNamePopped(TAG_ID.TABLE);
			p._resetInsertionMode();
			p._processStartTag(token);
		}
	}
	function inputStartTagInTable(p, token) {
		if (isHiddenInput(token)) p._appendElement(token, NS.HTML);
		else tokenInTable(p, token);
		token.ackSelfClosing = true;
	}
	function formStartTagInTable(p, token) {
		if (!p.formElement && p.openElements.tmplCount === 0) {
			p._insertElement(token, NS.HTML);
			p.formElement = p.openElements.current;
			p.openElements.pop();
		}
	}
	function startTagInTable(p, token) {
		switch (token.tagID) {
			case TAG_ID.TD:
			case TAG_ID.TH:
			case TAG_ID.TR:
				tdStartTagInTable(p, token);
				break;
			case TAG_ID.STYLE:
			case TAG_ID.SCRIPT:
			case TAG_ID.TEMPLATE:
				startTagInHead(p, token);
				break;
			case TAG_ID.COL:
				colStartTagInTable(p, token);
				break;
			case TAG_ID.FORM:
				formStartTagInTable(p, token);
				break;
			case TAG_ID.TABLE:
				tableStartTagInTable(p, token);
				break;
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
				tbodyStartTagInTable(p, token);
				break;
			case TAG_ID.INPUT:
				inputStartTagInTable(p, token);
				break;
			case TAG_ID.CAPTION:
				captionStartTagInTable(p, token);
				break;
			case TAG_ID.COLGROUP:
				colgroupStartTagInTable(p, token);
				break;
			default: tokenInTable(p, token);
		}
	}
	function endTagInTable(p, token) {
		switch (token.tagID) {
			case TAG_ID.TABLE:
				if (p.openElements.hasInTableScope(TAG_ID.TABLE)) {
					p.openElements.popUntilTagNamePopped(TAG_ID.TABLE);
					p._resetInsertionMode();
				}
				break;
			case TAG_ID.TEMPLATE:
				templateEndTagInHead(p, token);
				break;
			case TAG_ID.BODY:
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.HTML:
			case TAG_ID.TBODY:
			case TAG_ID.TD:
			case TAG_ID.TFOOT:
			case TAG_ID.TH:
			case TAG_ID.THEAD:
			case TAG_ID.TR: break;
			default: tokenInTable(p, token);
		}
	}
	function tokenInTable(p, token) {
		const savedFosterParentingState = p.fosterParentingEnabled;
		p.fosterParentingEnabled = true;
		modeInBody(p, token);
		p.fosterParentingEnabled = savedFosterParentingState;
	}
	function whitespaceCharacterInTableText(p, token) {
		p.pendingCharacterTokens.push(token);
	}
	function characterInTableText(p, token) {
		p.pendingCharacterTokens.push(token);
		p.hasNonWhitespacePendingCharacterToken = true;
	}
	function tokenInTableText(p, token) {
		let i = 0;
		if (p.hasNonWhitespacePendingCharacterToken) for (; i < p.pendingCharacterTokens.length; i++) tokenInTable(p, p.pendingCharacterTokens[i]);
		else for (; i < p.pendingCharacterTokens.length; i++) p._insertCharacters(p.pendingCharacterTokens[i]);
		p.insertionMode = p.originalInsertionMode;
		p._processToken(token);
	}
	var TABLE_VOID_ELEMENTS = /* @__PURE__ */ new Set([
		TAG_ID.CAPTION,
		TAG_ID.COL,
		TAG_ID.COLGROUP,
		TAG_ID.TBODY,
		TAG_ID.TD,
		TAG_ID.TFOOT,
		TAG_ID.TH,
		TAG_ID.THEAD,
		TAG_ID.TR
	]);
	function startTagInCaption(p, token) {
		const tn = token.tagID;
		if (TABLE_VOID_ELEMENTS.has(tn)) {
			if (p.openElements.hasInTableScope(TAG_ID.CAPTION)) {
				p.openElements.generateImpliedEndTags();
				p.openElements.popUntilTagNamePopped(TAG_ID.CAPTION);
				p.activeFormattingElements.clearToLastMarker();
				p.insertionMode = InsertionMode.IN_TABLE;
				startTagInTable(p, token);
			}
		} else startTagInBody(p, token);
	}
	function endTagInCaption(p, token) {
		const tn = token.tagID;
		switch (tn) {
			case TAG_ID.CAPTION:
			case TAG_ID.TABLE:
				if (p.openElements.hasInTableScope(TAG_ID.CAPTION)) {
					p.openElements.generateImpliedEndTags();
					p.openElements.popUntilTagNamePopped(TAG_ID.CAPTION);
					p.activeFormattingElements.clearToLastMarker();
					p.insertionMode = InsertionMode.IN_TABLE;
					if (tn === TAG_ID.TABLE) endTagInTable(p, token);
				}
				break;
			case TAG_ID.BODY:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.HTML:
			case TAG_ID.TBODY:
			case TAG_ID.TD:
			case TAG_ID.TFOOT:
			case TAG_ID.TH:
			case TAG_ID.THEAD:
			case TAG_ID.TR: break;
			default: endTagInBody(p, token);
		}
	}
	function startTagInColumnGroup(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.COL:
				p._appendElement(token, NS.HTML);
				token.ackSelfClosing = true;
				break;
			case TAG_ID.TEMPLATE:
				startTagInHead(p, token);
				break;
			default: tokenInColumnGroup(p, token);
		}
	}
	function endTagInColumnGroup(p, token) {
		switch (token.tagID) {
			case TAG_ID.COLGROUP:
				if (p.openElements.currentTagId === TAG_ID.COLGROUP) {
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE;
				}
				break;
			case TAG_ID.TEMPLATE:
				templateEndTagInHead(p, token);
				break;
			case TAG_ID.COL: break;
			default: tokenInColumnGroup(p, token);
		}
	}
	function tokenInColumnGroup(p, token) {
		if (p.openElements.currentTagId === TAG_ID.COLGROUP) {
			p.openElements.pop();
			p.insertionMode = InsertionMode.IN_TABLE;
			p._processToken(token);
		}
	}
	function startTagInTableBody(p, token) {
		switch (token.tagID) {
			case TAG_ID.TR:
				p.openElements.clearBackToTableBodyContext();
				p._insertElement(token, NS.HTML);
				p.insertionMode = InsertionMode.IN_ROW;
				break;
			case TAG_ID.TH:
			case TAG_ID.TD:
				p.openElements.clearBackToTableBodyContext();
				p._insertFakeElement(TAG_NAMES.TR, TAG_ID.TR);
				p.insertionMode = InsertionMode.IN_ROW;
				startTagInRow(p, token);
				break;
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
				if (p.openElements.hasTableBodyContextInTableScope()) {
					p.openElements.clearBackToTableBodyContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE;
					startTagInTable(p, token);
				}
				break;
			default: startTagInTable(p, token);
		}
	}
	function endTagInTableBody(p, token) {
		const tn = token.tagID;
		switch (token.tagID) {
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
				if (p.openElements.hasInTableScope(tn)) {
					p.openElements.clearBackToTableBodyContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE;
				}
				break;
			case TAG_ID.TABLE:
				if (p.openElements.hasTableBodyContextInTableScope()) {
					p.openElements.clearBackToTableBodyContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE;
					endTagInTable(p, token);
				}
				break;
			case TAG_ID.BODY:
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.HTML:
			case TAG_ID.TD:
			case TAG_ID.TH:
			case TAG_ID.TR: break;
			default: endTagInTable(p, token);
		}
	}
	function startTagInRow(p, token) {
		switch (token.tagID) {
			case TAG_ID.TH:
			case TAG_ID.TD:
				p.openElements.clearBackToTableRowContext();
				p._insertElement(token, NS.HTML);
				p.insertionMode = InsertionMode.IN_CELL;
				p.activeFormattingElements.insertMarker();
				break;
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
			case TAG_ID.TR:
				if (p.openElements.hasInTableScope(TAG_ID.TR)) {
					p.openElements.clearBackToTableRowContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE_BODY;
					startTagInTableBody(p, token);
				}
				break;
			default: startTagInTable(p, token);
		}
	}
	function endTagInRow(p, token) {
		switch (token.tagID) {
			case TAG_ID.TR:
				if (p.openElements.hasInTableScope(TAG_ID.TR)) {
					p.openElements.clearBackToTableRowContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE_BODY;
				}
				break;
			case TAG_ID.TABLE:
				if (p.openElements.hasInTableScope(TAG_ID.TR)) {
					p.openElements.clearBackToTableRowContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE_BODY;
					endTagInTableBody(p, token);
				}
				break;
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
				if (p.openElements.hasInTableScope(token.tagID) || p.openElements.hasInTableScope(TAG_ID.TR)) {
					p.openElements.clearBackToTableRowContext();
					p.openElements.pop();
					p.insertionMode = InsertionMode.IN_TABLE_BODY;
					endTagInTableBody(p, token);
				}
				break;
			case TAG_ID.BODY:
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.HTML:
			case TAG_ID.TD:
			case TAG_ID.TH: break;
			default: endTagInTable(p, token);
		}
	}
	function startTagInCell(p, token) {
		const tn = token.tagID;
		if (TABLE_VOID_ELEMENTS.has(tn)) {
			if (p.openElements.hasInTableScope(TAG_ID.TD) || p.openElements.hasInTableScope(TAG_ID.TH)) {
				p._closeTableCell();
				startTagInRow(p, token);
			}
		} else startTagInBody(p, token);
	}
	function endTagInCell(p, token) {
		const tn = token.tagID;
		switch (tn) {
			case TAG_ID.TD:
			case TAG_ID.TH:
				if (p.openElements.hasInTableScope(tn)) {
					p.openElements.generateImpliedEndTags();
					p.openElements.popUntilTagNamePopped(tn);
					p.activeFormattingElements.clearToLastMarker();
					p.insertionMode = InsertionMode.IN_ROW;
				}
				break;
			case TAG_ID.TABLE:
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
			case TAG_ID.TR:
				if (p.openElements.hasInTableScope(tn)) {
					p._closeTableCell();
					endTagInRow(p, token);
				}
				break;
			case TAG_ID.BODY:
			case TAG_ID.CAPTION:
			case TAG_ID.COL:
			case TAG_ID.COLGROUP:
			case TAG_ID.HTML: break;
			default: endTagInBody(p, token);
		}
	}
	function startTagInSelect(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.OPTION:
				if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
				p._insertElement(token, NS.HTML);
				break;
			case TAG_ID.OPTGROUP:
				if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
				if (p.openElements.currentTagId === TAG_ID.OPTGROUP) p.openElements.pop();
				p._insertElement(token, NS.HTML);
				break;
			case TAG_ID.HR:
				if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
				if (p.openElements.currentTagId === TAG_ID.OPTGROUP) p.openElements.pop();
				p._appendElement(token, NS.HTML);
				token.ackSelfClosing = true;
				break;
			case TAG_ID.INPUT:
			case TAG_ID.KEYGEN:
			case TAG_ID.TEXTAREA:
			case TAG_ID.SELECT:
				if (p.openElements.hasInSelectScope(TAG_ID.SELECT)) {
					p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
					p._resetInsertionMode();
					if (token.tagID !== TAG_ID.SELECT) p._processStartTag(token);
				}
				break;
			case TAG_ID.SCRIPT:
			case TAG_ID.TEMPLATE: startTagInHead(p, token);
		}
	}
	function endTagInSelect(p, token) {
		switch (token.tagID) {
			case TAG_ID.OPTGROUP:
				if (p.openElements.stackTop > 0 && p.openElements.currentTagId === TAG_ID.OPTION && p.openElements.tagIDs[p.openElements.stackTop - 1] === TAG_ID.OPTGROUP) p.openElements.pop();
				if (p.openElements.currentTagId === TAG_ID.OPTGROUP) p.openElements.pop();
				break;
			case TAG_ID.OPTION:
				if (p.openElements.currentTagId === TAG_ID.OPTION) p.openElements.pop();
				break;
			case TAG_ID.SELECT:
				if (p.openElements.hasInSelectScope(TAG_ID.SELECT)) {
					p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
					p._resetInsertionMode();
				}
				break;
			case TAG_ID.TEMPLATE: templateEndTagInHead(p, token);
		}
	}
	function startTagInSelectInTable(p, token) {
		const tn = token.tagID;
		if (tn === TAG_ID.CAPTION || tn === TAG_ID.TABLE || tn === TAG_ID.TBODY || tn === TAG_ID.TFOOT || tn === TAG_ID.THEAD || tn === TAG_ID.TR || tn === TAG_ID.TD || tn === TAG_ID.TH) {
			p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
			p._resetInsertionMode();
			p._processStartTag(token);
		} else startTagInSelect(p, token);
	}
	function endTagInSelectInTable(p, token) {
		const tn = token.tagID;
		if (tn === TAG_ID.CAPTION || tn === TAG_ID.TABLE || tn === TAG_ID.TBODY || tn === TAG_ID.TFOOT || tn === TAG_ID.THEAD || tn === TAG_ID.TR || tn === TAG_ID.TD || tn === TAG_ID.TH) {
			if (p.openElements.hasInTableScope(tn)) {
				p.openElements.popUntilTagNamePopped(TAG_ID.SELECT);
				p._resetInsertionMode();
				p.onEndTag(token);
			}
		} else endTagInSelect(p, token);
	}
	function startTagInTemplate(p, token) {
		switch (token.tagID) {
			case TAG_ID.BASE:
			case TAG_ID.BASEFONT:
			case TAG_ID.BGSOUND:
			case TAG_ID.LINK:
			case TAG_ID.META:
			case TAG_ID.NOFRAMES:
			case TAG_ID.SCRIPT:
			case TAG_ID.STYLE:
			case TAG_ID.TEMPLATE:
			case TAG_ID.TITLE:
				startTagInHead(p, token);
				break;
			case TAG_ID.CAPTION:
			case TAG_ID.COLGROUP:
			case TAG_ID.TBODY:
			case TAG_ID.TFOOT:
			case TAG_ID.THEAD:
				p.tmplInsertionModeStack[0] = InsertionMode.IN_TABLE;
				p.insertionMode = InsertionMode.IN_TABLE;
				startTagInTable(p, token);
				break;
			case TAG_ID.COL:
				p.tmplInsertionModeStack[0] = InsertionMode.IN_COLUMN_GROUP;
				p.insertionMode = InsertionMode.IN_COLUMN_GROUP;
				startTagInColumnGroup(p, token);
				break;
			case TAG_ID.TR:
				p.tmplInsertionModeStack[0] = InsertionMode.IN_TABLE_BODY;
				p.insertionMode = InsertionMode.IN_TABLE_BODY;
				startTagInTableBody(p, token);
				break;
			case TAG_ID.TD:
			case TAG_ID.TH:
				p.tmplInsertionModeStack[0] = InsertionMode.IN_ROW;
				p.insertionMode = InsertionMode.IN_ROW;
				startTagInRow(p, token);
				break;
			default:
				p.tmplInsertionModeStack[0] = InsertionMode.IN_BODY;
				p.insertionMode = InsertionMode.IN_BODY;
				startTagInBody(p, token);
		}
	}
	function endTagInTemplate(p, token) {
		if (token.tagID === TAG_ID.TEMPLATE) templateEndTagInHead(p, token);
	}
	function eofInTemplate(p, token) {
		if (p.openElements.tmplCount > 0) {
			p.openElements.popUntilTagNamePopped(TAG_ID.TEMPLATE);
			p.activeFormattingElements.clearToLastMarker();
			p.tmplInsertionModeStack.shift();
			p._resetInsertionMode();
			p.onEof(token);
		} else stopParsing(p, token);
	}
	function startTagAfterBody(p, token) {
		if (token.tagID === TAG_ID.HTML) startTagInBody(p, token);
		else tokenAfterBody(p, token);
	}
	function endTagAfterBody(p, token) {
		var _a;
		if (token.tagID === TAG_ID.HTML) {
			if (!p.fragmentContext) p.insertionMode = InsertionMode.AFTER_AFTER_BODY;
			if (p.options.sourceCodeLocationInfo && p.openElements.tagIDs[0] === TAG_ID.HTML) {
				p._setEndLocation(p.openElements.items[0], token);
				const bodyElement = p.openElements.items[1];
				if (bodyElement && !((_a = p.treeAdapter.getNodeSourceCodeLocation(bodyElement)) === null || _a === void 0 ? void 0 : _a.endTag)) p._setEndLocation(bodyElement, token);
			}
		} else tokenAfterBody(p, token);
	}
	function tokenAfterBody(p, token) {
		p.insertionMode = InsertionMode.IN_BODY;
		modeInBody(p, token);
	}
	function startTagInFrameset(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.FRAMESET:
				p._insertElement(token, NS.HTML);
				break;
			case TAG_ID.FRAME:
				p._appendElement(token, NS.HTML);
				token.ackSelfClosing = true;
				break;
			case TAG_ID.NOFRAMES: startTagInHead(p, token);
		}
	}
	function endTagInFrameset(p, token) {
		if (token.tagID === TAG_ID.FRAMESET && !p.openElements.isRootHtmlElementCurrent()) {
			p.openElements.pop();
			if (!p.fragmentContext && p.openElements.currentTagId !== TAG_ID.FRAMESET) p.insertionMode = InsertionMode.AFTER_FRAMESET;
		}
	}
	function startTagAfterFrameset(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.NOFRAMES: startTagInHead(p, token);
		}
	}
	function endTagAfterFrameset(p, token) {
		if (token.tagID === TAG_ID.HTML) p.insertionMode = InsertionMode.AFTER_AFTER_FRAMESET;
	}
	function startTagAfterAfterBody(p, token) {
		if (token.tagID === TAG_ID.HTML) startTagInBody(p, token);
		else tokenAfterAfterBody(p, token);
	}
	function tokenAfterAfterBody(p, token) {
		p.insertionMode = InsertionMode.IN_BODY;
		modeInBody(p, token);
	}
	function startTagAfterAfterFrameset(p, token) {
		switch (token.tagID) {
			case TAG_ID.HTML:
				startTagInBody(p, token);
				break;
			case TAG_ID.NOFRAMES: startTagInHead(p, token);
		}
	}
	function nullCharacterInForeignContent(p, token) {
		token.chars = "�";
		p._insertCharacters(token);
	}
	function characterInForeignContent(p, token) {
		p._insertCharacters(token);
		p.framesetOk = false;
	}
	function popUntilHtmlOrIntegrationPoint(p) {
		while (p.treeAdapter.getNamespaceURI(p.openElements.current) !== NS.HTML && p.openElements.currentTagId !== void 0 && !p._isIntegrationPoint(p.openElements.currentTagId, p.openElements.current)) p.openElements.pop();
	}
	function startTagInForeignContent(p, token) {
		if (causesExit(token)) {
			popUntilHtmlOrIntegrationPoint(p);
			p._startTagOutsideForeignContent(token);
		} else {
			const current = p._getAdjustedCurrentElement();
			const currentNs = p.treeAdapter.getNamespaceURI(current);
			if (currentNs === NS.MATHML) adjustTokenMathMLAttrs(token);
			else if (currentNs === NS.SVG) {
				adjustTokenSVGTagName(token);
				adjustTokenSVGAttrs(token);
			}
			adjustTokenXMLAttrs(token);
			if (token.selfClosing) p._appendElement(token, currentNs);
			else p._insertElement(token, currentNs);
			token.ackSelfClosing = true;
		}
	}
	function endTagInForeignContent(p, token) {
		if (token.tagID === TAG_ID.P || token.tagID === TAG_ID.BR) {
			popUntilHtmlOrIntegrationPoint(p);
			p._endTagOutsideForeignContent(token);
			return;
		}
		for (let i = p.openElements.stackTop; i > 0; i--) {
			const element = p.openElements.items[i];
			if (p.treeAdapter.getNamespaceURI(element) === NS.HTML) {
				p._endTagOutsideForeignContent(token);
				break;
			}
			const tagName = p.treeAdapter.getTagName(element);
			if (tagName.toLowerCase() === token.tagName) {
				token.tagName = tagName;
				p.openElements.shortenToLength(i);
				break;
			}
		}
	}
	TAG_NAMES.AREA, TAG_NAMES.BASE, TAG_NAMES.BASEFONT, TAG_NAMES.BGSOUND, TAG_NAMES.BR, TAG_NAMES.COL, TAG_NAMES.EMBED, TAG_NAMES.FRAME, TAG_NAMES.HR, TAG_NAMES.IMG, TAG_NAMES.INPUT, TAG_NAMES.KEYGEN, TAG_NAMES.LINK, TAG_NAMES.META, TAG_NAMES.PARAM, TAG_NAMES.SOURCE, TAG_NAMES.TRACK, TAG_NAMES.WBR;
	//#endregion
	//#region node_modules/parse5/dist/index.js
	/**
	* Parses an HTML string.
	*
	* @param html Input HTML string.
	* @param options Parsing options.
	* @returns Document
	*
	* @example
	*
	* ```js
	* const parse5 = require('parse5');
	*
	* const document = parse5.parse('<!DOCTYPE html><html><head></head><body>Hi there!</body></html>');
	*
	* console.log(document.childNodes[1].tagName); //> 'html'
	*```
	*/
	function parse$2(html, options) {
		return Parser.parse(html, options);
	}
	//#endregion
	//#region node_modules/domelementtype/dist/index.js
	/** Types of elements found in htmlparser2's DOM */
	var ElementType;
	(function(ElementType) {
		/** Type for the root element of a document */
		ElementType["Root"] = "root";
		/** Type for Text */
		ElementType["Text"] = "text";
		/** Type for <? ... ?> */
		ElementType["Directive"] = "directive";
		/** Type for <!-- ... --> */
		ElementType["Comment"] = "comment";
		/** Type for <script> tags */
		ElementType["Script"] = "script";
		/** Type for <style> tags */
		ElementType["Style"] = "style";
		/** Type for Any tag */
		ElementType["Tag"] = "tag";
		/** Type for <![CDATA[ ... ]]> */
		ElementType["CDATA"] = "cdata";
		/** Type for <!doctype ...> */
		ElementType["Doctype"] = "doctype";
	})(ElementType || (ElementType = {}));
	/**
	* Tests whether an element is a tag or not.
	* @param element Element to test
	* @param element.type Node type discriminator to check.
	*/
	function isTag$1(element) {
		return element.type === ElementType.Tag || element.type === ElementType.Script || element.type === ElementType.Style;
	}
	/** Type for the root element of a document */
	var Root = ElementType.Root;
	/** Type for Text */
	var Text$1 = ElementType.Text;
	/** Type for <? ... ?> */
	var Directive = ElementType.Directive;
	/** Type for <!-- ... --> */
	var Comment$1 = ElementType.Comment;
	/** Type for <script> tags */
	var Script = ElementType.Script;
	/** Type for <style> tags */
	var Style = ElementType.Style;
	/** Type for Any tag */
	var Tag = ElementType.Tag;
	/** Type for <![CDATA[ ... ]]> */
	var CDATA$1 = ElementType.CDATA;
	ElementType.Doctype;
	//#endregion
	//#region node_modules/domhandler/dist/node.js
	/**
	* This object will be used as the prototype for Nodes when creating a
	* DOM-Level-1-compliant structure.
	*/
	var Node = class {
		constructor() {
			_defineProperty(
				this,
				/** Parent of the node */
				"parent",
				null
			);
			_defineProperty(
				this,
				/** Previous sibling */
				"prev",
				null
			);
			_defineProperty(
				this,
				/** Next sibling */
				"next",
				null
			);
			_defineProperty(
				this,
				/** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
				"startIndex",
				null
			);
			_defineProperty(
				this,
				/** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
				"endIndex",
				null
			);
		}
		/**
		* Same as {@link parent}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get parentNode() {
			return this.parent;
		}
		set parentNode(parent) {
			this.parent = parent;
		}
		/**
		* Same as {@link prev}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get previousSibling() {
			return this.prev;
		}
		set previousSibling(previous) {
			this.prev = previous;
		}
		/**
		* Same as {@link next}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get nextSibling() {
			return this.next;
		}
		set nextSibling(next) {
			this.next = next;
		}
		/**
		* Clone this node, and optionally its children.
		* @param recursive Clone child nodes as well.
		* @returns A clone of the node.
		*/
		cloneNode(recursive = false) {
			return cloneNode(this, recursive);
		}
	};
	/**
	* A node that contains some data.
	*/
	var DataNode = class extends Node {
		/**
		* @param data The content of the data node
		*/
		constructor(data) {
			super();
			_defineProperty(this, "data", void 0);
			this.data = data;
		}
		/**
		* Same as {@link data}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get nodeValue() {
			return this.data;
		}
		set nodeValue(data) {
			this.data = data;
		}
	};
	/**
	* Text within the document.
	*/
	var Text = class extends DataNode {
		constructor(..._args) {
			super(..._args);
			_defineProperty(this, "type", ElementType.Text);
		}
		get nodeType() {
			return 3;
		}
	};
	/**
	* Comments within the document.
	*/
	var Comment = class extends DataNode {
		constructor(..._args2) {
			super(..._args2);
			_defineProperty(this, "type", ElementType.Comment);
		}
		get nodeType() {
			return 8;
		}
	};
	/**
	* Processing instructions, including doc types.
	*/
	var ProcessingInstruction = class extends DataNode {
		constructor(name, data) {
			super(data);
			_defineProperty(this, "type", ElementType.Directive);
			_defineProperty(this, "name", void 0);
			_defineProperty(
				this,
				/** If this is a doctype, the document type name (parse5 only). */
				"x-name",
				void 0
			);
			_defineProperty(
				this,
				/** If this is a doctype, the document type public identifier (parse5 only). */
				"x-publicId",
				void 0
			);
			_defineProperty(
				this,
				/** If this is a doctype, the document type system identifier (parse5 only). */
				"x-systemId",
				void 0
			);
			this.name = name;
		}
		get nodeType() {
			return 1;
		}
	};
	/**
	* A node that can have children.
	*/
	var NodeWithChildren = class extends Node {
		/**
		* @param children Children of the node. Only certain node types can have children.
		*/
		constructor(children) {
			super();
			_defineProperty(this, "children", void 0);
			this.children = children;
		}
		/** First child of the node. */
		get firstChild() {
			var _this$children$;
			return (_this$children$ = this.children[0]) !== null && _this$children$ !== void 0 ? _this$children$ : null;
		}
		/** Last child of the node. */
		get lastChild() {
			return this.children.length > 0 ? this.children[this.children.length - 1] : null;
		}
		/**
		* Same as {@link children}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get childNodes() {
			return this.children;
		}
		set childNodes(children) {
			this.children = children;
		}
	};
	/**
	* CDATA nodes.
	*/
	var CDATA = class extends NodeWithChildren {
		constructor(..._args3) {
			super(..._args3);
			_defineProperty(this, "type", ElementType.CDATA);
		}
		get nodeType() {
			return 4;
		}
	};
	/**
	* The root node of the document.
	*/
	var Document = class extends NodeWithChildren {
		constructor(..._args4) {
			super(..._args4);
			_defineProperty(this, "type", ElementType.Root);
		}
		get nodeType() {
			return 9;
		}
	};
	/**
	* An element within the DOM.
	*/
	var Element = class extends NodeWithChildren {
		/**
		* @param name Name of the tag, eg. `div`, `span`.
		* @param attribs Object mapping attribute names to attribute values.
		* @param children Children of the node.
		* @param type Node type used for the new node instance.
		*/
		constructor(name, attribs, children = [], type = name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag) {
			super(children);
			_defineProperty(this, "name", void 0);
			_defineProperty(this, "attribs", void 0);
			_defineProperty(this, "type", void 0);
			_defineProperty(
				this,
				/** Element namespace (parse5 only). */
				"namespace",
				void 0
			);
			_defineProperty(
				this,
				/** Element attribute namespaces (parse5 only). */
				"x-attribsNamespace",
				void 0
			);
			_defineProperty(
				this,
				/** Element attribute namespace-related prefixes (parse5 only). */
				"x-attribsPrefix",
				void 0
			);
			this.name = name;
			this.attribs = attribs;
			this.type = type;
		}
		get nodeType() {
			return 1;
		}
		/**
		* Same as {@link name}.
		* [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
		*/
		get tagName() {
			return this.name;
		}
		set tagName(name) {
			this.name = name;
		}
		get attributes() {
			return Object.keys(this.attribs).map((name) => {
				var _this$xAttribsNamesp, _this$xAttribsPrefix;
				return {
					name,
					value: this.attribs[name],
					namespace: (_this$xAttribsNamesp = this["x-attribsNamespace"]) === null || _this$xAttribsNamesp === void 0 ? void 0 : _this$xAttribsNamesp[name],
					prefix: (_this$xAttribsPrefix = this["x-attribsPrefix"]) === null || _this$xAttribsPrefix === void 0 ? void 0 : _this$xAttribsPrefix[name]
				};
			});
		}
	};
	/**
	* Checks if `node` is an element node.
	* @param node Node to check.
	* @returns `true` if the node is an element node.
	*/
	function isTag(node) {
		return isTag$1(node);
	}
	/**
	* Checks if `node` is a CDATA node.
	* @param node Node to check.
	* @returns `true` if the node is a CDATA node.
	*/
	function isCDATA(node) {
		return node.type === ElementType.CDATA;
	}
	/**
	* Checks if `node` is a text node.
	* @param node Node to check.
	* @returns `true` if the node is a text node.
	*/
	function isText(node) {
		return node.type === ElementType.Text;
	}
	/**
	* Checks if `node` is a comment node.
	* @param node Node to check.
	* @returns `true` if the node is a comment node.
	*/
	function isComment(node) {
		return node.type === ElementType.Comment;
	}
	/**
	* Checks if `node` is a directive node.
	* @param node Node to check.
	* @returns `true` if the node is a directive node.
	*/
	function isDirective(node) {
		return node.type === ElementType.Directive;
	}
	/**
	* Checks if `node` is a document node.
	* @param node Node to check.
	* @returns `true` if the node is a document node.
	*/
	function isDocument(node) {
		return node.type === ElementType.Root;
	}
	/**
	* Checks if `node` has children.
	* @param node Node to check.
	* @returns `true` if the node has children.
	*/
	function hasChildren(node) {
		return Object.hasOwn(node, "children");
	}
	/**
	* Clone a node, and optionally its children.
	* @param node Node to clone.
	* @param recursive Clone child nodes as well.
	* @returns A clone of the node.
	*/
	function cloneNode(node, recursive = false) {
		let result;
		if (isText(node)) result = new Text(node.data);
		else if (isComment(node)) result = new Comment(node.data);
		else if (isTag(node)) {
			const children = recursive ? cloneChildren(node.children) : [];
			const clone = new Element(node.name, _objectSpread2({}, node.attribs), children);
			for (const child of children) child.parent = clone;
			if (node.namespace != null) clone.namespace = node.namespace;
			if (node["x-attribsNamespace"]) clone["x-attribsNamespace"] = _objectSpread2({}, node["x-attribsNamespace"]);
			if (node["x-attribsPrefix"]) clone["x-attribsPrefix"] = _objectSpread2({}, node["x-attribsPrefix"]);
			result = clone;
		} else if (isCDATA(node)) {
			const children = recursive ? cloneChildren(node.children) : [];
			const clone = new CDATA(children);
			for (const child of children) child.parent = clone;
			result = clone;
		} else if (isDocument(node)) {
			const children = recursive ? cloneChildren(node.children) : [];
			const clone = new Document(children);
			for (const child of children) child.parent = clone;
			if (node["x-mode"]) clone["x-mode"] = node["x-mode"];
			result = clone;
		} else if (isDirective(node)) {
			const instruction = new ProcessingInstruction(node.name, node.data);
			if (node["x-name"] != null) {
				instruction["x-name"] = node["x-name"];
				instruction["x-publicId"] = node["x-publicId"];
				instruction["x-systemId"] = node["x-systemId"];
			}
			result = instruction;
		} else throw new Error(`Not implemented yet: ${node.type}`);
		result.startIndex = node.startIndex;
		result.endIndex = node.endIndex;
		if (node.sourceCodeLocation != null) result.sourceCodeLocation = node.sourceCodeLocation;
		return result;
	}
	/**
	* Clone a list of child nodes.
	* @param childs The child nodes to clone.
	* @returns A list of cloned child nodes.
	*/
	function cloneChildren(childs) {
		const children = childs.map((child) => cloneNode(child, true));
		for (let index = 1; index < children.length; index++) {
			children[index].prev = children[index - 1];
			children[index - 1].next = children[index];
		}
		return children;
	}
	//#endregion
	//#region node_modules/parse5-htmlparser2-tree-adapter/dist/index.js
	function enquoteDoctypeId(id) {
		const quote = id.includes("\"") ? "'" : "\"";
		return quote + id + quote;
	}
	/** @internal */
	function serializeDoctypeContent(name, publicId, systemId) {
		let str = "!DOCTYPE ";
		if (name) str += name;
		if (publicId) str += ` PUBLIC ${enquoteDoctypeId(publicId)}`;
		else if (systemId) str += " SYSTEM";
		if (systemId) str += ` ${enquoteDoctypeId(systemId)}`;
		return str;
	}
	var adapter = {
		isCommentNode: isComment,
		isElementNode: isTag,
		isTextNode: isText,
		createDocument() {
			const node = new Document([]);
			node["x-mode"] = DOCUMENT_MODE.NO_QUIRKS;
			return node;
		},
		createDocumentFragment() {
			return new Document([]);
		},
		createElement(tagName, namespaceURI, attrs) {
			const attribs = Object.create(null);
			const attribsNamespace = Object.create(null);
			const attribsPrefix = Object.create(null);
			for (let i = 0; i < attrs.length; i++) {
				const attrName = attrs[i].name;
				attribs[attrName] = attrs[i].value;
				attribsNamespace[attrName] = attrs[i].namespace;
				attribsPrefix[attrName] = attrs[i].prefix;
			}
			const node = new Element(tagName, attribs, []);
			node.namespace = namespaceURI;
			node["x-attribsNamespace"] = attribsNamespace;
			node["x-attribsPrefix"] = attribsPrefix;
			return node;
		},
		createCommentNode(data) {
			return new Comment(data);
		},
		createTextNode(value) {
			return new Text(value);
		},
		appendChild(parentNode, newNode) {
			const prev = parentNode.children[parentNode.children.length - 1];
			if (prev) {
				prev.next = newNode;
				newNode.prev = prev;
			}
			parentNode.children.push(newNode);
			newNode.parent = parentNode;
		},
		insertBefore(parentNode, newNode, referenceNode) {
			const insertionIdx = parentNode.children.indexOf(referenceNode);
			const { prev } = referenceNode;
			if (prev) {
				prev.next = newNode;
				newNode.prev = prev;
			}
			referenceNode.prev = newNode;
			newNode.next = referenceNode;
			parentNode.children.splice(insertionIdx, 0, newNode);
			newNode.parent = parentNode;
		},
		setTemplateContent(templateElement, contentElement) {
			adapter.appendChild(templateElement, contentElement);
		},
		getTemplateContent(templateElement) {
			return templateElement.children[0];
		},
		setDocumentType(document, name, publicId, systemId) {
			const data = serializeDoctypeContent(name, publicId, systemId);
			let doctypeNode = document.children.find((node) => isDirective(node) && node.name === "!doctype");
			if (doctypeNode) doctypeNode.data = data !== null && data !== void 0 ? data : null;
			else {
				doctypeNode = new ProcessingInstruction("!doctype", data);
				adapter.appendChild(document, doctypeNode);
			}
			doctypeNode["x-name"] = name;
			doctypeNode["x-publicId"] = publicId;
			doctypeNode["x-systemId"] = systemId;
		},
		setDocumentMode(document, mode) {
			document["x-mode"] = mode;
		},
		getDocumentMode(document) {
			return document["x-mode"];
		},
		detachNode(node) {
			if (node.parent) {
				const idx = node.parent.children.indexOf(node);
				const { prev, next } = node;
				node.prev = null;
				node.next = null;
				if (prev) prev.next = next;
				if (next) next.prev = prev;
				node.parent.children.splice(idx, 1);
				node.parent = null;
			}
		},
		insertText(parentNode, text) {
			const lastChild = parentNode.children[parentNode.children.length - 1];
			if (lastChild && isText(lastChild)) lastChild.data += text;
			else adapter.appendChild(parentNode, adapter.createTextNode(text));
		},
		insertTextBefore(parentNode, text, referenceNode) {
			const prevNode = parentNode.children[parentNode.children.indexOf(referenceNode) - 1];
			if (prevNode && isText(prevNode)) prevNode.data += text;
			else adapter.insertBefore(parentNode, adapter.createTextNode(text), referenceNode);
		},
		adoptAttributes(recipient, attrs) {
			for (let i = 0; i < attrs.length; i++) {
				const attrName = attrs[i].name;
				if (recipient.attribs[attrName] === void 0) {
					recipient.attribs[attrName] = attrs[i].value;
					recipient["x-attribsNamespace"][attrName] = attrs[i].namespace;
					recipient["x-attribsPrefix"][attrName] = attrs[i].prefix;
				}
			}
		},
		getFirstChild(node) {
			return node.children[0];
		},
		getChildNodes(node) {
			return node.children;
		},
		getParentNode(node) {
			return node.parent;
		},
		getAttrList(element) {
			return element.attributes;
		},
		getTagName(element) {
			return element.name;
		},
		getNamespaceURI(element) {
			return element.namespace;
		},
		getTextNodeContent(textNode) {
			return textNode.data;
		},
		getCommentNodeContent(commentNode) {
			return commentNode.data;
		},
		getDocumentTypeNodeName(doctypeNode) {
			var _a;
			return (_a = doctypeNode["x-name"]) !== null && _a !== void 0 ? _a : "";
		},
		getDocumentTypeNodePublicId(doctypeNode) {
			var _a;
			return (_a = doctypeNode["x-publicId"]) !== null && _a !== void 0 ? _a : "";
		},
		getDocumentTypeNodeSystemId(doctypeNode) {
			var _a;
			return (_a = doctypeNode["x-systemId"]) !== null && _a !== void 0 ? _a : "";
		},
		isDocumentTypeNode(node) {
			return isDirective(node) && node.name === "!doctype";
		},
		setNodeSourceCodeLocation(node, location) {
			if (location) {
				node.startIndex = location.startOffset;
				node.endIndex = location.endOffset;
			}
			node.sourceCodeLocation = location;
		},
		getNodeSourceCodeLocation(node) {
			return node.sourceCodeLocation;
		},
		updateNodeSourceCodeLocation(node, endLocation) {
			if (endLocation.endOffset != null) node.endIndex = endLocation.endOffset;
			node.sourceCodeLocation = _objectSpread2(_objectSpread2({}, node.sourceCodeLocation), endLocation);
		}
	};
	//#endregion
	//#region src/html/content.ts
	/** Whether content is a block, rather than content of a paragraph */
	var isBlock = (content) => content.type === "paragraph" || content.type === "table" || content.type === "block-break";
	//#endregion
	//#region src/html/css/css-color.ts
	var NAMED_COLORS = new Map(Object.entries({
		aliceblue: "f0f8ff",
		antiquewhite: "faebd7",
		aqua: "00ffff",
		aquamarine: "7fffd4",
		azure: "f0ffff",
		beige: "f5f5dc",
		bisque: "ffe4c4",
		black: "000000",
		blanchedalmond: "ffebcd",
		blue: "0000ff",
		blueviolet: "8a2be2",
		brown: "a52a2a",
		burlywood: "deb887",
		cadetblue: "5f9ea0",
		chartreuse: "7fff00",
		chocolate: "d2691e",
		coral: "ff7f50",
		cornflowerblue: "6495ed",
		cornsilk: "fff8dc",
		crimson: "dc143c",
		cyan: "00ffff",
		darkblue: "00008b",
		darkcyan: "008b8b",
		darkgoldenrod: "b8860b",
		darkgray: "a9a9a9",
		darkgreen: "006400",
		darkgrey: "a9a9a9",
		darkkhaki: "bdb76b",
		darkmagenta: "8b008b",
		darkolivegreen: "556b2f",
		darkorange: "ff8c00",
		darkorchid: "9932cc",
		darkred: "8b0000",
		darksalmon: "e9967a",
		darkseagreen: "8fbc8f",
		darkslateblue: "483d8b",
		darkslategray: "2f4f4f",
		darkslategrey: "2f4f4f",
		darkturquoise: "00ced1",
		darkviolet: "9400d3",
		deeppink: "ff1493",
		deepskyblue: "00bfff",
		dimgray: "696969",
		dimgrey: "696969",
		dodgerblue: "1e90ff",
		firebrick: "b22222",
		floralwhite: "fffaf0",
		forestgreen: "228b22",
		fuchsia: "ff00ff",
		gainsboro: "dcdcdc",
		ghostwhite: "f8f8ff",
		gold: "ffd700",
		goldenrod: "daa520",
		gray: "808080",
		green: "008000",
		greenyellow: "adff2f",
		grey: "808080",
		honeydew: "f0fff0",
		hotpink: "ff69b4",
		indianred: "cd5c5c",
		indigo: "4b0082",
		ivory: "fffff0",
		khaki: "f0e68c",
		lavender: "e6e6fa",
		lavenderblush: "fff0f5",
		lawngreen: "7cfc00",
		lemonchiffon: "fffacd",
		lightblue: "add8e6",
		lightcoral: "f08080",
		lightcyan: "e0ffff",
		lightgoldenrodyellow: "fafad2",
		lightgray: "d3d3d3",
		lightgreen: "90ee90",
		lightgrey: "d3d3d3",
		lightpink: "ffb6c1",
		lightsalmon: "ffa07a",
		lightseagreen: "20b2aa",
		lightskyblue: "87cefa",
		lightslategray: "778899",
		lightslategrey: "778899",
		lightsteelblue: "b0c4de",
		lightyellow: "ffffe0",
		lime: "00ff00",
		limegreen: "32cd32",
		linen: "faf0e6",
		magenta: "ff00ff",
		maroon: "800000",
		mediumaquamarine: "66cdaa",
		mediumblue: "0000cd",
		mediumorchid: "ba55d3",
		mediumpurple: "9370db",
		mediumseagreen: "3cb371",
		mediumslateblue: "7b68ee",
		mediumspringgreen: "00fa9a",
		mediumturquoise: "48d1cc",
		mediumvioletred: "c71585",
		midnightblue: "191970",
		mintcream: "f5fffa",
		mistyrose: "ffe4e1",
		moccasin: "ffe4b5",
		navajowhite: "ffdead",
		navy: "000080",
		oldlace: "fdf5e6",
		olive: "808000",
		olivedrab: "6b8e23",
		orange: "ffa500",
		orangered: "ff4500",
		orchid: "da70d6",
		palegoldenrod: "eee8aa",
		palegreen: "98fb98",
		paleturquoise: "afeeee",
		palevioletred: "db7093",
		papayawhip: "ffefd5",
		peachpuff: "ffdab9",
		peru: "cd853f",
		pink: "ffc0cb",
		plum: "dda0dd",
		powderblue: "b0e0e6",
		purple: "800080",
		rebeccapurple: "663399",
		red: "ff0000",
		rosybrown: "bc8f8f",
		royalblue: "4169e1",
		saddlebrown: "8b4513",
		salmon: "fa8072",
		sandybrown: "f4a460",
		seagreen: "2e8b57",
		seashell: "fff5ee",
		sienna: "a0522d",
		silver: "c0c0c0",
		skyblue: "87ceeb",
		slateblue: "6a5acd",
		slategray: "708090",
		slategrey: "708090",
		snow: "fffafa",
		springgreen: "00ff7f",
		steelblue: "4682b4",
		tan: "d2b48c",
		teal: "008080",
		thistle: "d8bfd8",
		tomato: "ff6347",
		turquoise: "40e0d0",
		violet: "ee82ee",
		wheat: "f5deb3",
		white: "ffffff",
		whitesmoke: "f5f5f5",
		yellow: "ffff00",
		yellowgreen: "9acd32",
		transparent: "00000000"
	}));
	var XYZ_TO_LINEAR_SRGB = [
		[
			12831 / 3959,
			-329 / 214,
			-1974 / 3959
		],
		[
			-851781 / 878810,
			1648619 / 878810,
			36519 / 878810
		],
		[
			705 / 12673,
			-2585 / 12673,
			705 / 667
		]
	];
	var LINEAR_P3_TO_XYZ = [
		[
			608311 / 1250200,
			189793 / 714400,
			198249 / 1000160
		],
		[
			35783 / 156275,
			247089 / 357200,
			198249 / 2500400
		],
		[
			0,
			32229 / 714400,
			5220557 / 5000800
		]
	];
	var D50_TO_D65 = [
		[
			.955473421488075,
			-.02309845494876471,
			.06325924320057072
		],
		[
			-.0283697093338637,
			1.0099953980813041,
			.021041441191917323
		],
		[
			.012314014864481998,
			-.020507649298898964,
			1.330365926242124
		]
	];
	var OKLAB_TO_LMS = [
		[
			1,
			.3963377773761749,
			.2158037573099136
		],
		[
			1,
			-.1055613458156586,
			-.0638541728258133
		],
		[
			1,
			-.0894841775298119,
			-1.2914855480194092
		]
	];
	var LMS_TO_XYZ = [
		[
			1.2268798758459243,
			-.5578149944602171,
			.2813910456659647
		],
		[
			-.0405757452148008,
			1.112286803280317,
			-.0717110580655164
		],
		[
			-.0763729366746601,
			-.4214933324022432,
			1.5869240198367816
		]
	];
	var D50_WHITE_X = .3457 / .3585;
	var D50_WHITE_Z = .2958 / .3585;
	var LAB_EPSILON = 216 / 24389;
	var LAB_KAPPA = 24389 / 27;
	var WHITE = {
		red: 255,
		green: 255,
		blue: 255,
		alpha: 1
	};
	var VALUE = /^([+-]?(?:\d*\.\d+|\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn|)$/;
	var FUNCTION_CALL = /^([a-z-]+)\(([^()]*)\)$/;
	var HEX_DIGITS = /^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/;
	var numberOrPercentage = (hundredPercent) => /* @__PURE__ */ new Map([["", 1], ["%", hundredPercent]]);
	var ONE = numberOrPercentage(1);
	var HUNDRED = numberOrPercentage(100);
	var BYTE = numberOrPercentage(255);
	var ONLY_NUMBER = /* @__PURE__ */ new Map([["", 1]]);
	var ONLY_PERCENTAGE = /* @__PURE__ */ new Map([["%", 100]]);
	var ONLY_PERCENTAGE_OF_BYTE = /* @__PURE__ */ new Map([["%", 255]]);
	var HUE = /* @__PURE__ */ new Map([
		["", 1],
		["deg", 1],
		["rad", 180 / Math.PI],
		["grad", .9],
		["turn", 360]
	]);
	/** Keeps a value from 0 to the most it can be, with NaN, which huge values can come to, as 0 */
	var clamp = (value, most) => value > 0 ? Math.min(value, most) : 0;
	var dot = ([a, b, c], [x, y, z]) => a * x + b * y + c * z;
	var multiply = ([first, second, third], vector) => [
		dot(first, vector),
		dot(second, vector),
		dot(third, vector)
	];
	var each = ([a, b, c], change) => [
		change(a),
		change(b),
		change(c)
	];
	var toLinear = (value) => {
		const size = Math.abs(value);
		return size <= .04045 ? value / 12.92 : Math.sign(value) * Math.pow((size + .055) / 1.055, 2.4);
	};
	var fromLinear = (value) => {
		const size = Math.abs(value);
		return size <= .0031308 ? value * 12.92 : Math.sign(value) * (1.055 * Math.pow(size, 1 / 2.4) - .055);
	};
	var toBytes$1 = (rgb) => each(rgb, (value) => value * 255);
	var fromXyz = (xyz) => toBytes$1(each(multiply(XYZ_TO_LINEAR_SRGB, xyz), fromLinear));
	var fromXyzD50 = (xyz) => fromXyz(multiply(D50_TO_D65, xyz));
	var fromHsl = (hue, saturation, lightness) => {
		const degrees = (hue % 360 + 360) % 360;
		const amount = saturation * Math.min(lightness, 1 - lightness);
		const channel = (offset) => {
			const k = (offset + degrees / 30) % 12;
			return lightness - amount * Math.max(-1, Math.min(k - 3, 9 - k, 1));
		};
		return [
			channel(0),
			channel(8),
			channel(4)
		];
	};
	var fromHwb = (hue, whiteness, blackness) => {
		if (whiteness + blackness >= 1) {
			const gray = whiteness / (whiteness + blackness);
			return [
				gray,
				gray,
				gray
			];
		}
		return each(fromHsl(hue, 1, .5), (value) => value * (1 - whiteness - blackness) + whiteness);
	};
	var undoLabCurve = (f) => Math.pow(f, 3) > LAB_EPSILON ? Math.pow(f, 3) : (116 * f - 16) / LAB_KAPPA;
	var fromLab = (lightness, a, b) => {
		const y = (clamp(lightness, 100) + 16) / 116;
		return fromXyzD50([
			undoLabCurve(y + a / 500) * D50_WHITE_X,
			undoLabCurve(y),
			undoLabCurve(y - b / 200) * D50_WHITE_Z
		]);
	};
	var fromOklab = (lightness, a, b) => fromXyz(multiply(LMS_TO_XYZ, each(multiply(OKLAB_TO_LMS, [
		clamp(lightness, 1),
		a,
		b
	]), (value) => Math.pow(value, 3))));
	/** The a and b of a colour given by its chroma and hue, as lch() and oklch() give it */
	var fromPolar = (chroma, hue) => {
		const angle = hue * Math.PI / 180;
		const length = Math.max(chroma, 0);
		return [length * Math.cos(angle), length * Math.sin(angle)];
	};
	/** Reads a value, such as `50%` or `0.5turn`, in the units it can be given in. `none` is 0, but not in the legacy syntax */
	var readValue = (text, units, legacy) => {
		var _VALUE$exec;
		if (text === "none") return legacy ? void 0 : 0;
		const [, amount, unit] = (_VALUE$exec = VALUE.exec(text)) !== null && _VALUE$exec !== void 0 ? _VALUE$exec : [];
		const worth = units.get(unit);
		if (worth === void 0) return;
		return unit === "%" ? Number(amount) * worth / 100 : Number(amount) * worth;
	};
	var readChannels = (texts, units, legacy) => {
		if (texts.length !== units.length) return;
		const values = units.map((unitsOfChannel, index) => readValue(texts[index], unitsOfChannel, legacy));
		return values.every((value) => value !== void 0) ? values : void 0;
	};
	/**
	* A colour function, which reads its channels in the units given for each, then turns them into sRGB. Only the
	* functions with a legacy syntax have legacy units: some have more than one way, such as rgb(), which takes all
	* numbers or all percentages.
	*/
	var colorFunction = (toRgb, units, legacyUnits = []) => (texts, legacy) => {
		const channels = legacy ? legacyUnits.map((way) => readChannels(texts, way, true)).find((read) => read !== void 0) : readChannels(texts, units, false);
		return channels && toRgb(channels);
	};
	var RGB = colorFunction(([red, green, blue]) => [
		red,
		green,
		blue
	], [
		BYTE,
		BYTE,
		BYTE
	], [[
		ONLY_NUMBER,
		ONLY_NUMBER,
		ONLY_NUMBER
	], [
		ONLY_PERCENTAGE_OF_BYTE,
		ONLY_PERCENTAGE_OF_BYTE,
		ONLY_PERCENTAGE_OF_BYTE
	]]);
	var HSL = colorFunction(([hue, saturation, lightness]) => toBytes$1(fromHsl(hue, Math.max(saturation, 0) / 100, lightness / 100)), [
		HUE,
		HUNDRED,
		HUNDRED
	], [[
		HUE,
		ONLY_PERCENTAGE,
		ONLY_PERCENTAGE
	]]);
	var FUNCTIONS = /* @__PURE__ */ new Map([
		["rgb", RGB],
		["rgba", RGB],
		["hsl", HSL],
		["hsla", HSL],
		["hwb", colorFunction(([hue, whiteness, blackness]) => toBytes$1(fromHwb(hue, whiteness / 100, blackness / 100)), [
			HUE,
			HUNDRED,
			HUNDRED
		])],
		["lab", colorFunction(([lightness, a, b]) => fromLab(lightness, a, b), [
			HUNDRED,
			numberOrPercentage(125),
			numberOrPercentage(125)
		])],
		["lch", colorFunction(([lightness, chroma, hue]) => fromLab(lightness, ...fromPolar(chroma, hue)), [
			HUNDRED,
			numberOrPercentage(150),
			HUE
		])],
		["oklab", colorFunction(([lightness, a, b]) => fromOklab(lightness, a, b), [
			ONE,
			numberOrPercentage(.4),
			numberOrPercentage(.4)
		])],
		["oklch", colorFunction(([lightness, chroma, hue]) => fromOklab(lightness, ...fromPolar(chroma, hue)), [
			ONE,
			numberOrPercentage(.4),
			HUE
		])]
	]);
	var XYZ = colorFunction(([x, y, z]) => fromXyz([
		x,
		y,
		z
	]), [
		ONE,
		ONE,
		ONE
	]);
	var COLOR_SPACES = /* @__PURE__ */ new Map([
		["srgb", colorFunction(([red, green, blue]) => toBytes$1([
			red,
			green,
			blue
		]), [
			ONE,
			ONE,
			ONE
		])],
		["srgb-linear", colorFunction(([red, green, blue]) => toBytes$1(each([
			red,
			green,
			blue
		], fromLinear)), [
			ONE,
			ONE,
			ONE
		])],
		["display-p3", colorFunction(([red, green, blue]) => fromXyz(multiply(LINEAR_P3_TO_XYZ, each([
			red,
			green,
			blue
		], toLinear))), [
			ONE,
			ONE,
			ONE
		])],
		["xyz", XYZ],
		["xyz-d65", XYZ],
		["xyz-d50", colorFunction(([x, y, z]) => fromXyzD50([
			x,
			y,
			z
		]), [
			ONE,
			ONE,
			ONE
		])]
	]);
	var colorOf$1 = ([red, green, blue], alpha) => ({
		red: clamp(red, 255),
		green: clamp(green, 255),
		blue: clamp(blue, 255),
		alpha: clamp(alpha, 1)
	});
	var parseHex = (digits) => {
		if (!HEX_DIGITS.test(digits)) return;
		const long = digits.length < 6 ? [...digits].map((digit) => digit.repeat(2)).join("") : digits;
		const [red, green, blue, alpha = 255] = Array.from({ length: long.length / 2 }, (_, index) => parseInt(long.slice(index * 2, index * 2 + 2), 16));
		return colorOf$1([
			red,
			green,
			blue
		], alpha / 255);
	};
	var argumentsOf = (body) => {
		if (body.includes(",")) {
			const parts = body.split(",").map((part) => part.trim());
			return parts.length <= 4 ? {
				channels: parts.slice(0, 3),
				alpha: parts[3],
				legacy: true
			} : void 0;
		}
		const [channels, alpha, ...more] = body.split("/");
		return more.length === 0 ? {
			channels: channels.trim().split(/\s+/),
			alpha: alpha === null || alpha === void 0 ? void 0 : alpha.trim(),
			legacy: false
		} : void 0;
	};
	var parseFunction = (name, body) => {
		var _COLOR_SPACES$get, _FUNCTIONS$get;
		const parsed = argumentsOf(body);
		if (parsed === void 0) return;
		const { channels, alpha = "1", legacy } = parsed;
		const [space, ...spaceChannels] = channels;
		const rgb = name === "color" ? (_COLOR_SPACES$get = COLOR_SPACES.get(space)) === null || _COLOR_SPACES$get === void 0 ? void 0 : _COLOR_SPACES$get(spaceChannels, legacy) : (_FUNCTIONS$get = FUNCTIONS.get(name)) === null || _FUNCTIONS$get === void 0 ? void 0 : _FUNCTIONS$get(channels, legacy);
		const opacity = readValue(alpha, ONE, legacy);
		return rgb && opacity !== void 0 ? colorOf$1(rgb, opacity) : void 0;
	};
	/**
	* Reads a CSS colour value, as CSS Color 4 writes it: hex such as `#f80` or `#ff880080`, `rgb()`, `rgba()`, `hsl()`,
	* `hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()` in sRGB, linear sRGB, Display P3 or XYZ, the
	* 148 named colours, and `transparent`. Case and the whitespace around it don't matter.
	*
	* Colours outside sRGB are clipped to it.
	*
	* @param value - The value, such as `"rgb(255 128 0 / 50%)"`
	* @returns The colour, `"currentcolor"` for the `currentcolor` keyword in any case, or undefined for anything it
	* doesn't read as a colour, including `inherit`, `initial`, `unset`, `var(...)`, `color-mix(...)` and system colours
	*
	* @example
	* ```typescript
	* parseColor("hsl(30 100% 50%)"); // { red: 255, green: 127.5, blue: 0, alpha: 1 }
	* ```
	*/
	var parseColor = (value) => {
		const text = value.trim().toLowerCase();
		if (text === "currentcolor") return "currentcolor";
		const hex = text.startsWith("#") ? text.slice(1) : NAMED_COLORS.get(text);
		if (hex !== void 0) return parseHex(hex);
		const call = FUNCTION_CALL.exec(text);
		return call ? parseFunction(call[1], call[2]) : void 0;
	};
	/**
	* The colour as Word writes it: six uppercase hex digits with no `#`, such as `"FF8000"`.
	*
	* A partly transparent colour is blended over the background, as Word's text and shading have no transparency.
	*
	* @param color - The colour
	* @param background - What the colour is blended over if it's partly transparent, taken as opaque. White, unless given
	* @returns The hex digits, or undefined for a fully transparent colour (alpha 0), which has none
	*
	* @example
	* ```typescript
	* toHex({ red: 255, green: 0, blue: 0, alpha: 0.5 }); // "FF8080"
	* ```
	*/
	var toHex = ({ red, green, blue, alpha }, background = WHITE) => {
		if (alpha <= 0) return;
		const blend = (front, back) => Math.round(clamp(alpha * front + (1 - alpha) * back, 255)).toString(16).padStart(2, "0");
		return `${blend(red, background.red)}${blend(green, background.green)}${blend(blue, background.blue)}`.toUpperCase();
	};
	//#endregion
	//#region src/html/css/css-syntax.ts
	/** The closing bracket of each opening one */
	var OPENING = /* @__PURE__ */ new Map([
		["(", ")"],
		["[", "]"],
		["{", "}"]
	]);
	/**
	* The CSS without its comments, each of which is a space, as it separates what is on either side of it. A comment
	* that isn't closed runs to the end. Comments in strings are part of the strings.
	*/
	var withoutComments = (css) => {
		let result = "";
		let index = 0;
		while (index < css.length) {
			const character = css[index];
			if (character === "/" && css[index + 1] === "*") {
				const end = css.indexOf("*/", index + 2);
				result += " ";
				index = end === -1 ? css.length : end + 2;
			} else if (character === "\"" || character === "'") {
				const end = endOfString(css, index);
				result += css.slice(index, end);
				index = end;
			} else {
				result += character;
				index++;
			}
		}
		return result;
	};
	/** The index after the string that starts at `start`, after its closing quote, or at the end of a line it doesn't close */
	var endOfString = (css, start) => {
		const quote = css[start];
		let index = start + 1;
		while (index < css.length && css[index] !== quote && css[index] !== "\n") index += css[index] === "\\" ? 2 : 1;
		return Math.min(index + 1, css.length);
	};
	/**
	* The index of the first of the characters given, from `start`, that isn't in a string or in brackets, in CSS without
	* comments, or its length if there is none. A closing bracket without an opening one is skipped over, as is anything
	* after a backslash.
	*/
	var indexOfTopLevel = (css, start, characters) => {
		const closing = [];
		let index = start;
		while (index < css.length) {
			const character = css[index];
			if (character === "\\") {
				index += 2;
				continue;
			}
			if (character === "\"" || character === "'") {
				index = endOfString(css, index);
				continue;
			}
			const closer = OPENING.get(character);
			if (closing.length === 0 && characters.includes(character)) return index;
			if (closer !== void 0) closing.push(closer);
			else if (character === closing[closing.length - 1]) closing.pop();
			index++;
		}
		return css.length;
	};
	/**
	* Splits CSS without comments at each of the characters given that isn't in a string or in brackets. A closing
	* bracket without an opening one is skipped over, as is anything after a backslash.
	*/
	var splitTopLevel = (css, separators) => {
		const parts = [];
		let start = 0;
		let end = indexOfTopLevel(css, start, separators);
		while (end < css.length) {
			parts.push(css.slice(start, end));
			start = end + 1;
			end = indexOfTopLevel(css, start, separators);
		}
		parts.push(css.slice(start));
		return parts;
	};
	var PROPERTY = /^(?:--[^\s:]+|-?[a-z_][a-z0-9_-]*)$/i;
	var IMPORTANT = /!\s*important\s*$/i;
	/**
	* Reads the declarations of a `style` attribute, or of a rule's block. A declaration without a property, a colon or
	* a value is left out, as is one with a block in it, such as a nested rule.
	*/
	var parseDeclarations = (css) => splitTopLevel(withoutComments(css), ";").flatMap((text) => {
		const colon = splitTopLevel(text, ":")[0].length;
		const property = text.slice(0, colon).trim();
		const written = text.slice(colon + 1).trim();
		const important = IMPORTANT.test(written);
		const value = important ? written.replace(IMPORTANT, "").trim() : written;
		if (colon === text.length || !PROPERTY.test(property) || value === "" || value.includes("{")) return [];
		return [{
			property: property.startsWith("--") ? property : property.toLowerCase(),
			value,
			important
		}];
	});
	/**
	* Whether a media query list, such as that of `@media` or of a `<style media>`, is for print: a list is when one of
	* its queries is for print, or for all media without conditions, as docx/html writes a document to be printed. A
	* query that only holds on screens of some width can't be known, and isn't.
	*/
	var isForPrint = (media) => media.trim() === "" || splitTopLevel(media.toLowerCase(), ",").some((query) => {
		const words = query.trim().replace(/^only\s+/, "").split(/\s+/);
		return words[0] === "print" || words.length === 1 && words[0] === "all";
	});
	var GROUPING_RULES = /* @__PURE__ */ new Set([
		"media",
		"supports",
		"layer"
	]);
	/**
	* Reads the style rules of a style sheet, in order, with those in `@media` blocks for print, and in `@supports` and
	* `@layer` blocks. Other at-rules, such as `@import`, `@font-face` and `@page`, are left out, as are rules whose
	* selectors are empty and the HTML comment marks a style sheet in a `<style>` can have.
	*/
	var parseStyleSheet = (css) => rulesOf(withoutComments(css));
	var rulesOf = (css) => {
		const rules = [];
		let index = 0;
		while (index < css.length) {
			const blockStart = indexOfTopLevel(css, index, "{;");
			const prelude = css.slice(index, blockStart).split("<!--").join(" ").split("-->").join(" ").trim();
			if (css[blockStart] !== "{") {
				index = blockStart + 1;
				continue;
			}
			const blockEnd = indexOfTopLevel(css, blockStart + 1, "}");
			const block = css.slice(blockStart + 1, blockEnd);
			index = blockEnd + 1;
			const atRule = /^@([a-z-]+)\s*([^]*)$/i.exec(prelude);
			if (atRule) {
				const [, name, condition] = atRule;
				if (GROUPING_RULES.has(name.toLowerCase()) && (name.toLowerCase() !== "media" || isForPrint(condition))) rules.push(...rulesOf(block));
			} else if (prelude !== "") rules.push({
				selectors: prelude,
				declarations: parseDeclarations(block)
			});
		}
		return rules;
	};
	//#endregion
	//#region src/html/css/css-values.ts
	/**
	* Reads CSS values: lengths, with `calc()`, and the words of a value.
	*
	* @module
	*/
	/** The size of each absolute unit, in points */
	var POINTS = {
		px: .75,
		pt: 1,
		pc: 12,
		in: 72,
		cm: 72 / 2.54,
		mm: 72 / 25.4,
		q: 72 / 101.6
	};
	/** The size of these units, relative to the font size: an `ex` and a `ch` are about half a letter's height and width */
	var FONT_RELATIVE = {
		em: 1,
		ex: .5,
		ch: .5,
		cap: .7,
		ic: 1,
		lh: 1.2
	};
	var NUMBER$1 = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)([a-z%]*)$/i;
	/** The words of a value, split at the spaces that aren't in brackets or strings, such as `1px solid rgb(0, 0, 0)` */
	var wordsOf = (value) => splitTopLevel(value.trim(), " 	\n\r\f").filter((word) => word !== "");
	/** The values of a list, such as the fonts of `font-family`, split at the commas that aren't in brackets or strings */
	var listOf = (value) => splitTopLevel(value, ",").map((item) => item.trim());
	/**
	* Reads a number, such as `1.5` or `-2e3`, or undefined for anything else.
	*/
	var parseNumber = (value) => {
		const match = NUMBER$1.exec(value.trim());
		return match && match[2] === "" ? Number(match[1]) : void 0;
	};
	/**
	* Reads a length, such as `12px`, `1.5em`, `50%` or `calc(100% - 2em)` with lengths of one kind, or `0` without a
	* unit. Viewport units are undefined, as a document has no viewport.
	*/
	var parseLength = (value) => {
		const text = value.trim().toLowerCase();
		const calc = /^calc\(([^]*)\)$/.exec(text);
		if (calc) return calculate(calc[1]);
		const match = NUMBER$1.exec(text);
		if (!match) return;
		const [, written, unit] = match;
		const amount = Number(written);
		if (unit === "") return amount === 0 ? {
			unit: "pt",
			value: 0
		} : void 0;
		if (unit === "%") return {
			unit: "%",
			value: amount
		};
		if (unit === "rem") return {
			unit: "rem",
			value: amount
		};
		if (POINTS[unit] !== void 0) return {
			unit: "pt",
			value: amount * POINTS[unit]
		};
		return FONT_RELATIVE[unit] === void 0 ? void 0 : {
			unit: "em",
			value: amount * FONT_RELATIVE[unit]
		};
	};
	/**
	* Works out `calc()`: sums and differences of lengths of one kind, and lengths multiplied or divided by numbers, in
	* brackets or not. Lengths of different kinds, such as `100% - 2em`, can't be added up without knowing what they are
	* relative to, and are undefined, as is anything else.
	*/
	var calculate = (expression) => {
		const terms = splitTopLevel(expression.replace(/\s([+-])\s/g, "\0$1"), "\0");
		let total;
		for (const term of terms) {
			var _total$value;
			const [, sign, rest] = /^([+-]?)([^]*)$/.exec(term.trim());
			const length = product(rest);
			if (length === void 0 || total !== void 0 && total.unit !== length.unit) return;
			const value = sign === "-" ? -length.value : length.value;
			total = {
				unit: length.unit,
				value: ((_total$value = total === null || total === void 0 ? void 0 : total.value) !== null && _total$value !== void 0 ? _total$value : 0) + value
			};
		}
		return total;
	};
	/** A length multiplied or divided by numbers, such as `2 * 3em / 4`, or a length in brackets */
	var product = (term) => {
		const factors = splitTopLevel(term.replace(/\s*([*/])\s*/g, "\0$1"), "\0");
		let length;
		let multiplier = 1;
		for (const factor of factors) {
			const divide = factor.startsWith("/");
			const text = factor.replace(/^[*/]/, "").trim();
			const scalar = parseNumber(text);
			if (scalar !== void 0) {
				multiplier = divide ? multiplier / scalar : multiplier * scalar;
				continue;
			}
			const bracketed = /^\(([^]*)\)$/.exec(text);
			const factorLength = bracketed ? calculate(bracketed[1]) : parseLength(text);
			if (factorLength === void 0 || divide || length !== void 0) return;
			length = factorLength;
		}
		return length === void 0 || !Number.isFinite(multiplier) ? void 0 : {
			unit: length.unit,
			value: length.value * multiplier
		};
	};
	/**
	* A length in points: an `em` of the font size, a `rem` of the root's font size and a percentage of what it is
	* relative to, or undefined when a percentage has nothing to be relative to.
	*/
	var toPoints = (length, fontSize, rootFontSize, percentOf) => {
		switch (length.unit) {
			case "pt": return length.value;
			case "em": return length.value * fontSize;
			case "rem": return length.value * rootFontSize;
			default: return percentOf === void 0 ? void 0 : length.value * percentOf / 100;
		}
	};
	/** Whether a value is one of CSS's keywords that every property takes */
	var isCssWideKeyword = (value) => /^(?:inherit|initial|unset|revert|revert-layer)$/i.test(value.trim());
	/** A string's text without its quotes and with its escapes read, or the value as it is when it isn't a string */
	var unquote = (value) => {
		const text = value.trim();
		const quoted = /^(["'])([^]*?)\1?$/.exec(text);
		return quoted ? quoted[2].replace(/\\(.)/g, "$1") : text;
	};
	//#endregion
	//#region src/html/css/computed-style.ts
	/**
	* The property that the `styleMap` option's selectors give the elements they match, with the id of a Word style. It
	* can't be a property of CSS's, or a custom property, which is inherited
	*/
	var WORD_STYLE = "-docx-word-style";
	/** The style of the root of a document, which every element's is worked out from */
	var ROOT_STYLE = {
		baseFontSize: 12,
		rootFontSize: 12,
		fontWeight: 400,
		whiteSpace: "normal",
		hidden: false,
		decorations: {},
		customProperties: /* @__PURE__ */ new Map(),
		display: "block",
		margin: {},
		padding: {
			top: 0,
			right: 0,
			bottom: 0,
			left: 0
		},
		border: {}
	};
	var FONT_SIZE_KEYWORDS = /* @__PURE__ */ new Map([
		["xx-small", 6.75],
		["x-small", 7.5],
		["small", 9.75],
		["medium", 12],
		["large", 13.5],
		["x-large", 18],
		["xx-large", 24],
		["xxx-large", 36]
	]);
	var GENERIC_FAMILIES = /* @__PURE__ */ new Map([
		["serif", "Times New Roman"],
		["sans-serif", "Arial"],
		["monospace", "Courier New"],
		["ui-monospace", "Courier New"],
		["cursive", "Comic Sans MS"],
		["fantasy", "Impact"],
		["system-ui", void 0],
		["ui-serif", void 0],
		["ui-sans-serif", void 0],
		["ui-rounded", void 0],
		["math", void 0],
		["emoji", void 0],
		["fangsong", void 0],
		["-apple-system", void 0],
		["blinkmacsystemfont", void 0]
	]);
	var BORDER_WIDTHS$1 = {
		thin: .75,
		medium: 2.25,
		thick: 3.75
	};
	/** The value a property has in its first cascaded value that `read` reads, `inherit` for the parent's, or the default */
	var valueOf = (cascaded, property, read, { inherited, initial, inherits }) => {
		var _cascaded$values$get;
		for (const value of (_cascaded$values$get = cascaded.values.get(property)) !== null && _cascaded$values$get !== void 0 ? _cascaded$values$get : []) {
			if (isCssWideKeyword(value)) {
				const keyword = value.trim().toLowerCase();
				return keyword === "inherit" || keyword === "unset" && inherits ? inherited : initial;
			}
			const parsed = read(value);
			if (parsed !== void 0) return parsed;
		}
		return inherits ? inherited : initial;
	};
	var keywordOf = (...keywords) => (value) => {
		const keyword = value.trim().toLowerCase();
		return keywords.find((candidate) => candidate === keyword);
	};
	/**
	* A colour's hex digits, blended over white when it is partly transparent, "transparent" when it is all transparent,
	* and the text's colour for `currentcolor`, or the fallback when the HTML gives the text no colour
	*/
	var colorOf = (value, currentColor, fallback) => {
		var _toHex;
		const color = parseColor(value);
		return color === "currentcolor" ? currentColor !== null && currentColor !== void 0 ? currentColor : fallback : color && ((_toHex = toHex(color)) !== null && _toHex !== void 0 ? _toHex : "transparent");
	};
	/** The first family of a `font-family` that Word can have, or a font for its generic family */
	var fontFamilyOf = (value) => {
		for (const family of listOf(value)) {
			const name = unquote(family);
			const generic = name === family.trim() ? name.toLowerCase() : "";
			if (GENERIC_FAMILIES.has(generic)) {
				const font = GENERIC_FAMILIES.get(generic);
				if (font) return font;
			} else if (name !== "") return name;
		}
	};
	/** A font weight from 1 to 1000, of a number or keyword, with `bolder` and `lighter` relative to the parent's */
	var fontWeightOf = (value, parent) => {
		const keyword = value.trim().toLowerCase();
		switch (keyword) {
			case "normal": return 400;
			case "bold": return 700;
			case "bolder": return parent < 350 ? 400 : parent < 550 ? 700 : 900;
			case "lighter": return parent < 550 ? 100 : parent < 750 ? 400 : 700;
			default: {
				const weight = parseNumber(keyword);
				return weight !== void 0 && weight >= 1 && weight <= 1e3 ? weight : void 0;
			}
		}
	};
	/** A length, with `em`s of the font size, in points, or undefined for a percentage, which has nothing to be of */
	var pointsOf = (value, fontSize, rootFontSize) => {
		const length = parseLength(value);
		return length && toPoints(length, fontSize, rootFontSize);
	};
	var sizeOf$1 = (fontSize, rootFontSize, keywords) => (value) => {
		if (keywords.includes(value.trim().toLowerCase())) return "none";
		const length = parseLength(value);
		if (length === void 0 || length.value < 0) return;
		return length.unit === "%" ? { percent: length.value } : { points: toPoints(length, fontSize, rootFontSize) };
	};
	/** Whether a property's own value turns something on, or off where it was on, and undefined if it says nothing */
	var turnedOnOrOff = (on, parent) => on === true ? true : on === false && parent !== void 0 ? false : parent;
	/**
	* Works out an element's style.
	*
	* @param cascaded - The element's cascaded values
	* @param parent - Its parent's style
	* @param language - Its `lang` attribute, if it has one
	*/
	var computeStyle = (cascaded, parent, language) => {
		var _own2, _own3, _own4, _own5, _own6, _own7, _own8, _cascaded$values$get2;
		const inheritedFrom = (property, read, inherited, initial) => valueOf(cascaded, property, read, {
			inherited,
			initial,
			inherits: true
		});
		const own = (property, read, inherited) => valueOf(cascaded, property, read, {
			inherited,
			initial: void 0,
			inherits: false
		});
		const fontSize = inheritedFrom("font-size", (value) => {
			const keyword = value.trim().toLowerCase();
			if (keyword === "smaller" || keyword === "larger") return keyword === "smaller" ? parent.baseFontSize / 1.2 : parent.baseFontSize * 1.2;
			const keywordSize = FONT_SIZE_KEYWORDS.get(keyword);
			if (keywordSize !== void 0) return keywordSize;
			const length = parseLength(value);
			return length && length.value >= 0 ? toPoints(length, parent.baseFontSize, parent.rootFontSize, parent.baseFontSize) : void 0;
		}, parent.fontSize);
		const baseFontSize = fontSize !== null && fontSize !== void 0 ? fontSize : parent.baseFontSize;
		const color = inheritedFrom("color", (value) => colorOf(value, parent.color), parent.color);
		const currentColor = color === "transparent" ? void 0 : color;
		const fontWeight = inheritedFrom("font-weight", (value) => fontWeightOf(value, parent.fontWeight), parent.fontWeight, 400);
		const ownWeight = cascaded.values.has("font-weight") ? fontWeight >= 600 : void 0;
		const italic = inheritedFrom("font-style", keywordOf("italic", "oblique", "normal"), void 0, "normal");
		const smallCaps = inheritedFrom("font-variant-caps", keywordOf("small-caps", "all-small-caps", "normal"), void 0, "normal");
		const borderOf = (side) => {
			var _parent$border$side, _own, _parent$border$side2, _parent$border$side3, _ref;
			const style = own(`border-${side}-style`, keywordOf("none", "hidden", "dotted", "dashed", "solid", "double", "groove", "ridge", "inset", "outset"), (_parent$border$side = parent.border[side]) === null || _parent$border$side === void 0 ? void 0 : _parent$border$side.style);
			if (style === void 0 || style === "none" || style === "hidden") return;
			const width = (_own = own(`border-${side}-width`, (value) => {
				var _BORDER_WIDTHS$value$;
				return (_BORDER_WIDTHS$value$ = BORDER_WIDTHS$1[value.trim().toLowerCase()]) !== null && _BORDER_WIDTHS$value$ !== void 0 ? _BORDER_WIDTHS$value$ : pointsOf(value, baseFontSize, parent.rootFontSize);
			}, (_parent$border$side2 = parent.border[side]) === null || _parent$border$side2 === void 0 ? void 0 : _parent$border$side2.width)) !== null && _own !== void 0 ? _own : BORDER_WIDTHS$1.medium;
			const sideColor = own(`border-${side}-color`, (value) => colorOf(value, currentColor, "000000"), (_parent$border$side3 = parent.border[side]) === null || _parent$border$side3 === void 0 ? void 0 : _parent$border$side3.color);
			return width <= 0 || sideColor === "transparent" ? void 0 : {
				style,
				width,
				color: (_ref = sideColor !== null && sideColor !== void 0 ? sideColor : currentColor) !== null && _ref !== void 0 ? _ref : "000000"
			};
		};
		const lengthWithAuto = (property, inherited) => own(property, (value) => value.trim().toLowerCase() === "auto" ? "auto" : pointsOf(value, baseFontSize, parent.rootFontSize), inherited);
		const size = (property, cssProperty, keywords) => {
			const value = own(cssProperty, sizeOf$1(baseFontSize, parent.rootFontSize, keywords), parent[property]);
			return value === "none" ? void 0 : value;
		};
		const decorationLines = own("text-decoration-line", (value) => {
			const words = wordsOf(value.toLowerCase());
			return words.every((word) => [
				"underline",
				"line-through",
				"overline",
				"none",
				"blink"
			].includes(word)) ? words : void 0;
		}, void 0);
		const decorationStyle = (_own2 = own("text-decoration-style", keywordOf("solid", "double", "dotted", "dashed", "wavy"), void 0)) !== null && _own2 !== void 0 ? _own2 : "solid";
		const decorationColor = own("text-decoration-color", (value) => colorOf(value, currentColor), void 0);
		const decoration = _objectSpread2({ style: decorationStyle }, decorationColor && decorationColor !== "transparent" ? { color: decorationColor } : {});
		const decorations = _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, parent.decorations), (decorationLines === null || decorationLines === void 0 ? void 0 : decorationLines.includes("underline")) ? { underline: decoration } : {}), (decorationLines === null || decorationLines === void 0 ? void 0 : decorationLines.includes("line-through")) ? { lineThrough: decoration } : {}), (decorationLines === null || decorationLines === void 0 ? void 0 : decorationLines.includes("overline")) ? { overline: decoration } : {});
		const display = (_own3 = own("display", (value) => wordsOf(value.toLowerCase())[0], parent.display)) !== null && _own3 !== void 0 ? _own3 : "inline";
		const breakOf = (value) => {
			const keyword = value.trim().toLowerCase();
			if ([
				"page",
				"left",
				"right",
				"recto",
				"verso",
				"always",
				"all"
			].includes(keyword)) return "page";
			return keyword === "column" ? "column" : [
				"auto",
				"avoid",
				"avoid-page",
				"avoid-column"
			].includes(keyword) ? "auto" : void 0;
		};
		const breakBefore = own("break-before", breakOf, parent.breakBefore);
		const breakAfter = own("break-after", breakOf, parent.breakAfter);
		const float = own("float", keywordOf("left", "right", "none", "inline-start", "inline-end"), parent.float);
		const verticalAlign = own("vertical-align", (value) => {
			const keyword = keywordOf("super", "sub", "top", "middle", "bottom", "baseline", "text-top", "text-bottom")(value);
			if (keyword) return keyword === "text-top" ? "top" : keyword === "text-bottom" ? "bottom" : keyword;
			const length = parseLength(value);
			return length && { raise: toPoints(length, baseFontSize, parent.rootFontSize, baseFontSize) };
		}, parent.verticalAlign);
		const lineHeight = inheritedFrom("line-height", (value) => {
			if (value.trim().toLowerCase() === "normal") return "normal";
			const multiple = parseNumber(value);
			if (multiple !== void 0) return multiple >= 0 ? { multiple } : void 0;
			const length = parseLength(value);
			if (length === void 0 || length.value < 0) return;
			return length.unit === "%" ? { lines: length.value / 100 } : { points: toPoints(length, baseFontSize, parent.rootFontSize) };
		}, parent.lineHeight);
		const textAlign = inheritedFrom("text-align", (value) => {
			const keyword = value.trim().toLowerCase().replace(/^-(?:webkit|moz)-/, "");
			return keyword === "match-parent" ? parent.textAlign : keywordOf("left", "right", "center", "justify", "start", "end")(keyword);
		}, parent.textAlign);
		const backgroundColor = own("background-color", (value) => colorOf(value, currentColor, "000000"), parent.backgroundColor);
		return {
			color: currentColor,
			fontFamily: inheritedFrom("font-family", fontFamilyOf, parent.fontFamily),
			fontSize: fontSize === void 0 ? void 0 : Math.min(Math.max(fontSize, 1), 1638),
			baseFontSize,
			rootFontSize: parent.rootFontSize,
			fontWeight,
			bold: turnedOnOrOff(ownWeight, parent.bold),
			italic: turnedOnOrOff(italic === void 0 ? void 0 : italic !== "normal", parent.italic),
			smallCaps: turnedOnOrOff(smallCaps === void 0 ? void 0 : smallCaps !== "normal", parent.smallCaps),
			textTransform: inheritedFrom("text-transform", keywordOf("uppercase", "lowercase", "capitalize", "none"), parent.textTransform),
			letterSpacing: inheritedFrom("letter-spacing", (value) => value.trim().toLowerCase() === "normal" ? 0 : pointsOf(value, baseFontSize, parent.rootFontSize), parent.letterSpacing),
			lineHeight: lineHeight === "normal" ? void 0 : lineHeight,
			textAlign,
			textIndent: inheritedFrom("text-indent", (value) => pointsOf(wordsOf(value)[0], baseFontSize, parent.rootFontSize), parent.textIndent),
			whiteSpace: inheritedFrom("white-space", keywordOf("normal", "pre", "nowrap", "pre-wrap", "pre-line", "break-spaces"), parent.whiteSpace, "normal"),
			direction: inheritedFrom("direction", keywordOf("ltr", "rtl"), parent.direction),
			listStyleType: inheritedFrom("list-style-type", (value) => /^["']/.test(value.trim()) ? value.trim() : /^[a-z-]+$/i.test(value.trim()) ? value.trim().toLowerCase() : void 0, parent.listStyleType),
			hidden: inheritedFrom("visibility", (value) => {
				const keyword = keywordOf("visible", "hidden", "collapse")(value);
				return keyword && keyword !== "visible";
			}, parent.hidden, false),
			language: language !== null && language !== void 0 ? language : parent.language,
			decorations,
			customProperties: cascaded.customProperties,
			display,
			margin: {
				top: lengthWithAuto("margin-top", parent.margin.top),
				right: lengthWithAuto("margin-right", parent.margin.right),
				bottom: lengthWithAuto("margin-bottom", parent.margin.bottom),
				left: lengthWithAuto("margin-left", parent.margin.left)
			},
			padding: {
				top: (_own4 = own("padding-top", (value) => nonNegative(pointsOf(value, baseFontSize, parent.rootFontSize)), parent.padding.top)) !== null && _own4 !== void 0 ? _own4 : 0,
				right: (_own5 = own("padding-right", (value) => nonNegative(pointsOf(value, baseFontSize, parent.rootFontSize)), parent.padding.right)) !== null && _own5 !== void 0 ? _own5 : 0,
				bottom: (_own6 = own("padding-bottom", (value) => nonNegative(pointsOf(value, baseFontSize, parent.rootFontSize)), parent.padding.bottom)) !== null && _own6 !== void 0 ? _own6 : 0,
				left: (_own7 = own("padding-left", (value) => nonNegative(pointsOf(value, baseFontSize, parent.rootFontSize)), parent.padding.left)) !== null && _own7 !== void 0 ? _own7 : 0
			},
			border: {
				top: borderOf("top"),
				right: borderOf("right"),
				bottom: borderOf("bottom"),
				left: borderOf("left")
			},
			backgroundColor: backgroundColor === "transparent" ? void 0 : backgroundColor,
			width: size("width", "width", ["auto"]),
			height: size("height", "height", ["auto"]),
			maxWidth: size("maxWidth", "max-width", ["none"]),
			maxHeight: size("maxHeight", "max-height", ["none"]),
			minWidth: size("minWidth", "min-width", ["auto"]),
			minHeight: size("minHeight", "min-height", ["auto"]),
			verticalAlign: verticalAlign === "baseline" ? void 0 : verticalAlign,
			float: float === "left" || float === "inline-start" ? "left" : float === "right" || float === "inline-end" ? "right" : void 0,
			breakBefore: breakBefore === "auto" ? void 0 : breakBefore,
			breakAfter: breakAfter === "auto" ? void 0 : breakAfter,
			breakInside: ((_own8 = own("break-inside", keywordOf("avoid", "avoid-page", "auto", "avoid-column"), parent.breakInside)) === null || _own8 === void 0 ? void 0 : _own8.startsWith("avoid")) ? "avoid" : void 0,
			tableLayout: own("table-layout", keywordOf("fixed", "auto"), parent.tableLayout) === "fixed" ? "fixed" : void 0,
			wordStyle: (_cascaded$values$get2 = cascaded.values.get("-docx-word-style")) === null || _cascaded$values$get2 === void 0 ? void 0 : _cascaded$values$get2.map(unquote)[0]
		};
	};
	var nonNegative = (points) => points !== void 0 && points >= 0 ? points : void 0;
	//#endregion
	//#region node_modules/boolbase/dist/index.js
	function trueFunc() {
		return true;
	}
	function falseFunc() {
		return false;
	}
	//#endregion
	//#region node_modules/css-what/dist/types.js
	/** Discriminants for selector token kinds. */
	var SelectorType;
	(function(SelectorType) {
		SelectorType["Attribute"] = "attribute";
		SelectorType["Pseudo"] = "pseudo";
		SelectorType["PseudoElement"] = "pseudo-element";
		SelectorType["Tag"] = "tag";
		SelectorType["Universal"] = "universal";
		SelectorType["Adjacent"] = "adjacent";
		SelectorType["Child"] = "child";
		SelectorType["Descendant"] = "descendant";
		SelectorType["Parent"] = "parent";
		SelectorType["Sibling"] = "sibling";
		SelectorType["ColumnCombinator"] = "column-combinator";
	})(SelectorType || (SelectorType = {}));
	/** Operators available for attribute selectors. */
	var AttributeAction;
	(function(AttributeAction) {
		AttributeAction["Any"] = "any";
		AttributeAction["Element"] = "element";
		AttributeAction["End"] = "end";
		AttributeAction["Equals"] = "equals";
		AttributeAction["Exists"] = "exists";
		AttributeAction["Hyphen"] = "hyphen";
		AttributeAction["Not"] = "not";
		AttributeAction["Start"] = "start";
	})(AttributeAction || (AttributeAction = {}));
	//#endregion
	//#region node_modules/css-what/dist/parse.js
	var reName = /^[^#\\]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\u00B0-\uFFFF-])+/;
	var reEscape = /\\([\da-f]{1,6}\s?|(\s)|.)/gi;
	var CharCode;
	(function(CharCode) {
		CharCode[CharCode["LeftParenthesis"] = 40] = "LeftParenthesis";
		CharCode[CharCode["RightParenthesis"] = 41] = "RightParenthesis";
		CharCode[CharCode["LeftSquareBracket"] = 91] = "LeftSquareBracket";
		CharCode[CharCode["RightSquareBracket"] = 93] = "RightSquareBracket";
		CharCode[CharCode["Comma"] = 44] = "Comma";
		CharCode[CharCode["Period"] = 46] = "Period";
		CharCode[CharCode["Colon"] = 58] = "Colon";
		CharCode[CharCode["SingleQuote"] = 39] = "SingleQuote";
		CharCode[CharCode["DoubleQuote"] = 34] = "DoubleQuote";
		CharCode[CharCode["Plus"] = 43] = "Plus";
		CharCode[CharCode["Tilde"] = 126] = "Tilde";
		CharCode[CharCode["QuestionMark"] = 63] = "QuestionMark";
		CharCode[CharCode["ExclamationMark"] = 33] = "ExclamationMark";
		CharCode[CharCode["Slash"] = 47] = "Slash";
		CharCode[CharCode["Equal"] = 61] = "Equal";
		CharCode[CharCode["Dollar"] = 36] = "Dollar";
		CharCode[CharCode["Pipe"] = 124] = "Pipe";
		CharCode[CharCode["Circumflex"] = 94] = "Circumflex";
		CharCode[CharCode["Asterisk"] = 42] = "Asterisk";
		CharCode[CharCode["GreaterThan"] = 62] = "GreaterThan";
		CharCode[CharCode["LessThan"] = 60] = "LessThan";
		CharCode[CharCode["Hash"] = 35] = "Hash";
		CharCode[CharCode["LowerI"] = 105] = "LowerI";
		CharCode[CharCode["LowerS"] = 115] = "LowerS";
		CharCode[CharCode["BackSlash"] = 92] = "BackSlash";
		CharCode[CharCode["Space"] = 32] = "Space";
		CharCode[CharCode["Tab"] = 9] = "Tab";
		CharCode[CharCode["NewLine"] = 10] = "NewLine";
		CharCode[CharCode["FormFeed"] = 12] = "FormFeed";
		CharCode[CharCode["CarriageReturn"] = 13] = "CarriageReturn";
	})(CharCode || (CharCode = {}));
	var actionTypes = /* @__PURE__ */ new Map([
		[CharCode.Tilde, AttributeAction.Element],
		[CharCode.Circumflex, AttributeAction.Start],
		[CharCode.Dollar, AttributeAction.End],
		[CharCode.Asterisk, AttributeAction.Any],
		[CharCode.ExclamationMark, AttributeAction.Not],
		[CharCode.Pipe, AttributeAction.Hyphen]
	]);
	var unpackPseudos = /* @__PURE__ */ new Set([
		"has",
		"not",
		"matches",
		"is",
		"where",
		"host",
		"host-context"
	]);
	/**
	* Pseudo elements defined in CSS Level 1 and CSS Level 2 can be written with
	* a single colon; eg. :before will turn into ::before.
	* @see {@link https://www.w3.org/TR/2018/WD-selectors-4-20181121/#pseudo-element-syntax}
	*/
	var pseudosToPseudoElements = /* @__PURE__ */ new Set([
		"before",
		"after",
		"first-line",
		"first-letter"
	]);
	/**
	* Checks whether a specific selector is a traversal.
	* This is useful eg. in swapping the order of elements that
	* are not traversals.
	* @param selector Selector to check.
	*/
	function isTraversal$1(selector) {
		switch (selector.type) {
			case SelectorType.Adjacent:
			case SelectorType.Child:
			case SelectorType.Descendant:
			case SelectorType.Parent:
			case SelectorType.Sibling:
			case SelectorType.ColumnCombinator: return true;
			case SelectorType.Attribute:
			case SelectorType.Pseudo:
			case SelectorType.PseudoElement:
			case SelectorType.Tag:
			case SelectorType.Universal: return false;
		}
	}
	var stripQuotesFromPseudos = /* @__PURE__ */ new Set(["contains", "icontains"]);
	function funescape(_, escaped, escapedWhitespace) {
		const high = Number.parseInt(escaped, 16) - 65536;
		return Number.isNaN(high) || escapedWhitespace ? escaped : high < 0 ? String.fromCharCode(high + 65536) : String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320);
	}
	function unescapeCSS(cssString) {
		return cssString.replace(reEscape, funescape);
	}
	function isQuote(c) {
		return c === CharCode.SingleQuote || c === CharCode.DoubleQuote;
	}
	function isWhitespace(c) {
		return c === CharCode.Space || c === CharCode.Tab || c === CharCode.NewLine || c === CharCode.FormFeed || c === CharCode.CarriageReturn;
	}
	/**
	* Parses `selector`.
	* @param selector Selector to parse.
	* @returns Returns a two-dimensional array.
	* The first dimension represents selectors separated by commas (eg. `sub1, sub2`),
	* the second contains the relevant tokens for that selector.
	*/
	function parse$1(selector) {
		const subselects = [];
		const endIndex = parseSelector(subselects, `${selector}`, 0);
		if (endIndex < selector.length) throw new Error(`Unmatched selector: ${selector.slice(endIndex)}`);
		return subselects;
	}
	function parseSelector(subselects, selector, selectorIndex) {
		let tokens = [];
		function getName(offset) {
			const match = selector.slice(selectorIndex + offset).match(reName);
			if (!match) throw new Error(`Expected name, found ${selector.slice(selectorIndex)}`);
			const [name] = match;
			selectorIndex += offset + name.length;
			return unescapeCSS(name);
		}
		function stripWhitespace(offset) {
			selectorIndex += offset;
			while (selectorIndex < selector.length && isWhitespace(selector.charCodeAt(selectorIndex))) selectorIndex++;
		}
		function readValueWithParenthesis() {
			selectorIndex += 1;
			const start = selectorIndex;
			for (let counter = 1; selectorIndex < selector.length; selectorIndex++) switch (selector.charCodeAt(selectorIndex)) {
				case CharCode.BackSlash:
					selectorIndex += 1;
					break;
				case CharCode.LeftParenthesis:
					counter += 1;
					break;
				case CharCode.RightParenthesis:
					counter -= 1;
					if (counter === 0) return unescapeCSS(selector.slice(start, selectorIndex++));
			}
			throw new Error("Parenthesis not matched");
		}
		function ensureNotTraversal() {
			if (tokens.length > 0 && isTraversal$1(tokens[tokens.length - 1])) throw new Error("Did not expect successive traversals.");
		}
		function addTraversal(type) {
			if (tokens.length > 0 && tokens[tokens.length - 1].type === SelectorType.Descendant) {
				tokens[tokens.length - 1].type = type;
				return;
			}
			ensureNotTraversal();
			tokens.push({ type });
		}
		function addSpecialAttribute(name, action) {
			tokens.push({
				type: SelectorType.Attribute,
				name,
				action,
				value: getName(1),
				namespace: null,
				ignoreCase: "quirks"
			});
		}
		/**
		* We have finished parsing the current part of the selector.
		*
		* Remove descendant tokens at the end if they exist,
		* and return the last index, so that parsing can be
		* picked up from here.
		*/
		function finalizeSubselector() {
			if (tokens.length > 0 && tokens[tokens.length - 1].type === SelectorType.Descendant) tokens.pop();
			if (tokens.length === 0) throw new Error("Empty sub-selector");
			subselects.push(tokens);
		}
		stripWhitespace(0);
		if (selector.length === selectorIndex) return selectorIndex;
		loop: while (selectorIndex < selector.length) {
			const firstChar = selector.charCodeAt(selectorIndex);
			switch (firstChar) {
				case CharCode.Space:
				case CharCode.Tab:
				case CharCode.NewLine:
				case CharCode.FormFeed:
				case CharCode.CarriageReturn:
					if (tokens.length === 0 || tokens[0].type !== SelectorType.Descendant) {
						ensureNotTraversal();
						tokens.push({ type: SelectorType.Descendant });
					}
					stripWhitespace(1);
					break;
				case CharCode.GreaterThan:
					addTraversal(SelectorType.Child);
					stripWhitespace(1);
					break;
				case CharCode.LessThan:
					addTraversal(SelectorType.Parent);
					stripWhitespace(1);
					break;
				case CharCode.Tilde:
					addTraversal(SelectorType.Sibling);
					stripWhitespace(1);
					break;
				case CharCode.Plus:
					addTraversal(SelectorType.Adjacent);
					stripWhitespace(1);
					break;
				case CharCode.Period:
					addSpecialAttribute("class", AttributeAction.Element);
					break;
				case CharCode.Hash:
					addSpecialAttribute("id", AttributeAction.Equals);
					break;
				case CharCode.LeftSquareBracket: {
					stripWhitespace(1);
					let name;
					let namespace = null;
					if (selector.charCodeAt(selectorIndex) === CharCode.Pipe) name = getName(1);
					else if (selector.startsWith("*|", selectorIndex)) {
						namespace = "*";
						name = getName(2);
					} else {
						name = getName(0);
						if (selector.charCodeAt(selectorIndex) === CharCode.Pipe && selector.charCodeAt(selectorIndex + 1) !== CharCode.Equal) {
							namespace = name;
							name = getName(1);
						}
					}
					stripWhitespace(0);
					let action = AttributeAction.Exists;
					const possibleAction = actionTypes.get(selector.charCodeAt(selectorIndex));
					if (possibleAction) {
						action = possibleAction;
						if (selector.charCodeAt(selectorIndex + 1) !== CharCode.Equal) throw new Error("Expected `=`");
						stripWhitespace(2);
					} else if (selector.charCodeAt(selectorIndex) === CharCode.Equal) {
						action = AttributeAction.Equals;
						stripWhitespace(1);
					}
					let value = "";
					let ignoreCase = null;
					if (action !== "exists") {
						if (isQuote(selector.charCodeAt(selectorIndex))) {
							const quote = selector.charCodeAt(selectorIndex);
							selectorIndex += 1;
							const sectionStart = selectorIndex;
							while (selectorIndex < selector.length && selector.charCodeAt(selectorIndex) !== quote) selectorIndex += selector.charCodeAt(selectorIndex) === CharCode.BackSlash ? 2 : 1;
							if (selector.charCodeAt(selectorIndex) !== quote) throw new Error("Attribute value didn't end");
							value = unescapeCSS(selector.slice(sectionStart, selectorIndex));
							selectorIndex += 1;
						} else {
							const valueStart = selectorIndex;
							while (selectorIndex < selector.length && !isWhitespace(selector.charCodeAt(selectorIndex)) && selector.charCodeAt(selectorIndex) !== CharCode.RightSquareBracket) selectorIndex += selector.charCodeAt(selectorIndex) === CharCode.BackSlash ? 2 : 1;
							value = unescapeCSS(selector.slice(valueStart, selectorIndex));
						}
						stripWhitespace(0);
						switch (selector.charCodeAt(selectorIndex) | 32) {
							case CharCode.LowerI:
								ignoreCase = true;
								stripWhitespace(1);
								break;
							case CharCode.LowerS:
								ignoreCase = false;
								stripWhitespace(1);
						}
					}
					if (selector.charCodeAt(selectorIndex) !== CharCode.RightSquareBracket) throw new Error("Attribute selector didn't terminate");
					selectorIndex += 1;
					const attributeSelector = {
						type: SelectorType.Attribute,
						name,
						action,
						value,
						namespace,
						ignoreCase
					};
					tokens.push(attributeSelector);
					break;
				}
				case CharCode.Colon: {
					if (selector.charCodeAt(selectorIndex + 1) === CharCode.Colon) {
						tokens.push({
							type: SelectorType.PseudoElement,
							name: getName(2).toLowerCase(),
							data: selector.charCodeAt(selectorIndex) === CharCode.LeftParenthesis ? readValueWithParenthesis() : null
						});
						break;
					}
					const name = getName(1).toLowerCase();
					if (pseudosToPseudoElements.has(name)) {
						tokens.push({
							type: SelectorType.PseudoElement,
							name,
							data: null
						});
						break;
					}
					let data = null;
					if (selector.charCodeAt(selectorIndex) === CharCode.LeftParenthesis) {
						if (unpackPseudos.has(name)) {
							if (isQuote(selector.charCodeAt(selectorIndex + 1))) throw new Error(`Pseudo-selector ${name} cannot be quoted`);
							data = [];
							selectorIndex = parseSelector(data, selector, selectorIndex + 1);
							if (selector.charCodeAt(selectorIndex) !== CharCode.RightParenthesis) throw new Error(`Missing closing parenthesis in :${name} (${selector})`);
							selectorIndex += 1;
						} else {
							data = readValueWithParenthesis();
							if (stripQuotesFromPseudos.has(name)) {
								const quot = data.charCodeAt(0);
								if (quot === data.charCodeAt(data.length - 1) && isQuote(quot)) data = data.slice(1, -1);
							}
							data = unescapeCSS(data);
						}
					}
					tokens.push({
						type: SelectorType.Pseudo,
						name,
						data
					});
					break;
				}
				case CharCode.Comma:
					finalizeSubselector();
					tokens = [];
					stripWhitespace(1);
					break;
				default: {
					if (selector.startsWith("/*", selectorIndex)) {
						const endIndex = selector.indexOf("*/", selectorIndex + 2);
						if (endIndex === -1) throw new Error("Comment was not terminated");
						selectorIndex = endIndex + 2;
						if (tokens.length === 0) stripWhitespace(0);
						break;
					}
					let namespace = null;
					let name;
					if (firstChar === CharCode.Asterisk) {
						selectorIndex += 1;
						name = "*";
					} else if (firstChar === CharCode.Pipe) {
						name = "";
						if (selector.charCodeAt(selectorIndex + 1) === CharCode.Pipe) {
							addTraversal(SelectorType.ColumnCombinator);
							stripWhitespace(2);
							break;
						}
					} else if (reName.test(selector.slice(selectorIndex))) name = getName(0);
					else break loop;
					if (selector.charCodeAt(selectorIndex) === CharCode.Pipe && selector.charCodeAt(selectorIndex + 1) !== CharCode.Pipe) {
						namespace = name;
						if (selector.charCodeAt(selectorIndex + 1) === CharCode.Asterisk) {
							name = "*";
							selectorIndex += 2;
						} else name = getName(1);
					}
					tokens.push(name === "*" ? {
						type: SelectorType.Universal,
						namespace
					} : {
						type: SelectorType.Tag,
						name,
						namespace
					});
				}
			}
		}
		finalizeSubselector();
		return selectorIndex;
	}
	//#endregion
	//#region node_modules/domutils/dist/querying.js
	/**
	* Search a node and its children for nodes passing a test function. If `node` is not an array, it will be wrapped in one.
	*
	* @category Querying
	* @param test Function to test nodes on.
	* @param node Node to search. Will be included in the result set if it matches.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes passing `test`.
	*/
	function filter(test, node, recurse = true, limit = Number.POSITIVE_INFINITY) {
		return find(test, Array.isArray(node) ? node : [node], recurse, limit);
	}
	/**
	* Search an array of nodes and their children for nodes passing a test function.
	*
	* @category Querying
	* @param test Function to test nodes on.
	* @param nodes Array of nodes to search.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes passing `test`.
	*/
	function find(test, nodes, recurse, limit) {
		const result = [];
		/** Stack of the arrays we are looking at. */
		const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
		/** Stack of the indices within the arrays. */
		const indexStack = [0];
		for (;;) {
			if (indexStack[0] >= nodeStack[0].length) {
				if (indexStack.length === 1) return result;
				nodeStack.shift();
				indexStack.shift();
				continue;
			}
			const element = nodeStack[0][indexStack[0]++];
			if (test(element)) {
				result.push(element);
				if (--limit <= 0) return result;
			}
			if (recurse && hasChildren(element) && element.children.length > 0) {
				indexStack.unshift(0);
				nodeStack.unshift(element.children);
			}
		}
	}
	/**
	* Finds one element in a tree that passes a test.
	*
	* @category Querying
	* @param test Function to test nodes on.
	* @param nodes Node or array of nodes to search.
	* @param recurse Also consider child nodes.
	* @returns The first node that passes `test`.
	*/
	function findOne$1(test, nodes, recurse = true) {
		const searchedNodes = Array.isArray(nodes) ? nodes : [nodes];
		for (const node of searchedNodes) {
			if (isTag(node) && test(node)) return node;
			if (recurse && hasChildren(node) && node.children.length > 0) {
				const found = findOne$1(test, node.children, true);
				if (found) return found;
			}
		}
		return null;
	}
	/**
	* Checks if a tree of nodes contains at least one node passing a test.
	*
	* @category Querying
	* @param test Function to test nodes on.
	* @param nodes Array of nodes to search.
	* @returns Whether a tree of nodes contains at least one node passing the test.
	*/
	function existsOne(test, nodes) {
		return (Array.isArray(nodes) ? nodes : [nodes]).some((node) => isTag(node) && test(node) || hasChildren(node) && existsOne(test, node.children));
	}
	/**
	* Search an array of nodes and their children for elements passing a test function.
	*
	* Same as `find`, but limited to elements and with less options, leading to reduced complexity.
	*
	* @category Querying
	* @param test Function to test nodes on.
	* @param nodes Array of nodes to search.
	* @returns All nodes passing `test`.
	*/
	function findAll$1(test, nodes) {
		const result = [];
		const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
		const indexStack = [0];
		for (;;) {
			if (indexStack[0] >= nodeStack[0].length) {
				if (nodeStack.length === 1) return result;
				nodeStack.shift();
				indexStack.shift();
				continue;
			}
			const element = nodeStack[0][indexStack[0]++];
			if (isTag(element) && test(element)) result.push(element);
			if (hasChildren(element) && element.children.length > 0) {
				indexStack.unshift(0);
				nodeStack.unshift(element.children);
			}
		}
	}
	//#endregion
	//#region node_modules/domutils/dist/legacy.js
	/**
	* A map of functions to check nodes against.
	*/
	var Checks = {
		tag_name(name) {
			if (typeof name === "function") return (element) => isTag(element) && name(element.name);
			if (name === "*") return isTag;
			return (element) => isTag(element) && element.name === name;
		},
		tag_type(type) {
			if (typeof type === "function") return (element) => type(element.type);
			return (element) => element.type === type;
		},
		tag_contains(data) {
			if (typeof data === "function") return (element) => isText(element) && data(element.data);
			return (element) => isText(element) && element.data === data;
		}
	};
	/**
	* Returns a function to check whether a node has an attribute with a particular
	* value.
	*
	* @param attrib Attribute to check.
	* @param value Attribute value to look for.
	* @returns A function to check whether the a node has an attribute with a
	*   particular value.
	*/
	function getAttribCheck(attrib, value) {
		if (typeof value === "function") return (element) => isTag(element) && value(element.attribs[attrib]);
		return (element) => isTag(element) && element.attribs[attrib] === value;
	}
	/**
	* Returns a function that returns `true` if either of the input functions
	* returns `true` for a node.
	*
	* @param a First function to combine.
	* @param b Second function to combine.
	* @returns A function taking a node and returning `true` if either of the input
	*   functions returns `true` for the node.
	*/
	function combineFuncs(a, b) {
		return (element) => a(element) || b(element);
	}
	/**
	* Returns a function that executes all checks in `options` and returns `true`
	* if any of them match a node.
	*
	* @param options An object describing nodes to look for.
	* @returns A function that executes all checks in `options` and returns `true`
	*   if any of them match a node.
	*/
	function compileTest(options) {
		const funcs = Object.keys(options).map((key) => {
			const value = options[key];
			return Object.hasOwn(Checks, key) ? Checks[key](value) : getAttribCheck(key, value);
		});
		return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
	}
	/**
	* Checks whether a node matches the description in `options`.
	*
	* @category Legacy Query Functions
	* @param options An object describing nodes to look for.
	* @param node The element to test.
	* @returns Whether the element matches the description in `options`.
	*/
	function testElement(options, node) {
		const test = compileTest(options);
		return test ? test(node) : true;
	}
	/**
	* Returns all nodes that match `options`.
	*
	* @category Legacy Query Functions
	* @param options An object describing nodes to look for.
	* @param nodes Nodes to search through.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes that match `options`.
	*/
	function getElements(options, nodes, recurse, limit = Number.POSITIVE_INFINITY) {
		const test = compileTest(options);
		return test ? filter(test, nodes, recurse, limit) : [];
	}
	/**
	* Returns the node with the supplied ID.
	*
	* @category Legacy Query Functions
	* @param id The unique ID attribute value to look for.
	* @param nodes Nodes to search through.
	* @param recurse Also consider child nodes.
	* @returns The node with the supplied ID.
	*/
	function getElementById(id, nodes, recurse = true) {
		if (!Array.isArray(nodes)) nodes = [nodes];
		return findOne$1(getAttribCheck("id", id), nodes, recurse);
	}
	/**
	* Returns all nodes with the supplied `tagName`.
	*
	* @category Legacy Query Functions
	* @param tagName Tag name to search for.
	* @param nodes Nodes to search through.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes with the supplied `tagName`.
	*/
	function getElementsByTagName(tagName, nodes, recurse = true, limit = Number.POSITIVE_INFINITY) {
		return filter(Checks["tag_name"](tagName), nodes, recurse, limit);
	}
	/**
	* Returns all nodes with the supplied `className`.
	*
	* @category Legacy Query Functions
	* @param className Class name to search for.
	* @param nodes Nodes to search through.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes with the supplied `className`.
	*/
	function getElementsByClassName(className, nodes, recurse = true, limit = Number.POSITIVE_INFINITY) {
		return filter(getAttribCheck("class", className), nodes, recurse, limit);
	}
	/**
	* Returns all nodes with the supplied `type`.
	*
	* @category Legacy Query Functions
	* @param type Element type to look for.
	* @param nodes Nodes to search through.
	* @param recurse Also consider child nodes.
	* @param limit Maximum number of nodes to return.
	* @returns All nodes with the supplied `type`.
	*/
	function getElementsByTagType(type, nodes, recurse = true, limit = Number.POSITIVE_INFINITY) {
		return filter(Checks["tag_type"](type), nodes, recurse, limit);
	}
	//#endregion
	//#region node_modules/dom-serializer/node_modules/entities/dist/escape.js
	/**
	* Get the named reference for an XML special character or U+00A0.
	* @param char Code unit matched by one of the escape regexes.
	*/
	function getEscape(char) {
		return char === 34 ? "&quot;" : char === 38 ? "&amp;" : char === 39 ? "&apos;" : char === 60 ? "&lt;" : char === 62 ? "&gt;" : "&nbsp;";
	}
	/**
	* Matches exactly the characters `encodeXML` escapes: the five XML special
	* characters plus every non-ASCII code unit (lone surrogates included — no
	* `u` flag). Kept in sync with `XML_BITSET_VALUE`.
	*
	* Shared with `encodeNonAsciiHTML` in `encode.ts`. Because the regex is
	* stateful (`g` flag), every call site must set `lastIndex` before use.
	*/
	var xmlEncodeRegex = /["&'<>\u0080-\uFFFF]/g;
	/**
	* Whether `code` (a UTF-16 code unit) is escaped by {@link encodeXML}: a
	* non-ASCII unit, or one of the five XML specials flagged in
	* `XML_BITSET_VALUE` (which is only meaningful for code units 32-63).
	* @param code Code unit to test.
	*/
	function isXmlEscapable(code) {
		return code >= 128 || code >= 32 && code < 64 && (1342177476 >>> code & 1) === 1;
	}
	/**
	* Encodes all non-ASCII characters, as well as characters not valid in XML
	* documents using XML entities.
	*
	* If a character has no equivalent entity, a numeric hexadecimal reference
	* (eg. `&#xfc;`) will be used.
	* @param input Input string to encode.
	*/
	function encodeXML(input) {
		const { length } = input;
		let out;
		let last = 0;
		let index = 0;
		while (index < length) {
			const char = input.charCodeAt(index);
			if (!isXmlEscapable(char)) {
				const bound = Math.min(index + 32, length);
				let next = index + 1;
				while (next < bound && !isXmlEscapable(input.charCodeAt(next))) next++;
				if (next < bound) {
					index = next;
					continue;
				}
				if (next >= length) break;
				xmlEncodeRegex.lastIndex = next;
				if (!xmlEncodeRegex.test(input)) break;
				index = xmlEncodeRegex.lastIndex - 1;
				continue;
			}
			if (out === void 0) out = input.substring(0, index);
			else if (last !== index) out += input.substring(last, index);
			if (char < 64) {
				out += getEscape(char);
				last = index += 1;
				continue;
			}
			const cp = input.codePointAt(index);
			out += `&#x${cp.toString(16)};`;
			if (cp !== char) index++;
			last = index += 1;
		}
		if (out === void 0) return input;
		if (last < length) out += input.substr(last);
		return out;
	}
	/**
	* Escape `data` using `re`, mapping each matched character to its entity.
	* Every match is one UTF-16 code unit, so its index is `lastIndex - 1`.
	* @param re Global regex matching exactly the characters to escape
	*   (`"`, `&`, `'`, `<`, `>`, `\u00A0` at most).
	* @param data String to escape.
	*/
	function escapeWithRegex(re, data) {
		re.lastIndex = 0;
		if (!re.test(data)) return data;
		let out = "";
		let last = 0;
		do {
			const index = re.lastIndex - 1;
			if (last !== index) out += data.substring(last, index);
			const char = data.charCodeAt(index);
			out += getEscape(char);
			last = index + 1;
		} while (re.test(data));
		return out + data.substring(last);
	}
	var attributeEscapeRegex = /["&\u{A0}]/gu;
	/**
	* Encodes all characters that have to be escaped in HTML attributes,
	* following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
	* @param data String to escape.
	*/
	function escapeAttribute(data) {
		return escapeWithRegex(attributeEscapeRegex, data);
	}
	var textEscapeRegex = /[&<>\u{A0}]/gu;
	/**
	* Encodes all characters that have to be escaped in HTML text,
	* following {@link https://html.spec.whatwg.org/multipage/parsing.html#escapingString}.
	* @param data String to escape.
	*/
	function escapeText(data) {
		return escapeWithRegex(textEscapeRegex, data);
	}
	//#endregion
	//#region node_modules/dom-serializer/dist/foreign-names.js
	/**
	* Mixed-case SVG and MathML element names recognized in foreign content.
	* @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
	*/
	var elementNames = new Map("altGlyph altGlyphDef altGlyphItem animateColor animateMotion animateTransform clipPath feBlend feColorMatrix feComponentTransfer feComposite feConvolveMatrix feDiffuseLighting feDisplacementMap feDistantLight feDropShadow feFlood feFuncA feFuncB feFuncG feFuncR feGaussianBlur feImage feMerge feMergeNode feMorphology feOffset fePointLight feSpecularLighting feSpotLight feTile feTurbulence foreignObject glyphRef linearGradient radialGradient textPath".split(" ").map((name) => [name.toLowerCase(), name]));
	/**
	* Mixed-case SVG and MathML attribute names recognized in foreign content.
	* @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
	*/
	var attributeNames = new Map("definitionURL attributeName attributeType baseFrequency baseProfile calcMode clipPathUnits diffuseConstant edgeMode filterUnits glyphRef gradientTransform gradientUnits kernelMatrix kernelUnitLength keyPoints keySplines keyTimes lengthAdjust limitingConeAngle markerHeight markerUnits markerWidth maskContentUnits maskUnits numOctaves pathLength patternContentUnits patternTransform patternUnits pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits refX refY repeatCount repeatDur requiredExtensions requiredFeatures specularConstant specularExponent spreadMethod startOffset stdDeviation stitchTiles surfaceScale systemLanguage tableValues targetX targetY textLength viewBox viewTarget xChannelSelector yChannelSelector zoomAndPan".split(" ").map((name) => [name.toLowerCase(), name]));
	//#endregion
	//#region node_modules/dom-serializer/dist/index.js
	/** Elements whose text content is never entity-encoded. */
	var unencodedElements = new Set("style script xmp iframe noembed noframes plaintext noscript".split(" "));
	/** HTML void elements — they cannot have children. */
	var voidElements = new Set("area base basefont br col command embed frame hr img input isindex keygen link meta param source track wbr".split(" "));
	/** Elements that switch the parser into foreign (XML-like) mode. */
	var foreignElements = /* @__PURE__ */ new Set(["svg", "math"]);
	/**
	* Foreign-mode integration points: children of these elements are parsed
	* as HTML again, not as foreign content.
	*/
	var foreignModeIntegrationPoints = new Set("mi mo mn ms mtext annotation-xml foreignObject desc title".split(" "));
	/**
	* Renders a DOM node or an array of DOM nodes to a string.
	*
	* Can be thought of as the equivalent of the `outerHTML` of the passed
	* node(s).
	* @param node Node to be rendered.
	* @param options Changes serialization behavior
	*/
	function render(node, options = {}) {
		var _options$xmlMode;
		const nodes = "length" in node ? node : [node];
		const xmlMode = (_options$xmlMode = options.xmlMode) !== null && _options$xmlMode !== void 0 ? _options$xmlMode : false;
		let output = "";
		for (let index = 0; index < nodes.length; index++) output += renderNode(nodes[index], options, xmlMode);
		return output;
	}
	/**
	* Render an array of child nodes (skips the single-node wrapping in `render`).
	* @param children The child nodes to render.
	* @param options The serialization options.
	* @param xmlMode The XML mode to use.
	*/
	function renderChildren(children, options, xmlMode) {
		let output = "";
		for (let index = 0; index < children.length; index++) output += renderNode(children[index], options, xmlMode);
		return output;
	}
	function renderNode(node, options, xmlMode) {
		switch (node.type) {
			case Root: return renderChildren(node.children, options, xmlMode);
			case Directive: return `<${node.data}>`;
			case Comment$1: return `<!--${node.data}-->`;
			case CDATA$1: return `<![CDATA[${node.children[0].data}]]>`;
			case Script:
			case Style:
			case Tag: return renderTag(node, options, xmlMode);
			case Text$1: {
				var _options$encodeEntiti;
				const element = node;
				const data = element.data || "";
				if (((_options$encodeEntiti = options.encodeEntities) !== null && _options$encodeEntiti !== void 0 ? _options$encodeEntiti : options.decodeEntities) !== false && !(!xmlMode && element.parent && unencodedElements.has(element.parent.name))) return xmlMode || options.encodeEntities !== "utf8" ? encodeXML(data) : escapeText(data);
				return data;
			}
		}
	}
	function renderTag(element, options, xmlMode) {
		if (xmlMode === "foreign") {
			var _elementNames$get;
			element.name = (_elementNames$get = elementNames.get(element.name)) !== null && _elementNames$get !== void 0 ? _elementNames$get : element.name;
			if (element.parent && foreignModeIntegrationPoints.has(element.parent.name)) xmlMode = false;
		}
		if (!xmlMode && foreignElements.has(element.name)) xmlMode = "foreign";
		const { name, children } = element;
		const isVoid = !xmlMode && voidElements.has(name);
		let tag = `<${name}${formatAttributes(element.attribs, options, xmlMode)}`;
		if (children.length === 0 && (xmlMode ? options.selfClosingTags !== false : options.selfClosingTags && isVoid)) tag += xmlMode ? "/>" : " />";
		else {
			tag += ">";
			if (children.length > 0) tag += renderChildren(children, options, xmlMode);
			if (!isVoid) tag += `</${name}>`;
		}
		return tag;
	}
	function replaceQuotes(value) {
		return value.replaceAll("\"", "&quot;");
	}
	/**
	* Serialize an element's attribute map to a string.
	*
	* Returns a string with a leading space before each attribute, or an
	* empty string if there are no attributes. This convention lets the
	* caller unconditionally concatenate the result onto the tag name.
	* @param attributes
	* @param options
	* @param xmlMode
	*/
	function formatAttributes(attributes, options, xmlMode) {
		var _options$encodeEntiti2, _options$emptyAttrs;
		if (!attributes) return "";
		const encode = ((_options$encodeEntiti2 = options.encodeEntities) !== null && _options$encodeEntiti2 !== void 0 ? _options$encodeEntiti2 : options.decodeEntities) === false ? replaceQuotes : xmlMode || options.encodeEntities !== "utf8" ? encodeXML : escapeAttribute;
		const isForeign = xmlMode === "foreign";
		const showEmpty = !!((_options$emptyAttrs = options.emptyAttrs) !== null && _options$emptyAttrs !== void 0 ? _options$emptyAttrs : xmlMode);
		let result = "";
		for (const key in attributes) {
			var _attributeNames$get;
			if (!Object.hasOwn(attributes, key)) continue;
			const value = attributes[key];
			const k = isForeign ? (_attributeNames$get = attributeNames.get(key)) !== null && _attributeNames$get !== void 0 ? _attributeNames$get : key : key;
			result += !showEmpty && (value == null || value === "") ? ` ${k}` : ` ${k}="${encode(value == null ? "" : String(value))}"`;
		}
		return result;
	}
	//#endregion
	//#region node_modules/domutils/dist/stringify.js
	/**
	* @category Stringify
	* @deprecated Use the `dom-serializer` module directly.
	* @param node Node to get the outer HTML of.
	* @param options Options for serialization.
	* @returns `node`'s outer HTML.
	*/
	function getOuterHTML(node, options) {
		return render(node, options);
	}
	/**
	* @category Stringify
	* @deprecated Use the `dom-serializer` module directly.
	* @param node Node to get the inner HTML of.
	* @param options Options for serialization.
	* @returns `node`'s inner HTML.
	*/
	function getInnerHTML(node, options) {
		return hasChildren(node) ? node.children.map((node) => getOuterHTML(node, options)).join("") : "";
	}
	/**
	* Get a node's inner text. Same as `textContent`, but inserts newlines for `<br>` tags. Ignores comments.
	*
	* @category Stringify
	* @deprecated Use `textContent` instead.
	* @param node Node to get the inner text of.
	* @returns `node`'s inner text.
	*/
	function getText(node) {
		if (Array.isArray(node)) return node.map(getText).join("");
		if (isTag(node)) return node.name === "br" ? "\n" : getText(node.children);
		if (isCDATA(node)) return getText(node.children);
		if (isText(node)) return node.data;
		return "";
	}
	/**
	* Get a node's text content. Ignores comments.
	*
	* @category Stringify
	* @param node Node to get the text content of.
	* @returns `node`'s text content.
	* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent}
	*/
	function textContent(node) {
		if (Array.isArray(node)) return node.map(textContent).join("");
		if (hasChildren(node) && !isComment(node)) return textContent(node.children);
		if (isText(node)) return node.data;
		return "";
	}
	/**
	* Get a node's inner text, ignoring `<script>` and `<style>` tags. Ignores comments.
	*
	* @category Stringify
	* @param node Node to get the inner text of.
	* @returns `node`'s inner text.
	* @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Node/innerText}
	*/
	function innerText(node) {
		if (Array.isArray(node)) return node.map(innerText).join("");
		if (hasChildren(node) && (node.type === ElementType.Tag || isCDATA(node))) return innerText(node.children);
		if (isText(node)) return node.data;
		return "";
	}
	//#endregion
	//#region node_modules/domutils/dist/feeds.js
	/**
	* Get the feed object from the root of a DOM tree.
	*
	* @category Feeds
	* @param document The DOM to extract the feed from.
	* @returns The feed.
	*/
	function getFeed(document) {
		const feedRoot = getOneElement(isValidFeed, document);
		return feedRoot ? feedRoot.name === "feed" ? getAtomFeed(feedRoot) : getRssFeed(feedRoot) : null;
	}
	/**
	* Parse an Atom feed.
	*
	* @param feedRoot The root of the feed.
	* @returns The parsed feed.
	*/
	function getAtomFeed(feedRoot) {
		var _getOneElement2;
		const childs = feedRoot.children;
		const feed = {
			type: "atom",
			items: getElementsByTagName("entry", childs).map((item) => {
				var _getOneElement;
				const { children } = item;
				const entry = { media: getMediaElements(children) };
				addConditionally(entry, "id", "id", children);
				addConditionally(entry, "title", "title", children);
				const href = (_getOneElement = getOneElement("link", children)) === null || _getOneElement === void 0 ? void 0 : _getOneElement.attribs["href"];
				if (href) entry.link = href;
				const description = fetch("summary", children) || fetch("content", children);
				if (description) entry.description = description;
				const pubDate = fetch("updated", children);
				if (pubDate) entry.pubDate = new Date(pubDate);
				return entry;
			})
		};
		addConditionally(feed, "id", "id", childs);
		addConditionally(feed, "title", "title", childs);
		const href = (_getOneElement2 = getOneElement("link", childs)) === null || _getOneElement2 === void 0 ? void 0 : _getOneElement2.attribs["href"];
		if (href) feed.link = href;
		addConditionally(feed, "description", "subtitle", childs);
		const updated = fetch("updated", childs);
		if (updated) feed.updated = new Date(updated);
		addConditionally(feed, "author", "email", childs, true);
		return feed;
	}
	/**
	* Parse a RSS feed.
	*
	* @param feedRoot The root of the feed.
	* @returns The parsed feed.
	*/
	function getRssFeed(feedRoot) {
		var _getOneElement$childr, _getOneElement3;
		const childs = (_getOneElement$childr = (_getOneElement3 = getOneElement("channel", feedRoot.children)) === null || _getOneElement3 === void 0 ? void 0 : _getOneElement3.children) !== null && _getOneElement$childr !== void 0 ? _getOneElement$childr : [];
		const feed = {
			type: feedRoot.name.substr(0, 3),
			id: "",
			items: getElementsByTagName("item", feedRoot.children).map((item) => {
				const { children } = item;
				const entry = { media: getMediaElements(children) };
				addConditionally(entry, "id", "guid", children);
				addConditionally(entry, "title", "title", children);
				addConditionally(entry, "link", "link", children);
				addConditionally(entry, "description", "description", children);
				const pubDate = fetch("pubDate", children) || fetch("dc:date", children);
				if (pubDate) entry.pubDate = new Date(pubDate);
				return entry;
			})
		};
		addConditionally(feed, "title", "title", childs);
		addConditionally(feed, "link", "link", childs);
		addConditionally(feed, "description", "description", childs);
		const updated = fetch("lastBuildDate", childs);
		if (updated) feed.updated = new Date(updated);
		addConditionally(feed, "author", "managingEditor", childs, true);
		return feed;
	}
	var MEDIA_KEYS_STRING = [
		"url",
		"type",
		"lang"
	];
	var MEDIA_KEYS_INT = [
		"fileSize",
		"bitrate",
		"framerate",
		"samplingrate",
		"channels",
		"duration",
		"height",
		"width"
	];
	/**
	* Get all media elements of a feed item.
	*
	* @param where Nodes to search in.
	* @returns Media elements.
	*/
	function getMediaElements(where) {
		return getElementsByTagName("media:content", where).map((element) => {
			const { attribs } = element;
			const media = {
				medium: attribs["medium"],
				isDefault: !!attribs["isDefault"]
			};
			for (const attrib of MEDIA_KEYS_STRING) if (attribs[attrib]) media[attrib] = attribs[attrib];
			for (const attrib of MEDIA_KEYS_INT) if (attribs[attrib]) media[attrib] = Number.parseInt(attribs[attrib], 10);
			if (attribs["expression"]) media.expression = attribs["expression"];
			return media;
		});
	}
	/**
	* Get one element by tag name.
	*
	* @param tagName Tag name to look for
	* @param node Node to search in
	* @returns The element or null
	*/
	function getOneElement(tagName, node) {
		return getElementsByTagName(tagName, node, true, 1)[0];
	}
	/**
	* Get the text content of an element with a certain tag name.
	*
	* @param tagName Tag name to look for.
	* @param where Node to search in.
	* @param recurse Whether to recurse into child nodes.
	* @returns The text content of the element.
	*/
	function fetch(tagName, where, recurse = false) {
		return textContent(getElementsByTagName(tagName, where, recurse, 1)).trim();
	}
	/**
	* Adds a property to an object if it has a value.
	*
	* @param object Object to be extended.
	* @param property Property name.
	* @param tagName Tag name that contains the conditionally added property.
	* @param where Element to search for the property.
	* @param recurse Whether to recurse into child nodes.
	*/
	function addConditionally(object, property, tagName, where, recurse = false) {
		const value = fetch(tagName, where, recurse);
		if (value) object[property] = value;
	}
	/**
	* Checks if an element is a feed root node.
	*
	* @param value The name of the element to check.
	* @returns Whether an element is a feed root node.
	*/
	function isValidFeed(value) {
		return value === "rss" || value === "feed" || value === "rdf:RDF";
	}
	//#endregion
	//#region node_modules/domutils/dist/helpers.js
	/**
	* Given an array of nodes, remove any member that is contained by another
	* member.
	*
	* @category Helpers
	* @param nodes Nodes to filter.
	* @returns Remaining nodes that aren't contained by other nodes.
	*/
	function removeSubsets(nodes) {
		let index = nodes.length;
		while (--index >= 0) {
			const node = nodes[index];
			if (index > 0 && nodes.lastIndexOf(node, index - 1) >= 0) {
				nodes.splice(index, 1);
				continue;
			}
			for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) if (nodes.includes(ancestor)) {
				nodes.splice(index, 1);
				break;
			}
		}
		return nodes;
	}
	/**
	* @category Helpers
	* @see {@link http://dom.spec.whatwg.org/#dom-node-comparedocumentposition}
	*/
	var DocumentPosition;
	(function(DocumentPosition) {
		DocumentPosition[DocumentPosition["DISCONNECTED"] = 1] = "DISCONNECTED";
		DocumentPosition[DocumentPosition["PRECEDING"] = 2] = "PRECEDING";
		DocumentPosition[DocumentPosition["FOLLOWING"] = 4] = "FOLLOWING";
		DocumentPosition[DocumentPosition["CONTAINS"] = 8] = "CONTAINS";
		DocumentPosition[DocumentPosition["CONTAINED_BY"] = 16] = "CONTAINED_BY";
	})(DocumentPosition || (DocumentPosition = {}));
	/**
	* Compare the position of one node against another node in any other document,
	* returning a bitmask with the values from {@link DocumentPosition}.
	*
	* Document order:
	* > There is an ordering, document order, defined on all the nodes in the
	* > document corresponding to the order in which the first character of the
	* > XML representation of each node occurs in the XML representation of the
	* > document after expansion of general entities. Thus, the document element
	* > node will be the first node. Element nodes occur before their children.
	* > Thus, document order orders element nodes in order of the occurrence of
	* > their start-tag in the XML (after expansion of entities). The attribute
	* > nodes of an element occur after the element and before its children. The
	* > relative order of attribute nodes is implementation-dependent.
	*
	* Source:
	* http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
	*
	* @category Helpers
	* @param nodeA The first node to use in the comparison
	* @param nodeB The second node to use in the comparison
	* @returns A bitmask describing the input nodes' relative position.
	*
	* See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
	* a description of these values.
	*/
	function compareDocumentPosition(nodeA, nodeB) {
		const aParents = [];
		const bParents = [];
		if (nodeA === nodeB) return 0;
		let current = hasChildren(nodeA) ? nodeA : nodeA.parent;
		while (current) {
			aParents.unshift(current);
			current = current.parent;
		}
		current = hasChildren(nodeB) ? nodeB : nodeB.parent;
		while (current) {
			bParents.unshift(current);
			current = current.parent;
		}
		const maxIndex = Math.min(aParents.length, bParents.length);
		let index = 0;
		while (index < maxIndex && aParents[index] === bParents[index]) index++;
		if (index === 0) return DocumentPosition.DISCONNECTED;
		const sharedParent = aParents[index - 1];
		const siblings = sharedParent.children;
		const aSibling = aParents[index];
		const bSibling = bParents[index];
		if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
			if (sharedParent === nodeB) return DocumentPosition.FOLLOWING | DocumentPosition.CONTAINED_BY;
			return DocumentPosition.FOLLOWING;
		}
		if (sharedParent === nodeA) return DocumentPosition.PRECEDING | DocumentPosition.CONTAINS;
		return DocumentPosition.PRECEDING;
	}
	/**
	* Sort an array of nodes based on their relative position in the document,
	* removing any duplicate nodes. If the array contains nodes that do not belong
	* to the same document, sort order is unspecified.
	*
	* @category Helpers
	* @param nodes Array of DOM nodes.
	* @returns Collection of unique nodes, sorted in document order.
	*/
	function uniqueSort(nodes) {
		nodes = nodes.filter((node, index, array) => !array.includes(node, index + 1));
		nodes.sort((a, b) => {
			const relative = compareDocumentPosition(a, b);
			if (relative & DocumentPosition.PRECEDING) return -1;
			if (relative & DocumentPosition.FOLLOWING) return 1;
			return 0;
		});
		return nodes;
	}
	//#endregion
	//#region node_modules/domutils/dist/manipulation.js
	/**
	* Remove an element from the dom
	*
	* @category Manipulation
	* @param element The element to be removed.
	*/
	function removeElement(element) {
		if (element.prev) element.prev.next = element.next;
		if (element.next) element.next.prev = element.prev;
		if (element.parent) {
			const childs = element.parent.children;
			const childsIndex = childs.lastIndexOf(element);
			if (childsIndex !== -1) childs.splice(childsIndex, 1);
		}
		element.next = null;
		element.prev = null;
		element.parent = null;
	}
	/**
	* Replace an element in the dom
	*
	* @category Manipulation
	* @param element The element to be replaced.
	* @param replacement The element to be added
	*/
	function replaceElement(element, replacement) {
		replacement.prev = element.prev;
		if (replacement.prev) replacement.prev.next = replacement;
		replacement.next = element.next;
		if (replacement.next) replacement.next.prev = replacement;
		replacement.parent = element.parent;
		if (replacement.parent) {
			const { children } = replacement.parent;
			const elementIndex = children.lastIndexOf(element);
			if (elementIndex === -1) return;
			children[elementIndex] = replacement;
			element.parent = null;
		}
	}
	/**
	* Append a child to an element.
	*
	* @category Manipulation
	* @param parent The element to append to.
	* @param child The element to be added as a child.
	*/
	function appendChild(parent, child) {
		removeElement(child);
		child.next = null;
		child.parent = parent;
		if (parent.children.push(child) > 1) {
			const sibling = parent.children[parent.children.length - 2];
			sibling.next = child;
			child.prev = sibling;
		} else child.prev = null;
	}
	/**
	* Append an element after another.
	*
	* @category Manipulation
	* @param element The element to append after.
	* @param next The element be added.
	*/
	function append(element, next) {
		removeElement(next);
		const { parent } = element;
		const currentNext = element.next;
		next.next = currentNext;
		next.prev = element;
		element.next = next;
		next.parent = parent;
		if (currentNext) {
			currentNext.prev = next;
			if (parent) {
				const childs = parent.children;
				childs.splice(childs.lastIndexOf(currentNext), 0, next);
			}
		} else if (parent) parent.children.push(next);
	}
	/**
	* Prepend a child to an element.
	*
	* @category Manipulation
	* @param parent The element to prepend before.
	* @param child The element to be added as a child.
	*/
	function prependChild(parent, child) {
		removeElement(child);
		child.parent = parent;
		child.prev = null;
		if (parent.children.unshift(child) === 1) child.next = null;
		else {
			const sibling = parent.children[1];
			sibling.prev = child;
			child.next = sibling;
		}
	}
	/**
	* Prepend an element before another.
	*
	* @category Manipulation
	* @param element The element to prepend before.
	* @param previous The element to be added.
	*/
	function prepend(element, previous) {
		removeElement(previous);
		const { parent } = element;
		if (parent) {
			const childs = parent.children;
			childs.splice(childs.indexOf(element), 0, previous);
		}
		if (element.prev) element.prev.next = previous;
		previous.parent = parent;
		previous.prev = element.prev;
		previous.next = element;
		element.prev = previous;
	}
	//#endregion
	//#region node_modules/domutils/dist/traversal.js
	/**
	* Get a node's children.
	*
	* @category Traversal
	* @param element Node to get the children of.
	* @returns `element`'s children, or an empty array.
	*/
	function getChildren(element) {
		return hasChildren(element) ? element.children : [];
	}
	function getParent(element) {
		return element.parent || null;
	}
	/**
	* Gets an elements siblings, including the element itself.
	*
	* Attempts to get the children through the element's parent first. If we don't
	* have a parent (the element is a root node), we walk the element's `prev` &
	* `next` to get all remaining nodes.
	*
	* @category Traversal
	* @param element Element to get the siblings of.
	* @returns `element`'s siblings, including `element`.
	*/
	function getSiblings(element) {
		const parent = getParent(element);
		if (parent != null) return getChildren(parent);
		const siblings = [element];
		let { prev, next } = element;
		while (prev != null) {
			siblings.unshift(prev);
			({prev} = prev);
		}
		while (next != null) {
			siblings.push(next);
			({next} = next);
		}
		return siblings;
	}
	/**
	* Gets an attribute from an element.
	*
	* @category Traversal
	* @param element Element to check.
	* @param name Attribute name to retrieve.
	* @returns The element's attribute value, or `undefined`.
	*/
	function getAttributeValue(element, name) {
		const { attribs } = element;
		return attribs === null || attribs === void 0 ? void 0 : attribs[name];
	}
	/**
	* Checks whether an element has an attribute.
	*
	* @category Traversal
	* @param element Element to check.
	* @param name Attribute name to look for.
	* @returns Returns whether `element` has the attribute `name`.
	*/
	function hasAttrib(element, name) {
		const { attribs } = element;
		return attribs != null && Object.hasOwn(attribs, name) && attribs[name] != null;
	}
	/**
	* Get the tag name of an element.
	*
	* @category Traversal
	* @param element The element to get the name for.
	* @returns The tag name of `element`.
	*/
	function getName(element) {
		return element.name;
	}
	/**
	* Returns the next element sibling of a node.
	*
	* @category Traversal
	* @param element The element to get the next sibling of.
	* @returns `element`'s next sibling that is a tag, or `null` if there is no next
	* sibling.
	*/
	function nextElementSibling(element) {
		let { next } = element;
		while (next !== null && !isTag(next)) ({next} = next);
		return next;
	}
	/**
	* Returns the previous element sibling of a node.
	*
	* @category Traversal
	* @param element The element to get the previous sibling of.
	* @returns `element`'s previous sibling that is a tag, or `null` if there is no
	* previous sibling.
	*/
	function prevElementSibling(element) {
		let { prev } = element;
		while (prev !== null && !isTag(prev)) ({prev} = prev);
		return prev;
	}
	//#endregion
	//#region node_modules/domutils/dist/index.js
	var dist_exports = /* @__PURE__ */ __exportAll({
		DocumentPosition: () => DocumentPosition,
		append: () => append,
		appendChild: () => appendChild,
		compareDocumentPosition: () => compareDocumentPosition,
		existsOne: () => existsOne,
		filter: () => filter,
		find: () => find,
		findAll: () => findAll$1,
		findOne: () => findOne$1,
		getAttributeValue: () => getAttributeValue,
		getChildren: () => getChildren,
		getElementById: () => getElementById,
		getElements: () => getElements,
		getElementsByClassName: () => getElementsByClassName,
		getElementsByTagName: () => getElementsByTagName,
		getElementsByTagType: () => getElementsByTagType,
		getFeed: () => getFeed,
		getInnerHTML: () => getInnerHTML,
		getName: () => getName,
		getOuterHTML: () => getOuterHTML,
		getParent: () => getParent,
		getSiblings: () => getSiblings,
		getText: () => getText,
		hasAttrib: () => hasAttrib,
		innerText: () => innerText,
		nextElementSibling: () => nextElementSibling,
		prepend: () => prepend,
		prependChild: () => prependChild,
		prevElementSibling: () => prevElementSibling,
		removeElement: () => removeElement,
		removeSubsets: () => removeSubsets,
		replaceElement: () => replaceElement,
		testElement: () => testElement,
		textContent: () => textContent,
		uniqueSort: () => uniqueSort
	});
	//#endregion
	//#region node_modules/css-select/dist/attributes.js
	/**
	* All reserved characters in a regex, used for escaping.
	*
	* Taken from XRegExp, (c) 2007-2020 Steven Levithan under the MIT license
	* https://github.com/slevithan/xregexp/blob/95eeebeb8fac8754d54eafe2b4743661ac1cf028/src/xregexp.js#L794
	*/
	var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;
	var whitespaceRe = /\s/;
	function escapeRegex(value) {
		return value.replace(reChars, "\\$&");
	}
	/**
	* Attributes that are case-insensitive in HTML.
	* @see https://html.spec.whatwg.org/multipage/semantics-other.html#case-sensitivity-of-selectors
	*/
	var caseInsensitiveAttributes = /* @__PURE__ */ new Set([
		"accept",
		"accept-charset",
		"align",
		"alink",
		"axis",
		"bgcolor",
		"charset",
		"checked",
		"clear",
		"codetype",
		"color",
		"compact",
		"declare",
		"defer",
		"dir",
		"direction",
		"disabled",
		"enctype",
		"face",
		"frame",
		"hreflang",
		"http-equiv",
		"lang",
		"language",
		"link",
		"media",
		"method",
		"multiple",
		"nohref",
		"noresize",
		"noshade",
		"nowrap",
		"readonly",
		"rel",
		"rev",
		"rules",
		"scope",
		"scrolling",
		"selected",
		"shape",
		"target",
		"text",
		"type",
		"valign",
		"valuetype",
		"vlink"
	]);
	function shouldIgnoreCase(selector, options) {
		return typeof selector.ignoreCase === "boolean" ? selector.ignoreCase : selector.ignoreCase === "quirks" ? !!options.quirksMode : !options.xmlMode && caseInsensitiveAttributes.has(selector.name);
	}
	/**
	* Attribute selectors
	*/
	var attributeRules = {
		equals(next, data, options) {
			const { adapter } = options;
			const { name } = data;
			let { value } = data;
			if (shouldIgnoreCase(data, options)) {
				value = value.toLowerCase();
				return (element) => {
					const attribute = adapter.getAttributeValue(element, name);
					return attribute != null && attribute.length === value.length && attribute.toLowerCase() === value && next(element);
				};
			}
			return (element) => adapter.getAttributeValue(element, name) === value && next(element);
		},
		hyphen(next, data, options) {
			const { adapter } = options;
			const { name } = data;
			let { value } = data;
			const { length } = value;
			if (shouldIgnoreCase(data, options)) {
				value = value.toLowerCase();
				return function hyphenIC(element) {
					const attribute = adapter.getAttributeValue(element, name);
					return attribute != null && (attribute.length === length || attribute.charAt(length) === "-") && attribute.substr(0, length).toLowerCase() === value && next(element);
				};
			}
			return function hyphen(element) {
				const attribute = adapter.getAttributeValue(element, name);
				return attribute != null && (attribute.length === length || attribute.charAt(length) === "-") && attribute.substr(0, length) === value && next(element);
			};
		},
		element(next, data, options) {
			const { adapter } = options;
			const { name, value } = data;
			if (whitespaceRe.test(value)) return falseFunc;
			const regex = new RegExp(`(?:^|\\s)${escapeRegex(value)}(?:$|\\s)`, shouldIgnoreCase(data, options) ? "i" : "");
			return function element(node) {
				const attribute = adapter.getAttributeValue(node, name);
				return attribute != null && attribute.length >= value.length && regex.test(attribute) && next(node);
			};
		},
		exists(next, { name }, { adapter }) {
			return (element) => adapter.hasAttrib(element, name) && next(element);
		},
		start(next, data, options) {
			const { adapter } = options;
			const { name } = data;
			let { value } = data;
			const { length } = value;
			if (length === 0) return falseFunc;
			if (shouldIgnoreCase(data, options)) {
				value = value.toLowerCase();
				return (element) => {
					const attribute = adapter.getAttributeValue(element, name);
					return attribute != null && attribute.length >= length && attribute.substr(0, length).toLowerCase() === value && next(element);
				};
			}
			return (element) => {
				var _adapter$getAttribute;
				return !!((_adapter$getAttribute = adapter.getAttributeValue(element, name)) === null || _adapter$getAttribute === void 0 ? void 0 : _adapter$getAttribute.startsWith(value)) && next(element);
			};
		},
		end(next, data, options) {
			const { adapter } = options;
			const { name } = data;
			let { value } = data;
			const length = -value.length;
			if (length === 0) return falseFunc;
			if (shouldIgnoreCase(data, options)) {
				value = value.toLowerCase();
				return (element) => {
					var _adapter$getAttribute2;
					return ((_adapter$getAttribute2 = adapter.getAttributeValue(element, name)) === null || _adapter$getAttribute2 === void 0 ? void 0 : _adapter$getAttribute2.substr(length).toLowerCase()) === value && next(element);
				};
			}
			return (element) => {
				var _adapter$getAttribute3;
				return !!((_adapter$getAttribute3 = adapter.getAttributeValue(element, name)) === null || _adapter$getAttribute3 === void 0 ? void 0 : _adapter$getAttribute3.endsWith(value)) && next(element);
			};
		},
		any(next, data, options) {
			const { adapter } = options;
			const { name, value } = data;
			if (value === "") return falseFunc;
			if (shouldIgnoreCase(data, options)) {
				const regex = new RegExp(escapeRegex(value), "i");
				return function anyIC(element) {
					const attribute = adapter.getAttributeValue(element, name);
					return attribute != null && attribute.length >= value.length && regex.test(attribute) && next(element);
				};
			}
			return (element) => {
				var _adapter$getAttribute4;
				return !!((_adapter$getAttribute4 = adapter.getAttributeValue(element, name)) === null || _adapter$getAttribute4 === void 0 ? void 0 : _adapter$getAttribute4.includes(value)) && next(element);
			};
		},
		not(next, data, options) {
			const { adapter } = options;
			const { name } = data;
			let { value } = data;
			if (value === "") return (element) => !!adapter.getAttributeValue(element, name) && next(element);
			if (shouldIgnoreCase(data, options)) {
				value = value.toLowerCase();
				return (element) => {
					const attribute = adapter.getAttributeValue(element, name);
					return (attribute == null || attribute.length !== value.length || attribute.toLowerCase() !== value) && next(element);
				};
			}
			return (element) => adapter.getAttributeValue(element, name) !== value && next(element);
		}
	};
	/**
	* Find the first element matching the query. If not in XML mode, the query will ignore
	* the contents of `<template>` elements.
	* @param query - Function that returns true if the element matches the query.
	* @param nodes - Nodes to query. If a node is an element, its children will be queried.
	* @param options - Options for querying the document.
	* @returns The first matching element, or null if there was no match.
	*/
	function findOne(query, nodes, options) {
		const { adapter, xmlMode = false } = options;
		/** Stack of the arrays we are looking at. */
		const nodeStack = [nodes];
		/** Stack of the indices within the arrays. */
		const indexStack = [0];
		for (;;) {
			if (indexStack[0] >= nodeStack[0].length) {
				if (nodeStack.length === 1) return null;
				nodeStack.shift();
				indexStack.shift();
				continue;
			}
			const element = nodeStack[0][indexStack[0]++];
			if (!adapter.isTag(element)) continue;
			if (query(element)) return element;
			if (xmlMode || adapter.getName(element) !== "template") {
				const children = adapter.getChildren(element);
				if (children.length > 0) {
					nodeStack.unshift(children);
					indexStack.unshift(0);
				}
			}
		}
	}
	/**
	* Get all element siblings after the provided node.
	* @param element Element candidate being tested.
	* @param adapter Adapter implementation used for DOM operations.
	*/
	function getNextSiblings(element, adapter) {
		const siblings = adapter.getSiblings(element);
		if (siblings.length <= 1) return [];
		const elementIndex = siblings.indexOf(element);
		if (elementIndex === -1 || elementIndex === siblings.length - 1) return [];
		return siblings.slice(elementIndex + 1).filter(adapter.isTag);
	}
	/**
	* Get the parent element of a node.
	* @param node Node to inspect.
	* @param adapter Adapter implementation used for DOM operations.
	*/
	function getElementParent(node, adapter) {
		const parent = adapter.getParent(node);
		return parent != null && adapter.isTag(parent) ? parent : null;
	}
	//#endregion
	//#region node_modules/css-select/dist/pseudo-selectors/aliases.js
	/**
	* Only text controls can be made read-only, since for other controls (such
	* as checkboxes and buttons) there is no useful distinction between being
	* read-only and being disabled.
	* @see {@link https://html.spec.whatwg.org/multipage/input.html#attr-input-readonly}
	*/
	var textControl = "input:is([type=text i],[type=search i],[type=url i],[type=tel i],[type=email i],[type=password i],[type=date i],[type=month i],[type=week i],[type=time i],[type=datetime-local i],[type=number i])";
	/**
	* Aliases are pseudos that are expressed as selectors.
	*/
	var aliases = {
		"any-link": ":is(a, area, link)[href]",
		link: ":any-link:not(:visited)",
		disabled: `:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,
		enabled: ":is(button, input, select, textarea, optgroup, option, fieldset):not(:disabled)",
		checked: ":is(:is(input[type=radio], input[type=checkbox])[checked], :selected)",
		required: ":is(input, select, textarea)[required]",
		optional: ":is(input, select, textarea):not([required])",
		"read-only": `[readonly]:is(textarea, ${textControl})`,
		"read-write": `:not([readonly]):is(textarea, ${textControl})`,
		/**
		* `:selected` matches option elements that have the `selected` attribute,
		* or are the first option element in a select element that does not have
		* the `multiple` attribute and does not have any option elements with the
		* `selected` attribute.
		* @see https://html.spec.whatwg.org/multipage/form-elements.html#concept-option-selectedness
		*/
		selected: "option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",
		checkbox: "[type=checkbox]",
		file: "[type=file]",
		password: "[type=password]",
		radio: "[type=radio]",
		reset: "[type=reset]",
		image: "[type=image]",
		submit: "[type=submit]",
		parent: ":not(:empty)",
		header: ":is(h1, h2, h3, h4, h5, h6)",
		button: ":is(button, input[type=button])",
		input: ":is(input, textarea, select, button)",
		text: "input:is(:not([type!='']), [type=text])"
	};
	//#endregion
	//#region node_modules/nth-check/dist/compile.js
	/**
	* Returns a function that checks if an elements index matches the given rule
	* highly optimized to return the fastest solution.
	* @param parsed A tuple [a, b], as returned by `parse`.
	* @returns A highly optimized function that returns whether an index matches the nth-check.
	* @example
	*
	* ```js
	* const check = nthCheck.compile([2, 3]);
	*
	* check(0); // `false`
	* check(1); // `false`
	* check(2); // `true`
	* check(3); // `false`
	* check(4); // `true`
	* check(5); // `false`
	* check(6); // `true`
	* ```
	*/
	function compile$1(parsed) {
		const a = parsed[0];
		const b = parsed[1] - 1;
		if (b < 0 && a <= 0) return falseFunc;
		if (a === -1) return (index) => index <= b;
		if (a === 0) return (index) => index === b;
		if (a === 1) return b < 0 ? trueFunc : (index) => index >= b;
		const absA = Math.abs(a);
		const bModulo = (b % absA + absA) % absA;
		return a > 1 ? (index) => index >= b && index % absA === bModulo : (index) => index <= b && index % absA === bModulo;
	}
	//#endregion
	//#region node_modules/nth-check/dist/parse.js
	var whitespace = /* @__PURE__ */ new Set([
		9,
		10,
		12,
		13,
		32
	]);
	var ZERO = "0".charCodeAt(0);
	var NINE = "9".charCodeAt(0);
	/**
	* Parses an expression.
	* @param formula CSS nth-formula to parse.
	* @throws {Error} An `Error` if parsing fails.
	* @returns An array containing the integer step size and the integer offset of the nth rule.
	* @example nthCheck.parse("2n+3"); // returns [2, 3]
	*/
	function parse(formula) {
		formula = formula.trim().toLowerCase();
		switch (formula) {
			case "even": return [2, 0];
			case "odd": return [2, 1];
		}
		let index = 0;
		let a = 0;
		let sign = readSign();
		let number = readNumber();
		if (index < formula.length && formula.charAt(index) === "n") {
			var _number;
			index++;
			a = sign * ((_number = number) !== null && _number !== void 0 ? _number : 1);
			skipWhitespace();
			if (index < formula.length) {
				sign = readSign();
				skipWhitespace();
				number = readNumber();
			} else sign = number = 0;
		}
		if (number === null || index < formula.length) throw new Error(`n-th rule couldn't be parsed ('${formula}')`);
		return [a, sign * number];
		function readSign() {
			switch (formula.charAt(index)) {
				case "-":
					index++;
					return -1;
				case "+": index++;
			}
			return 1;
		}
		function readNumber() {
			const start = index;
			let value = 0;
			while (index < formula.length && formula.charCodeAt(index) >= ZERO && formula.charCodeAt(index) <= NINE) {
				value = value * 10 + (formula.charCodeAt(index) - ZERO);
				index++;
			}
			return index === start ? null : value;
		}
		function skipWhitespace() {
			while (index < formula.length && whitespace.has(formula.charCodeAt(index))) index++;
		}
	}
	//#endregion
	//#region node_modules/nth-check/dist/index.js
	/**
	* Parses and compiles a formula to a highly optimized function.
	* Combination of {@link parse} and {@link compile}.
	*
	* If the formula doesn't match any elements,
	* it returns [`boolbase`](https://github.com/fb55/boolbase)'s `falseFunc`.
	* Otherwise, a function accepting an _index_ is returned, which returns
	* whether or not the passed _index_ matches the formula.
	*
	* Note: The nth-rule starts counting at `1`, the returned function at `0`.
	* @param formula The formula to compile.
	* @example
	* const check = nthCheck("2n+3");
	*
	* check(0); // `false`
	* check(1); // `false`
	* check(2); // `true`
	* check(3); // `false`
	* check(4); // `true`
	* check(5); // `false`
	* check(6); // `true`
	*/
	function nthCheck(formula) {
		return compile$1(parse(formula));
	}
	//#endregion
	//#region node_modules/css-select/dist/helpers/cache.js
	/**
	* Some selectors such as `:contains` and (non-relative) `:has` will only be
	* able to match elements if their parents match the selector (as they contain
	* a subset of the elements that the parent contains).
	*
	* This function wraps the given `matches` function in a function that caches
	* the results of the parent elements, so that the `matches` function only
	* needs to be called once for each subtree.
	* @param next Matcher to run after this matcher succeeds.
	* @param options Configuration object for cache behavior.
	* @param options.adapter Adapter implementation used for DOM access.
	* @param options.cacheResults Whether results should be memoized by input root.
	* @param matches Compiled matcher function to wrap with caching.
	*/
	function cacheParentResults(next, { adapter, cacheResults }, matches) {
		if (cacheResults === false || typeof WeakMap === "undefined") return (element) => next(element) && matches(element);
		const resultCache = /* @__PURE__ */ new WeakMap();
		function addResultToCache(element) {
			const result = matches(element);
			resultCache.set(element, result);
			return result;
		}
		return function cachedMatcher(element) {
			if (!next(element)) return false;
			if (resultCache.has(element)) {
				var _resultCache$get;
				return (_resultCache$get = resultCache.get(element)) !== null && _resultCache$get !== void 0 ? _resultCache$get : false;
			}
			let node = element;
			do {
				const parent = getElementParent(node, adapter);
				if (parent === null) return addResultToCache(element);
				node = parent;
			} while (!resultCache.has(node));
			return resultCache.get(node) ? addResultToCache(element) : false;
		};
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/objectWithoutPropertiesLoose.js
	function _objectWithoutPropertiesLoose(r, e) {
		if (null == r) return {};
		var t = {};
		for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
			if (e.includes(n)) continue;
			t[n] = r[n];
		}
		return t;
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.152.0/helpers/esm/objectWithoutProperties.js
	function _objectWithoutProperties(e, t) {
		if (null == e) return {};
		var o, r, i = _objectWithoutPropertiesLoose(e, t);
		if (Object.getOwnPropertySymbols) {
			var s = Object.getOwnPropertySymbols(e);
			for (r = 0; r < s.length; r++) o = s[r], t.includes(o) || {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
		}
		return i;
	}
	//#endregion
	//#region node_modules/css-select/dist/helpers/options.js
	var _excluded$1 = ["context", "rootFunc"];
	/**
	* Create a copy of options, omitting `context` and `rootFunc`.
	*
	* This is used when compiling nested selectors (e.g. inside `:is`, `:not`,
	* `:nth-child(… of S)`) so that the parent compilation state doesn't leak.
	*/
	function copyOptions(options) {
		const { context: _, rootFunc: __ } = options;
		return _objectWithoutProperties(options, _excluded$1);
	}
	//#endregion
	//#region node_modules/css-select/dist/pseudo-selectors/filters.js
	/**
	* RFC 4647 extended filtering with pre-split subtags.
	* @param tag - Lowercased subtags of the element's language value.
	* @param range - Lowercased subtags of the language range to match against.
	*/
	function extendedFilter(tag, range) {
		if (range[0] !== "*" && range[0] !== tag[0]) return false;
		let tagIndex = 1;
		for (let rangeIndex = 1; rangeIndex < range.length; rangeIndex++) {
			if (range[rangeIndex] === "*") continue;
			while (tagIndex < tag.length && tag[tagIndex] !== range[rangeIndex]) if (tag[tagIndex++].length <= 1) return false;
			if (tagIndex >= tag.length) return false;
			tagIndex++;
		}
		return true;
	}
	/** @see {@link https://www.w3.org/TR/selectors-4/#the-nth-child-pseudo} */
	var nthOfRegex = new RegExp("^(.+?)\\s+of\\s+(.+)$", "is");
	function compileNth(reverse, ofType) {
		return function nth(next, rule, options, context, compileToken) {
			const { adapter, equals } = options;
			const ofMatch = ofType ? null : rule.match(nthOfRegex);
			const nthCheck$1 = nthCheck(ofMatch ? ofMatch[1].trim() : rule);
			if (nthCheck$1 === falseFunc) return falseFunc;
			const ofSelector = ofMatch && compileToken ? compileToken(parse$1(ofMatch[2].trim()), copyOptions(options), context) : void 0;
			if (ofSelector === falseFunc) return falseFunc;
			if (nthCheck$1 === trueFunc && !ofSelector) return (element) => getElementParent(element, adapter) !== null && next(element);
			const shouldCount = ofSelector ? (_element, sibling) => ofSelector(sibling) : ofType ? (element, sibling) => adapter.getName(sibling) === adapter.getName(element) : trueFunc;
			if (reverse) return function nthLast(element) {
				if (ofSelector && !ofSelector(element)) return false;
				const siblings = adapter.getSiblings(element);
				let pos = 0;
				for (let index = siblings.length - 1; index >= 0; index--) {
					const sibling = siblings[index];
					if (equals(element, sibling)) break;
					if (adapter.isTag(sibling) && shouldCount(element, sibling)) pos++;
				}
				return nthCheck$1(pos) && next(element);
			};
			return function nth(element) {
				if (ofSelector && !ofSelector(element)) return false;
				const siblings = adapter.getSiblings(element);
				let pos = 0;
				for (const sibling of siblings) {
					if (equals(element, sibling)) break;
					if (adapter.isTag(sibling) && shouldCount(element, sibling)) pos++;
				}
				return nthCheck$1(pos) && next(element);
			};
		};
	}
	/**
	* Pre-compiled pseudo filters.
	*/
	var filters = {
		contains(next, text, options) {
			const { getText } = options.adapter;
			return cacheParentResults(next, options, (element) => getText(element).includes(text));
		},
		icontains(next, text, options) {
			const itext = text.toLowerCase();
			const { getText } = options.adapter;
			return cacheParentResults(next, options, (element) => getText(element).toLowerCase().includes(itext));
		},
		"nth-child": compileNth(false, false),
		"nth-last-child": compileNth(true, false),
		"nth-of-type": compileNth(false, true),
		"nth-last-of-type": compileNth(true, true),
		root(next, _rule, { adapter }) {
			return (element) => getElementParent(element, adapter) === null && next(element);
		},
		scope(next, rule, options, context) {
			const { equals } = options;
			if (!context || context.length === 0) return filters["root"](next, rule, options);
			if (context.length === 1) return (element) => equals(context[0], element) && next(element);
			return (element) => context.includes(element) && next(element);
		},
		lang(next, code, { adapter }) {
			const ranges = code.split(",").map((r) => r.trim()).filter((r) => r.length > 0).map((r) => r.replace(/^['"]|['"]$/g, "").toLowerCase().split("-"));
			return function lang(element) {
				let node = element;
				while (node != null) {
					var _adapter$getAttribute;
					const value = (_adapter$getAttribute = adapter.getAttributeValue(node, "xml:lang")) !== null && _adapter$getAttribute !== void 0 ? _adapter$getAttribute : adapter.getAttributeValue(node, "lang");
					if (value != null) {
						if (!value) return ranges.some((r) => r[0] === "") && next(element);
						const tag = value.toLowerCase().split("-");
						return ranges.some((r) => extendedFilter(tag, r)) && next(element);
					}
					const parent = adapter.getParent(node);
					node = parent != null && adapter.isTag(parent) ? parent : null;
				}
				return ranges.some((r) => r[0] === "") && next(element);
			};
		},
		hover: dynamicStatePseudo("isHovered"),
		visited: dynamicStatePseudo("isVisited"),
		active: dynamicStatePseudo("isActive")
	};
	/**
	* Dynamic state pseudos. These depend on optional Adapter methods.
	* @param name The name of the adapter method to call.
	* @returns Pseudo for the `filters` object.
	*/
	function dynamicStatePseudo(name) {
		return function dynamicPseudo(next, _rule, { adapter }) {
			const filterFunction = adapter[name];
			if (typeof filterFunction !== "function") return falseFunc;
			return function active(element) {
				return filterFunction(element) && next(element);
			};
		};
	}
	//#endregion
	//#region node_modules/css-select/dist/pseudo-selectors/pseudos.js
	/**
	* CSS limits the characters considered as whitespace to space, tab & line
	* feed. We add carriage returns as htmlparser2 doesn't normalize them to
	* line feeds.
	* @see {@link https://www.w3.org/TR/css-text-3/#white-space}
	*/
	var isDocumentWhiteSpace = /^[ \t\r\n]*$/;
	/** Runtime pseudo selector implementations. */
	var pseudos = {
		empty(element, { adapter }) {
			const children = adapter.getChildren(element);
			return children.every((element) => !adapter.isTag(element)) && children.every((element) => isDocumentWhiteSpace.test(adapter.getText(element)));
		},
		"first-child"(element, { adapter, equals }) {
			if (adapter.prevElementSibling) return adapter.prevElementSibling(element) == null;
			const firstChild = adapter.getSiblings(element).find((sibling) => adapter.isTag(sibling));
			return firstChild != null && equals(element, firstChild);
		},
		"last-child"(element, { adapter, equals }) {
			const siblings = adapter.getSiblings(element);
			for (let index = siblings.length - 1; index >= 0; index--) {
				if (equals(element, siblings[index])) return true;
				if (adapter.isTag(siblings[index])) break;
			}
			return false;
		},
		"first-of-type"(element, { adapter, equals }) {
			const siblings = adapter.getSiblings(element);
			const elementName = adapter.getName(element);
			for (const currentSibling of siblings) {
				if (equals(element, currentSibling)) return true;
				if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elementName) break;
			}
			return false;
		},
		"last-of-type"(element, { adapter, equals }) {
			const siblings = adapter.getSiblings(element);
			const elementName = adapter.getName(element);
			for (let index = siblings.length - 1; index >= 0; index--) {
				const currentSibling = siblings[index];
				if (equals(element, currentSibling)) return true;
				if (adapter.isTag(currentSibling) && adapter.getName(currentSibling) === elementName) break;
			}
			return false;
		},
		"only-of-type"(element, { adapter, equals }) {
			const elementName = adapter.getName(element);
			return adapter.getSiblings(element).every((sibling) => equals(element, sibling) || !adapter.isTag(sibling) || adapter.getName(sibling) !== elementName);
		},
		"only-child"(element, { adapter, equals }) {
			return adapter.getSiblings(element).every((sibling) => equals(element, sibling) || !adapter.isTag(sibling));
		}
	};
	/**
	* Validate pseudo selector argument arity.
	* @param pseudoClassCondition Pseudo-function implementation to wrap.
	* @param name Name of the pseudo selector.
	* @param subselect Subselector passed to the pseudo-function.
	* @param argumentIndex Index of the argument parser to apply.
	*/
	function verifyPseudoArguments(pseudoClassCondition, name, subselect, argumentIndex) {
		if (subselect === null) {
			if (pseudoClassCondition.length > argumentIndex) throw new Error(`Pseudo-class :${name} requires an argument`);
		} else if (pseudoClassCondition.length === argumentIndex) throw new Error(`Pseudo-class :${name} doesn't have any arguments`);
	}
	//#endregion
	//#region node_modules/css-select/dist/helpers/selectors.js
	/**
	* Check whether a selector token performs traversal.
	* @param token Selector token(s) to compile.
	*/
	function isTraversal(token) {
		return token.type === "_flexibleDescendant" || isTraversal$1(token);
	}
	/**
	* Sort the parts of the passed selector, as there is potential for
	* optimization (some types of selectors are faster than others).
	* @param array Selector to sort
	*/
	function sortRules(array) {
		const ratings = array.map(getQuality);
		for (let index = 1; index < array.length; index++) {
			const procNew = ratings[index];
			if (procNew < 0) continue;
			for (let currentIndex = index; currentIndex > 0 && procNew < ratings[currentIndex - 1]; currentIndex--) {
				const token = array[currentIndex];
				array[currentIndex] = array[currentIndex - 1];
				array[currentIndex - 1] = token;
				ratings[currentIndex] = ratings[currentIndex - 1];
				ratings[currentIndex - 1] = procNew;
			}
		}
	}
	function getAttributeQuality(token) {
		switch (token.action) {
			case AttributeAction.Exists: return 10;
			case AttributeAction.Equals: return token.name === "id" ? 9 : 8;
			case AttributeAction.Not: return 7;
			case AttributeAction.Start: return 6;
			case AttributeAction.End: return 6;
			case AttributeAction.Any: return 5;
			case AttributeAction.Hyphen: return 4;
			case AttributeAction.Element: return 3;
		}
	}
	/**
	* Determine the quality of the passed token. The higher the number, the
	* faster the token is to execute.
	* @param token Token to get the quality of.
	* @returns The token's quality.
	*/
	function getQuality(token) {
		switch (token.type) {
			case SelectorType.Universal: return 50;
			case SelectorType.Tag: return 30;
			case SelectorType.Attribute: return Math.floor(getAttributeQuality(token) / (token.ignoreCase ? 2 : 1));
			case SelectorType.Pseudo: return token.data ? token.name === "has" || token.name === "contains" || token.name === "icontains" ? 0 : Array.isArray(token.data) ? Math.max(0, Math.min(...token.data.map((d) => Math.min(...d.map(getQuality))))) : 2 : 3;
			default: return -1;
		}
	}
	/**
	* Check whether a token or nested token includes `:scope`.
	* @param t Selector token under inspection.
	*/
	function includesScopePseudo(t) {
		return t.type === SelectorType.Pseudo && (t.name === "scope" || Array.isArray(t.data) && t.data.some((data) => data.some(includesScopePseudo)));
	}
	//#endregion
	//#region node_modules/css-select/dist/pseudo-selectors/subselects.js
	/** Used as a placeholder for :has. Will be replaced with the actual element. */
	var PLACEHOLDER_ELEMENT = {};
	/**
	* Check if the selector has any properties that rely on the current element.
	* If not, we can cache the result of the selector.
	*
	* We can't cache selectors that start with a traversal (e.g. `>`, `+`, `~`),
	* or include a `:scope`.
	* @param selector - The selector to check.
	* @returns Whether the selector has any properties that rely on the current element.
	*/
	function hasDependsOnCurrentElement(selector) {
		return selector.some((sel) => sel.length > 0 && (isTraversal(sel[0]) || sel.some(includesScopePseudo)));
	}
	var is = (next, token, options, context, compileToken) => {
		const compiledToken = compileToken(token, copyOptions(options), context);
		return compiledToken === trueFunc ? next : compiledToken === falseFunc ? falseFunc : (element) => compiledToken(element) && next(element);
	};
	/** Pseudo selectors that compile nested selectors. */
	var subselects = {
		is,
		/**
		* `:matches` and `:where` are aliases for `:is`.
		*/
		matches: is,
		where: is,
		not(next, token, options, context, compileToken) {
			const compiledToken = compileToken(token, copyOptions(options), context);
			return compiledToken === falseFunc ? next : compiledToken === trueFunc ? falseFunc : (element) => !compiledToken(element) && next(element);
		},
		has(next, subselect, options, _context, compileToken) {
			const { adapter } = options;
			const copiedOptions = copyOptions(options);
			copiedOptions.relativeSelector = true;
			const context = subselect.some((s) => s.some(isTraversal)) ? [PLACEHOLDER_ELEMENT] : void 0;
			const skipCache = hasDependsOnCurrentElement(subselect);
			const compiled = compileToken(subselect, copiedOptions, context);
			if (compiled === falseFunc) return falseFunc;
			if (context && compiled !== trueFunc) return skipCache ? (element) => {
				if (!next(element)) return false;
				context[0] = element;
				const childs = adapter.getChildren(element);
				return findOne(compiled, compiled.shouldTestNextSiblings ? [...childs, ...getNextSiblings(element, adapter)] : childs, options) !== null;
			} : cacheParentResults(next, options, (element) => {
				context[0] = element;
				return findOne(compiled, adapter.getChildren(element), options) !== null;
			});
			const hasOne = (element) => findOne(compiled, adapter.getChildren(element), options) !== null;
			return skipCache ? (element) => next(element) && hasOne(element) : cacheParentResults(next, options, hasOne);
		}
	};
	//#endregion
	//#region node_modules/css-select/dist/pseudo-selectors/index.js
	/**
	* Compile a pseudo selector into an executable query function.
	* @param next Matcher to run after this matcher succeeds.
	* @param selector Selector used to match elements.
	* @param options Options that control this operation.
	* @param context Context nodes used to scope selector matching.
	* @param compileToken Function used to compile nested selector tokens.
	*/
	function compilePseudoSelector(next, selector, options, context, compileToken) {
		var _options$pseudos;
		const { name, data } = selector;
		if (Array.isArray(data)) {
			if (!(name in subselects)) throw new Error(`Unknown pseudo-class :${name}(${data})`);
			return subselects[name](next, data, options, context, compileToken);
		}
		const userPseudo = (_options$pseudos = options.pseudos) === null || _options$pseudos === void 0 ? void 0 : _options$pseudos[name];
		const stringPseudo = typeof userPseudo === "string" ? userPseudo : aliases[name];
		if (typeof stringPseudo === "string") {
			if (data != null) throw new Error(`Pseudo ${name} doesn't have any arguments`);
			const alias = parse$1(stringPseudo);
			return subselects["is"](next, alias, options, context, compileToken);
		}
		if (typeof userPseudo === "function") {
			verifyPseudoArguments(userPseudo, name, data, 1);
			return (element) => userPseudo(element, data) && next(element);
		}
		if (name in filters) return filters[name](next, data, options, context, compileToken);
		if (name in pseudos) {
			const pseudo = pseudos[name];
			verifyPseudoArguments(pseudo, name, data, 2);
			return (element) => pseudo(element, options, data) && next(element);
		}
		throw new Error(`Unknown pseudo-class :${name}`);
	}
	//#endregion
	//#region node_modules/css-select/dist/general.js
	/**
	* Compile a single selector token.
	* @param next Matcher to run after this matcher succeeds.
	* @param selector Selector used to match elements.
	* @param options Options that control this operation.
	* @param context Context nodes used to scope selector matching.
	* @param compileToken Function used to compile nested selector tokens.
	* @param hasExpensiveSubselector Whether the selector contains expensive subselectors.
	*/
	function compileGeneralSelector(next, selector, options, context, compileToken, hasExpensiveSubselector) {
		const { adapter, equals, cacheResults } = options;
		switch (selector.type) {
			case SelectorType.PseudoElement: throw new Error("Pseudo-elements are not supported by css-select");
			case SelectorType.ColumnCombinator: throw new Error("Column combinators are not yet supported by css-select");
			case SelectorType.Attribute:
				if (selector.namespace != null) throw new Error("Namespaced attributes are not yet supported by css-select");
				if (!options.xmlMode || options.lowerCaseAttributeNames) selector.name = selector.name.toLowerCase();
				return attributeRules[selector.action](next, selector, options);
			case SelectorType.Pseudo: return compilePseudoSelector(next, selector, options, context, compileToken);
			case SelectorType.Tag: {
				if (selector.namespace != null) throw new Error("Namespaced tag names are not yet supported by css-select");
				let { name } = selector;
				if (!options.xmlMode || options.lowerCaseTags) name = name.toLowerCase();
				return function tag(element) {
					return adapter.getName(element) === name && next(element);
				};
			}
			case SelectorType.Descendant: {
				if (!hasExpensiveSubselector || cacheResults === false || typeof WeakMap === "undefined") return function descendant(element) {
					let current = element;
					while (current = getElementParent(current, adapter)) if (next(current)) return true;
					return false;
				};
				const resultCache = /* @__PURE__ */ new WeakMap();
				return function cachedDescendant(element) {
					let current = element;
					let result;
					while (current = getElementParent(current, adapter)) {
						const cached = resultCache.get(current);
						if (cached === void 0) {
							var _result;
							(_result = result) !== null && _result !== void 0 || (result = { matches: false });
							result.matches = next(current);
							resultCache.set(current, result);
							if (result.matches) return true;
						} else {
							if (result) result.matches = cached.matches;
							return cached.matches;
						}
					}
					return false;
				};
			}
			case "_flexibleDescendant": return function flexibleDescendant(element) {
				let current = element;
				do {
					if (next(current)) return true;
					current = getElementParent(current, adapter);
				} while (current);
				return false;
			};
			case SelectorType.Parent: return function parent(element) {
				return adapter.getChildren(element).some((element) => adapter.isTag(element) && next(element));
			};
			case SelectorType.Child: return function child(element) {
				const parent = getElementParent(element, adapter);
				return parent !== null && next(parent);
			};
			case SelectorType.Sibling: return function sibling(element) {
				const siblings = adapter.getSiblings(element);
				for (const currentSibling of siblings) {
					if (equals(element, currentSibling)) break;
					if (adapter.isTag(currentSibling) && next(currentSibling)) return true;
				}
				return false;
			};
			case SelectorType.Adjacent:
				if (adapter.prevElementSibling) return function adjacent(element) {
					const previous = adapter.prevElementSibling(element);
					return previous != null && next(previous);
				};
				return function adjacent(element) {
					const siblings = adapter.getSiblings(element);
					let lastElement;
					for (const currentSibling of siblings) {
						if (equals(element, currentSibling)) break;
						if (adapter.isTag(currentSibling)) lastElement = currentSibling;
					}
					return !!lastElement && next(lastElement);
				};
			case SelectorType.Universal:
				if (selector.namespace != null && selector.namespace !== "*") throw new Error("Namespaced universal selectors are not yet supported by css-select");
				return next;
		}
	}
	//#endregion
	//#region node_modules/css-select/dist/compile.js
	var DESCENDANT_TOKEN = { type: SelectorType.Descendant };
	var FLEXIBLE_DESCENDANT_TOKEN = { type: "_flexibleDescendant" };
	var SCOPE_TOKEN = {
		type: SelectorType.Pseudo,
		name: "scope",
		data: null
	};
	function absolutize(token, { adapter }, context) {
		const hasContext = !!(context === null || context === void 0 ? void 0 : context.every((element) => element === PLACEHOLDER_ELEMENT || adapter.isTag(element) && getElementParent(element, adapter) !== null));
		for (const t of token) {
			if (t.length > 0 && isTraversal(t[0]) && t[0].type !== SelectorType.Descendant) {} else if (hasContext && !t.some(includesScopePseudo)) t.unshift(DESCENDANT_TOKEN);
			else continue;
			t.unshift(SCOPE_TOKEN);
		}
	}
	/**
	* Compile a parsed selector token into an executable query function.
	* @param token Selector token(s) to compile.
	* @param options Options that control this operation.
	* @param compilationContext Compilation context for relative selector handling.
	*/
	function compileToken(token, options, compilationContext) {
		for (const rules of token) sortRules(rules);
		const { context = compilationContext, rootFunc: rootFunction = trueFunc } = options;
		const isArrayContext = Array.isArray(context);
		const finalContext = context && (Array.isArray(context) ? context : [context]);
		if (options.relativeSelector !== false) absolutize(token, options, finalContext);
		else if (token.some((t) => t.length > 0 && isTraversal(t[0]))) throw new Error("Relative selectors are not allowed when the `relativeSelector` option is disabled");
		let shouldTestNextSiblings = false;
		let query = falseFunc;
		combineLoop: for (const rules of token) {
			if (rules.length >= 2) {
				const [first, second] = rules;
				if (first.type !== SelectorType.Pseudo || first.name !== "scope") {} else if (isArrayContext && second.type === SelectorType.Descendant) rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
				else if (second.type === SelectorType.Adjacent || second.type === SelectorType.Sibling) shouldTestNextSiblings = true;
			}
			let next = rootFunction;
			let hasExpensiveSubselector = false;
			for (const rule of rules) {
				next = compileGeneralSelector(next, rule, options, finalContext, compileToken, hasExpensiveSubselector);
				if (getQuality(rule) === 0) hasExpensiveSubselector = true;
				if (next === falseFunc) continue combineLoop;
			}
			if (next === rootFunction) return rootFunction;
			query = query === falseFunc ? next : or(query, next);
		}
		query.shouldTestNextSiblings = shouldTestNextSiblings;
		return query;
	}
	function or(a, b) {
		return (element) => a(element) || b(element);
	}
	//#endregion
	//#region node_modules/css-select/dist/index.js
	var defaultEquals = (a, b) => a === b;
	var defaultOptions = {
		adapter: _objectSpread2(_objectSpread2({}, dist_exports), {}, { isTag }),
		equals: defaultEquals
	};
	function convertOptionFormats(options) {
		var _finalOptions$adapter, _finalOptions$equals, _finalOptions$adapter2, _finalOptions$adapter3;
		const finalOptions = options !== null && options !== void 0 ? options : defaultOptions;
		(_finalOptions$adapter = finalOptions.adapter) !== null && _finalOptions$adapter !== void 0 || (finalOptions.adapter = defaultOptions.adapter);
		(_finalOptions$equals = finalOptions.equals) !== null && _finalOptions$equals !== void 0 || (finalOptions.equals = (_finalOptions$adapter2 = (_finalOptions$adapter3 = finalOptions.adapter) === null || _finalOptions$adapter3 === void 0 ? void 0 : _finalOptions$adapter3.equals) !== null && _finalOptions$adapter2 !== void 0 ? _finalOptions$adapter2 : defaultEquals);
		return finalOptions;
	}
	/**
	* Compiles a selector to an executable function.
	*
	* The returned function checks if each passed node is an element. Use
	* `_compileUnsafe` to skip this check.
	* @param selector Selector to compile.
	* @param options Compilation options.
	* @param context Optional context for the selector.
	*/
	function compile(selector, options, context) {
		const convertedOptions = convertOptionFormats(options);
		const next = _compileUnsafe(selector, convertedOptions, context);
		return next === falseFunc ? falseFunc : (element) => convertedOptions.adapter.isTag(element) && next(element);
	}
	/**
	* Like `compile`, but does not add a check if elements are tags.
	* @param selector Selector used to match elements.
	* @param options Options that control this operation.
	* @param context Context nodes used to scope selector matching.
	*/
	function _compileUnsafe(selector, options, context) {
		return compileToken(typeof selector === "string" ? parse$1(selector) : selector, convertOptionFormats(options), context);
	}
	//#endregion
	//#region src/html/css/css-shorthands.ts
	/**
	* Turns CSS's shorthand properties, such as `margin` and `border`, into the properties they set, such as `margin-top`
	* and `border-left-color`, and its other names for properties, such as `page-break-before`, into the names docx/html
	* reads.
	*
	* @module
	*/
	var SIDES$1 = [
		"top",
		"right",
		"bottom",
		"left"
	];
	/** The four sides' values from one to four values, as `margin` and `padding` give them */
	var sidesOf = (values) => {
		switch (values.length) {
			case 1: return [
				values[0],
				values[0],
				values[0],
				values[0]
			];
			case 2: return [
				values[0],
				values[1],
				values[0],
				values[1]
			];
			case 3: return [
				values[0],
				values[1],
				values[2],
				values[1]
			];
			case 4: return values;
			default: return;
		}
	};
	var BORDER_STYLES = /* @__PURE__ */ new Set([
		"none",
		"hidden",
		"dotted",
		"dashed",
		"solid",
		"double",
		"groove",
		"ridge",
		"inset",
		"outset"
	]);
	var BORDER_WIDTHS = /* @__PURE__ */ new Set([
		"thin",
		"medium",
		"thick"
	]);
	var isBorderWidth = (word) => {
		var _parseLength;
		return BORDER_WIDTHS.has(word.toLowerCase()) || ((_parseLength = parseLength(word)) === null || _parseLength === void 0 ? void 0 : _parseLength.unit) === "pt";
	};
	/** A border's width, style and colour, from a `border` value, such as `1px solid red`, in any order */
	var borderParts = (value) => {
		var _width$, _style$, _color$;
		const words = wordsOf(value);
		const width = words.filter(isBorderWidth);
		const style = words.filter((word) => BORDER_STYLES.has(word.toLowerCase()));
		const color = words.filter((word) => !isBorderWidth(word) && !BORDER_STYLES.has(word.toLowerCase()));
		if (words.length === 0 || width.length > 1 || style.length > 1 || color.length > 1 || color.length === 1 && !parseColor(color[0])) return;
		return [
			(_width$ = width[0]) !== null && _width$ !== void 0 ? _width$ : "medium",
			(_style$ = style[0]) !== null && _style$ !== void 0 ? _style$ : "none",
			(_color$ = color[0]) !== null && _color$ !== void 0 ? _color$ : "currentcolor"
		];
	};
	var border = (sides, value) => {
		const parts = borderParts(value);
		return parts && sides.flatMap((side) => [
			[`border-${side}-width`, parts[0]],
			[`border-${side}-style`, parts[1]],
			[`border-${side}-color`, parts[2]]
		]);
	};
	var fourSides = (property, value) => {
		var _sidesOf;
		return (_sidesOf = sidesOf(wordsOf(value))) === null || _sidesOf === void 0 ? void 0 : _sidesOf.map((sideValue, index) => [property(SIDES$1[index]), sideValue]);
	};
	var FONT_STYLES = /* @__PURE__ */ new Set([
		"italic",
		"oblique",
		"normal"
	]);
	var FONT_VARIANTS = /* @__PURE__ */ new Set(["small-caps"]);
	var FONT_WEIGHTS = /* @__PURE__ */ new Set([
		"bold",
		"bolder",
		"lighter"
	]);
	var FONT_SIZES$1 = /* @__PURE__ */ new Set([
		"xx-small",
		"x-small",
		"small",
		"medium",
		"large",
		"x-large",
		"xx-large",
		"xxx-large",
		"smaller",
		"larger"
	]);
	/**
	* The properties `font` sets: its style, variant, weight and stretch, in any order, then its size, with a line height
	* after a slash, and its families. A system font, such as `caption`, is left out, as its size and family can't be
	* known.
	*/
	var font = (value) => {
		const words = wordsOf(value.replace(/\s*\/\s*/, "/"));
		const sizeIndex = words.findIndex((word) => FONT_SIZES$1.has(word.split("/")[0].toLowerCase()) || parseLength(word.split("/")[0]));
		if (sizeIndex === -1 || sizeIndex === words.length - 1) return;
		const before = words.slice(0, sizeIndex).map((word) => word.toLowerCase());
		const [size, lineHeight] = words[sizeIndex].split("/");
		const style = before.find((word) => FONT_STYLES.has(word) && word !== "normal");
		const variant = before.find((word) => FONT_VARIANTS.has(word));
		const weight = before.find((word) => FONT_WEIGHTS.has(word) || /^\d+$/.test(word));
		return [
			["font-style", style !== null && style !== void 0 ? style : "normal"],
			["font-variant-caps", variant !== null && variant !== void 0 ? variant : "normal"],
			["font-weight", weight !== null && weight !== void 0 ? weight : "normal"],
			["font-size", size],
			["line-height", lineHeight !== null && lineHeight !== void 0 ? lineHeight : "normal"],
			["font-family", words.slice(sizeIndex + 1).join(" ")]
		];
	};
	/** The colour of a `background`, which is the only part of it a paragraph, a run or a cell can have */
	var background = (value) => {
		var _wordsOf$find;
		const layers = listOf(value);
		return [["background-color", (_wordsOf$find = wordsOf(layers[layers.length - 1]).find((word) => parseColor(word))) !== null && _wordsOf$find !== void 0 ? _wordsOf$find : "transparent"]];
	};
	var DECORATION_LINES = /* @__PURE__ */ new Set([
		"underline",
		"overline",
		"line-through",
		"blink",
		"none"
	]);
	var DECORATION_STYLES = /* @__PURE__ */ new Set([
		"solid",
		"double",
		"dotted",
		"dashed",
		"wavy"
	]);
	/** The line, style and colour of a `text-decoration`, such as `underline wavy red`, in any order */
	var textDecoration = (value) => {
		const words = wordsOf(value);
		const lines = words.filter((word) => DECORATION_LINES.has(word.toLowerCase()));
		const style = words.find((word) => DECORATION_STYLES.has(word.toLowerCase()));
		const color = words.find((word) => !DECORATION_LINES.has(word.toLowerCase()) && !DECORATION_STYLES.has(word.toLowerCase()));
		return [
			["text-decoration-line", lines.length === 0 ? "none" : lines.join(" ")],
			["text-decoration-style", style !== null && style !== void 0 ? style : "solid"],
			["text-decoration-color", color !== null && color !== void 0 ? color : "currentcolor"]
		];
	};
	/** The type of a `list-style`, such as `square inside`, whose other parts docx/html leaves out */
	var listStyle = (value) => {
		var _ref, _words$find;
		const words = wordsOf(value).filter((word) => !/^(?:inside|outside|url\(.*\))$/i.test(word));
		return [["list-style-type", (_ref = (_words$find = words.find((word) => word.toLowerCase() !== "none")) !== null && _words$find !== void 0 ? _words$find : words[0]) !== null && _ref !== void 0 ? _ref : "none"]];
	};
	var PAGE_BREAKS = {
		always: "page",
		left: "page",
		right: "page",
		avoid: "avoid",
		auto: "auto"
	};
	/**
	* The properties a shorthand sets, or another name for a property sets, a property as it is, and undefined for a
	* shorthand whose value isn't valid, which is left out, as a browser leaves it out. Logical properties, such as
	* `margin-inline-start`, are the physical ones of left-to-right text. A CSS-wide keyword, such as `inherit`, is the
	* value of each property a shorthand sets.
	*/
	var expandShorthand = (property, value) => {
		if (isCssWideKeyword(value)) {
			const keyword = value.trim();
			return expandShorthand(property, property === "font" ? "medium serif" : "medium").map(([longhand]) => [longhand, keyword]);
		}
		switch (property) {
			case "margin":
			case "padding": return fourSides((side) => `${property}-${side}`, value);
			case "margin-inline":
			case "padding-inline": {
				const [start, end = start] = wordsOf(value);
				return [[`${property.split("-")[0]}-left`, start], [`${property.split("-")[0]}-right`, end]];
			}
			case "margin-block":
			case "padding-block": {
				const [start, end = start] = wordsOf(value);
				return [[`${property.split("-")[0]}-top`, start], [`${property.split("-")[0]}-bottom`, end]];
			}
			case "border": return border(SIDES$1, value);
			case "border-top":
			case "border-right":
			case "border-bottom":
			case "border-left": return border([property.slice(7)], value);
			case "border-inline-start": return border(["left"], value);
			case "border-inline-end": return border(["right"], value);
			case "border-block-start": return border(["top"], value);
			case "border-block-end": return border(["bottom"], value);
			case "border-width":
			case "border-style":
			case "border-color": return fourSides((side) => `border-${side}-${property.slice(7)}`, value);
			case "font": return font(value);
			case "font-variant": return [["font-variant-caps", wordsOf(value).some((word) => /^(?:all-)?small-caps$/i.test(word)) ? "small-caps" : "normal"]];
			case "background": return background(value);
			case "text-decoration": return textDecoration(value);
			case "list-style": return listStyle(value);
			case "page-break-before":
			case "page-break-after":
			case "page-break-inside":
				var _PAGE_BREAKS$value$tr;
				return [[property.replace("page-", ""), (_PAGE_BREAKS$value$tr = PAGE_BREAKS[value.trim().toLowerCase()]) !== null && _PAGE_BREAKS$value$tr !== void 0 ? _PAGE_BREAKS$value$tr : value]];
			default: {
				const logical = /^(margin|padding)-(inline|block)-(start|end)$/.exec(property);
				if (logical) {
					const [, box, axis, edge] = logical;
					return [[`${box}-${axis === "inline" ? edge === "start" ? "left" : "right" : edge === "start" ? "top" : "bottom"}`, value]];
				}
				return [[property, value]];
			}
		}
	};
	//#endregion
	//#region src/html/css/css-cascade.ts
	/**
	* CSS's cascade: the values each element's properties are given, by the style sheets' rules that match it, the styles
	* its attributes stand for, such as `align`, and its `style` attribute, with the most important first.
	*
	* Rules are matched with css-select. A rule whose selector it can't match, such as one with `::before` or `:hover`, is
	* left out, as it styles no element of the document.
	*
	* @module
	*/
	/**
	* Where a declaration comes from, from the least important: a browser's own style sheet, the styles an element's
	* attributes stand for, such as `align` and `bgcolor`, the document's style sheets, and the element's `style`
	*/
	var Origin = {
		UserAgent: 0,
		Presentational: 1,
		Author: 2,
		Inline: 3
	};
	var ID = 1e6;
	var CLASS = 1e3;
	var TYPE = 1;
	/** A selector's specificity, as one number: its ids, then its classes, attributes and pseudo-classes, then its types */
	var specificityOf = (selector) => selector.reduce((total, token) => {
		switch (token.type) {
			case "attribute": return total + (token.name === "id" && token.action === "equals" ? ID : CLASS);
			case "pseudo":
				if (token.name === "where") return total;
				return total + (Array.isArray(token.data) ? Math.max(...token.data.map(specificityOf)) : CLASS);
			case "tag": return total + TYPE;
			default: return total;
		}
	}, 0);
	/** Compiles the style rules of style sheets, in order, each selector of a rule on its own, as each has a specificity */
	var compileRules = (styleSheets, firstOrder) => {
		let order = firstOrder;
		return styleSheets.flatMap(({ css, origin }) => parseStyleSheet(css).flatMap(({ selectors, declarations }) => {
			order++;
			const ruleOrder = order;
			return splitTopLevel(selectors, ",").flatMap((text) => {
				try {
					const [selector] = parse$1(text);
					if (selector.some((token) => token.type === "pseudo-element")) return [];
					return [{
						matches: compile([selector], { xmlMode: false }),
						origin,
						specificity: specificityOf(selector),
						order: ruleOrder,
						declarations
					}];
				} catch (_unused) {
					return [];
				}
			});
		}));
	};
	var DECLARATIONS = 1e5;
	/** Whether a candidate is more important than another: `!important`, then its origin, its specificity and its order */
	var compareCandidates = (a, b) => Number(b.declaration.important) - Number(a.declaration.important) || b.origin - a.origin || b.specificity - a.specificity || b.order - a.order;
	var LONGEST_VALUE = 65536;
	var DEEPEST_REFERENCE = 256;
	var DEEPEST_FALLBACK = 32;
	/**
	* A value with each `var()` replaced by the custom property's value, or its fallback when the element has no such
	* property, or undefined when it has neither, as the value is then invalid, as is one longer than browsers allow.
	*
	* @param value - The value, such as `1px solid var(--border-color, black)`
	* @param variableOf - The value of each of the element's custom properties, by its name, with its own `var()`s replaced
	* @param depth - How many fallbacks the value is in
	*/
	var substituteVariables = (value, variableOf, depth = 0) => {
		const references = /var\(/gi;
		let substituted = "";
		let from = 0;
		for (let match = references.exec(value); match; match = references.exec(value)) {
			var _variableOf;
			const start = match.index + match[0].length;
			const end = indexOfTopLevel(value, start, ")");
			const inside = value.slice(start, end);
			const comma = indexOfTopLevel(inside, 0, ",");
			const replacement = (_variableOf = variableOf(inside.slice(0, comma).trim())) !== null && _variableOf !== void 0 ? _variableOf : comma < inside.length && depth < DEEPEST_FALLBACK ? substituteVariables(inside.slice(comma + 1).trim(), variableOf, depth + 1) : void 0;
			if (replacement === void 0) return;
			substituted += value.slice(from, match.index) + replacement;
			if (substituted.length > LONGEST_VALUE) return;
			from = end + 1;
			references.lastIndex = from;
		}
		substituted += value.slice(from);
		return substituted.length > LONGEST_VALUE ? void 0 : substituted;
	};
	/**
	* The custom properties an element has: those it inherits, and its own, whose `var()`s are worked out with each other,
	* each once. Those that refer to each other in a cycle are invalid, and left out, as are those more than 256 references
	* deep, those longer than browsers allow, and those that are `initial`. One that is `inherit`, `unset` or `revert` is
	* the one it inherits.
	*/
	var customPropertiesOf = (own, inherited) => {
		const resolved = /* @__PURE__ */ new Map();
		const resolving = [];
		const cyclic = /* @__PURE__ */ new Set();
		const resolve = (name) => {
			const value = own.get(name);
			if (value === void 0) return inherited.get(name);
			if (isCssWideKeyword(value)) return value.trim().toLowerCase() === "initial" ? void 0 : inherited.get(name);
			if (resolved.has(name)) return resolved.get(name);
			const index = resolving.indexOf(name);
			if (index !== -1) {
				for (const member of resolving.slice(index)) cyclic.add(member);
				return;
			}
			if (resolving.length >= DEEPEST_REFERENCE) return;
			resolving.push(name);
			const substituted = substituteVariables(value, resolve);
			resolving.pop();
			const result = cyclic.has(name) ? void 0 : substituted;
			resolved.set(name, result);
			return result;
		};
		return new Map([.../* @__PURE__ */ new Set([...inherited.keys(), ...own.keys()])].flatMap((name) => {
			const value = resolve(name);
			return value === void 0 ? [] : [[name, value]];
		}));
	};
	/**
	* Creates the cascade of a document: its style sheets' rules, after a browser's own, are compiled once, and matched
	* against each element it is asked for.
	*
	* @param userAgentStyleSheet - The styles a browser gives elements of its own
	* @param styleSheets - The document's style sheets, in order
	* @param presentationalHints - The declarations an element's attributes stand for, such as `align="center"`
	*/
	var createCascade = (userAgentStyleSheet, styleSheets, presentationalHints) => {
		const rules = [...userAgentStyleSheet, ...compileRules(styleSheets.map((css) => ({
			css,
			origin: Origin.Author
		})), 1e6)];
		return (element, inherited) => {
			var _element$attribs$styl;
			const candidates = [
				...rules.filter((rule) => rule.matches(element)).flatMap(({ declarations, origin, specificity, order }) => declarations.map((declaration, index) => ({
					declaration,
					origin,
					specificity,
					order: order + index / DECLARATIONS
				}))),
				...presentationalHints(element).map((declaration, order) => ({
					declaration,
					origin: Origin.Presentational,
					specificity: 0,
					order
				})),
				...parseDeclarations((_element$attribs$styl = element.attribs.style) !== null && _element$attribs$styl !== void 0 ? _element$attribs$styl : "").map((declaration, order) => ({
					declaration,
					origin: Origin.Inline,
					specificity: 0,
					order
				}))
			].sort(compareCandidates);
			const custom = /* @__PURE__ */ new Map();
			for (const { declaration } of candidates) if (declaration.property.startsWith("--") && !custom.has(declaration.property)) custom.set(declaration.property, declaration.value);
			const customProperties = customPropertiesOf(custom, inherited);
			const values = /* @__PURE__ */ new Map();
			for (const { declaration } of candidates) {
				var _ref;
				const value = declaration.property.startsWith("--") ? void 0 : substituteVariables(declaration.value, (name) => customProperties.get(name));
				for (const [property, longhandValue] of (_ref = value === void 0 ? void 0 : expandShorthand(declaration.property, value)) !== null && _ref !== void 0 ? _ref : []) {
					var _values$get;
					values.set(property, [...(_values$get = values.get(property)) !== null && _values$get !== void 0 ? _values$get : [], longhandValue]);
				}
			}
			return {
				values,
				customProperties
			};
		};
	};
	/** Compiles a browser's own style sheet */
	var compileUserAgentStyleSheet = (css) => compileRules([{
		css,
		origin: Origin.UserAgent
	}], 0);
	//#endregion
	//#region src/html/css/presentational-hints.ts
	/** A dimension attribute's length, such as `width="200"` (pixels) or `width="50%"`, or undefined if it has none */
	var dimensionOf = (value) => {
		const match = /^\s*(\d+(?:\.\d+)?)\s*(%?)/.exec(value !== null && value !== void 0 ? value : "");
		return match ? `${match[1]}${match[2] === "%" ? "%" : "px"}` : void 0;
	};
	var FONT_SIZES = [
		"x-small",
		"small",
		"medium",
		"large",
		"x-large",
		"xx-large",
		"xxx-large"
	];
	/** The size of `<font size>`: 1 to 7, or one more or less than 3 with a sign, kept within 1 to 7 */
	var fontSizeOf = (value) => {
		const match = /^\s*([+-]?)(\d+)/.exec(value);
		if (!match) return;
		const amount = Number(match[2]);
		const size = match[1] === "+" ? 3 + amount : match[1] === "-" ? 3 - amount : amount;
		return FONT_SIZES[Math.min(Math.max(size, 1), 7) - 1];
	};
	var LIST_TYPES = {
		"1": "decimal",
		a: "lower-alpha",
		A: "upper-alpha",
		i: "lower-roman",
		I: "upper-roman",
		disc: "disc",
		circle: "circle",
		square: "square"
	};
	var ALIGNED = /* @__PURE__ */ new Set([
		"p",
		"div",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"caption",
		"td",
		"th",
		"tr",
		"thead",
		"tbody",
		"tfoot",
		"legend"
	]);
	var TABLE_PARTS = /* @__PURE__ */ new Set([
		"table",
		"thead",
		"tbody",
		"tfoot",
		"tr",
		"td",
		"th"
	]);
	var SIZED = /* @__PURE__ */ new Set([
		"table",
		"td",
		"th",
		"img",
		"col",
		"colgroup",
		"hr",
		"iframe",
		"video",
		"canvas"
	]);
	var HEIGHTS = /* @__PURE__ */ new Set([
		"table",
		"tr",
		"td",
		"th",
		"img",
		"iframe",
		"video",
		"canvas"
	]);
	/** The table a cell is in */
	var tableOf = (cell) => {
		var _ancestor;
		let ancestor = cell.parent;
		while (ancestor && (ancestor.type !== "tag" || ancestor.name !== "table")) ancestor = ancestor.parent;
		return (_ancestor = ancestor) !== null && _ancestor !== void 0 ? _ancestor : void 0;
	};
	/** Whether a table has a border by its `border` attribute, which is a number of pixels, or 1 if it has no number */
	var tableBorderOf = (table) => {
		const { border } = table.attribs;
		return border === void 0 ? void 0 : Number(/^\s*(\d*)/.exec(border)[1] || "1");
	};
	/** A declaration if what it stands for is given, or none */
	var hint = (property, value) => value ? [{
		property,
		value,
		important: false
	}] : [];
	/** A table's or cell's border, from its table's `border` attribute */
	var borderHint = (border, width) => border === void 0 ? [] : hint("border", border === 0 ? "none" : `${width} solid`);
	/** The list type of a `type` attribute, whose case matters on an `<ol>`, as `a` and `A` are different */
	var listTypeOf = (name, type) => {
		var _type$trim, _LIST_TYPES$trimmed;
		const trimmed = (_type$trim = type === null || type === void 0 ? void 0 : type.trim()) !== null && _type$trim !== void 0 ? _type$trim : "";
		return name === "ol" ? LIST_TYPES[trimmed] : (_LIST_TYPES$trimmed = LIST_TYPES[trimmed]) !== null && _LIST_TYPES$trimmed !== void 0 ? _LIST_TYPES$trimmed : LIST_TYPES[trimmed.toLowerCase()];
	};
	/**
	* The declarations an element's presentational attributes stand for.
	*/
	var presentationalHints = (element) => {
		var _attribs$align;
		const { name, attribs } = element;
		const align = (_attribs$align = attribs.align) === null || _attribs$align === void 0 ? void 0 : _attribs$align.trim().toLowerCase();
		const table = name === "td" || name === "th" ? tableOf(element) : void 0;
		return [
			...hint("text-align", ALIGNED.has(name) && [
				"left",
				"right",
				"center",
				"justify"
			].includes(align !== null && align !== void 0 ? align : "") && align),
			...hint("margin-left", name === "table" && (align === "center" || align === "right") && "auto"),
			...hint("margin-right", name === "table" && align === "center" && "auto"),
			...hint("float", name === "img" && (align === "left" || align === "right") && align),
			...hint("vertical-align", TABLE_PARTS.has(name) && attribs.valign),
			...hint("background-color", (TABLE_PARTS.has(name) || name === "body") && attribs.bgcolor),
			...hint("width", SIZED.has(name) && dimensionOf(attribs.width)),
			...hint("height", HEIGHTS.has(name) && dimensionOf(attribs.height)),
			...hint("white-space", (name === "td" || name === "th") && attribs.nowrap !== void 0 && "nowrap"),
			...name === "table" ? borderHint(tableBorderOf(element), `${tableBorderOf(element)}px`) : [],
			...table ? borderHint(tableBorderOf(table), "1px") : [],
			...hint("padding", table && dimensionOf(table.attribs.cellpadding)),
			...hint("color", name === "font" && attribs.color),
			...hint("font-family", name === "font" && attribs.face),
			...hint("font-size", name === "font" && attribs.size !== void 0 && fontSizeOf(attribs.size)),
			...hint("list-style-type", (name === "ol" || name === "ul" || name === "li") && listTypeOf(name, attribs.type))
		];
	};
	//#endregion
	//#region src/html/css/user-agent-styles.ts
	/**
	* The styles docx/html gives HTML's elements before the document's own, as a browser's style sheet does.
	*
	* It gives elements what they mean, such as `<b>`'s bold and `<p>`'s being a block, but not a browser's sizes and
	* margins: paragraphs, headings and links are written in the Word document's own styles instead, so they look like the
	* rest of the document. Elements that are never shown, such as `<script>`, aren't shown.
	*
	* It also has the styles of the classes rich-text editors write, which are in their own style sheets rather than in
	* the HTML they give, so their content looks as it did in the editor: CKEditor 5's markers, pens, text sizes and
	* image styles, Quill's alignment, sizes, fonts and indents, and the lists of to-dos that TipTap, Lexical and GitHub
	* write, which have checkboxes rather than bullets. The line break that browsers add to what they copy is left out.
	*
	* @module
	*/
	var USER_AGENT_STYLES = `
html, body, address, blockquote, center, dialog, div, figure, figcaption, footer, form, header, hr, legend, listing,
main, p, plaintext, pre, search, xmp, article, aside, h1, h2, h3, h4, h5, h6, hgroup, nav, section, dir, dd, dl, dt,
menu, ol, ul, details, summary, fieldset, optgroup {
    display: block;
}
li { display: list-item; }
table { display: table; }
caption { display: table-caption; }
colgroup, col { display: none; }
thead, tbody, tfoot { display: table-row-group; }
tr { display: table-row; }
td, th { display: table-cell; }
area, base, basefont, datalist, head, link, meta, noembed, noframes, param, script, style, template, title,
noscript, [hidden], dialog:not([open]) {
    display: none;
}

b, strong { font-weight: bold; }
i, em, cite, dfn, var, address { font-style: italic; }
u, ins { text-decoration: underline; }
s, strike, del { text-decoration: line-through; }
sub { vertical-align: sub; }
sup { vertical-align: super; }
small { font-size: smaller; }
big { font-size: larger; }
code, kbd, samp, tt, pre, listing, xmp, plaintext { font-family: monospace; }
pre, listing, xmp, plaintext { white-space: pre; }
textarea { white-space: pre-wrap; }
nobr { white-space: nowrap; }
center { text-align: center; }
th { font-weight: bold; text-align: center; }
caption { text-align: center; }
blockquote { margin-left: 0.5in; margin-right: 0.5in; }
dd { margin-left: 0.5in; }
ul { list-style-type: disc; }
ol { list-style-type: decimal; }
ul ul, ol ul, menu ul, ul menu, ol menu { list-style-type: circle; }
ul ul ul, ul ol ul, ol ul ul, ol ol ul, ul ul menu { list-style-type: square; }
menu, dir { list-style-type: disc; }
[dir="rtl" i] { direction: rtl; }
[dir="ltr" i] { direction: ltr; }
mark { background-color: yellow; }

.marker-yellow { background-color: #fdfd77; }
.marker-green { background-color: #62f962; }
.marker-pink { background-color: #fc7899; }
.marker-blue { background-color: #72ccfd; }
.pen-red { color: #e71313; background-color: transparent; }
.pen-green { color: #128a00; background-color: transparent; }
.text-tiny { font-size: 0.7em; }
.text-small { font-size: 0.85em; }
.text-big { font-size: 1.4em; }
.text-huge { font-size: 1.8em; }
img.image-style-side, img.image-style-align-right, .image-style-side img, .image-style-align-right img { float: right; }
img.image-style-align-left, .image-style-align-left img { float: left; }
figure.image { text-align: center; }
.image-style-block-align-left { text-align: left; }
.image-style-block-align-right { text-align: right; }
figure.table > table { margin-left: auto; margin-right: auto; }

.ql-direction-rtl { direction: rtl; text-align: inherit; }
.ql-align-center { text-align: center; }
.ql-align-right { text-align: right; }
.ql-align-justify { text-align: justify; }
.ql-size-small { font-size: 0.75em; }
.ql-size-large { font-size: 1.5em; }
.ql-size-huge { font-size: 2.5em; }
.ql-font-serif { font-family: Georgia, "Times New Roman", serif; }
.ql-font-monospace { font-family: Monaco, "Courier New", monospace; }
.ql-indent-1:not(li) { padding-left: 3em; }
.ql-indent-2:not(li) { padding-left: 6em; }
.ql-indent-3:not(li) { padding-left: 9em; }
.ql-indent-4:not(li) { padding-left: 12em; }
.ql-indent-5:not(li) { padding-left: 15em; }
.ql-indent-6:not(li) { padding-left: 18em; }
.ql-indent-7:not(li) { padding-left: 21em; }
.ql-indent-8:not(li) { padding-left: 24em; }
.ql-ui { display: none; }
br.Apple-interchange-newline { display: none; }
.ql-code-block-container { font-family: monospace; white-space: pre-wrap; }

ul[data-type="taskList"], ul.contains-task-list, ul.todo-list, ul:has(> li[role="checkbox"]), ul[data-checked] {
    list-style-type: none;
}
li[data-type="taskItem"] > label, li[data-type="taskItem"] > div, li[data-type="taskItem"] > div > p:first-child {
    display: inline;
}
`;
	//#endregion
	//#region src/html/dom.ts
	/** Whether a node is an element: `<script>` and `<style>` are elements of their own types */
	var isElement = (node) => node.type === "tag" || node.type === "script" || node.type === "style";
	/** An element's children that are elements */
	var elementsOf = (element) => element.children.filter(isElement);
	/**
	* The text in a node and the elements in it, in order, read without recursion, so no depth of elements is too deep
	*
	* @param skipped - Elements in it whose text is left out
	*/
	var textOf = (node, skipped = /* @__PURE__ */ new Set()) => {
		const stack = [node];
		let text = "";
		while (stack.length > 0) {
			const current = stack.pop();
			if (skipped.has(current)) continue;
			if (current.type === "text") text += current.data;
			else if ("children" in current) for (let index = current.children.length - 1; index >= 0; index--) stack.push(current.children[index]);
		}
		return text;
	};
	/** An element and the elements in it, in order, read without recursion, so no depth of elements is too deep */
	var descendantsOf = (element) => {
		const elements = [];
		const stack = [element];
		while (stack.length > 0) {
			const current = stack.pop();
			elements.push(current);
			const children = elementsOf(current);
			for (let index = children.length - 1; index >= 0; index--) stack.push(children[index]);
		}
		return elements;
	};
	/** Whether an element has a class */
	var hasClass = (element, name) => {
		var _element$attribs$clas;
		return ((_element$attribs$clas = element.attribs.class) !== null && _element$attribs$clas !== void 0 ? _element$attribs$clas : "").split(/\s+/).includes(name);
	};
	/** The id in a link's fragment, such as `fn:1` for `#fn%3A1` */
	var decodeFragment = (fragment) => {
		try {
			return decodeURIComponent(fragment);
		} catch (_unused) {
			return fragment;
		}
	};
	/**
	* A link's address as a URL parser reads it, without the tabs and new lines anywhere in it, and the control characters
	* and spaces around it, with any other control characters percent-encoded, as XML can't have them
	*/
	var hrefOf = (element) => {
		var _element$attribs$href;
		return (_element$attribs$href = element.attribs.href) === null || _element$attribs$href === void 0 ? void 0 : _element$attribs$href.replace(/[\t\n\r]/g, "").replace(/^[\u0000-\u0020]+|[\u0000-\u0020]+$/g, "").replace(/[\u0000-\u001F\u007F]/g, (character) => encodeURIComponent(character));
	};
	//#endregion
	//#region src/html/formats.ts
	/**
	* The formatting of runs, paragraphs and borders, from elements' styles.
	*
	* @module
	*/
	/** Points in twips, twentieths of a point, which Word's lengths are in */
	var twips = (points) => Math.round(points * 20);
	var UNDERLINES = {
		solid: docx.UnderlineType.SINGLE,
		double: docx.UnderlineType.DOUBLE,
		dotted: docx.UnderlineType.DOTTED,
		dashed: docx.UnderlineType.DASH,
		wavy: docx.UnderlineType.WAVE
	};
	var HIGHLIGHTS = {
		FFFF00: docx.HighlightColor.YELLOW,
		"00FF00": docx.HighlightColor.GREEN,
		"00FFFF": docx.HighlightColor.CYAN,
		FF00FF: docx.HighlightColor.MAGENTA,
		"0000FF": docx.HighlightColor.BLUE,
		FF0000: docx.HighlightColor.RED,
		"000080": docx.HighlightColor.DARK_BLUE,
		"008080": docx.HighlightColor.DARK_CYAN,
		"008000": docx.HighlightColor.DARK_GREEN,
		"800080": docx.HighlightColor.DARK_MAGENTA,
		"800000": docx.HighlightColor.DARK_RED,
		"808000": docx.HighlightColor.DARK_YELLOW,
		"808080": docx.HighlightColor.DARK_GRAY,
		C0C0C0: docx.HighlightColor.LIGHT_GRAY,
		"000000": docx.HighlightColor.BLACK,
		FFFFFF: docx.HighlightColor.WHITE
	};
	var BORDERS = {
		solid: docx.BorderStyle.SINGLE,
		double: docx.BorderStyle.DOUBLE,
		dotted: docx.BorderStyle.DOTTED,
		dashed: docx.BorderStyle.DASHED,
		groove: docx.BorderStyle.THREE_D_ENGRAVE,
		ridge: docx.BorderStyle.THREE_D_EMBOSS,
		inset: docx.BorderStyle.INSET,
		outset: docx.BorderStyle.OUTSET
	};
	var underlineOf = ({ style, color }) => _objectSpread2({ type: UNDERLINES[style] }, color ? { color } : {});
	/**
	* The formatting of a run: what the HTML says about its text, and nothing else, so the Word document's styles decide
	* the rest.
	*/
	var runFormatOf = (style, { background, script, characterStyle, removeUnderline }) => {
		const { underline, lineThrough } = style.decorations;
		const highlight = background === void 0 ? void 0 : HIGHLIGHTS[background];
		const format = {
			style: characterStyle,
			bold: style.bold,
			italics: style.italic,
			color: style.color,
			size: style.fontSize === void 0 ? void 0 : Math.max(Math.round(style.fontSize * 2), 2),
			font: style.fontFamily,
			underline: underline ? underlineOf(underline) : removeUnderline ? { type: docx.UnderlineType.NONE } : void 0,
			strike: lineThrough && lineThrough.style !== "double" ? true : void 0,
			doubleStrike: (lineThrough === null || lineThrough === void 0 ? void 0 : lineThrough.style) === "double" ? true : void 0,
			smallCaps: style.smallCaps,
			allCaps: style.textTransform === "uppercase" ? true : void 0,
			superScript: script === "super" ? true : void 0,
			subScript: script === "sub" ? true : void 0,
			position: typeof script === "object" && script.raise !== 0 ? `${Math.round(script.raise * 2) / 2}pt` : void 0,
			characterSpacing: style.letterSpacing ? twips(style.letterSpacing) : void 0,
			rightToLeft: style.direction === "rtl" ? true : void 0,
			language: style.language ? { value: style.language } : void 0,
			highlight,
			shading: background !== void 0 && highlight === void 0 ? {
				type: docx.ShadingType.CLEAR,
				fill: background,
				color: "auto"
			} : void 0
		};
		return Object.fromEntries(Object.entries(format).filter(([, value]) => value !== void 0));
	};
	/** A border side as Word has it: its width in eighths of a point, from 2 to 96, and the space inside it in points */
	var borderOf = ({ style, width, color }, padding = 0) => ({
		style: BORDERS[style],
		size: Math.min(Math.max(Math.round(width * 8), 2), 96),
		color,
		space: Math.min(Math.round(padding), 31)
	});
	var ALIGNMENTS = {
		left: docx.AlignmentType.LEFT,
		right: docx.AlignmentType.RIGHT,
		center: docx.AlignmentType.CENTER,
		justify: docx.AlignmentType.JUSTIFIED,
		start: docx.AlignmentType.START,
		end: docx.AlignmentType.END
	};
	/** A paragraph's line spacing. A multiple is of a browser's normal line height, 1.2 times the font size, as Word's single spacing is about the same */
	var lineSpacingOf = (lineHeight) => {
		if ("points" in lineHeight) return {
			line: twips(lineHeight.points),
			lineRule: docx.LineRuleType.AT_LEAST
		};
		return {
			line: Math.round("lines" in lineHeight ? 240 * lineHeight.lines : 240 * lineHeight.multiple / 1.2),
			lineRule: docx.LineRuleType.AUTO
		};
	};
	/**
	* The formatting of a paragraph of a block: its alignment, its indents from the blocks it is in, its first line's
	* indent, its line spacing, background, borders and direction.
	*
	* @param style - The block's style
	* @param flow - What the paragraph gets from the blocks it is in, the block's own included
	* @param listIndent - The indent of a list's text at the paragraph's depth, in twips
	*/
	var paragraphFormatOf = (style, flow, listIndent) => {
		const left = twips(flow.indentLeft) + listIndent;
		const right = twips(flow.indentRight);
		const textIndent = style.textIndent === void 0 ? 0 : twips(style.textIndent);
		const indent = _objectSpread2(_objectSpread2(_objectSpread2({}, left !== 0 ? { left } : {}), right !== 0 ? { right } : {}), textIndent > 0 ? { firstLine: textIndent } : textIndent < 0 ? { hanging: -textIndent } : {});
		const format = {
			alignment: style.textAlign && ALIGNMENTS[style.textAlign],
			indent: Object.keys(indent).length > 0 ? indent : void 0,
			spacing: style.lineHeight && lineSpacingOf(style.lineHeight),
			shading: flow.background === void 0 ? void 0 : {
				type: docx.ShadingType.CLEAR,
				fill: flow.background,
				color: "auto"
			},
			border: flow.borders,
			bidirectional: style.direction === "rtl" ? true : void 0,
			keepLines: style.breakInside === "avoid" ? true : void 0
		};
		return Object.fromEntries(Object.entries(format).filter(([, value]) => value !== void 0));
	};
	//#endregion
	//#region src/html/images/image-files.ts
	var PNG_SIGNATURE = [
		137,
		80,
		78,
		71,
		13,
		10,
		26,
		10
	];
	var JPEG_SIGNATURE = [
		255,
		216,
		255
	];
	var BMP_SIGNATURE = [66, 77];
	var AVIF_BRANDS = ["avif", "avis"];
	var startsWith = (data, bytes) => bytes.every((byte, index) => data[index] === byte);
	var viewOf = (data) => new DataView(data.buffer, data.byteOffset, data.byteLength);
	var ascii = (data, at, length) => String.fromCharCode(...data.subarray(at, at + length));
	/** A PNG's size is in its first chunk (IHDR) */
	var readPng = (data) => data.length < 24 || ascii(data, 12, 4) !== "IHDR" ? void 0 : {
		width: viewOf(data).getUint32(16),
		height: viewOf(data).getUint32(20)
	};
	var isFrameStart = (marker) => marker >= 192 && marker <= 207 && ![
		196,
		200,
		204
	].includes(marker);
	/** A JPEG's size is in its frame's header (SOFn), after segments of other kinds */
	var readJpeg = (data) => {
		const view = viewOf(data);
		let at = 2;
		while (at + 4 <= data.length) {
			if (data[at] !== 255) return;
			const marker = data[at + 1];
			if (marker === 255) {
				at += 1;
				continue;
			}
			if (isFrameStart(marker)) return at + 9 <= data.length ? {
				width: view.getUint16(at + 7),
				height: view.getUint16(at + 5)
			} : void 0;
			at += 2 + view.getUint16(at + 2);
		}
	};
	/** A GIF's size is in its header, little-endian, after its signature and version */
	var readGif = (data) => data.length < 10 ? void 0 : {
		width: viewOf(data).getUint16(6, true),
		height: viewOf(data).getUint16(8, true)
	};
	/** A BMP's size is in its information header, little-endian, its height negative for one stored top down */
	var readBmp = (data) => data.length < 26 ? void 0 : {
		width: viewOf(data).getUint32(18, true),
		height: Math.abs(viewOf(data).getInt32(22, true))
	};
	/** An AVIF file is an ISO media file whose first box (`ftyp`) names AVIF as its major brand or one it is compatible with */
	var isAvif = (data) => {
		if (ascii(data, 4, 4) !== "ftyp") return false;
		const end = Math.min(viewOf(data).getUint32(0), data.length);
		return [8, ...Array.from({ length: Math.max(0, Math.floor((end - 16) / 4)) }, (_, index) => 16 + index * 4)].some((at) => AVIF_BRANDS.includes(ascii(data, at, 4)));
	};
	var SIGNATURES = [
		[
			"png",
			(data) => startsWith(data, PNG_SIGNATURE),
			readPng
		],
		[
			"jpg",
			(data) => startsWith(data, JPEG_SIGNATURE),
			readJpeg
		],
		[
			"gif",
			(data) => ["GIF87a", "GIF89a"].includes(ascii(data, 0, 6)),
			readGif
		],
		[
			"bmp",
			(data) => startsWith(data, BMP_SIGNATURE),
			readBmp
		],
		["webp", (data) => ascii(data, 0, 4) === "RIFF" && ascii(data, 8, 4) === "WEBP"],
		["avif", isAvif],
		["tiff", (data) => startsWith(data, [
			73,
			73,
			42,
			0
		]) || startsWith(data, [
			77,
			77,
			0,
			42
		])],
		["ico", (data) => startsWith(data, [
			0,
			0,
			1,
			0
		])]
	];
	/** A size of no pixels, or of more than a number can hold, is none Word can show */
	var isSize = (pixels) => pixels > 0 && pixels < Infinity;
	var SVG_TEXT_BYTES = 8192;
	var XML_PROLOG = /^(?:\s+|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE(?:[^>[]|\[[^\]]*\])*>)*/i;
	var SVG_START_TAG = /^<(?:[A-Za-z_][\w.-]*:)?svg(?=[\s/>])((?:[^>"']|"[^"]*"|'[^']*')*)/;
	var ATTRIBUTE = new RegExp("(?<=\\s)([^\\s=\"']+)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", "g");
	var NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;
	var LENGTH = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(px|pt|pc|in|cm|mm|q|em|ex)?$/i;
	var PIXELS_PER_UNIT = {
		px: 1,
		pt: 96 / 72,
		pc: 16,
		in: 96,
		cm: 96 / 2.54,
		mm: 96 / 25.4,
		q: 96 / 101.6,
		em: 16,
		ex: 8
	};
	var DEFAULT_WIDTH = 300;
	var DEFAULT_HEIGHT = 150;
	/** A length's pixels, with no unit for pixels; a percentage, `auto` or a length of no pixels isn't a size */
	var lengthInPixels = (value) => {
		var _value$trim, _length$;
		const length = LENGTH.exec((_value$trim = value === null || value === void 0 ? void 0 : value.trim()) !== null && _value$trim !== void 0 ? _value$trim : "");
		const pixels = length ? Number(length[1]) * PIXELS_PER_UNIT[((_length$ = length[2]) !== null && _length$ !== void 0 ? _length$ : "px").toLowerCase()] : 0;
		return isSize(pixels) ? pixels : void 0;
	};
	/** The width and height of a `viewBox`, its four numbers apart by whitespace or commas, when they are a size */
	var viewBoxSize = (value) => {
		const parts = (value !== null && value !== void 0 ? value : "").trim().split(/[\s,]+/);
		if (parts.length !== 4 || !parts.every((part) => NUMBER.test(part))) return;
		const [, , width, height] = parts.map(Number);
		return isSize(width) && isSize(height) ? {
			width,
			height
		} : void 0;
	};
	/**
	* An SVG's size as a browser sizes an `<img>` of it: its `width` and `height`, the one missing worked out from its
	* `viewBox`'s proportions, the `viewBox`'s own size when both are, and otherwise the browser's default
	*/
	var svgSize = (attributes) => {
		const width = lengthInPixels(attributes.get("width"));
		const height = lengthInPixels(attributes.get("height"));
		const viewBox = viewBoxSize(attributes.get("viewBox"));
		if (width !== void 0 && height !== void 0 || viewBox === void 0) return {
			width: width !== null && width !== void 0 ? width : DEFAULT_WIDTH,
			height: height !== null && height !== void 0 ? height : DEFAULT_HEIGHT
		};
		if (width !== void 0) return {
			width,
			height: width * viewBox.height / viewBox.width
		};
		return height === void 0 ? viewBox : {
			width: height * viewBox.width / viewBox.height,
			height
		};
	};
	/** An SVG file is text whose root element is `svg`, and its size is in the attributes of that element's start tag */
	var readSvg = (data) => {
		const text = new TextDecoder().decode(data.subarray(0, SVG_TEXT_BYTES));
		const startTag = SVG_START_TAG.exec(text.replace(XML_PROLOG, ""));
		if (!startTag) return;
		return _objectSpread2({ format: "svg" }, svgSize(new Map(Array.from(startTag[1].matchAll(ATTRIBUTE), ([, name, double, single]) => [name, double !== null && double !== void 0 ? double : single]))));
	};
	/**
	* Recognises an image file by its bytes (not by any file name or MIME type), and reads its size in pixels:
	* PNG, JPEG, GIF and BMP as src/layout/image-sizes.ts reads them, and SVG from its root element. Undefined for bytes
	* that aren't an image file it recognises.
	*
	* WebP, AVIF, TIFF and ICO files, which Word can't show, are recognised without a size, as is a PNG, JPEG, GIF or BMP
	* file cut too short to give one, or one whose width or height is 0. An SVG's size is worked out as a browser works out
	* the size of an `<img>` of it, from its root element's `width`, `height` and `viewBox`, and may be in fractions of a
	* pixel.
	*
	* @param data - The file's bytes
	* @returns The file's format, and its size in pixels when the file gives it
	*/
	var readImageFile = (data) => {
		const signature = SIGNATURES.find(([, matches]) => matches(data));
		if (signature === void 0) return readSvg(data);
		const [format, , readSize] = signature;
		const size = readSize === null || readSize === void 0 ? void 0 : readSize(data);
		return size !== void 0 && isSize(size.width) && isSize(size.height) ? _objectSpread2({ format }, size) : { format };
	};
	var DATA_URL_SCHEME = /^\s*data:/i;
	var BASE64_PARAMETER = /; *base64$/i;
	var MEDIA_TYPE = /^[\w!#$%&'*+.^`|~-]+\/[\w!#$%&'*+.^`|~-]+$/;
	var PERCENT_ESCAPE = /%([\da-f]{2})/gi;
	var BASE64 = /^[\w+/-]*={0,2}$/;
	/**
	* The bytes of base64, with whitespace in it or not, padded or not, in either alphabet (`+/` or the URL's `-_`), or
	* undefined for text that isn't base64
	*/
	var decodeBase64 = (text) => {
		const base64 = text.replace(/[\t\n\f\r ]+/g, "");
		const digits = base64.replace(/=+$/, "").replace(/[-_]/g, (digit) => digit === "-" ? "+" : "/");
		if (!BASE64.test(base64) || digits.length % 4 === 1) return;
		const binary = atob(digits.padEnd(Math.ceil(digits.length / 4) * 4, "="));
		return new Uint8Array(binary.length).map((_, at) => binary.charCodeAt(at));
	};
	/** The bytes of text, UTF-8, with its percent escapes decoded; a `%` not followed by two hex digits is left as it is */
	var percentDecode = (text) => {
		const encoder = new TextEncoder();
		return new Uint8Array(text.split(/(%[\da-f]{2})/i).flatMap((part, index) => index % 2 === 1 ? [parseInt(part.slice(1), 16)] : [...encoder.encode(part)]));
	};
	/**
	* Reads a `data:` URL, such as `data:image/png;base64,iVBOR…` or `data:image/svg+xml;utf8,<svg …>` (percent-encoded
	* or not): its media type, lower-cased, without parameters ("text/plain" when it has none, as the spec says), and its
	* bytes (UTF-8 for text that isn't base64). Undefined for anything that isn't a data URL or whose base64 is invalid.
	*
	* It reads them as browsers do (the Fetch standard's data URL processor), but for text that isn't base64, which is
	* kept as it is: its tabs and newlines aren't taken out, and a `#` is part of it rather than the start of a fragment,
	* as SVG written into data URLs often has colours such as `#fff` that aren't escaped. A media type that isn't a type
	* and a subtype, such as `image`, is read as "text/plain", as browsers read it.
	*
	* @param url - The data URL
	* @returns Its media type and its bytes
	*/
	var decodeDataUrl = (url) => {
		const comma = url.indexOf(",");
		if (!DATA_URL_SCHEME.test(url) || comma < 0) return;
		const header = url.slice(url.indexOf(":") + 1, comma).trim();
		const base64 = BASE64_PARAMETER.exec(header);
		const essence = header.slice(0, base64 === null || base64 === void 0 ? void 0 : base64.index).split(";")[0].trim();
		const mediaType = MEDIA_TYPE.test(essence) ? essence.toLowerCase() : "text/plain";
		const body = url.slice(comma + 1).trimEnd();
		const data = base64 ? decodeBase64(body.replace(PERCENT_ESCAPE, (_, hex) => String.fromCharCode(parseInt(hex, 16)))) : percentDecode(body);
		return data === void 0 ? void 0 : {
			mediaType,
			data
		};
	};
	/**
	* Image data as bytes: a Uint8Array (or Node Buffer, which is one) as is, an ArrayBuffer viewed as bytes, and a string
	* as a data URL or as base64 (whitespace inside allowed). Undefined for a string that is neither.
	*
	* @param data - The image data
	* @returns Its bytes
	*/
	var toBytes = (data) => {
		var _decodeDataUrl;
		return typeof data === "string" ? DATA_URL_SCHEME.test(data) ? (_decodeDataUrl = decodeDataUrl(data)) === null || _decodeDataUrl === void 0 ? void 0 : _decodeDataUrl.data : decodeBase64(data) : ArrayBuffer.isView(data) ? data : new Uint8Array(data);
	};
	var TRANSPARENT_PIXEL = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=";
	var FLOAT_MARGIN = 114300;
	var EMUS_PER_POINT = 12700;
	var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
	var XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
	/** An address resolved against the base address, or undefined if either isn't one */
	var resolveUrl = (address, base) => {
		try {
			return base === void 0 ? void 0 : new URL(address, base).href;
		} catch (_unused) {
			return;
		}
	};
	/** An image's bytes, and an SVG's picture's, from a data URL or the `images` option */
	var dataOf = (source, options) => {
		var _lookUp;
		if (/^\s*data:/i.test(source)) {
			const decoded = decodeDataUrl(source.trim());
			return decoded && { data: decoded.data };
		}
		const { images } = options;
		const lookUp = (address) => typeof images === "function" ? images(address) : images === null || images === void 0 ? void 0 : images[address];
		const resolved = resolveUrl(source, options.baseUrl);
		const image = (_lookUp = lookUp(source)) !== null && _lookUp !== void 0 ? _lookUp : resolved === void 0 ? void 0 : lookUp(resolved);
		if (image === void 0) return;
		const { data, fallback } = typeof image === "object" && "data" in image ? image : {
			data: image,
			fallback: void 0
		};
		const bytes = toBytes(data);
		const fallbackBytes = fallback === void 0 ? void 0 : toBytes(fallback);
		return bytes && _objectSpread2({ data: bytes }, fallbackBytes ? { fallback: fallbackBytes } : {});
	};
	/** A length in pixels, or a percentage of one, or undefined if it is a percentage of nothing */
	var pixelsOf = (size, percentOf) => {
		if (size === void 0) return;
		return "points" in size ? size.points / .75 : percentOf === void 0 ? void 0 : size.percent * percentOf / 100;
	};
	/**
	* An image's size in pixels, as a browser sizes it: as its CSS or attributes say, with its own aspect ratio for a
	* side they leave out, its own size if they say nothing, within its minimum and maximum sizes, and no wider than the
	* page.
	*/
	var sizeOf = (file, style, maxImageWidth) => {
		var _file$width, _file$height, _pixelsOf, _pixelsOf2;
		const ownWidth = (_file$width = file.width) !== null && _file$width !== void 0 ? _file$width : 300;
		const ownHeight = (_file$height = file.height) !== null && _file$height !== void 0 ? _file$height : 150;
		const cssWidth = pixelsOf(style.width, maxImageWidth);
		const cssHeight = pixelsOf(style.height);
		let width = cssWidth !== null && cssWidth !== void 0 ? cssWidth : cssHeight === void 0 ? ownWidth : cssHeight * ownWidth / ownHeight;
		let height = cssHeight !== null && cssHeight !== void 0 ? cssHeight : cssWidth === void 0 ? ownHeight : cssWidth * ownHeight / ownWidth;
		const scale = (factor) => {
			width *= factor;
			height *= factor;
		};
		const minWidth = pixelsOf(style.minWidth, maxImageWidth);
		const minHeight = pixelsOf(style.minHeight);
		const maxWidth = Math.min((_pixelsOf = pixelsOf(style.maxWidth, maxImageWidth)) !== null && _pixelsOf !== void 0 ? _pixelsOf : Infinity, maxImageWidth);
		const maxHeight = (_pixelsOf2 = pixelsOf(style.maxHeight)) !== null && _pixelsOf2 !== void 0 ? _pixelsOf2 : Infinity;
		if (minWidth !== void 0 && width < minWidth) scale(minWidth / width);
		if (minHeight !== void 0 && height < minHeight) scale(minHeight / height);
		if (height > maxHeight) scale(maxHeight / height);
		if (width > maxWidth) scale(maxWidth / width);
		return {
			width: Math.max(Math.round(width), 1),
			height: Math.max(Math.round(height), 1)
		};
	};
	/** The margins of a floating image in EMUs, from its CSS margins, with an eighth of an inch on the side the text is */
	var floatMarginsOf = (style, float) => {
		const emus = (side, fallback) => {
			const margin = style.margin[side];
			return typeof margin === "number" ? Math.max(Math.round(margin * EMUS_PER_POINT), 0) : fallback;
		};
		return {
			top: emus("top", 0),
			bottom: emus("bottom", 0),
			left: emus("left", float === "right" ? FLOAT_MARGIN : 0),
			right: emus("right", float === "left" ? FLOAT_MARGIN : 0)
		};
	};
	/** Writes an image of bytes it has read, with its size, alt text and float */
	var imageRunOf = (element, style, { data, fallback }, file, options) => {
		var _options$maxImageWidt;
		const { alt, title } = element.attribs;
		const transformation = sizeOf(file, style, (_options$maxImageWidt = options.maxImageWidth) !== null && _options$maxImageWidt !== void 0 ? _options$maxImageWidt : 601);
		const fallbackFile = fallback && readImageFile(fallback);
		const common = _objectSpread2(_objectSpread2(_objectSpread2({ transformation }, alt || title ? { altText: {
			name: alt !== null && alt !== void 0 ? alt : "",
			description: alt !== null && alt !== void 0 ? alt : "",
			title: title !== null && title !== void 0 ? title : ""
		} } : {}), alt === "" ? { decorative: true } : {}), style.float ? { floating: {
			horizontalPosition: {
				relative: docx.HorizontalPositionRelativeFrom.COLUMN,
				align: style.float === "left" ? docx.HorizontalPositionAlign.LEFT : docx.HorizontalPositionAlign.RIGHT
			},
			verticalPosition: {
				relative: docx.VerticalPositionRelativeFrom.PARAGRAPH,
				offset: 0
			},
			wrap: {
				type: docx.TextWrappingType.SQUARE,
				side: docx.TextWrappingSide.BOTH_SIDES
			},
			margins: floatMarginsOf(style, style.float)
		} } : {});
		if (file.format !== "svg") return new docx.ImageRun(_objectSpread2({
			type: file.format,
			data
		}, common));
		return new docx.ImageRun(_objectSpread2({
			type: "svg",
			data,
			fallback: fallbackFile && fallbackFile.format !== "svg" && [
				"png",
				"jpg",
				"gif",
				"bmp"
			].includes(fallbackFile.format) ? {
				type: fallbackFile.format,
				data: fallback
			} : {
				type: "png",
				data: TRANSPARENT_PIXEL
			}
		}, common));
	};
	var SHOWN = /* @__PURE__ */ new Set([
		"png",
		"jpg",
		"gif",
		"bmp",
		"svg"
	]);
	/** An image's name in a warning: its address, or the start of a data URL */
	var nameOf = (source) => source.length > 60 ? `${source.slice(0, 57)}...` : source;
	/**
	* An `<img>` as an image run, or undefined, with a warning, when it has no data or isn't an image Word can show.
	*
	* @param element - The `<img>`
	* @param style - Its style
	* @param context - The conversion's options, and where its warnings go
	*/
	var imageOf = (element, style, { options, warn }) => {
		var _element$attribs$src;
		const source = ((_element$attribs$src = element.attribs.src) !== null && _element$attribs$src !== void 0 ? _element$attribs$src : "").trim();
		const data = source === "" ? void 0 : dataOf(source, options);
		if (data === void 0) {
			warn({
				code: "missing-image",
				message: source === "" ? "An image has no src, so it is left out" : `The image "${nameOf(source)}" isn't a data URL or in the images option, so it is left out`
			});
			return;
		}
		const file = readImageFile(data.data);
		if (file === void 0 || !SHOWN.has(file.format)) {
			warn({
				code: "unsupported-image",
				message: file ? `The image "${nameOf(source)}" is ${file.format.toUpperCase()}, which Word can't show, so it is left out` : `The image "${nameOf(source)}" isn't an image Word can show, so it is left out`
			});
			return;
		}
		return imageRunOf(element, style, data, file, options);
	};
	var XML_ESCAPES = /* @__PURE__ */ new Map([
		["&", "&amp;"],
		["<", "&lt;"],
		[">", "&gt;"],
		["\"", "&quot;"]
	]);
	var escapeXml = (text) => text.replace(/[&<>"]/g, (character) => XML_ESCAPES.get(character));
	/**
	* An `<svg>` in the HTML as an SVG file's XML, with the prefixes of its attributes, such as `xlink:href`, which HTML's
	* parser keeps apart. Its elements are written without recursion, so no depth of them is too deep.
	*/
	var svgFileOf = (svg) => {
		let markup = "";
		const stack = [svg];
		while (stack.length > 0) {
			const node = stack.pop();
			if (typeof node === "string") markup += node;
			else if (node.type === "text") markup += escapeXml(node.data);
			else if (node.type === "tag") {
				const prefixes = node["x-attribsPrefix"];
				const attributes = Object.entries(node.attribs).map(([name, value]) => ` ${prefixes[name] ? `${prefixes[name]}:` : ""}${name}="${escapeXml(value)}"`).join("");
				markup += `<${node.name}${attributes}${node.children.length === 0 ? "/>" : ">"}`;
				if (node.children.length > 0) stack.push(`</${node.name}>`, ...[...node.children].reverse());
			}
		}
		const [start] = /^<svg\b[^>]*/.exec(markup);
		return `<svg${(/\sxmlns=/.test(start) ? "" : ` xmlns="${SVG_NAMESPACE}"`) + (/\bxlink:/.test(markup) && !/\sxmlns:xlink=/.test(start) ? ` xmlns:xlink="${XLINK_NAMESPACE}"` : "")}${markup.slice(4)}`;
	};
	/**
	* An `<svg>` drawn in the HTML as an SVG image, sized by its attributes and CSS, as a browser sizes it.
	*
	* @param element - The `<svg>`
	* @param style - Its style
	* @param options - The conversion's options
	*/
	var svgImageOf = (element, style, options) => {
		const data = new TextEncoder().encode(svgFileOf(element));
		return imageRunOf(element, style, { data }, _objectSpread2(_objectSpread2({}, readImageFile(data)), {}, { format: "svg" }), options);
	};
	var BULLETS = /* @__PURE__ */ new Map([
		["disc", "•"],
		["circle", "◦"],
		["square", "▪"],
		["disclosure-closed", "▸"],
		["disclosure-open", "▾"],
		["none", ""]
	]);
	var NUMBERS = /* @__PURE__ */ new Map([
		["decimal", docx.LevelFormat.DECIMAL],
		["decimal-leading-zero", docx.LevelFormat.DECIMAL_ZERO],
		["lower-roman", docx.LevelFormat.LOWER_ROMAN],
		["upper-roman", docx.LevelFormat.UPPER_ROMAN],
		["lower-alpha", docx.LevelFormat.LOWER_LETTER],
		["lower-latin", docx.LevelFormat.LOWER_LETTER],
		["upper-alpha", docx.LevelFormat.UPPER_LETTER],
		["upper-latin", docx.LevelFormat.UPPER_LETTER],
		["cjk-decimal", docx.LevelFormat.IDEOGRAPH__DIGITAL],
		["cjk-ideographic", docx.LevelFormat.TAIWANESE_COUNTING],
		["trad-chinese-informal", docx.LevelFormat.TAIWANESE_COUNTING],
		["japanese-informal", docx.LevelFormat.JAPANESE_COUNTING],
		["japanese-formal", docx.LevelFormat.JAPANESE_LEGAL],
		["katakana", docx.LevelFormat.AIUEO_FULL_WIDTH],
		["hiragana", docx.LevelFormat.AIUEO_FULL_WIDTH],
		["katakana-iroha", docx.LevelFormat.IROHA_FULL_WIDTH],
		["hiragana-iroha", docx.LevelFormat.IROHA_FULL_WIDTH],
		["korean-hangul-formal", docx.LevelFormat.GANADA],
		["hangul", docx.LevelFormat.GANADA],
		["hangul-consonant", docx.LevelFormat.CHOSUNG],
		["cjk-earthly-branch", docx.LevelFormat.IDEOGRAPH_ZODIAC],
		["cjk-heavenly-stem", docx.LevelFormat.IDEOGRAPH_TRADITIONAL]
	]);
	var NESTED_BULLETS = [
		"•",
		"◦",
		"▪"
	];
	var NESTED_NUMBERS = [
		docx.LevelFormat.DECIMAL,
		docx.LevelFormat.LOWER_LETTER,
		docx.LevelFormat.LOWER_ROMAN
	];
	/**
	* The level of a list with a `list-style-type`, at a depth: a bullet, a string such as `"→ "`, or a number, with a
	* full stop after it. A number format Word doesn't have, such as `lower-greek`, is decimal.
	*
	* @param listStyleType - The list's `list-style-type`, or undefined for a list that has none, which has bullets
	* @param depth - How deep in lists the list is, from 0
	* @param start - The number its first item has
	*/
	var listLevelOf = (listStyleType, depth, start) => {
		var _NUMBERS$get;
		const type = listStyleType !== null && listStyleType !== void 0 ? listStyleType : "disc";
		const quoted = /^(["'])([^]*)\1$/.exec(type);
		if (quoted) return {
			format: docx.LevelFormat.BULLET,
			text: quoted[2],
			start: 1
		};
		const bullet = BULLETS.get(type);
		return bullet !== void 0 ? {
			format: docx.LevelFormat.BULLET,
			text: bullet,
			start: 1
		} : {
			format: (_NUMBERS$get = NUMBERS.get(type)) !== null && _NUMBERS$get !== void 0 ? _NUMBERS$get : docx.LevelFormat.DECIMAL,
			text: `%${depth + 1}.`,
			start: Math.max(start, 0)
		};
	};
	/** The level Word is given for a depth no list of a definition is at, so the definition has every level */
	var defaultLevel = (bullets, depth) => bullets ? {
		format: docx.LevelFormat.BULLET,
		text: NESTED_BULLETS[Math.min(depth, 2)],
		start: 1
	} : {
		format: NESTED_NUMBERS[depth % 3],
		text: `%${depth + 1}.`,
		start: 1
	};
	var sameLevel = (a, b) => a.format === b.format && a.text === b.text && a.start === b.start;
	var definitions = 0;
	/**
	* Gives the items of the lists in blocks their numbering definitions and levels, in order. Blocks in table cells are
	* numbered on their own, as their lists are apart from those around the table.
	*/
	var numberLists = (blocks) => {
		let open = [];
		const assigned = blocks.filter((block) => block.type === "paragraph" && !!block.item).map((block) => {
			const { depth, level, list } = block.item;
			const current = open[depth];
			let definition;
			if (current && current.list === list) ({definition} = current);
			else {
				var _open;
				const parent = (_open = open[depth - 1]) === null || _open === void 0 ? void 0 : _open.definition;
				const levelOfParent = parent === null || parent === void 0 ? void 0 : parent.levels.get(depth);
				definition = parent && !parent.used.has(depth) && (levelOfParent === void 0 || sameLevel(levelOfParent, level)) ? parent : {
					levels: /* @__PURE__ */ new Map(),
					used: /* @__PURE__ */ new Set()
				};
				definition.levels.set(depth, level);
			}
			open = [
				...open.slice(0, depth),
				...Array.from({ length: Math.max(depth - open.length, 0) }, () => void 0),
				{
					list,
					definition
				}
			];
			for (const used of [...definition.used]) if (used > depth) definition.used.delete(used);
			definition.used.add(depth);
			return {
				block,
				definition,
				depth
			};
		});
		const references = new Map([...new Set(assigned.map(({ definition }) => definition))].map((definition) => {
			const [first] = [...definition.levels.values()];
			const bullets = first.format === docx.LevelFormat.BULLET;
			definitions++;
			return [definition, {
				reference: `docx-html-list-${definitions}`,
				levels: Array.from({ length: 9 }, (_, level) => {
					var _definition$levels$ge;
					const { format, text, start } = (_definition$levels$ge = definition.levels.get(level)) !== null && _definition$levels$ge !== void 0 ? _definition$levels$ge : defaultLevel(bullets, level);
					return {
						level,
						format,
						text,
						start,
						alignment: docx.AlignmentType.LEFT,
						style: { paragraph: { indent: {
							left: 720 * (level + 1),
							hanging: 360
						} } }
					};
				})
			}];
		}));
		return new Map(assigned.map(({ block, definition, depth }) => [block, {
			reference: references.get(definition),
			level: depth
		}]));
	};
	//#endregion
	//#region src/html/math.ts
	var LARGE_OPERATORS = /* @__PURE__ */ new Map([
		["∑", "sum"],
		["∏", "product"],
		["∐", "coproduct"],
		["⋃", "union"],
		["⋂", "intersection"],
		["⨆", "squareUnion"],
		["⨄", "multisetUnion"],
		["⋁", "logicalOr"],
		["⋀", "logicalAnd"],
		["⨁", "directSum"],
		["⨂", "tensorProduct"],
		["⨀", "circledDot"],
		["∫", "integral"],
		["∬", "doubleIntegral"],
		["∭", "tripleIntegral"],
		["⨌", "quadrupleIntegral"],
		["∮", "contourIntegral"],
		["∯", "surfaceIntegral"],
		["∰", "volumeIntegral"]
	]);
	var ACCENTS = /* @__PURE__ */ new Map([
		["^", "hat"],
		["ˆ", "hat"],
		["̂", "hat"],
		["ˇ", "check"],
		["̌", "check"],
		["~", "tilde"],
		["˜", "tilde"],
		["̃", "tilde"],
		["´", "acute"],
		["́", "acute"],
		["`", "grave"],
		["̀", "grave"],
		["˙", "dot"],
		["̇", "dot"],
		["¨", "doubleDot"],
		["̈", "doubleDot"],
		["⃛", "tripleDot"],
		["˘", "breve"],
		["̆", "breve"],
		["˚", "ring"],
		["̊", "ring"],
		["→", "rightArrow"],
		["⃗", "rightArrow"],
		["←", "leftArrow"],
		["⃖", "leftArrow"],
		["↔", "leftRightArrow"],
		["⃡", "leftRightArrow"],
		["⇀", "rightHarpoon"],
		["⃑", "rightHarpoon"],
		["↼", "leftHarpoon"],
		["⃐", "leftHarpoon"]
	]);
	var BARS = /* @__PURE__ */ new Set([
		"¯",
		"̅",
		"_",
		"―",
		"‾",
		"̲"
	]);
	var VARIANTS = /* @__PURE__ */ new Map([
		["normal", { style: "plain" }],
		["bold", { style: "bold" }],
		["italic", { style: "italic" }],
		["bold-italic", { style: "boldItalic" }],
		["double-struck", { script: "doubleStruck" }],
		["fraktur", { script: "fraktur" }],
		["bold-fraktur", {
			script: "fraktur",
			style: "bold"
		}],
		["script", { script: "script" }],
		["bold-script", {
			script: "script",
			style: "bold"
		}],
		["sans-serif", { script: "sansSerif" }],
		["bold-sans-serif", {
			script: "sansSerif",
			style: "bold"
		}],
		["monospace", { script: "monospace" }]
	]);
	var OPENING_FENCES = /* @__PURE__ */ new Map([
		["(", ")"],
		["[", "]"],
		["{", "}"],
		["|", "|"],
		["‖", "‖"],
		["⟨", "⟩"],
		["⌈", "⌉"],
		["⌊", "⌋"]
	]);
	/** A token's text as a math run, in its mathvariant: an `<mi>` of more than one letter, such as "sin", is upright */
	var tokenOf = (element) => {
		var _element$attribs$math;
		const text = textOf(element).trim();
		if (text === "") return [];
		const variant = VARIANTS.get((_element$attribs$math = element.attribs.mathvariant) !== null && _element$attribs$math !== void 0 ? _element$attribs$math : "");
		if (element.name === "mtext" || element.name === "ms") return [new docx.MathRun({
			text: element.name === "ms" ? `"${text}"` : text,
			normalText: true
		})];
		return element.name === "mi" && variant === void 0 && [...text].length > 1 ? [new docx.MathRun({
			text,
			style: "plain"
		})] : [new docx.MathRun(_objectSpread2({ text }, variant))];
	};
	/** A row's math: each of its elements', with a bracket at each end, such as `(` and `)`, written as brackets around the rest */
	var rowOf = (elements) => {
		const first = elements[0];
		const last = elements[elements.length - 1];
		const open = (first === null || first === void 0 ? void 0 : first.name) === "mo" ? textOf(first).trim() : void 0;
		const close = (last === null || last === void 0 ? void 0 : last.name) === "mo" && elements.length > 1 ? textOf(last).trim() : void 0;
		return open !== void 0 && close !== void 0 && OPENING_FENCES.get(open) === close ? [new docx_math.MathBrackets({
			open,
			close,
			children: elements.slice(1, -1).flatMap(mathMlOf)
		})] : elements.flatMap(mathMlOf);
	};
	/** The math of an argument of a fraction, a script or another, which is an element that may be a row */
	var argumentOf = (element) => element ? mathMlOf(element) : [];
	/** An `<munder>`, `<mover>` or `<munderover>`: a large operator with limits, an accent or a bar, or a limit */
	var underOverOf = (element, [base, first, second]) => {
		const under = element.name === "mover" ? void 0 : first;
		const over = element.name === "munder" ? void 0 : element.name === "mover" ? first : second;
		const operator = (base === null || base === void 0 ? void 0 : base.name) === "mo" ? LARGE_OPERATORS.get(textOf(base).trim()) : void 0;
		if (operator) return [new docx_math.MathLargeOperator({
			operator,
			children: [],
			subScript: argumentOf(under),
			superScript: argumentOf(over)
		})];
		const overText = over ? textOf(over).trim() : "";
		const underText = under ? textOf(under).trim() : "";
		const accent = ACCENTS.get(overText);
		if (over && !under && accent) return [new docx_math.MathAccent({
			accent,
			children: argumentOf(base)
		})];
		if (over && !under && BARS.has(overText) || under && !over && BARS.has(underText)) return [new docx_math.MathBar({
			position: over ? "above" : "below",
			children: argumentOf(base)
		})];
		const withUnder = under ? [new docx.MathLimitLower({
			children: argumentOf(base),
			limit: argumentOf(under)
		})] : argumentOf(base);
		return over ? [new docx.MathLimitUpper({
			children: withUnder,
			limit: argumentOf(over)
		})] : withUnder;
	};
	/**
	* MathML's presentation markup as docx's math components. Elements it doesn't know have their content read, so their
	* text is kept.
	*/
	var mathMlOf = (element) => {
		const children = elementsOf(element);
		const [first, second, third] = children;
		switch (element.name) {
			case "mi":
			case "mn":
			case "mo":
			case "mtext":
			case "ms": return tokenOf(element);
			case "mspace": return [new docx.MathRun({
				text: " ",
				normalText: true
			})];
			case "semantics": return argumentOf(first);
			case "annotation":
			case "annotation-xml":
			case "mprescripts":
			case "none": return [];
			case "mfrac":
				var _element$attribs$line;
				return [new docx.MathFraction(_objectSpread2({
					numerator: argumentOf(first),
					denominator: argumentOf(second)
				}, /^0(?:\D|$)/.test((_element$attribs$line = element.attribs.linethickness) !== null && _element$attribs$line !== void 0 ? _element$attribs$line : "") ? { type: "noBar" } : {}))];
			case "msqrt": return [new docx.MathRadical({ children: rowOf(children) })];
			case "mroot": return [new docx.MathRadical({
				children: argumentOf(first),
				degree: argumentOf(second)
			})];
			case "msup": return [new docx.MathSuperScript({
				children: argumentOf(first),
				superScript: argumentOf(second)
			})];
			case "msub": return [new docx.MathSubScript({
				children: argumentOf(first),
				subScript: argumentOf(second)
			})];
			case "msubsup": return [new docx.MathSubSuperScript({
				children: argumentOf(first),
				subScript: argumentOf(second),
				superScript: argumentOf(third)
			})];
			case "mmultiscripts": return [new docx.MathSubSuperScript({
				children: argumentOf(first),
				subScript: argumentOf(second),
				superScript: argumentOf(third)
			})];
			case "munder":
			case "mover":
			case "munderover": return underOverOf(element, children);
			case "mfenced": {
				var _element$attribs$open, _element$attribs$clos, _element$attribs$sepa;
				const open = (_element$attribs$open = element.attribs.open) !== null && _element$attribs$open !== void 0 ? _element$attribs$open : "(";
				const close = (_element$attribs$clos = element.attribs.close) !== null && _element$attribs$clos !== void 0 ? _element$attribs$clos : ")";
				const separator = ((_element$attribs$sepa = element.attribs.separators) !== null && _element$attribs$sepa !== void 0 ? _element$attribs$sepa : ",").trim().charAt(0);
				const parts = children.flatMap((child, index) => [...index > 0 && separator ? [new docx.MathRun({ text: separator })] : [], ...mathMlOf(child)]);
				return [new docx_math.MathBrackets({
					open,
					close,
					children: parts
				})];
			}
			case "mtable": return [new docx_math.MathMatrix({ rows: children.filter((row) => row.name === "mtr" || row.name === "mlabeledtr").map((row) => elementsOf(row).slice(row.name === "mlabeledtr" ? 1 : 0).map((cell) => rowOf(elementsOf(cell)))) })];
			case "mphantom": return [new docx_math.MathPhantom({ children: rowOf(children) })];
			default: return rowOf(children);
		}
	};
	/** The LaTeX an element of math keeps, such as KaTeX's annotation, or undefined if it keeps none */
	var latexIn = (math) => {
		const annotation = math.children.length === 0 ? void 0 : findAnnotation(math);
		return annotation && textOf(annotation);
	};
	var findAnnotation = (element) => {
		for (const child of elementsOf(element)) {
			var _child$attribs$encodi;
			if (child.name === "annotation" && /^(?:application\/x-tex|tex|latex|application\/x-latex)$/i.test((_child$attribs$encodi = child.attribs.encoding) !== null && _child$attribs$encodi !== void 0 ? _child$attribs$encodi : "")) return child;
			const found = findAnnotation(child);
			if (found) return found;
		}
	};
	/**
	* A `<math>`'s components: from its LaTeX, if it keeps it, or its MathML. The error of LaTeX that can't be read is
	* thrown, and its MathML is used instead.
	*/
	var mathOf = (math) => {
		const latex = latexIn(math);
		if (latex !== void 0) try {
			return (0, docx_math.latexToMath)(latex);
		} catch (_unused) {}
		return mathMlOf(math);
	};
	/**
	* The LaTeX of an editor's element of math, if it is one: Quill's `.ql-formula` and TipTap's math keep it in an
	* attribute, CKEditor's `.math-tex` and `<script type="math/tex">` in their text.
	*/
	var editorLatexOf = (element) => {
		var _attribs$type;
		const { attribs } = element;
		if (attribs["data-latex"] !== void 0) return attribs["data-latex"];
		if (hasClass(element, "ql-formula") && attribs["data-value"] !== void 0) return attribs["data-value"];
		return hasClass(element, "math-tex") || element.name === "script" && /^math\/tex\b/i.test((_attribs$type = attribs.type) !== null && _attribs$type !== void 0 ? _attribs$type : "") ? textOf(element) : void 0;
	};
	/** Whether an element shows math that the HTML also has as MathML, such as KaTeX's HTML, which is left out */
	var isMathRendering = (element) => hasClass(element, "katex-html");
	//#endregion
	//#region src/html/notes.ts
	/** The notes of HTML that has none */
	var NO_NOTES = {
		references: /* @__PURE__ */ new Map(),
		notes: /* @__PURE__ */ new Map(),
		containers: /* @__PURE__ */ new Set(),
		hidden: /* @__PURE__ */ new Set()
	};
	var BLOCKS = /* @__PURE__ */ new Set([
		"p",
		"div",
		"li",
		"dd",
		"aside",
		"section",
		"article",
		"blockquote",
		"footer",
		"td",
		"th",
		"pre"
	]);
	var INLINE = /* @__PURE__ */ new Set([
		"sup",
		"sub",
		"span",
		"small",
		"b",
		"strong",
		"i",
		"em",
		"u",
		"s",
		"mark",
		"font",
		"a"
	]);
	var HEADINGS$1 = /* @__PURE__ */ new Set([
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6"
	]);
	var words = (value) => (value !== null && value !== void 0 ? value : "").toLowerCase().split(/\s+/);
	var WORD_REFERENCE = /mso-(foot|end)note-id\s*:/i;
	var WORD_NOTE = /mso-element\s*:\s*(foot|end)note\s*(?:;|$)/i;
	/** Whether Word's HTML says an element is a footnote's or an endnote's, as its reference or the note */
	var wordKindOf = (element, style) => {
		var _style$exec, _element$attribs$styl;
		const kind = (_style$exec = style.exec((_element$attribs$styl = element.attribs.style) !== null && _element$attribs$styl !== void 0 ? _element$attribs$styl : "")) === null || _style$exec === void 0 ? void 0 : _style$exec[1].toLowerCase();
		return kind === void 0 ? void 0 : kind === "end" ? "endnote" : "footnote";
	};
	/** Whether a link says it is a note's reference, or the mark it is in does */
	var saysItIsReference = (link) => [link, link.parent].some((element) => words(element.attribs.role).includes("doc-noteref") || words(element.attribs["epub:type"]).includes("noteref") || words(element.attribs.rel).includes("footnote") || element.attribs["data-footnote-ref"] !== void 0 || element.attribs["data-type"] === "footnote-reference" || hasClass(element, "footnote-ref") || hasClass(element, "footnote-reference") || wordKindOf(element, WORD_REFERENCE) !== void 0);
	/** Whether an element says it is a note */
	var saysItIsNote = (element) => words(element.attribs.role).some((role) => role === "doc-footnote" || role === "doc-endnote") || words(element.attribs["epub:type"]).some((type) => type === "footnote" || type === "endnote" || type === "rearnote") || element.attribs["data-type"] === "footnote" || hasClass(element, "footnote-item") || wordKindOf(element, WORD_NOTE) !== void 0;
	/** Whether an element says it is a list or section of notes */
	var saysItHasNotes = (element) => {
		var _element$attribs$styl2;
		return words(element.attribs.role).some((role) => role === "doc-endnotes" || role === "doc-footnotes") || words(element.attribs["epub:type"]).some((type) => type === "footnotes" || type === "endnotes" || type === "rearnotes") || element.attribs["data-footnotes"] !== void 0 || [
			"footnotes",
			"footnote",
			"footnote-list",
			"footnotes-list",
			"references",
			"reflist",
			"mw-references-wrap"
		].some((name) => hasClass(element, name)) || /mso-element\s*:\s*(?:footnote|endnote)-list/i.test((_element$attribs$styl2 = element.attribs.style) !== null && _element$attribs$styl2 !== void 0 ? _element$attribs$styl2 : "");
	};
	/** Whether a link's text is a note's mark, such as `1`, `[12]`, `(a)` or `*` */
	var isMark = (link) => /^[[({]?[^\s[\](){}]{1,6}[\])}]?$/u.test(textOf(link).replace(/\s+/g, ""));
	/** The elements an element is in, nearest first, up to the body */
	var ancestorsOf = (element, body) => {
		const ancestors = [];
		let { parent } = element;
		while ((parent === null || parent === void 0 ? void 0 : parent.type) === "tag" && parent !== body) {
			ancestors.push(parent);
			({parent} = parent);
		}
		return ancestors;
	};
	var isIn = (element, container, body) => element === container || ancestorsOf(element, body).includes(container);
	/**
	* Finds the notes of HTML.
	*
	* @param body - The HTML's body
	* @param kind - What the notes are in Word, other than those of Word's own HTML, which says
	*/
	var notesOf = (body, kind) => {
		const elements = descendantsOf(body);
		const links = elements.filter((element) => {
			var _hrefOf;
			return element.name === "a" && ((_hrefOf = hrefOf(element)) === null || _hrefOf === void 0 ? void 0 : _hrefOf.startsWith("#"));
		});
		if (links.length === 0) return NO_NOTES;
		const order = new Map(elements.map((element, index) => [element, index]));
		const byId = /* @__PURE__ */ new Map();
		const byName = /* @__PURE__ */ new Map();
		for (const element of elements) for (const [map, key] of [[byId, element.attribs.id], [byName, element.name === "a" ? element.attribs.name : void 0]]) if (key !== void 0 && !map.has(key)) map.set(key, element);
		const targetOf = (link) => {
			var _byId$get;
			const id = decodeFragment(hrefOf(link).slice(1));
			return (_byId$get = byId.get(id)) !== null && _byId$get !== void 0 ? _byId$get : byName.get(id);
		};
		const targets = new Set(links.flatMap((link) => {
			var _targetOf;
			return (_targetOf = targetOf(link)) !== null && _targetOf !== void 0 ? _targetOf : [];
		}));
		/**
		* The <div> a note's block is the first of, when it is the note: Google Docs and Word write a note as a <div> of
		* its paragraphs, the first starting with its mark. It is the note when it has no other note, and not the link.
		*/
		const wrapperOf = (block, link) => {
			const parent = block.parent;
			return (block.name === "p" || block.name === "div") && parent !== body && parent.name === "div" && elementsOf(parent)[0] === block && !isIn(link, parent, body) && !descendantsOf(parent).some((element) => targets.has(element) && !isIn(element, block, body)) ? parent : void 0;
		};
		/** The note a link goes to: an element that says it is a note, or the block it is, or is the start of */
		const noteOf = (target, link) => {
			const around = [target, ...ancestorsOf(target, body)];
			const said = around.find(saysItIsNote);
			if (said) return said;
			let note = around.find((element) => BLOCKS.has(element.name));
			let wrapper = note && wrapperOf(note, link);
			while (wrapper) {
				note = wrapper;
				wrapper = wrapperOf(note, link);
			}
			return note;
		};
		/** The ids that a note's links back to a reference go to: the reference's, and those of the mark it is in */
		const idsOf = (link) => {
			const around = [link, ...ancestorsOf(link, body)];
			const block = around.findIndex((element) => !INLINE.has(element.name));
			return new Set(around.slice(0, block === -1 ? around.length : block).flatMap((element) => [element.attribs.id, ...element.name === "a" ? [element.attribs.name] : []]).filter((id) => id !== void 0));
		};
		const candidates = links.flatMap((link) => {
			const target = targetOf(link);
			const note = target && noteOf(target, link);
			if (!note || order.get(note) <= order.get(link) || isIn(note, link, body)) return [];
			const ids = idsOf(link);
			const linksBack = descendantsOf(note).filter((element) => {
				var _hrefOf2;
				return element.name === "a" && ((_hrefOf2 = hrefOf(element)) === null || _hrefOf2 === void 0 ? void 0 : _hrefOf2.startsWith("#")) === true && ids.has(decodeFragment(hrefOf(element).slice(1)));
			});
			return saysItIsReference(link) || isMark(link) && (linksBack.length > 0 || saysItIsNote(note) || ancestorsOf(note, body).some(saysItHasNotes)) ? [{
				link,
				note,
				linksBack
			}] : [];
		});
		const notedElements = new Set(candidates.map(({ note }) => note));
		const references = candidates.filter(({ link }) => !ancestorsOf(link, body).some((element) => notedElements.has(element)));
		if (references.length === 0) return NO_NOTES;
		const notes = /* @__PURE__ */ new Map();
		const linksBackOf = /* @__PURE__ */ new Map();
		for (const { link, note, linksBack } of references) {
			var _linksBackOf$get;
			if (!notes.has(note)) {
				var _ref, _wordKindOf;
				notes.set(note, { kind: (_ref = (_wordKindOf = wordKindOf(link, WORD_REFERENCE)) !== null && _wordKindOf !== void 0 ? _wordKindOf : wordKindOf(note, WORD_NOTE)) !== null && _ref !== void 0 ? _ref : kind });
			}
			linksBackOf.set(note, [...(_linksBackOf$get = linksBackOf.get(note)) !== null && _linksBackOf$get !== void 0 ? _linksBackOf$get : [], ...linksBack]);
		}
		const hidden = /* @__PURE__ */ new Set();
		for (const [note, linksBack] of linksBackOf) {
			const skipped = new Set(linksBack);
			for (const linkBack of linksBack) {
				var _wordless$pop;
				const around = ancestorsOf(linkBack, body);
				const wordless = around.slice(0, around.indexOf(note)).filter((wrapper) => !new RegExp("[\\p{L}\\p{N}]", "u").test(textOf(wrapper, skipped)));
				hidden.add(linkBack).add((_wordless$pop = wordless.pop()) !== null && _wordless$pop !== void 0 ? _wordless$pop : linkBack);
			}
		}
		const containers = /* @__PURE__ */ new Set();
		const isLeftOut = (element) => notes.has(element) || containers.has(element) || hidden.has(element);
		for (const note of notes.keys()) for (const ancestor of ancestorsOf(note, body)) {
			if (!ancestor.children.every((child) => child.type === "text" ? !/\S/.test(child.data) : !isElement(child) || isLeftOut(child) || child.name === "hr" || child.name === "br" || saysItHasNotes(ancestor) && (HEADINGS$1.has(child.name) || child.attribs.role === "heading") || textOf(child).trim() === "" && !descendantsOf(child).some((inner) => [
				"img",
				"svg",
				"math",
				"input",
				"table"
			].includes(inner.name)))) break;
			containers.add(ancestor);
		}
		for (const rule of elements.filter((element) => element.name === "hr" && !containers.has(element.parent))) {
			const after = rule.parent.children.slice(rule.parent.children.indexOf(rule) + 1);
			if (after.every((child) => child.type === "tag" ? isLeftOut(child) || child.name === "br" : child.type !== "text" || !/\S/.test(child.data)) && after.some((child) => child.type === "tag" && isLeftOut(child))) hidden.add(rule);
		}
		return {
			references: new Map(references.map(({ link, note }) => [link, notes.get(note)])),
			notes,
			containers,
			hidden
		};
	};
	//#endregion
	//#region src/html/read-html.ts
	var _excluded = ["indent"];
	var USER_AGENT_STYLE_SHEET = compileUserAgentStyleSheet(USER_AGENT_STYLES);
	var HEADINGS = {
		h1: docx.HeadingLevel.HEADING_1,
		h2: docx.HeadingLevel.HEADING_2,
		h3: docx.HeadingLevel.HEADING_3,
		h4: docx.HeadingLevel.HEADING_4,
		h5: docx.HeadingLevel.HEADING_5,
		h6: docx.HeadingLevel.HEADING_6
	};
	var INLINE_DISPLAYS = /* @__PURE__ */ new Set([
		"inline",
		"inline-block",
		"inline-flex",
		"inline-grid",
		"inline-table",
		"contents",
		"ruby",
		"ruby-base",
		"ruby-text"
	]);
	var PARAGRAPHS = /* @__PURE__ */ new Set([
		"p",
		"h1",
		"h2",
		"h3",
		"h4",
		"h5",
		"h6",
		"dt",
		"dd"
	]);
	var UNSUPPORTED = /* @__PURE__ */ new Set([
		"iframe",
		"video",
		"audio",
		"canvas",
		"object",
		"embed",
		"applet",
		"frame",
		"frameset",
		"portal",
		"fencedframe"
	]);
	var LISTS = /* @__PURE__ */ new Set([
		"ul",
		"ol",
		"menu",
		"dir"
	]);
	var UNSAFE_LINK = /^(?:javascript|vbscript|data|livescript):/i;
	var QUOTES = [["“", "”"], ["‘", "’"]];
	/** A bookmark name that Word allows: letters, digits and underscores, starting with a letter, and at most 40 characters */
	var bookmarkNameOf = (id, taken) => {
		const name = id.replace(new RegExp("[^\\p{L}\\p{N}_]", "gu"), "_");
		const valid = (new RegExp("^\\p{L}", "u").test(name) ? name : `_${name}`).slice(0, 40);
		let unique = valid;
		for (let suffix = 2; taken.has(unique.toLowerCase()); suffix++) unique = `${valid.slice(0, 40 - `_${suffix}`.length)}_${suffix}`;
		return unique;
	};
	/**
	* The ids that links in the document go to, and their bookmark names
	*
	* @param skipped - Links that aren't written as links: notes' references, and their notes' links back to them
	*/
	var bookmarksOf = (body, skipped) => {
		const elements = descendantsOf(body);
		const ids = new Set(elements.flatMap((element) => [element.attribs.id, ...element.name === "a" ? [element.attribs.name] : []]));
		const targets = /* @__PURE__ */ new Map();
		const taken = /* @__PURE__ */ new Set();
		for (const element of elements) {
			const href = element.name === "a" && !skipped.has(element) ? hrefOf(element) : void 0;
			const id = (href === null || href === void 0 ? void 0 : href.startsWith("#")) ? decodeFragment(href.slice(1)) : void 0;
			if (id === void 0 || targets.has(id)) continue;
			const name = id === "" || id.toLowerCase() === "top" && !ids.has(id) ? "_top" : bookmarkNameOf(id, taken);
			targets.set(id, name);
			taken.add(name.toLowerCase());
		}
		return targets;
	};
	var isBlockDisplay = (display) => !INLINE_DISPLAYS.has(display);
	/** Whether inline content has anything to show, rather than only spaces that are collapsed away and bookmarks */
	var hasContent = (content) => content.some((item) => item.type === "atom" || item.type === "break" || item.type === "note" || item.type === "text" && (/[^ \t\n\r\f]/.test(item.text) || item.whiteSpace !== "normal" && item.whiteSpace !== "nowrap" && item.text !== ""));
	/**
	* Groups content into blocks: blocks as they are, and the inline content between them in paragraphs of the format
	* given. Bookmarks in inline content with nothing else go in the next paragraph, or the last if there is none after.
	*/
	var toBlocks = (contents, format) => {
		const blocks = [];
		let inline = [];
		let bookmarks = [];
		const flush = () => {
			if (hasContent(inline)) {
				blocks.push({
					type: "paragraph",
					format,
					content: [...bookmarks, ...inline]
				});
				bookmarks = [];
			} else bookmarks = [...bookmarks, ...inline.filter((item) => item.type === "bookmark")];
			inline = [];
		};
		for (const content of contents) {
			if (!isBlock(content)) {
				inline.push(content);
				continue;
			}
			flush();
			if (content.type === "paragraph" && bookmarks.length > 0) {
				blocks.push(_objectSpread2(_objectSpread2({}, content), {}, { content: [...bookmarks, ...content.content] }));
				bookmarks = [];
			} else blocks.push(content);
		}
		flush();
		if (bookmarks.length > 0) {
			const last = blocks.map((block) => block.type).lastIndexOf("paragraph");
			if (last !== -1) {
				const paragraph = blocks[last];
				blocks[last] = _objectSpread2(_objectSpread2({}, paragraph), {}, { content: [...paragraph.content, ...bookmarks] });
			}
		}
		return blocks;
	};
	/** The indent of a list's text at a depth in lists, in twips, or nothing out of lists */
	var listIndentOf = (flow) => flow.listDepth === void 0 ? 0 : 720 * (flow.listDepth + 1);
	var points = (value) => typeof value === "number" ? value : 0;
	/** A table's or cell's width as Word has it: in twips, or a percentage */
	var widthOf = (size) => "points" in size ? {
		size: twips(size.points),
		type: docx.WidthType.DXA
	} : {
		size: `${Math.round(size.percent * 100) / 100}%`,
		type: docx.WidthType.PERCENTAGE
	};
	var VERTICAL_ALIGNMENTS = {
		top: docx.VerticalAlignTable.TOP,
		middle: docx.VerticalAlignTable.CENTER,
		bottom: docx.VerticalAlignTable.BOTTOM
	};
	var SIDES = [
		"top",
		"right",
		"bottom",
		"left"
	];
	/** Reads the content of an element, or a text, comment or other node */
	var readNodes = (nodes, state, conversion) => nodes.flatMap((node) => readNode(node, state, conversion));
	var readNode = (node, state, conversion) => {
		if (node.type === "text") return state.style.hidden ? [] : [textItem(node.data, state)];
		if (node.type === "comment") return /^\s*pagebreak\s*$/i.test(node.data) ? [{
			type: "block-break",
			kind: "page"
		}] : [];
		return readElement(node, state, conversion);
	};
	var textItem = (text, state) => _objectSpread2(_objectSpread2(_objectSpread2({
		type: "text",
		text,
		format: state.format,
		whiteSpace: state.style.whiteSpace
	}, state.style.textTransform === "lowercase" || state.style.textTransform === "capitalize" ? { transform: state.style.textTransform } : {}), state.inline.link ? { link: state.inline.link } : {}), state.inline.revision ? { revision: state.inline.revision } : {});
	var atom = (child, state) => _objectSpread2({
		type: "atom",
		child
	}, state.inline.link ? { link: state.inline.link } : {});
	/** The state of an element's content: its style, and its inline formatting */
	var stateIn = (style, state, inline, flow = state.flow) => _objectSpread2(_objectSpread2({}, state), {}, {
		style,
		inline,
		flow,
		format: runFormatOf(style, inline),
		depth: state.depth + 1
	});
	var readElement = (element, parentState, conversion) => {
		var _element$attribs$type, _element$attribs$styl, _element$attribs$styl2;
		if (conversion.notes.hidden.has(element)) return [];
		if (parentState.depth >= 512) {
			conversion.warn({
				code: "too-deep",
				message: `Content in more than 512 elements in each other keeps its text, without its formatting`
			});
			return [textItem(textOf(element), parentState)];
		}
		const cascaded = conversion.cascade(element, parentState.style.customProperties);
		const computed = computeStyle(cascaded, parentState.style, element.attribs.lang);
		const style = conversion.options.trackChanges !== void 0 && (element.name === "ins" || element.name === "del") ? _objectSpread2(_objectSpread2({}, computed), {}, { decorations: parentState.style.decorations }) : computed;
		if (element.name === "script" && /^math\/tex\b/i.test((_element$attribs$type = element.attribs.type) !== null && _element$attribs$type !== void 0 ? _element$attribs$type : "")) return mathContent(element, style, parentState, conversion, () => (0, docx_math.latexToMath)(textOf(element)), textOf(element));
		if (style.display === "none" || /mso-list:\s*ignore/i.test((_element$attribs$styl = element.attribs.style) !== null && _element$attribs$styl !== void 0 ? _element$attribs$styl : "") || isMathRendering(element)) return [];
		const { name } = element;
		const state = _objectSpread2(_objectSpread2({}, parentState), {}, { style });
		if (readNote(element, style, parentState, conversion)) return [];
		if (conversion.notes.containers.has(element)) {
			readNodes(element.children, stateIn(style, parentState, {}), conversion);
			return [];
		}
		const note = conversion.notes.references.get(element);
		if (note) {
			const inLink = stateIn(style, parentState, inlineOf(element, style, parentState, conversion, cascaded));
			return [{
				type: "note",
				note,
				fallback: readNodes(element.children, inLink, conversion).filter((item) => !isBlock(item))
			}];
		}
		const latex = editorLatexOf(element);
		if (latex !== void 0) return mathContent(element, style, parentState, conversion, () => (0, docx_math.latexToMath)(latex), latex);
		if (UNSUPPORTED.has(name)) {
			conversion.warn({
				code: "unsupported-element",
				message: `A document can't have an <${name}>, so it is left out`
			});
			return [];
		}
		switch (name) {
			case "br": return style.breakBefore === "page" || style.breakAfter === "page" ? [{
				type: "block-break",
				kind: "page"
			}] : [_objectSpread2({
				type: "break",
				format: parentState.format
			}, parentState.inline.link ? { link: parentState.inline.link } : {})];
			case "wbr": return [textItem("​", parentState)];
			case "img": {
				const image = imageOf(element, style, conversion);
				return image === void 0 ? [] : placed(atom(image, parentState), style, parentState);
			}
			case "svg": return placed(atom(svgImageOf(element, style, conversion.options), parentState), style, parentState);
			case "math": return mathContent(element, style, parentState, conversion, () => mathOf(element), textOf(element));
			case "input": return inputOf(element, parentState);
			case "select": {
				var _options$find;
				const options = elementsOf(element).flatMap((child) => child.name === "optgroup" ? elementsOf(child) : [child]);
				const selected = (_options$find = options.find((option) => option.attribs.selected !== void 0)) !== null && _options$find !== void 0 ? _options$find : options[0];
				return selected ? [textItem(textOf(selected), stateIn(style, parentState, parentState.inline))] : [];
			}
			case "hr": return [{
				type: "paragraph",
				format: horizontalRuleOf(style, parentState),
				content: []
			}];
			case "table": return readTable(element, style, parentState, conversion);
			case "q": {
				const [open, close] = QUOTES[parentState.quotes % 2];
				const insideQuote = _objectSpread2(_objectSpread2({}, stateIn(style, parentState, inlineOf(element, style, parentState, conversion, cascaded))), {}, { quotes: parentState.quotes + 1 });
				return [
					textItem(open, insideQuote),
					...readNodes(element.children, insideQuote, conversion),
					textItem(close, insideQuote)
				];
			}
			case "rt": {
				const insideRuby = stateIn(style, parentState, inlineOf(element, style, parentState, conversion, cascaded));
				const content = readNodes(element.children, insideRuby, conversion);
				return element.parent && "children" in element.parent && element.parent.children.some((child) => isElement(child) && child.name === "rp") ? content : [
					textItem("(", insideRuby),
					...content,
					textItem(")", insideRuby)
				];
			}
		}
		if (LISTS.has(name)) return withBookmark(element, readList(element, style, state, conversion), conversion);
		if (name === "li" || /mso-list:\s*l\d+\s+level\d+/i.test((_element$attribs$styl2 = element.attribs.style) !== null && _element$attribs$styl2 !== void 0 ? _element$attribs$styl2 : "")) return withBookmark(element, readStrayItem(element, style, state, conversion), conversion);
		if (isBlockDisplay(style.display)) return withBookmark(element, readBlock(element, style, parentState, conversion), conversion);
		const inner = stateIn(style, parentState, inlineOf(element, style, parentState, conversion, cascaded));
		return withBookmark(element, readNodes(element.children, inner, conversion), conversion);
	};
	/** Content with a bookmark at its start, when a link in the HTML goes to the element */
	var withBookmark = (element, content, conversion) => {
		var _element$attribs$id;
		const id = (_element$attribs$id = element.attribs.id) !== null && _element$attribs$id !== void 0 ? _element$attribs$id : element.name === "a" ? element.attribs.name : void 0;
		const name = id === void 0 ? void 0 : conversion.bookmarks.get(id);
		if (name === void 0 || name === "_top") return content;
		const bookmark = {
			type: "bookmark",
			name
		};
		const first = content[0];
		return (first === null || first === void 0 ? void 0 : first.type) === "paragraph" ? [_objectSpread2(_objectSpread2({}, first), {}, { content: [bookmark, ...first.content] }), ...content.slice(1)] : [bookmark, ...content];
	};
	/** The inline formatting of an inline element's content: its link, background, script, character style and revision */
	var inlineOf = (element, style, state, conversion, cascaded) => {
		var _ref, _revisionDateOf, _style$backgroundColo, _style$wordStyle, _cascaded$values$get$, _cascaded$values$get;
		const link = element.name === "a" ? linkOf(element, conversion) : void 0;
		const tracked = conversion.options.trackChanges;
		const revision = tracked && (element.name === "ins" || element.name === "del") ? {
			kind: element.name === "ins" ? "insertion" : "deletion",
			author: tracked.author,
			date: (_ref = (_revisionDateOf = revisionDateOf(element.attribs.datetime)) !== null && _revisionDateOf !== void 0 ? _revisionDateOf : revisionDateOf(tracked.date)) !== null && _ref !== void 0 ? _ref : (/* @__PURE__ */ new Date()).toISOString().replace(/\.\d+Z$/, "Z")
		} : state.inline.revision;
		const script = style.verticalAlign === "super" || style.verticalAlign === "sub" || typeof style.verticalAlign === "object" ? style.verticalAlign : state.inline.script;
		return _objectSpread2(_objectSpread2(_objectSpread2({
			background: (_style$backgroundColo = style.backgroundColor) !== null && _style$backgroundColo !== void 0 ? _style$backgroundColo : state.inline.background,
			script,
			characterStyle: (_style$wordStyle = style.wordStyle) !== null && _style$wordStyle !== void 0 ? _style$wordStyle : link ? "Hyperlink" : state.inline.characterStyle
		}, (link !== null && link !== void 0 ? link : state.inline.link) ? { link: link !== null && link !== void 0 ? link : state.inline.link } : {}), revision ? { revision } : {}), link && /\bnone\b/i.test((_cascaded$values$get$ = (_cascaded$values$get = cascaded.values.get("text-decoration-line")) === null || _cascaded$values$get === void 0 ? void 0 : _cascaded$values$get[0]) !== null && _cascaded$values$get$ !== void 0 ? _cascaded$values$get$ : "") ? { removeUnderline: true } : {});
	};
	var DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(Z|[+-]\d{2}:?\d{2})?)?$/i;
	/**
	* A tracked change's date and time as Word writes them, such as `2026-10-13T09:30:00Z`, from a date, or a date and
	* time, in UTC when it has an offset, and as it is when it hasn't, as Word writes its own. Undefined for any other
	* text, or a date there isn't, such as the 30th of February, as Word can't open a document with it.
	*/
	var revisionDateOf = (text) => {
		var _text$trim, _parts$7$toUpperCase, _parts$;
		const parts = DATE_TIME.exec((_text$trim = text === null || text === void 0 ? void 0 : text.trim()) !== null && _text$trim !== void 0 ? _text$trim : "");
		if (!parts) return;
		const [year, month, day, hour, minute, second] = parts.slice(1, 7).map((part) => Number(part !== null && part !== void 0 ? part : 0));
		const zone = (_parts$7$toUpperCase = (_parts$ = parts[7]) === null || _parts$ === void 0 ? void 0 : _parts$.toUpperCase()) !== null && _parts$7$toUpperCase !== void 0 ? _parts$7$toUpperCase : "Z";
		const offset = zone === "Z" ? 0 : (zone.startsWith("-") ? -1 : 1) * (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(-2)));
		const time = Date.UTC(year, month - 1, day, hour, minute, second);
		const date = new Date(time);
		return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && hour < 24 && minute < 60 && second < 60 ? (/* @__PURE__ */ new Date(time - offset * 6e4)).toISOString().replace(/\.\d+Z$/, "Z") : void 0;
	};
	/**
	* Where a link goes, or undefined, with a warning, for an address that could run code, as it is written or resolved,
	* after the tabs and new lines a URL parser leaves out, as in `java&#9;script:`
	*/
	var linkOf = (element, conversion) => {
		var _resolveUrl;
		const href = hrefOf(element);
		if (href === void 0 || href === "") return;
		if (href.startsWith("#")) {
			const anchor = conversion.bookmarks.get(decodeFragment(href.slice(1)));
			return anchor === void 0 ? void 0 : { anchor };
		}
		const resolved = (_resolveUrl = resolveUrl(href, conversion.options.baseUrl)) !== null && _resolveUrl !== void 0 ? _resolveUrl : href;
		if (UNSAFE_LINK.test(href) || UNSAFE_LINK.test(resolved)) {
			conversion.warn({
				code: "unsafe-link",
				message: `The link to "${href.slice(0, 60)}" could run code, so its text is kept without it`
			});
			return;
		}
		return { href: resolved };
	};
	/**
	* Reads a note, when an element is one, into the paragraphs its references' footnotes or endnotes have, in the style
	* of Word's notes. They aren't indented, or in the lists and links the note is in, and start with a space after the
	* note's number, as Word's do, without the spaces around the HTML's mark and its link back.
	*
	* @returns Whether the element is a note, which is left out where it is
	*/
	var readNote = (element, style, state, conversion) => {
		const note = conversion.notes.notes.get(element);
		if (note === void 0) return false;
		const textStyle = note.kind === "endnote" ? "EndnoteText" : "FootnoteText";
		const paragraphs = paragraphsOfNote(readBlock(element, style, _objectSpread2(_objectSpread2({}, state), {}, {
			inline: {},
			flow: {
				indentLeft: 0,
				indentRight: 0
			}
		}), conversion, { box: false }), conversion).map((paragraph) => paragraph.format.style || paragraph.format.heading ? paragraph : _objectSpread2(_objectSpread2({}, paragraph), {}, { format: _objectSpread2(_objectSpread2({}, paragraph.format), {}, { style: textStyle }) }));
		const written = paragraphs.length > 0 ? paragraphs : [{
			type: "paragraph",
			format: { style: textStyle },
			content: []
		}];
		const bookmark = withBookmark(element, [], conversion);
		const space = {
			type: "text",
			text: " ",
			format: {},
			whiteSpace: "pre"
		};
		note.content = written.map((paragraph, index) => {
			const started = index === 0 ? trimmed(paragraph.content, "start") : paragraph.content;
			const content = index === written.length - 1 ? trimmed(started, "end") : started;
			return _objectSpread2(_objectSpread2({}, paragraph), {}, { content: index === 0 ? [
				space,
				...bookmark,
				...content
			] : content });
		});
		return true;
	};
	/** A note's paragraphs: those of its tables' cells, with a warning, and none of its breaks, as notes have neither */
	var paragraphsOfNote = (blocks, conversion) => blocks.flatMap((block) => {
		if (block.type === "paragraph") return [block];
		if (block.type === "block-break") return [];
		conversion.warn({
			code: "table-in-note",
			message: "A footnote or endnote here has only paragraphs, so the paragraphs of a note's table are kept without it"
		});
		return block.rows.flatMap((row) => row.cells.flatMap((cell) => paragraphsOfNote(cell.content, conversion)));
	});
	/** Content without the spaces at its start or end, which leaves out text that is only spaces, and keeps bookmarks */
	var trimmed = (content, edge) => {
		const items = edge === "start" ? content : [...content].reverse();
		const index = items.findIndex((other) => other.type !== "bookmark" && (other.type !== "text" || /\S/.test(other.text)));
		if (index === -1) return items.filter((other) => other.type === "bookmark");
		const item = items[index];
		const kept = [
			...items.slice(0, index).filter((other) => other.type === "bookmark"),
			item.type === "text" ? _objectSpread2(_objectSpread2({}, item), {}, { text: edge === "start" ? item.text.replace(/^\s+/, "") : item.text.replace(/\s+$/, "") }) : item,
			...items.slice(index + 1)
		];
		return edge === "start" ? kept : [...kept].reverse();
	};
	/** An image, or other content of its own, inline, or in a paragraph of its own when it is a block */
	var placed = (content, style, state) => {
		if (!isBlockDisplay(style.display) || style.float) return [content];
		const { left, right } = style.margin;
		const alignment = left === "auto" && right === "auto" ? docx.AlignmentType.CENTER : left === "auto" ? docx.AlignmentType.RIGHT : void 0;
		const format = paragraphFormatOf(state.style, state.flow, listIndentOf(state.flow));
		return [{
			type: "paragraph",
			format: alignment ? _objectSpread2(_objectSpread2({}, format), {}, { alignment }) : format,
			content: [content]
		}];
	};
	/** Math, as a Word equation, or its text, with a warning, if it can't be read */
	var mathContent = (element, style, state, conversion, read, text) => {
		try {
			const equation = atom(new docx.Math({ children: read() }), state);
			return element.attribs.display === "block" ? placed(equation, _objectSpread2(_objectSpread2({}, style), {}, { display: "block" }), state) : placed(equation, style, state);
		} catch (error) {
			conversion.warn({
				code: "invalid-math",
				message: `The math "${text.trim().slice(0, 60)}" can't be read, so its text is kept: ${error.message}`
			});
			return [textItem(text, state)];
		}
	};
	/** A checkbox or radio button as a checkbox, and other inputs as their values */
	var inputOf = (element, state) => {
		var _element$attribs$type2, _element$attribs$valu;
		const type = ((_element$attribs$type2 = element.attribs.type) !== null && _element$attribs$type2 !== void 0 ? _element$attribs$type2 : "text").toLowerCase();
		const checked = element.attribs.checked !== void 0;
		if (type === "checkbox") return [atom(new docx.CheckBox({ checked }), state), textItem(" ", state)];
		if (type === "radio") return [atom(new docx.CheckBox({
			checked,
			checkedState: {
				value: "25C9",
				font: "Segoe UI Symbol"
			},
			uncheckedState: {
				value: "25CB",
				font: "Segoe UI Symbol"
			}
		}), state), textItem(" ", state)];
		const value = (_element$attribs$valu = element.attribs.value) !== null && _element$attribs$valu !== void 0 ? _element$attribs$valu : "";
		return type === "hidden" || value === "" ? [] : [textItem(value, state)];
	};
	/** A horizontal rule: a paragraph with a line under it, of its CSS colour and thickness, or Word's own */
	var horizontalRuleOf = (style, state) => {
		var _style$border$top, _side$color, _side$width, _side$style;
		const format = paragraphFormatOf(state.style, state.flow, listIndentOf(state.flow));
		const side = (_style$border$top = style.border.top) !== null && _style$border$top !== void 0 ? _style$border$top : style.border.bottom;
		const color = (_side$color = side === null || side === void 0 ? void 0 : side.color) !== null && _side$color !== void 0 ? _side$color : style.backgroundColor;
		if (!side && !style.backgroundColor) return _objectSpread2(_objectSpread2({}, format), {}, { thematicBreak: true });
		const width = (_side$width = side === null || side === void 0 ? void 0 : side.width) !== null && _side$width !== void 0 ? _side$width : style.height && "points" in style.height ? style.height.points : .75;
		return _objectSpread2(_objectSpread2({}, format), {}, { border: { bottom: borderOf({
			style: (_side$style = side === null || side === void 0 ? void 0 : side.style) !== null && _side$style !== void 0 ? _side$style : "solid",
			width,
			color
		}) } });
	};
	/** The borders of a block, as Word's paragraph borders, with the block's padding as the space inside them */
	var paragraphBordersOf = (style) => {
		const sides = SIDES.filter((side) => style.border[side]);
		return sides.length === 0 ? void 0 : Object.fromEntries(sides.map((side) => [side, borderOf(style.border[side], style.padding[side])]));
	};
	/**
	* Reads a block: its content, in paragraphs of its format, with the indents of its margins and padding, its
	* background and its borders, its margins above and below it, and its page breaks.
	*
	* @param box - Whether the block's own margins, padding, background and borders are its paragraphs', which a table
	* cell's aren't, as the cell has them
	* @param readChildren - Reads the block's content, which a list reads as its items
	*/
	var readBlock = (element, style, state, conversion, { box = true, readChildren = readNodes, padding = true } = {}) => {
		var _style$backgroundColo2, _HEADINGS$element$nam, _element$attribs$aria;
		const borders = box ? paragraphBordersOf(style) : void 0;
		const inset = (side) => box ? points(style.margin[side]) + (padding && !style.border[side] ? style.padding[side] : 0) : 0;
		const flow = _objectSpread2(_objectSpread2({}, state.flow), {}, {
			indentLeft: state.flow.indentLeft + inset("left"),
			indentRight: state.flow.indentRight + inset("right"),
			background: box ? (_style$backgroundColo2 = style.backgroundColor) !== null && _style$backgroundColo2 !== void 0 ? _style$backgroundColo2 : state.flow.background : state.flow.background,
			borders: borders !== null && borders !== void 0 ? borders : state.flow.borders
		});
		const { link, revision, characterStyle } = state.inline;
		const inner = stateIn(style, state, _objectSpread2({
			link,
			revision
		}, link ? { characterStyle } : {}), flow);
		const contents = readChildren(element.children, inner, conversion);
		const heading = (_HEADINGS$element$nam = HEADINGS[element.name]) !== null && _HEADINGS$element$nam !== void 0 ? _HEADINGS$element$nam : element.attribs.role === "heading" ? HEADINGS[`h${(_element$attribs$aria = element.attribs["aria-level"]) !== null && _element$attribs$aria !== void 0 ? _element$attribs$aria : "2"}`] : void 0;
		const format = _objectSpread2(_objectSpread2({}, paragraphFormatOf(style, flow, listIndentOf(flow))), style.wordStyle ? { style: style.wordStyle } : heading ? { heading } : {});
		let blocks = toBlocks(contents, format);
		if (blocks.length === 0 && PARAGRAPHS.has(element.name)) blocks = [{
			type: "paragraph",
			format,
			content: []
		}];
		if (box) {
			const before = twips(Math.max(points(style.margin.top) + (style.border.top ? 0 : style.padding.top), 0));
			const after = twips(Math.max(points(style.margin.bottom) + (style.border.bottom ? 0 : style.padding.bottom), 0));
			blocks = spacedAt(blocks, "before", before);
			blocks = spacedAt(blocks, "after", after);
		}
		if (style.breakInside === "avoid") blocks = blocks.map((block, index) => block.type === "paragraph" ? _objectSpread2(_objectSpread2({}, block), {}, { format: _objectSpread2(_objectSpread2({}, block.format), {}, { keepLines: true }, index < blocks.length - 1 ? { keepNext: true } : {}) }) : block);
		return [
			...style.breakBefore ? [{
				type: "block-break",
				kind: style.breakBefore
			}] : [],
			...blocks,
			...style.breakAfter ? [{
				type: "block-break",
				kind: style.breakAfter
			}] : []
		];
	};
	/** Blocks with space added before the first paragraph, or after the last, when it is one */
	var spacedAt = (blocks, edge, space) => {
		var _block$format$spacing, _block$format$spacing2;
		const index = edge === "before" ? blocks.findIndex((candidate) => candidate.type !== "block-break") : blocks.map((candidate) => candidate.type !== "block-break").lastIndexOf(true);
		const block = blocks[index];
		if (space === 0 || (block === null || block === void 0 ? void 0 : block.type) !== "paragraph") return blocks;
		const spacing = _objectSpread2(_objectSpread2({}, block.format.spacing), {}, { [edge]: ((_block$format$spacing = (_block$format$spacing2 = block.format.spacing) === null || _block$format$spacing2 === void 0 ? void 0 : _block$format$spacing2[edge]) !== null && _block$format$spacing !== void 0 ? _block$format$spacing : 0) + space });
		return [
			...blocks.slice(0, index),
			_objectSpread2(_objectSpread2({}, block), {}, { format: _objectSpread2(_objectSpread2({}, block.format), {}, { spacing }) }),
			...blocks.slice(index + 1)
		];
	};
	/** An item's checkbox, for the lists of to-dos that Quill and Lexical write without an `<input>` */
	var checkboxOf = (item) => {
		var _list$attribs;
		const quill = item.attribs["data-list"];
		if (quill === "checked" || quill === "unchecked") return quill === "checked";
		if (item.attribs.role === "checkbox") return item.attribs["aria-checked"] === "true";
		const list = item.parent;
		const checked = list === null || list === void 0 || (_list$attribs = list.attribs) === null || _list$attribs === void 0 ? void 0 : _list$attribs["data-checked"];
		return checked === void 0 || (list === null || list === void 0 ? void 0 : list.attribs["data-type"]) === "taskList" ? void 0 : checked === "true";
	};
	/** Whether an item of a list has nothing but lists in it */
	var isListWrapper = (item) => elementsOf(item).length > 0 && item.children.every((child) => isElement(child) ? LISTS.has(child.name) : child.type !== "text" || !/\S/.test(child.data));
	var QUILL_NUMBERS = [
		"decimal",
		"lower-alpha",
		"lower-roman"
	];
	/** The depth of an item of a list that Quill writes flat, with its classes for how far in it is */
	var quillIndentOf = (item) => {
		var _exec$, _exec, _item$attribs$class;
		return Number((_exec$ = (_exec = /(?:^|\s)ql-indent-(\d+)(?:\s|$)/.exec((_item$attribs$class = item.attribs.class) !== null && _item$attribs$class !== void 0 ? _item$attribs$class : "")) === null || _exec === void 0 ? void 0 : _exec[1]) !== null && _exec$ !== void 0 ? _exec$ : 0);
	};
	/**
	* Reads a list: its items, each a list item of its own paragraphs, at the list's depth, numbered from its start,
	* or the other way for a reversed list. Quill's lists, which are flat, have their items' depths from their classes,
	* and each item's kind from its `data-list`.
	*/
	var readList = (element, style, state, conversion) => {
		var _element$attribs$star;
		const depth = Math.min(state.flow.listDepth === void 0 ? 0 : state.flow.listDepth + 1, 8);
		const items = elementsOf(element).filter((child) => child.name === "li");
		const ordered = element.name === "ol";
		const reversed = ordered && element.attribs.reversed !== void 0;
		const startAttribute = Number.parseInt((_element$attribs$star = element.attribs.start) !== null && _element$attribs$star !== void 0 ? _element$attribs$star : "", 10);
		let itemNumber = ordered && !Number.isNaN(startAttribute) ? startAttribute : reversed ? items.length : 1;
		let lists = /* @__PURE__ */ new Map();
		const readChildren = (children, inner) => children.flatMap((child) => {
			var _child$attribs$value;
			if (!isElement(child) || child.name !== "li") return readNode(child, _objectSpread2(_objectSpread2({}, inner), {}, { flow: _objectSpread2(_objectSpread2({}, inner.flow), {}, { listDepth: depth }) }), conversion);
			const itemStyle = computeStyle(conversion.cascade(child, inner.style.customProperties), inner.style, child.attribs.lang);
			if (itemStyle.display === "none" || readNote(child, itemStyle, inner, conversion)) return [];
			if (isListWrapper(child)) return readBlock(child, itemStyle, _objectSpread2(_objectSpread2({}, inner), {}, { flow: _objectSpread2(_objectSpread2({}, inner.flow), {}, { listDepth: depth }) }), conversion);
			const value = Number.parseInt((_child$attribs$value = child.attribs.value) !== null && _child$attribs$value !== void 0 ? _child$attribs$value : "", 10);
			const restart = ordered && !Number.isNaN(value) && value !== itemNumber;
			itemNumber = restart ? value : itemNumber;
			const quill = child.attribs["data-list"];
			const itemDepth = Math.min(depth + quillIndentOf(child), 8);
			const checkbox = checkboxOf(child);
			const level = listLevelOf(checkbox !== void 0 ? "none" : quill === "bullet" ? "disc" : quill === "ordered" ? QUILL_NUMBERS[itemDepth % QUILL_NUMBERS.length] : itemStyle.listStyleType, itemDepth, itemDepth === depth ? itemNumber : 1);
			const kind = `${level.format} ${level.text}`;
			const current = lists.get(itemDepth);
			const list = current && current.kind === kind && !restart && !reversed ? current.list : {};
			lists = new Map([...lists].filter(([listDepth]) => listDepth < itemDepth));
			lists.set(itemDepth, {
				kind,
				list
			});
			itemNumber += itemDepth !== depth ? 0 : reversed ? -1 : 1;
			return withBookmark(child, readItem(child, itemStyle, _objectSpread2(_objectSpread2({}, inner), {}, { flow: _objectSpread2(_objectSpread2({}, inner.flow), {}, { listDepth: itemDepth }) }), conversion, {
				depth: itemDepth,
				level,
				list
			}, checkbox), conversion);
		});
		return readBlock(element, style, _objectSpread2(_objectSpread2({}, state), {}, { flow: _objectSpread2(_objectSpread2({}, state.flow), {}, { listDepth: depth }) }), conversion, {
			readChildren,
			padding: false
		});
	};
	/** Reads a list item: its paragraphs, the first of which starts it, and its checkbox, if it has one */
	var readItem = (element, style, state, conversion, item, checkbox) => {
		const readChildren = (children, inner) => [...checkbox === void 0 ? [] : [atom(new docx.CheckBox({ checked: checkbox }), inner), textItem(" ", inner)], ...readNodes(children, inner, conversion)];
		const blocks = readBlock(element, style, state, conversion, { readChildren });
		const firstIndex = blocks.findIndex((block) => block.type !== "block-break");
		const first = blocks[firstIndex];
		const indentLeft = twips(state.flow.indentLeft);
		const marked = (paragraph) => {
			const _paragraph$format = paragraph.format, { indent } = _paragraph$format, format = _objectWithoutProperties(_paragraph$format, _excluded);
			return _objectSpread2(_objectSpread2({}, paragraph), {}, {
				format: indentLeft === 0 && !(indent === null || indent === void 0 ? void 0 : indent.right) ? format : _objectSpread2(_objectSpread2({}, format), {}, { indent: _objectSpread2({
					left: indentLeft + 720 * (item.depth + 1),
					hanging: 360
				}, (indent === null || indent === void 0 ? void 0 : indent.right) ? { right: indent.right } : {}) }),
				item
			});
		};
		return (first === null || first === void 0 ? void 0 : first.type) === "paragraph" ? [
			...blocks.slice(0, firstIndex),
			marked(first),
			...blocks.slice(firstIndex + 1)
		] : [marked({
			type: "paragraph",
			format: paragraphFormatOf(style, state.flow, 0),
			content: []
		}), ...blocks];
	};
	/** Reads an item that isn't in a list, such as an `<li>` on its own, or a paragraph that Word's HTML puts in a list */
	var readStrayItem = (element, style, state, conversion) => {
		var _element$attribs$styl3, _elementsOf$find, _conversion$wordLists;
		const word = /mso-list:\s*(l\d+)\s+level(\d+)/i.exec((_element$attribs$styl3 = element.attribs.style) !== null && _element$attribs$styl3 !== void 0 ? _element$attribs$styl3 : "");
		const depth = word ? Math.min(Number(word[2]) - 1, 8) : Math.min(state.flow.listDepth === void 0 ? 0 : state.flow.listDepth + 1, 8);
		const marker = word ? textOf((_elementsOf$find = elementsOf(element).find((child) => {
			var _child$attribs$style;
			return /mso-list:\s*ignore/i.test((_child$attribs$style = child.attribs.style) !== null && _child$attribs$style !== void 0 ? _child$attribs$style : "");
		})) !== null && _elementsOf$find !== void 0 ? _elementsOf$find : element).trim().split(/\s/)[0] : "";
		const level = word ? wordListLevelOf(marker, depth) : listLevelOf(style.listStyleType, depth, 1);
		const key = word ? `${word[1]} ${depth}` : void 0;
		const list = key === void 0 ? {} : (_conversion$wordLists = conversion.wordLists.get(key)) !== null && _conversion$wordLists !== void 0 ? _conversion$wordLists : {};
		if (key !== void 0) conversion.wordLists.set(key, list);
		return readItem(element, style, _objectSpread2(_objectSpread2({}, state), {}, { flow: _objectSpread2(_objectSpread2({}, state.flow), {}, { listDepth: depth }) }), conversion, {
			depth,
			level,
			list
		}, checkboxOf(element));
	};
	var ROMAN = /^[ivxlcdm]+[.)]?$/i;
	/** The level of a list in Word's HTML, from the number or bullet of its item, such as `3.` or `iv)` or `•` */
	var wordListLevelOf = (marker, depth) => {
		const numeral = /^(\d+)[.)]?$/.exec(marker);
		if (numeral) return listLevelOf("decimal", depth, Number(numeral[1]));
		if (ROMAN.test(marker) && (marker.replace(/[.)]$/, "").length > 1 || /^i/i.test(marker))) return listLevelOf(marker === marker.toLowerCase() ? "lower-roman" : "upper-roman", depth, romanValue(marker.replace(/[.)]$/, "")));
		const letter = /^([a-z])[.)]?$/i.exec(marker);
		if (letter) return listLevelOf(letter[1] === letter[1].toLowerCase() ? "lower-alpha" : "upper-alpha", depth, letter[1].toLowerCase().charCodeAt(0) - 96);
		return listLevelOf("disc", depth, 1);
	};
	var romanValue = (roman) => {
		const values = {
			i: 1,
			v: 5,
			x: 10,
			l: 50,
			c: 100,
			d: 500,
			m: 1e3
		};
		const digits = [...roman.toLowerCase()].map((digit) => values[digit]);
		return digits.reduce((total, value, index) => {
			var _digits;
			return total + (value < ((_digits = digits[index + 1]) !== null && _digits !== void 0 ? _digits : 0) ? -value : value);
		}, 0);
	};
	/** Whether a table or its cells say what their borders are, in their CSS or attributes */
	var hasBorders = (cascaded) => SIDES.some((side) => cascaded.values.has(`border-${side}-style`));
	/**
	* Reads a table, with the cells of its rows placed as HTML places them: each in the first column of its row that a
	* cell above doesn't span, spanning the columns and rows it says, within its rows' group. Rows with fewer cells are
	* given empty ones, so each row has as many columns as the table. Its caption is a paragraph before it.
	*/
	var readTable = (element, style, state, conversion) => {
		const inner = stateIn(style, state, {}, {
			indentLeft: 0,
			indentRight: 0
		});
		const children = elementsOf(element);
		const styleOf = (child, parent) => {
			return stateIn(computeStyle(conversion.cascade(child, parent.style.customProperties), parent.style, child.attribs.lang), parent, {});
		};
		const caption = children.find((child) => child.name === "caption");
		const captionBlocks = caption ? readBlock(caption, styleOf(caption, inner).style, inner, conversion).map((block) => block.type === "paragraph" ? _objectSpread2(_objectSpread2({}, block), {}, { format: _objectSpread2(_objectSpread2({}, block.format), {}, { keepNext: true }) }) : block) : [];
		const groups = children.filter((child) => [
			"thead",
			"tbody",
			"tfoot"
		].includes(child.name));
		const head = groups.find((group) => group.name === "thead");
		const foot = groups.find((group) => group.name === "tfoot");
		const ordered = [
			...head ? [head] : [],
			...groups.filter((group) => group !== head && group !== foot),
			...foot ? [foot] : []
		];
		let borders = hasBorders(conversion.cascade(element, style.customProperties));
		const placedCells = [];
		const rowStates = [];
		const taken = /* @__PURE__ */ new Set();
		let width = 0;
		for (const group of ordered) {
			const groupState = styleOf(group, inner);
			if (groupState.style.display === "none") continue;
			const groupRows = elementsOf(group).filter((child) => child.name === "tr").map((row) => ({
				row,
				state: styleOf(row, groupState)
			})).filter((row) => row.state.style.display !== "none");
			const firstRow = rowStates.length;
			for (const [rowIndex, { row, state: rowState }] of groupRows.entries()) {
				const rowNumber = firstRow + rowIndex;
				let column = 0;
				const cells = elementsOf(row).filter((cell) => cell.name === "td" || cell.name === "th");
				for (const cell of cells) {
					var _cell$attribs$colspan, _cell$attribs$rowspan;
					const cellState = styleOf(cell, rowState);
					if (cellState.style.display === "none") continue;
					borders = borders || hasBorders(conversion.cascade(cell, rowState.style.customProperties));
					while (taken.has(`${rowNumber} ${column}`)) column++;
					const columns = Math.min(Math.max(Number.parseInt((_cell$attribs$colspan = cell.attribs.colspan) !== null && _cell$attribs$colspan !== void 0 ? _cell$attribs$colspan : "1", 10) || 1, 1), 1e3);
					const rowSpan = Number.parseInt((_cell$attribs$rowspan = cell.attribs.rowspan) !== null && _cell$attribs$rowspan !== void 0 ? _cell$attribs$rowspan : "1", 10);
					const rowsLeft = groupRows.length - rowIndex;
					const spannedRows = Number.isNaN(rowSpan) || rowSpan < 0 ? 1 : rowSpan === 0 ? rowsLeft : Math.min(rowSpan, rowsLeft, 65534);
					for (let spannedRow = 0; spannedRow < spannedRows; spannedRow++) for (let spannedColumn = 0; spannedColumn < columns; spannedColumn++) taken.add(`${rowNumber + spannedRow} ${column + spannedColumn}`);
					placedCells.push({
						row: rowNumber,
						column,
						element: cell,
						state: cellState,
						columns,
						rows: spannedRows
					});
					column += columns;
					width = Math.max(width, column);
				}
				const header = group === head || head === void 0 && rowNumber === rowStates.length && cells.length > 0 && cells.every((cell) => cell.name === "th") && rowStates.every((other) => other.header);
				rowStates.push({
					state: rowState,
					header,
					cells: cells.length
				});
			}
		}
		if (width === 0) return captionBlocks;
		const cellBlockOf = (cell) => {
			var _ref2, _cellStyle$background;
			const cellStyle = cell.state.style;
			const rowStyle = rowStates[cell.row].state.style;
			const background = (_ref2 = (_cellStyle$background = cellStyle.backgroundColor) !== null && _cellStyle$background !== void 0 ? _cellStyle$background : rowStyle.backgroundColor) !== null && _ref2 !== void 0 ? _ref2 : style.backgroundColor;
			const verticalAlign = [cellStyle.verticalAlign, rowStyle.verticalAlign].find((align) => align === "top" || align === "middle" || align === "bottom");
			const { padding } = cellStyle;
			const cellBorders = SIDES.filter((side) => cellStyle.border[side]);
			return {
				options: _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, cell.columns > 1 ? { columnSpan: cell.columns } : {}), cell.rows > 1 ? { rowSpan: cell.rows } : {}), background ? { shading: {
					type: docx.ShadingType.CLEAR,
					fill: background,
					color: "auto"
				} } : {}), verticalAlign ? { verticalAlign: VERTICAL_ALIGNMENTS[verticalAlign] } : {}), cellStyle.width ? { width: widthOf(cellStyle.width) } : {}), SIDES.some((side) => padding[side] > 0) ? { margins: {
					top: twips(padding.top),
					right: twips(padding.right),
					bottom: twips(padding.bottom),
					left: twips(padding.left)
				} } : {}), cellBorders.length > 0 ? { borders: Object.fromEntries(SIDES.map((side) => [side, cellStyle.border[side] ? borderOf(cellStyle.border[side]) : NO_BORDER])) } : {}),
				content: readBlock(cell.element, cellStyle, _objectSpread2(_objectSpread2({}, cell.state), {}, {
					style: rowStates[cell.row].state.style,
					flow: {
						indentLeft: 0,
						indentRight: 0
					}
				}), conversion, { box: false })
			};
		};
		const rows = rowStates.map(({ state: rowState, header }, rowNumber) => {
			const own = placedCells.filter((cell) => cell.row === rowNumber);
			const free = Array.from({ length: width }, (_, column) => column).filter((column) => !taken.has(`${rowNumber} ${column}`)).length;
			const heights = [rowState.style.height, ...own.map((cell) => cell.state.style.height)].flatMap((height) => height && "points" in height ? [height.points] : []);
			return {
				options: _objectSpread2(_objectSpread2(_objectSpread2({}, header ? { tableHeader: true } : {}), heights.length > 0 ? { height: {
					value: twips(Math.max(...heights)),
					rule: docx.HeightRule.ATLEAST
				} } : {}), rowState.style.breakInside === "avoid" ? { cantSplit: true } : {}),
				cells: [...own.map(cellBlockOf), ...Array.from({ length: free }, () => ({
					options: {},
					content: []
				}))]
			};
		});
		const { left, right } = style.margin;
		const indent = twips(state.flow.indentLeft + points(left)) + listIndentOf(state.flow);
		const columnWidths = columnWidthsOf(children, width);
		const table = {
			type: "table",
			options: _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, style.width ? { width: widthOf(style.width) } : {}), left === "auto" && right === "auto" ? { alignment: docx.AlignmentType.CENTER } : left === "auto" ? { alignment: docx.AlignmentType.RIGHT } : {}), indent > 0 ? { indent: {
				size: indent,
				type: docx.WidthType.DXA
			} } : {}), borders ? { borders: {
				top: style.border.top ? borderOf(style.border.top) : NO_BORDER,
				right: style.border.right ? borderOf(style.border.right) : NO_BORDER,
				bottom: style.border.bottom ? borderOf(style.border.bottom) : NO_BORDER,
				left: style.border.left ? borderOf(style.border.left) : NO_BORDER,
				insideHorizontal: NO_BORDER,
				insideVertical: NO_BORDER
			} } : {}), style.tableLayout === "fixed" ? { layout: docx.TableLayoutType.FIXED } : {}), style.direction === "rtl" ? { visuallyRightToLeft: true } : {}), style.wordStyle ? { style: style.wordStyle } : {}), columnWidths ? { columnWidths } : {}),
			rows
		};
		return [
			...style.breakBefore ? [{
				type: "block-break",
				kind: style.breakBefore
			}] : [],
			...captionBlocks,
			table,
			...style.breakAfter ? [{
				type: "block-break",
				kind: style.breakAfter
			}] : []
		];
	};
	var NO_BORDER = {
		style: docx.BorderStyle.NONE,
		size: 0,
		color: "auto"
	};
	/** The widths of a table's columns from its `<col>`s, in twips, when they give every column a width in pixels or points */
	var columnWidthsOf = (children, width) => {
		const widths = children.flatMap((child) => child.name === "colgroup" ? elementsOf(child).length > 0 ? elementsOf(child) : [child] : []).flatMap((column) => {
			var _column$attribs$span, _ref3, _column$attribs$width, _exec2, _column$attribs$style;
			const span = Math.max(Number.parseInt((_column$attribs$span = column.attribs.span) !== null && _column$attribs$span !== void 0 ? _column$attribs$span : "1", 10) || 1, 1);
			const pixels = /^\s*(\d+(?:\.\d+)?)\s*(?:px)?\s*$/.exec((_ref3 = (_column$attribs$width = column.attribs.width) !== null && _column$attribs$width !== void 0 ? _column$attribs$width : (_exec2 = /(?:^|;)\s*width\s*:\s*([^;]+)/i.exec((_column$attribs$style = column.attribs.style) !== null && _column$attribs$style !== void 0 ? _column$attribs$style : "")) === null || _exec2 === void 0 ? void 0 : _exec2[1]) !== null && _ref3 !== void 0 ? _ref3 : "");
			return Array.from({ length: span }, () => pixels ? twips(Number(pixels[1]) * .75) : void 0);
		});
		return widths.length === width && widths.every((value) => value !== void 0) ? widths : void 0;
	};
	/**
	* Reads HTML into blocks.
	*
	* @param html - The HTML: a whole document, or some of its body
	* @param options - The options of the conversion
	*/
	var readHtml = (html, options) => {
		var _options$styleMap, _options$stylesheet;
		const root = parse$2(html, { treeAdapter: adapter }).children.find((node) => isElement(node) && node.name === "html");
		const body = elementsOf(root).find((element) => element.name === "body");
		const inTemplate = (element) => {
			let { parent } = element;
			while (parent && parent.type === "tag" && parent.name !== "template") ({parent} = parent);
			return (parent === null || parent === void 0 ? void 0 : parent.type) === "tag";
		};
		const styleElements = descendantsOf(root).filter((element) => {
			var _element$attribs$medi;
			return element.name === "style" && isForPrint((_element$attribs$medi = element.attribs.media) !== null && _element$attribs$medi !== void 0 ? _element$attribs$medi : "") && !inTemplate(element);
		});
		const styleMap = Object.entries((_options$styleMap = options.styleMap) !== null && _options$styleMap !== void 0 ? _options$styleMap : {}).map(([selector, style]) => `${selector} { ${WORD_STYLE}: "${style.replace(/["\\]/g, "\\$&")}"; }`).join("\n");
		const cascade = createCascade(USER_AGENT_STYLE_SHEET, [
			...styleElements.map((element) => textOf(element)),
			(_options$stylesheet = options.stylesheet) !== null && _options$stylesheet !== void 0 ? _options$stylesheet : "",
			styleMap
		], presentationalHints);
		const warnings = /* @__PURE__ */ new Set();
		const notes = notesOf(body, options.notes === "endnotes" ? "endnote" : "footnote");
		const conversion = {
			options,
			warn: (warning) => {
				if (!warnings.has(warning.message)) {
					var _options$onWarning;
					warnings.add(warning.message);
					(_options$onWarning = options.onWarning) === null || _options$onWarning === void 0 || _options$onWarning.call(options, warning);
				}
			},
			cascade,
			bookmarks: bookmarksOf(body, /* @__PURE__ */ new Set([...notes.references.keys(), ...notes.hidden])),
			notes,
			wordLists: /* @__PURE__ */ new Map()
		};
		const rootStyle = computeStyle(cascade(root, /* @__PURE__ */ new Map()), ROOT_STYLE, root.attribs.lang);
		const rootState = {
			style: _objectSpread2(_objectSpread2({}, rootStyle), {}, { rootFontSize: rootStyle.baseFontSize }),
			format: {},
			inline: {},
			flow: {
				indentLeft: 0,
				indentRight: 0
			},
			quotes: 0,
			depth: 0
		};
		const bodyStyle = computeStyle(cascade(body, rootState.style.customProperties), rootState.style, body.attribs.lang);
		if (bodyStyle.display === "none") return [];
		const state = stateIn(bodyStyle, rootState, {});
		return toBlocks(readNodes(body.children, state, conversion), paragraphFormatOf(bodyStyle, state.flow, 0));
	};
	//#endregion
	//#region src/html/write-inline.ts
	/**
	* Writes a paragraph's content as docx's runs, hyperlinks and bookmarks, after collapsing its spaces as CSS does.
	*
	* @module
	*/
	var NOT_IN_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g;
	var SURROGATES = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDFFF]/g;
	/** Text without the characters XML doesn't allow */
	var withoutInvalidCharacters = (text) => text.replace(NOT_IN_XML, "").replace(SURROGATES, (match) => match.length === 2 ? match : "");
	var COLLAPSIBLE = /[ \t\n\r\f]+/g;
	var NEW_LINE = /\r\n|\r|\n/;
	/** Text with `text-transform`'s lowercase, or capitals at the start of words, after the character before it */
	var transformed = (text, transform, before) => {
		if (transform === "lowercase") return text.toLowerCase();
		return transform === "capitalize" ? text.replace(new RegExp("(^|[\\s\\-/])(\\p{L})", "gu"), (match, space, letter, offset) => offset === 0 && new RegExp("[\\p{L}\\p{N}]", "u").test(before) ? match : space + letter.toUpperCase()) : text;
	};
	/**
	* Collapses a paragraph's spaces as CSS does: in text whose `white-space` collapses them, spaces, tabs and new lines
	* are one space, which is left out at the start and end of a line and after another space, whatever elements it is
	* between. Preserved text, such as `<pre>`'s, keeps its spaces, and its tabs and new lines are tabs and line breaks.
	* A line break that ends the paragraph is left out, as it starts a line with nothing on it.
	*/
	var collapse = (content) => {
		const pieces = [];
		let lineStart = true;
		let previous = "";
		let space;
		const addSpace = () => {
			if (space) {
				pieces.push(space);
				previous = " ";
				space = void 0;
			}
		};
		const addText = (text, item) => {
			const valid = withoutInvalidCharacters(text);
			if (valid !== "") {
				addSpace();
				pieces.push({
					type: "text",
					text: transformed(valid, item.transform, previous),
					format: item.format,
					link: item.link,
					revision: item.revision
				});
				previous = valid[valid.length - 1];
				lineStart = false;
			}
		};
		const addBreak = (format, link) => {
			pieces.push({
				type: "break",
				format,
				link
			});
			space = void 0;
			lineStart = true;
			previous = "";
		};
		for (const item of content) if (item.type === "bookmark") pieces.push(item);
		else if (item.type === "atom") {
			addSpace();
			pieces.push(item);
			lineStart = false;
			previous = "￼";
		} else if (item.type === "break") addBreak(item.format, item.link);
		else if (item.whiteSpace === "pre" || item.whiteSpace === "pre-wrap" || item.whiteSpace === "break-spaces") for (const [index, line] of item.text.split(NEW_LINE).entries()) {
			if (index > 0) addBreak(item.format, item.link);
			for (const [partIndex, part] of line.split("	").entries()) {
				if (partIndex > 0) {
					addSpace();
					pieces.push({
						type: "tab",
						format: item.format,
						link: item.link,
						revision: item.revision
					});
					previous = "	";
					lineStart = false;
				}
				addText(part, item);
			}
		}
		else {
			const lines = item.whiteSpace === "pre-line" ? item.text.split(NEW_LINE) : [item.text];
			for (const [index, line] of lines.entries()) {
				if (index > 0) addBreak(item.format, item.link);
				for (const part of line.replace(COLLAPSIBLE, " ").split(/( )/)) if (part === " ") {
					if (!lineStart && !space && previous !== " ") space = {
						type: "text",
						text: " ",
						format: item.format,
						link: item.link,
						revision: item.revision
					};
				} else addText(part, item);
			}
		}
		const last = pieces.map((piece) => piece.type).lastIndexOf("break");
		return last !== -1 && pieces.slice(last + 1).every((piece) => piece.type === "bookmark") ? [...pieces.slice(0, last), ...pieces.slice(last + 1)] : pieces;
	};
	var sameFormat = (a, b) => JSON.stringify(a) === JSON.stringify(b);
	/** Runs of text, tabs and line breaks, with each stretch of one formatting and revision in one run */
	var runsOf = (pieces, idOf) => {
		const runs = [];
		let breaks = 0;
		let children = [];
		let current;
		const flush = () => {
			if (current === void 0) return;
			const options = _objectSpread2(_objectSpread2(_objectSpread2({}, current.format), breaks > 0 ? { break: breaks } : {}), {}, { children });
			const { revision } = current;
			if (revision === void 0) runs.push(new docx.TextRun(options));
			else {
				const change = {
					id: idOf(),
					author: revision.author,
					date: revision.date
				};
				runs.push(revision.kind === "insertion" ? new docx.InsertedTextRun(_objectSpread2(_objectSpread2({}, options), change)) : new docx.DeletedTextRun(_objectSpread2(_objectSpread2({}, options), change)));
			}
			breaks = 0;
			children = [];
			current = void 0;
		};
		for (const piece of pieces) if (piece.type === "break") {
			flush();
			breaks++;
		} else {
			var _current;
			if (current && (!sameFormat(current.format, piece.format) || current.revision !== piece.revision)) flush();
			current = (_current = current) !== null && _current !== void 0 ? _current : piece;
			const last = children[children.length - 1];
			if (piece.type === "tab") children.push(new docx.Tab());
			else if (typeof last === "string") children[children.length - 1] = last + piece.text;
			else children.push(piece.text);
		}
		flush();
		if (breaks > 0) runs.push(new docx.TextRun(_objectSpread2(_objectSpread2({}, pieces[pieces.length - 1].format), {}, { break: breaks })));
		return runs;
	};
	/** The content of a link, or of the text between links: its runs, with images and other content between them */
	var childrenOf = (pieces, idOf) => {
		const children = [];
		let runs = [];
		for (const piece of pieces) if (piece.type === "atom") {
			children.push(...runsOf(runs, idOf), piece.child);
			runs = [];
		} else runs.push(piece);
		return [...children, ...runsOf(runs, idOf)];
	};
	/**
	* Writes a paragraph's content: its text in runs, with links in hyperlinks, and its images, checkboxes and other
	* content as they are.
	*
	* @param content - The paragraph's content
	* @param idOf - Gives each tracked change an id no other in the document has
	*/
	var writeInline = (content, idOf) => {
		const pieces = collapse(content);
		const children = [];
		let index = 0;
		while (index < pieces.length) {
			const piece = pieces[index];
			if (piece.type === "bookmark") {
				children.push(new docx.Bookmark({
					id: piece.name,
					children: []
				}));
				index++;
				continue;
			}
			const { link } = piece;
			let end = index + 1;
			while (end < pieces.length && pieces[end].type !== "bookmark" && pieces[end].link === link) end++;
			const written = childrenOf(pieces.slice(index, end), idOf);
			if (link === void 0) children.push(...written);
			else if ("href" in link) children.push(new docx.ExternalHyperlink({
				link: link.href,
				children: written
			}));
			else children.push(new docx.InternalHyperlink({
				anchor: link.anchor,
				children: written
			}));
			index = end;
		}
		return children;
	};
	//#endregion
	//#region src/html/write-blocks.ts
	/**
	* Writes blocks as docx's paragraphs and tables, with their lists numbered, each page or column break in the block
	* after it, and their notes' references as footnotes' and endnotes' references.
	*
	* @module
	*/
	/**
	* Writes blocks. A break that ends the blocks is left out, as it would start a page or column with nothing on it.
	*
	* @param blocks - The blocks, in order
	* @param idOf - Gives each tracked change an id no other in the document has
	*/
	var writeBlocks = (blocks, idOf) => {
		const numbering = numberLists(blocks);
		const written = [];
		let pending;
		for (const block of blocks) {
			if (block.type === "block-break") {
				pending = pending === "page" ? pending : block.kind;
				continue;
			}
			if (block.type === "paragraph") {
				const list = numbering.get(block);
				const children = writeInline(withNotes(block.content, idOf), idOf);
				written.push(new docx.Paragraph(_objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, block.format), pending === "page" ? { pageBreakBefore: true } : {}), list ? { numbering: {
					reference: list.reference,
					level: list.level
				} } : {}), {}, { children: pending === "column" ? [new docx.ColumnBreak(), ...children] : children })));
			} else {
				const breakBefore = pending;
				written.push(new docx.Table(_objectSpread2(_objectSpread2({}, block.options), {}, { rows: block.rows.map((row, rowIndex) => new docx.TableRow(_objectSpread2(_objectSpread2({}, row.options), {}, { children: row.cells.map((cell, cellIndex) => new docx.TableCell(_objectSpread2(_objectSpread2({}, cell.options), {}, { children: writeBlocks(rowIndex === 0 && cellIndex === 0 && breakBefore ? [{
					type: "block-break",
					kind: breakBefore
				}, ...cell.content] : cell.content, idOf) }))) }))) })));
			}
			pending = void 0;
		}
		return written;
	};
	/**
	* A paragraph's content, with each note's reference written as a footnote's or endnote's reference with the note's
	* paragraphs, which each reference has a copy of, as Word's notes have one reference each. The reference to a note that
	* isn't read, such as a hidden one, is written as it is in the HTML.
	*
	* @param content - The paragraph's content
	* @param idOf - Gives each tracked change an id no other in the document has
	*/
	var withNotes = (content, idOf) => content.flatMap((item) => {
		if (item.type !== "note") return [item];
		const { note } = item;
		if (note.content === void 0) return withNotes(item.fallback, idOf);
		const children = writeBlocks(note.content, idOf);
		return [{
			type: "atom",
			child: note.kind === "endnote" ? new docx.EndnoteReferenceRun({ children }) : new docx.FootnoteReferenceRun({ children })
		}];
	});
	//#endregion
	//#region src/html/html-to-content.ts
	var revisions = 1e6;
	var nextRevisionId = () => ++revisions;
	/**
	* Turns HTML into paragraphs and tables, to go in a document's sections, headers, footers, table cells and anywhere
	* else they go, among others, or to patch a template with.
	*
	* It reads what rich-text editors write, such as TinyMCE, CKEditor, Quill, TipTap and Lexical, and what Word and
	* Google Docs put on the clipboard, as a browser reads it: its `<style>` elements and `style` attributes, the styles
	* of the classes those editors write, and HTML's own meanings, such as `<b>`'s bold. Paragraphs, headings, lists and
	* links are in the Word document's own styles, such as Heading 1 and Hyperlink, with only what the HTML says, such as
	* a colour or a font size, written as direct formatting.
	*
	* It has headings, paragraphs and line breaks; bold, italic, underlined, struck through, superscript and subscript
	* text, its colours, backgrounds, fonts, sizes and spacing; alignment, indents, line spacing, borders and shading of
	* paragraphs; lists, numbered or not, in each other, with their numbers' styles and starts; tables, with merged cells,
	* header rows, widths, borders, backgrounds and alignment; images, with their sizes and alt text, floating or not;
	* links, within the document too; checkboxes; math, as Word's equations; page breaks; and tracked changes.
	*
	* Nothing is downloaded: images that aren't data URLs are given with the `images` option. HTML that isn't valid is
	* read as a browser reads it, and what the document can't have, such as a video, is left out, with a warning to
	* `onWarning`. It never throws for the HTML it is given.
	*
	* @param html - The HTML: some of a document's body, such as an editor's content, or a whole document
	* @param options - Options, such as the images and CSS of the HTML
	* @returns The paragraphs and tables
	*
	* @example
	* ```typescript
	* import { Document, Packer } from "docx";
	* import { htmlToContent } from "docx/html";
	*
	* const doc = new Document({
	*     sections: [{ children: htmlToContent("<h1>Report</h1><p>The <b>results</b> are in.</p>") }],
	* });
	* const buffer = await Packer.toBuffer(doc);
	* ```
	*/
	var htmlToContent = (html, options = {}) => writeBlocks(readHtml(html, options), nextRevisionId);
	/** The content of blocks, with a line break between each block's and the next's, and tables' cells' in order */
	var flatten = (blocks) => blocks.flatMap((block) => {
		if (block.type === "paragraph") return [block.content];
		return block.type === "table" ? block.rows.flatMap((row) => row.cells.flatMap((cell) => flatten(cell.content))) : [];
	});
	/**
	* Turns HTML into the content of a paragraph: runs of text, hyperlinks, images and the rest, such as for a paragraph
	* of a document's own, or to patch a paragraph of a template with.
	*
	* It reads HTML as `htmlToContent` does. Paragraphs in the HTML are lines of the paragraph, and the content of tables
	* and lists is kept, without the tables and lists, with a warning, as a paragraph can't have them.
	*
	* @param html - The HTML, such as `"<b>Due</b> on <i>Friday</i>"`
	* @param options - Options, such as the images and CSS of the HTML
	* @returns The paragraph's content
	*
	* @example
	* ```typescript
	* new Paragraph({ children: htmlToRuns("Total: <b>£120</b>") });
	* ```
	*/
	var htmlToRuns = (html, options = {}) => {
		const blocks = readHtml(html, options);
		if (blocks.some((block) => block.type === "table" || block.type === "paragraph" && block.item)) {
			var _options$onWarning;
			(_options$onWarning = options.onWarning) === null || _options$onWarning === void 0 || _options$onWarning.call(options, {
				code: "block-in-paragraph",
				message: "A paragraph can't have the HTML's tables and lists, so their content is kept without them"
			});
		}
		const lines = flatten(blocks);
		const breakAfter = (line) => {
			var _last$format;
			const last = [...line].reverse().find((item) => item.type === "text");
			return {
				type: "break",
				format: (_last$format = last === null || last === void 0 ? void 0 : last.format) !== null && _last$format !== void 0 ? _last$format : {}
			};
		};
		return writeInline(withNotes(lines.flatMap((line, index) => index === lines.length - 1 ? line : [...line, breakAfter(line)]), nextRevisionId), nextRevisionId);
	};
	//#endregion
	exports.htmlToContent = htmlToContent;
	exports.htmlToRuns = htmlToRuns;
	return exports;
})({}, docx, docxMath);
