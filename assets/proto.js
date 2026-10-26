/* 설명용 가상 프로토타입. 네트워크·LLM 호출 없이 미리 쓴 스크립트로만 동작한다. */
(function () {
  "use strict";

  var reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  var phone = document.getElementById("phone");
  var body = document.getElementById("phone-body");
  var titleEl = document.getElementById("phone-title");
  var infoEl = document.getElementById("scn-info");
  var tabs = Array.prototype.slice.call(
    document.querySelectorAll('#scn-tabs [role="tab"]'),
  );
  if (!phone || !body || !tabs.length) return;

  function wait(ms) {
    return new Promise(function (r) {
      setTimeout(r, reduceMq.matches ? 0 : ms);
    });
  }

  /* h('div', {class:'x', onclick:fn}, child, ...) — 텍스트는 항상 textContent로만 넣는다 */
  function h(tag, props) {
    var el = document.createElement(tag);
    var p = props || {};
    Object.keys(p).forEach(function (k) {
      var v = p[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") el.className = v;
      else if (k.indexOf("on") === 0) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c))
      c.forEach(function (x) {
        append(el, x);
      });
    else el.append(c.nodeType ? c : document.createTextNode(c));
  }
  function scrollDown(el) {
    el.scrollTop = el.scrollHeight;
  }

  /* ---------- 시트(근거 패널·메뉴·기억) ---------- */
  var sheetState = null;
  function closeSheet() {
    if (!sheetState) return;
    var s = sheetState;
    sheetState = null;
    s.scrim.remove();
    if (s.opener && document.body.contains(s.opener)) s.opener.focus();
  }
  function openSheet(label, content, opener) {
    closeSheet();
    var closeBtn = h(
      "button",
      { class: "sheet-close", type: "button", onclick: closeSheet },
      "닫기",
    );
    var sheet = h(
      "div",
      {
        class: "sheet",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": label,
        tabindex: "-1",
      },
      h("div", { class: "sheet-head" }, h("h3", null, label), closeBtn),
      content,
    );
    var scrim = h(
      "div",
      {
        class: "scrim",
        onclick: function (e) {
          if (e.target === scrim) closeSheet();
        },
      },
      sheet,
    );
    scrim.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeSheet();
        return;
      }
      if (e.key !== "Tab") return;
      var f = sheet.querySelectorAll(
        'button, input, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!f.length) return;
      var first = f[0],
        last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
    phone.append(scrim);
    sheetState = { scrim: scrim, opener: opener || document.activeElement };
    sheet.focus();
    return sheet;
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheetState) closeSheet(); });

  /* ---------- 공용 조각 ---------- */
  function bubble(role, kids, extra) {
    return h(
      "div",
      { class: "msg msg-" + role + (extra ? " " + extra : "") },
      kids,
    );
  }
  function chatBox() {
    return h("div", {
      class: "chat",
      role: "log",
      "aria-live": "polite",
      "aria-label": "대화",
    });
  }

  var SRC = {
    1: {
      title: "달빛도서관 이용안내 · 휴관일",
      pre: "정기 휴관일은 ",
      mark: "매주 월요일",
      post: "입니다.",
    },
    2: {
      title: "달빛도서관 이용안내 · 대출",
      pre: "",
      mark: "1인 4권, 10일까지",
      post: " 대출할 수 있습니다.",
    },
    3: {
      title: "달빛도서관 이용안내 · 운영시간",
      pre: "토요일은 ",
      mark: "9시부터 13시까지",
      post: " 운영합니다.",
    },
    4: {
      title: "어린이열람실 안내",
      pre: "어린이열람실은 ",
      mark: "폐관 30분 전까지",
      post: " 입장할 수 있습니다.",
    },
  };
  function sourceCard(id) {
    var s = SRC[id];
    return h(
      "div",
      { class: "src" },
      h("p", { class: "src-t" }, "자료 " + id + " · " + s.title),
      h("p", { class: "src-q" }, s.pre, h("mark", null, s.mark), s.post),
    );
  }
  function chipBtn(id, onclick) {
    return h(
      "button",
      {
        class: "ev",
        type: "button",
        "aria-label": "근거 자료 " + id + " 보기",
        "aria-haspopup": "dialog",
        onclick: onclick,
      },
      "근거 " + id,
    );
  }
  function showSource(id, sentence, ev) {
    openSheet(
      "근거",
      h(
        "div",
        { class: "sheet-body" },
        h("p", { class: "sheet-lead" }, "이 문장은 아래 자료에서 왔어요."),
        h("p", { class: "quote" }, sentence),
        sourceCard(id),
      ),
      ev.currentTarget,
    );
  }

  /* ---------- A. 과정 보여 주기 ---------- */
  var A_STEPS = ["질문 이해", "자료 찾기", "답 작성"];
  var A_Q = "이번 달 도서관이 제일 한가한 때가 언제야?";
  var A_INTERP = [
    {
      text: "이번 달 중 한가한 요일",
      ans: "예시 집계로는 화요일과 수요일이 가장 한가해요. 주말에는 이용자가 눈에 띄게 늘어요.",
    },
    {
      text: "하루 중 한가한 시간대",
      ans: "예시 집계로는 문을 연 직후의 오전 시간대가 가장 한가해요. 점심 이후부터 차츰 붐벼요.",
    },
    {
      text: "이번 달 중 한가한 주",
      ans: "예시 집계로는 시험 기간이 끝난 둘째 주가 가장 한가했어요.",
    },
  ];
  var STATUS_TXT = { wait: "대기", active: "진행 중", done: "완료" };
  var STATUS_ICON = { wait: "○", active: "●", done: "✓" };

  function mountA() {
    var chat = chatBox();
    var interp = 0,
      runId = 0,
      sent = false;
    var input = h("input", {
      class: "composer-input",
      type: "text",
      readonly: true,
      value: A_Q,
      "aria-label": "보낼 질문(예시)",
    });
    var send = h(
      "button",
      { class: "send", type: "button", onclick: start },
      "보내기",
    );
    var dock = h(
      "div",
      { class: "dock" },
      h("div", { class: "composer" }, input, send),
    );
    body.append(chat, dock);
    chat.append(
      bubble("ai", "가상 도서관 도우미예요. 아래 예시 질문을 보내 보세요."),
    );

    function start() {
      if (sent) return;
      sent = true;
      send.disabled = true;
      chat.append(bubble("user", A_Q));
      var steps = A_STEPS.map(function (s) {
        var st = h("span", { class: "st" }, STATUS_TXT.wait);
        var ic = h(
          "span",
          { class: "ic", "aria-hidden": "true" },
          STATUS_ICON.wait,
        );
        return {
          li: h(
            "li",
            { class: "step is-wait" },
            ic,
            h("span", { class: "sl" }, s),
            st,
          ),
          ic: ic,
          st: st,
        };
      });
      var slot = h("div", { class: "chipslot" });
      var answer = h("div", { class: "answer" });
      chat.append(
        h(
          "div",
          { class: "msg msg-ai msg-proc" },
          h(
            "ol",
            { class: "steps", "aria-label": "답이 만들어지는 과정" },
            steps.map(function (s) {
              return s.li;
            }),
          ),
          slot,
          answer,
        ),
      );
      scrollDown(chat);

      function setStep(i, state) {
        steps[i].li.className = "step is-" + state;
        steps[i].ic.textContent = STATUS_ICON[state];
        steps[i].st.textContent = STATUS_TXT[state];
      }
      function renderChip(open) {
        slot.textContent = "";
        var chip = h(
          "button",
          {
            class: "chip",
            type: "button",
            "aria-expanded": open ? "true" : "false",
            onclick: function () {
              renderChip(!open);
              chip2focus();
            },
          },
          "이렇게 이해했어요: " + A_INTERP[interp].text,
          h("span", { class: "chip-edit" }, "고치기"),
        );
        slot.append(chip);
        if (open) {
          slot.append(
            h(
              "div",
              {
                class: "picker",
                role: "group",
                "aria-label": "이렇게 이해했어요 고치기",
              },
              A_INTERP.map(function (it, i) {
                return h(
                  "button",
                  {
                    type: "button",
                    class: "opt",
                    "aria-pressed": i === interp ? "true" : "false",
                    onclick: function () {
                      pick(i);
                    },
                  },
                  it.text,
                );
              }),
            ),
          );
        }
        function chip2focus() {
          var c = slot.querySelector(".chip");
          if (c) c.focus();
        }
      }
      function pick(i) {
        interp = i;
        renderChip(false);
        slot.querySelector(".chip").focus();
        run(1);
      }
      async function run(from) {
        var id = ++runId;
        answer.textContent = "";
        for (var i = from; i < 3; i++) setStep(i, "wait");
        for (var k = from; k < 3; k++) {
          setStep(k, "active");
          await wait(900);
          if (id !== runId) return;
          setStep(k, "done");
          if (k === 0) renderChip(false);
        }
        answer.append(
          h("p", null, A_INTERP[interp].ans),
          h(
            "p",
            { class: "hint" },
            "다르게 이해했다면 위의 “이렇게 이해했어요” 칩을 눌러 고쳐 보세요.",
          ),
        );
        scrollDown(chat);
      }
      run(0);
      dock.append(
        h(
          "button",
          {
            class: "reset",
            type: "button",
            onclick: function () {
              runId++;
              mount("a");
            },
          },
          "처음부터 다시",
        ),
      );
    }
  }

  /* ---------- B. 근거 연결 ---------- */
  var B_SENT = [
    { t: "달빛도서관은 월요일에 쉬어요.", src: 1 },
    { t: "한 번에 4권, 10일까지 빌릴 수 있어요.", src: 2 },
    { t: "주말 오후에는 아마 붐빌 거예요.", src: null },
  ];
  function evidenceList(active) {
    return h(
      "ul",
      { class: "map" },
      B_SENT.map(function (s, i) {
        return h(
          "li",
          {
            class: i === active ? "on" : "",
            "aria-current": i === active ? "true" : null,
          },
          h("p", { class: "map-s" }, s.t),
          h(
            "p",
            { class: "map-a" },
            s.src
              ? "→ 자료 " + s.src + " · " + SRC[s.src].title
              : "→ 연결된 자료 없음",
          ),
          i === active
            ? s.src
              ? sourceCard(s.src)
              : h(
                  "p",
                  { class: "src-q none" },
                  "자료에서 찾지 못한 문장이에요. 추측이라서 점선으로 따로 표시했어요.",
                )
            : null,
        );
      }),
    );
  }
  function mountB() {
    var chat = chatBox();
    body.append(
      chat,
      h(
        "div",
        { class: "dock dock-note" },
        "답의 문장 끝 “근거” 칩이나 “근거 없음” 표시를 눌러 보세요.",
      ),
    );
    chat.append(bubble("user", "달빛도서관 이용 안내 알려 줘."));
    var ai = bubble("ai", [
      h(
        "p",
        { class: "sents" },
        B_SENT.map(function (s, i) {
          var open = function (e) {
            openSheet(
              "근거",
              h(
                "div",
                { class: "sheet-body" },
                h(
                  "p",
                  { class: "sheet-lead" },
                  "어느 문장이 어느 자료에서 왔는지 보여 줘요.",
                ),
                evidenceList(i),
              ),
              e.currentTarget,
            );
          };
          return h(
            "span",
            { class: "sent" + (s.src ? "" : " no-src") },
            s.t,
            " ",
            s.src
              ? chipBtn(s.src, open)
              : h(
                  "button",
                  {
                    class: "ev ev-none",
                    type: "button",
                    "aria-haspopup": "dialog",
                    onclick: open,
                  },
                  "근거 없음",
                ),
            " ",
          );
        }),
      ),
    ]);
    chat.append(ai);
  }

  /* ---------- C. 위험 수준별 표시 ---------- */
  var C_TABS = [
    {
      id: "create",
      label: "창작",
      note: "표시 없음 · 창작은 막거나 경고하지 않아요.",
    },
    {
      id: "fact",
      label: "사실",
      note: "근거 칩 · 사실을 말하는 문장에 근거를 연결해요.",
    },
    {
      id: "risk",
      label: "고위험 주제",
      note: "확인 경로 안내 · 틀리면 피해가 큰 주제는 분명히 알리고 확인할 곳을 줘요.",
    },
    {
      id: "none",
      label: "근거 없음",
      note: "“모른다” + 다음 행동 제안 · 지어내지 않아요.",
    },
  ];
  function mountC(sub) {
    var cur = C_TABS.some(function (t) {
      return t.id === sub;
    })
      ? sub
      : "create";
    var list = h("div", {
      class: "subtabs",
      role: "tablist",
      "aria-label": "위험 수준",
    });
    var chat = chatBox();
    var note = h("p", { class: "dock dock-note", id: "c-note" });
    body.append(list, chat, note);

    function render() {
      list.textContent = "";
      C_TABS.forEach(function (t) {
        list.append(
          h(
            "button",
            {
              class: "subtab",
              role: "tab",
              type: "button",
              id: "ctab-" + t.id,
              "aria-selected": t.id === cur ? "true" : "false",
              tabindex: t.id === cur ? "0" : "-1",
              onclick: function () {
                cur = t.id;
                render();
                document.getElementById("ctab-" + cur).focus();
              },
              onkeydown: function (e) {
                var i = C_TABS.findIndex(function (x) {
                  return x.id === cur;
                });
                if (e.key === "ArrowRight") i = (i + 1) % 4;
                else if (e.key === "ArrowLeft") i = (i + 3) % 4;
                else return;
                e.preventDefault();
                cur = C_TABS[i].id;
                render();
                document.getElementById("ctab-" + cur).focus();
              },
            },
            t.label,
          ),
        );
      });
      chat.textContent = "";
      note.textContent = C_TABS.filter(function (t) {
        return t.id === cur;
      })[0].note;
      chat.setAttribute("aria-labelledby", "ctab-" + cur);
      var f = C_BODY[cur];
      chat.append(bubble("user", f.q), f.build());
    }
    render();
  }
  var C_BODY = {
    create: {
      q: "눈 내리는 항구 마을을 배경으로 한 줄 써 줘.",
      build: function () {
        return bubble("ai", "눈이 내려앉자 항구의 불빛이 한 겹 더 조용해졌다.");
      },
    },
    fact: {
      q: "달빛도서관 토요일에 몇 시까지 열어?",
      build: function () {
        var t = "토요일은 9시부터 13시까지 열어요.";
        return bubble(
          "ai",
          h(
            "p",
            null,
            t,
            " ",
            chipBtn(3, function (e) {
              showSource(3, t, e);
            }),
          ),
        );
      },
    },
    risk: {
      q: "이 약이랑 감기약 같이 먹어도 돼?",
      build: function () {
        var qs = h(
          "ul",
          { class: "mini", hidden: true },
          [
            "지금 먹는 약 이름 두 가지",
            "함께 먹어도 되는지, 간격을 둬야 하는지",
            "피해야 할 음식이나 증상",
          ].map(function (x) {
            return h("li", null, x);
          }),
        );
        var btn = h(
          "button",
          {
            class: "act",
            type: "button",
            "aria-expanded": "false",
            onclick: function () {
              var open = qs.hidden;
              qs.hidden = !open;
              btn.setAttribute("aria-expanded", String(open));
            },
          },
          "약사에게 물어볼 것 정리하기",
        );
        return bubble("ai", [
          h(
            "p",
            null,
            "약 조합은 사람마다 달라서 여기서 괜찮다고 말하기 어려워요. 의료·약 정보는 틀리면 피해가 커서 꼭 확인이 필요해요.",
          ),
          h(
            "div",
            { class: "route", role: "note" },
            h("p", { class: "route-t" }, "확인 경로"),
            h(
              "ul",
              null,
              h(
                "li",
                null,
                "먹고 있는 약의 설명서에서 “함께 먹으면 안 되는 약” 항목 보기",
              ),
              h("li", null, "약사에게 약 이름을 보여 주며 묻기"),
            ),
            btn,
            qs,
          ),
        ]);
      },
    },
    none: {
      q: "달빛도서관 내년 휴관일은 언제야?",
      build: function () {
        var done = h("p", { class: "hint", role: "status" });
        function act(label, msg) {
          return h(
            "button",
            {
              class: "act",
              type: "button",
              onclick: function () {
                done.textContent = msg;
              },
            },
            label,
          );
        }
        return bubble("ai", [
          h(
            "p",
            null,
            "찾은 자료에는 내년 휴관일이 없어요. 모르는 것을 추측해서 말하지 않을게요.",
          ),
          h(
            "div",
            { class: "acts" },
            act("올해 휴관일 보기", "(예시) 올해 휴관일 안내를 보여 줘요."),
            act("공지가 올라오면 알림 받기", "(예시) 알림을 켰다고 가정해요."),
            act("질문 바꿔 보기", "(예시) 질문 입력창으로 돌아가요."),
          ),
          done,
        ]);
      },
    },
  };

  /* ---------- D. 사유 있는 복구 ---------- */
  var D_REASONS = [
    { id: "fact", label: "사실과 달라요" },
    { id: "misread", label: "질문을 잘못 이해했어요" },
    { id: "context", label: "앞 내용과 달라요" },
  ];
  function mountD() {
    var chat = chatBox();
    var hint = h(
      "div",
      { class: "dock dock-note" },
      "답을 길게 누르거나(또는 마우스 오른쪽 버튼) “…” 버튼을 눌러 보세요.",
    );
    var reset = h(
      "button",
      {
        class: "reset",
        type: "button",
        onclick: function () {
          mount("d");
        },
      },
      "처음부터 다시",
    );
    body.append(chat, hint);
    chat.append(
      bubble("user", "토요일에 아이랑 달빛도서관에 가려고 해."),
      bubble("ai", "좋아요. 궁금한 점을 물어봐 주세요."),
      bubble("user", "몇 시까지 열어?"),
    );
    var orig = h(
      "div",
      { class: "msg msg-ai msg-menu" },
      h("p", null, "평일은 18시까지 열고, 일요일은 쉬어요."),
    );
    var used = false,
      timer = null;
    var menuBtn = h(
      "button",
      {
        class: "dots",
        type: "button",
        "aria-label": "메시지 메뉴 열기",
        "aria-haspopup": "dialog",
        onclick: openMenu,
      },
      "…",
    );
    orig.append(menuBtn);
    chat.append(orig);

    orig.addEventListener("pointerdown", function (e) {
      if (e.target === menuBtn || used) return;
      timer = setTimeout(function () {
        timer = null;
        openMenu({ currentTarget: menuBtn });
      }, 600);
    });
    ["pointerup", "pointerleave", "pointercancel", "pointermove"].forEach(
      function (ev) {
        orig.addEventListener(ev, function () {
          if (timer) {
            clearTimeout(timer);
            timer = null;
          }
        });
      },
    );
    orig.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      if (!used) openMenu({ currentTarget: menuBtn });
    });

    function openMenu(e) {
      if (used) return;
      var opener = e.currentTarget;
      openSheet(
        "무엇이 문제였나요?",
        h(
          "div",
          { class: "sheet-body" },
          h(
            "p",
            { class: "sheet-lead" },
            "이유를 고르면 그 이유를 반영해서 다시 답해요.",
          ),
          h(
            "div",
            { class: "reasons" },
            D_REASONS.map(function (r) {
              return h(
                "button",
                {
                  class: "reason",
                  type: "button",
                  onclick: function () {
                    choose(r);
                  },
                },
                r.label,
              );
            }),
          ),
        ),
        opener,
      );
    }
    function choose(r) {
      used = true;
      closeSheet();
      orig.classList.add("old");
      menuBtn.remove();
      orig.prepend(h("span", { class: "old-tag" }, "이전 답"));
      chat.append(bubble("user", "사유: " + r.label, "msg-reason"));
      var t1 = "토요일은 13시까지 열어요.";
      var out;
      if (r.id === "fact") {
        out = [
          h(
            "p",
            null,
            "맞아요, 앞 답은 토요일 시간을 확인하지 않고 말했어요. 자료를 확인해 다시 답할게요.",
          ),
          h(
            "p",
            null,
            t1,
            " ",
            chipBtn(3, function (e) {
              showSource(3, t1, e);
            }),
          ),
        ];
      } else if (r.id === "misread") {
        out = [
          h(
            "p",
            { class: "reint" },
            "이렇게 다시 이해했어요: 토요일 마감 시간",
          ),
          h(
            "p",
            null,
            t1,
            " ",
            chipBtn(3, function (e) {
              showSource(3, t1, e);
            }),
          ),
        ];
      } else {
        var t2 = "어린이열람실은 12시 30분까지 들어갈 수 있어요.";
        out = [
          h("p", null, "토요일에 아이와 가신다고 하셨죠. 그 점을 놓쳤어요."),
          h(
            "p",
            null,
            t1,
            " ",
            t2,
            " ",
            chipBtn(4, function (e) {
              showSource(4, t2, e);
            }),
          ),
        ];
      }
      var reply = bubble("ai", out, "msg-new");
      chat.append(reply);
      hint.textContent = "";
      hint.append("사유가 반영된 새 답이 나왔어요. 다른 사유도 보려면 ", reset);
      scrollDown(chat);
      reset.focus();
    }
  }

  /* ---------- E. 스토리 모드 ---------- */
  var E_NOTES0 = [
    { g: "관계", t: "서리는 나를 아직 믿지 않지만 경계를 풀기 시작했다" },
    { g: "사건", t: "어제 폭풍 속에서 내가 서리의 등불을 지켜 줬다" },
    { g: "약속", t: "새벽 종이 울리기 전에 등대로 돌아오기" },
  ];
  var E_MODES = [
    { id: "watch", label: "관전", sub: "보기만" },
    { id: "choice", label: "선택", sub: "골라서" },
    { id: "write", label: "직접 쓰기", sub: "내 말로" },
  ];
  var E_WATCH = [
    "서리가 등불 심지를 다듬는다.",
    "먼 바다에서 안개가 천천히 밀려온다.",
    "서리가 계단 위로 올라가며 고개를 돌린다. 네가 따라오는지 보는 듯하다.",
  ];
  var E_REWRITE = {
    tone: {
      label: "캐릭터답지 않아요",
      text: "왔네. 등불은 내가 켠다. 따라와.",
      ref: "캐릭터 설정 · 서리는 말수가 적고 무뚝뚝하다",
    },
    prev: {
      label: "앞 내용과 달라요",
      text: "왔네. 새벽 종 전에 돌아온다고 했지. 안 늦었어.",
      ref: "기억 · 약속",
    },
    rule: {
      label: "설정과 맞지 않아요",
      text: "왔네. 이 마을엔 마법이 없어. 등불은 성냥으로 켠다. 따라와.",
      ref: "세계 규칙 · 해무항에는 마법이 없다",
    },
  };

  function mountE(sub) {
    var notes = E_NOTES0.map(function (n) {
      return { g: n.g, t: n.t, pinned: false, changed: false };
    });
    var mode = sub === "dial" ? "choice" : "choice";
    var watchIdx = 0,
      rewritten = false;
    var status = h("p", { class: "sr", role: "status" });
    var chat = chatBox();
    var dockEl = h("div", { class: "dock dock-e" });
    var noteBtn = h("button", {
      class: "notebtn",
      type: "button",
      "aria-haspopup": "dialog",
      onclick: openNotes,
    });
    var recap = h(
      "div",
      { class: "recap" },
      h("span", { class: "recap-l" }, "지난 이야기"),
      " 서리와 나는 어제 폭풍 속에서 등불을 지켰고, 새벽 종이 울리기 전에 돌아오기로 약속했다.",
    );
    var head = h(
      "div",
      { class: "e-head" },
      recap,
      h(
        "div",
        { class: "e-bar" },
        h("span", { class: "rule" }, "세계 규칙 · 해무항에는 마법이 없다"),
        noteBtn,
      ),
    );
    body.append(head, chat, dockEl, status);

    chat.append(
      h(
        "p",
        { class: "narr" },
        "해무항, 새벽 전. 등대 아래에서 서리가 등불을 들고 서 있다.",
      ),
    );
    var charMsg = h(
      "div",
      { class: "msg msg-char msg-menu" },
      h("span", { class: "who" }, "서리"),
      h(
        "p",
        null,
        "안녕하세요, 여행자님! 불꽃 마법으로 등불을 켤게요~ 새벽 종 약속은 잊었지만 괜찮죠?",
      ),
    );
    var menuBtn = h(
      "button",
      {
        class: "dots",
        type: "button",
        "aria-label": "캐릭터 메시지 메뉴 열기",
        "aria-haspopup": "dialog",
        onclick: openMenu,
      },
      "…",
    );
    charMsg.append(menuBtn);
    chat.append(charMsg);
    updateNoteBtn();
    renderDock();

    function updateNoteBtn() {
      noteBtn.textContent = "";
      noteBtn.append(
        "기억 ",
        h("span", { class: "count" }, String(notes.length)),
      );
    }
    function promiseReply() {
      var p = notes.filter(function (n) {
        return n.g === "약속";
      })[0];
      return p
        ? "서리는 “" +
            p.t +
            "”라는 약속을 떠올린 듯 고개를 끄덕인다. “…그래, 지켰네.”"
        : "서리는 무슨 약속이냐는 듯 눈썹을 올린다. “…그런 얘기를 했었나?”";
    }
    function addTurn(user, reply) {
      chat.append(
        bubble("user", user),
        h(
          "div",
          { class: "msg msg-char" },
          h("span", { class: "who" }, "서리"),
          h("p", null, reply),
        ),
      );
      scrollDown(chat);
    }
    function renderDock() {
      dockEl.textContent = "";
      var dial = h(
        "div",
        { class: "dial", role: "radiogroup", "aria-label": "개입 수준" },
        E_MODES.map(function (m) {
          return h(
            "button",
            {
              class: "dial-opt",
              type: "button",
              role: "radio",
              "aria-checked": m.id === mode ? "true" : "false",
              tabindex: m.id === mode ? "0" : "-1",
              "data-mode": m.id,
              onclick: function () {
                setMode(m.id, true);
              },
              onkeydown: function (e) {
                var i = E_MODES.findIndex(function (x) {
                  return x.id === mode;
                });
                if (e.key === "ArrowRight" || e.key === "ArrowDown")
                  i = (i + 1) % 3;
                else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
                  i = (i + 2) % 3;
                else return;
                e.preventDefault();
                setMode(E_MODES[i].id, true);
              },
            },
            h("span", { class: "dl" }, m.label),
            h("span", { class: "ds" }, m.sub),
          );
        }),
      );
      var area = h("div", { class: "mode-area" });
      if (mode === "watch") {
        var done = watchIdx >= E_WATCH.length;
        area.append(
          h(
            "p",
            { class: "hint" },
            done
              ? "이야기가 한 장면 끝났어요."
              : "이야기가 알아서 흘러가요. 원할 때 끼어들 수 있어요.",
          ),
          h(
            "div",
            { class: "acts" },
            done
              ? null
              : h(
                  "button",
                  {
                    class: "act",
                    type: "button",
                    onclick: function () {
                      chat.append(
                        h("p", { class: "narr" }, E_WATCH[watchIdx++]),
                      );
                      scrollDown(chat);
                      renderDock();
                      focusMode();
                    },
                  },
                  "이야기 흘려보내기",
                ),
            h(
              "button",
              {
                class: "act",
                type: "button",
                onclick: function () {
                  setMode("choice", true);
                },
              },
              "끼어들기",
            ),
          ),
        );
      } else if (mode === "choice") {
        var opts = [
          [
            "서리의 등불을 들어 준다",
            "서리는 잠시 망설이다 등불을 넘긴다. “…떨어뜨리지 마.”",
          ],
          ["“약속은 지켰어”라고 말한다", null],
          [
            "아무 말 없이 따라간다",
            "서리는 뒤돌아보지 않고 계단을 오른다. 발소리만 두 사람 몫으로 울린다.",
          ],
        ];
        area.append(
          h("p", { class: "hint" }, "다음 행동을 골라요."),
          h(
            "div",
            { class: "acts acts-col" },
            opts.map(function (o) {
              return h(
                "button",
                {
                  class: "act",
                  type: "button",
                  onclick: function () {
                    addTurn(o[0], o[1] || promiseReply());
                  },
                },
                o[0],
              );
            }),
          ),
        );
      } else {
        var ta = h("input", {
          class: "composer-input",
          type: "text",
          "aria-label": "직접 쓰기",
          placeholder: "서리에게 할 말을 써 보세요",
        });
        var go = function () {
          var v = ta.value.trim();
          if (!v) return;
          addTurn(v, "서리가 네 말을 한참 곱씹는다. 그러고는 등불을 건넨다.");
          ta.value = "";
        };
        ta.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            go();
          }
        });
        area.append(
          h(
            "div",
            { class: "composer" },
            ta,
            h(
              "button",
              { class: "send", type: "button", onclick: go },
              "보내기",
            ),
          ),
        );
      }
      dockEl.append(dial, area);
    }
    function focusMode() {
      var r = dockEl.querySelector('[aria-checked="true"]');
      if (r) r.focus();
    }
    function setMode(m, focus) {
      mode = m;
      renderDock();
      if (focus) focusMode();
    }

    function openMenu(e) {
      if (rewritten) return;
      openSheet(
        "어떤 점이 어색한가요?",
        h(
          "div",
          { class: "sheet-body" },
          h("p", { class: "sheet-lead" }, "이유를 고르면 그 이유로 다시 써요."),
          h(
            "div",
            { class: "reasons" },
            Object.keys(E_REWRITE).map(function (k) {
              return h(
                "button",
                {
                  class: "reason",
                  type: "button",
                  onclick: function () {
                    rewrite(k);
                  },
                },
                E_REWRITE[k].label,
              );
            }),
          ),
        ),
        e.currentTarget,
      );
    }
    function rewrite(k) {
      rewritten = true;
      closeSheet();
      charMsg.classList.add("old");
      menuBtn.remove();
      charMsg.prepend(h("span", { class: "old-tag" }, "이전 문장"));
      chat.append(
        bubble("user", "사유: " + E_REWRITE[k].label, "msg-reason"),
        h(
          "div",
          { class: "msg msg-char msg-new" },
          h("span", { class: "who" }, "서리"),
          h("p", null, E_REWRITE[k].text),
          h("p", { class: "ref" }, h("b", null, "따른 설정"), " " + refText(k)),
        ),
      );
      scrollDown(chat);
      status.textContent = "이유를 반영해 다시 썼어요.";
    }

    // 다시 쓴 대사가 어떤 설정·기억을 따랐는지. 약속은 지금 기억에 남은 문장을 쓴다.
    function refText(k) {
      if (k !== "prev") return E_REWRITE[k].ref;
      var p = notes.filter(function (n) {
        return n.g === "약속";
      })[0];
      return p ? E_REWRITE[k].ref + ": " + p.t : "지난 이야기";
    }

    function openNotes(e) {
      var wrap = h("div", { class: "sheet-body" });
      var info = h(
        "p",
        { class: "sheet-lead" },
        "AI가 기억하는 핵심이에요. 고치면 다음 답부터 반영돼요.",
      );
      function paint() {
        wrap.textContent = "";
        wrap.append(info);
        ["관계", "사건", "약속"].forEach(function (g) {
          var items = notes.filter(function (n) {
            return n.g === g;
          });
          var sec = h("section", { class: "ngroup" }, h("h4", null, g));
          if (!items.length)
            sec.append(
              h(
                "p",
                { class: "hint" },
                "지운 항목은 다음 답부터 쓰이지 않아요.",
              ),
            );
          items.forEach(function (n) {
            sec.append(noteRow(n));
          });
          wrap.append(sec);
        });
        wrap.append(
          h(
            "button",
            {
              class: "reset",
              type: "button",
              onclick: function () {
                notes = E_NOTES0.map(function (x) {
                  return { g: x.g, t: x.t, pinned: false, changed: false };
                });
                updateNoteBtn();
                paint();
              },
            },
            "처음 상태로",
          ),
        );
      }
      function noteRow(n) {
        var editing = false;
        var row = h("div", { class: "note" + (n.pinned ? " pinned" : "") });
        function draw() {
          row.textContent = "";
          var txt;
          if (editing) {
            txt = h("input", {
              class: "composer-input",
              type: "text",
              value: n.t,
              "aria-label": n.g + " 기억 고치기",
            });
            txt.addEventListener("keydown", function (ev) {
              if (ev.key === "Enter") {
                ev.preventDefault();
                save();
              }
            });
          } else txt = h("p", { class: "note-t" }, n.t);
          function save() {
            var v = txt.value.trim();
            if (v && v !== n.t) {
              n.t = v;
              n.changed = true;
              status.textContent = "기억을 고쳤어요. 다음 답부터 반영돼요.";
            }
            editing = false;
            draw();
            row.querySelectorAll(".mini-btn")[1].focus();
          }
          var tags = h(
            "p",
            { class: "tags" },
            n.pinned ? h("span", { class: "tg" }, "고정됨") : null,
            n.changed
              ? h("span", { class: "tg tg-new" }, "다음 답부터 반영")
              : null,
          );
          row.append(
            txt,
            tags,
            h(
              "div",
              { class: "note-acts" },
              h(
                "button",
                {
                  type: "button",
                  class: "mini-btn",
                  "aria-pressed": n.pinned ? "true" : "false",
                  onclick: function () {
                    n.pinned = !n.pinned;
                    row.classList.toggle("pinned", n.pinned);
                    draw();
                    row.querySelectorAll(".mini-btn")[0].focus();
                  },
                },
                "고정",
              ),
              editing
                ? h(
                    "button",
                    { type: "button", class: "mini-btn", onclick: save },
                    "저장",
                  )
                : h(
                    "button",
                    {
                      type: "button",
                      class: "mini-btn",
                      onclick: function () {
                        editing = true;
                        draw();
                        row.querySelector("input").focus();
                      },
                    },
                    "수정",
                  ),
              h(
                "button",
                {
                  type: "button",
                  class: "mini-btn danger",
                  onclick: function () {
                    notes.splice(notes.indexOf(n), 1);
                    updateNoteBtn();
                    status.textContent =
                      "기억을 지웠어요. 다음 답부터 반영돼요.";
                    paint();
                    var f = wrap.querySelector(".note .mini-btn");
                    if (f) f.focus();
                  },
                },
                "삭제",
              ),
            ),
          );
        }
        draw();
        return row;
      }
      paint();
      openSheet("기억", wrap, e && e.currentTarget);
    }
    if (sub === "memory") openNotes({ currentTarget: noteBtn });
    else if (sub === "menu") openMenu({ currentTarget: menuBtn });
    else if (sub === "dial") setTimeout(focusMode, 0);
  }

  /* ---------- 시나리오 정의·전환 ---------- */
  var SCN = {
    a: {
      title: "가상 도서관 도우미",
      head: "A. 과정 보여 주기",
      how: [
        "“보내기”를 눌러 질문을 보내요.",
        "첫 단계에서 나온 “이렇게 이해했어요” 칩을 눌러 해석을 바꿔 보세요.",
        "바꾼 해석대로 답이 다시 나와요.",
      ],
      back: "#s1",
      backLabel: "해결 1",
      mount: mountA,
    },
    b: {
      title: "가상 도서관 도우미",
      head: "B. 근거 연결",
      how: [
        "답의 문장 끝 “근거” 칩을 눌러요.",
        "어느 문장이 어느 자료에서 왔는지 패널에서 확인해요.",
        "“근거 없음” 문장은 점선으로 구분돼요.",
      ],
      back: "#s2",
      backLabel: "해결 2",
      mount: mountB,
    },
    c: {
      title: "가상 도서관 도우미",
      head: "C. 위험 수준별 표시",
      how: [
        "창작 / 사실 / 고위험 주제 / 근거 없음 탭을 바꿔 보세요.",
        "같은 도우미가 위험 수준에 따라 다르게 표시해요.",
      ],
      back: "#s3",
      backLabel: "해결 3",
      mount: mountC,
    },
    d: {
      title: "가상 도서관 도우미",
      head: "D. 사유 있는 복구",
      how: [
        "답을 길게 누르거나 “…” 버튼을 눌러요.",
        "“사실과 달라요 / 질문을 잘못 이해했어요 / 앞 내용과 달라요” 중 하나를 골라요.",
        "고른 사유가 반영된 새 답이 나와요.",
      ],
      back: "#s4",
      backLabel: "해결 4",
      mount: mountD,
    },
    e: {
      title: "가상 스토리 · 해무항",
      head: "E. 스토리 모드 (크랙에 옮기면)",
      how: [
        "위쪽 “지난 이야기” 한 줄이 장면이 이어 갈 내용을 보여 줘요.",
        "“기억”에서 관계·사건·약속을 고정·수정·삭제하고, 선택지로 다음 답을 받아 보세요.",
        "캐릭터 메시지의 “…” 메뉴에서 이유를 고르면, 다시 쓴 대사 아래에 따른 설정이 한 줄로 보여요.",
        "아래 관전/선택/직접 쓰기 다이얼로 개입 수준을 바꿔요.",
      ],
      back: "#crack",
      backLabel: "크랙에 옮기면",
      mount: mountE,
    },
  };
  var current = null;

  function mount(id, sub) {
    var s = SCN[id];
    if (!s) return;
    closeSheet();
    current = id;
    body.textContent = "";
    titleEl.textContent = s.title;
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-scn") === id;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (on) body.setAttribute("aria-labelledby", t.id);
    });
    infoEl.textContent = "";
    infoEl.append(
      h("h3", null, s.head),
      h(
        "ol",
        null,
        s.how.map(function (x) {
          return h("li", null, x);
        }),
      ),
      h("p", null, h("a", { href: s.back }, "답변에서 보기 → " + s.backLabel)),
    );
    s.mount(sub || "");
  }
  window.__mountProto = mount;

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () {
      mount(t.getAttribute("data-scn"));
    });
    t.addEventListener("keydown", function (e) {
      var n = i;
      if (e.key === "ArrowRight" || e.key === "ArrowDown")
        n = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
        n = (i + tabs.length - 1) % tabs.length;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = tabs.length - 1;
      else return;
      e.preventDefault();
      tabs[n].focus();
      mount(tabs[n].getAttribute("data-scn"));
    });
  });

  /* ---------- 실제 기기 크기 ---------- */
  // iPhone 16 화면(393×852pt)을 비율 그대로 두고, 창이 작으면 통째로 줄인다.
  var PHONE_W = 393,
    PHONE_H = 852,
    FIT_GAP = 72; // 캡션과 위아래 여백
  function fitPhone() {
    var wrap = phone.parentElement;
    var z = (window.innerHeight - FIT_GAP) / PHONE_H;
    if (!window.matchMedia("(min-width: 900px)").matches)
      z = Math.min(z, wrap.parentElement.clientWidth / PHONE_W);
    wrap.style.zoom = String(Math.max(0.5, Math.min(1, z)));
  }
  fitPhone();
  window.addEventListener("resize", fitPhone);

  function fromHash(scroll) {
    var m = /^#proto-([a-e])(?:-(\w+))?$/.exec(location.hash);
    if (!m) return false;
    mount(m[1], m[2]);
    if (scroll) {
      var target = document.getElementById("prototype");
      if (target)
        target.scrollIntoView({
          behavior: reduceMq.matches ? "auto" : "smooth",
          block: "start",
        });
    }
    return true;
  }
  window.addEventListener("hashchange", function () {
    fromHash(true);
  });
  if (!fromHash(true)) mount("a");
})();
