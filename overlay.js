(function () {
  "use strict";

  var STAGE_W = 1920;
  var STAGE_H = 1080;

  var params = new URLSearchParams(window.location.search);
  var debug = params.get("debug") === "1" || params.get("debug") === "true";
  var configUrl = params.get("config") || "config.json";
  var profile = params.get("profile");
  var refreshMs = parseRefreshMs(params.get("refresh"));

  if (profile) {
    configUrl = "profiles/" + encodeURIComponent(profile) + ".json";
  }

  if (debug) {
    document.body.classList.add("debug");
  }

  applyUrlMaskOverrides(params);

  loadConfig().then(function (cfg) {
    if (params.get("refresh") == null && cfg && cfg.refreshMs != null) {
      refreshMs = parseRefreshMs(String(cfg.refreshMs));
    }
    startRefreshLoop(refreshMs);
  });

  function startRefreshLoop(ms) {
    if (window.__obsOverlayRefreshId) {
      window.clearInterval(window.__obsOverlayRefreshId);
    }
    if (ms > 0) {
      window.__obsOverlayRefreshId = window.setInterval(loadConfig, ms);
    }
  }

  function parseRefreshMs(raw) {
    if (raw === "0" || raw === "off" || raw === "false") return 0;
    if (raw == null || raw === "") return 1000;
    var n = parseInt(raw, 10);
    return isFinite(n) && n > 0 ? n : 1000;
  }

  function loadConfig() {
    var url = configUrl;
    url += (url.indexOf("?") === -1 ? "?" : "&") + "_=" + Date.now();

    return fetch(url, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("config " + res.status);
        return res.json();
      })
      .then(function (cfg) {
        mergeQueryMasks(cfg, params);
        render(cfg);
        return cfg;
      })
      .catch(function (err) {
        console.warn("[obs-overlay] config:", err.message);
        if (window.OVERLAY_CONFIG) {
          render(window.OVERLAY_CONFIG);
          return window.OVERLAY_CONFIG;
        }
        return {};
      });
  }

  function applyUrlMaskOverrides(params) {
    var single = params.get("mask");
    if (!single) return;
    window.__urlMasks = [parseMaskToken(single, "url-mask")];
  }

  function mergeQueryMasks(cfg, params) {
    var list = params.get("masks");
    if (list) {
      var extra = list.split(";").map(function (part, i) {
        return parseMaskToken(part.trim(), "mask-" + i);
      });
      cfg.masks = (cfg.masks || []).concat(extra);
    }
    if (window.__urlMasks) {
      cfg.masks = (cfg.masks || []).concat(window.__urlMasks);
    }
  }

  /**
   * Format: x,y,w,h[,color][,style]
   * Ex: 1320,720,580,340,#000000,blur
   */
  function parseMaskToken(token, id) {
    var parts = token.split(",").map(function (s) {
      return s.trim();
    });
    var x = num(parts[0], 0);
    var y = num(parts[1], 0);
    var w = num(parts[2], 100);
    var h = num(parts[3], 100);
    var color = "#0a0a0a";
    var style = "solid";
    if (parts[4]) {
      if (parts[4].charAt(0) === "#") {
        color = parts[4];
        if (parts[5]) style = parts[5];
      } else {
        style = parts[4];
      }
    }

    return {
      id: id,
      label: id,
      x: x,
      y: y,
      w: w,
      h: h,
      color: color,
      style: style === "blur" ? "blur" : "solid",
      visible: true,
    };
  }

  function num(v, fallback) {
    var n = parseFloat(v, 10);
    return isFinite(n) ? n : fallback;
  }

  function render(cfg) {
    var w = num(cfg.width, STAGE_W);
    var h = num(cfg.height, STAGE_H);
    document.documentElement.style.width = w + "px";
    document.documentElement.style.height = h + "px";
    document.body.style.width = w + "px";
    document.body.style.height = h + "px";

    var stage = document.getElementById("stage");
    stage.style.width = w + "px";
    stage.style.height = h + "px";

    var root = document.getElementById("masks");
    root.textContent = "";

    (cfg.masks || []).forEach(function (m) {
      if (m.visible === false) return;

      var el = document.createElement("div");
      el.className = "mask mask--" + (m.style === "blur" ? "blur" : "solid");
//      el.dataset.label = m.label || m.id || "mask";

//      var rect = resolveRect(m, w, h);
//      el.style.left = rect.x + "px";
//      el.style.top = rect.y + "px";
//      el.style.width = rect.w + "px";
//      el.style.height = rect.h + "px";

      var rect = resolveRect(m, w, h);

      el.dataset.label =
        (m.label || m.id || "mask") +
        " | X:" + Math.round(rect.x) +
        " Y:" + Math.round(rect.y) +
        " W:" + Math.round(rect.w) +
        " H:" + Math.round(rect.h);

      el.style.left = rect.x + "px";
      el.style.top = rect.y + "px";
      el.style.width = rect.w + "px";
      el.style.height = rect.h + "px";

      if (m.style !== "blur" && m.color) {
        el.style.background = m.color;
      }
      if (m.opacity != null) {
        el.style.opacity = String(m.opacity);
      }
      if (m.borderRadius != null) {
        el.style.borderRadius = m.borderRadius + "px";
      }

      root.appendChild(el);
    });

    var custom = document.getElementById("custom");
    if (cfg.customHtml) {
      custom.innerHTML = cfg.customHtml;
    } else {
      custom.textContent = "";
    }
  }

  function resolveRect(m, stageW, stageH) {
    function toPx(value, total) {
      if (typeof value === "string" && value.indexOf("%") !== -1) {
        return (parseFloat(value, 10) / 100) * total;
      }
      return num(value, 0);
    }

    return {
      x: toPx(m.x, stageW),
      y: toPx(m.y, stageH),
      w: toPx(m.w, stageW),
      h: toPx(m.h, stageH),
    };
  }
})();
