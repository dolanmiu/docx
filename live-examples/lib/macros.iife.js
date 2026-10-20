var docxMacros = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/macros/code-page.ts
	/**
	* The code page the VBA project's text is written in: its code, and the names of the project and its modules.
	*
	* @module
	*/
	/**
	* Windows-1252, the code page of VBA in Word set to English and the other Western European languages. Its number goes in
	* the project, which is how VBA knows it.
	*/
	var CODE_PAGE = 1252;
	var BYTES = new Map([..."€_‚ƒ„…†‡ˆ‰Š‹Œ_Ž__‘’“”•–—˜™š›œ_žŸ"].flatMap((character, index) => character === "_" ? [] : [[character, 128 + index]]));
	/**
	* Encodes text in Windows-1252.
	*
	* @param what - What the text is, for the error, such as `The code of module "Greetings"`
	* @throws If the text has a character Windows-1252 doesn't
	*/
	var encodeWindows1252 = (text, what) => Uint8Array.from([...text], (character) => {
		const code = character.codePointAt(0);
		const byte = code < 128 || code >= 160 && code <= 255 ? code : BYTES.get(character);
		if (byte === void 0) {
			const chrW = Array.from({ length: character.length }, (_, index) => `ChrW(&H${character.charCodeAt(index).toString(16).toUpperCase()})`);
			throw new Error(`${what} has "${character}", which VBA can't keep in its code page, Windows-1252. Write it with ChrW instead, such as ${chrW.join(" & ")} in a string`);
		}
		return byte;
	});
	//#endregion
	//#region src/macros/compression.ts
	/**
	* The compression VBA uses for a project's module information and for each module's code, a run length encoding.
	*
	* Reference: [MS-OVBA] 2.4.1 Compression and Decompression
	*
	* @module
	*/
	var CHUNK_SIZE = 4096;
	/**
	* The bits of a copy token that hold the copy's length, the rest holding its offset. The further into its chunk a copy
	* is, the more bits its offset can need.
	*
	* Reference: [MS-OVBA] 2.4.1.3.19.1 CopyToken Help
	*
	* @param position - How far into its chunk the copy is, at least 1
	*/
	var lengthBitsAt = (position) => 16 - Math.max(32 - Math.clz32(position - 1), 4);
	/**
	* The longest earlier run of bytes in the chunk that the bytes from `current` repeat, the nearest of the longest.
	*
	* Reference: [MS-OVBA] 2.4.1.3.19.4 Matching
	*
	* @returns How far back the run starts and how long it is, or `undefined` for none of at least 3 bytes
	*/
	var findMatch = (data, chunkStart, current, chunkEnd) => {
		let bestLength = 0;
		let bestCandidate = 0;
		for (let candidate = current - 1; candidate >= chunkStart; candidate--) {
			let length = 0;
			while (current + length < chunkEnd && data[current + length] === data[candidate + length]) length++;
			if (length > bestLength) {
				bestLength = length;
				bestCandidate = candidate;
			}
		}
		if (bestLength < 3) return;
		const maximumLength = (1 << lengthBitsAt(current - chunkStart)) - 1 + 3;
		return {
			offset: current - bestCandidate,
			length: Math.min(bestLength, maximumLength)
		};
	};
	/**
	* Compresses a chunk: groups of up to eight tokens, each group after a byte whose bits say which of its tokens are a
	* byte as it is and which copy earlier bytes.
	*
	* Reference: [MS-OVBA] 2.4.1.3.7 Compressing a DecompressedChunk
	*/
	var compressChunk = (data, chunkStart, chunkEnd) => {
		const tokens = [];
		let current = chunkStart;
		while (current < chunkEnd) {
			const flagIndex = tokens.length;
			tokens.push(0);
			for (let index = 0; index < 8 && current < chunkEnd; index++) {
				const match = findMatch(data, chunkStart, current, chunkEnd);
				if (match === void 0) {
					tokens.push(data[current]);
					current++;
				} else {
					const lengthBits = lengthBitsAt(current - chunkStart);
					const token = match.offset - 1 << lengthBits | match.length - 3;
					tokens.push(token & 255, token >> 8);
					tokens[flagIndex] |= 1 << index;
					current += match.length;
				}
			}
		}
		if (tokens.length <= CHUNK_SIZE) {
			const compressedHeader = 45056 | tokens.length + 2 - 3;
			return [
				compressedHeader & 255,
				compressedHeader >> 8,
				...tokens
			];
		}
		const raw = new Uint8Array(CHUNK_SIZE);
		raw.set(data.subarray(chunkStart, chunkEnd));
		return [
			255,
			63,
			...raw
		];
	};
	/**
	* Compresses data as VBA does.
	*
	* Reference: [MS-OVBA] 2.4.1.3.6 Compression algorithm
	*/
	var compress = (data) => {
		const output = [1];
		for (let chunkStart = 0; chunkStart < data.length; chunkStart += CHUNK_SIZE) output.push(...compressChunk(data, chunkStart, Math.min(chunkStart + CHUNK_SIZE, data.length)));
		return Uint8Array.from(output);
	};
	//#endregion
	//#region src/compound-file/compound-file.ts
	var SECTOR_SIZE = 512;
	var MINI_SECTOR_SIZE = 64;
	var MINI_STREAM_CUTOFF = 4096;
	var DIRECTORY_ENTRY_SIZE = 128;
	var SECTOR_NUMBERS_PER_SECTOR = SECTOR_SIZE / 4;
	var HEADER_FAT_SECTORS = 109;
	var DIFAT_SECTOR_FAT_SECTORS = 127;
	var FREE_SECTOR = 4294967295;
	var END_OF_CHAIN = 4294967294;
	var FAT_SECTOR = 4294967293;
	var DIFAT_SECTOR = 4294967292;
	var NO_STREAM = 4294967295;
	var STORAGE = 1;
	var STREAM = 2;
	var ROOT_STORAGE = 5;
	var RED = 0;
	var BLACK = 1;
	/**
	* Orders the entries of a storage as the file's red-black trees do: a shorter name first, then by the names in capitals.
	*/
	var compareNames = (a, b) => {
		if (a.length !== b.length) return a.length - b.length;
		const upperA = a.toUpperCase();
		const upperB = b.toUpperCase();
		return upperA < upperB ? -1 : upperA > upperB ? 1 : 0;
	};
	/**
	* Links a storage's entries, in order, into a balanced tree that is a valid red-black tree: the entries on its deepest
	* level are red, and the rest black.
	*
	* @returns The id of the tree's root
	*/
	var linkTree = (entries, ids) => {
		const depths = [];
		const link = (from, to, depth) => {
			if (from > to) return NO_STREAM;
			const middle = Math.floor((from + to) / 2);
			const entry = entries[ids[middle]];
			depths[middle] = depth;
			entry.left = link(from, middle - 1, depth + 1);
			entry.right = link(middle + 1, to, depth + 1);
			return ids[middle];
		};
		const root = link(0, ids.length - 1, 0);
		const deepest = Math.max(...depths);
		for (const [index, id] of ids.entries()) entries[id].color = depths[index] === deepest && deepest > 0 ? RED : BLACK;
		return root;
	};
	/**
	* The directory's entries, the root first, with each storage's entries linked into its tree.
	*/
	var createDirectory = (children) => {
		const entry = (name, type, data) => {
			if (name.length === 0 || name.length > 31 || /[/\\:!]/.test(name)) throw new Error(`Invalid compound file entry name "${name}"`);
			return {
				name,
				type,
				data,
				left: NO_STREAM,
				right: NO_STREAM,
				child: NO_STREAM,
				color: BLACK,
				start: 0,
				size: 0
			};
		};
		const entries = [entry("Root Entry", ROOT_STORAGE)];
		const addChildren = (parent, storageChildren) => {
			const sorted = [...storageChildren].sort((a, b) => compareNames(a.name, b.name));
			for (const [index, child] of sorted.entries()) if (index > 0 && compareNames(sorted[index - 1].name, child.name) === 0) throw new Error(`Two compound file entries in a storage are named "${child.name}"`);
			const ids = sorted.map((child) => {
				entries.push("children" in child ? entry(child.name, STORAGE) : entry(child.name, STREAM, child.data));
				return entries.length - 1;
			});
			parent.child = ids.length === 0 ? NO_STREAM : linkTree(entries, ids);
			for (const [index, child] of sorted.entries()) if ("children" in child) addChildren(entries[ids[index]], child.children);
		};
		addChildren(entries[0], children);
		return entries;
	};
	/**
	* Lays out a chain of sectors, each pointing to the next, in a table of sector numbers, such as the FAT.
	*
	* @returns The chain's first sector, or END_OF_CHAIN for none
	*/
	var addChain = (table, count, value) => {
		if (count === 0) return END_OF_CHAIN;
		const start = table.length;
		for (let index = 0; index < count; index++) table.push(value !== null && value !== void 0 ? value : index === count - 1 ? END_OF_CHAIN : start + index + 1);
		return start;
	};
	/**
	* Writes a class id, a GUID such as "0003000C-0000-0000-C000-000000000046", as a directory entry holds it: its first
	* three fields little-endian, and the rest in order.
	*/
	var writeClassId = (view, offset, classId) => {
		const match = /^([\da-f]{8})-([\da-f]{4})-([\da-f]{4})-([\da-f]{4})-([\da-f]{12})$/i.exec(classId);
		if (match === null) throw new Error(`Invalid class id "${classId}". Expected a GUID such as "0003000C-0000-0000-C000-000000000046"`);
		view.setUint32(offset, parseInt(match[1], 16), true);
		view.setUint16(offset + 4, parseInt(match[2], 16), true);
		view.setUint16(offset + 6, parseInt(match[3], 16), true);
		const rest = match[4] + match[5];
		for (let index = 0; index < 8; index++) view.setUint8(offset + 8 + index, parseInt(rest.slice(index * 2, index * 2 + 2), 16));
	};
	/**
	* Writes a compound file of version 3, as Office writes VBA projects and OLE objects.
	*
	* @param children - The root storage's streams and storages
	* @param options - The root storage's class id, which says what application an OLE object's data is for
	* @throws If two entries of a storage have the same name, ignoring case, or a name is empty, longer than 31 characters or
	* has "/", "\", ":" or "!"
	*/
	var createCompoundFile = (children, { classId } = {}) => {
		const entries = createDirectory(children);
		const streams = entries.filter((entry) => entry.type === STREAM);
		const miniStreams = streams.filter((entry) => entry.data.length < MINI_STREAM_CUTOFF);
		const largeStreams = streams.filter((entry) => entry.data.length >= MINI_STREAM_CUTOFF);
		const miniFat = [];
		for (const stream of miniStreams) {
			stream.start = addChain(miniFat, Math.ceil(stream.data.length / MINI_SECTOR_SIZE));
			stream.size = stream.data.length;
		}
		const miniStreamSize = miniFat.length * MINI_SECTOR_SIZE;
		const fat = [];
		const directoryStart = addChain(fat, Math.ceil(entries.length / (SECTOR_SIZE / DIRECTORY_ENTRY_SIZE)));
		const miniFatSectors = Math.ceil(miniFat.length / SECTOR_NUMBERS_PER_SECTOR);
		const miniFatStart = addChain(fat, miniFatSectors);
		entries[0].start = addChain(fat, Math.ceil(miniStreamSize / SECTOR_SIZE));
		entries[0].size = miniStreamSize;
		for (const stream of largeStreams) {
			stream.start = addChain(fat, Math.ceil(stream.data.length / SECTOR_SIZE));
			stream.size = stream.data.length;
		}
		let fatSectors = 0;
		const difatSectorsFor = (count) => Math.max(0, Math.ceil((count - HEADER_FAT_SECTORS) / DIFAT_SECTOR_FAT_SECTORS));
		while (fatSectors * SECTOR_NUMBERS_PER_SECTOR < fat.length + fatSectors + difatSectorsFor(fatSectors)) fatSectors++;
		const difatSectors = difatSectorsFor(fatSectors);
		const fatStart = addChain(fat, fatSectors, FAT_SECTOR);
		const difatStart = addChain(fat, difatSectors, DIFAT_SECTOR);
		const file = new Uint8Array(SECTOR_SIZE + fat.length * SECTOR_SIZE);
		const view = new DataView(file.buffer);
		const sectorOffset = (sector) => SECTOR_SIZE + sector * SECTOR_SIZE;
		file.set([
			208,
			207,
			17,
			224,
			161,
			177,
			26,
			225
		]);
		view.setUint16(24, 62, true);
		view.setUint16(26, 3, true);
		view.setUint16(28, 65534, true);
		view.setUint16(30, 9, true);
		view.setUint16(32, 6, true);
		view.setUint32(44, fatSectors, true);
		view.setUint32(48, directoryStart, true);
		view.setUint32(56, MINI_STREAM_CUTOFF, true);
		view.setUint32(60, miniFatStart, true);
		view.setUint32(64, miniFatSectors, true);
		view.setUint32(68, difatStart, true);
		view.setUint32(72, difatSectors, true);
		for (let index = 0; index < HEADER_FAT_SECTORS; index++) view.setUint32(76 + index * 4, index < fatSectors ? fatStart + index : FREE_SECTOR, true);
		for (let sector = 0; sector < difatSectors; sector++) {
			const offset = sectorOffset(difatStart + sector);
			for (let index = 0; index < DIFAT_SECTOR_FAT_SECTORS; index++) {
				const fatSector = HEADER_FAT_SECTORS + sector * DIFAT_SECTOR_FAT_SECTORS + index;
				view.setUint32(offset + index * 4, fatSector < fatSectors ? fatStart + fatSector : FREE_SECTOR, true);
			}
			view.setUint32(offset + 508, sector < difatSectors - 1 ? difatStart + sector + 1 : END_OF_CHAIN, true);
		}
		for (let index = 0; index < Math.ceil(entries.length / 4) * 4; index++) {
			const offset = sectorOffset(directoryStart) + index * DIRECTORY_ENTRY_SIZE;
			const entry = entries[index];
			if (entry === void 0) {
				view.setUint32(offset + 68, NO_STREAM, true);
				view.setUint32(offset + 72, NO_STREAM, true);
				view.setUint32(offset + 76, NO_STREAM, true);
				continue;
			}
			for (let position = 0; position < entry.name.length; position++) view.setUint16(offset + position * 2, entry.name.charCodeAt(position), true);
			view.setUint16(offset + 64, (entry.name.length + 1) * 2, true);
			view.setUint8(offset + 66, entry.type);
			view.setUint8(offset + 67, entry.color);
			if (index === 0 && classId !== void 0) writeClassId(view, offset + 80, classId);
			view.setUint32(offset + 68, entry.left, true);
			view.setUint32(offset + 72, entry.right, true);
			view.setUint32(offset + 76, entry.child, true);
			view.setUint32(offset + 116, entry.type === STORAGE ? 0 : entry.start, true);
			view.setUint32(offset + 120, entry.size, true);
		}
		for (let index = 0; index < miniFatSectors * SECTOR_NUMBERS_PER_SECTOR; index++) {
			var _miniFat$index;
			view.setUint32(sectorOffset(miniFatStart) + index * 4, (_miniFat$index = miniFat[index]) !== null && _miniFat$index !== void 0 ? _miniFat$index : FREE_SECTOR, true);
		}
		for (const stream of miniStreams) file.set(stream.data, sectorOffset(entries[0].start) + stream.start * MINI_SECTOR_SIZE);
		for (const stream of largeStreams) file.set(stream.data, sectorOffset(stream.start));
		for (let index = 0; index < fatSectors * SECTOR_NUMBERS_PER_SECTOR; index++) {
			var _fat$index;
			view.setUint32(sectorOffset(fatStart) + index * 4, (_fat$index = fat[index]) !== null && _fat$index !== void 0 ? _fat$index : FREE_SECTOR, true);
		}
		return file;
	};
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
	//#region src/macros/create-macros.ts
	var PROJECT_NAME = "Project";
	var PROJECT_ID = "{6D8A8E5B-1C9F-4E2B-9A4D-3B5F7C2E1D60}";
	var REFERENCES = [
		{
			name: "stdole",
			registered: "*\\G{00020430-0000-0000-C000-000000000046}#2.0#0#C:\\Windows\\System32\\stdole2.tlb#OLE Automation"
		},
		{
			name: "Normal",
			project: "*\\CNormal"
		},
		{
			name: "Office",
			registered: "*\\G{2DF8D04C-5BFA-101B-BDE5-00AA0044DE52}#2.0#0#C:\\Program Files\\Common Files\\Microsoft Shared\\OFFICE16\\MSO.DLL#Microsoft Office 16.0 Object Library"
		}
	];
	var TAKEN_NAMES = [
		"ThisDocument",
		PROJECT_NAME,
		"VBA",
		"Word",
		...REFERENCES.map(({ name }) => name)
	];
	var ATTRIBUTES = {
		document: (name) => [
			`Attribute VB_Name = "${name}"`,
			"Attribute VB_Base = \"1Normal.ThisDocument\"",
			"Attribute VB_GlobalNameSpace = False",
			"Attribute VB_Creatable = False",
			"Attribute VB_PredeclaredId = True",
			"Attribute VB_Exposed = True",
			"Attribute VB_TemplateDerived = True",
			"Attribute VB_Customizable = True"
		].join("\r\n"),
		module: (name) => `Attribute VB_Name = "${name}"`,
		class: (name) => [
			`Attribute VB_Name = "${name}"`,
			"Attribute VB_Base = \"0{FCFB3D2A-A0FA-1068-A738-08002B3371B5}\"",
			"Attribute VB_GlobalNameSpace = False",
			"Attribute VB_Creatable = False",
			"Attribute VB_PredeclaredId = False",
			"Attribute VB_Exposed = False",
			"Attribute VB_TemplateDerived = False",
			"Attribute VB_Customizable = False"
		].join("\r\n")
	};
	var uint16 = (value) => [value & 255, value >> 8 & 255];
	var uint32 = (value) => [
		value & 255,
		value >> 8 & 255,
		value >> 16 & 255,
		value >>> 24 & 255
	];
	var utf16 = (text) => [...text].flatMap((character) => uint16(character.charCodeAt(0)));
	/**
	* A record of the project's module information: its id, the size of its data, then its data.
	*/
	var record = (id, data) => [
		...uint16(id),
		...uint32(data.length),
		...data
	];
	/**
	* Obfuscates one of the project's properties as VBA does, as hexadecimal digits: whether it is locked, its password and
	* whether it is shown.
	*
	* Reference: [MS-OVBA] 2.4.3.2 Encryption
	*
	* @param seed - Any byte. Its bits 1 and 2 are how many bytes of padding go before the data
	*/
	var obfuscate = (data, seed) => {
		const version = 2;
		const projectKey = [...PROJECT_ID].reduce((sum, character) => sum + character.charCodeAt(0) & 255, 0);
		const versionEncrypted = seed ^ version;
		const projectKeyEncrypted = seed ^ projectKey;
		const output = [
			seed,
			versionEncrypted,
			projectKeyEncrypted
		];
		let unencrypted = projectKey;
		let encrypted = projectKeyEncrypted;
		let previousEncrypted = versionEncrypted;
		const write = (byte) => {
			const value = (byte ^ previousEncrypted + unencrypted & 255) & 255;
			output.push(value);
			previousEncrypted = encrypted;
			encrypted = value;
			unencrypted = byte;
		};
		const padding = (seed & 6) / 2;
		for (let index = 0; index < padding; index++) write(0);
		for (const byte of [...uint32(data.length), ...data]) write(byte);
		return output.map((byte) => byte.toString(16).toUpperCase().padStart(2, "0")).join("");
	};
	/**
	* The PROJECT stream: the project's properties, as text.
	*
	* Reference: [MS-OVBA] 2.3.1 PROJECT Stream
	*/
	var createProjectStream = (modules) => {
		const items = modules.map(({ name, kind }) => kind === "document" ? `Document=${name}/&H00000000` : kind === "module" ? `Module=${name}` : `Class=${name}`);
		return encodeWindows1252([
			`ID="${PROJECT_ID}"`,
			...items,
			`Name="${PROJECT_NAME}"`,
			"HelpContextID=\"0\"",
			"VersionCompatible32=\"393222000\"",
			`CMG="${obfuscate(uint32(0), 138)}"`,
			`DPB="${obfuscate([0], 163)}"`,
			`GC="${obfuscate([255], 188)}"`,
			"",
			"[Host Extender Info]",
			"&H00000001={3832D640-CF90-11CF-8E43-00A0C911005A};VBE;&H00000000",
			"",
			"[Workspace]",
			...modules.map(({ name }) => `${name}=0, 0, 0, 0, C`)
		].map((line) => `${line}\r\n`).join(""), "The project");
	};
	/**
	* The PROJECTwm stream: the modules' names in Unicode too.
	*
	* Reference: [MS-OVBA] 2.3.3 PROJECTwm Stream
	*/
	var createNamesStream = (modules) => Uint8Array.from([
		...modules.flatMap(({ name }) => [
			...encodeWindows1252(name, "A module's name"),
			0,
			...utf16(name),
			0,
			0
		]),
		0,
		0
	]);
	/**
	* The dir stream: the project's information, the libraries it refers to and its modules, compressed.
	*
	* Reference: [MS-OVBA] 2.3.4.2 dir Stream
	*/
	var createDirStream = (modules) => {
		const name = (text) => [...encodeWindows1252(text, "A name")];
		const information = [
			...record(1, uint32(1)),
			...record(2, uint32(1033)),
			...record(20, uint32(1033)),
			...record(3, uint16(CODE_PAGE)),
			...record(4, name(PROJECT_NAME)),
			...record(5, []),
			...record(64, []),
			...record(6, []),
			...record(61, []),
			...record(7, uint32(0)),
			...record(8, uint32(0)),
			...uint16(9),
			...uint32(4),
			...uint32(1),
			...uint16(0),
			...record(12, []),
			...record(60, [])
		];
		const references = REFERENCES.flatMap((reference) => {
			const referenceName = [...record(22, name(reference.name)), ...record(62, utf16(reference.name))];
			if ("project" in reference) {
				const projectId = name(reference.project);
				return [...referenceName, ...record(14, [
					...uint32(projectId.length),
					...projectId,
					...uint32(projectId.length),
					...projectId,
					...uint32(1),
					...uint16(0)
				])];
			}
			const libraryId = name(reference.registered);
			return [...referenceName, ...record(13, [
				...uint32(libraryId.length),
				...libraryId,
				...uint32(0),
				...uint16(0)
			])];
		});
		const moduleRecords = modules.flatMap((module) => [
			...record(25, name(module.name)),
			...record(71, utf16(module.name)),
			...record(26, name(module.name)),
			...record(50, utf16(module.name)),
			...record(28, []),
			...record(72, []),
			...record(49, uint32(0)),
			...record(30, uint32(0)),
			...record(44, uint16(65535)),
			...record(module.kind === "module" ? 33 : 34, []),
			...record(43, [])
		]);
		return compress(Uint8Array.from([
			...information,
			...references,
			...record(15, uint16(modules.length)),
			...record(19, uint16(65535)),
			...moduleRecords,
			...record(16, [])
		]));
	};
	var NAME = /^[A-Za-z][A-Za-z0-9_]{0,30}$/;
	var EVENTS = new Map([
		"new",
		"open",
		"close",
		"sync",
		"xmlAfterInsert",
		"xmlBeforeDelete",
		"contentControlAfterAdd",
		"contentControlBeforeDelete",
		"contentControlOnExit",
		"contentControlOnEnter",
		"contentControlBeforeStoreUpdate",
		"contentControlBeforeContentUpdate",
		"buildingBlockInsert"
	].map((event) => [event.toUpperCase(), event]));
	var EVENT_HANDLER = /^[ \t]*(?:(?:Private|Public|Friend)[ \t]+)?(?:Static[ \t]+)?Sub[ \t]+Document_(\w+)[ \t]*\(/gim;
	/**
	* The events of the document that ThisDocument's code has a handler for, which Word runs the handlers of.
	*/
	var findEvents = (code) => [...new Set([...code.matchAll(EVENT_HANDLER)].flatMap(([, name]) => {
		var _EVENTS$get;
		return (_EVENTS$get = EVENTS.get(name.toUpperCase())) !== null && _EVENTS$get !== void 0 ? _EVENTS$get : [];
	}))];
	/**
	* Writes a document's VBA macros from their code, for the document's `macros`: the VBA project, and the events of the
	* document that ThisDocument's code handles, such as `Document_Open`. The document is then a macro-enabled document,
	* which Word opens from a .docm file. Word asks whether to enable its macros, as for any document with macros from
	* elsewhere.
	*
	* VBA keeps code in Windows-1252, the code page of Word in English and the other Western European languages, so a
	* character it doesn't have goes in a string as `ChrW`, such as `ChrW(&H4E2D)` for "中", or two for a character beyond
	* U+FFFF, such as `ChrW(&HD83D) & ChrW(&HDE00)` for "😀".
	*
	* Word compiles the code when it first runs a macro, so a mistake in it shows then, in the VBA editor.
	*
	* @publicApi
	*
	* @example
	* ```typescript
	* const doc = new Document({
	*   macros: createMacros({
	*     thisDocument: 'Private Sub Document_Open()\n    MsgBox "Hello"\nEnd Sub',
	*     modules: [{ name: "Formatting", code: "Sub MakeBold()\n    Selection.Font.Bold = True\nEnd Sub" }],
	*   }),
	*   sections: [{ children: [new Paragraph("Hello World")] }],
	* });
	* ```
	*
	* @throws If a module's name isn't a VBA name of up to 31 characters, or is taken: by another module, ignoring case, or
	* by ThisDocument, the project, Project, or a library it uses, VBA, Word, stdole, Normal or Office
	* @returns The document's macros, for its `macros`: the VBA project, and the events of the document it handles
	* @throws If code has a character Windows-1252 doesn't
	*/
	var createMacros = ({ thisDocument = "", modules = [], classModules = [] } = {}) => {
		const given = [...modules.map((module) => _objectSpread2(_objectSpread2({}, module), {}, { kind: "module" })), ...classModules.map((module) => _objectSpread2(_objectSpread2({}, module), {}, { kind: "class" }))];
		for (const [index, { name }] of given.entries()) {
			if (!NAME.test(name)) throw new Error(`Invalid module name "${name}". Expected a letter, then letters, digits and underscores, up to 31 of them, such as "Formatting"`);
			const taken = [...TAKEN_NAMES, ...given.slice(0, index).map((module) => module.name)].find((takenName) => takenName.toLowerCase() === name.toLowerCase());
			if (taken !== void 0) throw new Error(`Invalid module name "${name}". ${taken} is already a name in the project`);
		}
		const projectModules = [{
			name: "ThisDocument",
			kind: "document",
			code: thisDocument
		}, ...given].map(({ name, kind, code }) => {
			const lines = code.replace(/\r\n?/g, "\n").replace(/\n$/, "");
			return {
				name,
				kind,
				source: encodeWindows1252(`${ATTRIBUTES[kind](name)}\r\n${lines === "" ? "" : `${lines.replace(/\n/g, "\r\n")}\r\n`}`, `The code of ${name}`)
			};
		});
		return {
			project: createCompoundFile([
				{
					name: "VBA",
					children: [
						{
							name: "_VBA_PROJECT",
							data: Uint8Array.from([
								204,
								97,
								255,
								255,
								0,
								1,
								0
							])
						},
						{
							name: "dir",
							data: createDirStream(projectModules)
						},
						...projectModules.map(({ name, source }) => ({
							name,
							data: compress(source)
						}))
					]
				},
				{
					name: "PROJECT",
					data: createProjectStream(projectModules)
				},
				{
					name: "PROJECTwm",
					data: createNamesStream(projectModules)
				}
			]),
			events: findEvents(thisDocument)
		};
	};
	//#endregion
	exports.createMacros = createMacros;
	return exports;
})({});
