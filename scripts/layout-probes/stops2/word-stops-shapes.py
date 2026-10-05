# Prints what a Word PDF draws besides text: images (their drawn boxes) and paths (rectangles and lines), per page, in
# twips from the top and left margins (1440), for the rounds' probe PDFs, and with --text where each run of text starts
# and its baseline. Reads the PDF's own content streams.
#   python3 ../../scripts/layout-probes/stops2/word-stops-shapes.py <name>.pdf [--text]
#
# Each path is its bounds, with the extrema of its curves. An image is the bounds of its unit square in the drawing's
# matrix, so a turned one's are those of its turned box. A Form XObject (a group drawn through Do) is said to be one, and
# isn't read, as Word's probe PDFs draw none. The text's positions are those of the operators that place each run (Tm, Td,
# TD, T*, ' and "), which Word's PDFs use for every run: the glyphs' own advances aren't followed, so a run drawn right
# after another without one would show where that one starts.
import re, sys, zlib

MARGIN = 1440
TEXT = "--text" in sys.argv


def objects(data):
    found = {}
    for m in re.finditer(rb"(\d+)\s+(\d+)\s+obj\b(.*?)endobj", data, re.S):
        found[int(m.group(1))] = m.group(3)
    return found


def stream_of(body):
    m = re.search(rb"stream\r?\n", body)
    if not m:
        return None
    start = m.end()
    end = body.rfind(b"endstream")
    raw = body[start:end]
    if b"/FlateDecode" in body[: m.start()]:
        try:
            return zlib.decompress(raw)
        except zlib.error:
            return zlib.decompressobj().decompress(raw)
    return raw


def ref(body, key):
    m = re.search(rb"/" + key + rb"\s+(\d+)\s+0\s+R", body)
    return int(m.group(1)) if m else None


def pages_of(objs):
    root = next(b for b in objs.values() if re.search(rb"/Type\s*/Catalog", b))
    order = []

    def walk(b):
        if re.search(rb"/Type\s*/Pages", b):
            kids = re.search(rb"/Kids\s*\[(.*?)\]", b, re.S).group(1)
            for k in re.findall(rb"(\d+)\s+0\s+R", kids):
                walk(objs[int(k)])
        else:
            order.append(b)

    walk(objs[ref(root, b"Pages")])
    return order


def xobjects_of(page, objs):
    """Each XObject the page's resources name, by its name: its subtype, Image or Form"""
    resources = page
    n = ref(page, b"Resources")
    if n is not None:
        resources = objs[n]
    m = re.search(rb"/XObject\s*(<<.*?>>|\d+\s+0\s+R)", resources, re.S)
    if not m:
        return {}
    xobjects = m.group(1)
    if not xobjects.startswith(b"<<"):
        xobjects = objs[int(xobjects.split()[0])]
    found = {}
    for name, number in re.findall(rb"/(\w+)\s+(\d+)\s+0\s+R", xobjects):
        subtype = re.search(rb"/Subtype\s*/(\w+)", objs.get(int(number), b""))
        found[name.decode("latin1")] = subtype.group(1).decode("latin1") if subtype else "?"
    return found


def mul(a, b):
    return (
        a[0] * b[0] + a[1] * b[2],
        a[0] * b[1] + a[1] * b[3],
        a[2] * b[0] + a[3] * b[2],
        a[2] * b[1] + a[3] * b[3],
        a[4] * b[0] + a[5] * b[2] + b[4],
        a[4] * b[1] + a[5] * b[3] + b[5],
    )


def apply(m, x, y):
    return (m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5])


def curve_points(p0, p1, p2, p3):
    """The points of a cubic Bezier curve its bounds come from: its ends, and its extrema along each axis"""
    points = [p0, p3]
    for axis in (0, 1):
        a = -p0[axis] + 3 * p1[axis] - 3 * p2[axis] + p3[axis]
        b = 2 * (p0[axis] - 2 * p1[axis] + p2[axis])
        c = p1[axis] - p0[axis]
        roots = []
        if abs(a) < 1e-12:
            if abs(b) > 1e-12:
                roots.append(-c / b)
        else:
            d = b * b - 4 * a * c
            if d >= 0:
                roots += [(-b + d**0.5) / (2 * a), (-b - d**0.5) / (2 * a)]
        for t in roots:
            if 0 < t < 1:
                u = 1 - t
                points.append(tuple(u**3 * p0[i] + 3 * u**2 * t * p1[i] + 3 * u * t**2 * p2[i] + t**3 * p3[i] for i in (0, 1)))
    return points


def main():
    data = open(sys.argv[1], "rb").read()
    objs = objects(data)
    for number, page in enumerate(pages_of(objs), 1):
        mb = re.search(rb"/MediaBox\s*\[([^\]]*)\]", page)
        height = float(mb.group(1).split()[3]) if mb else 841.89
        xobjects = xobjects_of(page, objs)
        contents = ref(page, b"Contents")
        if contents is None:
            m = re.search(rb"/Contents\s*\[(.*?)\]", page, re.S)
            streams = [stream_of(objs[int(k)]) for k in re.findall(rb"(\d+)\s+0\s+R", m.group(1))]
            content = b"\n".join(s for s in streams if s)
        else:
            content = stream_of(objs[contents]) or b""
        tokens = re.findall(rb"/?[^\s\[\]<>(){}/%]+|\[|\]|<<|>>|\([^)]*\)", content)
        stack, ctm, saved, path = [], (1, 0, 0, 1, 0, 0), [], []
        tm = tlm = (1, 0, 0, 1, 0, 0)
        size, leading, name = 0, 0, ""

        def page_point(x, y):
            px, py = apply(ctm, x, y)
            return (round(px * 20 - MARGIN, 1), round((height - py) * 20 - MARGIN, 1))

        def bounds(kind, points, more=""):
            xs = [p[0] for p in points]
            ys = [p[1] for p in points]
            out.append(
                f"  {kind:11} x {min(xs):>6} to {max(xs):>6} ({max(xs) - min(xs):>5} wide)  y {min(ys):>6} to {max(ys):>6} ({max(ys) - min(ys):>5} tall)  {more}"
            )

        def curve(p1, p2, p3):
            """A curve from the path's last point through two control points, in the page's coordinates"""
            p0 = path[-1][1] if path else page_point(*p3)
            path.append(("c", page_point(*p3), curve_points(p0, page_point(*p1), page_point(*p2), page_point(*p3))))

        def next_line(tx, ty):
            nonlocal tm, tlm
            tm = tlm = mul((1, 0, 0, 1, tx, ty), tlm)

        def show_text():
            full = mul(tm, ctm)
            x, y = apply(full, 0, 0)
            out.append(f"  text        x {round(x * 20 - MARGIN, 1):>8}  baseline y {round((height - y) * 20 - MARGIN, 1):>8}  size {round(size * abs(full[3]), 2)}")

        out = []
        for t in tokens:
            s = t.decode("latin1")
            if re.fullmatch(r"-?\d*\.?\d+(e-?\d+)?", s):
                stack.append(float(s))
                continue
            if s.startswith("/"):
                name = s[1:]
                stack = []
                continue
            if s == "q":
                saved.append(ctm)
            elif s == "Q":
                ctm = saved.pop() if saved else ctm
            elif s == "cm" and len(stack) >= 6:
                ctm = mul(tuple(stack[-6:]), ctm)
            elif s == "re" and len(stack) >= 4:
                x, y, w, h = stack[-4:]
                path.append(("re", page_point(x, y), [page_point(x, y), page_point(x + w, y + h)]))
            elif s in ("m", "l") and len(stack) >= 2:
                point = page_point(stack[-2], stack[-1])
                path.append((s, point, [point]))
            elif s == "c" and len(stack) >= 6:
                curve(stack[-6:-4], stack[-4:-2], stack[-2:])
            elif s == "v" and len(stack) >= 4:
                # Its first control point is the current point
                p3 = page_point(stack[-2], stack[-1])
                p0 = path[-1][1] if path else p3
                path.append(("c", p3, curve_points(p0, p0, page_point(stack[-4], stack[-3]), p3)))
            elif s == "y" and len(stack) >= 4:
                curve(stack[-4:-2], stack[-2:], stack[-2:])
            elif s in ("S", "s", "f", "F", "f*", "B", "B*", "b", "b*", "n"):
                if path and s != "n":
                    kind = "fill" if s in ("f", "F", "f*") else "stroke" if s in ("S", "s") else "fill+stroke"
                    bounds(kind, [p for segment in path for p in segment[2]], f"{len(path)} segments")
                path = []
            elif s == "Do":
                corners = [page_point(0, 0), page_point(1, 0), page_point(0, 1), page_point(1, 1)]
                subtype = xobjects.get(name, "?")
                if subtype == "Form":
                    bounds("form", corners, f"{name} (a Form XObject, not read)")
                else:
                    bounds("image", corners, name)
            elif s == "BT":
                tm = tlm = (1, 0, 0, 1, 0, 0)
            elif s == "Tf" and stack:
                size = stack[-1]
            elif s == "TL" and stack:
                leading = stack[-1]
            elif s == "Tm" and len(stack) >= 6:
                tm = tlm = tuple(stack[-6:])
            elif s == "Td" and len(stack) >= 2:
                next_line(stack[-2], stack[-1])
            elif s == "TD" and len(stack) >= 2:
                leading = -stack[-1]
                next_line(stack[-2], stack[-1])
            elif s == "T*":
                next_line(0, -leading)
            elif s in ("'", '"'):
                next_line(0, -leading)
                if TEXT:
                    show_text()
            elif s in ("Tj", "TJ") and TEXT:
                show_text()
            stack = []
        if out:
            print(f"page {number}")
            print("\n".join(out))


main()
