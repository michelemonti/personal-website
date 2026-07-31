(function initSiteChrome() {
  "use strict";

  const pages = ["home", "profile", "experience", "work"];

  const locales = {
    it: {
      name: "Italiano",
      short: "IT",
      flag: "flag-it.svg",
      navLabel: "Navigazione principale",
      languageLabel: "Scegli la lingua",
      threeDEntry: "Accedi all’ambiente 3D",
      nav: {
        home: "Home",
        profile: "Profilo",
        experience: "Esperienze",
        work: "Lavora con me"
      },
      routes: {
        home: "/",
        profile: "/profilo-michele-monti.html",
        experience: "/esperienze.html",
        work: "/work-with-me.html"
      }
    },
    en: {
      name: "English",
      short: "EN",
      flag: "flag-us.svg",
      navLabel: "Main navigation",
      languageLabel: "Choose language",
      threeDEntry: "Enter the 3D environment",
      nav: {
        home: "Home",
        profile: "Profile",
        experience: "Experience",
        work: "Work with me"
      },
      routes: {
        home: "/en/",
        profile: "/en/michele-monti.html",
        experience: "/en/experience.html",
        work: "/en/work-with-me.html"
      }
    },
    es: {
      name: "Español",
      short: "ES",
      flag: "flag-es.svg",
      navLabel: "Navegación principal",
      languageLabel: "Elegir idioma",
      threeDEntry: "Acceder al entorno 3D",
      nav: {
        home: "Inicio",
        profile: "Perfil",
        experience: "Experiencia",
        work: "Trabaja conmigo"
      },
      routes: {
        home: "/es/",
        profile: "/es/michele-monti.html",
        experience: "/es/experiencia.html",
        work: "/es/trabaja-conmigo.html"
      }
    },
    ca: {
      name: "Català",
      short: "CA",
      flag: "flag-cat.svg",
      navLabel: "Navegació principal",
      languageLabel: "Tria l’idioma",
      threeDEntry: "Accedeix a l’entorn 3D",
      nav: {
        home: "Inici",
        profile: "Perfil",
        experience: "Experiència",
        work: "Treballa amb mi"
      },
      routes: {
        home: "/ca/",
        profile: "/ca/michele-monti.html",
        experience: "/ca/experiencia.html",
        work: "/ca/treballa-amb-mi.html"
      }
    },
    fr: {
      name: "Français",
      short: "FR",
      flag: "flag-fr.svg",
      navLabel: "Navigation principale",
      languageLabel: "Choisir la langue",
      threeDEntry: "Accéder à l’environnement 3D",
      nav: {
        home: "Accueil",
        profile: "Profil",
        experience: "Expérience",
        work: "Travailler avec moi"
      },
      routes: {
        home: "/fr/",
        profile: "/fr/michele-monti.html",
        experience: "/fr/experience.html",
        work: "/fr/travailler-avec-moi.html"
      }
    },
    sr: {
      name: "Српски",
      short: "SR",
      flag: "flag-rs.svg",
      navLabel: "Главна навигација",
      languageLabel: "Изаберите језик",
      threeDEntry: "Приступите 3D окружењу",
      nav: {
        home: "Почетна",
        profile: "Профил",
        experience: "Искуство",
        work: "Рад са мном"
      },
      routes: {
        home: "/sr/",
        profile: "/sr/michele-monti.html",
        experience: "/sr/iskustvo.html",
        work: "/sr/rad-sa-mnom.html"
      }
    },
    ru: {
      name: "Русский",
      short: "RU",
      flag: "flag-ru.svg",
      navLabel: "Основная навигация",
      languageLabel: "Выберите язык",
      threeDEntry: "Открыть 3D-пространство",
      nav: {
        home: "Главная",
        profile: "Профиль",
        experience: "Опыт",
        work: "Работать со мной"
      },
      routes: {
        home: "/ru/",
        profile: "/ru/michele-monti.html",
        experience: "/ru/opyt.html",
        work: "/ru/rabotat-so-mnoy.html"
      }
    }
  };

  function normalLocale(locale) {
    return Object.prototype.hasOwnProperty.call(locales, locale) ? locale : "it";
  }

  function normalPage(page) {
    return pages.includes(page) ? page : "home";
  }

  function route(locale, page) {
    const safeLocale = normalLocale(locale);
    const safePage = normalPage(page);
    return locales[safeLocale].routes[safePage];
  }

  function renderHeader(locale, page) {
    const safeLocale = normalLocale(locale);
    const safePage = normalPage(page);
    const current = locales[safeLocale];

    const navLinks = pages.map((pageKey) => {
      const currentAttribute = pageKey === safePage ? ' aria-current="page"' : "";
      const ctaClass = pageKey === "work" ? ' class="nav-cta"' : "";
      return `<a${ctaClass} href="${current.routes[pageKey]}"${currentAttribute}>${current.nav[pageKey]}</a>`;
    }).join("");

    const languageLinks = Object.entries(locales).map(([localeKey, localeData]) => {
      const active = localeKey === safeLocale;
      const activeClass = active ? " active" : "";
      const currentAttribute = active ? ' aria-current="true"' : "";
      return [
        `<a class="language-option${activeClass}" href="${localeData.routes[safePage]}"`,
        ` hreflang="${localeKey}" lang="${localeKey}" aria-label="${localeData.name}"`,
        ` title="${localeData.name}"${currentAttribute}>`,
        `<img src="/img/${localeData.flag}" alt="${localeData.short}" width="18" height="12">`,
        "</a>"
      ].join("");
    }).join("");

    return [
      `<a class="brand" href="${current.routes.home}"`,
      ` aria-label="Michele Monti — ${current.nav.home}">`,
      '<span class="brand-mark">▲</span> MICHELE MONTI</a>',
      `<nav class="site-nav" aria-label="${current.navLabel}">`,
      navLinks,
      '<div class="lang-toggle" role="group"',
      ` aria-label="${current.languageLabel}">`,
      languageLinks,
      "</div></nav>"
    ].join("");
  }

  function mount(documentRef) {
    documentRef.querySelectorAll(".site-header[data-page]").forEach((header) => {
      const documentLocale = documentRef.documentElement.lang.split("-")[0];
      const locale = normalLocale(header.dataset.locale || documentLocale);
      const page = normalPage(header.dataset.page);
      header.dataset.locale = locale;
      header.innerHTML = renderHeader(locale, page);

      if (page !== "home" && !documentRef.querySelector(".three-d-entry-link")) {
        const link = documentRef.createElement("a");
        link.className = "three-d-entry-link";
        link.href = `${route(locale, "home")}#ambiente-3d`;
        link.innerHTML = `
          <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
            <path d="m12 3 7.5 4.3v9.4L12 21l-7.5-4.3V7.3L12 3Z"></path>
            <path d="m4.5 7.3 7.5 4.4 7.5-4.4M12 11.7V21"></path>
          </svg>
          <span>${locales[locale].threeDEntry}</span>
        `;
        documentRef.body.appendChild(link);
      }
    });
  }

  const render = () => mount(document);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();
