"use strict";

(() => {
  const scriptUrl = new URL(document.currentScript.src);
  const rootUrl = new URL("../../", scriptUrl);
  const includeUrl = (name) => new URL(`includes/${name}.html`, rootUrl);

  function refreshIcons() {
    if (window.lucide?.createIcons) {
      window.lucide.createIcons();
    }
  }

  function showLoadingFailure(placeholder, error, name) {
    placeholder.dataset.layoutError = "true";
    placeholder.textContent = `Unable to load shared layout: ${name}`;
    placeholder.setAttribute("role", "alert");
    console.error(`Failed to load shared layout "${name}":`, error);
  }

  async function loadInclude(name) {
    const response = await fetch(includeUrl(name), { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const documentFragment = new DOMParser().parseFromString(html, "text/html");

    if (!documentFragment.body) {
      throw new Error("The include response did not contain a valid HTML body");
    }

    return documentFragment;
  }

  function applyPageSpecificSidebarVariant(sidebarTemplate, variant) {
    if (variant?.startsWith("teacher-")) {
      const activeLink = sidebarTemplate.querySelector(
        `[data-layout-active="${CSS.escape(variant)}"]`
      );

      activeLink?.classList.add("active");
      activeLink?.setAttribute("aria-current", "page");

      return;
    }
    if (variant === "student-dashboard") {
      const homeLink = sidebarTemplate.querySelector('[data-layout-active="dashboard-home"]');
      const progressLink = sidebarTemplate.querySelector('[data-layout-active="dashboard-progress"]');
      homeLink?.classList.add("active");
      homeLink?.setAttribute("href", "#home");
      progressLink?.setAttribute("href", "#progress");
    }

    if (variant === "student-assessment") {

      const assessmentLink = sidebarTemplate.querySelector(
        'a[href$="student-assessment.html"]'
      );

      assessmentLink?.classList.add("active");

      assessmentLink?.setAttribute(
        "aria-current",
        "page"
      );

    }
    
    if (variant === "student-ai") {
      const aiLink = sidebarTemplate.querySelector('[data-layout-active="ai-tutor"]');
      aiLink?.classList.add("active");
      sidebarTemplate.querySelector(".sd-side-nav")?.removeAttribute("aria-label");
    }
  }

  async function injectLayouts() {
    const placeholders = Array.from(
      document.querySelectorAll("[data-layout]")
    );

    if (placeholders.length === 0) return;

    const includeNames = [
      ...new Set(placeholders.map((placeholder) => placeholder.dataset.layout))
    ];
    const includeDocuments = new Map();

    await Promise.all(includeNames.map(async (name) => {
      try {
        includeDocuments.set(name, await loadInclude(name));
      } catch (error) {
        for (const placeholder of placeholders.filter(
          (item) => item.dataset.layout === name
        )) {
          showLoadingFailure(placeholder, error, name);
        }
        throw error;
      }
    }));

    for (const placeholder of placeholders) {
      const name = placeholder.dataset.layout;
      const variant = placeholder.dataset.layoutVariant;

      if (!includeDocuments.has(name)) continue;

      let templateId;

      if (name === "navbar") {
        templateId = `${variant}-navbar-template`;

        if (variant?.startsWith("student-")) {
          templateId = `${variant}-topbar-template`;
        } else if (variant?.startsWith("teacher-")) {
          templateId = "teacher-topbar-template";
        }
      } else if (name === "footer") {
        templateId = `${variant}-footer-template`;
      } else if (name === "sidebar") {
        templateId = variant?.startsWith("teacher-")
          ? "teacher-sidebar-template"
          : "student-sidebar-template";
      }

      const template = templateId
        ? includeDocuments.get(name).querySelector(`#${CSS.escape(templateId)}`)
        : null;

      if (!(template instanceof HTMLTemplateElement)) {
        const error = new Error(`Missing template "#${templateId}"`);
        showLoadingFailure(placeholder, error, name);
        throw error;
      }

      const fragment = template.content.cloneNode(true);
      const sidebar = fragment.querySelector(".sd-sidebar");

      if (sidebar && variant) {
        applyPageSpecificSidebarVariant(sidebar, variant);
      }

      placeholder.replaceWith(fragment);
    }

    refreshIcons();
    document.dispatchEvent(new CustomEvent("edu-layouts-ready"));
  }

  let ready;

  try {
    ready = injectLayouts();
  } catch (error) {
    ready = Promise.reject(error);
  }

  window.eduLayouts = Object.freeze({
    ready
  });

  ready.catch((error) => {
    document.dispatchEvent(new CustomEvent("edu-layouts-error", {
      detail: error
    }));
  });
})();
