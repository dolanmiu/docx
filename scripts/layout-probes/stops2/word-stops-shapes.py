# Prints what a Word PDF draws besides text: images (their drawn boxes) and paths (rectangles and lines), per page, in
# twips from the top and left margins (1440), for the rounds' probe PDFs. Reads the PDF's own content streams.
#   python3 pdf-shapes.py <name>.pdf
import re, sys, zlib

MARGIN = 1440

def objects(data):
    found = {}
    for m in re.finditer(rb'(\d+)\s+(\d+)\s+obj\b(.*?)endobj', data, re.S):
        found[int(m.group(1))] = m.group(3)
    return found

def stream_of(body):
    m = re.search(rb'stream\r?\n', body)
    if not m:
        return None
    start = m.end()
    end = body.rfind(b'endstream')
    raw = body[start:end]
    if b'/FlateDecode' in body[:m.start()]:
        try:
            return zlib.decompress(raw)
        except zlib.error:
            return zlib.decompressobj().decompress(raw)
    return raw

def ref(body, key):
    m = re.search(rb'/' + key + rb'\s+(\d+)\s+0\s+R', body)
    return int(m.group(1)) if m else None

def pages_of(objs):
    root = None
    for n, b in objs.items():
        if re.search(rb'/Type\s*/Catalog', b):
            root = b
    pages_obj = objs[ref(root, b'Pages')]
    order = []
    def walk(b):
        if re.search(rb'/Type\s*/Pages', b):
            kids = re.search(rb'/Kids\s*\[(.*?)\]', b, re.S).group(1)
            for k in re.findall(rb'(\d+)\s+0\s+R', kids):
                walk(objs[int(k)])
        else:
            order.append(b)
    walk(pages_obj)
    return order

def mul(a, b):
    return (a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3], a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3],
            a[4]*b[0]+a[5]*b[2]+b[4], a[4]*b[1]+a[5]*b[3]+b[5])

def apply(m, x, y):
    return (m[0]*x+m[2]*y+m[4], m[1]*x+m[3]*y+m[5])

TEXT = '--text' in sys.argv
def main():
    data = open(sys.argv[1], 'rb').read()
    objs = objects(data)
    for number, page in enumerate(pages_of(objs), 1):
        mb = re.search(rb'/MediaBox\s*\[([^\]]*)\]', page)
        height = float(mb.group(1).split()[3]) if mb else 841.89
        contents = ref(page, b'Contents')
        if contents is None:
            m = re.search(rb'/Contents\s*\[(.*?)\]', page, re.S)
            streams = [stream_of(objs[int(k)]) for k in re.findall(rb'(\d+)\s+0\s+R', m.group(1))]
            content = b'\n'.join(s for s in streams if s)
        else:
            content = stream_of(objs[contents]) or b''
        tokens = re.findall(rb'/?[^\s\[\]<>(){}/%]+|\[|\]|<<|>>|\([^)]*\)', content)
        stack, ctm, saved, path = [], (1,0,0,1,0,0), [], []
        T = lambda x, y: (round((apply(ctm, x, y)[0]) * 20 - MARGIN, 1), round((height - apply(ctm, x, y)[1]) * 20 - MARGIN, 1))
        tm = tlm = (1,0,0,1,0,0); size = 0
        out = []
        for t in tokens:
            s = t.decode('latin1')
            if re.fullmatch(r'-?\d*\.?\d+(e-?\d+)?', s):
                stack.append(float(s)); continue
            if s == 'q': saved.append(ctm)
            elif s == 'Q': ctm = saved.pop() if saved else ctm
            elif s == 'cm' and len(stack) >= 6: ctm = mul(tuple(stack[-6:]), ctm)
            elif s == 're' and len(stack) >= 4:
                x, y, w, h = stack[-4:]
                path.append(('re', T(x, y), T(x+w, y+h)))
            elif s == 'm' and len(stack) >= 2: path.append(('m', T(stack[-2], stack[-1])))
            elif s == 'l' and len(stack) >= 2: path.append(('l', T(stack[-2], stack[-1])))
            elif s == 'c' and len(stack) >= 6: path.append(('c', T(stack[-2], stack[-1])))
            elif s in ('S', 's', 'f', 'F', 'f*', 'B', 'B*', 'b', 'b*', 'n'):
                if path:
                    pts = []
                    for p in path:
                        if p[0] == 're': pts += [p[1], p[2]]
                        else: pts.append(p[1])
                    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
                    kind = 'fill' if s in ('f','F','f*') else 'clip' if s == 'n' else 'stroke' if s in ('S','s') else 'fill+stroke'
                    if s != 'n':
                        out.append(f"  {kind:11} x {min(xs):>6} to {max(xs):>6} ({max(xs)-min(xs):>5} wide)  y {min(ys):>6} to {max(ys):>6} ({max(ys)-min(ys):>5} tall)  {len(path)} segments")
                path = []
            elif s == 'BT': tm = tlm = (1,0,0,1,0,0)
            elif s == 'Tf' and stack: size = stack[-1]
            elif s == 'Tm' and len(stack) >= 6: tm = tlm = tuple(stack[-6:])
            elif s == 'Td' and len(stack) >= 2: tm = tlm = mul((1,0,0,1,stack[-2],stack[-1]), tlm)
            elif s in ('Tj', 'TJ') and TEXT:
                full = mul(tm, ctm)
                x, y = apply(full, 0, 0)
                out.append(f"  text        x {round(x*20-MARGIN,1):>8}  baseline y {round((height-y)*20-MARGIN,1):>8}  size {round(size*abs(full[3]),2)}")
            elif s == 'Do':
                (x0, y0), (x1, y1) = T(0, 0), T(1, 1)
                out.append(f"  image       x {min(x0,x1):>6} to {max(x0,x1):>6} ({abs(x1-x0):>5} wide)  y {min(y0,y1):>6} to {max(y0,y1):>6} ({abs(y1-y0):>5} tall)  {stack[-1] if stack else ''}")
            elif s == 'w' and stack:
                out.append(f"  line width {stack[-1]*20:.1f} twips") if False else None
            if s in ('cm', 're', 'm', 'l', 'c', 'Do', 'w', 'Td', 'TD', 'Tm', 'Tj', 'TJ', 'Tf', 'Tc', 'Tw', 'Tz', 'TL', 'Ts', 'd0', 'd1', 'g', 'rg', 'G', 'RG', 'k', 'K', 'gs', 'd', 'i', 'J', 'j', 'M', 'ri', 'sc', 'scn', 'SC', 'SCN', 'cs', 'CS', 'v', 'y', 'h', 'W', 'W*', 'BT', 'ET', 'Tr', 'BDC', 'EMC', 'BMC') or not re.fullmatch(r'[A-Za-z*\'"]+', s):
                stack = []
        if out:
            print(f"page {number}")
            print("\n".join(out))

main()
