async function loadJson(path) {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return res.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

function setHref(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.href = value;
  }
}

function renderServiceCards(targetId, services) {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.innerHTML = services
    .map((s, i) => {
      const items = s.highlights.map((h) => `<li>${h}</li>`).join("");
      return `
      <article class="card reveal delay-${Math.min(i, 3)}">
        <h3>${s.name}</h3>
        <p>${s.summary}</p>
        <ul>${items}</ul>
      </article>`;
    })
    .join("");
}

function renderSpaList(targetId, spaItems) {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.innerHTML = spaItems
    .map((item) => `<li>${item.name} - GBP ${item.price}</li>`)
    .join("");
}

function formatPrice(value) {
  if (typeof value === "number") {
    return `GBP ${value}`;
  }
  return `GBP ${value}`;
}

function renderGroomingTable(targetId, grooming) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const rows = [
    ["Small", grooming.small],
    ["Medium", grooming.medium],
    ["Large", grooming.large],
    ["Extra Large", grooming.extraLarge]
  ];

  target.innerHTML = rows
    .map(
      ([size, row]) => `
      <tr>
        <td>${size}</td>
        <td>${formatPrice(row.deShed)}</td>
        <td>${formatPrice(row.bathAndDry)}</td>
        <td>${formatPrice(row.styling)}</td>
      </tr>`
    )
    .join("");
}

function renderAddons(targetId, addons) {
  const target = document.getElementById(targetId);
  if (!target) return;

  target.innerHTML = addons
    .map((a) => `<li>${a.name}: GBP ${a.price}</li>`)
    .join("");
}

function setupNavToggle() {
  const btn = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");
  if (!btn || !nav) return;

  // Inject hamburger icon lines
  btn.innerHTML = '<span class="burger-bar"></span><span class="burger-bar"></span><span class="burger-bar"></span><span class="sr-only">Menu</span>';
  btn.setAttribute("aria-label", "Open navigation menu");

  function closeNav() {
    nav.setAttribute("data-open", "false");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Open navigation menu");
    btn.classList.remove("is-open");
  }

  btn.addEventListener("click", () => {
    const isOpen = nav.getAttribute("data-open") === "true";
    if (isOpen) {
      closeNav();
    } else {
      nav.setAttribute("data-open", "true");
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "Close navigation menu");
      btn.classList.add("is-open");
    }
  });

  document.addEventListener("click", (e) => {
    if (nav.getAttribute("data-open") === "true" && !nav.contains(e.target) && !btn.contains(e.target)) {
      closeNav();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.getAttribute("data-open") === "true") {
      closeNav();
      btn.focus();
    }
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a") && nav.getAttribute("data-open") === "true") {
      closeNav();
    }
  });
}

async function init() {
  setupNavToggle();

  try {
    const [site, services, prices] = await Promise.all([
      loadJson("data/site.json"),
      loadJson("data/services.json"),
      loadJson("data/prices.json")
    ]);

    setText("brandName", site.brand.name);
    setText("brandTagline", site.brand.tagline);
    setText("footerBrandName", site.brand.name);

    setText("contactPhoneText", site.contact.phone);
    setHref("contactPhone", site.contact.phoneHref);

    setText("contactEmailText", site.contact.email);
    setHref("contactEmail", site.contact.emailHref);

    setText("contactAddress", site.contact.address);
    setText("officeHours", site.contact.officeHours);
    setText("bookingHoursNote", site.contact.bookingHoursNote);

    setHref("instagramLink", site.social.instagram);
    setHref("facebookLink", site.social.facebook);
    setHref("tiktokLink", site.social.tiktok);
    setHref("mapsLink", site.maps.short);

    renderServiceCards("serviceCards", services);
    renderSpaList("spaList", prices.spa);
    renderGroomingTable("groomingRows", prices.grooming);
    renderAddons("addonsList", prices.addons);

    setText("dayFull", `GBP ${prices.daycare.fullDay.price}`);
    setText("dayHalf", `GBP ${prices.daycare.halfDay.price}`);
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", init);
