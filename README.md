# AI Story UX: 사전 과제

뤼튼 Product Designer (AI Story본부) 사전 과제 답변(`content/answers.md`)을 공개 웹 페이지와 A4 PDF로 만들고, 답변에 나온 화면 패턴 다섯 가지(과정·근거·위험 수준별 표시·사유 있는 복구·스토리 모드)를 직접 눌러 볼 수 있는 가상 프로토타입으로 옮긴 저장소입니다. 프로토타입의 대화와 캐릭터는 모두 새로 만든 예시이며 실제 크랙 화면이 아닙니다.

- 사이트: https://power-xc.github.io/ai-story-ux/
- PDF: [assignment.pdf](assignment.pdf)

## 구성

- `index.html`, `assets/site.css`, `assets/proto.js`: 빌드 없는 정적 사이트 (바닐라 JS, 외부 스크립트 없음)
- `print.html`, `assets/print.css` → `assignment.pdf`: A4 인쇄용
- `tools/build.py`: `content/answers.md`를 파싱해 `index.html`·`print.html`을 생성 (`python3 tools/build.py`)
- `tools/make-pdf.sh`: headless Chrome으로 PDF 생성
