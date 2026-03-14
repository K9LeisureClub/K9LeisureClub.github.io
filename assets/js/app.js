const COOKIE_KEY = "k9_cookie_pref";

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function getRootPrefix() {
  return document.body.dataset.root || ".";
}

function isExternalHref(href) {
  return /^https?:\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#");
}

function rootPath(path) {
  const prefix = getRootPrefix();
  if (!path) return prefix;
  if (isExternalHref(path) || path.startsWith("/")) return path;
  return `${prefix}/${path}`.replace(/\/\.\//g, "/");
}

async function loadJson(path) {
  const res = await fetch(rootPath(path));
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function currentPagePath() {
  const p = (window.location.pathname || "").toLowerCase();
  if (!p || p.endsWith("/")) return "index.html";

  const parts = p.split("/").filter(Boolean);
  if (parts.length >= 2 && parts[parts.length - 2] === "blogs") {
    return `blogs/${parts[parts.length - 1]}`;
  }

  return parts[parts.length - 1] || "index.html";
}

function navItemIsCurrent(item) {
  const now = currentPagePath();
  const hrefPath = String(item.href || "").toLowerCase().split("#")[0];
  if (hrefPath && hrefPath === now) return true;
  return (item.match || []).some((m) => String(m).toLowerCase() === now);
}

function buildNavItem(item) {
  const current = navItemIsCurrent(item);
  const href = rootPath(item.href || "index.html");
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
  const classAttr = item.cta ? " class=\"nav-cta\"" : "";
  const mainLink = `<a href="${href}"${classAttr}${current ? " aria-current=\"page\"" : ""}>${item.label}</a>`;

  if (!hasChildren) {
    return `<li>${mainLink}</li>`;
  }

  const children = item.children.map((child) => buildNavItem(child)).join("");
  return `<li class="has-submenu">${mainLink}<ul>${children}</ul></li>`;
}

function buildNav(site) {
  const nav = qs("#siteNav");
  if (!nav || !site?.navigation?.length) return;

  const itemsHtml = site.navigation.map((item) => buildNavItem(item)).join("");

  nav.innerHTML = `<ul>${itemsHtml}</ul>`;
}

function setupNavToggle() {
  const nav = qs("#siteNav");
  const toggle = qs("#navToggle");
  if (!nav || !toggle) return;

  toggle.addEventListener("click", () => {
    const open = nav.getAttribute("data-open") === "true";
    nav.setAttribute("data-open", String(!open));
    toggle.setAttribute("aria-expanded", String(!open));
  });
}

function populateCommon(site) {
  qsa("[data-bind='brandName']").forEach((el) => (el.textContent = site.brand.name));
  qsa("[data-bind='brandTagline']").forEach((el) => (el.textContent = site.brand.tagline));
  qsa("[data-bind='phone']").forEach((el) => (el.textContent = site.contact.phone));
  qsa("[data-bind='email']").forEach((el) => (el.textContent = site.contact.email));
  qsa("[data-bind='address']").forEach((el) => (el.textContent = site.contact.address));
  qsa("[data-bind='hours']").forEach((el) => (el.textContent = site.contact.officeHours));

  qsa("[data-href='phone']").forEach((el) => (el.href = site.contact.phoneHref));
  qsa("[data-href='email']").forEach((el) => (el.href = site.contact.emailHref));
  qsa("[data-href='instagram']").forEach((el) => (el.href = site.social.instagram));
  qsa("[data-href='facebook']").forEach((el) => (el.href = site.social.facebook));
  qsa("[data-href='tiktok']").forEach((el) => (el.href = site.social.tiktok));
}

function setupTicker(news) {
  const track = qs("#newsTrack");
  if (!track || !news?.items?.length) return;
  const text = news.items.map((i) => ` ${i} `).join(" • ");
  track.textContent = `${text} • ${text}`;
}

function setupReveal() {
  const els = qsa(".reveal");
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("in");
      });
    },
    { threshold: 0.15 }
  );
  els.forEach((el) => io.observe(el));
}

function setupAccordion() {
  qsa(".acc-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".acc-item");
      const open = item.getAttribute("data-open") === "true";
      item.setAttribute("data-open", String(!open));
      btn.setAttribute("aria-expanded", String(!open));
    });
  });
}

function setupCookieBanner() {
  const banner = qs("#cookieBanner");
  const accept = qs("#cookieAccept");
  const decline = qs("#cookieDecline");
  if (!banner || !accept || !decline) return;

  const saved = localStorage.getItem(COOKIE_KEY);
  if (saved) banner.hidden = true;

  accept.addEventListener("click", () => {
    localStorage.setItem(COOKIE_KEY, "functional");
    banner.hidden = true;
    loadMapIfAllowed();
  });

  decline.addEventListener("click", () => {
    localStorage.setItem(COOKIE_KEY, "essential");
    banner.hidden = true;
    loadMapIfAllowed();
  });

  qsa("[data-cookie-settings]").forEach((btn) => {
    btn.addEventListener("click", () => {
      localStorage.removeItem(COOKIE_KEY);
      banner.hidden = false;
      banner.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
}

function loadMapIfAllowed() {
  const holder = qs("#mapHolder");
  if (!holder) return;

  const pref = localStorage.getItem(COOKIE_KEY);
  if (pref !== "functional") {
    holder.innerHTML = `
      <div>
        <p>Functional cookies are required to load the embedded map.</p>
        <p><button class="btn primary" id="mapEnableBtn" type="button">Enable functional cookies</button></p>
      </div>`;
    const btn = qs("#mapEnableBtn");
    btn?.addEventListener("click", () => {
      localStorage.setItem(COOKIE_KEY, "functional");
      loadMapIfAllowed();
      qs("#cookieBanner")?.setAttribute("hidden", "hidden");
    });
    return;
  }

  holder.innerHTML = `
    <iframe
      title="K9 Leisure Club map"
      loading="lazy"
      width="100%"
      height="320"
      style="border:0"
      referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=118%20Worcester%20Rd%2C%20Kidderminster%2C%20DY10%201JR&output=embed">
    </iframe>`;
}

function setText(id, value) {
  const el = qs(`#${id}`);
  if (el && value) el.textContent = value;
}

function applyHero(hero) {
  if (!hero) return;
  setText("heroKicker", hero.kicker);
  setText("heroTitle", hero.title);
  setText("heroIntro", hero.intro);

  const primary = qs("#heroPrimaryCta");
  if (primary && hero.ctaPrimary) {
    primary.textContent = hero.ctaPrimary;
    if (hero.ctaPrimaryHref) primary.href = rootPath(hero.ctaPrimaryHref);
  }

  const secondary = qs("#heroSecondaryCta");
  if (secondary && hero.ctaSecondary) {
    secondary.textContent = hero.ctaSecondary;
    if (hero.ctaSecondaryHref) secondary.href = rootPath(hero.ctaSecondaryHref);
  }
}

function renderFeatureSections(targetId, sections) {
  const target = qs(`#${targetId}`);
  if (!target || !Array.isArray(sections)) return;

  target.innerHTML = sections
    .map((s, i) => {
      const p = (s.paragraphs || []).map((x) => `<p>${x}</p>`).join("");
      const b = (s.bullets || []).length
        ? `<ul>${s.bullets.map((x) => `<li>${x}</li>`).join("")}</ul>`
        : "";
      const cta = s.ctaText && s.ctaHref
        ? `<p><a class="btn primary" href="${rootPath(s.ctaHref)}">${s.ctaText}</a></p>`
        : "";
      const image = s.image
        ? `<figure class="feature-media reveal"><img src="${rootPath(s.image)}" alt="${s.alt || s.title}" loading="lazy" width="1200" height="900" decoding="async"></figure>`
        : "";

      return `
        <section class="feature-band ${i % 2 === 1 ? "band" : ""} ${s.image ? "has-bg" : ""}" ${s.image ? `style="--section-bg: url('${rootPath(s.image)}')"` : ""}>
          <div class="container feature-grid ${s.reverse ? "reverse" : ""}">
            <div class="feature-copy reveal">
              <h2>${s.title}</h2>
              ${p}
              ${b}
              ${cta}
            </div>
            ${image}
          </div>
        </section>`;
    })
    .join("");
}

function ensureFooterUtilities() {
  qsa(".site-footer .footer-grid").forEach((grid) => {
    const iattHref = "https://iaat.org.uk/";
    const cols = Array.from(grid.children);
    if (!cols.length) return;

    const leftCol = cols[0];
    const centerCol = cols[1] || cols[0];
    const rightCol = cols[2] || cols[cols.length - 1];
    let iattCol = qs(".footer-col-iatt", grid);
    if (!iattCol) {
      iattCol = document.createElement("div");
      iattCol.className = "footer-col-iatt";
      grid.appendChild(iattCol);
    }

    leftCol.classList.add("footer-col-left");
    centerCol.classList.add("footer-col-center");
    rightCol.classList.add("footer-col-right");
    iattCol.classList.add("footer-col-iatt");

    let accreditation = qs(".footer-accreditation", grid);
    if (!accreditation) {
      accreditation = document.createElement("p");
      accreditation.className = "footer-accreditation";
    }
    accreditation.innerHTML = `<a class="footer-accreditation-link" href="${iattHref}" target="_blank" rel="noreferrer noopener" aria-label="Visit IAAT website"><img class="footer-accreditation-logo" src="${rootPath("public/IAAT-Logo-2.jpg")}" alt="IAAT accreditation logo" loading="lazy" width="160" height="73"></a>`;
    if (accreditation.parentElement !== iattCol) {
      iattCol.appendChild(accreditation);
    }

    let legal = qs(".footer-legal", grid);
    if (!legal) {
      legal = qsa("p", grid).find((p) => {
        const text = (p.textContent || "").toLowerCase();
        return text.includes("privacy") && text.includes("cookies");
      }) || null;
      if (legal) legal.classList.add("footer-legal");
    }

    if (!legal) {
      legal = document.createElement("p");
      legal.className = "footer-legal";
      legal.innerHTML = `<a href="${rootPath("privacy.html")}">Privacy</a> | <a href="${rootPath("cookies.html")}">Cookies</a>`;
    }
    if (legal.parentElement !== centerCol) {
      centerCol.appendChild(legal);
    }

    let action = qs("[data-cookie-settings]", grid);
    if (!action) {
      const wrap = document.createElement("p");
      wrap.className = "footer-cookie-wrap";
      wrap.innerHTML = `<button type="button" class="btn ghost footer-cookie-btn" data-cookie-settings>Cookie settings</button>`;
      action = wrap;
    }

    const actionContainer = action.closest("p") || action;
    if (actionContainer.parentElement !== centerCol) {
      centerCol.appendChild(actionContainer);
    }
  });
}

function renderNewsCards(targetId, posts) {
  const list = qs(`#${targetId}`);
  if (!list) return;
  list.innerHTML = (posts || [])
    .map(
      (p) => `<article class="card reveal"><p class="small">${p.category || "Update"}</p><h3>${p.title}</h3><p>${p.excerpt}</p></article>`
    )
    .join("");
}

function renderQuickLinks(targetId, quickLinks) {
  const target = qs(`#${targetId}`);
  if (!target || !Array.isArray(quickLinks) || !quickLinks.length) return;

  const html = `
    <section class="feature-band band quicklinks-band">
      <div class="container">
        <h2>Quick links</h2>
        <div class="quicklinks-grid">
          ${quickLinks
            .map(
              (group) => `
                <article class="quicklink-tile reveal">
                  <div class="quicklink-head">
                    <div>
                      <h3>${group.title}</h3>
                      ${group.description ? `<p>${group.description}</p>` : ""}
                    </div>
                  </div>
                  <div class="quicklink-links">
                    ${(group.links || [])
                      .map(
                        (l) => `<a class="quicklink-pill" href="${rootPath(l.href)}"><span>${l.label}</span><span aria-hidden="true">+</span></a>`
                      )
                      .join("")}
                  </div>
                </article>`
            )
            .join("")}
        </div>
      </div>
    </section>`;

  target.insertAdjacentHTML("beforeend", html);
}

function formatPrice(value) {
  if (value === null || value === undefined || value === "" || value === "-") return "-";
  if (typeof value === "string" && value.trim().startsWith("£")) return value;
  if (typeof value === "number") return `£${value}`;
  return `£${value}`;
}

function renderPriceList(prices) {
  const target = qs("#groomingRows");
  if (!target || !prices?.grooming) return;

  const sizeRows = {
    small: prices.grooming.small || {},
    medium: prices.grooming.medium || {},
    large: prices.grooming.large || {},
    extraLarge: prices.grooming.extraLarge || {}
  };

  const services = [
    ["De-Shed", "deShed"],
    ["Bath and Dry", "bathAndDry"],
    ["Styling", "styling"]
  ];

  target.innerHTML = services
    .map(([label, key], idx) => {
      const small = formatPrice(sizeRows.small[key] ?? "-");
      const medium = formatPrice(sizeRows.medium[key] ?? "-");
      const large = formatPrice(sizeRows.large[key] ?? "-");
      const extraLarge = formatPrice(sizeRows.extraLarge[key] ?? "-");
      return `<tr style="--row-delay:${idx * 45}ms"><td>${label}</td><td>${small}</td><td>${medium}</td><td>${large}</td><td>${extraLarge}</td></tr>`;
    })
    .join("");

  const discountsRows = qs("#discountsRows");
  if (discountsRows) {
    discountsRows.innerHTML = (prices.daycare?.discounts || [])
      .map((item, idx) => `<tr style="--row-delay:${idx * 70}ms"><td>${item}</td></tr>`)
      .join("");
  }

  const daycareRows = qs("#daycareRows");
  if (daycareRows && prices.daycare) {
    const dayData = [
      [
        "Full day",
        prices.daycare.fullDay?.label || "Mon-Fri, 7:30am to 6:00pm",
        formatPrice(prices.daycare.fullDay?.price)
      ],
      [
        "Half day",
        prices.daycare.halfDay?.label || "7:30am to 12:30pm or 1:00pm to 6:00pm",
        formatPrice(prices.daycare.halfDay?.price)
      ]
    ];

    daycareRows.innerHTML = dayData
      .map(
        ([plan, time, price], idx) =>
          `<tr style="--row-delay:${idx * 70}ms"><td>${plan}</td><td>${time}</td><td>${price}</td></tr>`
      )
      .join("");
  }

  const spaRows = qs("#spaRows");
  if (spaRows) {
    spaRows.innerHTML = (prices.spa || [])
      .map(
        (x, idx) =>
          `<tr style="--row-delay:${idx * 70}ms"><td>${x.name}</td><td>${x.description || "Premium coat and skin treatment."}</td><td>${formatPrice(x.price)}</td></tr>`
      )
      .join("");
  }

  const spa = qs("#spaList");
  if (spa) {
    spa.innerHTML = (prices.spa || []).map((x) => `<li>${x.name} - £${x.price}</li>`).join("");
  }

  const addonsRows = qs("#addonsRows");
  if (addonsRows) {
    addonsRows.innerHTML = (prices.addons || [])
      .map(
        (x, idx) =>
          `<tr style="--row-delay:${idx * 70}ms"><td>${x.name}</td><td>Single add-on treatment</td><td>${formatPrice(x.price)}</td></tr>`
      )
      .join("");
  }

  const addons = qs("#addonsList");
  if (addons) {
    addons.innerHTML = (prices.addons || []).map((x) => `<li>${x.name} - £${x.price}</li>`).join("");
  }

  setText("dayFull", formatPrice(prices.daycare?.fullDay?.price));
  setText("dayHalf", formatPrice(prices.daycare?.halfDay?.price));
}

function queryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderBlogList(posts) {
  const list = qs("#blogCards");
  if (!list) return;

  list.innerHTML = (posts || [])
    .map(
      (p) => `
      <article class="card reveal blog-card">
        <p class="small">${p.date} | ${p.category}</p>
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
        <p><a class="btn primary" href="post.html?slug=${encodeURIComponent(p.slug)}">Read article</a></p>
      </article>`
    )
    .join("");
}

function renderBlogPost(posts) {
  const slug = queryParam("slug");
  const post = (posts || []).find((p) => p.slug === slug) || (posts || [])[0];
  if (!post) return;

  setText("postTitle", post.title);
  setText("postMeta", `${post.date} | ${post.category}`);

  const target = qs("#postContent");
  if (target) {
    target.innerHTML = (post.content || []).map((line) => `<p>${line}</p>`).join("");
  }

  const rel = qs("#relatedPosts");
  if (rel) {
    rel.innerHTML = posts
      .filter((p) => p.slug !== post.slug)
      .slice(0, 3)
      .map((p) => `<li><a href="post.html?slug=${encodeURIComponent(p.slug)}">${p.title}</a></li>`)
      .join("");
  }
}

function setupContactForm(site) {
  const form = qs("#contactForm");
  const fallback = qs("#formFallback");
  if (!form || !fallback) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const accessKey = form.dataset.web3formsKey || "";

    if (!accessKey) {
      fallback.hidden = false;
      return;
    }

    fd.append("access_key", accessKey);
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: fd
      });
      if (!res.ok) throw new Error("Submit failed");
      form.reset();
      fallback.hidden = false;
      fallback.innerHTML = `<p>Thanks, your enquiry has been sent. If needed, call <a href="${site.contact.phoneHref}">${site.contact.phone}</a> or email <a href="${site.contact.emailHref}">${site.contact.email}</a>.</p>`;
    } catch {
      fallback.hidden = false;
    }
  });
}

async function populatePageData(prices) {
  const page = document.body.dataset.page;
  if (!page) return;

  if (page === "index") {
    const data = await loadJson("data/index.json");
    applyHero(data.hero);
    renderFeatureSections("dynamicSections", data.sections);
    renderQuickLinks("dynamicSections", data.quickLinks);
  }

  if (page === "about") {
    const data = await loadJson("data/about.json");
    applyHero(data.hero);
    const story = qs("#aboutStory");
    if (story) {
      story.innerHTML = (data.story || []).map((s, i) =>
        `<div class="about-story-item reveal">
          <div class="about-story-num">${i + 1}</div>
          <p>${s}</p>
        </div>`
      ).join("");
    }

    const services = qs("#aboutServices");
    if (services) {
      services.innerHTML = (data.services || [])
        .map((s) => `<article class="card reveal"><h3>${s.title}</h3><p>${s.text}</p></article>`)
        .join("");
    }

    const team = qs("#aboutTeam");
    if (team) {
      team.innerHTML = (data.team || [])
        .map((m) => {
          const photo = m.photo
            ? `<img class="team-porthole" src="${rootPath(m.photo)}" alt="Photo of ${m.name}" loading="lazy">`
            : `<div class="team-porthole-placeholder" aria-hidden="true">&#x1F436;</div>`;
          return `<article class="team-card reveal">${photo}<h3>${m.name}</h3><p>${m.role}</p></article>`;
        })
        .join("");
    }

    const community = qs("#aboutCommunity");
    if (community && data.community) community.textContent = data.community;
  }

  if (page === "contact") {
    const data = await loadJson("data/contact-page.json");
    applyHero(data.hero);
    setText("bookingTitle", data.booking?.title);
    setText("fallbackTitle", data.fallback?.title);
    setText("fallbackText", data.fallback?.text);

    const booking = await loadJson("data/book-now-page.json");
    const steps = qs("#bookingSteps");
    if (steps) {
      steps.innerHTML = (booking.steps || [])
        .map((step) => `<article class="card reveal"><h3>${step.title}</h3><p>${step.text}</p></article>`)
        .join("");
    }
  }

  if (page === "faq") {
    const data = await loadJson("data/faq.json");
    applyHero(data.hero);
    const list = qs("#faqCards");
    if (list) {
      list.innerHTML = (data.items || [])
        .map((p) => `<article class="card reveal"><h3>${p.question}</h3><p>${p.answer}</p></article>`)
        .join("");
    }
  }

  if (page === "news") {
    const data = await loadJson("data/news-page.json");
    applyHero(data.hero);
    renderNewsCards("newsCards", data.posts);
  }

  if (page === "services") {
    const data = await loadJson("data/services-page.json");
    applyHero(data.hero);

    const pills = qs("#servicePills");
    if (pills) {
      pills.innerHTML = (data.accordion || [])
        .map((item) => {
          const itemId = item.id || slugify(item.title);
          const preferredHref = itemId === "daycare"
            ? "doggy-daycare.html"
            : itemId === "spa"
              ? "spa-packages.html"
              : itemId === "hydrotherapy"
                ? "hydrotherapy.html"
                : `${itemId}.html`;
          return `<a class="service-pill" href="${rootPath(preferredHref)}"><span>${item.title}</span><span aria-hidden="true">+</span></a>`;
        })
        .join("");
    }

    renderFeatureSections("servicesShowcase", data.sections || []);

    const accord = qs("#serviceAccordion");
    if (accord) {
      accord.innerHTML = (data.accordion || [])
        .map((item, idx) => {
          const itemId = item.id || slugify(item.title);
          const aliases = (item.aliases || [])
            .filter((a) => a && a !== itemId)
            .map((a) => `<span class="hash-anchor" id="${a}" aria-hidden="true"></span>`)
            .join("");
          const p = (item.paragraphs || []).map((x) => `<p>${x}</p>`).join("");
          const b = (item.bullets || []).map((x) => `<li>${x}</li>`).join("");
          return `
            <article class="acc-item" id="${itemId}" data-open="${idx === 0 ? "true" : "false"}">
              <button class="acc-trigger" aria-expanded="${idx === 0 ? "true" : "false"}">${item.title}</button>
              <div class="acc-panel">${aliases}${p}<ul>${b}</ul></div>
            </article>`;
        })
        .join("");
    }

    const faqAccord = qs("#serviceFaqAccordion");
    if (faqAccord) {
      faqAccord.innerHTML = (data.faq || [])
        .map(
          (item, idx) => `
            <article class="acc-item" data-open="${idx === 0 ? "true" : "false"}">
              <button class="acc-trigger" aria-expanded="${idx === 0 ? "true" : "false"}">${item.q}</button>
              <div class="acc-panel"><p>${item.a}</p></div>
            </article>`
        )
        .join("");
    }

    renderPriceList(prices);
  }

  if (page === "daycare") {
    const data = await loadJson("data/daycare-page.json");
    applyHero(data.hero);
    renderFeatureSections("pageSections", data.sections);
  }

  if (page === "grooming") {
    const data = await loadJson("data/grooming-page.json");
    applyHero(data.hero);
    renderFeatureSections("pageSections", data.sections);
    renderPriceList(prices);
  }

  if (page === "spa-packages") {
    const data = await loadJson("data/spa-packages-page.json");
    applyHero(data.hero);
    renderFeatureSections("pageSections", data.sections);
    renderPriceList(prices);
  }

  if (page === "hydrotherapy") {
    const data = await loadJson("data/hydrotherapy-page.json");
    applyHero(data.hero);
    renderFeatureSections("pageSections", data.sections);
  }

  if (page === "hydrotherapy-clinical") {
    const data = await loadJson("data/hydrotherapy-clinical-page.json");
    applyHero(data.hero);
    renderFeatureSections("pageSections", data.sections);
  }

  if (page === "hydrotherapy-fun-fitness") {
    const data = await loadJson("data/hydrotherapy-fun-fitness-page.json");
    applyHero(data.hero);
    renderFeatureSections("pageSections", data.sections);
  }

  if (page === "book-now") {
    const data = await loadJson("data/book-now-page.json");
    applyHero(data.hero);
    const steps = qs("#bookingSteps");
    if (steps) {
      steps.innerHTML = (data.steps || [])
        .map((step) => `<article class="card reveal"><h3>${step.title}</h3><p>${step.text}</p></article>`)
        .join("");
    }
  }

  if (page === "prices") {
    const data = await loadJson("data/prices-page.json");
    applyHero(data.hero);
    renderPriceList(prices);
    const notes = qs("#priceNotes");
    if (notes) {
      notes.innerHTML = (data.notes || []).map((n) => `<li>${n}</li>`).join("");
    }
  }

  if (page === "blogs") {
    const data = await loadJson("data/blogs.json");
    applyHero(data.hero);
    renderBlogList(data.posts || []);
  }

  if (page === "blog-post") {
    const data = await loadJson("data/blogs.json");
    renderBlogPost(data.posts || []);
  }
}

function removeDuplicateContentEntries() {
  const cards = qsa("#newsCards .card h3");
  if (!cards.length) return;
  const seen = new Set();
  cards.forEach((h) => {
    const card = h.closest(".card");
    const key = h.textContent.trim().toLowerCase();
    if (seen.has(key) && card) card.remove();
    seen.add(key);
  });
}

async function init() {
  const [site, news, prices] = await Promise.all([
    loadJson("data/site.json"),
    loadJson("data/news.json"),
    loadJson("data/prices.json")
  ]);

  populateCommon(site);
  buildNav(site);
  ensureFooterUtilities();
  setupNavToggle();
  setupTicker(news);
  await populatePageData(prices);
  setupAccordion();
  setupCookieBanner();
  loadMapIfAllowed();
  setupContactForm(site);
  setupReveal();
  removeDuplicateContentEntries();
}

document.addEventListener("DOMContentLoaded", () => {
  init().catch((err) => console.error(err));
});
