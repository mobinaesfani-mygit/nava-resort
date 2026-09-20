"use strict";



/* ---------- اطلاعات اتاق‌ها ----------*/

const ROOMS = {
  standard: {
    name: "اتاق دبل استاندارد",
    guests: 2,
    price: 3500000,
    image: "images/room-double-standard.webp",
    text: "اتاق چوبی با سقف شیب‌دار و پنجره‌های بزرگ. از بالکن می‌شود منظره‌ی اطراف را دید.",
    features: ["یک تخت دبل", "بالکن خصوصی", "تلویزیون", "صبحانه‌ی روزانه"],
  },
  family: {
    name: "سوئیت خانوادگی",
    guests: 4,
    price: 5200000,
    image: "images/room-family-suite.webp",
    text: "سوئیتی بزرگ با دیوار سنگی و دو تخت. بخش نشیمن و تراس رو به جنگل دارد.",
    features: ["دو تخت", "بخش نشیمن", "تراس رو به جنگل", "چای‌ساز", "صبحانه‌ی روزانه"],
  },
  garden: {
    name: "اتاق دبل باغ",
    guests: 2,
    price: 4200000,
    image: "images/room-double-garden.webp",
    text: "اتاقی روشن با کف چوبی و درهای شیشه‌ای که مستقیم به باغ باز می‌شوند.",
    features: ["یک تخت دبل", "خروجی مستقیم به باغ", "نیمکت چوبی", "صبحانه‌ی روزانه"],
  },
  luxury: {
    name: "سوئیت لوکس",
    guests: 2,
    price: 6500000,
    image: "images/room-luxury-suite.webp",
    text: "اتاقی با پنجره‌های تمام‌قد رو به جنگل و بخش نشیمن جدا.",
    features: ["تخت بزرگ", "پنجره‌های تمام‌قد", "مبل و میز نشیمن", "صبحانه‌ی روزانه"],
  },
};


/* ---------- ابزارهای کوچک ---------- */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// ۳۵۰۰۰۰۰ → ۳٬۵۰۰٬۰۰۰
const faNumber = (n) => n.toLocaleString("fa-IR");

// تبدیل ارقام فارسی و عربی به انگلیسی (برای بررسی شماره تلفن)
function toEnglishDigits(text) {
  return text
    .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}


/* ---------- ۱. نوار بالا ---------- */

const navbar = $(".navbar");
const menu = $("#mainNavbar");

function updateNavbar() {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
}
updateNavbar();
window.addEventListener("scroll", updateNavbar, { passive: true });

// روی موبایل بعد از زدن یک لینک، منو خودش بسته شود
$$(".nav-link, .btn", menu).forEach((item) => {
  item.addEventListener("click", () => {
    if (menu.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  });
});


/* ---------- ۲. مشخص کردن بخش فعلی در منو ---------- */

const spyLinks = new Map(
  $$('.nav-link[href^="#"]').map((a) => [a.getAttribute("href").slice(1), a])
);

// هر بخشی که از خط وسط صفحه رد شود، لینکش فعال می‌شود
const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      spyLinks.forEach((link) => {
        link.classList.remove("active");
        link.removeAttribute("aria-current");
      });

      const active = spyLinks.get(entry.target.id);
      active.classList.add("active");
      active.setAttribute("aria-current", "true");
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);

spyLinks.forEach((_, id) => {
  const section = document.getElementById(id);
  if (section) spyObserver.observe(section);
});


/* ---------- ۳. فرم رزرو ---------- */

const form = $("#bookingForm");
const statusBox = $("#formStatus");

const fields = {
  name: $("#fullName"),
  phone: $("#phone"),
  checkIn: $("#checkIn"),
  checkOut: $("#checkOut"),
  room: $("#roomType"),
};

const DAY = 24 * 60 * 60 * 1000;
const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

// "2026-09-20" → Date (بدون مشکل منطقه‌ی زمانی)
function parseDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Date → "2026-09-20" (برای min و max فیلد تاریخ)
function toInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

// تاریخ گذشته انتخاب نشود؛ خروج هم حداقل یک روز بعد از ورود باشد
fields.checkIn.min = toInputValue(today);
fields.checkOut.min = toInputValue(addDays(today, 1));

fields.checkIn.addEventListener("change", () => {
  if (!fields.checkIn.value) return;

  const minOut = toInputValue(addDays(parseDate(fields.checkIn.value), 1));
  fields.checkOut.min = minOut;

  if (fields.checkOut.value && fields.checkOut.value < minOut) {
    fields.checkOut.value = "";
  }
});

// هر تابع پیام خطا را برمی‌گرداند؛ رشته‌ی خالی یعنی مشکلی نیست
const validators = {
  name(value) {
    return value.trim().length >= 3 ? "" : "نام را کامل وارد کنید.";
  },

  phone(value) {
    const number = toEnglishDigits(value).replace(/[\s\-()]/g, "");
    const mobile = /^(?:\+98|0098|0)?9\d{9}$/.test(number); // 09123456789
    const landline = /^0\d{10}$/.test(number);               // 02112345678
    return mobile || landline ? "" : "شماره تماس معتبر نیست (مثلاً 09123456789).";
  },

  checkIn(value) {
    if (!value) return "تاریخ ورود را انتخاب کنید.";
    return parseDate(value) < today ? "تاریخ ورود نمی‌تواند گذشته باشد." : "";
  },

  checkOut(value) {
    if (!value) return "تاریخ خروج را انتخاب کنید.";
    const checkIn = fields.checkIn.value;
    if (checkIn && parseDate(value) <= parseDate(checkIn)) {
      return "تاریخ خروج باید بعد از تاریخ ورود باشد.";
    }
    return "";
  },

  room(value) {
    return value ? "" : "نوع اتاق را انتخاب کنید.";
  },
};

// یک فیلد را بررسی می‌کند و پیام خطا را زیرش نشان می‌دهد
function validateField(key) {
  const input = fields[key];
  const message = validators[key](input.value);

  input.classList.toggle("is-invalid", message !== "");
  input.setAttribute("aria-invalid", message !== "" ? "true" : "false");
  input.nextElementSibling.textContent = message; // div.invalid-feedback

  return message === "";
}

Object.keys(fields).forEach((key) => {
  fields[key].addEventListener("blur", () => validateField(key));
  fields[key].addEventListener("change", () => {
    validateField(key);
    // اگر ورود عوض شد، خروج هم دوباره چک شود
    if (key === "checkIn" && fields.checkOut.value) validateField("checkOut");
  });
});

function showStatus(type, message) {
  const box = document.createElement("div");
  box.className = `alert alert-${type} mb-0`;
  box.textContent = message; // textContent: متن کاربر به‌عنوان HTML اجرا نمی‌شود
  statusBox.replaceChildren(box);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  // همه‌ی فیلدها بررسی شوند (نه فقط اولین خطا)
  const results = Object.keys(fields).map(validateField);

  if (results.includes(false)) {
    $(".is-invalid", form).focus();
    showStatus("danger", "چند مورد نیاز به اصلاح دارد.");
    return;
  }

  const room = ROOMS[fields.room.value];
  const nights = Math.round(
    (parseDate(fields.checkOut.value) - parseDate(fields.checkIn.value)) / DAY
  );
  const total = nights * room.price;

  // TODO: اینجا باید اطلاعات به سرور فرستاده شود (fetch به API خودتان
  // یا سرویسی مثل Formspree). فعلاً فقط پیام نشان داده می‌شود.
  showStatus(
    "success",
    `${fields.name.value.trim()} عزیز، درخواست شما برای «${room.name}» و ${faNumber(nights)} شب ثبت شد. ` +
      `هزینه‌ی تقریبی اقامت ${faNumber(total)} تومان است. برای تأیید نهایی با شما تماس می‌گیریم.`
  );

  form.reset();
  Object.values(fields).forEach((input) => input.classList.remove("is-invalid"));
});


/* ---------- ۴. پنجره‌ی جزئیات اتاق ---------- */

const roomModalEl = $("#roomModal");
const roomModal = new bootstrap.Modal(roomModalEl);
let currentRoom = null;
let goToForm = false;

function openRoom(key) {
  const room = ROOMS[key];
  if (!room) return;
  currentRoom = key;

  $("#roomModalTitle").textContent = room.name;
  $("#roomModalMeta").textContent = `ظرفیت: ${faNumber(room.guests)} نفر`;
  $("#roomModalText").textContent = room.text;
  $("#roomModalPrice").textContent = `از شبی ${faNumber(room.price)} تومان`;

  const image = $("#roomModalImg");
  image.src = room.image;
  image.alt = room.name;

  const items = room.features.map((feature) => {
    const li = document.createElement("li");
    li.innerHTML = '<i class="bi bi-check2" aria-hidden="true"></i>';
    li.append(feature);
    return li;
  });
  $("#roomModalFeatures").replaceChildren(...items);

  roomModal.show();
}

$$("[data-room]").forEach((button) => {
  button.addEventListener("click", () => openRoom(button.dataset.room));
});

// «درخواست رزرو این اتاق»: پنجره بسته شود، اتاق در فرم انتخاب شود و صفحه به فرم برود
$("#roomModalBook").addEventListener("click", () => {
  fields.room.value = currentRoom;
  validateField("room");
  goToForm = true;
  roomModal.hide();
});

// اسکرول را بعد از بسته شدن کامل پنجره انجام می‌دهیم، وگرنه قفل اسکرول مانع می‌شود
roomModalEl.addEventListener("hidden.bs.modal", () => {
  if (!goToForm) return;
  goToForm = false;
  $("#contact").scrollIntoView({ behavior: "smooth" });
});


/* ---------- ۵. نمایش بزرگ عکس‌های گالری ---------- */

const galleryImages = $$(".gallery-item img");
const lightboxEl = $("#lightbox");
const lightbox = new bootstrap.Modal(lightboxEl);
const lightboxImg = $("#lightboxImg");
const lightboxCaption = $("#lightboxCaption");
let lightboxIndex = 0;

function showLightboxImage(index) {
  // با رسیدن به آخر، دوباره از اول شروع شود (و برعکس)
  lightboxIndex = (index + galleryImages.length) % galleryImages.length;

  const thumb = galleryImages[lightboxIndex];
  lightboxImg.src = thumb.closest("button").dataset.full || thumb.src;
  lightboxImg.alt = thumb.alt;
  lightboxCaption.textContent =
    `${faNumber(lightboxIndex + 1)} از ${faNumber(galleryImages.length)} · ${thumb.alt}`;
}

galleryImages.forEach((thumb, index) => {
  thumb.closest("button").addEventListener("click", () => {
    showLightboxImage(index);
    lightbox.show();
  });
});

$("#lightboxPrev").addEventListener("click", () => showLightboxImage(lightboxIndex - 1));
$("#lightboxNext").addEventListener("click", () => showLightboxImage(lightboxIndex + 1));

// چون صفحه راست‌به‌چپ است، فلش چپ = بعدی و فلش راست = قبلی
document.addEventListener("keydown", (event) => {
  if (!lightboxEl.classList.contains("show")) return;
  if (event.key === "ArrowLeft") showLightboxImage(lightboxIndex + 1);
  if (event.key === "ArrowRight") showLightboxImage(lightboxIndex - 1);
});


/* ---------- ۶. سال پایین صفحه ---------- */

$("#year").textContent = new Date().getFullYear();
