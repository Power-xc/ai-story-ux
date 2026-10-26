#!/usr/bin/env python3
"""content/answers.md -> index.html (web) and print.html (A4).

The answer text is parsed from the markdown, never retyped, so wording and
numbers stay verbatim. Layout-only additions (labels, links, figures) live here.
Run from the repo root: python3 tools/build.py
"""
import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://power-xc.github.io/ai-story-ux/"
FONT_CSS = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"

# (kind, number) -> (scenario, sub, label). No entry = no matching prototype state.
TRY = {
    ("원칙", 1): ("e", "choice", "E · 선택지로 이어 가기"),
    ("원칙", 2): ("e", "dial", "E · 관전/선택/직접 쓰기"),
    ("원칙", 3): ("e", "memory", "E · 기억"),
    ("해결", 1): ("a", "", "A · 과정 보여 주기"),
    ("해결", 2): ("b", "", "B · 근거 연결"),
    ("해결", 3): ("c", "", "C · 위험 수준별 표시"),
    ("해결", 4): ("d", "", "D · 사유 있는 복구"),
}
# first-column text of the "크랙에 옮기면" table -> (scenario, sub, label)
TRY_ROWS = {
    "과정 보여 주기": ("e", "scene", "E · 지난 이야기"),
    "근거 연결": ("e", "menu", "E · 따른 설정"),
    "사유 있는 복구": ("e", "menu", "E · 다시 쓰기 메뉴"),
}


def esc(s):
    return html.escape(s, quote=False)


def inline(s):
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", esc(s))


def parse(md):
    nodes, lines, i = [], md.splitlines(), 0
    while i < len(lines):
        ln = lines[i]
        if not ln.strip():
            i += 1
        elif ln.startswith("# "):
            nodes.append(("h1", ln[2:])); i += 1
        elif ln.startswith("## "):
            nodes.append(("h2", ln[3:])); i += 1
        elif ln.startswith("### "):
            nodes.append(("h3", ln[4:])); i += 1
        elif ln.strip() == "---":
            i += 1
        elif ln.startswith("> "):
            nodes.append(("quote", ln[2:])); i += 1
        elif ln.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(set(c) <= set("-: ") for c in cells):
                    rows.append(cells)
                i += 1
            nodes.append(("table", rows))
        elif re.match(r"\s*- ", ln):
            items = []
            while i < len(lines) and re.match(r"\s*- ", lines[i]):
                if lines[i].startswith("  "):
                    items[-1][1].append(lines[i].strip()[2:])
                else:
                    items.append((lines[i][2:], []))
                i += 1
            nodes.append(("ul", items))
        else:
            nodes.append(("p", ln)); i += 1
    return nodes


def split_sections(nodes):
    """-> (title, [(h2, [(h3 or None, [body nodes])])])"""
    title, secs = None, []
    for kind, val in nodes:
        if kind == "h1":
            title = val
        elif kind == "h2":
            secs.append((val, []))
        elif kind == "h3":
            secs[-1][1].append((val, []))
        elif secs:
            if not secs[-1][1]:
                secs[-1][1].append((None, []))
            secs[-1][1][-1][1].append((kind, val))
    return title, secs


def render_table(rows, mode):
    head, body = rows[0], rows[1:]
    out = ['<table>', '<thead><tr>' + "".join(f'<th scope="col">{inline(c)}</th>' for c in head) + '</tr></thead><tbody>']
    for r in body:
        cells = []
        for j, c in enumerate(r):
            extra = ""
            hit = TRY_ROWS.get(r[0]) if j == len(r) - 1 and mode == "web" else None
            if hit:
                extra = f' {try_link(hit, mode, "row")}'
            if j == 0:
                cells.append(f'<th scope="row">{inline(c)}</th>')
            else:
                cells.append(f'<td data-label="{esc(head[j])}">{inline(c)}{extra}</td>')
        out.append("<tr>" + "".join(cells) + "</tr>")
    out.append("</tbody></table>")
    return "".join(out)


def try_link(t, mode, cls="card"):
    scn, sub, label = t
    if mode == "print":
        href = f"{SITE_URL}#proto-{scn}" + (f"-{sub}" if sub else "")
        return f'<a class="try try-{cls}" href="{href}">▶ 직접 눌러 보기 ({label})</a>'
    href = f"#proto-{scn}" + (f"-{sub}" if sub else "")
    return f'<a class="try try-{cls}" href="{href}">프로토타입에서 보기 · {label}</a>'


def render_flow(text):
    parts = text.split(" → ")
    lis = []
    for n, p in enumerate(parts, 1):
        m = re.match(r"(.+?)(\(.+\))$", p)
        main, tag = (m.group(1), m.group(2)) if m else (p, "")
        lis.append(f'<li><span class="flow-n" aria-hidden="true">{n}</span><strong>{esc(main)}</strong> <small>{esc(tag)}</small></li>')
    return '<ol class="flow" aria-label="네 단계">' + "".join(lis) + "</ol>"


KV = re.compile(r"^\*\*(.+?)\*\* (.+)$")


def render_kv(items):
    rows = "".join(f'<div><dt>{esc(KV.match(t).group(1))}</dt><dd>{inline(KV.match(t).group(2))}</dd></div>' for t, _ in items)
    return f'<dl class="kv">{rows}</dl>'


def render_body(nodes, mode):
    out = []
    for kind, val in nodes:
        if kind == "ul" and all(KV.match(t) and not subs for t, subs in val):
            out.append(render_kv(val))
        elif kind == "p":
            lbl = " lbl" if val.startswith("**") else ""
            out.append(f'<p class="{lbl.strip()}">{inline(val)}</p>' if lbl else f"<p>{inline(val)}</p>")
        elif kind == "ul":
            lis = []
            for text, subs in val:
                sub = "<ul>" + "".join(f"<li>{inline(s)}</li>" for s in subs) + "</ul>" if subs else ""
                lis.append(f"<li>{inline(text)}{sub}</li>")
            out.append("<ul>" + "".join(lis) + "</ul>")
        elif kind == "table":
            out.append(f'<div class="tablewrap">{render_table(val, mode)}</div>')
        elif kind == "quote":
            out.append(render_flow(val))
    return "\n".join(out)


def slug(h3):
    m = re.match(r"(원칙|해결) (\d)\.", h3 or "")
    return {"원칙": "p", "해결": "s"}[m.group(1)] + m.group(2) if m else None


def render_sub(h3, body, mode, figures):
    m = re.match(r"(원칙|해결) (\d)\. (.+)", h3 or "")
    if m:
        kind, num, name = m.group(1), int(m.group(2)), m.group(3)
        link = try_link(TRY[(kind, num)], mode) if (kind, num) in TRY else ""
        fig = figures.get((kind, num), "")
        return (f'<article class="card card-{"p" if kind == "원칙" else "s"}" id="{slug(h3)}">'
                f'<h3><span class="num">{kind} {num}.</span> {esc(name)}</h3>\n{render_body(body, mode)}\n{link}</article>{fig}')
    if h3 is None:
        return render_body(body, mode)
    fig = figures.get(h3, "")
    cls = "sub sub-" + {"출발점": "start", "무엇부터 할까": "first"}.get(h3, "plain")
    ident = {"무엇부터 할까": ' id="first"', '크랙에 옮기면: "설정 할루시네이션"': ' id="crack"'}.get(h3, "")
    return f'<section class="{cls}"{ident}><h3>{inline(h3)}</h3>\n{render_body(body, mode)}{fig}</section>'


def render_sections(secs, mode, figures):
    out = []
    for n, (h2, subs) in enumerate(secs):
        m = re.match(r"(\d)\. (.+)", h2)
        inner = "\n".join(render_sub(h3, body, mode, figures) for h3, body in subs)
        if not m:
            out.append(f'<section class="question summary" id="summary"><h2>{esc(h2)}</h2>\n{inner}</section>')
            continue
        out.append(f'<section class="question" id="q{m.group(1)}" aria-labelledby="q{m.group(1)}-h">'
                   f'<h2 id="q{m.group(1)}-h"><span class="qn">{m.group(1)}번 문항</span> <span class="qt">{esc(h2)}</span></h2>\n{inner}</section>')
    return "\n".join(out)


def print_try(kind, num):
    t = TRY.get((kind, num))
    if not t:
        return ""
    scn, sub, label = t
    href = f"{SITE_URL}#proto-{scn}" + (f"-{sub}" if sub else "")
    return f'<a class="try" href="{href}">▶ 프로토타입 {esc(label)}</a>'


CRACK = "크랙에 옮기면: "


def print_crack(h3, body, figures):
    """Last page: the applied case, its two-step strip, then the closing line."""
    *main, last = body
    return (f'<section class="crack"><div class="q-head"><span class="q-n">2번 문항 · 크랙에 옮기면</span>'
            f'<h2>{inline(h3[len(CRACK):])}</h2></div>'
            f'<div class="crack-x">{render_body(main, "print")}</div>'
            f'<div class="strip strip-2">{figures.get("crack", "")}</div>'
            f'<div class="close">{render_body([last], "print")}</div></section>')


def print_row(h3, body, figures):
    if (h3 or "").startswith(CRACK):
        return print_crack(h3, body, figures)
    m = re.match(r"(원칙|해결) (\d)\. (.+)", h3 or "")
    if m:
        kind, num, name = m.group(1), int(m.group(2)), m.group(3)
        head = f'<span class="n">{kind} {num}</span><h3>{esc(name)}</h3>{print_try(kind, num)}'
        fig = figures.get((kind, num), "")
    elif h3:
        head, fig = f"<h3>{inline(h3)}</h3>", figures.get(h3, "")
    else:
        return f'<div class="lead">{render_body(body, "print")}</div>'
    text = render_body(body, "print")
    if fig:
        # the picture sits right of the text it illustrates
        return (f'<article class="row has-fig"><div class="row-t">{head}</div>'
                f'<div class="row-d"><div class="row-x">{text}</div><div class="figs">{fig}</div></div></article>')
    return f'<article class="row"><div class="row-t">{head}</div><div class="row-d">{text}</div></article>'


def render_print(secs, figures):
    """A4, one unit per page: summary with key screens, question 1, question 2, the
    applied case. Rows read item title | details | figure."""
    out = []
    for h2, subs in secs:
        m = re.match(r"(\d)\. (.+)", h2)
        rows = "".join(print_row(h3, body, figures) for h3, body in subs)
        if not m:
            out.append(f'<section class="summary"><h2>{esc(h2)}</h2>{rows}</section>'
                       '<section class="glance"><h2>프로토타입 주요 화면</h2>'
                       f'<div class="strip strip-3">{figures.get("cover", "")}</div></section>')
            continue
        out.append(f'<section class="q"><div class="q-head"><span class="q-n">{m.group(1)}번 문항</span>'
                   f"<h2>{esc(m.group(2))}</h2></div>{rows}</section>")
    return "\n".join(out)


def main():
    md = (ROOT / "content/answers.md").read_text(encoding="utf-8")
    title, secs = split_sections(parse(md))
    proto = (ROOT / "tools/partials/proto.html").read_text(encoding="utf-8")
    figures_src = (ROOT / "tools/partials/figures.py").read_text(encoding="utf-8")
    ns = {}
    exec(figures_src, ns)
    figures = ns["FIGURES"]

    toc = "\n".join(
        f'      <li><a href="#q{m.group(1)}"><span class="toc-n">{m.group(1)}번 문항</span><span class="toc-t">{esc(m.group(2))}</span></a></li>'
        for m in (re.match(r"(\d)\. (.+)", h2) for h2, _ in secs) if m
    ) + '\n      <li><a href="#prototype"><span class="toc-n">프로토타입</span><span class="toc-t">직접 눌러 보기</span></a></li>'

    head_common = (
        '<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        '<meta name="robots" content="noindex, nofollow">\n'
    )
    web = f"""<!doctype html>
<html lang="ko">
<head>
{head_common}<title>AI Story UX: 사전 과제</title>
<meta name="description" content="박강근의 뤼튼 Product Designer(AI Story본부) 사전 과제 답변과 직접 눌러 보는 프로토타입">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#ffffff">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="{FONT_CSS}">
<link rel="stylesheet" href="assets/site.css">
<link rel="stylesheet" href="assets/proto.css">
<link rel="stylesheet" href="assets/proto-parts.css">
</head>
<body>
<a class="skip" href="#main">본문으로 건너뛰기</a>
<header class="hero">
  <div class="wrap">
    <p class="eyebrow">{esc(title)}</p>
    <h1>AI Story UX: 사전 과제</h1>
    <p class="byline"><strong>박강근</strong> · Senior Product Designer <span class="date">2026.10</span></p>
    <p class="lede">제출한 PDF와 같은 답변에, 답변에 나온 화면 패턴을 직접 눌러 볼 수 있는 프로토타입을 더했습니다.</p>
    <p class="actions"><a class="btn btn-primary" href="assignment.pdf" download>PDF 내려받기</a> <a class="btn" href="#prototype">프로토타입 바로 가기</a></p>
    <nav class="toc" aria-label="이 페이지의 구성"><ul>
{toc}
    </ul></nav>
  </div>
</header>
<main id="main" class="wrap">
{render_sections(secs, "web", figures={})}
{proto}
</main>
<footer class="foot"><div class="wrap"><p>박강근 · Senior Product Designer · 2026.10</p><p>이 페이지의 대화와 화면은 설명을 위해 새로 만든 가상의 예시입니다.</p></div></footer>
<script src="assets/proto.js" defer></script>
</body>
</html>
"""
    (ROOT / "index.html").write_text(web, encoding="utf-8")

    prn = f"""<!doctype html>
<html lang="ko">
<head>
{head_common}<title>AI Story UX: 사전 과제</title>
<link rel="stylesheet" href="assets/print.css">
</head>
<body>
<header class="top">
  <h1>AI Story UX 사전 과제</h1>
  <p class="meta"><strong>박강근</strong><span>Senior Product Designer</span><span>{esc(title.replace(" 사전 과제", ""))}</span><span>2026.10</span></p>
  <p class="links"><strong>Prototype</strong><a href="{SITE_URL}">{SITE_URL.replace("https://", "").rstrip("/")}</a><span class="hint">각 항목의 ▶ 링크를 누르면 그 화면에서 바로 눌러 볼 수 있습니다.</span></p>
  <p class="note">그림은 프로토타입 화면을 실제 기기 크기(iPhone 16, 393×852pt)로 찍은 것입니다. 설명을 위해 새로 만든 가상 화면이며, 실제 크랙 화면이 아닙니다. 캐릭터와 표지 그림은 생성형 AI로 만들었습니다.</p>
</header>
<main>
{render_print(secs, figures)}
</main>
</body>
</html>
"""
    (ROOT / "print.html").write_text(prn, encoding="utf-8")


if __name__ == "__main__":
    main()
