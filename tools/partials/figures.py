# Print figures: crops of the prototype at real iPhone 16 size (393x852pt),
# captured by tools/capture-figs.js into assets/fig/. Exec'd by build.py; defines FIGURES.
# Captions describe what the picture shows; they carry no claims about the applicant's work.

# (row key, image, name, what it shows), in reading order
FIGS = [
    (("원칙", 1), "e-dock", "선택지와 개입 다이얼", "추천 행동을 누르면 장면이 이어지고, 위 다이얼로 보기·고르기·직접 쓰기를 바꿉니다."),
    (("원칙", 3), "e-memory", "기억", "AI가 기억하는 관계·사건·약속을 사용자가 고정하고 고칩니다."),
    (("해결", 1), "a", "과정 보여 주기", "단계와 함께 “이렇게 이해했어요”를 먼저 보여 주고, 눌러서 고치게 합니다."),
    (("해결", 2), "b", "근거 연결", "문장마다 근거 칩을 달고, 근거가 없는 문장은 점선으로 구분합니다."),
    (("해결", 3), "c", "근거가 없을 때", "지어내지 않고 “모른다”고 말한 뒤 다음에 할 일을 제안합니다."),
    (("해결", 4), "d", "사유 있는 복구", "이유를 고르면 그 이유를 반영해 다시 답합니다."),
    ('크랙에 옮기면: "설정 할루시네이션"', "e-open", "장면 첫머리",
     "작품 표지 아래에 요약 기억의 최근 흐름을 “지난 이야기”로 보여 주고 장면을 잇습니다."),
    ('크랙에 옮기면: "설정 할루시네이션"', "e-fix", "설정과 어긋난 대사 바로잡기",
     "“마법이 없다”는 세계 규칙과 어긋난 대사를, 이유를 골라 다시 쓰고 따른 설정을 한 줄로 보여 줍니다."),
]


def fig(n, src, name, note):
    return (f'<figure class="shot shot-{src}"><img src="assets/fig/{src}.png" alt="{name}">'
            f"<figcaption><b>그림 {n}. {name}</b> {note}</figcaption></figure>")


# a row may carry more than one picture; they stack in reading order
FIGURES = {}
for n, (key, *rest) in enumerate(FIGS, 1):
    FIGURES[key] = FIGURES.get(key, "") + fig(n, *rest)
