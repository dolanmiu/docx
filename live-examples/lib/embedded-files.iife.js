var docxEmbeddedFiles = (function(exports, docx) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/embedded-files/embedded-file-type.ts
	var PACKAGE_RELATIONSHIP = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/package";
	/**
	* Office's own files, by extension, which are embedded as themselves, as Word embeds them, so Word opens each in its
	* application: Excel, Word or PowerPoint. Their ProgIDs are Office 2007's, which every version since opens.
	*/
	var OFFICE_FILE_TYPES = {
		xlsx: {
			progId: "Excel.Sheet.12",
			partName: "Microsoft_Excel_Worksheet",
			extension: "xlsx",
			contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			relationshipType: PACKAGE_RELATIONSHIP
		},
		xlsm: {
			progId: "Excel.SheetMacroEnabled.12",
			partName: "Microsoft_Excel_Macro-enabled_Worksheet",
			extension: "xlsm",
			contentType: "application/vnd.ms-excel.sheet.macroEnabled.12",
			relationshipType: PACKAGE_RELATIONSHIP
		},
		docx: {
			progId: "Word.Document.12",
			partName: "Microsoft_Word_Document",
			extension: "docx",
			contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			relationshipType: PACKAGE_RELATIONSHIP
		},
		docm: {
			progId: "Word.DocumentMacroEnabled.12",
			partName: "Microsoft_Word_Macro-enabled_Document",
			extension: "docm",
			contentType: "application/vnd.ms-word.document.macroEnabled.12",
			relationshipType: PACKAGE_RELATIONSHIP
		},
		pptx: {
			progId: "PowerPoint.Show.12",
			partName: "Microsoft_PowerPoint_Presentation",
			extension: "pptx",
			contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
			relationshipType: PACKAGE_RELATIONSHIP
		},
		pptm: {
			progId: "PowerPoint.ShowMacroEnabled.12",
			partName: "Microsoft_PowerPoint_Macro-enabled_Presentation",
			extension: "pptm",
			contentType: "application/vnd.ms-powerpoint.presentation.macroEnabled.12",
			relationshipType: PACKAGE_RELATIONSHIP
		}
	};
	/**
	* Any other file, which is embedded in an OLE package, as Word embeds a file no application on the computer embeds
	* itself, such as a sound, a video or a PDF.
	*/
	var PACKAGE_FILE_TYPE = {
		progId: "Package",
		partName: "oleObject",
		extension: "bin",
		contentType: "application/vnd.openxmlformats-officedocument.oleObject",
		relationshipType: "http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject"
	};
	/**
	* How a file is embedded, from the extension of its name: as itself for Office's own files, such as "budget.xlsx", and
	* in an OLE package for any other.
	*/
	var embeddedFileTypeOf = (fileName) => {
		var _exec;
		const extension = (_exec = /\.([^.]+)$/.exec(fileName)) === null || _exec === void 0 ? void 0 : _exec[1].toLowerCase();
		return extension !== void 0 && Object.hasOwn(OFFICE_FILE_TYPES, extension) ? OFFICE_FILE_TYPES[extension] : PACKAGE_FILE_TYPE;
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
	//#region src/embedded-files/ole-package.ts
	/**
	* Writes an OLE package, the OLE object Windows' Object Packager keeps a file in, so Word can embed a file no
	* application embeds itself, such as a sound, a video or a PDF.
	*
	* The package is a compound file, as Word writes one: its root's class is the packager's, and it has three streams.
	* "\1Ole10Native" holds the file, with its name. "\1CompObj" names the packager. "\3ObjInfo" tells Word to show
	* the package as an icon.
	*
	The packager's data in "\1Ole10Native" isn't documented, so it is written as Word writes it, which Apache POI's
	* Ole10Native writes too, and LibreOffice's ownview.cxx reads.
	*
	* References:
	* - [MS-OLEDS] 2.3.6 OLENativeStream and 2.3.8 CompObjStream
	* - [MS-DOC] ODT, the structure "\3ObjInfo" holds: https://learn.microsoft.com/en-us/openspecs/office_file_formats/ms-doc/641974b2-ba6c-4615-81a9-285f7d82cf67
	*
	* @module
	*/
	/** The class of the packager's objects, which Windows names Package */
	var PACKAGE_CLASS_ID = "0003000C-0000-0000-C000-000000000046";
	/**
	* Writes the bytes of a run of fields: unsigned 16 and 32-bit little-endian numbers, and bytes.
	*/
	var concat = (fields) => {
		const length = fields.reduce((total, field) => total + (field instanceof Uint8Array ? field.length : field[0] === "u16" ? 2 : 4), 0);
		const bytes = new Uint8Array(length);
		const view = new DataView(bytes.buffer);
		let offset = 0;
		for (const field of fields) if (field instanceof Uint8Array) {
			bytes.set(field, offset);
			offset += field.length;
		} else if (field[0] === "u16") {
			view.setUint16(offset, field[1], true);
			offset += 2;
		} else {
			view.setUint32(offset, field[1], true);
			offset += 4;
		}
		return bytes;
	};
	/**
	* A string in the computer's ANSI code page, with a terminating NUL. Only ASCII is the same in every code page, so any
	* other character is "_": Word takes the file's name from the package's Unicode copies of its strings.
	*/
	var ansi = (text) => Uint8Array.from([...Array.from(text, (character) => character.length === 1 && character.charCodeAt(0) < 128 ? character.charCodeAt(0) : 95), 0]);
	/**
	* A string in UTF-16, little-endian, without a terminator.
	*/
	var unicode = (text) => {
		const bytes = new Uint8Array(text.length * 2);
		const view = new DataView(bytes.buffer);
		for (let index = 0; index < text.length; index++) view.setUint16(index * 2, text.charCodeAt(index), true);
		return bytes;
	};
	/**
	* The packager's native data, in the "\1Ole10Native" stream: the file's label, the path it was packaged from, the path
	* it is unpacked to, each in ANSI, then the file, then the three strings again in Unicode. The packager unpacks the file
	* to a file named as the last of the paths, so its extension says what the file opens with. Each is the file's name, as
	* a document made with docx has no path for it.
	*/
	var createNativeData = (fileName, data) => {
		const name = ansi(fileName);
		const unicodeName = [["u32", fileName.length], unicode(fileName)];
		const body = concat([
			["u16", 2],
			name,
			name,
			["u16", 0],
			["u16", 3],
			["u32", name.length],
			name,
			["u32", data.length],
			data,
			...unicodeName,
			...unicodeName,
			...unicodeName
		]);
		return concat([["u32", body.length], body]);
	};
	/**
	* The "\1CompObj" stream, as Word writes it for a package: the header with the packager's class, its type's name, no
	* clipboard format, and its ProgID, then empty Unicode copies.
	*/
	var createCompObj = () => concat([
		["u32", 4294836225],
		["u32", 2563],
		["u32", 4294967295],
		["u32", 196620],
		["u16", 0],
		["u16", 0],
		Uint8Array.from([
			192,
			0,
			0,
			0,
			0,
			0,
			0,
			70
		]),
		["u32", 12],
		ansi("OLE Package"),
		["u32", 0],
		["u32", 8],
		ansi("Package"),
		["u32", 1907505652],
		["u32", 0],
		["u32", 0],
		["u32", 0]
	]);
	/**
	* The "\3ObjInfo" stream ([MS-DOC] ODT): the object is shown as an icon, in a metafile, as Word writes it for a package.
	*/
	var OBJECT_INFO = Uint8Array.from([
		64,
		0,
		3,
		0,
		1,
		0
	]);
	/**
	* Writes an OLE package of a file, as Word embeds one in word/embeddings/oleObject1.bin.
	*/
	var createOlePackage = ({ fileName, data }) => createCompoundFile([
		{
			name: "Ole10Native",
			data: createNativeData(fileName, data)
		},
		{
			name: "CompObj",
			data: createCompObj()
		},
		{
			name: "ObjInfo",
			data: OBJECT_INFO
		}
	], { classId: PACKAGE_CLASS_ID });
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
	//#region src/embedded-files/picture-frame-shape-type.ts
	/**
	* The picture frame shape type, which Word draws an embedded object's picture in.
	*
	* @module
	*/
	var FORMULAS = [
		"if lineDrawn pixelLineWidth 0",
		"sum @0 1 0",
		"sum 0 0 @1",
		"prod @2 1 2",
		"prod @3 21600 pixelWidth",
		"prod @3 21600 pixelHeight",
		"sum @0 0 1",
		"prod @6 1 2",
		"prod @7 21600 pixelWidth",
		"sum @8 21600 0",
		"prod @7 21600 pixelHeight",
		"sum @10 21600 0"
	];
	/**
	* The parts being written that have the shape type already. Each part is written with a context of its own, so a part
	* written again, such as when a document is packed twice, has it again.
	*/
	var writtenIn = /* @__PURE__ */ new WeakSet();
	/**
	* The picture frame shape type (`_x0000_t75`), Office's preset shape 75, as Word writes it in an embedded object. Its
	* shape (`v:shape`) refers to it as `#_x0000_t75`.
	*
	* It is written in the first object of each part it is in, the document, a header or the footnotes, as Word writes it,
	* and left out of the rest: a part can't have two elements with the same id.
	*
	* ```xml
	* <v:shapetype id="_x0000_t75" coordsize="21600,21600" o:spt="75" o:preferrelative="t" path="m@4@5l@4@11@9@11@9@5xe"
	*   filled="f" stroked="f">
	*   <v:stroke joinstyle="miter"/>
	*   <v:formulas><v:f eqn="if lineDrawn pixelLineWidth 0"/>...</v:formulas>
	*   <v:path o:extrusionok="f" gradientshapeok="t" o:connecttype="rect"/>
	*   <o:lock v:ext="edit" aspectratio="t"/>
	* </v:shapetype>
	* ```
	*/
	var PictureFrameShapeType = class extends docx.XmlComponent {
		constructor() {
			super("v:shapetype");
			_defineProperty(this, "shapeType", new docx.BuilderElement({
				name: "v:shapetype",
				attributes: {
					id: {
						key: "id",
						value: "_x0000_t75"
					},
					coordinateSize: {
						key: "coordsize",
						value: "21600,21600"
					},
					presetShapeType: {
						key: "o:spt",
						value: 75
					},
					preferRelative: {
						key: "o:preferrelative",
						value: "t"
					},
					path: {
						key: "path",
						value: "m@4@5l@4@11@9@11@9@5xe"
					},
					filled: {
						key: "filled",
						value: "f"
					},
					stroked: {
						key: "stroked",
						value: "f"
					}
				},
				children: [
					new docx.BuilderElement({
						name: "v:stroke",
						attributes: { joinStyle: {
							key: "joinstyle",
							value: "miter"
						} }
					}),
					new docx.BuilderElement({
						name: "v:formulas",
						children: FORMULAS.map((equation) => new docx.BuilderElement({
							name: "v:f",
							attributes: { equation: {
								key: "eqn",
								value: equation
							} }
						}))
					}),
					new docx.BuilderElement({
						name: "v:path",
						attributes: {
							extrusionOk: {
								key: "o:extrusionok",
								value: "f"
							},
							gradientShapeOk: {
								key: "gradientshapeok",
								value: "t"
							},
							connectType: {
								key: "o:connecttype",
								value: "rect"
							}
						}
					}),
					new docx.BuilderElement({
						name: "o:lock",
						attributes: {
							extension: {
								key: "v:ext",
								value: "edit"
							},
							aspectRatio: {
								key: "aspectratio",
								value: "t"
							}
						}
					})
				]
			}));
		}
		prepForXml(context) {
			if (writtenIn.has(context)) return;
			writtenIn.add(context);
			return this.shapeType.prepForXml(context);
		}
	};
	//#endregion
	//#region src/embedded-files/embedded-file-run.ts
	/**
	* Embedded file run module: a file embedded in a document as an OLE object, such as a workbook, a presentation, a sound
	* or a video, which opens from the document.
	*
	* Reference: http://officeopenxml.com/WPembeddedObjects.php
	*
	* @module
	*/
	/** The image formats Word draws an embedded file's picture in */
	var PREVIEW_TYPES = /* @__PURE__ */ new Set([
		"jpg",
		"png",
		"gif",
		"bmp"
	]);
	/** Number of English Metric Units in one pixel at 96 dpi. */
	var EMUS_PER_PIXEL = 9525;
	/** Number of points in one pixel at 96 dpi. */
	var POINTS_PER_PIXEL = .75;
	var objectNumber = (0, docx.uniqueNumericIdCreator)(1e9);
	/**
	* The object's OLE data (`o:OLEObject`): the application it is for, the shape it is drawn as, and the part its file is
	* in, which is added to the package, with the relationship to it, when it is written.
	*/
	var OleObject = class extends docx.XmlComponent {
		constructor(part, { progId, shapeId, displayAsIcon }) {
			super("o:OLEObject");
			_defineProperty(this, "part", void 0);
			this.part = part;
			this.root.push(new docx.NextAttributeComponent({
				type: {
					key: "Type",
					value: "Embed"
				},
				progId: {
					key: "ProgID",
					value: progId
				},
				shapeId: {
					key: "ShapeID",
					value: shapeId
				},
				drawAspect: {
					key: "DrawAspect",
					value: displayAsIcon ? "Icon" : "Content"
				},
				objectId: {
					key: "ObjectID",
					value: `_${objectNumber()}`
				},
				id: {
					key: "r:id",
					value: part.relationshipId
				}
			}));
		}
		prepForXml(context) {
			this.part.addTo(context);
			return super.prepForXml(context);
		}
	};
	/**
	* The bytes of data given as a Buffer, Uint8Array, ArrayBuffer or base64-encoded data URI string.
	*/
	var bytesOf = (data) => {
		const standardized = (0, docx.standardizeData)(data);
		return ArrayBuffer.isView(standardized) ? new Uint8Array(standardized.buffer, standardized.byteOffset, standardized.byteLength) : new Uint8Array(standardized);
	};
	/**
	* Represents a file embedded in a WordprocessingML document, as Word's Insert > Object > "Create from File" embeds one:
	* an OLE object, drawn as a picture of it, that opens the file from the document.
	*
	* An Excel workbook, Word document or PowerPoint presentation is embedded as itself, so Word opens it in its
	* application, which can change it in the document. Any other file, such as a sound, a video or a PDF, is embedded in an
	* OLE package, which Word for Windows opens with the application the computer opens its type with, as it does a file
	* embedded there. Word for Mac shows it, but can't open it.
	*
	* The document shows the picture given in `preview`, of the file's content or an icon, until the file is opened. The
	* object sits inline with text, in a paragraph, including in a table, header, footer or footnote.
	*
	* Reference: http://officeopenxml.com/WPembeddedObjects.php
	*
	* @publicApi
	*
	* ## XSD Schema
	* The embedded file combines several elements:
	* - w:r (run container)
	* - w:object (the embedded object, with its original size)
	* - v:shapetype and v:shape (the picture frame it's drawn in)
	* - v:imagedata (the picture)
	* - o:OLEObject (the application it is for, and the part the file is in)
	*
	* @example
	* ```typescript
	* new Paragraph({
	*   children: [
	*     new EmbeddedFileRun({
	*       fileName: "budget.xlsx",
	*       data: fs.readFileSync("./budget.xlsx"),
	*       preview: { type: "png", data: fs.readFileSync("./budget.png") },
	*       transformation: { width: 240, height: 120 },
	*     }),
	*   ],
	* });
	* ```
	*/
	var EmbeddedFileRun = class extends docx.Run {
		/**
		* @throws If the file is an Excel workbook, Word document or PowerPoint presentation that isn't a zip file, as Office's
		* files are, so Office couldn't open it, such as an older Excel workbook (.xls) named .xlsx
		* @throws If the preview's type isn't "jpg", "png", "gif" or "bmp", such as when JavaScript leaves it out
		*/
		constructor({ fileName, data, preview, transformation, displayAsIcon = false, altText }) {
			super({});
			_defineProperty(this, "preview", void 0);
			if (!PREVIEW_TYPES.has(preview.type)) throw new Error(`EmbeddedFileRun: the preview's type is "${preview.type}". Expected "jpg", "png", "gif" or "bmp"`);
			const fileType = embeddedFileTypeOf(fileName);
			const file = bytesOf(data);
			const packaged = fileType === PACKAGE_FILE_TYPE;
			if (!packaged && !(file[0] === 80 && file[1] === 75 && file[2] === 3 && file[3] === 4)) throw new Error(`EmbeddedFileRun: "${fileName}" isn't an Office Open XML file, which is a zip file, so Office couldn't open it. Name it with its own extension, such as .xls, to embed it in an OLE package`);
			const part = new docx.PackagePart({
				folder: "embeddings",
				name: fileType.partName,
				extension: fileType.extension,
				contentType: fileType.contentType,
				relationshipType: fileType.relationshipType,
				content: packaged ? createOlePackage({
					fileName,
					data: file
				}) : file
			});
			const previewFileName = `${(0, docx.hashedId)(preview.data)}.${preview.type}`;
			this.preview = {
				type: preview.type,
				data: (0, docx.standardizeData)(preview.data),
				fileName: previewFileName,
				transformation: {
					pixels: {
						x: Math.round(transformation.width),
						y: Math.round(transformation.height)
					},
					emus: {
						x: Math.round(transformation.width * EMUS_PER_PIXEL),
						y: Math.round(transformation.height * EMUS_PER_PIXEL)
					}
				}
			};
			const width = Math.round(transformation.width * POINTS_PER_PIXEL * 100) / 100;
			const height = Math.round(transformation.height * POINTS_PER_PIXEL * 100) / 100;
			const shapeId = `EmbeddedFile${(0, docx.uniqueId)()}`;
			this.root.push(new docx.BuilderElement({
				name: "w:object",
				attributes: {
					width: {
						key: "w:dxaOrig",
						value: Math.round(width * 20)
					},
					height: {
						key: "w:dyaOrig",
						value: Math.round(height * 20)
					}
				},
				children: [
					new PictureFrameShapeType(),
					new docx.BuilderElement({
						name: "v:shape",
						attributes: {
							id: {
								key: "id",
								value: shapeId
							},
							type: {
								key: "type",
								value: "#_x0000_t75"
							},
							alt: {
								key: "alt",
								value: altText
							},
							style: {
								key: "style",
								value: `width:${width}pt;height:${height}pt`
							},
							ole: {
								key: "o:ole",
								value: ""
							}
						},
						children: [new docx.BuilderElement({
							name: "v:imagedata",
							attributes: {
								id: {
									key: "r:id",
									value: `rId{${previewFileName}}`
								},
								title: {
									key: "o:title",
									value: ""
								}
							}
						})]
					}),
					new OleObject(part, {
						progId: fileType.progId,
						shapeId,
						displayAsIcon: packaged || displayAsIcon
					})
				]
			}));
		}
		prepForXml(context) {
			context.file.Media.addImage(this.preview.fileName, this.preview);
			return super.prepForXml(context);
		}
	};
	//#endregion
	exports.EmbeddedFileRun = EmbeddedFileRun;
	return exports;
})({}, docx);
