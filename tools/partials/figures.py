# Print figures: the prototype at real iPhone 16 size (393x852pt), captured by
# tools/capture-figs.js into assets/fig/. Exec'd by build.py; defines FIGURES.
# Captions describe what the picture shows; they carry no claims about the applicant's work.

# (place, image, name, what it shows), in reading order. "cover" pictures form the
# strip on page 1, "crack" pictures the two-step strip on the last page; the rest
# sit beside the row they illustrate.
FIGS = [
    ("cover", "e-open", "장면 첫머리", "1번 · 캐릭터가 먼저 말을 걸고, 지난 이야기와 고를 행동을 건넵니다."),
    ("cover", "g-a", "과정 보여 주기", "2번 · 답 전에 “이렇게 이해했어요”를 보여 주고, 눌러서 고치게 합니다."),
    ("cover", "g-b", "근거 연결", "2번 · 근거 칩을 누르면 자료의 해당 구절을 바로 보여 줍니다."),
    (("원칙", 1), "e-dock", "선택지와 개입 다이얼", "추천 행동으로 장면을 잇고, 다이얼로 보기·고르기·직접 쓰기를 바꿉니다."),
    (("원칙", 3), "e-memory", "기억", "AI가 기억하는 관계·사건·약속을 사용자가 고정하고 고칩니다."),
    (("해결", 2), "b", "근거 연결", "문장마다 근거 칩을 달고, 근거가 없는 문장은 점선으로 구분합니다."),
    (("해결", 3), "c", "근거가 없을 때", "지어내지 않고 “모른다”고 말한 뒤 다음에 할 일을 제안합니다."),
    (("해결", 4), "d", "사유 있는 복구", "이유를 고르면 그 이유를 반영해 다시 답합니다."),
    ("crack", "e-menu", "이유 고르기", "설정과 어긋난 대사의 “…” 메뉴에서 이유를 고릅니다."),
    ("crack", "e-fix", "다시 쓴 대사와 따른 설정", "고른 이유로 다시 쓰고, 따른 설정을 대사 아래 한 줄로 보여 줍니다."),
]


def fig(n, src, name, note):
    return (f'<figure class="shot shot-{src}"><img src="assets/fig/{src}.png" alt="{name}">'
            f"<figcaption><b>그림 {n}. {name}</b> {note}</figcaption></figure>")


# a place may carry more than one picture; they keep reading order
FIGURES = {}
for n, (key, *rest) in enumerate(FIGS, 1):
    FIGURES[key] = FIGURES.get(key, "") + fig(n, *rest)
