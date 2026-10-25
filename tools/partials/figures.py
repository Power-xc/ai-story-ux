# Static print figures (HTML/CSS). Exec'd by build.py; defines FIGURES.
# Captions/notes describe what the picture shows; they carry no claims about the applicant's work.

FAKE = "설명용 가상 화면 · 실제 크랙 화면이 아닙니다"


def phone(title, inner, tall=False):
    return (f'<div class="ph{" tall" if tall else ""}" aria-hidden="true"><div class="ph-top"><span>{title}</span><i>가상</i></div>'
            f'<div class="ph-body">{inner}</div></div>')


def fig(label, name, phone_html, notes):
    lis = "".join(f"<li>{n}</li>" for n in notes)
    return (f'<figure class="fig"><div class="fig-ph">{phone_html}</div>'
            f'<figcaption><strong>그림 {label}. {name}</strong><ul>{lis}</ul><span class="fake">{FAKE}</span></figcaption></figure>')


U = lambda t: f'<div class="b u">{t}</div>'
AI = lambda t: f'<div class="b a">{t}</div>'

FIG_A = fig("A", "과정 보여 주기", phone("가상 도서관 도우미",
    U("이번 달 도서관이 제일 한가한 때가 언제야?") +
    '<div class="b a"><ol class="st"><li class="d"><b>✓</b>질문 이해<em>완료</em></li>'
    '<li class="n"><b>●</b>자료 찾기<em>진행 중</em></li><li><b>○</b>답 작성<em>대기</em></li></ol>'
    '<div class="chip">이렇게 이해했어요: 이번 달 중 한가한 요일 <i>고치기</i></div></div>'),
    ["질문을 보내면 단계가 차례로 진행됩니다.", "첫 단계의 “이렇게 이해했어요” 칩을 눌러 해석을 고치면, 답이 그 해석으로 나옵니다."])

FIG_B = fig("B", "근거 연결", phone("가상 도서관 도우미",
    U("달빛도서관 이용 안내 알려 줘.") +
    AI('달빛도서관은 월요일에 쉬어요. <span class="ev">근거 1</span> 한 번에 4권, 10일까지 빌릴 수 있어요. <span class="ev">근거 2</span> '
       '<span class="nosrc">주말 오후에는 아마 붐빌 거예요.</span> <span class="ev w">근거 없음</span>') +
    '<div class="sheet"><b>근거</b><div class="map on">달빛도서관은 월요일에 쉬어요.<br><small>→ 자료 1 · 달빛도서관 이용안내 · 휴관일</small>'
    '<div class="srcq">정기 휴관일은 <mark>매주 월요일</mark>입니다.</div></div>'
    '<div class="map">주말 오후에는 아마 붐빌 거예요.<br><small>→ 연결된 자료 없음</small></div></div>'),
    ["문장 끝 근거 칩을 누르면 어느 문장이 어느 자료에서 왔는지 패널이 열립니다.", "근거 없는 문장은 점선과 “근거 없음” 표시로 구분합니다."])

FIG_C = fig("C", "위험 수준별 표시", phone("가상 도서관 도우미",
    '<div class="case"><small>창작</small>' + AI("눈이 내려앉자 항구의 불빛이 한 겹 더 조용해졌다.") + '<em>표시 없음</em></div>'
    '<div class="case"><small>사실</small>' + AI('토요일은 9시부터 13시까지 열어요. <span class="ev">근거 3</span>') + '<em>근거 칩</em></div>'
    '<div class="case"><small>고위험 주제</small>' + AI('약 조합은 사람마다 달라서 여기서 괜찮다고 말하기 어려워요.<div class="route"><b>확인 경로</b> 약 설명서 · 약사에게 묻기</div>') + '<em>확인 경로 안내</em></div>'
    '<div class="case"><small>근거 없음</small>' + AI('찾은 자료에는 내년 휴관일이 없어요. 추측해서 말하지 않을게요.<div class="acts"><span>올해 휴관일 보기</span><span>알림 받기</span></div>') + '<em>“모른다” + 다음 행동</em></div>', tall=True),
    ["같은 도우미가 위험 수준에 따라 표시를 달리합니다.", "창작에는 아무 표시도 붙이지 않고, 근거가 없으면 지어내지 않고 다음 행동을 제안합니다."])

FIG_D = fig("D", "사유 있는 복구", phone("가상 도서관 도우미",
    U("몇 시까지 열어?") + AI("평일은 18시까지 열고, 일요일은 쉬어요. <i class='dots'>…</i>") +
    '<div class="sheet"><b>무엇이 문제였나요?</b><div class="rs">사실과 달라요</div><div class="rs">질문을 잘못 이해했어요</div><div class="rs">앞 내용과 달라요</div></div>'),
    ["답을 길게 누르거나 “…” 버튼을 누르면 사유 메뉴가 열립니다.", "고른 사유가 반영된 새 답이 나옵니다."])

FIG_E = fig("E", "스토리 모드: 지난 이야기 · 기억 노트 · 다이얼", phone("가상 스토리 · 해무항",
    '<div class="recap"><b>지난 이야기</b> 서리와 나는 어제 폭풍 속에서 등불을 지켰고, 새벽 종이 울리기 전에 돌아오기로 약속했다.</div>'
    '<div class="notes"><b>기억 노트</b>'
    '<div class="nt"><small>관계</small>서리는 나를 아직 믿지 않지만 경계를 풀기 시작했다</div>'
    '<div class="nt pin"><small>약속 · 고정됨</small>새벽 종이 울리기 전에 등대로 돌아오기 <em>다음 답부터 반영</em></div></div>'
    '<div class="dial"><span>관전</span><span class="on">선택</span><span>직접 쓰기</span></div>', tall=True),
    ["장면 첫머리의 “지난 이야기” 한 줄과, 고정·수정·삭제할 수 있는 기억 노트입니다.", "아래 다이얼로 관전·선택·직접 쓰기 중 개입 수준을 고릅니다.", "캐릭터 메시지 메뉴(캐릭터답지 않아요 / 앞 내용과 달라요 / 설정과 맞지 않아요)는 프로토타입 E에서 볼 수 있습니다."])

FIGURES = {
    ("해결", 1): FIG_A,
    ("해결", 2): FIG_B,
    ("해결", 3): FIG_C,
    ("해결", 4): FIG_D,
    '크랙에 옮기면: "설정 할루시네이션"': FIG_E,
}
