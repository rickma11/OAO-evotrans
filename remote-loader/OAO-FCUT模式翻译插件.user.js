// ==UserScript==
// @name         OAO-FCUT模式翻译插件
// @namespace    https://github.com/
// @version      27.0.4
// @description  中文翻译Futbin、Futgg、EASYSBC网站的英文信息，包括球员信息、进化名称等（远程代码自动更新版：本文件为 Loader，负责拉取并执行远端 bundle 清单，无需再到油叉更新）
// @author       我要欧啊欧
// @match        https://www.fut.gg/*
// @match        https://fut.gg/*
// @match        https://www.futbin.com/*
// @match        https://futbin.com/*
// @match        https://www.easysbc.io/*
// @match        https://easysbc.io/*
// @match        https://www.ea.com/ea-sports-fc/ultimate-team/web-app/*
// @match        https://www.easports.com/*/ea-sports-fc/ultimate-team/web-app/*
// @match        https://www.ea.com/*/ea-sports-fc/ultimate-team/web-app/*
// @connect      gitee.com
// @connect      github.com
// @connect      cdn.jsdelivr.net
// @connect      rawcdn.githack.com
// @connect      giteeusercontent.com
// @connect      raw.githubusercontent.com
// @connect      example.com
// @connect      open.feishu.cn
// @connect      scriptcat.org
// @connect      127.0.0.1
// @connect      localhost
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @license      MIT
// ==/UserScript==

/*
 * OAO 远程代码自动更新 Loader（多 bundle 清单版）
 * ------------------------------------------------------------
 * 工作原理：
 *   1. 本 userscript 只是「薄壳」，不含业务代码。
 *   2. 启动时先尝试本地开发地址（localDevBase，默认 127.0.0.1:5112），命中即跑本地 bundle 并启用 Alt+R 重载。
 *   3. 否则走生产流程：多源拉取 version.json（清单）-> 遍历 bundles[] ->
 *      每个 bundle 独立比对缓存版本 -> 版本变化才多源下载 -> 独立缓存 -> 用 new Function 注入 GM API 执行。
 *   4. 单个 bundle 拉取/执行失败只影响自己（try/catch 隔离），不影响其他 bundle 与整体可用性。
 *   5. 拉取失败则回退到上次缓存。
 *   6. 多源下载采用「并行竞速 + 主源优先」：所有源同时发起，主源（Gitee）成功则必须采用主源
 *      （避免 jsDelivr/GitHub 等 CDN 的陈旧副本被当成新版本缓存），主源失败/超时则采用最先成功的镜像。
 *   7. 彻底失败（首装无缓存可回退）时会在页面右下角弹出错误卡片 + 重试按钮，并自动重试
 *      （每 30s 一次、最多 5 次；切回标签页也会立刻重试一次）——避免玩家「装了插件却毫无反应且无法自救」。
 *
 * 多 bundle 拓展方式（以后加 oao-sbc 等附属插件）：
 *   在 version.json 的 bundles[] 里追加一项即可，例如
 *     { "id": "oao-sbc", "version": "26.2.11", "enabled": true,
 *       "codeUrls": ["https://.../oao-sbc-bundle.js", ...] }
 *   Loader 会自动遍历执行，无需改 Loader 代码。
 *
 * 为什么用 new Function 而非 FUTTO 的模板字符串注入：
 *   OAO 业务代码含有大量反引号与 ${}，用 `${code}` 模板注入会语法炸裂；
 *   new Function(...apiArgs, code) 把代码作为字符串参数传入，安全且不受反引号影响。
 *
 * 版本号解耦（每个 bundle 独立）：
 *   拆分后 GM_info.script.version 会变成本 Loader 的版本（几乎不变），
 *   因此 Loader 在执行业务代码前把真实 bundle 版本写入 window.__OAO_BUNDLE_VERSION__ / __OAO_BUNDLE_ID__，
 *   并作为 OAO_BUNDLE_ID / OAO_BUNDLE_VERSION 两个参数注入业务代码。
 *   现有 oao-translate bundle 的 getScriptVersion() 读 window.__OAO_BUNDLE_VERSION__（方法0）；
 *   新增 bundle 推荐直接读注入参数 OAO_BUNDLE_ID / OAO_BUNDLE_VERSION（无全局时序问题）。
 *
 * 日常更新：只改仓库里的 remote-loader/oao-bundle.js + bump remote-loader/version.json 的对应 bundle 版本，
 * 用户下次进页面自动拉取，无需再到油叉更新本脚本。
 * 本 Loader 首次仍需在油叉/从仓库安装一次（@name/@namespace 与原版一致 -> 覆盖升级，不会并列）。
 */

(function () {
  "use strict";

  const CONFIG = {
    // 本地开发模式：在 remote-loader/ 目录起静态服务（如 python -m http.server 5112）
    // 优先读本地 manifest.json（支持多 bundle 开发），没有则回退到单 oao-bundle.js（仅 translate）
    localDevBase: "http://127.0.0.1:5112",
    localDevLegacyUrl: "http://127.0.0.1:5112/oao-bundle.js",
    localTimeout: 800, // 本地探测从 3s 缩到 800ms：普通用户每进页面都会探一次 127.0.0.1:5112，超时太长会拖慢首装启动

    // 远端版本清单（多源兜底，返回 { version, bundles: [...] }）
    versionCheckUrls: [
      "https://gitee.com/rickma11/OAO-evotrans/raw/master/remote-loader/version.json",
      "https://raw.githubusercontent.com/rickma11/OAO-evotrans/master/remote-loader/version.json",
      "https://cdn.jsdelivr.net/gh/rickma11/OAO-evotrans@master/remote-loader/version.json",
    ],

    remoteTimeout: 15000,
  };

  let isLocalDev = false;
  let isLoading = false;

  // 避免请求命中旧缓存
  function withQuery(url, key, value) {
    try {
      const result = new URL(url);
      result.searchParams.set(key, String(value));
      return result.href;
    } catch (e) {
      const sep = url.indexOf("?") === -1 ? "?" : "&";
      return url + sep + key + "=" + encodeURIComponent(String(value));
    }
  }

  function isLocalUrl(url) {
    try {
      const h = new URL(url).hostname;
      return h === "127.0.0.1" || h === "localhost" || h === "[::1]";
    } catch (e) {
      return false;
    }
  }

  function fetchText(url, timeout) {
    timeout = timeout || CONFIG.remoteTimeout;
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: url,
        timeout: timeout,
        onload(response) {
          if (response.status === 200) {
            resolve(response.responseText);
          } else {
            reject(new Error("请求失败：HTTP " + response.status + " @ " + url));
          }
        },
        onerror() {
          reject(new Error("网络请求失败：" + url));
        },
        ontimeout() {
          reject(new Error("请求超时：" + url));
        },
        onabort() {
          reject(new Error("请求已取消：" + url));
        },
      });
    });
  }

  // 多源顺序尝试，任一成功即返回
  async function fetchFirst(urls, timeout, label) {
    let lastErr;
    for (const url of urls) {
      try {
        return await fetchText(withQuery(url, "_t", Date.now()), timeout);
      } catch (e) {
        lastErr = e;
        console.warn("[OAO-Loader] " + label + " 源失败，尝试下一个：" + url, e);
      }
    }
    throw lastErr || new Error(label + " 全部源失败");
  }

  // 并行竞速 + 主源优先（替代上面的顺序尝试，用于内核与清单下载）
  // 设计要点：
  //   1) 所有源同时发起，谁先成功就用谁 —— 主源被墙/被 VPN 绕走时，不必干等主源超时。
  //   2) 但「主源（第一个，Gitee）一旦成功就必须采用」：jsDelivr/GitHub 等 CDN 可能仍缓存着
  //      上一个版本的副本（jsDelivr 分支引用默认缓存约 12h），若让 CDN 抢先就会把陈旧内核
  //      当成新版本缓存下来，之后一直不更新。主源优先可保证拿到的是权威最新副本。
  //   3) 主源失败/超时 -> 采用最先成功的镜像；只要确定能返回就立即返回，不做无谓等待。
  async function fetchCodePreferPrimary(urls, timeout, stampKey, stampVal) {
    const list = (urls || []).filter(function (u) { return typeof u === "string" && u.trim(); });
    if (!list.length) throw new Error("没有可用的下载源");
    const key = stampKey || "_t";
    const val = stampVal || Date.now();
    const total = list.length;
    const settled = new Array(total).fill(null);
    let firstOk = -1;

    await new Promise(function (resolve) {
      let left = total;
      const check = function () {
        if (settled[0]) {
          if (settled[0].ok) return resolve();        // 主源成功 -> 立即采用（权威最新）
          if (firstOk >= 0) return resolve();         // 主源失败且已有镜像成功 -> 立即采用
        }
        if (left === 0) return resolve();             // 全部源都已出结果
      };
      list.forEach(function (u, i) {
        fetchCode(withQuery(u, key, val), timeout).then(
          function (code) {
            settled[i] = { ok: true, code: code };
            if (firstOk < 0) firstOk = i;
            left--;
            check();
          },
          function (err) {
            settled[i] = { ok: false, err: err };
            left--;
            check();
          }
        );
      });
    });

    if (settled[0] && settled[0].ok) return settled[0].code;
    if (firstOk >= 0) return settled[firstOk].code;
    const failed = settled.find(function (s) { return s && s.err; });
    throw (failed && failed.err) || new Error("所有下载源均失败");
  }

  async function fetchCode(url, timeout) {
    const code = await fetchText(url, timeout);
    if (!code || !code.trim()) {
      throw new Error("获取到的代码为空：" + url);
    }
    return code;
  }

  // 把任意版本的 version.json / manifest 归一化为 { version, bundles: [...] }
  // allowHttp=true 时允许 http（用于本地开发，localhost 是开发者本机）
  function normalizeManifest(data, allowHttp) {
    if (!data || typeof data !== "object") {
      throw new Error("清单不是合法对象");
    }

    const out = { version: String(data.version || "").trim(), bundles: [] };

    const pushBundle = (b) => {
      const id = String(b.id || "oao-translate").trim() || "oao-translate";
      let urls = [];
      if (Array.isArray(b.codeUrls) && b.codeUrls.length) {
        urls = b.codeUrls;
      } else if (typeof b.codeUrl === "string" && b.codeUrl.trim()) {
        urls = [b.codeUrl];
      }
      urls = urls.filter((u) => typeof u === "string" && u.trim());
      if (!urls.length) {
        console.warn("[OAO-Loader] bundle 缺少 codeUrl，跳过：" + id);
        return;
      }
      // 安全：强制远程代码地址使用 HTTPS（本地开发除外）
      for (const u of urls) {
        const pu = new URL(u);
        const local = isLocalUrl(u);
        if (!allowHttp && !local && pu.protocol !== "https:") {
          throw new Error("远程代码地址必须使用 HTTPS：" + u);
        }
        if (allowHttp && !local && pu.protocol !== "https:") {
          throw new Error("非本地代码地址必须使用 HTTPS：" + u);
        }
      }
      out.bundles.push({
        id: id,
        version: String(b.version || out.version || "0").trim() || "0",
        enabled: b.enabled !== false,
        codeUrls: urls,
      });
    };

    if (Array.isArray(data.bundles) && data.bundles.length) {
      for (const b of data.bundles) pushBundle(b);
    } else if (data.codeUrls || data.codeUrl) {
      // 向后兼容：旧的单 bundle 写法，归一成 oao-translate
      pushBundle({
        id: "oao-translate",
        version: data.version,
        enabled: true,
        codeUrls: data.codeUrls,
        codeUrl: data.codeUrl,
      });
    } else {
      throw new Error("清单缺少 bundles 或 codeUrl");
    }

    if (!out.bundles.length) {
      throw new Error("清单中没有可用的 bundle");
    }
    return out;
  }

  async function fetchManifest() {
    const text = await fetchCodePreferPrimary(CONFIG.versionCheckUrls, CONFIG.remoteTimeout);
    return normalizeManifest(JSON.parse(text), false);
  }

  // 读取本 Loader（外壳）自身版本号。
  // 关键：bundle 代码在 new Function 里执行，作用域中拿不到 GM_info，
  // 因此必须由 Loader 读取后显式注入，否则 bundle 侧 getLoaderVersion() 会误读成内容包版本。
  function getLoaderShellVersion() {
    try {
      if (typeof GM_info !== "undefined" && GM_info.script && GM_info.script.version) {
        return String(GM_info.script.version);
      }
    } catch (e) { /* ignore */ }
    return "";
  }

  // 注入 GM API + unsafeWindow + (id, version)，用 new Function 执行业务代码（严禁模板字符串注入）
  function executeBundle(code, bundle) {
    var loaderVersion = getLoaderShellVersion();
    try {
      window.__OAO_BUNDLE_VERSION__ = bundle.version;
      window.__OAO_BUNDLE_ID__ = bundle.id;
      if (loaderVersion) window.__OAO_LOADER_VERSION__ = loaderVersion;
    } catch (e) { /* 某些沙箱下 window 不可写，业务代码会回退到 GM_info */ }
    try {
      unsafeWindow.__OAO_BUNDLE_VERSION__ = bundle.version;
      unsafeWindow.__OAO_BUNDLE_ID__ = bundle.id;
      if (loaderVersion) unsafeWindow.__OAO_LOADER_VERSION__ = loaderVersion;
    } catch (e) { /* ignore */ }

    const runner = new Function(
      "GM_getValue",
      "GM_setValue",
      "GM_deleteValue",
      "GM_xmlhttpRequest",
      "unsafeWindow",
      "OAO_BUNDLE_ID",
      "OAO_BUNDLE_VERSION",
      "OAO_LOADER_VERSION",
      code
    );
    runner(
      GM_getValue,
      GM_setValue,
      GM_deleteValue,
      GM_xmlhttpRequest,
      unsafeWindow,
      bundle.id,
      bundle.version,
      loaderVersion
    );
  }

  // 单个 bundle：独立缓存键、独立版本比对、拉取失败回退缓存、执行失败不影响其他 bundle
  async function loadBundle(bundle) {
    const codeKey = "oao_loader_code_" + bundle.id;
    const verKey = "oao_loader_ver_" + bundle.id;
    const toggleKey = "oao_loader_enabled_" + bundle.id;

    // 软开关：version.json 里 enabled=false 或用户手动关闭 -> 跳过（保留缓存）
    const enabled = GM_getValue(toggleKey, bundle.enabled);
    if (!enabled) {
      console.log("[OAO-Loader] bundle 已禁用，跳过：" + bundle.id);
      return false;
    }

    const cachedCode = GM_getValue(codeKey, null);
    const cachedVer = GM_getValue(verKey, null);

    let code;
    if (cachedCode && cachedVer === bundle.version) {
      console.log("[OAO-Loader] 使用缓存 bundle：" + bundle.id + " @ " + bundle.version);
      code = cachedCode;
    } else {
      console.log("[OAO-Loader] 下载 bundle：" + bundle.id + " @ " + bundle.version);
      let lastErr;
      try {
        // 并行竞速 + 主源优先：主源（Gitee）成功就用主源，避免 CDN 陈旧副本被当成新版本缓存
        code = await fetchCodePreferPrimary(bundle.codeUrls, CONFIG.remoteTimeout, "v", bundle.version);
      } catch (e) {
        lastErr = e;
        console.warn("[OAO-Loader] bundle 所有源失败：" + bundle.id, e);
      }
      if (!code) {
        if (cachedCode) {
          console.warn("[OAO-Loader] 下载失败，回退缓存：" + bundle.id);
          code = cachedCode;
        } else {
          throw lastErr || new Error("bundle 所有源均失败：" + bundle.id);
        }
      } else {
        // 下载完成且成功才更新缓存，版本号最后写入，保证失败不污染缓存
        GM_setValue(codeKey, code);
        GM_setValue(verKey, bundle.version);
      }
    }

    try {
      executeBundle(code, bundle);
      return true;
    } catch (e) {
      // 执行失败：若用的是刚下载的新代码，尝试回退缓存再执行一次
      if (code !== cachedCode && cachedCode) {
        console.warn("[OAO-Loader] 新代码执行失败，回退缓存重试：" + bundle.id, e);
        executeBundle(cachedCode, bundle);
        return true;
      } else {
        throw e;
      }
    }
  }

  // ------------------------------------------------------------
  // 加载失败的用户可见提示 + 自动/手动重试
  // 背景：以前下载失败只 console.error，玩家完全无感知——插件装着却毫无反应，也无法自救。
  // ------------------------------------------------------------
  const LOADER_ERROR_ID = "oao-loader-error";
  const MAX_AUTO_RETRY = 5;        // 自动重试次数上限
  const AUTO_RETRY_DELAY = 30000;  // 自动重试间隔（ms）
  let retryCount = 0;

  function hideLoaderError() {
    try {
      const old = document.getElementById(LOADER_ERROR_ID);
      if (old && old.remove) old.remove();
    } catch (e) { /* ignore */ }
  }

  function showLoaderError(detail) {
    hideLoaderError();
    try {
      const box = document.createElement("div");
      box.id = LOADER_ERROR_ID;
      box.style.cssText =
        "position:fixed;right:16px;bottom:16px;z-index:2147483647;width:328px;box-sizing:border-box;" +
        "background:#1b1f27;color:#e8eaf0;border:1px solid #3a4150;border-radius:10px;" +
        "box-shadow:0 8px 28px rgba(0,0,0,.45);padding:14px 16px;" +
        "font:13px/1.65 -apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;";

      const title = document.createElement("div");
      title.textContent = "OAO 翻译插件 · 加载失败";
      title.style.cssText = "font-weight:700;font-size:14px;margin-bottom:6px;color:#ffb020;";

      const body = document.createElement("div");
      body.textContent = detail || "内核文件下载失败，插件暂不可用。";
      body.style.cssText = "margin-bottom:8px;";

      const tips = document.createElement("div");
      tips.textContent =
        "可依次尝试：① 关闭 VPN / 代理后点「重试」；② 更换网络（如手机热点）；③ 更换浏览器；" +
        "④ 确认能正常打开 gitee.com。若持续失败，可在控制台查看 [OAO-Loader] 日志反馈。";
      tips.style.cssText = "margin-bottom:12px;color:#aab2c0;font-size:12px;";

      const row = document.createElement("div");

      const retryBtn = document.createElement("button");
      retryBtn.type = "button";
      retryBtn.textContent = "重试";
      retryBtn.style.cssText =
        "margin-right:8px;padding:5px 16px;border:0;border-radius:6px;background:#2f6fed;" +
        "color:#fff;cursor:pointer;font-size:13px;";
      retryBtn.addEventListener("click", function () {
        hideLoaderError();
        void init();
      });

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.textContent = "关闭";
      closeBtn.style.cssText =
        "padding:5px 16px;border:1px solid #3a4150;border-radius:6px;background:transparent;" +
        "color:#aab2c0;cursor:pointer;font-size:13px;";
      closeBtn.addEventListener("click", hideLoaderError);

      row.appendChild(retryBtn);
      row.appendChild(closeBtn);
      box.appendChild(title);
      box.appendChild(body);
      box.appendChild(tips);
      box.appendChild(row);
      (document.body || document.documentElement).appendChild(box);
    } catch (e) {
      console.warn("[OAO-Loader] 无法展示错误提示：", e);
    }
  }

  function scheduleAutoRetry() {
    if (retryCount >= MAX_AUTO_RETRY) return;
    retryCount++;
    setTimeout(function () { void init(); }, AUTO_RETRY_DELAY);
  }

  // 切回标签页时立刻重试一次：网络抖动往往在切换网络后就恢复了
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) return;
    if (retryCount >= MAX_AUTO_RETRY) return;
    retryCount++;
    void init();
  });

  async function loadProduction() {
    let manifest;
    try {
      manifest = await fetchManifest();
    } catch (error) {
      console.error("[OAO-Loader] 版本清单拉取失败：", error);
      showLoaderError("版本清单下载失败，无法获取内核文件（通常是网络问题）。");
      scheduleAutoRetry();
      return;
    }

    let anyExecuted = false;
    for (const bundle of manifest.bundles) {
      try {
        if (await loadBundle(bundle)) anyExecuted = true;
      } catch (e) {
        console.error("[OAO-Loader] bundle 加载失败（已隔离）：" + bundle.id, e);
      }
    }

    if (anyExecuted) {
      hideLoaderError();
    } else {
      showLoaderError("内核文件下载失败，插件暂不可用（首次安装无本地缓存时必然如此）。");
      scheduleAutoRetry();
    }
  }

  // 本地开发：优先读 manifest.json（多 bundle），没有则回退单 oao-bundle.js（仅 translate）
  async function loadLocal() {
    try {
      const text = await fetchText(
        withQuery(CONFIG.localDevBase + "/manifest.json", "_t", Date.now()),
        CONFIG.localTimeout
      );
      const manifest = normalizeManifest(JSON.parse(text), true);
      let any = false;
      for (const b of manifest.bundles) {
        try {
          const code = await fetchCode(withQuery(b.codeUrls[0], "_t", Date.now()), CONFIG.localTimeout);
          executeBundle(code, b);
          any = true;
          console.log("[OAO-Loader] 本地 bundle：" + b.id + " @ " + b.version);
        } catch (e) {
          console.warn("[OAO-Loader] 本地 bundle 失败：" + b.id, e);
        }
      }
      return any;
    } catch (e) {
      console.log("[OAO-Loader] 本地 manifest.json 不可用，尝试 legacy 单 bundle");
    }

    try {
      const code = await fetchCode(
        withQuery(CONFIG.localDevLegacyUrl, "_t", Date.now()),
        CONFIG.localTimeout
      );
      executeBundle(code, {
        id: "oao-translate",
        version: "local-dev",
        enabled: true,
        codeUrls: [CONFIG.localDevLegacyUrl],
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  async function init() {
    if (isLoading) return;
    isLoading = true;
    isLocalDev = false;

    try {
      console.log("[OAO-Loader] 初始化...");

      const localOk = await loadLocal();
      if (localOk) {
        isLocalDev = true;
        console.log("[OAO-Loader] 本地开发模式（支持 Alt+R 重载页面）");
        return;
      }

      await loadProduction();
    } catch (error) {
      console.error("[OAO-Loader] 初始化失败：", error);
      showLoaderError("初始化失败：" + String((error && error.message) || error));
      scheduleAutoRetry();
    } finally {
      isLoading = false;
    }
  }

  // 本地开发重载：OAO bundle 未提供 destroy()，直接重执行会叠加观察者/侧边栏，
  // 因此采用「干净刷新页面」方式重新加载本地最新代码（仅本地开发模式可用）。
  function reload() {
    if (!isLocalDev) return;
    console.log("[OAO-Loader] 本地开发：刷新页面以加载最新本地代码");
    location.reload();
  }

  function registerReloadShortcut() {
    document.addEventListener("keydown", function (event) {
      if (!isLocalDev || event.repeat) return;

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target && target.isContentEditable)
      ) {
        return;
      }

      if (
        event.altKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.metaKey &&
        event.code === "KeyR"
      ) {
        event.preventDefault();
        event.stopPropagation();
        reload();
      }
    });
  }

  unsafeWindow.oaoReload = reload;

  registerReloadShortcut();
  void init();
})();
