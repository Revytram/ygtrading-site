/* ygtrading.ca — small progressive enhancements; every page works without this file. */
(function () {
  "use strict";

  // header shadow once the page scrolls
  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // mobile menu
  var btn = document.querySelector("[data-menu]");
  var nav = document.getElementById("primary-nav");
  if (btn && nav) {
    var setOpen = function (open) {
      nav.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    };
    btn.addEventListener("click", function () {
      var open = !nav.classList.contains("open");
      setOpen(open);
      if (open) { var first = nav.querySelector("a"); if (first) first.focus(); }
    });
    // close when keyboard focus leaves both the menu and its button
    nav.addEventListener("focusout", function (e) {
      if (!nav.classList.contains("open")) return;
      var to = e.relatedTarget;
      if (to && !nav.contains(to) && to !== btn) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
  }

  // product gallery thumbnails
  document.querySelectorAll("[data-gallery]").forEach(function (g) {
    var main = g.querySelector(".main-img");
    g.querySelectorAll(".thumbs button").forEach(function (b) {
      b.addEventListener("click", function () {
        main.removeAttribute("srcset");
        main.src = b.getAttribute("data-src");
        g.querySelectorAll(".thumbs button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
      });
    });
  });

  // catalogue search (client-side, over a small JSON index)
  var form = document.querySelector("[data-search]");
  if (form) {
    var input = form.querySelector("input");
    var out = document.querySelector("[data-results]");
    var countEl = document.querySelector("[data-results-count]");
    var index = null;
    var esc = function (s) {
      return String(s).replace(/[&<>"']/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    };
    // "26x36", "26 X 36" and '26" × 36"' all normalise to "26 36"
    var norm = function (s) {
      return String(s).replace(/(\d)\s*["″'′]?\s*[x×X]\s*(?=\d)/g, "$1 ")
        .toUpperCase().replace(/[\s"'″′×]+/g, " ").trim();
    };
    var render = function () {
      var q = input.value.trim();
      if (!index) return;
      if (!q) { out.innerHTML = ""; countEl.textContent = ""; return; }
      var terms = norm(q).split(" ").filter(Boolean);
      var hits = index.filter(function (p) {
        var hay = norm(p.t + " " + p.c + " " + p.k);
        return terms.every(function (t) { return hay.indexOf(t) !== -1; });
      });
      countEl.textContent = hits.length === 1 ? form.getAttribute("data-count-one")
        : hits.length ? form.getAttribute("data-count").replace("{n}", hits.length)
        : form.getAttribute("data-none").replace("{q}", q);
      out.innerHTML = hits.map(function (p) {
        var pic = p.i ? '<img src="' + esc(p.i) + '" alt="" loading="lazy">' : "";
        return '<article class="card product-card"><a class="card-link" href="' + esc(p.u) + '">' +
          '<div class="tile">' + pic + '</div><div class="card-body"><h3>' + esc(p.t) + '</h3>' +
          '<p class="meta">' + esc(p.c) + '</p></div></a></article>';
      }).join("");
    };
    fetch(form.getAttribute("data-index")).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (d) {
      index = d;
      var params = new URLSearchParams(window.location.search);
      if (params.get("q")) input.value = params.get("q");
      render();
    }).catch(function () { countEl.textContent = form.getAttribute("data-error"); });
    input.addEventListener("input", function () {
      var url = new URL(window.location);
      if (input.value.trim()) url.searchParams.set("q", input.value.trim()); else url.searchParams.delete("q");
      history.replaceState(null, "", url);
      render();
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
  }
})();
