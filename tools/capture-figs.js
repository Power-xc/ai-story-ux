// Crops of the live prototype for the PDF figures (assets/fig/*.png).
// A Playwright page function: serve the repo root at BASE, set OUT to the
// absolute path of assets/fig/, then run it with Playwright (for the MCP
// browser_run_code tool, drop the trailing semicolon). The phone keeps its real
// 393x852 size and is captured at 3x so it stays sharp in print.
async (page) => {
  const BASE = "http://127.0.0.1:8765/";
  const OUT = "assets/fig/";
  const ctx = await page
    .context()
    .browser()
    .newContext({
      deviceScaleFactor: 3,
      // tall enough that a full phone (852) fits below the section heading
      viewport: { width: 1280, height: 1200 },
      reducedMotion: "reduce",
    });
  const p = await ctx.newPage();
  const css =
    ".phone-wrap{zoom:1!important}.phone{box-shadow:none!important}" +
    ".scrim{background:rgb(17 17 17 / .28)!important}" +
    ".sheet{animation:none!important;scrollbar-width:none}" +
    ".chat{scrollbar-width:none}" +
    ".crop .sheet{border-radius:0!important}.crop .home-ind{visibility:hidden}";
  const go = async (hash, crop) => {
    await p.goto(BASE + "?v=" + Date.now() + "#proto-" + hash);
    await p.addStyleTag({ content: css });
    if (crop) await p.evaluate(() => document.body.classList.add("crop"));
    await p.waitForTimeout(500);
  };
  const box = (sel) =>
    p.evaluate((sel) => {
      const rs = [...document.querySelectorAll(sel)].map((e) =>
        e.getBoundingClientRect(),
      );
      const x = Math.min(...rs.map((r) => r.left));
      const y = Math.min(...rs.map((r) => r.top));
      return {
        x,
        y,
        width: Math.max(...rs.map((r) => r.right)) - x,
        height: Math.max(...rs.map((r) => r.bottom)) - y,
      };
    }, sel);
  const PAD = 12;
  // the chat column across the full phone width, from the first matching bubble down
  const chatCrop = async (sel) => {
    const ph = await p.locator(".phone").boundingBox();
    const c = await box(sel);
    return {
      x: ph.x + 1,
      y: c.y - PAD / 2,
      width: ph.width - 2,
      height: c.height + PAD * 1.5,
    };
  };
  // a sheet down to its last card, leaving out the reset button
  const sheetCrop = async (card) => {
    const s = await box(".phone .sheet");
    const bottom = await p.evaluate(
      (card) =>
        [...document.querySelectorAll(card)].pop().getBoundingClientRect()
          .bottom,
      card,
    );
    // start 1px in so the page behind the sheet never shows as a sliver
    return { ...s, y: s.y + 1, height: bottom - s.y - 1 + PAD };
  };
  const shot = (name, clip) =>
    p.screenshot({ path: OUT + name + ".png", clip });

  const phoneBox = () => p.locator(".phone").boundingBox();
  const toBottom = () =>
    p.evaluate(() => {
      const chat = document.querySelector(".phone .chat");
      chat.scrollTop = chat.scrollHeight;
    });

  // cover strip: whole screens
  await go("a");
  await p.getByRole("button", { name: "보내기" }).click();
  await p.waitForTimeout(4000);
  await p.mouse.move(0, 0);
  await toBottom();
  await shot("g-a", await phoneBox());

  await go("b");
  await p.getByRole("button", { name: "근거 자료 2 보기" }).click();
  await p.waitForTimeout(500);
  await shot("g-b", await phoneBox());

  await go("b");
  await shot("b", await chatCrop(".phone .chat > *"));

  await go("c");
  await p.getByRole("tab", { name: "근거 없음" }).click();
  await p.waitForTimeout(800);
  await shot("c", await chatCrop(".phone .chat > *"));

  await go("d", true);
  await p.getByRole("button", { name: "메시지 메뉴 열기" }).click();
  await p.waitForTimeout(500);
  await shot("d", await sheetCrop(".phone .sheet .reason"));

  await go("e");
  await shot("e-dock", await box(".phone .dock-e"));

  await go("e-memory", true);
  // two of the three memory groups are enough to show the controls
  await shot("e-memory", await sheetCrop(".phone .sheet .ngroup:nth-of-type(2) .note"));

  // the scene opens on the cover and the recap of the last session
  await go("e");
  await p.evaluate(() => {
    document.querySelector(".phone .chat").scrollTop = 0;
  });
  await p.waitForTimeout(200);
  await shot("e-open", await phoneBox());

  // the fix in two steps: pick the reason, then the rewrite with the setting it followed
  await go("e-menu");
  await shot("e-menu", await phoneBox());

  await go("e");
  await p.getByRole("button", { name: "캐릭터 메시지 메뉴 열기" }).click();
  await p.getByRole("button", { name: "설정과 맞지 않아요" }).click();
  // the short composer dock leaves room for the whole exchange
  await p.locator(".dial-opt", { hasText: "직접 쓰기" }).click();
  await p.mouse.move(0, 0);
  await toBottom();
  await p.waitForTimeout(300);
  await shot("e-fix", await phoneBox());

  await ctx.close();
  return "ok";
};
