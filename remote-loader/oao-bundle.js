  'use strict';

  console.log('[OAO] 脚本开始执行');
  console.log('[OAO] 当前页面:', window.location.href);
  console.log('[OAO] 当前域名:', window.location.hostname);

  // 存储相关函数
  function getStorageValue(key) {
    try {
      const value = GM_getValue(key, null);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      // console.warn('Failed to get storage value:', error);
      return null;
    }
  }

  // 设置缓存
  function setStorageValue(key, value) {
    try {
      GM_setValue(key, JSON.stringify(value));
    } catch (error) {
      // console.warn('Failed to set storage value:', error);
    }
  }

  const _s = 'OAO-FC26-v1.5.0-20260325';
  const _c = getStorageValue('oaevo_code_signature');
  if (!_c || _c !== _s) {
    setStorageValue('oaevo_code_signature', _s);
  }
  
  const _k = 'OAO-FC26-2026';
  
  function _e(data) {
    const _t = JSON.stringify(data);
    const _x = [];
    for (let i = 0; i < _t.length; i++) {
      _x.push(_t.charCodeAt(i) ^ _k.charCodeAt(i % _k.length));
    }
    return btoa(String.fromCharCode(..._x));
  }
  
  function _d0(encryptedStr) {
    try {
      const _y = atob(encryptedStr);
      const _z = [];
      for (let i = 0; i < _y.length; i++) {
        _z.push(_y.charCodeAt(i) ^ _k.charCodeAt(i % _k.length));
      }
      return JSON.parse(String.fromCharCode(..._z));
    } catch (error) {
      return null;
    }
  }
  
  // ========== 配置 ==========
  
  const USE_SHORTEN_TERMS = true;
  const SHOW_ORIGINAL_WITH_BRACKETS = false;
  const LOCATION_CHECK_INTERVAL_MS = 10000;  // 从3秒改为10秒，降低检查频率

  const EVOLUTIONS_STORAGE_KEY = 'oaevo_evolutions_dict_cache';
  const THREE_HOURS_MS =  60 * 1000; // 1分钟
  const SIX_HOURS_MS = 5 * 60 * 1000; // 5分钟
  // 多数据源配置（优先使用 Gitee，国内访问更快）
  // ⚠️ 备用源必须与主源「同名」（evolutions1.json）。
  //    2026-10-10 故障复盘：备用源曾指向旧文件 evolutions.json（仅 451 条，Gitee 上仍残留），
  //    主源一旦拉取失败/被拦截，就会静默降级到旧字典 → fut.gg 上「新进化的翻译完全不显示」。
  const EVOLUTIONS_DICT_URLS = [
    'https://gitee.com/rickma11/OAO-evotrans/raw/master/evolutions1.json?inline=true', // 主数据源（Gitee）
    'https://cdn.jsdelivr.net/gh/rickma11/OAO-evotrans@main/evolutions1.json', // CDN（同名文件）
    'https://raw.githubusercontent.com/rickma11/OAO-evotrans/refs/heads/main/evolutions1.json', // GitHub（同名文件）
    // 最后兜底：旧文件名（内容可能偏旧）。有下方「防降级」保护，永远不会比本地缓存更差。
    'https://cdn.jsdelivr.net/gh/rickma11/OAO-evotrans@main/evolutions.json'
  ];

  // 给数据源 URL 追加时间戳，绕过 Gitee / jsDelivr 的 CDN 缓存
  // （GM_xmlhttpRequest 的 Cache-Control: no-cache 只能绕开浏览器缓存，绕不过 CDN 边缘缓存）
  function withCacheBust(urls) {
    const ts = Date.now();
    return urls.map(u => u + (u.indexOf('?') >= 0 ? '&' : '?') + '_t=' + ts);
  }

  // 统计字典原始数据的条目数（数组 = 长度；对象 = 键数）
  function countDictEntries(raw) {
    if (!raw) return 0;
    if (Array.isArray(raw)) return raw.length;
    if (typeof raw === 'object') return Object.keys(raw).length;
    return 0;
  }
  
  // 内置翻译字典多数据源配置
  const BUILT_IN_DICTIONARIES_URLS = [
    'https://gitee.com/rickma11/OAO-evotrans/raw/master/built-in-dictionaries.json', // 主数据源（Gitee）
    'https://raw.githubusercontent.com/rickma11/OAO-evotrans/refs/heads/main/built-in-dictionaries.json', // 备用数据源（GitHub）
    'https://cdn.jsdelivr.net/gh/rickma11/OAO-evotrans@main/built-in-dictionaries.json' // CDN 数据源
  ];

  // SBC 标题翻译字典：来源为仓库内的 miniapp-dictionaries.json 的 sbc 分类（通用基础字典）
  // 与 built-in-dictionaries.json 分离，独立拉取与缓存
  const SBC_DICTIONARY_URLS = [
    'https://gitee.com/rickma11/OAO-evotrans/raw/master/miniapp-dictionaries.json', // 主数据源（Gitee）
    'https://raw.githubusercontent.com/rickma11/OAO-evotrans/refs/heads/main/miniapp-dictionaries.json', // 备用数据源（GitHub）
    'https://cdn.jsdelivr.net/gh/rickma11/OAO-evotrans@main/miniapp-dictionaries.json' // CDN 数据源
  ];
  const SBC_DICTIONARY_STORAGE_KEY = 'oaevo_sbc_dictionary_cache';

  // 球员评测字典：来源同为仓库内 miniapp-dictionaries.json 的 PLAYER_REVIEW 分类（键为 EAID）
  // 与 sbc 共用同一份 json 数据源与缓存文件，仅归一化后单独存放
  const PLAYER_REVIEW_STORAGE_KEY = 'oaevo_player_review_cache';

  const BUILT_IN_DICTIONARIES_STORAGE_KEY = 'oaevo_built_in_dictionaries_cache';
  const REMOTE_EVOLUTIONS_DICT_URL = EVOLUTIONS_DICT_URLS[0]; // 主数据源
  const SIDEBAR_ID = 'oaevo-sidebar';
  const SIDEBAR_DOCK_ID = 'oaevo-sidebar-dock';
  const SIDEBAR_PANEL_ID = 'oaevo-sidebar-panel';
  const SIDEBAR_BUTTON_CLASS = 'oaevo-sidebar-btn';
  const FUTGG_TRANSLATION_ENABLED_KEY = 'oaevo_futgg_translation_enabled';
  const FUTBIN_TRANSLATION_ENABLED_KEY = 'oaevo_futbin_translation_enabled';
  const EASYSBC_TRANSLATION_ENABLED_KEY = 'oaevo_easysbc_translation_enabled';
  const EVOLUTION_FORMAT_KEY = 'oaevo_evolution_format'; // 0: 中文（英文）, 1: 来源中文, 2: 英文
  const SIDEBAR_HIDDEN_KEY = 'oaevo_sidebar_hidden'; // 侧边栏隐藏状态（桌面端用户偏好）
  const MOBILE_EXPANDED_KEY = 'oaevo_mobile_expanded'; // 移动端用户是否显式展开侧边栏
  const FLOAT_ICON_POSITION_KEY = 'oaevo_float_icon_position'; // 悬浮图标位置
  
  // 版本检查配置
  const SCRIPTCAT_SCRIPT_URL = 'https://scriptcat.org/zh-CN/script-show-page/5488';
  const VERSION_MANIFEST_URL = 'https://gitee.com/rickma11/OAO-evotrans/raw/master/remote-loader/version.json';
  const VERSION_CHECK_KEY = 'oaevo_last_version_check_date';
  const VERSION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24小时检查一次
  const NEW_VERSION_KEY = 'oaevo_new_version_available'; // 存储新版本信息
  const LAST_VERSION_PROMPT_KEY = 'oaevo_last_version_prompt'; // 弹窗频率控制：每版本每天只弹一次
  
  // 更新内容配置
  const UPDATE_CONTENT_URL = 'https://gitee.com/rickma11/OAO-evotrans/raw/master/catch-evo.json';
  const LAST_UPDATE_CHECK_KEY = 'oaevo_last_update_check_date'; // 最后检查更新内容的日期
  const UPDATE_CONTENT_KEY = 'oaevo_update_content_cache'; // 缓存更新内容

  // 特技搭配推荐（位置/角色 → 银特技/金特技）数据源配置
  const PLAYSTYLE_RECOMMEND_URLS = [
    'https://gitee.com/rickma11/OAO-evotrans/raw/master/playstyle-recommend.json?inline=true', // 主数据源（Gitee）
    'https://raw.githubusercontent.com/rickma11/OAO-evotrans/refs/heads/main/playstyle-recommend.json', // 备用数据源（GitHub）
    'https://cdn.jsdelivr.net/gh/rickma11/OAO-evotrans@main/playstyle-recommend.json', // CDN 数据源
    'https://rawcdn.githack.com/rickma11/OAO-evotrans/main/playstyle-recommend.json' // CDN 数据源
  ];
  const PLAYSTYLE_RECOMMEND_STORAGE_KEY = 'oaevo_playstyle_recommend_cache';
  const PLAYSTYLE_RECOMMEND_TTL = 6 * 60 * 60 * 1000; // 6 小时
  // [调试] 强制刷新特技推荐数据：设为 true 时，跳过 GM 缓存并主动删除旧缓存，
  // 下次运行必定从 gitee 拉取最新 JSON，用于排查银/金特技显示异常是否由旧缓存引起。
  // ⚠️ 确认问题后请务必改回 false，否则每次都绕过缓存直连 gitee（增加请求开销）。
  const FORCE_REFRESH_PLAYSTYLE_CACHE = false;

  // 已安装版本记录（用于“覆盖升级”时触发存储迁移）
  const INSTALLED_VERSION_KEY = 'oaevo_installed_version';

  // 按版本自修复：覆盖升级（不删除旧文件）时，GM 存储中的偏好不会自动清空，
  // 可能残留会阻塞移动端浮标的旧状态（如旧版误写的 MOBILE_EXPANDED_KEY=true）。
  // 当检测到的脚本版本与上次记录不一致时，清除该阻塞项，使覆盖升级等价于“干净重装”的移动端 UI 状态。
  // 注意：仅清理移动端浮标相关的 MOBILE_EXPANDED_KEY；桌面端 SIDEBAR_HIDDEN_KEY、
  // 用户的自定义词条、进化显示格式等其它偏好均予以保留。
  function migrateStorageOnUpgrade() {
    try {
      const current = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version)
        ? GM_info.script.version
        : null;
      if (!current) return;
      const last = getStorageValue(INSTALLED_VERSION_KEY);
      if (last === current) return; // 同版本，无需迁移
      // 清除会阻塞移动端悬浮图标的旧状态
      setStorageValue(MOBILE_EXPANDED_KEY, false);
      setStorageValue(INSTALLED_VERSION_KEY, current);
    } catch (e) {
      // 迁移失败不应影响主流程
    }
  }
  migrateStorageOnUpgrade();

  // 全局变量存储新版本信息
  let newVersionInfo = null;

  /**
   * 统一获取当前脚本版本号（双保险）
   * 方法1: GM_info.script.version（Tampermonkey/Violentmonkey 原生 API）
   * 方法2: 从页面 <script> 标签内容解析 @version（兼容 CSP 限制等 GM_info 不可用的场景）
   * 所有需要读取当前版本的代码路径都必须调用此函数，避免各处逻辑不一致导致版本号显示错误。
   */
  function getScriptVersion() {
    // 方法0: 远程 bundle 真实版本（由 Loader 注入 window.__OAO_BUNDLE_VERSION__，优先使用）
    try {
      if (typeof window !== 'undefined' && window.__OAO_BUNDLE_VERSION__) {
        return String(window.__OAO_BUNDLE_VERSION__);
      }
    } catch (e) { /* 静默降级 */ }

    // 方法1: GM_info
    try {
      if (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) {
        return GM_info.script.version;
      }
    } catch (e) { /* GM_info 不可用时静默降级 */ }

    // 方法2: 从 DOM script 标签解析 @version
    try {
      const scriptEl = document.querySelector('script[id^="tampermonkey"], script[id^="violentmonkey"]');
      if (scriptEl) {
        const m = scriptEl.textContent.match(/@version\s+([\d.]+)/);
        if (m && m[1]) return m[1];
      }
    } catch (e) { /* DOM 解析失败时静默降级 */ }

    // 最终兜底：返回一个明显偏旧的值，确保版本比较时认为"有新版本可用"
    return '0.0.0';
  }

  // 获取外壳（Loader / userscript 本体）真实版本号
  // 约定（与用户商定）：外壳版本 = 内容包版本的前三段。例如内容包 27.0.3.1 -> 外壳 27.0.3；
  //   内容包 27.0.4.2 -> 外壳 27.0.4。这样无需真正读取外壳源码也能得出外壳版本。
  // 优先顺序：Loader 注入值 > GM_info（可用时）> 由内容包版本前三段推导。
  function getLoaderVersion() {
    // 方法0: Loader 注入的外壳版本（新 Loader 可用；旧 Loader 无此注入）
    try {
      if (typeof window !== 'undefined' && window.__OAO_LOADER_VERSION__) {
        return String(window.__OAO_LOADER_VERSION__);
      }
    } catch (e) { /* 静默降级 */ }
    // 方法1: GM_info（原版单体脚本直跑时可用；远程 bundle 沙箱里通常拿不到）
    try {
      if (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) {
        return String(GM_info.script.version);
      }
    } catch (e) { /* GM_info 不可用时静默降级 */ }
    // 方法2: 由内容包版本取前三段推导外壳版本（关键兜底，无需读取外壳）
    //   ScriptCat 不把 userscript 源码暴露到页面 DOM，GM_info 也不可达，故以该约定为准。
    try {
      const parts = parseVersionParts(getScriptVersion());
      if (parts && parts.length >= 3) {
        return parts.slice(0, 3).join('.');
      }
    } catch (e) { /* 推导失败时静默降级 */ }
    // 最终兜底：内容包版本原文
    return getScriptVersion();
  }

  // 自定义翻译配置
  const CUSTOM_TRANSLATIONS_KEY = 'oaevo_custom_translations';
  
  // 标记翻译管理弹窗是否有修改（使用window对象确保全局可访问）
  window.translationManagerHasChanges = false;
  
  // 初始化翻译开关状态
  let futggTranslationEnabled = getStorageValue(FUTGG_TRANSLATION_ENABLED_KEY) !== false; // 默认打开
  let futbinTranslationEnabled = getStorageValue(FUTBIN_TRANSLATION_ENABLED_KEY) !== false; // 默认打开
  let easysbcTranslationEnabled = getStorageValue(EASYSBC_TRANSLATION_ENABLED_KEY) !== false; // 默认打开
  let utwebTranslationEnabled = getStorageValue('oaevo_utweb_translation_enabled') !== false; // 默认打开
  let utwebTranslationFormat = getStorageValue('oaevo_utweb_translation_format') || 0; // 0: [总评]中文（英文）, 1: [总评]中文
  let evolutionFormat = getStorageValue(EVOLUTION_FORMAT_KEY) || 0; // 默认0: 中文（英文）
  
  // 初始化自定义翻译
  let customTranslations = getStorageValue(CUSTOM_TRANSLATIONS_KEY) || {};
  
  // 统计中文key的数量
  let chineseKeyCount = 0;
  for (const category in customTranslations) {
    if (customTranslations.hasOwnProperty(category)) {
      for (const key in customTranslations[category]) {
        if (/[\u4e00-\u9fa5]/.test(key)) {
          chineseKeyCount++;
        }
      }
    }
  }
  
  // 清理可能存在的中文key的翻译
  let hasChanges = false;
  for (const category in customTranslations) {
    if (customTranslations.hasOwnProperty(category)) {
      const translations = customTranslations[category];
      for (const key in translations) {
        if (translations.hasOwnProperty(key)) {
          // 检查key是否为中文
          if (/[\u4e00-\u9fa5]/.test(key)) {
            delete translations[key];
            hasChanges = true;
          }
        }
      }
      // 如果分类为空，删除分类
      if (Object.keys(translations).length === 0) {
        delete customTranslations[category];
        hasChanges = true;
      }
    }
  }
  
  // 保存清理后的customTranslations（无论是否为空都要保存）
  if (hasChanges) {
    setStorageValue(CUSTOM_TRANSLATIONS_KEY, customTranslations);
  }

  // 侧边栏样式
  const SIDEBAR_STYLES = `
    #${SIDEBAR_ID}{
      position:fixed;
      top:140px;
      right:0;
      z-index:99998;
      display:flex;
      flex-direction:column;
      align-items:center;
      transform:translateX(0);
      transition:transform .18s ease,opacity .12s ease;
      font-family:inherit;
    }
    #${SIDEBAR_ID}.expanded{
      transform:translateX(0);
    }
    #${SIDEBAR_ID}.dragging{
      transition:none;
      opacity:.96;
    }
    #${SIDEBAR_PANEL_ID}{
      background:rgba(30,30,30,.96);
      border:1px solid #333;
      border-radius:12px;
      box-shadow:0 4px 24px #0005;
      padding:10px;
      display:flex;
      flex-direction:column;
      gap:8px;
      min-width:120px;
    }
    #${SIDEBAR_PANEL_ID} h3{
      color:#ffc800;
      font-size:14px;
      font-weight:700;
      margin:0 0 8px 0;
      text-align:center;
      padding-bottom:8px;
      border-bottom:1px solid #444;
    }
    .${SIDEBAR_BUTTON_CLASS}{
      width:100px;
      height:36px;
      border:none;
      outline:none;
      cursor:pointer;
      border-radius:8px;
      box-shadow:0 2px 8px #0002;
      font-weight:600;
      transition:all .15s;
      user-select:none;
      font-size:12px;
    }
    .${SIDEBAR_BUTTON_CLASS}:hover{
      filter:brightness(1.1);
    }
    .${SIDEBAR_BUTTON_CLASS}:active{
      transform:scale(.98);
    }
    body.utweb-page #${SIDEBAR_ID}{
  left:0;       /* 改为左侧贴边 */
  right:auto;   /* 取消右侧定位 */
  top:auto;     /* 取消顶部定位 */
  bottom:50px; /* 距离底部300px */
    }
    body.utweb-page #${SIDEBAR_PANEL_ID}{
      background:rgba(30,30,30,.98);
      box-shadow:none;
      min-width:auto;
    }
    body.utweb-page .${SIDEBAR_BUTTON_CLASS}{
      width:110px;
      height:40px;
      font-size:13px;
    }
    .oaevo-sidebar-btn--refresh{
      background:#007bff;
      color:#fff;
    }
    .${SIDEBAR_BUTTON_CLASS}--settings{
      background:#4caf50;
      color:#fff;
    }
    .${SIDEBAR_BUTTON_CLASS}--settings.disabled{
      background:#999;
      color:#fff;
      cursor:pointer;
      opacity:1;
    }
    .${SIDEBAR_BUTTON_CLASS}--expand{
      background:#ff9800;
      color:#fff;
    }
    .${SIDEBAR_BUTTON_CLASS}--expand.disabled{
      background:#999;
      color:#fff;
      cursor:pointer;
      opacity:1;
    }
    .${SIDEBAR_BUTTON_CLASS}--feature{
      background:#9c27b0;
      color:#fff;
    }
    .${SIDEBAR_BUTTON_CLASS}--evolution-format{
      background:#ffc107;
      color:#000;
      white-space: pre-line;
      line-height: 1.4;
    }
    .${SIDEBAR_BUTTON_CLASS}--evolution-format.chinese-only{
      background:#2196f3;
      color:#fff;
    }
    .${SIDEBAR_BUTTON_CLASS}--evolution-format.english-only{
      background:#f44336;
      color:#fff;
    }
    .${SIDEBAR_BUTTON_CLASS}--utweb-format{
      background:#548C00;
      color:#fff;
      white-space: pre-line;
      line-height: 1.4;
      text-align:center;
      padding:4px 8px;
    }
    .${SIDEBAR_BUTTON_CLASS}--utweb-format.chinese-only{
      background:#2196f3;
      color:#fff;
    }
    .oaevo-sidebar-label{
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      font-size:10px;
      color:#aaa;
      margin-top:4px;
    }
    .${SIDEBAR_BUTTON_CLASS}--playstyle{
      background:#00bcd4;
      color:#fff;
    }
    /* ===== 特技搭配推荐 Modal ===== */
    .oao-ps-overlay{
      position:fixed;
      inset:0;
      z-index:2147483640;
      background:rgba(0,0,0,.55);
      display:flex;
      align-items:center;
      justify-content:center;
    }
    .oao-ps-modal{
      width:min(680px,92vw);
      max-height:86vh;
      overflow:auto;
      background:#1e1e1e;
      color:#e8e8e8;
      border-radius:12px;
      box-shadow:0 10px 40px #000a;
      padding:16px 18px;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"PingFang SC","Microsoft YaHei",sans-serif;
    }
    .oao-ps-header{
      display:flex;
      align-items:center;
      justify-content:space-between;
      margin-bottom:12px;
    }
    .oao-ps-title{
      font-size:17px;
      font-weight:700;
      color:#fff;
    }
    .oao-ps-close{
      background:transparent;
      border:none;
      color:#bbb;
      font-size:18px;
      cursor:pointer;
      line-height:1;
    }
    .oao-ps-close:hover{color:#fff;}
    .oao-ps-toolbar{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      align-items:flex-end;
      margin-bottom:10px;
    }
    .oao-ps-field{
      display:flex;
      flex-direction:column;
      font-size:11px;
      color:#9aa4b5;
      gap:3px;
    }
    .oao-ps-pos,.oao-ps-role{
      background:#2a2a2a;
      color:#fff;
      border:1px solid #444;
      border-radius:6px;
      padding:6px 8px;
      font-size:13px;
      min-width:120px;
    }
    .oao-ps-recommend{
      background:#d6b456;
      color:#1e1e1e;
      border:none;
      border-radius:6px;
      padding:8px 14px;
      font-weight:700;
      cursor:pointer;
      font-size:13px;
    }
    .oao-ps-recommend:not(.oao-active){
      background:#3a3a3a;
      color:#ddd;
      border:1px solid #555;
    }
    .oao-ps-custom{
      background:#d6b456;
      color:#1e1e1e;
      border:none;
      border-radius:6px;
      padding:8px 14px;
      font-weight:700;
      cursor:pointer;
      font-size:13px;
    }
    .oao-ps-custom:not(.oao-active){
      background:#3a3a3a;
      color:#ddd;
      border:1px solid #555;
    }
    .oao-ps-icon.oao-clickable{cursor:pointer;transition:transform .1s;}
    .oao-ps-icon.oao-clickable:hover{transform:scale(1.08);}
    .oao-ps-catrow{
      display:flex;
      align-items:flex-start;
      gap:12px;
      padding:8px 0;
      border-top:1px solid #333;
    }
    .oao-ps-catlabel{
      flex:0 0 48px;
      font-size:13px;
      font-weight:600;
      color:#cfd6e0;
      padding-top:4px;
    }
    .oao-ps-chips{
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      flex:1;
    }
    .oao-ps-icon{
      font-family:'UltimateTeam-Icons','PingFang SC','Microsoft YaHei',sans-serif;
      font-size:12px;
      line-height:1.2;
      padding:5px 9px;
      border-radius:7px;
      border:1px solid transparent;
      white-space:nowrap;
      user-select:none;
    }
    .oao-ps-icon.oao-ps-state-none{
      color:rgba(190,193,198,.55);
      background:#262626;
      border-color:#333;
    }
    .oao-ps-icon.oao-ps-state-silver{
      color:#f7f9fb;
      background:#2f3a4a;
      border-color:#5a7fb0;
    }
    .oao-ps-icon.oao-ps-state-gold{
      color:#d6b456;
      background:#3a3220;
      border-color:#d6b456;
    }
    .oao-ps-icon.oao-ps-glyph{
      font-size:20px;
      padding:2px 8px;
      border-radius:8px;
      line-height:1;
    }
    /* 底部功能说明 */
    .oao-ps-footer{
      margin:10px 16px 12px;
      padding:10px 14px;
      background:#1e1e1e;
      border-radius:8px;
      border:1px solid #333;
      font-size:11.5px;
      color:#aaa;
      line-height:1.7;
    }
    .oao-ps-footer-item{
      margin-bottom:6px;
    }
    .oao-ps-footer-item:last-child{
      margin-bottom:0;
    }
    .oao-ps-footer-dot{
      display:inline-block;
      width:18px;
      text-align:center;
      font-weight:700;
      margin-right:2px;
    }
    .oao-ps-footer-rec{ color:#d6b456; }
    .oao-ps-footer-cus{ color:#8ab4f8; }
    .oao-ps-footer b{ color:#ddd; }
    .oao-ps-footer-silver{
      color:#f7f9fb;
      background:#2f3a4a;
      padding:1px 5px;
      border-radius:3px;
      border:1px solid #5a7fb0;
      font-size:10.5px;
    }
    .oao-ps-footer-gold{
      color:#d6b456;
      background:#3a3220;
      padding:1px 5px;
      border-radius:3px;
      border:1px solid #d6b456;
      font-size:10.5px;
    }
  `;

  // 注入侧边栏样式
  function injectSidebarStyles() {
    const style = document.createElement('style');
    style.textContent = SIDEBAR_STYLES;
    document.head.appendChild(style);
  }

  // 页面检测函数
  function isUtWebPage() {
    return location.href.includes('ultimate-team/web-app');
  }

  function isFutggPage() {
    return window.location.hostname.includes('fut.gg');
  }

  function isFutbinPage() {
    return window.location.hostname.includes('futbin.com');
  }

  function isEasysbcPage() {
    return window.location.hostname.includes('easysbc.io');
  }

  function isSupportedPage() {
    return isFutggPage() || isFutbinPage() || isEasysbcPage() || isUtWebPage();
  }

  // 立即创建侧边栏（不等待页面加载完成）
  function initSidebarEarly() {
    const isFutggPage = window.location.hostname.includes('fut.gg');
    const isEasysbcPage = window.location.hostname.includes('easysbc.io');
    const isFutbinPage = window.location.hostname.includes('futbin.com');
    const isUtWebPage = location.href.includes('ultimate-team/web-app');
    
    if (!isFutggPage && !isFutbinPage && !isEasysbcPage && !isUtWebPage) return;
    
    if (document.body) {
      createSidebar();
      if (shouldSidebarHide()) {
        const panel = document.getElementById(SIDEBAR_PANEL_ID);
        if (panel) {
          panel.style.display = 'none';
        }
        // 即使 panel 因故未找到，也要创建悬浮图标，确保移动端有恢复入口
        createFloatIcon();
      }
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        createSidebar();
        if (shouldSidebarHide()) {
          const panel = document.getElementById(SIDEBAR_PANEL_ID);
          if (panel) {
            panel.style.display = 'none';
          }
          createFloatIcon();
        }
      });
    }
  }

  // UTWEB 页面等待点击遮罩隐藏
  function waitForClickShieldToHide(callback, timeout = 5000) {
    const start = Date.now();
    const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    const interval = setInterval(() => {
      if (w.gClickShield && typeof w.gClickShield.isShowing === 'function') {
        if (!w.gClickShield.isShowing()) {
          clearInterval(interval);
          callback();
        } else if (Date.now() - start > timeout) {
          clearInterval(interval);
          console.warn('[OAO][UTWEB] 等待 gClickShield 隐藏超时');
          callback();
        }
      } else {
        clearInterval(interval);
        callback();
      }
    }, 100);
  }

  function translateUtwebEvolutionTitles(root, evolutionDict) {
    if (!evolutionDict || Object.keys(evolutionDict).length === 0) {
      return;
    }

    const evolutionTitleElements = root.querySelectorAll('.ut-academy-slot-tile-view--title');
    
    evolutionTitleElements.forEach(element => {
      if (element.dataset.oaoEvoTranslated) {
        return;
      }

      const originalText = element.textContent.trim();
      
      let prefix = '';
      let mainText = originalText;
      let rating = '';

      if (originalText.startsWith('[总评]')) {
        prefix = '[总评]';
        mainText = originalText.substring(4).trim();
      }

      const ratingMatch = mainText.match(/^\[(\d+)\]\s*(.+)$/);
      if (ratingMatch) {
        rating = `[${ratingMatch[1]}] `;
        mainText = ratingMatch[2].trim();
      }

      const englishMatch = mainText.match(/^(.+?)\s+([A-Za-z].*)$/);
      let chineseName = mainText;
      let existingEnglish = '';

      if (englishMatch) {
        const potentialChinese = englishMatch[1].trim();
        if (/[\u4e00-\u9fa5]/.test(potentialChinese)) {
          chineseName = potentialChinese;
          existingEnglish = englishMatch[2].trim();
        }
      }

      if (!/[\u4e00-\u9fa5]/.test(chineseName)) {
        element.dataset.oaoEvoTranslated = 'true';
        return;
      }

      let foundEnglishKey = null;

      for (const englishKey in evolutionDict) {
        if (evolutionDict.hasOwnProperty(englishKey)) {
          const dictValue = evolutionDict[englishKey];
          let translation;

          if (Array.isArray(dictValue)) {
            let matchedItem = dictValue.find(item => {
              if (typeof item !== 'object') return false;
              return !item.futgg_id && !item.futbin_id && !item.easysbc_id;
            });
            
            if (!matchedItem) {
              matchedItem = dictValue.find(item => typeof item === 'object');
            }
            
            if (matchedItem) {
              translation = matchedItem.webpagedata || matchedItem.shorten || matchedItem.CN || '';
            }
          } else if (typeof dictValue === 'object') {
            translation = dictValue.webpagedata || dictValue.shorten || dictValue.CN || '';
          } else {
            translation = dictValue;
          }

          if (translation === chineseName) {
            foundEnglishKey = englishKey;
            break;
          }
        }
      }

      if (foundEnglishKey) {
        if (utwebTranslationFormat === 0) {
          element.textContent = `${prefix}${rating}${chineseName}（${foundEnglishKey}）`;
        } else {
          element.textContent = `${prefix}${rating}${chineseName}`;
        }
      }

      element.dataset.oaoEvoTranslated = 'true';
    });
  }

  function insertUtwebEvolutionNameInHeader(root, evolutionDict) {
    if (!evolutionDict || Object.keys(evolutionDict).length === 0) {
      return;
    }

    const headers = root.querySelectorAll('.ut-academy-club-search-view--header');
    
    headers.forEach(header => {
      if (header.dataset.oaoEvoHeaderAdded) {
        return;
      }

      const titleElement = root.querySelector('h1.title');
      if (!titleElement) {
        return;
      }

      const chineseName = titleElement.textContent.trim();
      
      if (!/[\u4e00-\u9fa5]/.test(chineseName)) {
        return;
      }

      let foundEnglishKey = null;
      let foundSource = '';

      for (const englishKey in evolutionDict) {
        if (evolutionDict.hasOwnProperty(englishKey)) {
          const dictValue = evolutionDict[englishKey];
          let translation;
          let source = '';

          if (Array.isArray(dictValue)) {
            let matchedItem = dictValue.find(item => {
              if (typeof item !== 'object') return false;
              if (item.futgg_id || item.futbin_id || item.easysbc_id) return false;
              const itemTranslation = item.webpagedata || item.shorten || item.CN || '';
              return itemTranslation === chineseName;
            });
            
            if (!matchedItem) {
              matchedItem = dictValue.find(item => {
                if (typeof item !== 'object') return false;
                const itemTranslation = item.webpagedata || item.shorten || item.CN || '';
                return itemTranslation === chineseName;
              });
            }
            
            if (matchedItem) {
              translation = matchedItem.webpagedata || matchedItem.shorten || matchedItem.CN || '';
              source = matchedItem.source || '';
            }
          } else if (typeof dictValue === 'object') {
            translation = dictValue.webpagedata || dictValue.shorten || dictValue.CN || '';
            source = dictValue.source || '';
          } else {
            translation = dictValue;
          }

          if (translation === chineseName) {
            foundEnglishKey = englishKey;
            foundSource = source;
            break;
          }
        }
      }

      if (!foundEnglishKey) {
        return;
      }

      const descriptionElement = header.querySelector('.ut-academy-club-search-view--slot-description');
      if (!descriptionElement) {
        return;
      }

      const nameContainer = document.createElement('div');
      nameContainer.style.cssText = `
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.2);
      `;

      const chineseDiv = document.createElement('div');
      chineseDiv.textContent = chineseName;
      chineseDiv.dataset.oaoTranslated = 'true';
      chineseDiv.style.cssText = `
        font-size: 25px;
        font-weight: bold;
        color: #fff;
        margin-bottom: 4px;
      `;

      const englishDiv = document.createElement('div');
      englishDiv.textContent = foundEnglishKey;
      englishDiv.dataset.oaoTranslated = 'true';
      englishDiv.style.cssText = `
        font-size: 20px;
        color: rgba(255,255,255,0.7);
        font-style: italic;
        margin-bottom: 4px;
      `;

      const sourceDiv = document.createElement('div');
      sourceDiv.textContent = foundSource ? `来源: ${foundSource}` : '';
      sourceDiv.dataset.oaoTranslated = 'true';
      sourceDiv.style.cssText = `
        font-size: 16px;
        color: rgba(255,255,255,0.5);
      `;

      nameContainer.dataset.oaoTranslated = 'true';
      nameContainer.appendChild(chineseDiv);
      nameContainer.appendChild(englishDiv);
      nameContainer.appendChild(sourceDiv);

      header.insertBefore(nameContainer, descriptionElement);
      header.dataset.oaoEvoHeaderAdded = 'true';
    });
  }

  let oaoUtWebStarted = false;

  function startOaoForUtWeb(reason = 'unknown') {
    if (oaoUtWebStarted) {
      return;
    }
    oaoUtWebStarted = true;

    console.log('[OAO][UTWEB] start:', reason);

    injectSidebarStyles();
    syncSidebarState();

    if (typeof preloadEvolutionDictionary === 'function') {
      preloadEvolutionDictionary();
    }

    setTimeout(() => {
      console.log('[OAO][UTWEB] 开始翻译页面');
      translateRoot(document);
    }, 1000);

    setTimeout(() => {
      console.log('[OAO][UTWEB] 启动翻译观察器');
      startTranslationObserver();
    }, 2000);

    console.log('[OAO][UTWEB] 启动完成');
  }

  function installUtWebHomeHook() {
    const w = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

    if (!w.UTHomeHubView || !w.UTHomeHubView.prototype || !w.UTHomeHubView.prototype._generate) {
      return false;
    }

    if (w.UTHomeHubView.prototype.__oaoHooked) {
      return true;
    }

    const originalGenerate = w.UTHomeHubView.prototype._generate;

    w.UTHomeHubView.prototype._generate = function (...args) {
      const result = originalGenerate.apply(this, args);
      
      waitForClickShieldToHide(() => {
        try {
          startOaoForUtWeb('hook');
        } catch (e) {
          console.warn('[OAO][UTWEB] hook 启动失败:', e);
        }
      });

      return result;
    };

    w.UTHomeHubView.prototype.__oaoHooked = true;
    console.log('[OAO][UTWEB] UTHomeHubView._generate hook installed');
    return true;
  }

  function bootstrapUtWeb() {
    console.log('[OAO][UTWEB] bootstrapUtWeb');

    let tries = 0;
    let homeHookInstalled = false;

    const timer = setInterval(() => {
      tries += 1;

      if (!homeHookInstalled) {
        homeHookInstalled = installUtWebHomeHook();
      }

      if (homeHookInstalled) {
        clearInterval(timer);
        return;
      }

      if (tries >= 100) {
        clearInterval(timer);
        console.warn('[OAO][UTWEB] hook 安装失败，使用 DOM 兜底启动');
        waitForClickShieldToHide(() => {
          startOaoForUtWeb('fallback');
        });
      }
    }, 100);
  }

  // 注入样式后立即初始化侧边栏
  injectSidebarStyles();
  initSidebarEarly();



  // 移除侧边栏
  function removeSidebar() {
    const sidebar = document.getElementById(SIDEBAR_ID);
    if (sidebar) {
      sidebar.remove();
    }
    // 同时移除可能残留的悬浮图标
    const floatIcon = document.getElementById('oaevo-float-icon');
    if (floatIcon) {
      floatIcon.remove();
    }
  }

  // 检测是否为移动端设备
  function isMobileDevice() {
    const ua = navigator.userAgent || '';
    // 1) UA 关键字匹配（覆盖 Android/iPhone/iPad/Windows Phone 等）
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Windows Phone/i.test(ua);
    // 2) 视口宽度是判断移动端最可靠的信号：手机（竖屏/横屏）与小屏平板基本都 <= 1024，
    //    而真实桌面通常 >= 1280。优先用宽度判定，避免 pointer/touch 等信号在部分手机内核
    //    或“桌面版网站”模式下误判为非移动端，导致移动端不显示悬浮图标。
    const width = window.innerWidth || (document.documentElement && document.documentElement.clientWidth) || 0;
    if (width > 0 && width <= 1024) return true;
    // 3) UA 明确包含移动设备关键字
    if (isMobileUA) return true;
    return false;
  }

  // 判断侧边栏是否应该隐藏
  // 规则：移动端默认隐藏并显示悬浮图标；除非用户在移动端显式展开过（MOBILE_EXPANDED_KEY）。
  // 桌面端遵循用户显式偏好（SIDEBAR_HIDDEN_KEY），且不与移动端状态互相干扰。
  function shouldSidebarHide() {
    if (isMobileDevice()) {
      // 移动端：默认隐藏；仅当用户在移动端主动展开并保持时才显示
      if (getStorageValue(MOBILE_EXPANDED_KEY) === true) return false;
      return true;
    }
    // 桌面端：遵循用户显式设置
    const stored = getStorageValue(SIDEBAR_HIDDEN_KEY);
    if (stored === true) return true;
    if (stored === false) return false;
    return false;
  }

  // 同步侧边栏显示状态
  function syncSidebarState() {
    const isFutggPage = window.location.hostname.includes('fut.gg');
    const isEasysbcPage = window.location.hostname.includes('easysbc.io');
    const isFutbinPage = window.location.hostname.includes('futbin.com');
    const isUtWebPage = location.href.includes('ultimate-team/web-app');
    
    // 确保 body 存在且页面加载完成
    if (!document.body || document.readyState === 'loading') {
      setTimeout(() => syncSidebarState(), 100);
      return;
    }
    
    if (isFutggPage || isFutbinPage || isEasysbcPage || isUtWebPage) {
      createSidebar();
      // 检查是否应该保持隐藏状态（含移动端默认隐藏逻辑）
      if (shouldSidebarHide()) {
        const panel = document.getElementById(SIDEBAR_PANEL_ID);
        if (panel) {
          panel.style.display = 'none';
        }
        // 即使 panel 因故未找到，也要创建悬浮图标，确保移动端有恢复入口
        createFloatIcon();
      } else {
        // 侧边栏可见时，清理可能残留的悬浮图标
        const existingIcon = document.getElementById('oaevo-float-icon');
        if (existingIcon) existingIcon.remove();
      }
    } else {
      removeSidebar();
    }
  }

  // 移动端兜底：若当前是移动端、侧边栏处于隐藏状态、但悬浮图标丢失，则重建悬浮图标。
  // 用于应对 fut.gg 等 SPA 在加载/重渲染过程中偶发地把浮标冲掉，或脚本早期执行时 body 尚未就绪的情况。
  function ensureMobileFloatIcon() {
    try {
      if (!isMobileDevice()) return;
      const panel = document.getElementById(SIDEBAR_PANEL_ID);
      const panelHidden = !panel ||
        panel.style.display === 'none' ||
        (typeof getComputedStyle === 'function' && getComputedStyle(panel).display === 'none');
      if (panelHidden && !document.getElementById('oaevo-float-icon')) {
        createFloatIcon();
      }
    } catch (e) {
      // 兜底逻辑不应影响主流程
    }
  }

  // 创建可拖动的悬浮图标
  function createFloatIcon() {
    // 如果已存在，不重复创建
    if (document.getElementById('oaevo-float-icon')) {
      return;
    }
    
    const floatIcon = document.createElement('div');
    floatIcon.id = 'oaevo-float-icon';
    floatIcon.style.position = 'fixed';
    floatIcon.style.width = '50px';
    floatIcon.style.height = '50px';
    floatIcon.style.borderRadius = '50%';
    floatIcon.style.backgroundColor = '#fff';
    floatIcon.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    floatIcon.style.cursor = 'grab';
    floatIcon.style.zIndex = '2147483646';
    floatIcon.style.display = 'flex';
    floatIcon.style.alignItems = 'center';
    floatIcon.style.justifyContent = 'center';
    floatIcon.style.transition = 'box-shadow 0.3s ease';
    floatIcon.style.userSelect = 'none';
    
    // 恢复保存的位置，默认在右侧中间
    const savedPosition = getStorageValue(FLOAT_ICON_POSITION_KEY);
    if (savedPosition) {
      floatIcon.style.right = savedPosition.right + 'px';
      floatIcon.style.top = savedPosition.top + 'px';
      floatIcon.style.transform = 'none';
    } else {
      floatIcon.style.right = '10px';
      floatIcon.style.top = '50%';
      floatIcon.style.transform = 'translateY(-50%)';
    }
    
    // 添加图标
    const icon = document.createElement('img');
    icon.src = 'https://s41.ax1x.com/2026/03/01/peS2bPP.png';
    icon.style.width = '50px';
    icon.style.height = '50px';
    icon.style.objectFit = 'contain';
    icon.style.pointerEvents = 'none'; // 防止图标干扰拖动
    icon.onerror = function() {
      floatIcon.innerHTML = 'OAO';
      floatIcon.style.fontSize = '16px';
      floatIcon.style.fontWeight = 'bold';
      floatIcon.style.color = '#000';
    };
    floatIcon.appendChild(icon);
    
    // 拖动相关变量
    let isDragging = false;
    let startX, startY, startRight, startTop;
    
    // 开始拖动的通用函数
    function startDrag(e) {
      isDragging = false; // 重置拖动状态
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      startX = clientX;
      startY = clientY;
      
      const rect = floatIcon.getBoundingClientRect();
      startRight = window.innerWidth - rect.right;
      startTop = rect.top;
      
      floatIcon.style.cursor = 'grabbing';
      floatIcon.style.transform = 'none';
      e.preventDefault();
    }
    
    // 移动的通用函数
    function moveDrag(e) {
      if (startX === undefined) return;
      
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      const deltaX = startX - clientX;
      const deltaY = clientY - startY;
      
      // 移动超过5px才算拖动
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        isDragging = true;
      }
      
      if (isDragging) {
        let newRight = startRight + deltaX;
        let newTop = startTop + deltaY;
        
        // 限制在屏幕范围内
        newRight = Math.max(0, Math.min(newRight, window.innerWidth - 50));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - 50));
        
        floatIcon.style.right = newRight + 'px';
        floatIcon.style.top = newTop + 'px';
      }
    }
    
    // 结束拖动的通用函数
    function endDrag() {
      if (startX !== undefined) {
        floatIcon.style.cursor = 'grab';
        
        // 保存位置
        const rect = floatIcon.getBoundingClientRect();
        setStorageValue(FLOAT_ICON_POSITION_KEY, {
          right: window.innerWidth - rect.right,
          top: rect.top
        });
        
        // 检测是否是点击（非拖动）
        if (!isDragging) {
          let panel = document.getElementById(SIDEBAR_PANEL_ID);
          if (!panel) {
            createSidebar();
            panel = document.getElementById(SIDEBAR_PANEL_ID);
          }
          if (panel) {
            panel.style.display = 'flex';
            setStorageValue(SIDEBAR_HIDDEN_KEY, false);
            // 移动端用户显式展开后，保持展开状态（避免每次刷新又变回悬浮图标）
            if (isMobileDevice()) setStorageValue(MOBILE_EXPANDED_KEY, true);
          }
          floatIcon.remove();
        }
        
        startX = undefined;
        startY = undefined;
      }
    }
    
    // 鼠标事件
    floatIcon.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', moveDrag);
    document.addEventListener('mouseup', endDrag);
    
    // 触摸事件（支持手机端）
    floatIcon.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', moveDrag, { passive: false });
    document.addEventListener('touchend', endDrag);
    
    // 点击显示侧边栏（非拖动时）
    floatIcon.addEventListener('click', () => {
      if (!isDragging) {
        let panel = document.getElementById(SIDEBAR_PANEL_ID);
        if (!panel) {
          // panel 不存在时先重建侧边栏
          createSidebar();
          panel = document.getElementById(SIDEBAR_PANEL_ID);
        }
        if (panel) {
          panel.style.display = 'flex';
          setStorageValue(SIDEBAR_HIDDEN_KEY, false);
          // 移动端用户显式展开后，保持展开状态（避免每次刷新又变回悬浮图标）
          if (isMobileDevice()) setStorageValue(MOBILE_EXPANDED_KEY, true);
        }
        floatIcon.remove();
      }
    });
    
    // 悬浮效果
    floatIcon.addEventListener('mouseenter', () => {
      if (!isDragging) {
        floatIcon.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
      }
    });
    floatIcon.addEventListener('mouseleave', () => {
      floatIcon.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    });
    
    // 确保 body 存在
    if (!document.body) {
      setTimeout(() => createFloatIcon(), 100);
      return;
    }
    document.body.appendChild(floatIcon);
  }

  // 创建侧边栏
  function createSidebar() {
    if (document.getElementById(SIDEBAR_ID)) {
      return;
    }
    
    const sidebar = document.createElement('div');
    sidebar.id = SIDEBAR_ID;

    const panel = document.createElement('div');
    panel.id = SIDEBAR_PANEL_ID;

    const title = document.createElement('h3');
    title.textContent = 'OAO翻译插件';

    const refreshBtn = document.createElement('button');
    refreshBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--refresh`;
    refreshBtn.textContent = '更新翻译';
    refreshBtn.addEventListener('click', handleRefreshButtonClick);

    const isFutggPage = window.location.hostname.includes('fut.gg');
    const isEasysbcPage = window.location.hostname.includes('easysbc.io');
    const isFutbinPage = window.location.hostname.includes('futbin.com');
    const isUtWebPage = location.href.includes('ultimate-team/web-app');

    const utwebFormatBtn = document.createElement('button');
    utwebFormatBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--utweb-format${utwebTranslationFormat === 1 ? ' chinese-only' : ''}`;
    if (isUtWebPage) {
      utwebFormatBtn.textContent = utwebTranslationFormat === 0 ? '进化格式\n中文（英文）' : '进化格式\n中文';
      utwebFormatBtn.addEventListener('click', () => {
        utwebTranslationFormat = utwebTranslationFormat === 0 ? 1 : 0;
        setStorageValue('oaevo_utweb_translation_format', utwebTranslationFormat);
        utwebFormatBtn.textContent = utwebTranslationFormat === 0 ? '进化格式\n中文（英文）' : '进化格式\n中文';
        
        if (utwebTranslationFormat === 1) {
          utwebFormatBtn.classList.add('chinese-only');
        } else {
          utwebFormatBtn.classList.remove('chinese-only');
        }
        
        const evolutionTitleElements = document.querySelectorAll('.ut-academy-slot-tile-view--title');
        
        if (utwebTranslationFormat === 1) {
          evolutionTitleElements.forEach(element => {
            const text = element.textContent;
            const newText = text.replace(/（[^（）]+）/g, '');
            element.textContent = newText;
            element.dataset.oaoEvoTranslated = 'true';
          });
        } else {
          evolutionTitleElements.forEach(element => {
            delete element.dataset.oaoEvoTranslated;
          });
          
          if (dictionaries.evolutions) {
            translateUtwebEvolutionTitles(document, dictionaries.evolutions);
            insertUtwebEvolutionNameInHeader(document, dictionaries.evolutions);
          }
        }
      });
    }

    const settingsBtn = document.createElement('button');
    settingsBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--settings`;
    
    // 优先检查UTWEB页面
    if (isUtWebPage) {
      settingsBtn.textContent = utwebTranslationEnabled ? 'UTWEB翻译: 开' : 'UTWEB翻译: 关';
      if (!utwebTranslationEnabled) {
        settingsBtn.classList.add('disabled');
      }
      settingsBtn.addEventListener('click', () => {
        utwebTranslationEnabled = !utwebTranslationEnabled;
        setStorageValue('oaevo_utweb_translation_enabled', utwebTranslationEnabled);
        settingsBtn.textContent = utwebTranslationEnabled ? 'UTWEB翻译: 开' : 'UTWEB翻译: 关';
        if (utwebTranslationEnabled) {
          settingsBtn.classList.remove('disabled');
        } else {
          settingsBtn.classList.add('disabled');
        }
        if (location.href.includes('ultimate-team/web-app')) {
          if (utwebTranslationEnabled) {
            translateRoot(document);
          } else {
            location.reload();
          }
        }
      });
    // 优先检查EASYSBC页面
    } else if (isEasysbcPage) {
      settingsBtn.textContent = easysbcTranslationEnabled ? 'EASYSBC翻译: 开' : 'EASYSBC翻译: 关';
      if (!easysbcTranslationEnabled) {
        settingsBtn.classList.add('disabled');
      }
      settingsBtn.addEventListener('click', () => {
        // 切换翻译开关状态
        easysbcTranslationEnabled = !easysbcTranslationEnabled;
        
        // 保存状态到本地存储
        setStorageValue(EASYSBC_TRANSLATION_ENABLED_KEY, easysbcTranslationEnabled);
        
        // 更新按钮文本和样式
        settingsBtn.textContent = easysbcTranslationEnabled ? 'EASYSBC翻译: 开' : 'EASYSBC翻译: 关';
        if (easysbcTranslationEnabled) {
          settingsBtn.classList.remove('disabled');
        } else {
          settingsBtn.classList.add('disabled');
        }
        
        // 立即重新翻译页面内容
        if (window.location.hostname.includes('easysbc.io')) {
          if (easysbcTranslationEnabled) {
            // 如果打开翻译，重新翻译整个页面
            translateRoot(document);
          } else {
            // 如果关闭翻译，刷新页面恢复原始内容
            location.reload();
          }
        }
      });
    } else if (isFutggPage) {
      // console.log('[OAO] 创建FUTGG翻译按钮');
      settingsBtn.textContent = futggTranslationEnabled ? 'FUTGG翻译: 开' : 'FUTGG翻译: 关';
      if (!futggTranslationEnabled) {
        settingsBtn.classList.add('disabled');
      }
      settingsBtn.addEventListener('click', () => {
        // 切换翻译开关状态
        futggTranslationEnabled = !futggTranslationEnabled;
        
        // 保存状态到本地存储
        setStorageValue(FUTGG_TRANSLATION_ENABLED_KEY, futggTranslationEnabled);
        
        // 更新按钮文本和样式
        settingsBtn.textContent = futggTranslationEnabled ? 'FUTGG翻译: 开' : 'FUTGG翻译: 关';
        if (futggTranslationEnabled) {
          settingsBtn.classList.remove('disabled');
        } else {
          settingsBtn.classList.add('disabled');
        }
        
        // 立即重新翻译页面内容
        if (window.location.hostname.includes('fut.gg')) {
          if (futggTranslationEnabled) {
            // 如果打开翻译，重新翻译整个页面
            translateRoot(document);
          } else {
            // 如果关闭翻译，刷新页面恢复原始内容
            location.reload();
          }
        }
      });
    } else {
      // console.log('[OAO] 创建FUTBIN翻译按钮');
      settingsBtn.textContent = futbinTranslationEnabled ? 'FUTBIN翻译: 开' : 'FUTBIN翻译: 关';
      if (!futbinTranslationEnabled) {
        settingsBtn.classList.add('disabled');
      }
      settingsBtn.addEventListener('click', () => {
        // 切换翻译开关状态
        futbinTranslationEnabled = !futbinTranslationEnabled;
        
        // 保存状态到本地存储
        setStorageValue(FUTBIN_TRANSLATION_ENABLED_KEY, futbinTranslationEnabled);
        
        // 更新按钮文本和样式
        settingsBtn.textContent = futbinTranslationEnabled ? 'FUTBIN翻译: 开' : 'FUTBIN翻译: 关';
        if (futbinTranslationEnabled) {
          settingsBtn.classList.remove('disabled');
        } else {
          settingsBtn.classList.add('disabled');
        }
        
        // 立即重新翻译页面内容
        if (!window.location.hostname.includes('fut.gg') && !window.location.hostname.includes('easysbc.io')) {
          if (futbinTranslationEnabled) {
            // 如果打开翻译，重新翻译整个页面
            translateRoot(document);
          } else {
            // 如果关闭翻译，刷新页面恢复原始内容
            location.reload();
          }
        }
      });
    }

    // 只在FUTBIN页面创建FUTBIN翻译按钮
    let expandBtn;
    if (!isEasysbcPage && !isFutggPage) {
      expandBtn = document.createElement('button');
      expandBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--expand`;
      
      expandBtn.textContent = futbinTranslationEnabled ? 'FUTBIN翻译: 开' : 'FUTBIN翻译: 关';
      if (!futbinTranslationEnabled) {
        expandBtn.classList.add('disabled');
      }
      expandBtn.addEventListener('click', () => {
        // 切换翻译开关状态
        futbinTranslationEnabled = !futbinTranslationEnabled;
        
        // 保存状态到本地存储
        setStorageValue(FUTBIN_TRANSLATION_ENABLED_KEY, futbinTranslationEnabled);
        
        // 更新按钮文本和样式
        expandBtn.textContent = futbinTranslationEnabled ? 'FUTBIN翻译: 开' : 'FUTBIN翻译: 关';
        if (futbinTranslationEnabled) {
          expandBtn.classList.remove('disabled');
        } else {
          expandBtn.classList.add('disabled');
        }
        
        // 立即重新翻译页面内容
        if (!window.location.hostname.includes('fut.gg') && !window.location.hostname.includes('easysbc.io')) {
          if (futbinTranslationEnabled) {
            // 如果打开翻译，重新翻译整个页面
            translateRoot(document);
          } else {
            // 如果关闭翻译，刷新页面恢复原始内容
            location.reload();
          }
        }
      });
      // 移除这里的panel.appendChild(expandBtn)，在下面统一处理按钮顺序
    }
    
    // 在EASYSBC页面创建EASYSBC翻译按钮
    let easysbcBtn;
    if (isEasysbcPage) {
      easysbcBtn = document.createElement('button');
      easysbcBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--expand`;
      easysbcBtn.textContent = easysbcTranslationEnabled ? 'EASY翻译: 开' : 'EASY翻译: 关';
      if (!easysbcTranslationEnabled) {
        easysbcBtn.classList.add('disabled');
      }
      easysbcBtn.addEventListener('click', () => {
        // 切换翻译开关状态
        easysbcTranslationEnabled = !easysbcTranslationEnabled;
        
        // 保存状态到本地存储
        setStorageValue(EASYSBC_TRANSLATION_ENABLED_KEY, easysbcTranslationEnabled);
        
        // 更新按钮文本和样式
        easysbcBtn.textContent = easysbcTranslationEnabled ? 'EASY翻译: 开' : 'EASY翻译: 关';
        if (easysbcTranslationEnabled) {
          easysbcBtn.classList.remove('disabled');
        } else {
          easysbcBtn.classList.add('disabled');
        }
        
        // 立即重新翻译页面内容
        if (window.location.hostname.includes('easysbc.io')) {
          if (easysbcTranslationEnabled) {
            // 如果打开翻译，重新翻译整个页面
            translateRoot(document);
          } else {
            // 如果关闭翻译，刷新页面恢复原始内容
            location.reload();
          }
        }
      });
      // 移除这里的panel.appendChild(easysbcBtn)，在下面统一处理按钮顺序
    }

    const featureBtn = document.createElement('button');
    featureBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--feature`;
    featureBtn.textContent = '便捷入口';
    featureBtn.addEventListener('click', () => {
      // 关注欧啊欧：弹出公众号二维码
      function openFollowQrPopup() {
        const qrModal = document.createElement('div');
        qrModal.style.position = 'fixed';
        qrModal.style.top = '0';
        qrModal.style.left = '0';
        qrModal.style.width = '100%';
        qrModal.style.height = '100%';
        qrModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        qrModal.style.display = 'flex';
        qrModal.style.alignItems = 'center';
        qrModal.style.justifyContent = 'center';
        qrModal.style.zIndex = '100000';
        qrModal.style.backdropFilter = 'blur(5px)';

        const qrContent = document.createElement('div');
        qrContent.style.backgroundColor = '#fff';
        qrContent.style.borderRadius = '12px';
        qrContent.style.padding = '30px';
        qrContent.style.width = '320px';
        qrContent.style.maxWidth = '90%';
        qrContent.style.maxHeight = '85vh';
        qrContent.style.overflowY = 'auto';
        qrContent.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
        qrContent.style.textAlign = 'center';

        const qrTitle = document.createElement('h3');
        qrTitle.textContent = '关注欧啊欧公众号';
        qrTitle.style.color = '#333';
        qrTitle.style.fontSize = '22px';
        qrTitle.style.fontWeight = '700';
        qrTitle.style.margin = '0 0 18px 0';

        const qrImg = document.createElement('img');
        qrImg.src = 'https://s41.ax1x.com/2026/03/01/peS2q8f.png';
        qrImg.style.width = '220px';
        qrImg.style.maxWidth = '100%';
        qrImg.style.display = 'block';
        qrImg.style.margin = '0 auto';
        qrImg.style.borderRadius = '8px';
        qrImg.style.border = '1px solid #eee';

        qrImg.onerror = function() {
          qrImg.style.display = 'none';
          const qrTip = document.createElement('div');
          qrTip.textContent = '微信搜索"我要欧啊欧"';
          qrTip.style.fontSize = '18px';
          qrTip.style.fontWeight = 'bold';
          qrTip.style.color = '#333';
          qrTip.style.padding = '20px 0';
          qrContent.appendChild(qrTip);
        };

        const qrHint = document.createElement('p');
        qrHint.textContent = '微信搜索"我要欧啊欧"即可关注，感谢你的支持和喜欢！';
        qrHint.style.color = '#666';
        qrHint.style.fontSize = '14px';
        qrHint.style.margin = '16px 0 0 0';

        const qrClose = document.createElement('button');
        qrClose.textContent = '关闭';
        qrClose.style.width = '100%';
        qrClose.style.height = '40px';
        qrClose.style.border = '1px solid #ddd';
        qrClose.style.borderRadius = '8px';
        qrClose.style.backgroundColor = '#f5f5f5';
        qrClose.style.color = '#333';
        qrClose.style.fontWeight = '600';
        qrClose.style.fontSize = '14px';
        qrClose.style.cursor = 'pointer';
        qrClose.style.marginTop = '20px';
        qrClose.style.transition = 'all 0.2s ease';
        qrClose.addEventListener('mouseenter', () => { qrClose.style.backgroundColor = '#e0e0e0'; });
        qrClose.addEventListener('mouseleave', () => { qrClose.style.backgroundColor = '#f5f5f5'; });
        qrClose.addEventListener('click', () => { qrModal.remove(); });

        qrContent.appendChild(qrTitle);
        qrContent.appendChild(qrImg);
        qrContent.appendChild(qrHint);
        qrContent.appendChild(qrClose);
        qrModal.appendChild(qrContent);

        qrModal.addEventListener('click', (e) => { if (e.target === qrModal) qrModal.remove(); });
        document.body.appendChild(qrModal);
      }

      // 创建居中弹窗
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '99999';
      modal.style.backdropFilter = 'blur(5px)';
      
      // 弹窗内容
      const modalContent = document.createElement('div');
      modalContent.style.backgroundColor = '#fff';
      modalContent.style.borderRadius = '12px';
      modalContent.style.padding = '30px';
      modalContent.style.width = '400px';
      modalContent.style.maxWidth = '90%';
      modalContent.style.maxHeight = '85vh';
      modalContent.style.overflowY = 'auto';
      modalContent.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
      
      // 标题
      const title = document.createElement('h3');
      title.textContent = '快捷入口';
      title.style.color = '#333';
      title.style.fontSize = '25px';
      title.style.fontWeight = '700';
      title.style.margin = '0 0 20px 0';
      title.style.textAlign = 'center';
      
      // 按钮容器
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.flexDirection = 'column';
      buttonContainer.style.gap = '12px';
      
      // 快捷入口按钮
      const quickLinks = [
        { text: '进入 UT WEB', url: 'https://www.ea.com/ea-sports-fc/ultimate-team/web-app/' },
        { text: '进入 FUTBIN', url: 'https://www.futbin.com/' },
        { text: '进入 FUTGG', url: 'https://www.fut.gg/' },
        { text: '进入 EASYSBC', url: 'https://www.easysbc.io/' },
        { text: '进入 FUTGG-进化实验室', url: 'https://www.fut.gg/evo-lab/' }
      ];
      
      quickLinks.forEach(link => {
        const btn = document.createElement('button');
        btn.textContent = link.text;
        btn.style.width = '100%';
        btn.style.height = '40px';
        btn.style.border = 'none';
        btn.style.borderRadius = '8px';
        btn.style.backgroundColor = '#027ba0ff';
        btn.style.color = '#fff';
        btn.style.fontWeight = '600';
        btn.style.fontSize = '14px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'all 0.2s ease';
        
        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = '#015a7a';
          btn.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = '#027ba0ff';
          btn.style.transform = 'translateY(0)';
        });
        
        btn.addEventListener('click', () => {
          window.open(link.url, '_blank');
        });
        
        buttonContainer.appendChild(btn);
      });
      
      // 特别推荐部分
      const specialTitle = document.createElement('h4');
      specialTitle.textContent = '特别推荐';
      specialTitle.style.color = '#333';
      specialTitle.style.fontSize = '18px';
      specialTitle.style.fontWeight = '700';
      specialTitle.style.margin = '20px 0 10px 0';
      specialTitle.style.textAlign = 'center';
      
      const specialContainer = document.createElement('div');
      specialContainer.style.display = 'flex';
      specialContainer.style.flexDirection = 'column';
      specialContainer.style.gap = '8px';
      
      const specialLinks = [
        { text: '每日开包视频', url: 'https://space.bilibili.com/21399808/lists/9100251?type=season' },
        { text: '球员评测', url: 'https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MzE2NzgyMQ==&action=getalbum&album_id=3721449259213029385#wechat_redirect' },
        { text: '每周阵型战术推荐', url: 'https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MzE2NzgyMQ==&action=getalbum&album_id=3714272208722886660#wechat_redirect' },
        { text: '特技搭配推荐', action: 'openPlaystyleRecommendModal' }
      ];

      // 关注欧啊欧按钮（样式与其他功能一致，颜色更突出，点击弹出二维码）— 特别推荐区第一个位置
      const followBtn = document.createElement('button');
      followBtn.textContent = '关注欧啊欧';
      followBtn.style.width = '100%';
      followBtn.style.height = '40px';
      followBtn.style.border = 'none';
      followBtn.style.borderRadius = '8px';
      followBtn.style.backgroundColor = '#FF4081';
      followBtn.style.color = '#fff';
      followBtn.style.fontWeight = '700';
      followBtn.style.fontSize = '14px';
      followBtn.style.cursor = 'pointer';
      followBtn.style.transition = 'all 0.2s ease';
      followBtn.style.marginBottom = '4px';
      followBtn.addEventListener('mouseenter', () => {
        followBtn.style.backgroundColor = '#E91E63';
        followBtn.style.transform = 'translateY(-2px)';
      });
      followBtn.addEventListener('mouseleave', () => {
        followBtn.style.backgroundColor = '#FF4081';
        followBtn.style.transform = 'translateY(0)';
      });
      followBtn.addEventListener('click', () => {
        openFollowQrPopup();
      });
      specialContainer.appendChild(followBtn);

      specialLinks.forEach(link => {
        const btn = document.createElement('button');
        btn.textContent = link.text;
        btn.style.width = '100%';
        btn.style.height = '40px';
        btn.style.border = 'none';
        btn.style.borderRadius = '8px';
        btn.style.backgroundColor = '#027ba0ff';
        btn.style.color = '#fff';
        btn.style.fontWeight = '600';
        btn.style.fontSize = '14px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'all 0.2s ease';
        
        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = '#015a7a';
          btn.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = '#027ba0ff';
          btn.style.transform = 'translateY(0)';
        });

        btn.addEventListener('click', () => {
          if (link.action === 'openPlaystyleRecommendModal' && typeof openPlaystyleRecommendModal === 'function') {
            openPlaystyleRecommendModal();
          } else if (link.url) {
            window.open(link.url, '_blank');
          }
        });

        specialContainer.appendChild(btn);
      });
      
      // 术语解释部分
      const termsTitle = document.createElement('h4');
      termsTitle.textContent = '术语解释';
      termsTitle.style.color = '#333';
      termsTitle.style.fontSize = '18px';
      termsTitle.style.fontWeight = '700';
      termsTitle.style.margin = '20px 0 10px 0';
      termsTitle.style.textAlign = 'center';
      
      const termsContainer = document.createElement('div');
      termsContainer.style.display = 'flex';
      termsContainer.style.flexDirection = 'column';
      termsContainer.style.gap = '8px';
      
      const termsLinks = [
        { text: '球员角色', url: 'https://mp.weixin.qq.com/s/sdQc3Su0nSHBqTs_k5nmiw' },
        { text: '球员特技', url: 'https://mp.weixin.qq.com/s/qpyVdZ4A5YMhgQenjbTAWw' },
        { text: '加速类型介绍', url: 'https://mp.weixin.qq.com/s/QaHELzeDs8i-vu1a5iV_jQ' }
      ];
      
      termsLinks.forEach(link => {
        const btn = document.createElement('button');
        btn.textContent = link.text;
        btn.style.width = '100%';
        btn.style.height = '40px';
        btn.style.border = 'none';
        btn.style.borderRadius = '8px';
        btn.style.backgroundColor = '#027ba0ff';
        btn.style.color = '#fff';
        btn.style.fontWeight = '600';
        btn.style.fontSize = '14px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'all 0.2s ease';
        
        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = '#015a7a';
          btn.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = '#027ba0ff';
          btn.style.transform = 'translateY(0)';
        });
        
        btn.addEventListener('click', () => {
          window.open(link.url, '_blank');
        });
        
        termsContainer.appendChild(btn);
      });

      // 其他功能部分
      const otherTitle = document.createElement('h4');
      otherTitle.textContent = '其他功能';
      otherTitle.style.color = '#333';
      otherTitle.style.fontSize = '18px';
      otherTitle.style.fontWeight = '700';
      otherTitle.style.margin = '20px 0 10px 0';
      otherTitle.style.textAlign = 'center';
      
      const otherContainer = document.createElement('div');
      otherContainer.style.display = 'flex';
      otherContainer.style.flexDirection = 'column';
      otherContainer.style.gap = '8px';
      otherContainer.className = 'other-container';
      
      // 注释掉：检查是否有今日更新
      // console.log('=== 检查今日更新 ===');
      // const cachedData = getStorageValue(UPDATE_CONTENT_KEY);
      // console.log('缓存的更新内容:', cachedData);
      // let hasTodayUpdate = false;
      // let updateData = null;
      
      // if (cachedData) {
      //   try {
      //     updateData = JSON.parse(cachedData);
      //     console.log('解析更新内容:', updateData);
      //     if (updateData && updateData.date) {
      //       const today = new Date().toISOString().split('T')[0];
      //       const updateDate = updateData.date;
      //       console.log('今日日期:', today);
      //       console.log('更新日期:', updateDate);
      //       hasTodayUpdate = (updateDate === today || updateDate.includes(today));
      //       console.log('是否有今日更新:', hasTodayUpdate);
      //     }
      //   } catch (error) {
      //     console.error('解析缓存更新内容失败:', error);
      //   }
      // }
      
      // 注释掉：如果有今日更新，添加今日更新按钮
      // if (hasTodayUpdate && updateData) {
      //   console.log('添加今日更新按钮');
      //   const updateBtn = document.createElement('button');
      //   updateBtn.textContent = '今日更新';
      //   updateBtn.style.cssText = `
      //     width: 100%;
      //     height: 40px;
      //     border: none;
      //     border-radius: 8px;
      //     background: #ff6b6b;
      //     color: white;
      //     font-weight: 600;
      //     font-size: 14px;
      //     cursor: pointer;
      //     transition: all 0.2s ease;
      //     margin-bottom: 8px;
      //   `;
      
      //   updateBtn.addEventListener('mouseenter', () => {
      //     updateBtn.style.background = '#e55a5a';
      //     updateBtn.style.transform = 'translateY(-2px)';
      //   });
      
      //   updateBtn.addEventListener('mouseleave', () => {
      //     updateBtn.style.background = '#ff6b6b';
      //     updateBtn.style.transform = 'translateY(0)';
      //   });
      
      //   updateBtn.addEventListener('click', () => {
      //     console.log('点击今日更新按钮，重新拉取最新内容');
      //     // 重新拉取最新内容
      //     fetchUpdateContent((data) => {
      //       if (data) {
      //         showUpdateContentPopup(data, false);
      //       } else {
      //         // 拉取失败，显示错误提示
      //         showErrorPopup('信息读取失败，请稍后前往快捷入口-今日更新再次查看');
      //       }
      //     });
      //   });
      
      //   // 添加到其他功能区域的第一个位置
      //   if (otherContainer) {
      //     console.log('otherContainer存在，添加按钮');
      //     const firstChild = otherContainer.firstChild;
      //     if (firstChild) {
      //       otherContainer.insertBefore(updateBtn, firstChild);
      //     } else {
      //       otherContainer.appendChild(updateBtn);
      //     }
      //     console.log('今日更新按钮已添加');
      //   } else {
      //     console.error('otherContainer不存在');
      //   }
      // }
      
      const otherLinks = [
        { text: '功能介绍', url: 'https://my.feishu.cn/wiki/CfKqw17NkiTDK2kCq5tcdqI7nxd' },
        { text: '更新版本', url: 'https://scriptcat.org/zh-CN/script-show-page/5488' },
        { text: '意见反馈', url: 'https://my.feishu.cn/share/base/form/shrcnTlLN2wPLV0dzRQ33Q1kwlg' }
      ];
      
      otherLinks.forEach(link => {
        const btn = document.createElement('button');
        btn.textContent = link.text;
        btn.style.width = '100%';
        btn.style.height = '40px';
        btn.style.border = 'none';
        btn.style.borderRadius = '8px';
        btn.style.backgroundColor = '#027ba0ff';
        btn.style.color = '#fff';
        btn.style.fontWeight = '600';
        btn.style.fontSize = '14px';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'all 0.2s ease';
        
        btn.addEventListener('mouseenter', () => {
          btn.style.backgroundColor = '#015a7a';
          btn.style.transform = 'translateY(-2px)';
        });
        
        btn.addEventListener('mouseleave', () => {
          btn.style.backgroundColor = '#027ba0ff';
          btn.style.transform = 'translateY(0)';
        });
        
        btn.addEventListener('click', () => {
          window.open(link.url, '_blank');
        });
        
        otherContainer.appendChild(btn);
      });

      // 关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '关闭';
      closeBtn.style.width = '100%';
      closeBtn.style.height = '40px';
      closeBtn.style.border = '1px solid #ddd';
      closeBtn.style.borderRadius = '8px';
      closeBtn.style.backgroundColor = '#f5f5f5';
      closeBtn.style.color = '#333';
      closeBtn.style.fontWeight = '600';
      closeBtn.style.fontSize = '14px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.marginTop = '15px';
      closeBtn.style.transition = 'all 0.2s ease';
      
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = '#e0e0e0';
      });
      
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = '#f5f5f5';
      });
      
      closeBtn.addEventListener('click', async () => {
        modal.remove();
        // 只有在有修改的情况下才刷新页面
        if (window.translationManagerHasChanges) {
          // 清除所有元素的翻译标记，确保重新翻译
          document.querySelectorAll('[data-oao-translated="true"]').forEach(element => {
            delete element.dataset.oaoTranslated;
          });
          await translateRoot(document);
          // 重置标记
          window.translationManagerHasChanges = false;
        }
      });
      
      // 组装弹窗
  modalContent.appendChild(title);
  modalContent.appendChild(buttonContainer);
  modalContent.appendChild(specialTitle);
  modalContent.appendChild(specialContainer);
  modalContent.appendChild(termsTitle);
  modalContent.appendChild(termsContainer);
  modalContent.appendChild(otherTitle);
  modalContent.appendChild(otherContainer);
  modalContent.appendChild(closeBtn);
  modal.appendChild(modalContent);
  
  // 点击背景关闭
  modal.addEventListener('click', async (e) => {
    if (e.target === modal) {
      modal.remove();
      // 只有在有修改的情况下才刷新页面
      if (window.translationManagerHasChanges) {
        // 清除所有元素的翻译标记，确保重新翻译
        document.querySelectorAll('[data-oao-translated="true"]').forEach(element => {
          delete element.dataset.oaoTranslated;
        });
        await translateRoot(document);
        // 重置标记
        window.translationManagerHasChanges = false;
      }
    }
  });
  
  document.body.appendChild(modal);
});

// 打开翻译管理界面
function openTranslationManager() {
  // 重置修改标记
  window.translationManagerHasChanges = false;
  
  // 创建居中弹窗
  const modal = document.createElement('div');
  modal.className = 'oaevo-translation-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '99999';
  modal.style.backdropFilter = 'blur(5px)';
  
  // 弹窗内容
  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = '#fff';
  modalContent.style.borderRadius = '12px';
  modalContent.style.padding = '30px';
  modalContent.style.width = '800px';
  modalContent.style.maxWidth = '95%';
  modalContent.style.maxHeight = '80vh';
  modalContent.style.overflow = 'auto';
  modalContent.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
  
  // 标题容器
  const titleContainer = document.createElement('div');
  titleContainer.style.display = 'flex';
  titleContainer.style.alignItems = 'center';
  titleContainer.style.justifyContent = 'space-between';
  titleContainer.style.marginBottom = '20px';
  
  // 标题
  const title = document.createElement('h3');
  title.textContent = '翻译管理';
  title.style.color = '#333';
  title.style.fontSize = '20px';
  title.style.fontWeight = '700';
  title.style.margin = '0';
  
  // 关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.width = '30px';
  closeBtn.style.height = '30px';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '50%';
  closeBtn.style.backgroundColor = '#f0f0f0';
  closeBtn.style.color = '#333';
  closeBtn.style.fontSize = '20px';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  closeBtn.style.transition = 'all 0.2s ease';
  
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.backgroundColor = '#e0e0e0';
  });
  
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.backgroundColor = '#f0f0f0';
  });
  
  closeBtn.addEventListener('click', async () => {
    // log('info', '关闭弹窗，translationManagerHasChanges:', window.translationManagerHasChanges);
    modal.remove();
    // 只有在有修改的情况下才刷新页面
    if (window.translationManagerHasChanges) {
      // log('info', '开始刷新页面...');
      // 清除所有元素的翻译标记，确保重新翻译
      document.querySelectorAll('[data-oao-translated="true"]').forEach(element => {
        delete element.dataset.oaoTranslated;
      });
      // log('info', '清除翻译标记完成');
      await translateRoot(document);
      // log('info', '页面刷新完成');
      // 重置标记
      window.translationManagerHasChanges = false;
      // log('info', '重置标记为false');
    }
  });
  
  titleContainer.appendChild(title);
  titleContainer.appendChild(closeBtn);
  
  modalContent.appendChild(titleContainer);
  
  // 说明文字
  const description = document.createElement('p');
  description.textContent = '中文翻译修改后需要手动刷新页面才可生效';
  description.style.color = '#666';
  description.style.fontSize = '13px';
  description.style.margin = '0 0 20px 0';
  description.style.padding = '0';
  
  modalContent.appendChild(description);
  
  // 搜索功能
  const searchContainer = document.createElement('div');
  searchContainer.style.marginBottom = '20px';
  
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = '搜索翻译...';
  searchInput.style.width = '100%';
  searchInput.style.padding = '8px 12px';
  searchInput.style.border = '1px solid #ccc';
  searchInput.style.borderRadius = '6px';
  searchInput.style.fontSize = '14px';
  searchInput.style.backgroundColor = '#fff';
  searchInput.style.color = '#333';
  searchInput.style.boxSizing = 'border-box';
  
  searchContainer.appendChild(searchInput);
  
  // 分类标签
  const categories = [
    { id: 'evolutions', name: '进化' },
    { id: 'basic', name: '基础' },
    { id: 'sixStat', name: '数据' },
    { id: 'roles', name: '角色' },
    { id: 'chemistry', name: '化学' },
    { id: 'playstyles', name: '特技' },
    { id: 'futgg', name: 'FUTGG' },
    { id: 'futbin', name: 'FUTBIN' },
    { id: 'easysbc', name: 'EASYSBC' },
    { id: 'add', name: '添加' }
  ];
  
  const categoryContainer = document.createElement('div');
  categoryContainer.style.display = 'flex';
  categoryContainer.style.gap = '10px';
  categoryContainer.style.marginBottom = '20px';
  categoryContainer.style.flexWrap = 'wrap';
  
  categories.forEach(category => {
    const categoryBtn = document.createElement('button');
    categoryBtn.textContent = category.name;
    categoryBtn.style.padding = '6px 12px';
    categoryBtn.style.border = '1px solid #027ba0ff';
    categoryBtn.style.borderRadius = '16px';
    categoryBtn.style.backgroundColor = '#fff';
    categoryBtn.style.color = '#027ba0ff';
    categoryBtn.style.fontSize = '12px';
    categoryBtn.style.cursor = 'pointer';
    categoryBtn.style.transition = 'all 0.2s ease';
    
    categoryBtn.addEventListener('mouseenter', () => {
      // 只有在未选中状态下才改变样式
      if (categoryBtn.style.backgroundColor !== 'rgb(2, 123, 160)') {
        categoryBtn.style.backgroundColor = '#f0f8ff';
      }
    });
    
    categoryBtn.addEventListener('mouseleave', () => {
      // 只有在未选中状态下才改变样式
      if (categoryBtn.style.backgroundColor !== 'rgb(2, 123, 160)') {
        categoryBtn.style.backgroundColor = '#fff';
      }
    });
    
    categoryBtn.addEventListener('click', () => {
      // 切换分类
      categories.forEach(cat => {
        const btn = categoryContainer.querySelector(`[data-category="${cat.id}"]`);
        if (btn) {
          btn.style.backgroundColor = '#fff';
          btn.style.color = '#027ba0ff';
        }
      });
      categoryBtn.style.backgroundColor = '#027ba0ff';
      categoryBtn.style.color = '#fff';
      
      // 如果是添加标签，显示添加表单，隐藏翻译列表
      if (category.id === 'add') {
        translationList.style.display = 'none';
        addForm.style.display = 'block';
      } else {
        translationList.style.display = 'block';
        addForm.style.display = 'none';
        
        // 显示对应分类的翻译
        async function showCategoryTranslation() {
          await ensureDictionaries();
          showTranslationsByCategory(category.id);
        }
        showCategoryTranslation();
      }
    });
    
    categoryBtn.setAttribute('data-category', category.id);
    categoryContainer.appendChild(categoryBtn);
  });
  
  // 翻译列表
  const translationList = document.createElement('div');
  translationList.id = 'translation-list';
  translationList.style.marginBottom = '20px';
  
  // 添加翻译表单
  const addForm = document.createElement('div');
  addForm.style.border = '1px solid #ddd';
  addForm.style.borderRadius = '8px';
  addForm.style.padding = '20px';
  addForm.style.marginBottom = '20px';
  addForm.style.display = 'none'; // 默认隐藏
  
  const formTitle = document.createElement('h4');
  formTitle.textContent = '添加翻译';
  formTitle.style.color = '#333';
  formTitle.style.fontSize = '16px';
  formTitle.style.fontWeight = '600';
  formTitle.style.margin = '0 0 15px 0';
  
  const formFields = document.createElement('div');
  formFields.style.display = 'flex';
  formFields.style.flexDirection = 'column';
  formFields.style.gap = '12px';
  
  // 原文输入
  const originalContainer = document.createElement('div');
  originalContainer.style.marginBottom = '12px';
  
  const originalLabel = document.createElement('label');
  originalLabel.textContent = '英语：';
  originalLabel.style.display = 'block';
  originalLabel.style.marginBottom = '6px';
  originalLabel.style.fontSize = '14px';
  originalLabel.style.fontWeight = '600';
  originalLabel.style.color = '#333';
  
  const originalInput = document.createElement('input');
  originalInput.type = 'text';
  originalInput.id = 'original-text';
  originalInput.style.width = '100%';
  originalInput.style.padding = '8px 12px';
  originalInput.style.border = '1px solid #ccc';
  originalInput.style.borderRadius = '6px';
  originalInput.style.fontSize = '14px';
  originalInput.style.backgroundColor = '#fff';
  originalInput.style.color = '#333';
  originalInput.style.boxSizing = 'border-box';
  
  originalContainer.appendChild(originalLabel);
  originalContainer.appendChild(originalInput);
  
  // 翻译输入
  const translationContainer = document.createElement('div');
  translationContainer.style.marginBottom = '12px';
  
  const translationLabel = document.createElement('label');
  translationLabel.textContent = '中文：';
  translationLabel.style.display = 'block';
  translationLabel.style.marginBottom = '6px';
  translationLabel.style.fontSize = '14px';
  translationLabel.style.fontWeight = '600';
  translationLabel.style.color = '#333';
  
  const translationInput = document.createElement('input');
  translationInput.type = 'text';
  translationInput.id = 'translation-text';
  translationInput.style.width = '100%';
  translationInput.style.padding = '8px 12px';
  translationInput.style.border = '1px solid #ccc';
  translationInput.style.borderRadius = '6px';
  translationInput.style.fontSize = '14px';
  translationInput.style.backgroundColor = '#fff';
  translationInput.style.color = '#333';
  translationInput.style.boxSizing = 'border-box';
  
  translationContainer.appendChild(translationLabel);
  translationContainer.appendChild(translationInput);
  
  // 分类选择
  const categorySelectContainer = document.createElement('div');
  categorySelectContainer.style.marginBottom = '12px';
  
  const categorySelectLabel = document.createElement('label');
  categorySelectLabel.textContent = '分类：';
  categorySelectLabel.style.display = 'block';
  categorySelectLabel.style.marginBottom = '6px';
  categorySelectLabel.style.fontSize = '14px';
  categorySelectLabel.style.fontWeight = '600';
  categorySelectLabel.style.color = '#333';
  
  const categorySelect = document.createElement('select');
  categorySelect.id = 'category-select';
  categorySelect.style.width = '100%';
  categorySelect.style.padding = '8px 12px';
  categorySelect.style.border = '1px solid #ccc';
  categorySelect.style.borderRadius = '6px';
  categorySelect.style.fontSize = '14px';
  categorySelect.style.backgroundColor = '#fff';
  categorySelect.style.color = '#333';
  categorySelect.style.boxSizing = 'border-box';
  
  categories.forEach(category => {
    // 排除"添加"选项和只读分类（进化、页面专用分类）
    if (category.id !== 'add' && !['evolutions', 'futbin', 'futgg', 'easysbc'].includes(category.id)) {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.name;
      categorySelect.appendChild(option);
    }
  });
  
  categorySelectContainer.appendChild(categorySelectLabel);
  categorySelectContainer.appendChild(categorySelect);
  
  formFields.appendChild(originalContainer);
  formFields.appendChild(translationContainer);
  formFields.appendChild(categorySelectContainer);
  
  // 操作按钮
  const formButtons = document.createElement('div');
  formButtons.style.display = 'flex';
  formButtons.style.gap = '10px';
  formButtons.style.marginTop = '10px';
  
  const saveBtn = document.createElement('button');
  saveBtn.textContent = '保存';
  saveBtn.style.flex = '1';
  saveBtn.style.padding = '10px';
  saveBtn.style.border = 'none';
  saveBtn.style.borderRadius = '6px';
  saveBtn.style.backgroundColor = '#027ba0ff';
  saveBtn.style.color = '#fff';
  saveBtn.style.fontWeight = '600';
  saveBtn.style.fontSize = '14px';
  saveBtn.style.cursor = 'pointer';
  saveBtn.style.transition = 'all 0.2s ease';
  
  saveBtn.addEventListener('mouseenter', () => {
    saveBtn.style.backgroundColor = '#015a7a';
  });
  
  saveBtn.addEventListener('mouseleave', () => {
    saveBtn.style.backgroundColor = '#027ba0ff';
  });
  
  saveBtn.addEventListener('click', saveCustomTranslation);
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '取消';
  cancelBtn.style.flex = '1';
  cancelBtn.style.padding = '10px';
  cancelBtn.style.border = '1px solid #ddd';
  cancelBtn.style.borderRadius = '6px';
  cancelBtn.style.backgroundColor = '#f5f5f5';
  cancelBtn.style.color = '#333';
  cancelBtn.style.fontWeight = '600';
  cancelBtn.style.fontSize = '14px';
  cancelBtn.style.cursor = 'pointer';
  cancelBtn.style.transition = 'all 0.2s ease';
  
  cancelBtn.addEventListener('mouseenter', () => {
    cancelBtn.style.backgroundColor = '#e0e0e0';
  });
  
  cancelBtn.addEventListener('mouseleave', () => {
    cancelBtn.style.backgroundColor = '#f5f5f5';
  });
  
  cancelBtn.addEventListener('click', () => {
    originalInput.value = '';
    translationInput.value = '';
    categorySelect.value = categories[0].id;
  });
  
  formButtons.appendChild(saveBtn);
  formButtons.appendChild(cancelBtn);
  
  addForm.appendChild(formTitle);
  addForm.appendChild(formFields);
  addForm.appendChild(formButtons);
  

  

  
  // 组装弹窗
  modalContent.appendChild(searchContainer);
  modalContent.appendChild(categoryContainer);
  modalContent.appendChild(translationList);
  modalContent.appendChild(addForm);
  modal.appendChild(modalContent);
  
  // 点击背景关闭
  modal.addEventListener('click', async (e) => {
    if (e.target === modal) {
      modal.remove();
      // 只有在有修改的情况下才刷新页面
      if (window.translationManagerHasChanges) {
        // 清除所有元素的翻译标记，确保重新翻译
        document.querySelectorAll('[data-oao-translated="true"]').forEach(element => {
          delete element.dataset.oaoTranslated;
        });
        await translateRoot(document);
        // 重置标记
        window.translationManagerHasChanges = false;
      }
    }
  });
  
  document.body.appendChild(modal);
  
  // 搜索功能
  searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    const translationItems = translationList.querySelectorAll('.translation-item');
    
    translationItems.forEach(item => {
      const originalText = item.querySelector('.original-text').textContent.toLowerCase();
      const translationText = item.querySelector('.translation-text').textContent.toLowerCase();
      
      if (originalText.includes(searchTerm) || translationText.includes(searchTerm)) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
  });
  
  // 默认显示第一个分类
  if (categories.length > 0) {
    async function showFirstCategory() {
      await ensureDictionaries();
      const firstCategoryBtn = categoryContainer.querySelector(`[data-category="${categories[0].id}"]`);
      if (firstCategoryBtn) {
        firstCategoryBtn.click();
      }
    }
    showFirstCategory();
  }
}

// 显示指定分类的翻译
function showTranslationsByCategory(category) {
  const translationList = document.getElementById('translation-list');
  if (!translationList) return;
  
  // 获取该分类的所有翻译（包括默认翻译和自定义翻译）
  const translations = {};
  const translationDetails = {};
  
  // 添加默认翻译
  if (dictionaryCache[category]) {
    for (const [key, value] of Object.entries(dictionaryCache[category])) {
      // 处理数组格式（多个同名条目）
      if (Array.isArray(value)) {
        // 对于进化分类，选择最新的（timestamp 最大的）
        if (category === 'evolutions') {
          const sortedEntries = [...value].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          const latestEntry = sortedEntries[0];
          translations[key] = latestEntry.webpagedata;
          if (latestEntry.source || latestEntry.timestamp) {
            translationDetails[key] = {
              source: latestEntry.source,
              timestamp: latestEntry.timestamp
            };
          }
        } else {
          // 非进化分类，使用第一个
          translations[key] = value[0].webpagedata;
          if (value[0].source || value[0].timestamp) {
            translationDetails[key] = {
              source: value[0].source,
              timestamp: value[0].timestamp
            };
          }
        }
      } else {
        // 单个对象格式
        translations[key] = value.webpagedata;
        if (value.source || value.timestamp) {
          translationDetails[key] = {
            source: value.source,
            timestamp: value.timestamp
          };
        }
      }
    }
  }
  
  // 添加或覆盖自定义翻译
  if (customTranslations[category]) {
    for (const [key, value] of Object.entries(customTranslations[category])) {
      // 检查key是否为中文，如果是中文，跳过不添加
      if (/[\u4e00-\u9fa5]/.test(key)) {
        continue;
      }
      translations[key] = value;
    }
  }
  
  // 显示翻译列表
  translationList.innerHTML = '';
  
  if (Object.keys(translations).length === 0) {
    const emptyMessage = document.createElement('div');
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.color = '#999';
    emptyMessage.style.padding = '20px';
    emptyMessage.textContent = '暂无翻译数据';
    translationList.appendChild(emptyMessage);
    return;
  }
  
  // 进化分类按 timestamp 从新到旧排序
  let sortedKeys = Object.keys(translations);
  if (category === 'evolutions') {
    sortedKeys = sortedKeys.sort((a, b) => {
      const timestampA = translationDetails[a]?.timestamp || 0;
      const timestampB = translationDetails[b]?.timestamp || 0;
      return timestampB - timestampA;
    });
  } else {
    // 其他分类按原文排序
    sortedKeys = sortedKeys.sort();
  }
  
  sortedKeys.forEach((key, index) => {
    const translationItem = document.createElement('div');
    translationItem.className = 'translation-item';
    translationItem.style.display = 'flex';
    translationItem.style.alignItems = 'center';
    translationItem.style.justifyContent = 'space-between';
    translationItem.style.padding = '10px';
    translationItem.style.border = '1px solid #eee';
    translationItem.style.borderRadius = '6px';
    translationItem.style.marginBottom = '8px';
    translationItem.style.backgroundColor = customTranslations[category] && customTranslations[category][key] ? '#f0f8ff' : '#fff';
    
    const textContainer = document.createElement('div');
    textContainer.style.flex = '1';
    
    const translationDisplay = document.createElement('div');
    translationDisplay.style.fontSize = '14px';
    translationDisplay.style.display = 'flex';
    translationDisplay.style.alignItems = 'center';
    translationDisplay.style.gap = '10px';
    
    const originalText = document.createElement('span');
    originalText.className = 'original-text';
    originalText.style.fontWeight = '500';
    originalText.style.color = '#333';
    originalText.textContent = key;
    
    const arrow = document.createElement('span');
    arrow.style.color = '#999';
    arrow.textContent = '→';
    
    const translationText = document.createElement('span');
    translationText.className = 'translation-text';
    translationText.style.color = '#666';
    translationText.textContent = translations[key];
    
    translationDisplay.appendChild(originalText);
    translationDisplay.appendChild(arrow);
    translationDisplay.appendChild(translationText);
    
    // 进化分类显示 source 信息
    if (category === 'evolutions' && translationDetails[key]?.source) {
      const sourceText = document.createElement('span');
      sourceText.style.fontSize = '12px';
      sourceText.style.color = '#999';
      sourceText.style.marginLeft = '10px';
      sourceText.textContent = `[${translationDetails[key].source}]`;
      translationDisplay.appendChild(sourceText);
    }
    
    textContainer.appendChild(translationDisplay);
    
    const actionsContainer = document.createElement('div');
    actionsContainer.style.display = 'flex';
    actionsContainer.style.gap = '8px';
    
    const editBtn = document.createElement('button');
    editBtn.textContent = '编辑';
    editBtn.style.padding = '6px 12px';
    editBtn.style.border = '1px solid #027ba0ff';
    editBtn.style.borderRadius = '4px';
    editBtn.style.backgroundColor = '#fff';
    editBtn.style.color = '#027ba0ff';
    editBtn.style.fontSize = '12px';
    editBtn.style.cursor = 'pointer';
    editBtn.style.transition = 'all 0.2s ease';
    
    editBtn.addEventListener('mouseenter', () => {
      editBtn.style.backgroundColor = '#f0f8ff';
    });
    
    editBtn.addEventListener('mouseleave', () => {
      editBtn.style.backgroundColor = '#fff';
    });
    
    // 编辑按钮点击事件处理器 - 使用IIFE创建闭包，确保key值正确
    (function(currentKey, currentCategory, currentTranslations, currentTranslationText) {
      // 定义编辑处理函数
      const handleEdit = () => {
        // log('info', '点击编辑按钮，原文:', currentKey, '当前翻译:', currentTranslations[currentKey]);
        // 隐藏原翻译显示
        translationDisplay.style.display = 'none';
        
        // 创建编辑容器
        const editContainer = document.createElement('div');
        editContainer.className = 'edit-container';
        editContainer.style.display = 'flex';
        editContainer.style.alignItems = 'center';
        editContainer.style.gap = '10px';
        editContainer.style.width = '100%';
        editContainer.style.padding = '8px';
        editContainer.style.backgroundColor = '#f9f9f9';
        editContainer.style.borderRadius = '4px';
        
        // 显示英文
        // console.log('=== 编辑容器创建 ===');
        // console.log('currentKey:', currentKey);
        // console.log('currentTranslations[currentKey]:', currentTranslations[currentKey]);
        
        const originalSpan = document.createElement('span');
        originalSpan.style.fontWeight = '500';
        originalSpan.style.color = '#333';
        originalSpan.style.whiteSpace = 'nowrap';
        originalSpan.textContent = currentKey;
        // console.log('originalSpan.textContent:', originalSpan.textContent);
        
        // 显示箭头
        const arrowSpan = document.createElement('span');
        arrowSpan.style.color = '#999';
        arrowSpan.textContent = '→';
        
        // 显示原中文
        const originalTranslationSpan = document.createElement('span');
        originalTranslationSpan.style.color = '#999';
        originalTranslationSpan.style.textDecoration = 'line-through';
        originalTranslationSpan.textContent = currentTranslations[currentKey];
        
        // 创建编辑框
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = currentTranslations[currentKey];
        editInput.style.padding = '4px 8px';
        editInput.style.border = '1px solid #ddd';
        editInput.style.borderRadius = '4px';
        editInput.style.fontSize = '14px';
        editInput.style.backgroundColor = '#f8f9fa';
        editInput.style.color = '#333';
        editInput.style.minWidth = '150px';
        
        // 添加input事件监听器
        editInput.addEventListener('input', function(e) {
          // console.log('输入事件 - 当前值:', e.target.value);
        });
        
        // 创建新的保存按钮替换编辑按钮
        // console.log('=== 开始创建保存按钮 ===');
        
        // 创建新的保存按钮
        const saveBtn = document.createElement('button');
        saveBtn.textContent = '保存';
        saveBtn.style.cssText = `
          padding: 6px 12px;
          border: 1px solid #027ba0ff;
          border-radius: 4px;
          background-color: #027ba0ff;
          color: #ffffff;
          font-size: 12px;
          cursor: pointer;
          width: 80px;
          text-align: center;
          display: inline-block;
        `;
        // console.log('创建的保存按钮textContent:', saveBtn.textContent);
        // console.log('创建的保存按钮样式:', saveBtn.style.cssText);
        
        // 保存原始编辑按钮的引用
        const originalEditBtn = editBtn;
        
        // 替换编辑按钮为保存按钮
        actionsContainer.replaceChild(saveBtn, editBtn);
        // console.log('保存按钮已替换编辑按钮');
        
        // 保存按钮点击事件
        saveBtn.onclick = async () => {
          // log('info', '=== 保存按钮点击事件开始 ===');
          
          const inputElement = textContainer.querySelector('.edit-container input');
          // log('debug', '获取到的编辑框:', inputElement);
          
          if (!inputElement) {
            // log('error', '编辑框未找到');
            showMessage('编辑框未找到', 'error');
            return;
          }
          
          const newTranslation = inputElement.value.trim();
          // log('info', '原文:', currentKey, '原始翻译:', currentTranslations[currentKey], '新翻译:', newTranslation);
          
          if (newTranslation) {
            // log('info', '开始保存翻译...');
            // 保存翻译
            const updatedCustomTranslations = JSON.parse(JSON.stringify(customTranslations));
            // log('debug', '保存前 customTranslations:', customTranslations);
            
            if (!updatedCustomTranslations[currentCategory]) {
              updatedCustomTranslations[currentCategory] = {};
              // log('info', '创建新分类:', currentCategory);
            }
            updatedCustomTranslations[currentCategory][currentKey] = newTranslation;
            // log('info', '更新后的翻译:', updatedCustomTranslations[currentCategory][currentKey]);
            
            setStorageValue(CUSTOM_TRANSLATIONS_KEY, updatedCustomTranslations);
            customTranslations = updatedCustomTranslations;
            // log('debug', '保存后 customTranslations:', customTranslations);
            
            // 恢复显示
            translationDisplay.style.display = 'flex';
            currentTranslationText.textContent = newTranslation;
            textContainer.removeChild(editContainer);
            // log('info', '管理界面更新完成');
            
            // 移除取消按钮
            if (cancelBtn.parentNode === actionsContainer) {
              actionsContainer.removeChild(cancelBtn);
            }
            
            // 恢复编辑按钮
            saveBtn.textContent = '编辑';
            saveBtn.style.backgroundColor = '#fff';
            saveBtn.style.color = '#027ba0ff';
            saveBtn.style.width = '60px';
            
            // 重新绑定编辑事件
            saveBtn.onclick = handleEdit;
            
            showMessage('翻译保存成功！请手动刷新页面（按F5）查看最新翻译', 'success');
            
            // 标记有修改
            window.translationManagerHasChanges = true;
            // log('info', '保存成功，设置标记为true');
            
            try {
              // 清除所有元素的翻译标记，确保重新翻译
              const translatedElements = document.querySelectorAll('[data-oao-translated="true"]');
              // log('info', '找到', translatedElements.length, '个已翻译元素');
              translatedElements.forEach(element => {
                delete element.dataset.oaoTranslated;
              });
              // log('info', '清除翻译标记完成');
              
              // 立即刷新页面，显示最新翻译
              // log('info', '开始刷新页面');
              // 强制重新加载字典，确保包含最新的自定义翻译
              const dictionaries = await ensureDictionaries();
              // log('info', '重新加载字典完成');
              // 直接调用futggTranslator.translate，确保使用最新的字典
              if (window.location.hostname.includes('fut.gg')) {
                const extraDictionaries = [
                  dictionaries.basic,
                  dictionaries.sixStat,
                  dictionaries.playstyles,
                  dictionaries.roles,
                ];
                let evolutionDictionary = null;
                const shouldApplyEvolutionFormat = evolutionFormat !== 2;
                if (shouldApplyEvolutionFormat) {
                  evolutionDictionary = dictionaries.evolutions;
                  extraDictionaries.push(evolutionDictionary);
                }
                // futgg evolutions 页面需要始终包含 evolutionDictionary，用于特殊处理
                const isFutggEvolutionsPage = window.location.href === 'https://www.fut.gg/evolutions/' ||
                                             window.location.href.includes('fut.gg/evolutions');
                if (isFutggEvolutionsPage && !evolutionDictionary) {
                  evolutionDictionary = dictionaries.evolutions;
                  extraDictionaries.push(evolutionDictionary);
                }
                // log('info', '调用 futggTranslator.translate');
                futggTranslator.translate(
                  document,
                  dictionaries.futgg,
                  {
                    useShortenTerms: USE_SHORTEN_TERMS,
                    showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
                    extraDictionaries: extraDictionaries,
                    evolutionDictionary: evolutionDictionary
                  }
                );
                // log('info', 'futggTranslator 运行完成');
              }
              // log('info', '页面刷新完成');
            } catch (error) {
              // log('error', '刷新页面时出错:', error);
            }
            
            // 重新加载翻译列表
            showTranslationsByCategory(currentCategory);
            // log('info', '翻译列表重新加载完成');
          } else {
            showMessage('请输入翻译内容', 'error');
          }
        };
        
        // 注意：editBtn是外部的const变量，不能重新赋值
        // 我们直接使用saveBtn，不需要更新editBtn引用
        // console.log('=== 保存按钮创建完成 ===');
        
        // 清理已有的取消按钮
        const existingCancelBtns = actionsContainer.querySelectorAll('.cancel-btn');
        existingCancelBtns.forEach(btn => btn.remove());
        
        // 取消按钮
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = '取消';
        cancelBtn.style.padding = '6px 12px';
        cancelBtn.style.border = '1px solid #ddd';
        cancelBtn.style.borderRadius = '4px';
        cancelBtn.style.backgroundColor = '#fff';
        cancelBtn.style.color = '#333';
        cancelBtn.style.fontSize = '12px';
        cancelBtn.style.cursor = 'pointer';
        
        cancelBtn.addEventListener('click', () => {
          // 恢复显示
          translationDisplay.style.display = 'flex';
          textContainer.removeChild(editContainer);
          
          // 移除取消按钮
          if (cancelBtn.parentNode === actionsContainer) {
            actionsContainer.removeChild(cancelBtn);
          }
          
          // 恢复编辑按钮
          saveBtn.textContent = '编辑';
          saveBtn.style.backgroundColor = '#fff';
          saveBtn.style.color = '#027ba0ff';
          saveBtn.style.width = '60px';
          
          // 重新绑定编辑事件
          saveBtn.onclick = handleEdit;
        });
        
        // 保存按钮点击事件
        saveBtn.onclick = () => {
          // log('info', '=== 保存按钮点击事件开始 ===');
          
          const inputElement = textContainer.querySelector('.edit-container input');
          // log('debug', '获取到的编辑框:', inputElement);
          
          if (!inputElement) {
            // log('error', '编辑框未找到');
            showMessage('编辑框未找到', 'error');
            return;
          }
          
          const newTranslation = inputElement.value.trim();
          // log('info', '原文:', currentKey, '原始翻译:', currentTranslations[currentKey], '新翻译:', newTranslation);
          
          if (newTranslation) {
            // log('info', '开始保存翻译...');
            // 保存翻译
            const updatedCustomTranslations = JSON.parse(JSON.stringify(customTranslations));
            // log('debug', '保存前 customTranslations:', customTranslations);
            
            if (!updatedCustomTranslations[currentCategory]) {
              updatedCustomTranslations[currentCategory] = {};
              // log('info', '创建新分类:', currentCategory);
            }
            updatedCustomTranslations[currentCategory][currentKey] = newTranslation;
            // log('info', '更新后的翻译:', updatedCustomTranslations[currentCategory][currentKey]);
            
            setStorageValue(CUSTOM_TRANSLATIONS_KEY, updatedCustomTranslations);
            customTranslations = updatedCustomTranslations;
            // log('debug', '保存后 customTranslations:', customTranslations);
            
            // 恢复显示
            translationDisplay.style.display = 'flex';
            currentTranslationText.textContent = newTranslation;
            textContainer.removeChild(editContainer);
            // log('info', '管理界面更新完成');
            
            // 移除取消按钮
            if (cancelBtn.parentNode === actionsContainer) {
              actionsContainer.removeChild(cancelBtn);
            }
            
            // 恢复编辑按钮
            editBtn.textContent = '编辑';
            editBtn.style.backgroundColor = '#fff';
            editBtn.style.color = '#027ba0ff';
            
            // 重新绑定编辑事件
            editBtn.onclick = handleEdit;
            
            showMessage('翻译保存成功！请手动刷新页面（按F5）查看最新翻译', 'success');
            
            // 标记有修改
            window.translationManagerHasChanges = true;
            // log('info', '保存成功，设置标记为true');
            
            // 重新加载翻译列表
            showTranslationsByCategory(currentCategory);
            // log('info', '翻译列表重新加载完成');
            
            try {
              // 清除所有元素的翻译标记，确保重新翻译
              const translatedElements = document.querySelectorAll('[data-oao-translated="true"]');
              // log('info', '找到', translatedElements.length, '个已翻译元素');
              translatedElements.forEach(element => {
                delete element.dataset.oaoTranslated;
              });
              // log('info', '清除翻译标记完成');
              
              // 重新翻译页面
              // log('info', '开始刷新页面');
              translateRoot(document);
              // log('info', '页面刷新完成');
            } catch (error) {
              // log('error', '刷新页面时出错:', error);
            }
          } else {
            showMessage('请输入翻译内容', 'error');
          }
        };
        
        // 组装编辑容器
        editContainer.appendChild(originalSpan);
        editContainer.appendChild(arrowSpan);
        editContainer.appendChild(originalTranslationSpan);
        editContainer.appendChild(editInput);
        
        // 添加到文本容器
        textContainer.appendChild(editContainer);
        
        // 添加取消按钮到操作容器
        actionsContainer.appendChild(cancelBtn);
        
        // 聚焦编辑框
        editInput.focus();
      };
      
      // 绑定编辑事件
      editBtn.onclick = handleEdit;
    })(key, category, translations, translationText);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '恢复原始';
    deleteBtn.style.padding = '6px 12px';
    deleteBtn.style.border = '1px solid #dc3545';
    deleteBtn.style.borderRadius = '4px';
    deleteBtn.style.backgroundColor = '#fff';
    deleteBtn.style.color = '#dc3545';
    deleteBtn.style.fontSize = '12px';
    deleteBtn.style.cursor = 'pointer';
    deleteBtn.style.transition = 'all 0.2s ease';
    
    deleteBtn.addEventListener('mouseenter', () => {
      deleteBtn.style.backgroundColor = '#f8d7da';
    });
    
    deleteBtn.addEventListener('mouseleave', () => {
      deleteBtn.style.backgroundColor = '#fff';
    });
    
    deleteBtn.addEventListener('click', async () => {
      // log('info', '点击恢复原始按钮，原文:', key, '当前翻译:', translations[key]);
      if (confirm('确定要恢复原始翻译吗？')) {
        if (customTranslations[category]) {
          // log('info', '开始恢复原始翻译...');
          // log('debug', '恢复前 customTranslations:', customTranslations);
          delete customTranslations[category][key];
          // log('debug', '删除翻译后 customTranslations:', customTranslations);
          if (Object.keys(customTranslations[category]).length === 0) {
            delete customTranslations[category];
            // log('info', '删除空分类:', category);
          }
          setStorageValue(CUSTOM_TRANSLATIONS_KEY, customTranslations);
          // log('debug', '保存后 customTranslations:', customTranslations);
          showTranslationsByCategory(category);
          // log('info', '翻译列表重新加载完成');
          showMessage('已恢复原始翻译！请手动刷新页面（按F5）查看最新翻译', 'success');
          // 标记有修改
          window.translationManagerHasChanges = true;
          // log('info', '恢复原始成功，设置标记为true');
          
          try {
            // 清除所有元素的翻译标记，确保重新翻译
            const translatedElements = document.querySelectorAll('[data-oao-translated="true"]');
            // log('info', '找到', translatedElements.length, '个已翻译元素');
            translatedElements.forEach(element => {
              delete element.dataset.oaoTranslated;
            });
            // log('info', '清除翻译标记完成');
            
            // 立即刷新页面，显示原始翻译
            // log('info', '开始刷新页面');
            await translateRoot(document);
            // log('info', '页面刷新完成');
          } catch (error) {
            // log('error', '刷新页面时出错:', error);
          }
        }
      }
    });
    
    // 进化字典只能查看，不能修改
    if (category === 'evolutions') {
      translationItem.appendChild(textContainer);
      translationList.appendChild(translationItem);
      return;
    }
    
    // 只有自定义翻译可以删除
    if (customTranslations[category] && customTranslations[category][key]) {
      actionsContainer.appendChild(editBtn);
      actionsContainer.appendChild(deleteBtn);
    } else {
      // 默认翻译只能编辑（添加为自定义翻译）
      actionsContainer.appendChild(editBtn);
    }
    
    translationItem.appendChild(textContainer);
    translationItem.appendChild(actionsContainer);
    translationList.appendChild(translationItem);
  });
}

// 保存自定义翻译
function saveCustomTranslation() {
  const originalText = document.getElementById('original-text').value.trim();
  const translationText = document.getElementById('translation-text').value.trim();
  const category = document.getElementById('category-select').value;
  
  if (!originalText || !translationText) {
    showMessage('请输入原文和翻译', 'error');
    return;
  }
  
  // 检查原文是否为中文，如果是则提示用户输入英文
  if (/[\u4e00-\u9fa5]/.test(originalText)) {
    showMessage('原文必须是英文，不能是中文', 'error');
    return;
  }
  
  // 确保分类对象存在
  if (!customTranslations[category]) {
    customTranslations[category] = {};
  }
  
  // 保存翻译
  customTranslations[category][originalText] = translationText;
  
  // 保存到本地存储
  setStorageValue(CUSTOM_TRANSLATIONS_KEY, customTranslations);
  
  // 更新翻译列表
  showTranslationsByCategory(category);
  
  // 清空表单
  document.getElementById('original-text').value = '';
  document.getElementById('translation-text').value = '';
  
  showMessage('翻译保存成功！请手动刷新页面（按F5）查看最新翻译', 'success');
  
  // 重新翻译页面
  translateRoot(document);
}



// 显示消息提示
function showMessage(message, type = 'info') {
  // 创建消息元素
  const messageElement = document.createElement('div');
  messageElement.style.position = 'fixed';
  messageElement.style.top = '20px';
  messageElement.style.right = '20px';
  messageElement.style.padding = '12px 20px';
  messageElement.style.borderRadius = '8px';
  messageElement.style.color = '#fff';
  messageElement.style.fontWeight = '600';
  messageElement.style.zIndex = '99999';
  messageElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
  messageElement.style.transition = 'all 0.3s ease';
  messageElement.style.transform = 'translateX(400px)';
  messageElement.textContent = message;
  
  // 根据类型设置颜色
  switch (type) {
    case 'success':
      messageElement.style.backgroundColor = '#28a745';
      break;
    case 'error':
      messageElement.style.backgroundColor = '#dc3545';
      break;
    case 'info':
    default:
      messageElement.style.backgroundColor = '#027ba0ff';
      break;
  }
  
  // 添加到页面
  document.body.appendChild(messageElement);
  
  // 显示动画
  setTimeout(() => {
    messageElement.style.transform = 'translateX(0)';
  }, 100);
  
  // 3秒后消失
  setTimeout(() => {
    messageElement.style.transform = 'translateX(400px)';
    setTimeout(() => {
      if (document.body.contains(messageElement)) {
        document.body.removeChild(messageElement);
      }
    }, 300);
  }, 3000);
}

    const evolutionFormatBtn = document.createElement('button');
    evolutionFormatBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--evolution-format`;
    // 根据当前状态设置按钮文本和样式
    function updateEvolutionFormatButton() {
      switch (evolutionFormat) {
        case 0:
          evolutionFormatBtn.textContent = '进化格式\n中英';
          evolutionFormatBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--evolution-format`;
          evolutionFormatBtn.style.backgroundColor = '#049c04ff';
          evolutionFormatBtn.style.color = '#FFFFFF';
          break;
        case 1:
          evolutionFormatBtn.textContent = '进化格式\n【来源】中文';
          evolutionFormatBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--evolution-format`;
          evolutionFormatBtn.style.backgroundColor = '#9c27b0';
          evolutionFormatBtn.style.color = '#FFFFFF';
          break;
        case 2:
          evolutionFormatBtn.textContent = '进化格式\n英文';
          evolutionFormatBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--evolution-format english-only`;
          evolutionFormatBtn.style.backgroundColor = '#049c04ff';
          evolutionFormatBtn.style.color = '#FFFFFF';
          break;
        case 3:
          evolutionFormatBtn.textContent = '进化格式\n【来源】中英';
          evolutionFormatBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--evolution-format`;
          evolutionFormatBtn.style.backgroundColor = '#2196F3';
          evolutionFormatBtn.style.color = '#FFFFFF';
          break;
      }
    }
    updateEvolutionFormatButton();
    evolutionFormatBtn.addEventListener('click', () => {
      // 循环切换状态: 0 → 1 → 2 → 3 → 0
      evolutionFormat = (evolutionFormat + 1) % 4;
      // 保存状态到本地存储
      setStorageValue(EVOLUTION_FORMAT_KEY, evolutionFormat);
      // 更新按钮文本和样式
      updateEvolutionFormatButton();
      // 无论切换到哪个状态，都刷新页面以确保格式更新
      location.reload();
    });

    // 添加翻译管理按钮
    const translationManagerBtn = document.createElement('button');
    translationManagerBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--translation-manager`;
    translationManagerBtn.textContent = '翻译管理';
    translationManagerBtn.style.backgroundColor = '#9c27b0'; // 紫色
    translationManagerBtn.style.color = '#FFFFFF';
    translationManagerBtn.addEventListener('click', openTranslationManager);

    // ===== OAO 小程序入口 =====
    // 二维码内嵌为 base64（自包含，无额外网络请求）；下方 data URI 由构建脚本写入
    const OAO_MINIAPP_QR_DATA_URI = 'data:image/jpeg;base64,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';
    const OAO_MINIAPP_LINK_URL = 'https://mp.weixin.qq.com/s/qs910MXHx5t0zNCGH4sK7g';

    // OAO 小程序弹窗：标题 + 说明文案 + 详情跳转链接 + 小程序码 + 关闭按钮
    function openMiniAppPopup() {
      // 避免重复弹窗（同时注销上一个弹窗的 Esc 监听，避免监听器泄漏）
      const existing = document.getElementById('oao-miniapp-modal');
      if (existing) {
        if (existing._oaoKeydown) document.removeEventListener('keydown', existing._oaoKeydown, true);
        existing.remove();
      }

      const modal = document.createElement('div');
      modal.id = 'oao-miniapp-modal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '100000';
      modal.style.backdropFilter = 'blur(5px)';

      const content = document.createElement('div');
      content.style.backgroundColor = '#fff';
      content.style.borderRadius = '12px';
      content.style.padding = '28px 24px';
      content.style.width = '340px';
      content.style.maxWidth = '90%';
      content.style.maxHeight = '85vh';
      content.style.overflowY = 'auto';
      content.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
      content.style.textAlign = 'center';

      const title = document.createElement('h3');
      title.textContent = 'OAO-FCUT资料助手';
      title.style.color = '#111';
      title.style.fontSize = '20px';
      title.style.fontWeight = '700';
      title.style.margin = '0 0 14px 0';

      const desc = document.createElement('p');
      desc.textContent = '在小程序能查看球员数据、球员市场价格、SBC和进化信息，还能进行阵容模拟、战术设置，功能全面，微信里搜一下就能用，不用下载、不用注册，点开即用。';
      desc.style.color = '#555';
      desc.style.fontSize = '14px';
      desc.style.lineHeight = '1.7';
      desc.style.margin = '0 0 10px 0';
      desc.style.textAlign = 'left';

      const link = document.createElement('a');
      link.textContent = '详情请查看>>>';
      link.href = OAO_MINIAPP_LINK_URL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'block';
      link.style.color = '#07C160';
      link.style.fontSize = '14px';
      link.style.fontWeight = '700';
      link.style.margin = '0 0 16px 0';
      link.style.textDecoration = 'none';
      link.style.cursor = 'pointer';
      link.addEventListener('mouseenter', () => { link.style.textDecoration = 'underline'; });
      link.addEventListener('mouseleave', () => { link.style.textDecoration = 'none'; });

      const qrImg = document.createElement('img');
      qrImg.src = OAO_MINIAPP_QR_DATA_URI;
      qrImg.alt = 'OAO-FCUT资料助手 小程序码';
      qrImg.style.width = '220px';
      qrImg.style.maxWidth = '100%';
      qrImg.style.display = 'block';
      qrImg.style.margin = '0 auto';
      qrImg.style.borderRadius = '8px';
      qrImg.style.border = '1px solid #eee';

      const closeBtn = document.createElement('button');
      closeBtn.textContent = '关闭';
      closeBtn.style.width = '100%';
      closeBtn.style.height = '40px';
      closeBtn.style.border = '1px solid #ddd';
      closeBtn.style.borderRadius = '8px';
      closeBtn.style.backgroundColor = '#f5f5f5';
      closeBtn.style.color = '#333';
      closeBtn.style.fontWeight = '600';
      closeBtn.style.fontSize = '14px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.marginTop = '18px';
      closeBtn.style.transition = 'all 0.2s ease';
      closeBtn.addEventListener('mouseenter', () => { closeBtn.style.backgroundColor = '#e0e0e0'; });
      closeBtn.addEventListener('mouseleave', () => { closeBtn.style.backgroundColor = '#f5f5f5'; });
      closeBtn.addEventListener('click', closeModal);

      content.appendChild(title);
      content.appendChild(desc);
      content.appendChild(link);
      content.appendChild(qrImg);
      content.appendChild(closeBtn);
      modal.appendChild(content);

      // 统一关闭逻辑：移除弹窗 + 注销 Esc 监听（三条关闭路径共用，避免监听器泄漏）
      function closeModal() {
        document.removeEventListener('keydown', onKeydown, true);
        modal.remove();
      }
      // 点击遮罩空白处也可关闭
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
      // Esc 关闭
      const onKeydown = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) closeModal();
      };
      modal._oaoKeydown = onKeydown;
      document.addEventListener('keydown', onKeydown, true);

      document.body.appendChild(modal);
    }

    // 添加 OAO 小程序按钮（位于「翻译管理」下方；微信绿，与小程序主题一致）
    const miniappBtn = document.createElement('button');
    miniappBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--miniapp`;
    miniappBtn.textContent = 'OAO小程序';
    miniappBtn.style.backgroundColor = '#07C160'; // 微信绿
    miniappBtn.style.color = '#FFFFFF';
    miniappBtn.addEventListener('click', openMiniAppPopup);

    // 添加隐藏按钮
    const hideBtn = document.createElement('button');
    hideBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--hide`;
    hideBtn.style.backgroundColor = '#4800bdff'; // 紫色
    hideBtn.style.color = '#FFFFFF';
    hideBtn.textContent = '隐藏侧边栏';
    hideBtn.addEventListener('click', () => {
      // 隐藏侧边栏面板
      panel.style.display = 'none';
      // 保存隐藏状态
      setStorageValue(SIDEBAR_HIDDEN_KEY, true);
      // 清除移动端“保持展开”标记，使下次移动端加载恢复为悬浮图标
      setStorageValue(MOBILE_EXPANDED_KEY, false);
      // 显示可拖动的悬浮图标
      createFloatIcon();
    });

    const label = document.createElement('div');
    label.className = 'oaevo-sidebar-label';
    label.textContent = '';

    // 设置按钮颜色
    refreshBtn.style.backgroundColor = '#FF0000'; // 红色
    refreshBtn.style.color = '#FFFFFF';
    
    if (typeof settingsBtn !== 'undefined') {
      settingsBtn.style.backgroundColor = '#FF7F00'; // 橙色
      settingsBtn.style.color = '#FFFFFF';
    }
    
    if (typeof expandBtn !== 'undefined') {
      expandBtn.style.backgroundColor = '#FF7F00'; // 橙色
      expandBtn.style.color = '#FFFFFF';
    }
    
    if (typeof evolutionFormatBtn !== 'undefined') {
      evolutionFormatBtn.style.backgroundColor = '#049c04ff'; // 绿
      evolutionFormatBtn.style.color = '#FFFFFF';
    }
    
    if (typeof featureBtn !== 'undefined') {
      featureBtn.style.backgroundColor = '#027ba0ff'; // 蓝
      featureBtn.style.color = '#FFFFFF';
    }

    // 关注欧啊欧按钮已移至快捷入口弹窗的"其他功能"区（见 openFollowQrPopup）

    // 特技搭配推荐入口已迁移至「便捷入口 → 特别推荐 → 特技搭配推荐」，不再单独显示在侧边栏

    // 重新排列按钮顺序
    panel.appendChild(title);

    if (isUtWebPage) {
      panel.appendChild(utwebFormatBtn);
      panel.appendChild(featureBtn);
      panel.appendChild(miniappBtn);
      panel.appendChild(hideBtn);
    } else {
      // 翻译开关按钮（第二个位置）
      if (window.location.hostname.includes('easysbc.io')) {
        // EASYSBC页面：EASY翻译按钮
        if (typeof easysbcBtn !== 'undefined') {
          panel.appendChild(easysbcBtn);
        }
      } else if (!window.location.hostname.includes('fut.gg')) {
        // FUTBIN页面：FUTBIN翻译按钮
        if (typeof expandBtn !== 'undefined') {
          panel.appendChild(expandBtn);
        }
      } else {
        // FUTGG页面：FUTGG翻译按钮（settingsBtn）
        if (typeof settingsBtn !== 'undefined') {
          panel.appendChild(settingsBtn);
        }
      }
      
      // 其他按钮
      panel.appendChild(refreshBtn);
      panel.appendChild(evolutionFormatBtn);
      panel.appendChild(featureBtn);
      panel.appendChild(translationManagerBtn);
      panel.appendChild(miniappBtn);
      panel.appendChild(hideBtn);
    }
    
    // 添加版本信息（显示外壳/插件本体版本，与弹窗「插件本体」保持一致）
    const versionInfo = document.createElement('div');
    versionInfo.setAttribute('data-version-indicator', 'true');
    const scriptVersion = getLoaderVersion();
    versionInfo.innerHTML = 'version: ' + scriptVersion;
    versionInfo.style.fontSize = '12px';
    versionInfo.style.color = '#fff';
    versionInfo.style.textAlign = 'center';
    versionInfo.style.marginTop = '8px';
    versionInfo.style.opacity = '0.7';
    versionInfo.style.cursor = 'pointer';
    versionInfo.title = '点击检查更新';
    
    // 检查是否有新版本信息
    const savedNewVersion = localStorage.getItem(NEW_VERSION_KEY);
    if (savedNewVersion) {
      try {
        newVersionInfo = JSON.parse(savedNewVersion);
        // 添加红点
        const dot = document.createElement('span');
        dot.className = 'version-update-dot';
        dot.style.cssText = `
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #ff4444;
          border-radius: 50%;
          margin-left: 6px;
          animation: pulse 2s infinite;
        `;
        versionInfo.appendChild(dot);
      } catch (e) {
        // 解析失败，忽略
      }
    }
    
    // 点击版本信息时必定显示更新弹窗
    // 始终从 gitee 强制拉取最新 version.json，不再依赖 localStorage 缓存，
    // 避免 utweb 等域名因缓存残留旧版本号（如 1.8.10）导致显示错误。
    versionInfo.addEventListener('click', () => {
      console.log('[OAO] 点击版本号，开始检查更新');
      fetchVersionManifestForDialog()
        .then(() => console.log('[OAO] 版本清单拉取成功，已展示弹窗'))
        .catch((err) => {
          console.warn('[OAO] 版本清单拉取失败，使用本地兜底：', err && err.message);
          try {
            showUpdateDialog({ bundle_version: getScriptVersion(), loader_version: getLoaderVersion() });
          } catch (e) {
            console.error('[OAO] 兜底弹窗渲染失败：', e && e.stack);
          }
        });
    });
    
    panel.appendChild(versionInfo);
    
    panel.appendChild(label);

    sidebar.appendChild(panel);

    // 确保 body 存在
    if (!document.body) {
      // 如果 body 不存在，延迟创建
      setTimeout(() => createSidebar(), 100);
      return;
    }
    document.body.appendChild(sidebar);

    let isDragging = false;
    let startX, startY, initialRight, initialTop;

    // 开始拖动的通用函数
    function startSidebarDrag(e) {
      if (e.target === panel || e.target === title) {
        isDragging = true;
        sidebar.classList.add('dragging');
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        startX = clientX;
        startY = clientY;
        const rect = sidebar.getBoundingClientRect();
        initialRight = window.innerWidth - rect.right;
        initialTop = rect.top;
        e.preventDefault();
      }
    }

    // 移动的通用函数
    function moveSidebarDrag(e) {
      if (!isDragging) return;
      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;
      const deltaX = clientX - startX;
      const deltaY = clientY - startY;
      const newRight = Math.max(0, initialRight - deltaX);
      const newTop = Math.max(0, initialTop + deltaY);
      sidebar.style.right = newRight + 'px';
      sidebar.style.top = newTop + 'px';
      sidebar.style.left = 'auto';
    }

    // 结束拖动的通用函数
    function endSidebarDrag() {
      if (isDragging) {
        isDragging = false;
        sidebar.classList.remove('dragging');
      }
    }

    // 鼠标事件
    panel.addEventListener('mousedown', startSidebarDrag);
    document.addEventListener('mousemove', moveSidebarDrag);
    document.addEventListener('mouseup', endSidebarDrag);

    // 触摸事件（支持手机端）
    panel.addEventListener('touchstart', startSidebarDrag, { passive: false });
    document.addEventListener('touchmove', moveSidebarDrag, { passive: false });
    document.addEventListener('touchend', endSidebarDrag);
  }


  // 字典缓存（初始化为空，通过 loadBuiltInDictionaries 加载）
  const dictionaryCache = {
    basic: null,
    sixStat: null,
    roles: null,
    squad: null,
    chemistry: null,
    playstyles: null,
    evolutions: null,
    futgg: null,
    futbin: null,
    easysbc: null,
    sbc: null,
    playerReview: null
  };

  let evolutionsLoadPromise = null;
  let builtInDictionariesLoadPromise = null;

  // 工具函数
  function normalizeTranslationDictionary(rawDict) {
    const normalized = {};
    if (!rawDict) {
      return normalized;
    }

    // 支持数组格式（OAO-manager 使用数组存储进化数据以支持重复名称）
    if (Array.isArray(rawDict)) {
      rawDict.forEach(entry => {
        if (!entry || !entry.name) {
          return;
        }
        const english = entry.name.trim();
        let webpagedata = String(entry.CN || entry?.webpagedata || entry?.formal || '').trim();
        let shorten = String(entry.CN || entry?.shorten || webpagedata).trim();
        
        // 如果翻译为空，回退到英文 key
        if (!webpagedata) webpagedata = english;
        if (!shorten) shorten = english;
        
        // 新数组格式：名称不会有#数字后缀，直接使用
        const baseName = english;
        
        // 创建条目对象
        const entryObj = {
          webpagedata,
          shorten,
          source: entry.source || '',
          timestamp: entry.timestamp || 0,
          futbin_id: entry.futbin_id || '',
          futgg_id: entry.futgg_id || '',
          easysbc_id: entry.easysbc_id || '',
        };
        
        // 如果已经有同名条目，使用数组存储多个条目
        if (!normalized[baseName]) {
          normalized[baseName] = entryObj;
        } else {
          // 如果已有同名条目，转换为数组格式
          if (!Array.isArray(normalized[baseName])) {
            normalized[baseName] = [normalized[baseName]];
          }
          normalized[baseName].push(entryObj);
        }
      });
    } else {
      // 支持对象格式
      Object.entries(rawDict).forEach(([english, entry]) => {
        if (!english) {
          return;
        }
        // 处理字符串值和对象值两种格式
        let webpagedata, shorten, source, timestamp, futbin_id, futgg_id, easysbc_id;
        if (typeof entry === 'string') {
          // 简单字符串值格式（如 "Anticipate+": "预判+"）
          webpagedata = entry.trim();
          shorten = entry.trim();
          source = '';
          timestamp = 0;
          futbin_id = '';
          futgg_id = '';
          easysbc_id = '';
        } else {
          // 对象值格式（如 "Anticipate+": {"CN": "预判+", "futgg_id": "2231"}）
          webpagedata = String(entry?.webpagedata || entry?.formal || entry?.professional || entry?.CN || '').trim();
          shorten = String(entry?.shorten || entry?.casual || entry?.playerSlang || entry?.CN || webpagedata).trim();
          source = entry?.source || '';
          timestamp = entry?.timestamp || 0;
          futbin_id = entry?.futbin_id || '';
          futgg_id = entry?.futgg_id || '';
          easysbc_id = entry?.easysbc_id || '';
        }
        
        // 如果翻译为空，回退到英文 key
        const baseName = english.trim().replace(/#\d+$/, '');
        if (!webpagedata) webpagedata = baseName;
        if (!shorten) shorten = baseName;
        
        // 创建条目对象
        const entryObj = {
          webpagedata,
          shorten,
          source,
          timestamp,
          futbin_id,
          futgg_id,
          easysbc_id,
        };
        
        // 如果已经有同名条目，使用数组存储多个条目（与数组格式处理一致）
        if (!normalized[baseName]) {
          normalized[baseName] = entryObj;
        } else {
          if (!Array.isArray(normalized[baseName])) {
            normalized[baseName] = [normalized[baseName]];
          }
          normalized[baseName].push(entryObj);
        }
      });
    }

    return normalized;
  }

  function buildCaseInsensitiveMap(dictionary) {
    const map = {};
    if (dictionary && typeof dictionary === 'object') {
      for (const key of Object.keys(dictionary)) {
        map[key.toUpperCase()] = dictionary[key];
      }
    }
    return map;
  }

  // 显示用键名：去掉末尾的 [xxx] 后缀
  // 原因：fut.gg 页面标题里的 "[FC 26 Obj]" 会被单独截出来当后缀，渲染时再拼回；
  // 若字典键本身也带这个后缀，就会渲染成 "健步如飞 (Quick Step[FC 26 Obj]) [FC 26 Obj]" 这种重复括号。
  function stripEvoSuffix(key) {
    return String(key == null ? '' : key).replace(/\s*\[[^\]]+\]$/, '').trim();
  }

  // 从 fut.gg 进化卡片元素稳健提取 futgg_id
  // 快路径：元素自身或祖先就是卡片 <a href="/evolutions/数字-...">；
  // 兜底：向上遍历祖先容器，在每一层内查找同卡 <a>（覆盖 a 是兄弟节点 / 嵌套层级变动导致 closest('a') 取空的情况）。
  // 解决「列表页原 wrapper.closest('a') 偶发取不到 id → id 分支被跳过 → 只剩名称匹配」的问题。
  function extractFutggEvoId(el) {
    if (!el) return '';
    const a = el.closest && el.closest('a');
    if (a && a.href) {
      const m = String(a.href).match(/\/evolutions\/(\d+)-/);
      if (m) return m[1];
    }
    let cur = el;
    let guard = 0;
    while (cur && guard < 50) {
      guard++;
      const link = cur.querySelector && cur.querySelector('a[href*="/evolutions/"]');
      if (link && link.href) {
        const m = String(link.href).match(/\/evolutions\/(\d+)-/);
        if (m) return m[1];
      }
      if (!cur.parentElement) break;
      cur = cur.parentElement;
    }
    return '';
  }

  // 按页面 baseText（已剥掉末尾 [xxx] 后缀）在进化字典中找键：
  //   1) 页面带后缀时，优先匹配「剥后缀且后缀与页面一致」的键（如 Quick Step[FC26Obj]），避免误取无后缀通用键；
  //   2) 精确匹配（O(1)，最常见）；
  //   3) 兜底仅按剥后缀匹配。
  // 这样即便字典键仍带 [FC 26 Obj] 后缀、而页面已把后缀剥离，名称通道也能命中且不错配。
  function findEvolutionKey(dict, baseText, suffix) {
    if (!dict || !baseText) return null;
    const bt = String(baseText).trim();
    const btU = bt.toUpperCase();
    const suf = (suffix || '').trim();
    const btStripU = stripEvoSuffix(bt).toUpperCase();
    if (suf) {
      for (const k in dict) {
        if (stripEvoSuffix(k).toUpperCase() === btStripU && k.toUpperCase().endsWith(suf.toUpperCase())) {
          return k;
        }
      }
    }
    if (dict[bt]) return bt;
    if (dict[btU]) return btU;
    for (const k in dict) {
      if (stripEvoSuffix(k).toUpperCase() === btStripU) return k;
    }
    return null;
  }

  function findEvolutionById(dict, idValue, idField) {
    // 统一转字符串比较：字典里的 futgg_id/futbin_id 有时写成数字（2547），页面取到的是字符串（"2547"），
    // 原来用 === 严格比较会静默失配。
    const target = String(idValue == null ? '' : idValue).trim();
    if (!target) return null;
    for (const key in dict) {
      const dictValue = dict[key];
      if (Array.isArray(dictValue)) {
        for (const item of dictValue) {
          if (item && typeof item === 'object' && String(item[idField] == null ? '' : item[idField]).trim() === target) {
            return { key: stripEvoSuffix(key), entry: item };
          }
        }
      } else if (dictValue && typeof dictValue === 'object' && String(dictValue[idField] == null ? '' : dictValue[idField]).trim() === target) {
        return { key: stripEvoSuffix(key), entry: dictValue };
      }
    }
    return null;
  }

  function getTranslationValue(dictValue, useShorten, fallbackKey = null) {
    if (dictValue === null || dictValue === undefined) {
      return fallbackKey;
    }
    if (Array.isArray(dictValue)) {
      if (dictValue.length === 0) return fallbackKey;
      const firstItem = dictValue[0];
      if (firstItem && typeof firstItem === 'object') {
        const result = useShorten ? (firstItem.shorten || firstItem.webpagedata || firstItem.CN) : (firstItem.webpagedata || firstItem.shorten || firstItem.CN);
        return result || fallbackKey;
      }
      return firstItem || fallbackKey;
    }
    if (dictValue && typeof dictValue === 'object') {
      const result = useShorten ? (dictValue.shorten || dictValue.webpagedata || dictValue.CN) : (dictValue.webpagedata || dictValue.shorten || dictValue.CN);
      return result || fallbackKey;
    }
    return dictValue || fallbackKey;
  }

  function getSourceValue(dictValue) {
    if (Array.isArray(dictValue)) {
      if (dictValue.length === 0) return '';
      const firstItem = dictValue[0];
      if (firstItem && typeof firstItem === 'object') {
        return firstItem.source || '';
      }
      return '';
    }
    if (dictValue && typeof dictValue === 'object') {
      return dictValue.source || '';
    }
    return '';
  }

  function checkIfNeedsReprocess(text, format) {
    if (!text) return false;
    const hasChinese = /[\u4e00-\u9fa5]/.test(text);
    if (format === 2) {
      return hasChinese;
    }
    return !hasChinese;
  }

  function selectEvolutionEntryByPriority(dictValue, idField) {
    if (!dictValue) return dictValue;
    if (Array.isArray(dictValue)) {
      if (dictValue.length === 0) return null;
      const genericEntry = dictValue.find(item => typeof item === 'object' && !item[idField]);
      if (genericEntry) {
        return genericEntry;
      }
      return dictValue[0];
    }
    return dictValue;
  }

  // 检查是否需要刷新缓存（用于其他分类字典）
  function shouldRefreshOtherDictionaries(cacheTime) {
    const now = Date.now();
    const currentDate = new Date().toDateString();
    
    // 条件1：每6个小时刷新一次
    if (now - cacheTime > SIX_HOURS_MS) {
      // console.log('[OAO] 其他分类字典缓存超过6小时，需要刷新');
      return true;
    }
    
    // 条件2：每天3点后，首次使用OAO插件时刷新
    const currentHour = new Date().getHours();
    const lastRefreshDate = GM_getValue('oao_other_dicts_cache_date', '');
    if (currentHour >= 3 && lastRefreshDate !== currentDate) {
      // console.log('[OAO] 新的一天3点后首次使用，其他分类字典需要刷新');
      return true;
    }
    
    return false;
  }

  function isCacheEntryValid(entry) {
    return (
      entry &&
      typeof entry.timestamp === 'number' &&
      entry.data &&
      Date.now() - entry.timestamp < THREE_HOURS_MS
    );
  }

  // 获取缓存
  function getStorageValue(key) {
    try {
      const value = GM_getValue(key, null);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      // console.warn('Failed to get storage value:', error);
      return null;
    }
  }

  // 设置缓存
  function setStorageValue(key, value) {
    try {
      GM_setValue(key, JSON.stringify(value));
    } catch (error) {
      // console.warn('Failed to set storage value:', error);
    }
  }

  // 在线获取JSON（支持多数据源）
  function fetchRemoteJson(url) {
    // console.log('[OAO] 尝试从URL获取:', url);
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: url,
        headers: {
          'Cache-Control': 'no-cache'
        },
        onload: function(response) {
          // console.log('[OAO] 请求完成，状态码:', response.status);
          if (response.status === 200) {
            try {
              const data = JSON.parse(response.responseText);
              // console.log('[OAO] JSON解析成功');
              resolve(data);
            } catch (error) {
              // console.error('[OAO] 解析数据失败:', error);
              // console.log('[OAO] 响应内容:', response.responseText);
              reject(new Error('Failed to parse JSON'));
            }
          } else {
            // console.error('[OAO] 请求失败，状态码:', response.status);
            // console.log('[OAO] 响应内容:', response.responseText);
            reject(new Error(`Request failed with status ${response.status}`));
          }
        },
        onerror: function(error) {
          // console.error('[OAO] 网络错误:', error);
          reject(new Error('Network error'));
        }
      });
    });
  }

  async function fetchRemoteJsonWithFallback(urls) {
    // console.log('[OAO] 开始尝试多个数据源，共', urls.length, '个');
    for (let i = 0; i < urls.length; i++) {
      const _u = urls[i];
      // console.log('[OAO] 尝试数据源', i + 1, ':', _u);
      try {
        const _dt = await fetchRemoteJson(_u);
        
        let _fd = _dt;
        let _sk = false;
        if (typeof _dt === 'string' && _dt.startsWith('OAO-ENCRYPTED:')) {
          const _ed = _dt.substring('OAO-ENCRYPTED:'.length);
          const _dd = _d0(_ed);
          if (_dd) {
            _fd = _dd;
          } else {
            _sk = true;
          }
        }
        
        if (_sk) {
          // console.log('[OAO] 数据源解密失败，继续尝试下一个');
          continue;
        }
        
        // console.log('[OAO] 成功从数据源', i + 1, '获取数据');
        return _fd;
      } catch (error) {
        // console.error('[OAO] 数据源', i + 1, '失败:', error);
      }
    }
    // console.error('[OAO] 所有数据源都失败了');
    throw new Error('All data sources failed');
  }

  // 加载进化字典
  async function loadEvolutionsDictionary() {
    if (dictionaryCache.evolutions && Object.keys(dictionaryCache.evolutions).length > 0) {
      return dictionaryCache.evolutions;
    }
    
    if (!evolutionsLoadPromise) {
      evolutionsLoadPromise = (async () => {
        try {
          // 检查缓存
          const cachedEntry = getStorageValue(EVOLUTIONS_STORAGE_KEY);
          if (isCacheEntryValid(cachedEntry)) {
            dictionaryCache.evolutions = normalizeTranslationDictionary(cachedEntry.data);
            return dictionaryCache.evolutions;
          }

          // 尝试从远程获取（带备用数据源）
          try {
            const remoteJson = await fetchRemoteJsonWithFallback(withCacheBust(EVOLUTIONS_DICT_URLS));

            // 防降级保护：远程数据若明显少于上一次的已知好数据（例如备用源指向旧文件、
            // 或 CDN 命中旧缓存），直接忽略，继续沿用本地缓存，避免「新进化突然不显示」。
            const prevRaw = (cachedEntry && cachedEntry.data) ? cachedEntry.data : null;
            const remoteCount = countDictEntries(remoteJson);
            const prevCount = countDictEntries(prevRaw);
            if (prevRaw && prevCount > 0 && remoteCount < prevCount * 0.6) {
              console.warn('[OAO] 进化字典远程数据异常偏少（远程 ' + remoteCount + ' 条 < 缓存 ' + prevCount + ' 条），已忽略并沿用本地缓存');
              dictionaryCache.evolutions = normalizeTranslationDictionary(prevRaw);
              return dictionaryCache.evolutions;
            }

            const normalized = normalizeTranslationDictionary(remoteJson);
            
            // 保存到缓存
            setStorageValue(EVOLUTIONS_STORAGE_KEY, {
              timestamp: Date.now(),
              data: remoteJson
            });
            
            dictionaryCache.evolutions = normalized;
            console.log('[OAO] 进化字典已加载:', Object.keys(normalized).length, '条（远程）');
            return normalized;
          } catch (error) {
            // 所有数据源都失败：退回到任意年龄的本地缓存（有旧数据总比整个进化翻译失效好）
            if (cachedEntry && cachedEntry.data) {
              console.warn('[OAO] 进化字典拉取失败，沿用本地缓存:', countDictEntries(cachedEntry.data), '条');
              dictionaryCache.evolutions = normalizeTranslationDictionary(cachedEntry.data);
              return dictionaryCache.evolutions;
            }
            dictionaryCache.evolutions = {};
            return {};
          }
        } catch (error) {
          dictionaryCache.evolutions = {};
          return {};
        } finally {
          evolutionsLoadPromise = null;
        }
      })();
    }
    
    return evolutionsLoadPromise;
  }

  // 强制刷新进化字典
  async function forceRefreshEvolutionsDictionary() {
    try {
      const remoteJson = await fetchRemoteJsonWithFallback(withCacheBust(EVOLUTIONS_DICT_URLS));
      const normalized = normalizeTranslationDictionary(remoteJson);
      
      // 保存到 localStorage 缓存
      setStorageValue(EVOLUTIONS_STORAGE_KEY, {
        timestamp: Date.now(),
        data: remoteJson
      });
      
      // 保存到 GM 存储缓存
      GM_setValue('oao_evolutions_cache', JSON.stringify(remoteJson));
      GM_setValue('oao_evolutions_cache_time', Date.now());
      GM_setValue('oao_evolutions_cache_date', new Date().toDateString());
      
      dictionaryCache.evolutions = normalized;
      // console.log('[OAO] 进化字典已刷新:', Object.keys(normalized).length, '条');
      return normalized;
    } catch (error) {
        throw error;
      }
  }
  
  // 加载内置翻译字典
  async function loadBuiltInDictionaries() {
    // console.log('[OAO] loadBuiltInDictionaries 被调用');
    // 检查字典是否已加载且不为空
    const hasBasic = dictionaryCache.basic && Object.keys(dictionaryCache.basic).length > 0;
    const hasSixStat = dictionaryCache.sixStat && Object.keys(dictionaryCache.sixStat).length > 0;
    
    if (hasBasic && hasSixStat) {
      // console.log('[OAO] 使用已缓存的字典');
      return {
        basic: dictionaryCache.basic,
        sixStat: dictionaryCache.sixStat,
        roles: dictionaryCache.roles,
        squad: dictionaryCache.squad,
        chemistry: dictionaryCache.chemistry,
        playstyles: dictionaryCache.playstyles,
        futgg: dictionaryCache.futgg,
        futbin: dictionaryCache.futbin,
        easysbc: dictionaryCache.easysbc
      };
    }
    
    if (!builtInDictionariesLoadPromise) {
      builtInDictionariesLoadPromise = (async () => {
        try {
          // console.log('[OAO] 开始加载内置翻译字典');
          // 检查缓存
          const cachedEntry = getStorageValue(BUILT_IN_DICTIONARIES_STORAGE_KEY);
          // console.log('[OAO] 缓存检查结果:', cachedEntry ? '有缓存' : '无缓存');
          
          // 检查是否需要刷新缓存
          const needRefresh = cachedEntry && cachedEntry.timestamp 
            ? shouldRefreshOtherDictionaries(cachedEntry.timestamp) 
            : false;
          
          // 校验缓存是否包含全部关键字典（重点：chemistry 等可能在旧缓存中为空）
          // 若任一关键字典缺失/为空，视为缓存失效，强制走远程拉取，
          // 修复「化学风格/特技等字典因旧缓存为空而不翻译」的问题
          const cachedDictKeys = ['basic', 'sixStat', 'chemistry', 'playstyles', 'roles', 'futgg', 'futbin', 'easysbc'];
          const cachedDataComplete = cachedEntry && cachedEntry.data && cachedDictKeys.every(k =>
            cachedEntry.data[k] && typeof cachedEntry.data[k] === 'object' && Object.keys(cachedEntry.data[k]).length > 0
          );
          if (cachedEntry && !needRefresh && cachedDataComplete) {
            // console.log('[OAO] 使用缓存的字典');
            const data = cachedEntry.data;
            dictionaryCache.basic = data.basic;
            dictionaryCache.sixStat = data.sixStat;
            dictionaryCache.roles = data.roles;
            dictionaryCache.squad = data.squad;
            dictionaryCache.chemistry = data.chemistry;
            dictionaryCache.playstyles = data.playstyles;
            dictionaryCache.futgg = data.futgg;
            dictionaryCache.futbin = data.futbin;
            dictionaryCache.easysbc = data.easysbc;
            dictionaryCache.sixStatLowerMap = buildCaseInsensitiveMap(data.sixStat);
            // console.log('[OAO] 使用缓存的其他分类字典');
            return data;
          }

          // 尝试从远程获取（带备用数据源）
          try {
            // console.log('[OAO] 尝试从远程加载字典');
            const remoteJson = await fetchRemoteJsonWithFallback(BUILT_IN_DICTIONARIES_URLS);
            // console.log('[OAO] 远程加载成功');
            
            // 保存到缓存
            setStorageValue(BUILT_IN_DICTIONARIES_STORAGE_KEY, {
              timestamp: Date.now(),
              data: remoteJson
            });
            
            // 更新缓存日期
            GM_setValue('oao_other_dicts_cache_date', new Date().toDateString());
            
            dictionaryCache.basic = remoteJson.basic;
            dictionaryCache.sixStat = remoteJson.sixStat;
            dictionaryCache.roles = remoteJson.roles;
            dictionaryCache.squad = remoteJson.squad;
            dictionaryCache.chemistry = remoteJson.chemistry;
            dictionaryCache.playstyles = remoteJson.playstyles;
            dictionaryCache.futgg = remoteJson.futgg;
            dictionaryCache.futbin = remoteJson.futbin;
            dictionaryCache.easysbc = remoteJson.easysbc;
            dictionaryCache.sixStatLowerMap = buildCaseInsensitiveMap(remoteJson.sixStat);
            return remoteJson;
          } catch (error) {
            // console.error('[OAO] 远程加载失败，使用空字典:', error);
            // 如果远程加载失败，使用内置默认值
            return setupDefaultBuiltInDictionaries();
          }
        } catch (error) {
          // console.error('[OAO] 加载内置字典出错，使用空字典:', error);
          // 出错时使用内置默认值
          return setupDefaultBuiltInDictionaries();
        } finally {
          builtInDictionariesLoadPromise = null;
        }
      })();
    }
    
    return builtInDictionariesLoadPromise;
  }

  // 加载 SBC 标题翻译字典（来源：miniapp-dictionaries.json 的 sbc 分类）
  // 与内置通用字典分离，独立拉取 + GM 缓存，结构对齐 loadEvolutionsDictionary
  async function loadSbcDictionary() {
    if (dictionaryCache.sbc && Object.keys(dictionaryCache.sbc).length > 0) {
      return dictionaryCache.sbc;
    }
    // 1) 先读 GM 缓存
    try {
      const cachedEntry = getStorageValue(SBC_DICTIONARY_STORAGE_KEY);
      if (cachedEntry && cachedEntry.data && cachedEntry.data.sbc &&
          typeof cachedEntry.data.sbc === 'object' && Object.keys(cachedEntry.data.sbc).length > 0) {
        dictionaryCache.sbc = normalizeTranslationDictionary(cachedEntry.data.sbc);
        return dictionaryCache.sbc;
      }
    } catch (e) { /* 缓存读取失败时静默降级，走远程拉取 */ }

    // 2) 远程拉取（带备用数据源）
    try {
      const remoteJson = await fetchRemoteJsonWithFallback(SBC_DICTIONARY_URLS);
      if (remoteJson && remoteJson.sbc && typeof remoteJson.sbc === 'object') {
        const normalized = normalizeTranslationDictionary(remoteJson.sbc);
        try {
          setStorageValue(SBC_DICTIONARY_STORAGE_KEY, {
            timestamp: Date.now(),
            data: remoteJson
          });
        } catch (e) { /* 缓存写入失败不影响本次翻译 */ }
        dictionaryCache.sbc = normalized;
        return normalized;
      }
    } catch (e) { /* 远程失败静默降级，返回空字典 */ }

    dictionaryCache.sbc = {};
    return {};
  }

  // 归一化单条 PLAYER_REVIEW 值 -> URL 字符串
  // 兼容两种形态：纯字符串 URL / 对象 { webpagedata: url, timestamp }
  function normalizePlayerReviewUrl(val) {
    if (!val) return '';
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'object') {
      const url = val.webpagedata || val.url || '';
      return typeof url === 'string' ? url.trim() : '';
    }
    return '';
  }

  // 归一化单条 PLAYER_REVIEW 值 -> { url, shorten }
  //   url     : 微信文章链接（webpagedata / url / 纯字符串）
  //   shorten : futbin 球员页 id（对应 futbin URL /{ver}/player/{shorten}/{slug}）；
  //             fut.gg 侧仍用字典键（EAID）匹配，shorten 仅用于 futbin 匹配。
  function normalizePlayerReviewEntry(val) {
    if (val == null) return { url: '', shorten: '' };
    if (typeof val === 'string') return { url: val.trim(), shorten: '' };
    if (typeof val === 'object') {
      return {
        url: normalizePlayerReviewUrl(val),
        shorten: val.shorten != null ? String(val.shorten).trim() : ''
      };
    }
    return { url: '', shorten: '' };
  }

  // 加载球员评测字典（来源：miniapp-dictionaries.json 的 PLAYER_REVIEW 分类，键为 EAID）
  // 返回 Map<EAID 字符串, URL 字符串>；与 sbc 共用 SBC_DICTIONARY_STORAGE_KEY 缓存文件
  async function loadPlayerReviewDictionary() {
    if (dictionaryCache.playerReview && dictionaryCache.playerReview.size > 0) {
      return dictionaryCache.playerReview;
    }
    const buildMap = (raw) => {
      const map = new Map();
      if (!raw || typeof raw !== 'object') return map;
      Object.keys(raw).forEach((k) => {
        const entry = normalizePlayerReviewEntry(raw[k]);
        if (entry.url) map.set(String(k).trim(), entry);
      });
      return map;
    };

    // 1) 先读 GM 缓存（与 sbc 同一份 json）
    // ⚠️ 关键：必须做新鲜度(TTL)检查。否则字典一旦被缓存就永不刷新，
    //    Gitee 上新增的 PLAYER_REVIEW 条目（如新球员评测）永远不会生效 —— 用户侧表现为「一直未命中」。
    try {
      const cachedEntry = getStorageValue(SBC_DICTIONARY_STORAGE_KEY);
            if (cachedEntry) {
              }
      // 缓存过期（或缺失 timestamp）→ 跳过缓存，强制远程拉取，保证能拿到新增条目
      const cacheFresh = cachedEntry && typeof cachedEntry.timestamp === 'number'
        && (Date.now() - cachedEntry.timestamp) < THREE_HOURS_MS;
            if (cachedEntry && cacheFresh && cachedEntry.data && cachedEntry.data.PLAYER_REVIEW) {
        const map = buildMap(cachedEntry.data.PLAYER_REVIEW);
                                if (map.size > 0) {
          dictionaryCache.playerReview = map;
          return map;
        }
      }
    } catch (e) {  }

    // 2) 远程拉取（带备用数据源，与 sbc 共用 URL 列表）
    try {
            const remoteJson = await fetchRemoteJsonWithFallback(SBC_DICTIONARY_URLS);
            if (remoteJson && remoteJson.PLAYER_REVIEW && typeof remoteJson.PLAYER_REVIEW === 'object') {
        const map = buildMap(remoteJson.PLAYER_REVIEW);
                try {
          setStorageValue(SBC_DICTIONARY_STORAGE_KEY, {
            timestamp: Date.now(),
            data: remoteJson
          });
        } catch (e) { /* 缓存写入失败不影响本次展示 */ }
        dictionaryCache.playerReview = map;
        return map;
      }
    } catch (e) { /* 远程失败静默降级，返回空 Map */ }

    dictionaryCache.playerReview = new Map();
    return dictionaryCache.playerReview;
  }

  // 按 futbin 球员 id（shorten）查 PLAYER_REVIEW，返回命中条目 { url, shorten }（无则 null）
  // futbin 与 fut.gg 匹配键不同：fut.gg 用字典键(EAID)，futbin 用条目的 shorten 字段。
  function findPlayerReviewByShorten(dict, id) {
    if (!dict || id == null) return null;
    const target = String(id).trim();
    if (!target) return null;
    let found = null;
    dict.forEach((entry) => {
      if (!found && entry && entry.shorten && entry.shorten === target) found = entry;
    });
    return found;
  }

  // 从当前页面提取 EAID（fut.gg 球员页）
  // fut.gg 球员页 URL 有两种形态：
  //     旧：/players/{eaid}-{slug}/                       （旧球员 fut.gg id 即 EAID，如 156321 == Akinfenwa）
  //     新：/players/{futggId}-{slug}/{version}-{eaid}/   （如 /players/241461-ferran-torres/27-50573109/）
  //   → EAID 优先取「末尾 {version}-{eaid} 段」的第二个数字；无此段时回退取球员段首位数字。
  function extractPlayerEaid() {
    try {
      if (window.location.hostname.includes('fut.gg')) {
        const parts = window.location.pathname.split('/').filter(Boolean);
        const pIdx = parts.indexOf('players');
        if (pIdx < 0 || !parts[pIdx + 1]) return null;
        // 优先：末尾 {version}-{eaid} 段（新格式），EAID 为第二段数字
        const seg3 = parts[pIdx + 2];
        if (seg3) {
          const mm = seg3.match(/^(\d+)-(\d+)$/);
          if (mm && mm[2]) return mm[2];
        }
        // 回退：球员段首位数字（旧格式，fut.gg id == EAID）
        const mm2 = parts[pIdx + 1].match(/^(\d+)/);
        if (mm2 && mm2[1]) return mm2[1];
        return null;
      }
    } catch (e) { /* 提取失败静默返回 null */ }
    return null;
  }

  // 从 futbin 球员页 URL 提取 futbin 球员 id（对应字典条目的 shorten 字段）
  //   https://www.futbin.com/27/player/21746/ferran-torres-garcia  ->  21746
  // ⚠️ 注意：futbin URL 里的这个数字**不是** EAID（futbin 自家球员页 id），
  //    所以 futbin 侧不能用 EAID 匹配字典，必须用条目里的 shorten 字段。
  function extractFutbinPlayerId() {
    try {
      if (!window.location.hostname.includes('futbin.com')) return null;
      const m = window.location.pathname.match(/\/\d+\/player\/(\d+)/) ||
                window.location.pathname.match(/\/player\/(\d+)/);
      if (m && m[1]) return m[1];
    } catch (e) { /* 提取失败静默返回 null */ }
    return null;
  }

  // 构建「球员评测」金色按钮卡片（整行 <a>，点击新标签打开微信文章）
  function buildPlayerReviewLink(url) {
    const a = document.createElement('a');
    a.className = 'oao-player-review-link';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:10px',
      'width:100%',
      'box-sizing:border-box',
      'padding:10px 14px',
      'border-radius:8px',
      'border:1px solid rgba(239,159,39,0.45)',
      'background:rgba(239,159,39,0.12)',
      'color:#EF9F27',
      'font-size:14px',
      'font-weight:600',
      'text-decoration:none',
      'cursor:pointer',
      'transition:all 0.2s ease'
    ].join(';');

    // 左侧微信图标徽标
    const badge = document.createElement('span');
    badge.textContent = '评';
    badge.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'width:24px',
      'height:24px',
      'flex:0 0 24px',
      'border-radius:6px',
      'background:#EF9F27',
      'color:#1a1a1a',
      'font-size:13px',
      'font-weight:700'
    ].join(';');

    const text = document.createElement('span');
    text.textContent = '球员评测';
    text.style.cssText = 'flex:1;min-width:0;';

    const arrow = document.createElement('span');
    arrow.textContent = '›';
    arrow.style.cssText = 'flex:0 0 auto;font-size:18px;line-height:1;opacity:0.85;';

    a.appendChild(badge);
    a.appendChild(text);
    a.appendChild(arrow);

    a.addEventListener('mouseenter', () => {
      a.style.background = 'rgba(239,159,39,0.22)';
      a.style.borderColor = 'rgba(239,159,39,0.8)';
    });
    a.addEventListener('mouseleave', () => {
      a.style.background = 'rgba(239,159,39,0.12)';
      a.style.borderColor = 'rgba(239,159,39,0.45)';
    });
    return a;
  }

  // 构建 lucide arrow-up-right 箭头图标（与站点「进化」tab 同款）。
  // stroke=currentColor → 自动继承所在元素文字色；尺寸默认 12。
  function buildArrowUpRightIcon(size) {
    const px = size || 12;
    const NS = 'http://www.w3.org/2000/svg';
    const mk = (t) => {
      try { if (document.createElementNS) return document.createElementNS(NS, t); } catch (e) { /* 回退 */ }
      return document.createElement(t);
    };
    const svg = mk('svg');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('width', String(px));
    svg.setAttribute('height', String(px));
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('class', 'lucide lucide-arrow-up-right');
    svg.setAttribute('aria-hidden', 'true');
    try { svg.style.cssText = 'flex:0 0 auto;display:inline-block;vertical-align:middle;'; } catch (e) { /* 忽略 */ }
    const p1 = mk('path');
    p1.setAttribute('d', 'M7 7h10v10');
    const p2 = mk('path');
    p2.setAttribute('d', 'M7 17 17 7');
    svg.appendChild(p1);
    svg.appendChild(p2);
    return svg;
  }

  // 构建「球员评测」导航标签（fut.gg 顶部横向导航条样式：与其他 tab 一致，金色高亮）
  function buildPlayerReviewTab(url) {
    const a = document.createElement('a');
    a.className = 'oao-player-review-tab font-bold text-xs uppercase border-b-2 shrink-0 flex flex-row gap-2 items-center';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    // 自给自足的显式样式：不依赖站点 CSS，保证一定可见、与相邻 tab 尺寸一致。
    // 金色高亮，区别于其他灰色 tab；hover 时与站点一致的橙色下边框。
    a.style.cssText = [
      'display:flex',
      'flex-direction:row',
      'align-items:center',
      'gap:6px',
      'flex:0 0 auto',
      'padding:8px 10px',
      'color:#EF9F27',
      'border-bottom:2px solid transparent',
      'text-decoration:none',
      'cursor:pointer',
      'transition:all 0.2s ease',
      'white-space:nowrap',
      'visibility:visible',
      'opacity:1'
    ].join(';');

    const text = document.createElement('span');
    text.textContent = '球员评测';
    a.appendChild(text);
    // 尾部箭头：与站点「进化」tab 同款（lucide arrow-up-right）
    a.appendChild(buildArrowUpRightIcon(12));

    a.addEventListener('mouseenter', () => {
      a.style.borderBottomColor = '#EF9F27';
    });
    a.addEventListener('mouseleave', () => {
      a.style.borderBottomColor = 'transparent';
    });
    return a;
  }

  // 构建「球员评测」标签（futbin 球员页 top-bar 标签行样式）
  // 与总览/数据/市场/进化 同一行（沿用站点 top-bar-tab 类保持版式一致），
  // 但文字用金色突出，尾部带同款 arrow-up-right 箭头 —— 与 fut.gg 入口效果保持一致。
  function buildPlayerReviewFutbinTab(url) {
    const a = document.createElement('a');
    a.className = 'oao-player-review-tab top-bar-tab';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'gap:4px',
      // 站点 .top-bar-tab 自带字色 → 用 !important 保证金色突出一定生效
      'color:#EF9F27 !important',
      'font-weight:700 !important',
      'text-decoration:none',
      'cursor:pointer',
      'white-space:nowrap',
      'visibility:visible',
      'opacity:1'
    ].join(';');
    const text = document.createElement('span');
    text.textContent = '球员评测';
    a.appendChild(text);
    a.appendChild(buildArrowUpRightIcon(12));
    return a;
  }

  // 构建「球员评测」浮动按钮（fut.gg 找不到**可见**导航条时的兜底，保证一定看得见）
  // 定位思路与站点内「每周阵型战术推荐」按钮一致：position:fixed 悬浮于视口。
  function buildPlayerReviewFixedButton(url) {
    const a = document.createElement('a');
    a.id = 'oao-player-review-fab';
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.cssText = [
      'position:fixed',
      'top:96px',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2147483646',
      'display:inline-flex',
      'align-items:center',
      'gap:6px',
      'padding:8px 16px',
      'background:linear-gradient(135deg,#EF9F27 0%,#D9861A 100%)',
      'color:#1a1a1a',
      'font-size:12px',
      'font-weight:700',
      'border-radius:6px',
      'text-decoration:none',
      'box-shadow:0 3px 10px rgba(239,159,39,0.45)',
      'white-space:nowrap',
      'cursor:pointer'
    ].join(';');

    const badge = document.createElement('span');
    badge.textContent = '评';
    badge.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;flex:0 0 18px;border-radius:5px;background:#1a1a1a;color:#EF9F27;font-size:12px;font-weight:700;';

    const text = document.createElement('span');
    text.textContent = '球员评测';

    a.appendChild(badge);
    a.appendChild(text);

    a.addEventListener('mouseenter', () => {
      a.style.boxShadow = '0 6px 18px rgba(239,159,39,0.65)';
      a.style.transform = 'translateX(-50%) translateY(-2px)';
    });
    a.addEventListener('mouseleave', () => {
      a.style.boxShadow = '0 3px 10px rgba(239,159,39,0.45)';
      a.style.transform = 'translateX(-50%)';
    });
    return a;
  }

  // futbin 球员页：把「球员评测」标签追加到 top-bar 标签行（总览/数据/市场/进化）末尾
  //   目标容器：div.xs-row.tabs-row（实测为 <div class="xs-row tabs-row max-width-100">）
  //   找不到标签行时退回「卡片下方金色链接」兜底，保证仍能看到入口。
  function injectFutbinReviewTab(url) {
    const pickRow = () => {
      const sels = [
        'div.xs-row.tabs-row',
        'div.tabs-row.max-width-100',
        'div.player-header div.tabs-row',
        'div.tabs-row'
      ];
      for (let i = 0; i < sels.length; i++) {
        try {
          const el = document.querySelector(sels[i]);
          if (el && el.appendChild) return el;
        } catch (e) { /* 忽略无效选择器 */ }
      }
      return null;
    };

    const row = pickRow();
        if (row) {
      row.appendChild(buildPlayerReviewFutbinTab(url));
      return;
    }

    // 兜底：无标签行 -> 退回卡片下方金色链接（老方案）
    const cardWrapper = document.querySelector('.player-header div.player-card-wrapper') ||
                        document.querySelector('div.player-card-wrapper');
    const header = document.querySelector('div.player-header');
    const anchor = document.createElement('div');
    anchor.className = 'oao-player-review-anchor';
    anchor.style.cssText = 'width:100%;margin-top:12px;padding:0 8px;box-sizing:border-box;';
    anchor.appendChild(buildPlayerReviewLink(url));
    if (cardWrapper) {
      const cardSection = cardWrapper.closest('.player-header-card-section') || cardWrapper.parentElement;
      if (cardSection && cardSection.parentElement) {
        cardSection.parentElement.insertBefore(anchor, cardSection.nextSibling);
        return;
      }
    }
    if (header) header.insertBefore(anchor, header.firstChild);
    else document.body.appendChild(anchor);
      }

  // 在球员页注入「球员评测」入口（未命中则完全不显示）
  async function injectPlayerReview() {
    const host = window.location.hostname;
    const isFutbinPlayer = host.includes('futbin.com') && /\/\d+\/player\//.test(window.location.pathname);
    const isFutggPlayer = host.includes('fut.gg') && /\/players\/\d+/.test(window.location.pathname);
        if (!isFutbinPlayer && !isFutggPlayer) {
            return;
    }

    // 已有同页实例则先移除（应对 SPA 路由切换/重复执行）
    document.querySelectorAll('.oao-player-review-anchor').forEach(el => el.remove());
    document.querySelectorAll('.oao-player-review-tab').forEach(el => el.remove());
    try {
      if (window.__oaoReviewTimer) { clearTimeout(window.__oaoReviewTimer); window.__oaoReviewTimer = null; }
      const oldFab = document.getElementById('oao-player-review-fab');
      if (oldFab) oldFab.remove();
    } catch (e) { /* 清理旧定时器/浮动按钮失败忽略 */ }

    // 提取「匹配键」：
    //   futbin -> URL 里的球员 id（对应字典条目的 shorten 字段）
    //   fut.gg  -> EAID（字典键）
    const eaId = isFutbinPlayer ? extractFutbinPlayerId() : extractPlayerEaid();
        if (!eaId) {
            return;
    }

    let dict;
    try {
      dict = await loadPlayerReviewDictionary();
    } catch (e) {
            return;
    }
        if (!dict || !dict.size) {
            return;
    }

    // 查字典（futbin 用 shorten 字段；fut.gg 用 EAID 键）
    let url = '';
    if (isFutbinPlayer) {
      const entry = findPlayerReviewByShorten(dict, eaId);
      url = entry && entry.url ? entry.url : '';
            if (!url) {
        const allShorten = [];
        dict.forEach((en) => { if (en && en.shorten) allShorten.push(en.shorten); });
              }
    } else {
      const entry = dict.get(String(eaId));
      url = entry && entry.url ? entry.url : '';
            if (!url) {
        // 诊断：打印字典键的字符码，排查隐藏空白/全角数字等隐形差异
        const target = String(eaId);
        const codes = (s) => Array.from(s).map(c => c.charCodeAt(0)).join('|');
                Array.from(dict.keys()).forEach((k) => {
          if (k.indexOf(target) >= 0 || target.indexOf(k) >= 0 || k.replace(/\D/g, '') === target) {
                      }
        });
              }
    }
    if (!url) return; // 未命中：不渲染任何元素

    if (isFutbinPlayer) {
      injectFutbinReviewTab(url);
    } else if (isFutggPlayer) {
      // fut.gg：优先把「球员评测」插到顶部横向导航条（总览/追踪/…/FC27评分中心）最后面。
      //
      // ⚠️ 关键坑（2026-10-06 实测定位）：
      //   页面上存在**多个**含 #overview 的容器 / themed-scrollbar 容器，其中夹着「离屏副本」
      //   （实测离屏副本 rect 为 top:-35.6, left:1032，完全不在视口内）。
      //   原实现用 document.querySelector 取「第一个」，正好命中离屏副本 → tab 插进去了却永远看不见。
      //   → 必须**按是否落在视口内**挑选真正可见的那个导航条；一个都挑不到才退化为 fixed 浮动按钮。
      const tab = buildPlayerReviewTab(url);

      const rectVisible = (el) => {
        try {
          if (!el || typeof el.getBoundingClientRect !== 'function') return false;
          const r = el.getBoundingClientRect();
          if (!(r.width > 40 && r.height > 8)) return false;
          const vh = window.innerHeight || 800;
          const vw = window.innerWidth || 1200;
          return r.top > -4 && r.top < vh * 0.95 && r.left < vw - 8 && r.right > 32;
        } catch (e) { return false; }
      };

      // 收集所有候选导航容器，并挑出「真正在视口内」的那个
      const pickNav = () => {
        const candidates = [];
        const isBodyOrHtml = (n) => /^(body|html)$/i.test((n && n.tagName) || '');
        const push = (n) => {
          if (!n || !n.querySelectorAll || candidates.indexOf(n) !== -1) return;
          if (isBodyOrHtml(n)) return; // 别把整页/body 误当导航条
          candidates.push(n);
        };
        Array.from(document.querySelectorAll('a[href="#overview"]')).forEach((a) => {
          let node = a.parentElement;
          for (let i = 0; i < 5 && node && !isBodyOrHtml(node); i++) {
            if (node.querySelectorAll && node.querySelectorAll('a').length >= 3) { push(node); break; }
            node = node.parentElement;
          }
          push(a.parentElement);
        });
        Array.from(document.querySelectorAll('div.themed-scrollbar')).forEach(push);
        const vis = candidates.filter(rectVisible);
        const hasOverview = (n) => { try { return !!n.querySelector('a[href="#overview"]'); } catch (e) { return false; } };
        const isScrollbar = (n) => { try { return !!(n.classList && n.classList.contains('themed-scrollbar')); } catch (e) { return false; } };
        // 优先带 themed-scrollbar 类的可见容器，其次任意可见容器
        const visScroll = vis.filter(isScrollbar);
        const pool = visScroll.length ? visScroll : vis;
        return { total: candidates.length, visible: vis.length, el: (pool.find(hasOverview) || pool[0] || null) };
      };

      const removeFab = () => {
        const f = document.getElementById('oao-player-review-fab');
        if (f) f.remove();
      };
      const addFab = () => {
        if (document.getElementById('oao-player-review-fab')) return;
        document.body.appendChild(buildPlayerReviewFixedButton(url));
              };

      // 把 tab 插进指定容器；只有「插完真的可见」才算成功
      const attach = (container) => {
        if (!container || !document.contains(container)) return false;
        const navTabs = Array.from(container.querySelectorAll('a'))
          .filter(a => a !== tab && !a.classList.contains('oao-player-review-tab'));
        const lastTab = navTabs[navTabs.length - 1];
        if (lastTab && lastTab.nextSibling) container.insertBefore(tab, lastTab.nextSibling);
        else container.appendChild(tab);
        try {
          if (tab.style && typeof tab.style.setProperty === 'function') {
            tab.style.setProperty('display', 'flex', 'important');
            tab.style.setProperty('visibility', 'visible', 'important');
            tab.style.setProperty('opacity', '1', 'important');
          }
          // 横向滚动容器滚到最右，让新 tab 露出。
          // ⚠️ 必须用「瞬时」滚动：behavior:'smooth' 是动画，紧接着测 rect 会还没滚到位 → 误判为不可见。
          container.scrollLeft = container.scrollWidth;
        } catch (e) { /* 忽略 */ }
        const r = (tab.getBoundingClientRect ? tab.getBoundingClientRect() : null);
        const vh = window.innerHeight || 800;
        // tab 可见性判定：只看「纵向是否在视口内 + 尺寸非塌陷」。
        // （横向位置由「已选中的容器本身可见 + 上面已滚到最右」保证，不必再卡 left/right，
        //   否则横向滚动容器里的 tab 会被误判。）
        const ok = !!(r && r.width > 40 && r.height > 8 && r.top > -4 && r.top < vh * 0.95);
                if (!ok) { try { tab.remove(); } catch (e) {} return false; }
        removeFab();
        // 自愈：React 水合/重渲染可能移除注入节点 → 观察容器，移除了就补回（60s 后自动断开）
        try {
          if (window.MutationObserver && !container.__oaoReviewObserver) {
            const obs = new MutationObserver(() => {
              if (!container.contains(tab) && document.contains(container)) {
                try { container.appendChild(tab); } catch (e) {}
              }
            });
            obs.observe(container, { childList: true });
            container.__oaoReviewObserver = obs;
            setTimeout(() => { try { obs.disconnect(); } catch (e) {} }, 60000);
          }
        } catch (e) { /* 忽略 */ }
        return true;
      };

      const first = pickNav();
            if (attach(first.el)) return;

      // 首次没成功：延迟重试若干次（等 React 水合 / SPA 导航把真正的导航条渲染出来），
      // 全部失败才挂 fixed 浮动按钮兜底，避免按钮一闪一闪。
      try { if (window.__oaoReviewTimer) { clearTimeout(window.__oaoReviewTimer); window.__oaoReviewTimer = null; } } catch (e) {}
      let tries = 0;
      const retry = () => {
        window.__oaoReviewTimer = null;
        tries++;
        if (!/\/players\/\d+/.test(window.location.pathname)) { removeFab(); return; }
        if (attach(pickNav().el)) return;
        if (tries >= 6) { addFab(); return; }
        window.__oaoReviewTimer = setTimeout(retry, 1000);
      };
      window.__oaoReviewTimer = setTimeout(retry, 1000);
    }
  }

  // ===== 特技搭配推荐：内置默认数据（P0，远程拉取失败时的兜底）=====
  // 数据来源参考 fodder_client_core.js 的 EA 特技元数据（36 个特技 / 6 大类）。
  // 每个 (位置组 / 角色) 给出推荐的银特技(silver)与金特技(gold)。
  // 管理员可编辑远程 playstyle-recommend.json 覆盖本内置数据（P1）。
  //
  // v2.0 起 categories / silver / gold 统一使用数字 ID（见 PLAYSTYLE_ID_MAP），
  // 引擎在渲染时自动将数字解析回英文名，再查 playstyles 字典取中文。

  // 特技名 ↔ 数字 ID 双向映射（36 个 EA 特技，ID 1~36）
  const PLAYSTYLE_ID_MAP = {
    'Finesse Shot': 1, 'Chip Shot': 2, 'Power Shot': 3, 'Dead Ball': 4,
    'Precision Header': 5, 'Acrobatic': 6, 'Low Driven Shot': 7, 'Gamechanger': 8,
    'Incisive Pass': 9, 'Pinged Pass': 10, 'Long Ball Pass': 11, 'Tiki Taka': 12,
    'Whipped Pass': 13, 'Inventive': 14,
    'Jockey': 15, 'Block': 16, 'Intercept': 17, 'Anticipate': 18,
    'Slide Tackle': 19, 'Aerial Fortress': 20,
    'Technical': 21, 'Rapid': 22, 'First Touch': 23, 'Trickster': 24, 'Press Proven': 25,
    'Quick Step': 26, 'Relentless': 27, 'Long Throw': 28, 'Bruiser': 29, 'Enforcer': 30,
    'Far Throw': 31, 'Footwork': 32, 'Cross Claimer': 33, '1v1 Close Down': 34,
    'Far Reach': 35, 'Deflector': 36
  };
  // 反向映射：ID → 英文名（运行时构建）
  let _playStyleIdReverse = null;
  function getPlayStyleIdReverse() {
    if (!_playStyleIdReverse) {
      _playStyleIdReverse = {};
      Object.keys(PLAYSTYLE_ID_MAP).forEach(k => { _playStyleIdReverse[PLAYSTYLE_ID_MAP[k]] = k; });
    }
    return _playStyleIdReverse;
  }
  // 数字/字符串统一解析为英文名
  function resolvePsId(val) {
    if (typeof val === 'number') { val = String(val); }
    return getPlayStyleIdReverse()[val] || val; // 数字→名字；字符串原样返回（兼容旧格式）
  }
  function resolvePsIds(arr) {
    if (!arr) return [];
    return arr.map(resolvePsId);
  }

  const BUILT_IN_PLAYSTYLE_RECOMMEND = {
    version: '2.0.0',
    // 6 大类 → 该分类下存在的全部特技（数字 ID）
    categories: {
      'Finishing':    [1, 2, 3, 4, 5, 6, 7, 8],
      'Passing':      [9, 10, 11, 12, 13, 14],
      'Defending':    [15, 16, 17, 18, 19, 20],
      'Ball Control': [21, 22, 23, 24, 25],
      'Physical':     [26, 27, 28, 29, 30],
      'Goalkeeping':  [31, 32, 33, 34, 35, 36]
    },
    // 9 个位置组 → 各角色推荐（silver/gold 均为数字 ID 数组）
    // 9 个位置组 → 各角色推荐
    positionGroups: {
      'GK': {
        label: '门将',
        roles: [
          { role: 'GK', roleLabel: '守门员', silver: [31, 32, 33], gold: [35, 34, 36] }
        ]
      },
      'CB': {
        label: '中后卫',
        roles: [
          { role: 'CB', roleLabel: '中后卫', silver: [18, 16, 17, 20, 15], gold: [29, 19] },
          { role: 'BallPlaying', roleLabel: '进攻型后卫', silver: [18, 17, 23, 11], gold: [29, 10] },
          { role: 'Sweeper', roleLabel: '清道夫', silver: [18, 17, 26], gold: [27, 29] }
        ]
      },
      'RB/LB': {
        label: '边后卫',
        roles: [
          { role: 'FullBack', roleLabel: '边后卫', silver: [18, 16, 17, 26], gold: [29, 13] },
          { role: 'WingBack', roleLabel: '边翼卫', silver: [26, 22, 13, 33], gold: [27, 12] },
          { role: 'InvertedWB', roleLabel: '内切型边后卫', silver: [26, 23, 21], gold: [27, 9] }
        ]
      },
      'CDM': {
        label: '后腰',
        roles: [
          { role: 'Holding', roleLabel: '防守型后腰', silver: [18, 17, 16, 15], gold: [29, 10] },
          { role: 'DLP', roleLabel: '拖后组织核心', silver: [9, 10, 17, 23], gold: [12, 18] }
        ]
      },
      'CM': {
        label: '中前卫',
        roles: [
          { role: 'CM', roleLabel: '中前卫', silver: [9, 17, 23], gold: [12, 27] },
          { role: 'B2B', roleLabel: '盒子到盒子', silver: [9, 17, 26, 27], gold: [12, 29] }
        ]
      },
      'CAM': {
        label: '前腰',
        roles: [
          { role: 'Playmaker', roleLabel: '前腰', silver: [9, 23, 21, 1], gold: [12, 2] },
          { role: 'ShadowStriker', roleLabel: '影子前锋', silver: [1, 23, 26, 9], gold: [22, 24] }
        ]
      },
      'RM/LM': {
        label: '边前卫',
        roles: [
          { role: 'WideMid', roleLabel: '边前卫', silver: [13, 26, 33, 9], gold: [12, 27] },
          { role: 'WidePlay', roleLabel: '内切型边前卫', silver: [9, 23, 21], gold: [12, 1] }
        ]
      },
      'RW/LW': {
        label: '边锋',
        roles: [
          { role: 'Winger', roleLabel: '边锋', silver: [26, 22, 13, 1], gold: [24, 2] },
          { role: 'InsideForward', roleLabel: '内切型边锋', silver: [1, 23, 21, 26], gold: [24, 22] }
        ]
      },
      'ST': {
        label: '前锋',
        roles: [
          { role: 'AdvancedForward', roleLabel: '突前前锋', silver: [1, 26, 23], gold: [22, 24] },
          { role: 'Poacher', roleLabel: '偷猎者', silver: [1, 26], gold: [22, 7] },
          { role: 'TargetForward', roleLabel: '目标中锋', silver: [3, 5, 20, 23], gold: [26, 27] },
          { role: 'False9', roleLabel: '假九', silver: [1, 23, 21, 9], gold: [24, 12] }
        ]
      }
    }
  };

  // 模块级缓存
  let playstyleRecommendData = null;
  let playstyleRecommendLoadPromise = null;

  // 加载特技推荐数据：缓存优先 → 远程（多源回退）→ 内置兜底
  async function loadPlaystyleRecommendData() {
    if (playstyleRecommendData) {
      return playstyleRecommendData;
    }
    if (!playstyleRecommendLoadPromise) {
      playstyleRecommendLoadPromise = (async () => {
        try {
          // [调试] 强制刷新：跳过缓存读取并主动删除旧缓存，确保下次直连 gitee 拉取最新
          if (FORCE_REFRESH_PLAYSTYLE_CACHE) {
            try { GM_deleteValue(PLAYSTYLE_RECOMMEND_STORAGE_KEY); } catch (e) {}
            console.log('[OAO] 特技推荐：强制刷新模式已启用，已清除旧缓存，将直接拉取 gitee 最新数据');
          } else {
            const cached = getStorageValue(PLAYSTYLE_RECOMMEND_STORAGE_KEY);
            if (cached && cached.timestamp && (Date.now() - cached.timestamp) < PLAYSTYLE_RECOMMEND_TTL && cached.data && cached.data.positionGroups) {
              playstyleRecommendData = cached.data;
              return playstyleRecommendData;
            }
          }
          try {
            const remote = await fetchRemoteJsonWithFallback(PLAYSTYLE_RECOMMEND_URLS);
            if (remote && remote.positionGroups) {
              setStorageValue(PLAYSTYLE_RECOMMEND_STORAGE_KEY, { timestamp: Date.now(), data: remote });
              playstyleRecommendData = remote;
              return playstyleRecommendData;
            }
          } catch (e) {
            // 远程失败，使用内置数据
          }
          playstyleRecommendData = BUILT_IN_PLAYSTYLE_RECOMMEND;
          return playstyleRecommendData;
        } finally {
          playstyleRecommendLoadPromise = null;
        }
      })();
    }
    return playstyleRecommendLoadPromise;
  }

  // ===== 推荐引擎 =====
  function getRecommendData() {
    return playstyleRecommendData || BUILT_IN_PLAYSTYLE_RECOMMEND;
  }
  // 特技中文名（优先用 dictionaryCache.playstyles 字典，缺失时用内置兜底映射，再缺失才回退英文 key）
  // 内置兜底映射覆盖全部 36 个 EA 特技，消除弹窗打开时字典未加载导致的英文闪现。
  const PS_CN_FALLBACK = {
    'Finesse Shot': '精准射门', 'Chip Shot': '吊射', 'Power Shot': '大力射门',
    'Dead Ball': '死球', 'Precision Header': '精准头球', 'Acrobatic': '杂耍',
    'Low Driven Shot': '躺射', 'Gamechanger': '大力低射',
    'Incisive Pass': '切入传球', 'Pinged Pass': '大力传球',
    'Long Ball Pass': '远距离传球', 'Tiki Taka': 'Tiki-Taka',
    'Whipped Pass': '快速传球', 'Inventive': '别出心裁',
    'Jockey': '跟防', 'Block': '封堵', 'Intercept': '拦截',
    'Anticipate': '预判', 'Slide Tackle': '滑铲', 'Aerial Fortress': '空中堡垒',
    'Technical': '技术', 'Rapid': '灵活跑动', 'First Touch': '第一脚触球',
    'Trickster': '诡术师', 'Press Proven': '紧逼好手',
    'Quick Step': '健步如飞', 'Relentless': '坚持不懈',
    'Long Throw': '远距离界外球', 'Bruiser': '斗士', 'Enforcer': '执行者',
    'Far Throw': '远距离掷球', 'Footwork': '步法', 'Cross Claimer': '传中没收者',
    '1v1 Close Down': '1对1紧逼', 'Far Reach': '远距离出击', 'Deflector': '偏转'
  };
  function getPlaystyleCn(name) {
    const d = dictionaryCache.playstyles;
    if (d && d[name] && d[name].webpagedata) {
      return d[name].webpagedata;
    }
    return PS_CN_FALLBACK[name] || name;
  }
  // 6 大类 → 该分类下全部特技（自动解析数字 ID 为英文名）
  function getRecommendCategories() {
    const raw = getRecommendData().categories || {};
    const resolved = {};
    Object.keys(raw).forEach(cat => { resolved[cat] = resolvePsIds(raw[cat]); });
    return resolved;
  }
  // 9 个位置组
  function getPositionGroups() {
    return getRecommendData().positionGroups || {};
  }
  // 给定 (位置组, 角色) → 推荐银特技 / 金特技（自动解析数字 ID）
  function getPlaystyleRecommend(positionGroup, roleKey) {
    const groups = getPositionGroups();
    const g = groups[positionGroup];
    if (!g || !g.roles) { return { silver: [], gold: [] }; }
    const role = g.roles.find(r => r.role === roleKey);
    if (!role) { return { silver: [], gold: [] }; }
    return {
      silver: resolvePsIds(Array.isArray(role.silver) ? role.silver : []),
      gold: resolvePsIds(Array.isArray(role.gold) ? role.gold : [])
    };
  }
  // 分类英文 → 中文标签
  function getCategoryCn(cat) {
    const m = {
      'Finishing': '射门', 'Passing': '传球', 'Defending': '防守',
      'Ball Control': '控球', 'Physical': '体格', 'Goalkeeping': '门将'
    };
    return m[cat] || cat;
  }

  // ===== 特技图标渲染（三色：灰=存在不推荐 / 白=银特技 / 金=金特技）=====
  // 若远程 JSON 提供 glyphMap 且页面已加载 UltimateTeam-Icons 字体，则渲染原版 EA 字形；
  // 否则回退为带中文名的三色色块（全站可靠、无外部依赖）。
  // clickable=true 时，点击循环：none → silver → gold → none（参考 fodder 交互）
  function renderPlaystyleIcon(name, state, clickable) {
    const el = document.createElement('div');
    el.className = 'oao-ps-icon oao-ps-state-' + (state || 'none') + (clickable ? ' oao-clickable' : '');
    el.dataset.psName = name;
    const data = getRecommendData();
    const glyphMap = (data && data.glyphMap) || {};
    const glyph = glyphMap[name];
    const cn = getPlaystyleCn(name);
    const tag = state === 'gold' ? '（金特技）' : (state === 'silver' ? '（银特技）' : '');
    if (glyph && typeof document.fonts !== 'undefined' && document.fonts.check && document.fonts.check('16px UltimateTeam-Icons')) {
      el.classList.add('oao-ps-glyph');
      el.textContent = glyph;
      el.title = cn + tag;
    } else {
      el.textContent = cn;
      el.title = name + tag;
    }
    if (clickable) {
      el.addEventListener('click', () => {
        // 循环：none → silver → gold → none
        const cur = oaoPsCustomSelections[name] || 'none';
        const next = cur === 'none' ? 'silver' : (cur === 'silver' ? 'gold' : 'none');
        oaoPsCustomSelections[name] = next;
        // 只更新当前芯片的样式，不重绘整个网格（性能更好）
        el.className = 'oao-ps-icon oao-ps-state-' + next + ' oao-clickable';
        const newTag = next === 'gold' ? '（金特技）' : (next === 'silver' ? '（银特技）' : '');
        el.title = (cn || name) + newTag;
      });
    }
    return el;
  }

  // ===== 特技搭配推荐 Modal =====
  let oaoPsModal = null;
  let oaoPsPosSel = null;
  let oaoPsRoleSel = null;
  let oaoPsGrid = null;
  let oaoPsRecommendBtn = null;
  let oaoPsCustomBtn = null;
  // 自定义模式状态
  let oaoPsCustomMode = false;            // false=推荐模式 / true=自定义模式
  let oaoPsCustomSelections = {};         // { playstyleName: 'none'|'silver'|'gold' }

  function oaoRenderGrid(silverSet, goldSet) {
    if (!oaoPsGrid) return;
    oaoPsGrid.innerHTML = '';
    const cats = getRecommendCategories();
    const clickable = oaoPsCustomMode;
    Object.keys(cats).forEach(cat => {
      const row = document.createElement('div');
      row.className = 'oao-ps-catrow';
      const label = document.createElement('div');
      label.className = 'oao-ps-catlabel';
      label.textContent = getCategoryCn(cat);
      row.appendChild(label);
      const chips = document.createElement('div');
      chips.className = 'oao-ps-chips';
      cats[cat].forEach(name => {
        let state = 'none';
        // 自定义模式优先使用自定义选择
        if (clickable && oaoPsCustomSelections.hasOwnProperty(name)) {
          state = oaoPsCustomSelections[name];
        } else if (goldSet && goldSet.indexOf(name) > -1) {
          state = 'gold';
        } else if (silverSet && silverSet.indexOf(name) > -1) {
          state = 'silver';
        }
        chips.appendChild(renderPlaystyleIcon(name, state, clickable));
      });
      row.appendChild(chips);
      oaoPsGrid.appendChild(row);
    });
  }

  function oaoPopulateRoles() {
    if (!oaoPsPosSel || !oaoPsRoleSel) return;
    const pos = oaoPsPosSel.value;
    const groups = getPositionGroups();
    const g = groups[pos] || { roles: [] };
    oaoPsRoleSel.innerHTML = '';
    (g.roles || []).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.role;
      opt.textContent = r.roleLabel;
      oaoPsRoleSel.appendChild(opt);
    });
  }

  function oaoApplyRecommend() {
    if (!oaoPsPosSel || !oaoPsRoleSel) return;
    // 切换到推荐模式
    if (oaoPsCustomMode) {
      oaoPsCustomMode = false;
      oaoPsCustomSelections = {};
      if (oaoPsRecommendBtn) { oaoPsRecommendBtn.classList.add('oao-active'); }
      if (oaoPsCustomBtn) { oaoPsCustomBtn.classList.remove('oao-active'); }
    }
    const rec = getPlaystyleRecommend(oaoPsPosSel.value, oaoPsRoleSel.value);
    oaoRenderGrid(rec.silver, rec.gold);
  }

  // 自定义模式：清空推荐，玩家自行点击特技点亮（循环：灰→银→金→灰）
  function oaoToggleCustomMode() {
    if (!oaoPsPosSel || !oaoPsRoleSel) return;
    // 切换到自定义模式
    oaoPsCustomMode = true;
    oaoPsCustomSelections = {};   // 清空所有选择，从全灰开始
    if (oaoPsCustomBtn) { oaoPsCustomBtn.classList.add('oao-active'); }
    if (oaoPsRecommendBtn) { oaoPsRecommendBtn.classList.remove('oao-active'); }
    oaoRenderGrid([], []);
  }

  function buildPlaystyleModal() {
    const overlay = document.createElement('div');
    overlay.className = 'oao-ps-overlay';
    overlay.innerHTML =
      '<div class="oao-ps-modal">' +
        '<div class="oao-ps-header">' +
          '<span class="oao-ps-title">特技搭配推荐</span>' +
          '<button class="oao-ps-close" title="关闭">✕</button>' +
        '</div>' +
        '<div class="oao-ps-toolbar">' +
          '<label class="oao-ps-field">位置<select class="oao-ps-pos"></select></label>' +
          '<label class="oao-ps-field">角色<select class="oao-ps-role"></select></label>' +
          '<button class="oao-ps-recommend oao-active">★ 推荐</button>' +
          '<button class="oao-ps-custom">✎ 自定义</button>' +
        '</div>' +
        '<div class="oao-ps-grid"></div>' +
        '<div class="oao-ps-footer">' +
          '<div class="oao-ps-footer-item"><span class="oao-ps-footer-dot oao-ps-footer-rec">★</span><b>推荐</b>：欧啊欧推荐的特技搭配方案，<span class="oao-ps-footer-silver">白色</span>是比赛风格（银特技），<span class="oao-ps-footer-gold">金色</span>是比赛风格+（金特技）</div>' +
          '<div class="oao-ps-footer-item"><span class="oao-ps-footer-dot oao-ps-footer-cus">✎</span><b>自定义</b>：可自行创建特技搭配，点击1次变<span class="oao-ps-footer-silver">白色</span>比赛风格（银特技），点击2次变<span class="oao-ps-footer-gold">金色</span>比赛风格+（金特技），点击3次取消</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    oaoPsModal = overlay;
    oaoPsPosSel = overlay.querySelector('.oao-ps-pos');
    oaoPsRoleSel = overlay.querySelector('.oao-ps-role');
    oaoPsGrid = overlay.querySelector('.oao-ps-grid');
    oaoPsRecommendBtn = overlay.querySelector('.oao-ps-recommend');
    oaoPsCustomBtn = overlay.querySelector('.oao-ps-custom');

    const groups = getPositionGroups();
    Object.keys(groups).forEach(pos => {
      const opt = document.createElement('option');
      opt.value = pos;
      opt.textContent = groups[pos].label || pos;
      oaoPsPosSel.appendChild(opt);
    });
    oaoPopulateRoles();

    oaoPsPosSel.addEventListener('change', () => { oaoPopulateRoles(); if (oaoPsCustomMode) { oaoToggleCustomMode(); } else { oaoApplyRecommend(); } });
    oaoPsRoleSel.addEventListener('change', () => { if (oaoPsCustomMode) { oaoToggleCustomMode(); } else { oaoApplyRecommend(); } });
    oaoPsRecommendBtn.addEventListener('click', oaoApplyRecommend);
    oaoPsCustomBtn.addEventListener('click', oaoToggleCustomMode);
    overlay.querySelector('.oao-ps-close').addEventListener('click', () => { overlay.style.display = 'none'; });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.style.display = 'none'; });

    // 初始状态：推荐模式
    oaoPsCustomMode = false;
    oaoPsCustomSelections = {};
    oaoApplyRecommend();
  }

  function openPlaystyleRecommendModal() {
    // 已有弹窗：直接显示
    if (oaoPsModal) {
      oaoPsModal.style.display = 'flex';
      oaoApplyRecommend();
      return;
    }
    // 无论数据是否就绪，立即用内置数据创建弹窗（避免等待网络请求导致延迟）
    buildPlaystyleModal();
    // 后台静默加载远程数据，加载完成后自动刷新网格
    loadPlaystyleRecommendData()
      .then(() => { if (!dictionaryCache.playstyles) { return loadBuiltInDictionaries(); } })
      .then(() => { if (oaoPsModal) { oaoApplyRecommend(); } })
      .catch(() => {}); // 远程失败时保持内置数据不变
  }

  // 设置默认的内置翻译字典（备用）
  function setupDefaultBuiltInDictionaries() {
    const defaultDicts = {
      basic: {},
      sixStat: {},
      roles: {},
      squad: {},
      chemistry: {},
      playstyles: {},
      futgg: {},
      futbin: {},
      easysbc: {}
    };
    
    dictionaryCache.basic = defaultDicts.basic;
    dictionaryCache.sixStat = defaultDicts.sixStat;
    dictionaryCache.roles = defaultDicts.roles;
    dictionaryCache.squad = defaultDicts.squad;
    dictionaryCache.chemistry = defaultDicts.chemistry;
    dictionaryCache.playstyles = defaultDicts.playstyles;
    dictionaryCache.futgg = defaultDicts.futgg;
    dictionaryCache.futbin = defaultDicts.futbin;
    dictionaryCache.easysbc = defaultDicts.easysbc;
    dictionaryCache.sixStatLowerMap = buildCaseInsensitiveMap(defaultDicts.sixStat);

    return defaultDicts;
  }

  // 反向查找辅助函数 - 封装中文检测和反向查找逻辑
  // 参数:
  //   dict - 要查找的字典对象
  //   pageText - 页面文本
  //   platformId - 平台ID（如futgg_id, futbin_id, easysbc_id），可选
  //   idFieldName - ID字段名称（如'futgg_id', 'futbin_id', 'easysbc_id'）
  //   options - 配置选项
  // 返回: 匹配结果对象 {key, translation, source} 或 null
  function reverseLookupEvolution(dict, pageText, platformId, idFieldName, options) {
    if (!dict || !pageText) return null;
    options = options || {}; // 防御：调用方未传 options 时避免 options.useShortenTerms 抛错

    const containsChinese = /[\u4e00-\u9fa5]/.test(pageText);
    if (!containsChinese) {
      return null;
    }
    
    let pageTranslationValue = pageText;
    const sourcePrefixMatch = pageText.match(/^【[^】]+】(.+)$/);
    if (sourcePrefixMatch) {
      pageTranslationValue = sourcePrefixMatch[1].trim();
    }
    
    for (const key in dict) {
      if (dict.hasOwnProperty(key)) {
        const dictValue = dict[key];
        let translation;
        let source;
        
        if (platformId) {
          if (Array.isArray(dictValue)) {
            const matchedItem = dictValue.find(item => typeof item === 'object' && !item[idFieldName]);
            if (!matchedItem) continue;
            translation = getTranslationValue(matchedItem, options.useShortenTerms, key);
            source = matchedItem.source;
          } else if (typeof dictValue === 'object' && dictValue[idFieldName]) {
            continue;
          } else {
            translation = getTranslationValue(dictValue, options.useShortenTerms, key);
            source = getSourceValue(dictValue);
          }
        } else {
          translation = getTranslationValue(dictValue, options.useShortenTerms, key);
          source = getSourceValue(dictValue);
        }
        
        if (translation === pageTranslationValue) {
          return { key: stripEvoSuffix(key), translation, source };
        }
        
        if (translation && pageTranslationValue) {
          const translationBase = translation.replace(/\+$/, '');
          const pageBase = pageTranslationValue.replace(/\+$/, '');
          if (translationBase === pageBase) {
            return { key: stripEvoSuffix(key), translation, source };
          }
        }
      }
    }
    
    return null;
  }

  // 确保所有字典加载完成
  async function ensureDictionaries() {
    // console.log('[OAO] ensureDictionaries 开始');
    // console.log('[OAO] 当前 dictionaryCache 状态:', {
    //   basic: dictionaryCache.basic ? (Object.keys(dictionaryCache.basic).length > 0 ? Object.keys(dictionaryCache.basic).length + ' 条' : '空对象') : '未加载',
    //   sixStat: dictionaryCache.sixStat ? (Object.keys(dictionaryCache.sixStat).length > 0 ? Object.keys(dictionaryCache.sixStat).length + ' 条' : '空对象') : '未加载',
    //   evolutions: dictionaryCache.evolutions ? (Object.keys(dictionaryCache.evolutions).length > 0 ? Object.keys(dictionaryCache.evolutions).length + ' 条' : '空对象') : '未加载'
    // });
    
    if (!dictionaryCache.evolutions || Object.keys(dictionaryCache.evolutions).length === 0) {
      // console.log('[OAO] 加载进化字典');
      await loadEvolutionsDictionary();
    }
    
    // 检查是否需要加载内置字典（不存在或为空对象）
    // 注意：必须校验全部关键字典（含 chemistry/playstyles/roles/futgg/futbin），
    // 否则旧缓存中这些字典为空时不会触发重载，导致化学风格/特技等不翻译
    const needLoadBuiltIn = !dictionaryCache.basic || !dictionaryCache.sixStat || !dictionaryCache.easysbc ||
                           !dictionaryCache.chemistry || !dictionaryCache.playstyles || !dictionaryCache.roles ||
                           !dictionaryCache.futgg || !dictionaryCache.futbin ||
                           Object.keys(dictionaryCache.basic).length === 0 || 
                           Object.keys(dictionaryCache.sixStat).length === 0 ||
                           Object.keys(dictionaryCache.easysbc).length === 0 ||
                           Object.keys(dictionaryCache.chemistry).length === 0 ||
                           Object.keys(dictionaryCache.playstyles).length === 0 ||
                           Object.keys(dictionaryCache.roles).length === 0 ||
                           Object.keys(dictionaryCache.futgg).length === 0 ||
                           Object.keys(dictionaryCache.futbin).length === 0;
    
    if (needLoadBuiltIn) {
      // console.log('[OAO] 加载内置翻译字典');
      await loadBuiltInDictionaries();
    }

    // 加载 SBC 标题翻译字典（miniapp-dictionaries.json 的 sbc 分类）
    if (!dictionaryCache.sbc || Object.keys(dictionaryCache.sbc).length === 0) {
      await loadSbcDictionary();
    }

    // 加载球员评测字典（同一 json 的 PLAYER_REVIEW 分类，键为 EAID）
    if (!dictionaryCache.playerReview || dictionaryCache.playerReview.size === 0) {
      await loadPlayerReviewDictionary();
    }

    // 合并自定义翻译到字典缓存 - 使用深拷贝避免修改原始缓存
    const mergedDictionaries = JSON.parse(JSON.stringify(dictionaryCache));

    // 确保sixStatLowerMap存在，用于大小写不敏感查找
    if (!mergedDictionaries.sixStatLowerMap) {
      mergedDictionaries.sixStatLowerMap = buildCaseInsensitiveMap(mergedDictionaries.sixStat);
    }

    // 确保customTranslations存在且是对象
    if (customTranslations && typeof customTranslations === 'object') {
      for (const [category, translations] of Object.entries(customTranslations)) {
        if (translations && typeof translations === 'object') {
          if (!mergedDictionaries[category]) {
            mergedDictionaries[category] = {};
          }
          for (const [key, value] of Object.entries(translations)) {
            // 获取原始值（可能是对象或数组）
            const originalValue = mergedDictionaries[category][key];
            let originalSource = '';
            let originalFutbinId = '';
            let originalFutggId = '';
            let originalEasysbcId = '';
            let originalTimestamp = '';
            
            // 处理数组格式
            if (Array.isArray(originalValue)) {
              if (originalValue.length > 0) {
                const firstItem = originalValue[0];
                if (firstItem && typeof firstItem === 'object') {
                  originalSource = firstItem.source || '';
                  originalFutbinId = firstItem.futbin_id || '';
                  originalFutggId = firstItem.futgg_id || '';
                  originalEasysbcId = firstItem.easysbc_id || '';
                  originalTimestamp = firstItem.timestamp || '';
                }
              }
            } else if (originalValue && typeof originalValue === 'object') {
              originalSource = originalValue.source || '';
              originalFutbinId = originalValue.futbin_id || '';
              originalFutggId = originalValue.futgg_id || '';
              originalEasysbcId = originalValue.easysbc_id || '';
              originalTimestamp = originalValue.timestamp || '';
            }
            
            // 如果原始值是数组，保留数组格式，更新第一个条目
            if (Array.isArray(originalValue)) {
              if (originalValue.length > 0) {
                originalValue[0] = {
                  webpagedata: value,
                  shorten: value,
                  source: originalSource,
                  futbin_id: originalFutbinId,
                  futgg_id: originalFutggId,
                  easysbc_id: originalEasysbcId,
                  timestamp: originalTimestamp
                };
              }
            } else {
              // 覆盖默认翻译，保留source字段（仅对evolutions分类）
              mergedDictionaries[category][key] = {
                webpagedata: value,
                shorten: value,
                source: originalSource,
                futbin_id: originalFutbinId,
                futgg_id: originalFutggId,
                easysbc_id: originalEasysbcId,
                timestamp: originalTimestamp
              };
            }
          }
        }
      }
    }
    
    return mergedDictionaries;
  }

  // 检查元素是否在翻译管理弹窗内
  function isInTranslationModal(element) {
    return element.closest('.oaevo-translation-modal') !== null;
  }

  // 统一的元素查询和翻译函数，避免多个翻译器重复查询DOM
  function translateWithDictionaries(elements, dictionaries, options) {
    if (!elements || !dictionaries || dictionaries.length === 0) return;
    
    elements.forEach(element => {
      // 跳过已翻译的元素
      if (element.dataset.oaoTranslated === 'true') {
        return;
      }
      
      // 跳过侧边栏按钮
      if (element.classList.contains('oaevo-sidebar-btn')) {
        return;
      }
      
      // 跳过翻译管理弹窗内的元素
      if (isInTranslationModal(element)) {
        return;
      }
      
      // 获取直接文本内容（不包括子元素）
      const directText = Array.from(element.childNodes)
        .filter(child => child.nodeType === Node.TEXT_NODE)
        .map(child => child.textContent.trim())
        .join(' ')
        .trim();
      
      if (!directText) {
        return;
      }
      
      const textUpper = directText.toUpperCase();
      
      // 在所有字典中查找翻译
      for (const dict of dictionaries) {
        if (!dict) continue;
        
        if (dict[directText]) {
          const translation = getTranslationValue(dict[directText], options.useShortenTerms, directText);
          // 只更新文本节点，保留其他子元素（如 FUTGG evo-lab 角色后面的 SVG +号图标），避免破坏页面结构
          let textIndex = 0;
          element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
              if (textIndex === 0) {
                child.textContent = translation;
              } else {
                child.textContent = '';
              }
              textIndex++;
            }
          });
          element.dataset.oaoTranslated = 'true';
          break;
        }
        
        if (dict[textUpper]) {
          const translation = getTranslationValue(dict[textUpper], options.useShortenTerms, textUpper);
          // 只更新文本节点，保留其他子元素（如 FUTGG evo-lab 角色后面的 SVG +号图标），避免破坏页面结构
          let textIndex = 0;
          element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
              if (textIndex === 0) {
                child.textContent = translation;
              } else {
                child.textContent = '';
              }
              textIndex++;
            }
          });
          element.dataset.oaoTranslated = 'true';
          break;
        }
      }
    });
  }

  // 基础信息翻译器
  const baseInfoTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 优化选择器，只选择可能包含文本的元素
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label, th, td');
      elements.forEach(element => {
        // 跳过已翻译的元素或已被进化翻译器处理的元素，避免重复翻译
        if (element.dataset.oaoTranslated === 'true' || element.dataset.oaoFutggEvoProcessed === 'true') {
          return;
        }
        
        // 跳过侧边栏按钮，避免翻译按钮文字
        if (element.classList.contains('oaevo-sidebar-btn')) {
          return;
        }
        
        // 跳过翻译管理弹窗内的元素
        if (isInTranslationModal(element)) {
          return;
        }

        // 跳过 EASYSBC evolutions 页面的特殊 HTML 格式元素
        // 这些元素由 easysbcTranslator 专门处理
        const isEasysbcPage = window.location.hostname.includes('easysbc.io');
        if (isEasysbcPage) {
          // 检查是否是 evolutions/players 页面的进化元素
          const closestEvoItem = element.closest('div.bg-evolution.h-6');
          if (closestEvoItem) {
            return;
          }
          // 检查是否是 evolutions/builder/*** 页面的进化元素
          const closestBuilderItem = element.closest('div.bg-evolution.box-border');
          if (closestBuilderItem) {
            return;
          }
          // 检查是否是 evolutions/overview/*** 页面的进化名称元素
          const closestOverviewA = element.closest('a');
          if (closestOverviewA && closestOverviewA.getAttribute('href') && closestOverviewA.getAttribute('href').includes('/evolutions/overview/')) {
            return;
          }
        }

        // 处理单个文本节点的情况
        if (element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE) {
          const text = element.textContent.trim();
          const textUpper = text.toUpperCase();
          
          if (dictionary[text] || dictionary[textUpper]) {
            const key = dictionary[text] ? text : textUpper;
            const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
            element.textContent = options.showOriginalWithBrackets ? `${translation} (${text})` : translation;
            // 标记为已翻译，避免重复翻译
            element.dataset.oaoTranslated = 'true';
          }
        }
        // 处理带有 SVG 图标的元素
        else {
          // 检查是否包含进化相关的子元素，跳过父元素避免重复翻译
          const hasEvolutionBadge = Array.from(element.children).some(child => 
            child.classList.contains('evolution-badge') || child.classList.contains('evo-box-req')
          );
          if (hasEvolutionBadge) {
            return;
          }
          
          const textNodes = [];
          element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
              textNodes.push(child.textContent.trim());
            }
          });
          const text = textNodes.join(' ').trim();
          const textUpper = text.toUpperCase();
          if (text && (dictionary[text] || dictionary[textUpper])) {
            const key = dictionary[text] ? text : textUpper;
            const dictValue = dictionary[key];
            const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
            let textIndex = 0;
            element.childNodes.forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                if (textIndex === 0) {
                  child.textContent = translation;
                } else {
                  child.textContent = '';
                }
                textIndex++;
              }
            });
            // 标记为已翻译，避免重复翻译
            element.dataset.oaoTranslated = 'true';
          }
        }
      });
    }
  };

  // 角色翻译器
  const roleTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 优化选择器，只选择可能包含文本的元素
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label, th, td');
      elements.forEach(element => {
        // 跳过已翻译的元素或已被进化翻译器处理的元素，避免重复翻译
        if (element.dataset.oaoTranslated === 'true' || element.dataset.oaoFutggEvoProcessed === 'true') {
          return;
        }
        
        // 跳过侧边栏按钮，避免翻译按钮文字
        if (element.classList.contains('oaevo-sidebar-btn')) {
          return;
        }
        
        // 跳过翻译管理弹窗内的元素
        if (isInTranslationModal(element)) {
          return;
        }
        
        // 处理单个文本节点的情况
        if (element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE) {
          const text = element.textContent.trim();
          let key = text;
          let suffix = '';
          // 处理带有 + 符号的角色名称
          const plusMatch = text.match(/\+*$/);
          if (plusMatch) {
            suffix = plusMatch[0];
            const baseKey = text.slice(0, -suffix.length);
            const baseKeyUpper = baseKey.toUpperCase();
            if (dictionary[baseKey] || dictionary[baseKeyUpper]) {
              key = dictionary[baseKey] ? baseKey : baseKeyUpper;
            }
          } else {
            const textUpper = text.toUpperCase();
            if (dictionary[textUpper] && !dictionary[text]) {
              key = textUpper;
            }
          }
          if (dictionary[key]) {
            const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
            const finalTranslation = translation + suffix;
            element.textContent = options.showOriginalWithBrackets ? `${finalTranslation} (${text})` : finalTranslation;
            // 标记为已翻译，避免重复翻译
            element.dataset.oaoTranslated = 'true';
          }
        }
        // 处理角色名称和 + 符号在不同元素中的情况
        else if (element.tagName === 'A' && element.classList.contains('positive-color')) {
          const textNodes = [];
          let suffix = '';
          
          // 收集所有文本节点和 + 符号
          element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
              textNodes.push(child.textContent.trim());
            } else if (child.tagName === 'DIV') {
              const divText = child.textContent.trim();
              if (divText.match(/^\++$/)) {
                suffix = divText;
              }
            }
          });
          
          const roleName = textNodes.join(' ').trim();
          const roleNameUpper = roleName.toUpperCase();
          let key = roleName;
          if (dictionary[roleNameUpper] && !dictionary[roleName]) {
            key = roleNameUpper;
          }
          if (roleName && dictionary[key]) {
            const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
            const finalTranslation = translation + suffix;
            
            // 替换所有文本节点内容
            let textIndex = 0;
            element.childNodes.forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                if (textIndex === 0) {
                  child.textContent = finalTranslation;
                } else {
                  child.textContent = '';
                }
                textIndex++;
              } else if (child.tagName === 'DIV' && child.textContent.trim().match(/^\++$/)) {
                child.remove();
              }
            });
            // 标记为已翻译，避免重复翻译
            element.dataset.oaoTranslated = 'true';
          }
        }
        // 处理 Fut.gg 页面中的角色名称（第一种结构）
        else if (element.classList.contains('text-lightest-gray') && element.classList.contains('font-bold')) {
          // 检查是否包含 chemistry 图标元素，如果是则跳过翻译
          const chemistryIcon = element.querySelector('.font-chemistry');
          if (chemistryIcon) {
            return; // 跳过包含 chemistry 图标的角色翻译
          }
          
          const spanElement = element.querySelector('span');
          if (spanElement) {
            // 收集所有文本节点和 + 符号
            const textNodes = [];
            let suffix = '';
            
            spanElement.childNodes.forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                textNodes.push(child.textContent.trim());
              } else if (child.tagName === 'SPAN' && child.classList.contains('text-green')) {
                const greenText = child.textContent.trim();
                if (greenText.match(/^\++$/)) {
                  suffix = greenText;
                }
              }
            });
            
            const roleName = textNodes.join(' ').trim();
            if (roleName && dictionary[roleName]) {
              const translation = options.useShortenTerms ? dictionary[roleName].shorten : dictionary[roleName].webpagedata;
              const finalTranslation = translation + suffix;
              
              // 替换所有文本节点内容
              let textIndex = 0;
              spanElement.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                  if (textIndex === 0) {
                    child.textContent = finalTranslation;
                  } else {
                    child.textContent = '';
                  }
                  textIndex++;
                } else if (child.tagName === 'SPAN' && child.classList.contains('text-green') && child.textContent.trim().match(/^\++$/)) {
                  child.remove();
                }
              });
              // 标记为已翻译，避免重复翻译
              element.dataset.oaoTranslated = 'true';
            }
          }
        }
        // 处理 Fut.gg 页面中的角色名称（第二种结构）
        else if (element.classList.contains('text-sm') && element.classList.contains('text-lightest-gray') && element.classList.contains('font-bold')) {
          // 收集所有文本节点和 + 符号
          const textNodes = [];
          let suffix = '';
          
          element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
              textNodes.push(child.textContent.trim());
            } else if (child.tagName === 'SPAN' && child.classList.contains('text-green')) {
              const greenText = child.textContent.trim();
              if (greenText.match(/^\++$/)) {
                suffix = greenText;
              }
            }
          });
          
          const roleName = textNodes.join(' ').trim();
          const roleNameUpper = roleName.toUpperCase();
          let key = roleName;
          if (dictionary[roleNameUpper] && !dictionary[roleName]) {
            key = roleNameUpper;
          }
          if (roleName && dictionary[key]) {
            const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
            const finalTranslation = translation + suffix;
            
            // 替换所有文本节点内容
            let textIndex = 0;
            element.childNodes.forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                if (textIndex === 0) {
                  child.textContent = finalTranslation;
                } else {
                  child.textContent = '';
                }
                textIndex++;
              } else if (child.tagName === 'SPAN' && child.classList.contains('text-green') && child.textContent.trim().match(/^\++$/)) {
                child.remove();
              }
            });
            // 标记为已翻译，避免重复翻译
            element.dataset.oaoTranslated = 'true';
          }
        }
      });
    }
  };

  // 阵容翻译器
  const squadTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 优化选择器，只选择可能包含文本的元素
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label, th, td');
      elements.forEach(element => {
        // 跳过已翻译的元素或已被进化翻译器处理的元素，避免重复翻译
        if (element.dataset.oaoTranslated === 'true' || element.dataset.oaoFutggEvoProcessed === 'true') {
          return;
        }
        
        // 跳过侧边栏按钮，避免翻译按钮文字
        if (element.classList.contains('oaevo-sidebar-btn')) {
          return;
        }
        
        // 跳过翻译管理弹窗内的元素
        if (isInTranslationModal(element)) {
          return;
        }
        
        if (element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE) {
          const text = element.textContent.trim();
          const textUpper = text.toUpperCase();
          if (dictionary[text] || dictionary[textUpper]) {
            const key = dictionary[text] ? text : textUpper;
            const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
            element.textContent = options.showOriginalWithBrackets ? `${translation} (${text})` : translation;
            // 标记为已翻译，避免重复翻译
            element.dataset.oaoTranslated = 'true';
          }
        }
      });
    }
  };

  // 进化翻译器
  const evolutionsTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 检查是否是Futbin页面
      const isFutbinPage = window.location.hostname.includes('futbin.com');
      
      // 检查是否是 futbin player/evolution 页面
      const isFutbinPlayerEvolutionPage = isFutbinPage && window.location.href.includes('/player/') && window.location.href.includes('/evolution');
      
      // 如果是 futbin player/evolution 页面，跳过处理，避免破坏页面结构
      if (isFutbinPlayerEvolutionPage) {
        return;
      }
      
      const elements = root.querySelectorAll('*');
      elements.forEach(element => {
        // 跳过已翻译的元素或已被进化翻译器处理的元素
        if (element.dataset.oaoTranslated === 'true' || element.dataset.oaoFutggEvoProcessed === 'true') {
          return;
        }
        
        // 跳过侧边栏按钮，避免翻译按钮文字
        if (element.classList.contains('oaevo-sidebar-btn')) {
          return;
        }
        
        // 跳过翻译管理弹窗内的元素
        if (isInTranslationModal(element)) {
          return;
        }
        
        // 跳过 futbin evo-box-req 内的元素，这些应该使用通用翻译器处理
        if (isFutbinPage && element.closest('div.evo-box-req')) {
          return;
        }
        
        // 跳过包含复杂子结构的元素（如包含链接、图片等的卡片）
        // 只处理纯文本节点或简单的文本包装元素
        const hasComplexChildren = element.querySelector('a, img, svg, button, input, .fc-card-container');
        if (hasComplexChildren) {
          // 对于包含复杂子元素的元素，只遍历其直接文本节点
          let hasTranslated = false;
          element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
              const text = child.textContent.trim();
              if (text) {
                const normalizedText = text.replace(/&amp;/g, '&');
                const normalizedTextUpper = normalizedText.toUpperCase();
            if (dictionary[normalizedText] || dictionary[normalizedTextUpper]) {
              const key = dictionary[normalizedText] ? normalizedText : normalizedTextUpper;
              let dictValue = dictionary[key];
              if (Array.isArray(dictValue)) {
                dictValue = dictValue[0];
              }
              const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
                  // 根据进化格式设置决定显示方式
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      child.textContent = `${translation || normalizedText} (${normalizedText})`;
                      break;
                    case 1: // 来源中文
                      child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || key}`;
                      break;
                    case 2: // 英文
                      child.textContent = normalizedText;
                      break;
                    case 3: // 【来源】中文（英文）
                      child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || normalizedText} (${normalizedText})`;
                      break;
                  }
                  hasTranslated = true;
                }
                // 处理带后缀的进化名称，如 "Dribble Mastery - Season 5 Lvl 8"
                else if (normalizedText.includes(' - Season')) {
                  const baseName = normalizedText.split(' - Season')[0].trim();
                  const baseNameUpper = baseName.toUpperCase();
                  if (dictionary[baseName] || dictionary[baseNameUpper]) {
                    const key = dictionary[baseName] ? baseName : baseNameUpper;
                    let dictValue = dictionary[key];
                    if (Array.isArray(dictValue)) {
                      dictValue = dictValue[0];
                    }
                    const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
                    const suffix = normalizedText.substring(normalizedText.indexOf(' - Season'));
                    // 根据进化格式设置决定显示方式
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        child.textContent = `${translation || baseName} (${baseName})${suffix}`;
                        break;
                      case 1: // 来源中文
                        child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || baseName}${suffix}`;
                        break;
                      case 2: // 英文
                        child.textContent = normalizedText;
                        break;
                      case 3: // 【来源】中文（英文）
                        child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || baseName} (${baseName})${suffix}`;
                        break;
                    }
                    hasTranslated = true;
                  }
                }
              }
            }
            // 在Futbin页面，处理子元素，确保它们也被正确翻译
            else if (isFutbinPage && child.nodeType === Node.ELEMENT_NODE) {
              const childText = child.textContent.trim();
              if (childText) {
                const normalizedChildText = childText.replace(/&amp;/g, '&');
                const normalizedChildTextUpper = normalizedChildText.toUpperCase();
                if (dictionary[normalizedChildText] || dictionary[normalizedChildTextUpper]) {
                  const key = dictionary[normalizedChildText] ? normalizedChildText : normalizedChildTextUpper;
                  let dictValue = dictionary[key];
                  if (Array.isArray(dictValue)) {
                    dictValue = dictValue[0];
                  }
                  const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
                  // 根据进化格式设置决定显示方式
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      child.textContent = `${translation || normalizedChildText} (${normalizedChildText})`;
                      break;
                    case 1: // 来源中文
                      child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || key}`;
                      break;
                    case 2: // 英文
                      child.textContent = normalizedChildText;
                      break;
                    case 3: // 【来源】中文（英文）
                      child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || normalizedChildText} (${normalizedChildText})`;
                      break;
                  }
                  hasTranslated = true;
                }
                // 处理带后缀的进化名称，如 "Dribble Mastery - Season 5 Lvl 8"
                else if (normalizedChildText.includes(' - Season')) {
                  const baseName = normalizedChildText.split(' - Season')[0].trim();
                  const baseNameUpper = baseName.toUpperCase();
                  if (dictionary[baseName] || dictionary[baseNameUpper]) {
                    const key = dictionary[baseName] ? baseName : baseNameUpper;
                    let dictValue = dictionary[key];
                    if (Array.isArray(dictValue)) {
                      dictValue = dictValue[0];
                    }
                    const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
                    const suffix = normalizedChildText.substring(normalizedChildText.indexOf(' - Season'));
                    // 根据进化格式设置决定显示方式
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        child.textContent = `${translation || baseName} (${baseName})${suffix}`;
                        break;
                      case 1: // 来源中文
                        child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || key}${suffix}`;
                        break;
                      case 2: // 英文
                          child.textContent = normalizedChildText;
                          break;
                        case 3: // 【来源】中文（英文）
                          child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || normalizedChildText} (${normalizedChildText})`;
                          break;
                        }
                    hasTranslated = true;
                  }
                }
                // 处理子元素的文本节点
                else {
                  child.childNodes.forEach(grandChild => {
                    if (grandChild.nodeType === Node.TEXT_NODE) {
                      const grandChildText = grandChild.textContent.trim();
                      if (grandChildText) {
                        const normalizedGrandChildText = grandChildText.replace(/&amp;/g, '&');
                        const normalizedGrandChildTextUpper = normalizedGrandChildText.toUpperCase();
                        if (dictionary[normalizedGrandChildText] || dictionary[normalizedGrandChildTextUpper]) {
                          const key = dictionary[normalizedGrandChildText] ? normalizedGrandChildText : normalizedGrandChildTextUpper;
                          let dictValue = dictionary[key];
                          if (Array.isArray(dictValue)) {
                            dictValue = dictValue[0];
                          }
                          const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
                          // 根据进化格式设置决定显示方式
                          switch (evolutionFormat) {
                            case 0: // 中文（英文）
                              grandChild.textContent = `${translation || normalizedGrandChildText} (${normalizedGrandChildText})`;
                              break;
                            case 1: // 来源中文
                              grandChild.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || key}`;
                              break;
                            case 2: // 英文
                              grandChild.textContent = normalizedGrandChildText;
                              break;
                            case 3: // 【来源】中文（英文）
                              grandChild.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || normalizedGrandChildText} (${normalizedGrandChildText})`;
                              break;
                            }
                          hasTranslated = true;
                        }
                      }
                    }
                  });
                }
              }
              // 标记子元素为已翻译，避免重复处理
              child.dataset.oaoTranslated = 'true';
            }
          });
          if (hasTranslated) {
            element.dataset.oaoTranslated = 'true';
          }
          return;
        }
        
        // 尝试直接文本节点匹配（元素只有一个文本子节点）
        if (element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE) {
          const text = element.textContent.trim();
          // 处理HTML实体，将&amp;转换为&
          const normalizedText = text.replace(/&amp;/g, '&');
          const normalizedTextUpper = normalizedText.toUpperCase();
          if (dictionary[normalizedText] || dictionary[normalizedTextUpper]) {
            const key = dictionary[normalizedText] ? normalizedText : normalizedTextUpper;
            let dictValue = dictionary[key];
            if (Array.isArray(dictValue)) {
              dictValue = dictValue[0];
            }
            const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
            // 根据进化格式设置决定显示方式
            switch (evolutionFormat) {
              case 0: // 中文（英文）
                element.textContent = `${translation || normalizedText} (${normalizedText})`;
                break;
              case 1: // 来源中文
                element.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || key}`;
                break;
              case 2: // 英文
                element.textContent = normalizedText;
                break;
              case 3: // 【来源】中文（英文）
                element.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || normalizedText} (${normalizedText})`;
                break;
            }
            element.dataset.oaoTranslated = 'true';
          }
          // 处理带后缀的进化名称，如 "Dribble Mastery - Season 5 Lvl 8"
          else if (normalizedText.includes(' - Season')) {
            const baseName = normalizedText.split(' - Season')[0].trim();
            const baseNameUpper = baseName.toUpperCase();
            if (dictionary[baseName] || dictionary[baseNameUpper]) {
              const key = dictionary[baseName] ? baseName : baseNameUpper;
              let dictValue = dictionary[key];
              if (Array.isArray(dictValue)) {
                dictValue = dictValue[0];
              }
              const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
              const suffix = normalizedText.substring(normalizedText.indexOf(' - Season'));
              // 根据进化格式设置决定显示方式
              switch (evolutionFormat) {
                case 0: // 中文（英文）
                  element.textContent = `${translation || baseName} (${baseName})${suffix}`;
                  break;
                case 1: // 来源中文
                  element.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || baseName}`;
                  break;
                case 2: // 英文
                  element.textContent = normalizedText;
                  break;
                case 3: // 【来源】中文（英文）
                  element.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || baseName} (${baseName})${suffix}`;
                  break;
              }
              element.dataset.oaoTranslated = 'true';
            }
          }
        }
        // 尝试提取完整文本内容匹配（处理复杂DOM结构）
        else {
          const fullText = element.textContent.trim();
          if (fullText) {
            // 处理HTML实体，将&amp;转换为&
            const normalizedFullText = fullText.replace(/&amp;/g, '&');
            // 检查完整文本是否在字典中
            const normalizedFullTextUpper = normalizedFullText.toUpperCase();
            if (dictionary[normalizedFullText] || dictionary[normalizedFullTextUpper]) {
              const key = dictionary[normalizedFullText] ? normalizedFullText : normalizedFullTextUpper;
              let dictValue = dictionary[key];
              if (Array.isArray(dictValue)) {
                dictValue = dictValue[0];
              }
              const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
              // 替换所有文本节点内容
              let firstTextNodeFound = false;
              element.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                  if (!firstTextNodeFound) {
                    // 根据进化格式设置决定显示方式
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        child.textContent = `${translation || normalizedFullText} (${normalizedFullText})`;
                        break;
                      case 1: // 来源中文
                        child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || key}`;
                        break;
                      case 2: // 英文
                        child.textContent = normalizedFullText;
                        break;
                      case 3: // 【来源】中文（英文）
                        child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || normalizedFullText} (${normalizedFullText})`;
                        break;
                    }
                    firstTextNodeFound = true;
                  } else {
                    child.textContent = '';
                  }
                }
                // 在Futbin页面，清空子元素内容，避免重复翻译
                else if (isFutbinPage && child.nodeType === Node.ELEMENT_NODE) {
                  child.textContent = '';
                  child.dataset.oaoTranslated = 'true';
                }
              });
              element.dataset.oaoTranslated = 'true';
            }
            // 检查子元素的文本内容是否在字典中（只处理纯文本子元素，避免破坏HTML结构）
            else {
              let hasTranslated = false;
              element.childNodes.forEach(child => {
                // 处理文本节点
                if (child.nodeType === Node.TEXT_NODE) {
                  const childText = child.textContent.trim();
                  if (childText) {
                    // 处理HTML实体，将&amp;转换为&
                    const normalizedChildText = childText.replace(/&amp;/g, '&');
                    const normalizedChildTextUpper = normalizedChildText.toUpperCase();
                    if (dictionary[normalizedChildText] || dictionary[normalizedChildTextUpper]) {
                      const key = dictionary[normalizedChildText] ? normalizedChildText : normalizedChildTextUpper;
                      let dictValue = dictionary[key];
                      if (Array.isArray(dictValue)) {
                        dictValue = dictValue[0];
                      }
                      const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
                      // 根据进化格式设置决定显示方式
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          child.textContent = `${translation || normalizedChildText} (${normalizedChildText})`;
                          break;
                        case 1: // 来源中文
                          child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || key}`;
                          break;
                        case 2: // 英文
                          child.textContent = normalizedChildText;
                          break;
                        case 3: // 【来源】中文（英文）
                          child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || normalizedChildText} (${normalizedChildText})`;
                          break;
                      }
                      hasTranslated = true;
                    }
                    // 处理带后缀的进化名称，如 "Dribble Mastery - Season 5 Lvl 8"
                    else if (normalizedChildText.includes(' - Season')) {
                      const baseName = normalizedChildText.split(' - Season')[0].trim();
                      const baseNameUpper = baseName.toUpperCase();
                      if (dictionary[baseName] || dictionary[baseNameUpper]) {
                        const key = dictionary[baseName] ? baseName : baseNameUpper;
                        let dictValue = dictionary[key];
                        if (Array.isArray(dictValue)) {
                          dictValue = dictValue[0];
                        }
                        const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
                        const suffix = normalizedChildText.substring(normalizedChildText.indexOf(' - Season'));
                        // 根据进化格式设置决定显示方式
                        switch (evolutionFormat) {
                          case 0: // 中文（英文）
                            child.textContent = `${translation || baseName} (${baseName})${suffix}`;
                            break;
                          case 1: // 来源中文
                            child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || baseName}${suffix}`;
                            break;
                          case 2: // 英文
                            child.textContent = normalizedChildText;
                            break;
                          case 3: // 【来源】中文（英文）
                            child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || baseName} (${baseName})${suffix}`;
                            break;
                        }
                        hasTranslated = true;
                      }
                    }
                  }
                }
                // 只处理元素节点，且该元素只包含纯文本（没有子元素）
                else if (child.nodeType === Node.ELEMENT_NODE && child.children.length === 0) {
                  const childText = child.textContent.trim();
                  // 处理HTML实体，将&amp;转换为&
                  const normalizedChildText = childText.replace(/&amp;/g, '&');
                  const normalizedChildTextUpper = normalizedChildText.toUpperCase();
                  if (normalizedChildText && (dictionary[normalizedChildText] || dictionary[normalizedChildTextUpper])) {
                    const key = dictionary[normalizedChildText] ? normalizedChildText : normalizedChildTextUpper;
                    let dictValue = dictionary[key];
                    if (Array.isArray(dictValue)) {
                      dictValue = dictValue[0];
                    }
                    const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
                    // 根据进化格式设置决定显示方式
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        child.textContent = `${translation || normalizedChildText} (${normalizedChildText})`;
                        break;
                      case 1: // 来源中文
                        child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || key}`;
                        break;
                      case 2: // 英文
                          child.textContent = normalizedChildText;
                          break;
                        case 3: // 【来源】中文（英文）
                          child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || normalizedChildText} (${normalizedChildText})`;
                          break;
                        }
                    hasTranslated = true;
                  }
                  // 处理带后缀的进化名称，如 "Dribble Mastery - Season 5 Lvl 8"
                  else if (normalizedChildText && normalizedChildText.includes(' - Season')) {
                    const baseName = normalizedChildText.split(' - Season')[0].trim();
                    const baseNameUpper = baseName.toUpperCase();
                    if (dictionary[baseName] || dictionary[baseNameUpper]) {
                      const key = dictionary[baseName] ? baseName : baseNameUpper;
                      let dictValue = dictionary[key];
                      if (Array.isArray(dictValue)) {
                        dictValue = dictValue[0];
                      }
                      const translation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
                      const suffix = normalizedChildText.substring(normalizedChildText.indexOf(' - Season'));
                      // 根据进化格式设置决定显示方式
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          child.textContent = `${translation || baseName} (${baseName})${suffix}`;
                          break;
                        case 1: // 来源中文
                          child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || key}${suffix}`;
                          break;
                        case 2: // 英文
                          child.textContent = normalizedChildText;
                          break;
                        case 3: // 【来源】中文（英文）
                          child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || normalizedChildText} (${normalizedChildText})`;
                          break;
                      }
                      hasTranslated = true;
                    }
                  }
                }
                // 在Futbin页面，处理其他子元素
                else if (isFutbinPage && child.nodeType === Node.ELEMENT_NODE) {
                  const childText = child.textContent.trim();
                  if (childText) {
                    const normalizedChildText = childText.replace(/&amp;/g, '&');
                    const normalizedChildTextUpper = normalizedChildText.toUpperCase();
                    if (dictionary[normalizedChildText] || dictionary[normalizedChildTextUpper]) {
                      const key = dictionary[normalizedChildText] ? normalizedChildText : normalizedChildTextUpper;
                      let dictValue = dictionary[key];
                      if (Array.isArray(dictValue)) {
                        dictValue = dictValue[0];
                      }
                      const childTranslation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
                      // 根据进化格式设置决定显示方式
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          child.textContent = `${childTranslation} (${normalizedChildText})`;
                          break;
                        case 1: // 来源中文
                          child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${childTranslation}`;
                          break;
                        case 2: // 英文
                          child.textContent = normalizedChildText;
                          break;
                        case 3: // 【来源】中文（英文）
                          child.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${childTranslation || normalizedChildText} (${normalizedChildText})`;
                          break;
                      }
                      hasTranslated = true;
                    }
                    // 处理子元素的文本节点
                    else {
                      let grandChildTranslated = false;
                      child.childNodes.forEach(grandChild => {
                        if (grandChild.nodeType === Node.TEXT_NODE) {
                          const grandChildText = grandChild.textContent.trim();
                          if (grandChildText) {
                            const normalizedGrandChildText = grandChildText.replace(/&amp;/g, '&');
                            const normalizedGrandChildTextUpper = normalizedGrandChildText.toUpperCase();
                            if (dictionary[normalizedGrandChildText] || dictionary[normalizedGrandChildTextUpper]) {
                              const key = dictionary[normalizedGrandChildText] ? normalizedGrandChildText : normalizedGrandChildTextUpper;
                              let dictValue = dictionary[key];
                              if (Array.isArray(dictValue)) {
                                dictValue = dictValue[0];
                              }
                              const grandChildTranslation = options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata;
                              // 根据进化格式设置决定显示方式
                              switch (evolutionFormat) {
                                case 0: // 中文（英文）
                                  grandChild.textContent = `${grandChildTranslation} (${normalizedGrandChildText})`;
                                  break;
                                case 1: // 来源中文
                                  grandChild.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${grandChildTranslation}`;
                                  break;
                                case 2: // 英文
                                  grandChild.textContent = normalizedGrandChildText;
                                  break;
                                case 3: // 【来源】中文（英文）
                                  grandChild.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${grandChildTranslation || normalizedGrandChildText} (${normalizedGrandChildText})`;
                                  break;
                              }
                              hasTranslated = true;
                              grandChildTranslated = true;
                            }
                          }
                        }
                      });
                      // 如果孙子节点被翻译了，清空其他孙子节点
                      if (grandChildTranslated) {
                        child.childNodes.forEach(grandChild => {
                          if (grandChild.nodeType === Node.ELEMENT_NODE) {
                            grandChild.textContent = '';
                            grandChild.dataset.oaoTranslated = 'true';
                          }
                        });
                      }
                    }
                  }
                  // 标记子元素为已翻译，避免重复处理
                  child.dataset.oaoTranslated = 'true';
                }
              });
              if (hasTranslated) {
                element.dataset.oaoTranslated = 'true';
              }
            }
          }
        }
      });
    },
    isTargetPage: function() {
      const url = window.location.href;
      return (url.includes('evolutions') || url.includes('/evolution')) && !url.includes('/gg-club/my/evolutions/');
    }
  };

  // Fut.gg进化翻译器
  const futggEvolutionsTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 检查是否是进化页面
      const isFutggEvolutionsPage = 
        window.location.hostname.includes('fut.gg') && 
        (window.location.href.includes('evo-lab/evolutions') || 
         window.location.href.includes('/evolutions') || 
         window.location.href.includes('evo-lab/evolve') ||
         window.location.pathname === '/evo-lab' || 
         window.location.pathname === '/evo-lab/' ||
         window.location.href.includes('/evo-lab/your-upgrades'));
      
      // 优化选择器，只选择可能包含文本的元素
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label');
      elements.forEach(element => {
        // 跳过已翻译的元素或已被进化翻译器处理的元素
        if (element.dataset.oaoTranslated === 'true' || element.dataset.oaoFutggEvoProcessed === 'true') {
          return;
        }

        // 跳过球员特技元素：特技 span 在菱形容器（div.relative.table 含金色菱形 SVG）内
        // 球员特技只应由 playstyles 字典翻译，不读取进化字典，不应用进化格式
        // 这里只标记 oaoTranslated 跳过，不标记 oaoPlaystyleProcessed，
        // 让后续 futggTranslator 的特技专用块在 FUTGG翻译开时仍能正确翻译为中文
        if (element.classList && element.classList.contains('overflow-hidden')) {
          const traitContainer = element.closest('div.relative.table');
          if (traitContainer && traitContainer.querySelector('svg[viewBox="0 0 256 256"]')) {
            element.dataset.oaoTranslated = 'true';
            return;
          }
        }

        // 跳过侧边栏按钮，避免翻译按钮文字
        if (element.classList.contains('oaevo-sidebar-btn')) {
          return;
        }

        // 跳过翻译管理弹窗内的元素
        if (isInTranslationModal(element)) {
          return;
        }

        if (element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE) {
          const text = element.textContent.trim();
          const textUpper = text.toUpperCase();
          if (dictionary[text] || dictionary[textUpper]) {
            const key = dictionary[text] ? text : textUpper;
            const dictValue = dictionary[key];
            // 处理数组格式和对象格式的字典值
            const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
            const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
            const source = getSourceValue(selectedEntry);
            // 根据进化格式设置决定显示方式
            switch (evolutionFormat) {
              case 0: // 中文（英文）
                element.textContent = `${translation || key} (${key})`;
                break;
              case 1: // 来源中文
                element.textContent = `${source ? '【' + source + '】' : ''}${translation || key}`;
                break;
              case 2: // 英文
                element.textContent = key;
                break;
              case 3: // 【来源】中文（英文）
                element.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})`;
                break;
            }
            // 标记为已翻译
            element.dataset.oaoTranslated = 'true';
          }
        }
      });
    },
    isTargetPage: function() {
      return window.location.href.includes('evo-lab') || window.location.href.includes('/gg-club/my/evolutions/');
    }
  };

  // Fut.gg翻译器
  const futggTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 合并所有字典
      // 进化字典优先于主字典，用于同名进化区分
      const allDictionaries = [];
      if (options && options.extraDictionaries) {
        allDictionaries.push(...options.extraDictionaries);
      }
      allDictionaries.push(dictionary);
      
      // 检查是否是 evo-lab/evolutions 页面
      const isEvolutionsPage = window.location.href.includes('evo-lab/evolutions');
      const isFutggEvolutionsPage = window.location.href === 'https://www.fut.gg/evolutions/' ||
                                     (window.location.href.includes('fut.gg/evolutions') && !window.location.href.includes('/evo-lab/'));
      const isFutggEvolvePage = window.location.href.includes('/evo-lab/evolve');
      const isFutggEvolutionsLabPage = window.location.href.includes('/evo-lab/evolutions');
      // evo-lab 主页面（含抽屉弹出的 drawer-title）：/evo-lab/ 和 /evo-lab/evolve/ 都需要处理
      const isFutggEvoLabPage = window.location.pathname === '/evo-lab' ||
                                 window.location.pathname === '/evo-lab/' ||
                                 isFutggEvolvePage;
      const isFutggPlayerEvolutionsPage = window.location.href.includes('/players/') && window.location.href.includes('/evolutions/');
      const isFutggYourUpgradesPage = window.location.href.includes('/evo-lab/your-upgrades');
      const isFutggGgClubEvolutionsPage = window.location.href.includes('/gg-club/my/evolutions/');

      // 针对 futgg players/*** 球员详情页的 "Item version"（卡面版本）分组按钮进行翻译
      // 结构：<div role="group" aria-label="Item version"> <button><span>Standard</span></button> <button><span>Holographic</span></button> </div>
      // 这些按钮文本（Standard/Holographic）不在通用字典中，且按钮自身无直接文本节点会被通用循环标记 processed 而不翻内部 span，故需专门处理
      if (window.location.href.includes('/players/')) {
        const itemVersionGroups = root.querySelectorAll('div[role="group"][aria-label="Item version"]');
        itemVersionGroups.forEach(group => {
          // 翻译 group 的无障碍 aria-label（仅翻译一次）
          if (group.getAttribute('aria-label') === 'Item version' && !group.dataset.oaoItemVersionLabelProcessed) {
            group.setAttribute('aria-label', '卡面版本');
            group.dataset.oaoItemVersionLabelProcessed = 'true';
          }
          const itemVersionButtons = group.querySelectorAll('button');
          itemVersionButtons.forEach(btn => {
            const span = btn.querySelector('span');
            if (!span) return;
            const text = span.textContent.trim();
            if (!text) return;
            // 纯英文模式（evolutionFormat===2）下保持原始英文不翻译
            if (evolutionFormat === 2) {
              btn.dataset.oaoTranslated = 'true';
              span.dataset.oaoTranslated = 'true';
              return;
            }
            const itemVersionTranslations = {
              'Standard': '标准',
              'Holographic': '全息'
            };
            if (itemVersionTranslations[text]) {
              span.textContent = itemVersionTranslations[text];
            }
            btn.dataset.oaoTranslated = 'true';
            span.dataset.oaoTranslated = 'true';
          });
        });
      }

      // 针对 futgg gg-club/my/evolutions/ 页面的特定 HTML 格式进行特殊处理（在通用翻译之前执行）
      // 该格式为：<div class="flex flex-row items-center justify-between border-b border-gray p-4">
      //         包含 <div class="flex flex-row items-center gap-2 text-evo">
      //           包含 <h2 class="text-sm font-bold leading-none">文本</h2>
      if (isFutggGgClubEvolutionsPage) {
        const evoItems = root.querySelectorAll('div.flex.flex-row.items-center.justify-between.border-b.border-gray.p-4');
        evoItems.forEach(item => {
          const textContainer = item.querySelector('div.flex.flex-row.items-center.gap-2.text-evo');
          if (textContainer) {
            const h2 = textContainer.querySelector('h2.text-sm.font-bold.leading-none');
            if (h2) {
              const text = h2.textContent.trim();
              // 检查是否需要翻译：要么没有处理过标记，要么是纯英文（没有中文）
              const needsTranslation = !h2.dataset.oaoFutggEvoProcessed || 
                (!text.includes('的') && !text.includes('版') && /^(\d|[A-Za-z])/.test(text));
              if (needsTranslation && text) {
                // 在英语格式下，不做任何处理，直接保留原英文
                if (evolutionFormat === 2) {
                  h2.dataset.oaoFutggEvoProcessed = 'true';
                  h2.dataset.oaoTranslated = 'true';
                  return;
                }
                // 匹配后缀模式 - 支持各种括号内的内容
                const suffixMatch = text.match(/\s*\[[^\]]+\]$/);
                let baseText = text;
                let suffix = '';
                if (suffixMatch) {
                  baseText = text.replace(suffixMatch[0], '').trim();
                  suffix = suffixMatch[0];
                }
                const baseTextUpper = baseText.toUpperCase();
                let translated = false;
                // 首先在进化字典中查找
                if (options.evolutionDictionary) {
                  const evoKey = findEvolutionKey(options.evolutionDictionary, baseText, suffix);
                  if (evoKey) {
                    const key = evoKey;
                    const dictValue = options.evolutionDictionary[key];
                    const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
                    const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                    const source = getSourceValue(selectedEntry);
                    // 按照进化格式显示
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        h2.textContent = `${translation || key} (${key})${suffix}`;
                        break;
                      case 1: // 来源中文
                        h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                        break;
                      case 2: // 英文 - 保持原始英文，不翻译
                        h2.textContent = key + suffix;
                        break;
                      case 3: // 【来源】中文（英文）
                        h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                        break;
                    }
                    translated = true;
                  }
                }
                // 如果进化字典中没找到，在所有字典中查找
                if (!translated) {
                  for (const dict of allDictionaries) {
                    // 正向查找：baseText 作为 key
                    if (dict[baseText] || dict[baseTextUpper]) {
                      const key = dict[baseText] ? baseText : baseTextUpper;
                      const dictValue = dict[key];
                      const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                      const source = getSourceValue(dictValue);
                      // 按照进化格式显示
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          h2.textContent = `${translation || key} (${key})${suffix}`;
                          break;
                        case 1: // 来源中文
                          h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                          break;
                        case 2: // 英文 - 保持原始英文，不翻译
                          h2.textContent = key + suffix;
                          break;
                        case 3: // 【来源】中文（英文）
                          h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                          break;
                      }
                      translated = true;
                      break;
                    }
                    // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                    if (!translated && (evolutionFormat === 0 || evolutionFormat === 2 || evolutionFormat === 3)) {
                      const reverseResult = reverseLookupEvolution(dict, baseText, null, null, options);
                      if (reverseResult) {
                        // console.log(`[OAO][同名ID追踪][FUTGG] 反向查找匹配成功 | 页面文本:${baseText} | 英文key:${reverseResult.key}`);
                        switch (evolutionFormat) {
                          case 0: // 中文（英文）
                            h2.textContent = `${reverseResult.translation} (${reverseResult.key})${suffix}`;
                            break;
                          case 1: // 来源中文
                            h2.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}${suffix}`;
                            break;
                          case 2: // 英文
                            h2.textContent = reverseResult.key + suffix;
                            break;
                          case 3: // 【来源】中文（英文）
                            h2.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})${suffix}`;
                            break;
                        }
                        translated = true;
                      }
                    }
                    if (translated) break;
                  }
                }
                // 标记为已处理，避免重复处理
                h2.dataset.oaoFutggEvoProcessed = 'true';
                h2.dataset.oaoTranslated = 'true';
              }
            }
          }
        });
      }

      // 针对 futgg evolutions 页面的特定 HTML 格式进行特殊处理
      // 该格式为：<div class="bg-gray-900 rounded ..."> 包含 <h2 class="font-bold">文本</h2>
      // 只处理尚未处理的元素
      if (isFutggEvolutionsPage) {
        const evoFilterWrappers = root.querySelectorAll('.bg-gray-900.rounded');
        evoFilterWrappers.forEach(wrapper => {
          const h2 = wrapper.querySelector('h2.font-bold');
          if (h2 && !h2.dataset.oaoFutggEvoProcessed) {
            let text = h2.textContent.trim();
            if (text) {
              // 匹配后缀模式 - 支持各种括号内的内容
              const suffixMatch = text.match(/\s*\[[^\]]+\]$/);
              let baseText = text;
              let suffix = '';
              if (suffixMatch) {
                baseText = text.replace(suffixMatch[0], '').trim();
                suffix = suffixMatch[0];
              }
              // 从卡片链接提取 futgg_id（兜底：closest('a') 失败时向上遍历祖先容器内的 <a>）
              let futggId = extractFutggEvoId(wrapper);
              
              const baseTextUpper = baseText.toUpperCase();
              let translated = false;
              
              // 优先在进化字典中按 futgg_id 精确匹配
              if (futggId && options.evolutionDictionary) {
                const found = findEvolutionById(options.evolutionDictionary, futggId, 'futgg_id');
                if (found) {
                  const dictValue = found.entry;
                  // console.log(`[OAO][同名ID追踪][FUTGG] 按ID匹配成功(进化字典) | 页面ID:${futggId} | 英文名称:${found.key} | 条目:`, dictValue);
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, found.key);
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      h2.textContent = `${translation || found.key} (${found.key})${suffix}`;
                      break;
                    case 1: // 来源中文
                      h2.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || found.key}${suffix}`;
                      break;
                    case 2: // 英文
                      h2.textContent = found.key + suffix;
                      break;
                    case 3: // 【来源】中文（英文）
                      h2.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || found.key} (${found.key})${suffix}`;
                      break;
                  }
                  translated = true;
                } else {
                  // console.log(`[OAO][同名ID追踪][FUTGG] 按ID未找到匹配(进化字典) | 页面ID:${futggId} | 页面文本:${baseText} | 进入名称匹配阶段`);
                }
              }
              
              // 如果按ID没找到，按名称在进化字典中查找（优先匹配没有配置 futgg_id 的通用条目）
              if (!translated && options.evolutionDictionary) {
                const evoKey = findEvolutionKey(options.evolutionDictionary, baseText, suffix);
                if (evoKey) {
                  const key = evoKey;
                  const dictValue = options.evolutionDictionary[key];
                  
                  // 如果页面元素有 futgg_id，名称匹配时只匹配没有配置 futgg_id 的条目
                  if (futggId) {
                    if (Array.isArray(dictValue)) {
                      // 打印数组中所有条目的ID信息，方便调试
                      const allIds = dictValue.map(item => {
                        if (item && typeof item === 'object') {
                          return item.futgg_id || '(无ID-通用)';
                        }
                        return '(简单值)';
                      }).join(', ');
                      // console.log(`[OAO][同名ID追踪][FUTGG] 名称匹配-数组格式(进化字典) | 页面ID:${futggId} | 英文名称:${key} | 数组中所有条目ID: [${allIds}]`);
                      
                      const matchedItem = dictValue.find(item => typeof item === 'object' && !item.futgg_id);
                      if (!matchedItem) {
                        // 没有找到无ID的通用条目时，使用数组中第一个条目（可能有ID）
                        // console.log(`[OAO][同名ID追踪][FUTGG] 名称匹配-使用第一个条目 | 页面ID:${futggId} | 英文名称:${key} | 原因:数组中无通用条目`);
                        const firstItem = dictValue[0];
                        if (firstItem && typeof firstItem === 'object') {
                          const translation = getTranslationValue(firstItem, options.useShortenTerms, key);
                          const source = firstItem.source || '';
                          switch (evolutionFormat) {
                            case 0:
                              h2.textContent = `${translation || key} (${key})${suffix}`;
                              break;
                            case 1:
                              h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                              break;
                            case 2:
                              h2.textContent = key + suffix;
                              break;
                            case 3: // 【来源】中文（英文）
                              h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                              break;
                          }
                          translated = true;
                        }
                      } else {
                        // console.log(`[OAO][同名ID追踪][FUTGG] 名称匹配-使用通用条目(进化字典) | 页面ID:${futggId} | 英文名称:${key} | 通用条目:`, matchedItem);
                        const translation = getTranslationValue(matchedItem, options.useShortenTerms, key);
                        const source = matchedItem.source || '';
                        switch (evolutionFormat) {
                          case 0:
                            h2.textContent = `${translation || key} (${key})${suffix}`;
                            break;
                          case 1:
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                            break;
                          case 2:
                            h2.textContent = key + suffix;
                            break;
                          case 3: // 【来源】中文（英文）
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                            break;
                        }
                        translated = true;
                      }
                    } else if (typeof dictValue === 'object') {
                      if (dictValue.futgg_id) {
                        // console.log(`[OAO][同名ID追踪][FUTGG] 名称匹配-跳过 | 页面ID:${futggId} | 英文名称:${key} | 原因:该条目有ID:${dictValue.futgg_id}`);
                      } else {
                        // console.log(`[OAO][同名ID追踪][FUTGG] 名称匹配-使用通用条目(进化字典) | 页面ID:${futggId} | 英文名称:${key} | 通用条目:`, dictValue);
                        const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                        const source = dictValue.source || '';
                        switch (evolutionFormat) {
                          case 0:
                            h2.textContent = `${translation || key} (${key})${suffix}`;
                            break;
                          case 1:
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                            break;
                          case 2:
                            h2.textContent = key + suffix;
                            break;
                          case 3: // 【来源】中文（英文）
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                            break;
                        }
                        translated = true;
                      }
                    } else {
                      // console.log(`[OAO][同名ID追踪][FUTGG] 名称匹配-简单值(进化字典) | 页面ID:${futggId} | 英文名称:${key} | 值:${dictValue}`);
                      // 简单字符串值（无 ID），可以直接使用
                      switch (evolutionFormat) {
                        case 0:
                          h2.textContent = `${dictValue} (${key})${suffix}`;
                          break;
                        case 1:
                          h2.textContent = `${dictValue}${suffix}`;
                          break;
                        case 2:
                          h2.textContent = key + suffix;
                          break;
                        case 3: // 【来源】中文（英文）
                          h2.textContent = `${dictValue} (${key})${suffix}`;
                          break;
                      }
                      translated = true;
                    }
                  } else {
                    // 没有 futggId 的情况，直接按名称匹配
                    if (Array.isArray(dictValue)) {
                      // 数组格式，取第一个条目
                      const firstItem = dictValue[0];
                      if (firstItem && typeof firstItem === 'object') {
                        const translation = getTranslationValue(firstItem, options.useShortenTerms, key);
                        const source = firstItem.source || '';
                        switch (evolutionFormat) {
                          case 0:
                            h2.textContent = `${translation || key} (${key})${suffix}`;
                            break;
                          case 1:
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                            break;
                          case 2:
                            h2.textContent = key + suffix;
                            break;
                          case 3: // 【来源】中文（英文）
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                            break;
                        }
                      } else {
                        h2.textContent = key + suffix;
                      }
                    } else if (typeof dictValue === 'object') {
                      const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                      const source = dictValue.source || '';
                      switch (evolutionFormat) {
                        case 0:
                          h2.textContent = `${translation || key} (${key})${suffix}`;
                          break;
                        case 1:
                          h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                          break;
                        case 2:
                          h2.textContent = key + suffix;
                          break;
                        case 3: // 【来源】中文（英文）
                          h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                          break;
                      }
                    } else {
                      switch (evolutionFormat) {
                        case 0:
                          h2.textContent = `${dictValue} (${key})${suffix}`;
                          break;
                        case 1:
                          h2.textContent = `${dictValue}${suffix}`;
                          break;
                        case 2:
                          h2.textContent = key + suffix;
                          break;
                        case 3: // 【来源】中文（英文）
                          h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                          break;
                      }
                    }
                    translated = true;
                  }
                }
              }
              
              // 如果进化字典中没找到，在所有字典中查找
              if (!translated) {
                // 优先按 futgg_id 精确匹配
                if (futggId) {
                  for (const dict of allDictionaries) {
                    const found = findEvolutionById(dict, futggId, 'futgg_id');
                    if (found) {
                      const dictValue = found.entry;
                      const translation = getTranslationValue(dictValue, options.useShortenTerms, found.key);
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          h2.textContent = `${translation || found.key} (${found.key})${suffix}`;
                          break;
                        case 1: // 来源中文
                          h2.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || found.key}${suffix}`;
                          break;
                        case 2: // 英文
                          h2.textContent = found.key + suffix;
                          break;
                        case 3: // 【来源】中文（英文）
                          h2.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || found.key} (${found.key})${suffix}`;
                          break;
                      }
                      translated = true;
                      break;
                    }
                  }
                }
                
                // 按名称查找（优先匹配没有配置 futgg_id 的通用条目）
                if (!translated) {
                  for (const dict of allDictionaries) {
                    if (dict[baseText] || dict[baseTextUpper]) {
                      const key = dict[baseText] ? baseText : baseTextUpper;
                      const dictValue = dict[key];
                      
                      // 如果页面元素有 futgg_id，名称匹配时只匹配没有配置 futgg_id 的条目
                      if (futggId) {
                        if (Array.isArray(dictValue)) {
                          const matchedItem = dictValue.find(item => typeof item === 'object' && !item.futgg_id);
                          if (!matchedItem) continue;
                          const translation = getTranslationValue(matchedItem, options.useShortenTerms, key);
                          const source = matchedItem.source;
                          switch (evolutionFormat) {
                            case 0:
                              h2.textContent = `${translation || key} (${key})${suffix}`;
                              break;
                            case 1:
                              h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                              break;
                            case 2:
                              h2.textContent = key + suffix;
                              break;
                            case 3: // 【来源】中文（英文）
                              h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                              break;
                          }
                          translated = true;
                        } else if (typeof dictValue === 'object') {
                          if (dictValue.futgg_id) continue;
                          const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                          const source = dictValue.source;
                          switch (evolutionFormat) {
                            case 0:
                              h2.textContent = `${translation || key} (${key})${suffix}`;
                              break;
                            case 1:
                              h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                              break;
                            case 2:
                              h2.textContent = key + suffix;
                              break;
                            case 3: // 【来源】中文（英文）
                              h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                              break;
                          }
                          translated = true;
                        } else {
                          switch (evolutionFormat) {
                            case 0:
                              h2.textContent = `${dictValue} (${key})${suffix}`;
                              break;
                            case 1:
                              h2.textContent = `${dictValue}${suffix}`;
                              break;
                            case 2:
                              h2.textContent = key + suffix;
                              break;
                            case 3: // 【来源】中文（英文）
                              h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                              break;
                          }
                          translated = true;
                        }
                      } else {
                        const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                        const source = getSourceValue(dictValue);
                        switch (evolutionFormat) {
                          case 0:
                            h2.textContent = `${translation || key} (${key})${suffix}`;
                            break;
                          case 1:
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                            break;
                          case 2:
                            h2.textContent = key + suffix;
                            break;
                          case 3: // 【来源】中文（英文）
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                            break;
                        }
                        translated = true;
                      }
                      break;
                    }
                    // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                    if (!translated && (evolutionFormat === 0 || evolutionFormat === 2 || evolutionFormat === 3)) {
                      const reverseResult = reverseLookupEvolution(dict, baseText, futggId, 'futgg_id', options);
                      if (reverseResult) {
                        // console.log(`[OAO][同名ID追踪][FUTGG] 反向查找匹配成功 | 页面ID:${futggId} | 页面文本:${baseText} | 英文key:${reverseResult.key}`);
                        switch (evolutionFormat) {
                          case 0: // 中文（英文）
                            h2.textContent = `${reverseResult.translation} (${reverseResult.key})${suffix}`;
                            break;
                          case 1: // 来源中文
                            h2.textContent = `${reverseResult.translation}${suffix}`;
                            break;
                          case 2: // 英文
                            h2.textContent = reverseResult.key + suffix;
                            break;
                          case 3: // 【来源】中文（英文）
                            h2.textContent = `${reverseResult.translation} (${reverseResult.key})${suffix}`;
                            break;
                        }
                        translated = true;
                      }
                      if (translated) break;
                    }
                  }
                }
              }
              // 如果还是没找到翻译且是英文格式，保持原样
              if (!translated && evolutionFormat === 2) {
                // 保持原样，不翻译
              }
            }
            // 标记为已处理，避免重复处理
            h2.dataset.oaoFutggEvoProcessed = 'true';
            // 同时标记为已翻译，避免主翻译循环再次处理
            h2.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 futgg evolutions 详情页面的 h1.text-3xl.font-bold 格式进行特殊处理
      // 该格式为：<h1 class="text-3xl font-bold">Low Driven Shot+ [SP 25] - EA SPORTS FC 26</h1>
      // 需要翻译进化名称部分，保留 " - EA SPORTS FC 26" 后缀不变
      if (isFutggEvolutionsPage) {
        const detailH1s = root.querySelectorAll('h1.text-3xl.font-bold');
        detailH1s.forEach(h1 => {
          if (h1.dataset.oaoFutggEvoProcessed) return;

          let text = h1.textContent.trim();
          if (!text) return;

          // 提取并保留 " - EA SPORTS FC 26/27/..." 静态后缀（版本号写成 \d+，FC27 上线后 fut.gg 标题后缀变为 " - EA SPORTS FC 27"，
          // 此前写死 26 会导致后缀剥离失败 → 整句当进化名查字典 → 查不到 → 标题不翻译），
          // 仅当后缀前确实有 " - " 分隔时才剥离，避免误吞纯名称
          const fcSuffixMatch = text.match(/\s+-\s+EA SPORTS FC \d+$/i);
          let fcSuffix = '';
          let namePart = text;
          if (fcSuffixMatch) {
            fcSuffix = fcSuffixMatch[0];
            namePart = text.replace(fcSuffixMatch[0], '').trim();
          }

          // 匹配方括号后缀，如 " [SP 25]"
          const suffixMatch = namePart.match(/\s*\[[^\]]+\]$/);
          let baseText = namePart;
          let suffix = '';
          if (suffixMatch) {
            baseText = namePart.replace(suffixMatch[0], '').trim();
            suffix = suffixMatch[0];
          }

          // 从 URL 提取 futgg_id
          let futggId = '';
          const urlMatch = window.location.href.match(/\/evolutions\/(\d+)-/);
          if (urlMatch) {
            futggId = urlMatch[1];
          }

          const baseTextUpper = baseText.toUpperCase();
          let translated = false;

          const suffixTrimmed = suffix.trim();

          function buildDisplayText(engKey, chnText, srcText, fmt) {
            const keyHasSuffix = suffixTrimmed && engKey.toUpperCase().endsWith(suffixTrimmed.toUpperCase());
            const extraSuffix = keyHasSuffix ? '' : suffix;
            switch (fmt) {
              case 0:
                return `${chnText || engKey} (${engKey})${extraSuffix}${fcSuffix}`;
              case 1:
                return `${srcText ? '【' + srcText + '】' : ''}${chnText || engKey}${extraSuffix}${fcSuffix}`;
              case 2:
                return engKey + extraSuffix + fcSuffix;
              case 3:
                return `${srcText ? '【' + srcText + '】' : ''}${chnText || engKey} (${engKey})${extraSuffix}${fcSuffix}`;
              default:
                return engKey + extraSuffix + fcSuffix;
            }
          }

          // 优先在进化字典中按 futgg_id 精确匹配
          if (futggId && options.evolutionDictionary) {
            const found = findEvolutionById(options.evolutionDictionary, futggId, 'futgg_id');
            if (found) {
              const dictValue = found.entry;
              const translation = getTranslationValue(dictValue, options.useShortenTerms, found.key);
              const source = getSourceValue(dictValue);
              h1.textContent = buildDisplayText(found.key, translation, source, evolutionFormat);
              translated = true;
            }
          }

          // 按名称在进化字典中查找（优先使用通用条目）
          if (!translated && options.evolutionDictionary) {
            const evoKey = findEvolutionKey(options.evolutionDictionary, baseText, suffix);
            if (evoKey) {
              const key = evoKey;
              const dictValue = options.evolutionDictionary[key];
              const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
              const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
              const source = getSourceValue(selectedEntry);
              h1.textContent = buildDisplayText(key, translation, source, evolutionFormat);
              translated = true;
            }
          }

          // 如果还是没找到翻译且是英文格式，保持原样
          if (!translated && evolutionFormat === 2) {
            // 保持原样，不翻译
          }

          // 标记为已处理，避免重复处理
          h1.dataset.oaoFutggEvoProcessed = 'true';
          h1.dataset.oaoTranslated = 'true';
        });
      }

      // 针对 futgg evo-lab/evolve 和 evo-lab/ 页面的特定 HTML 格式进行特殊处理
      // 该格式为：<button> 或 <div> 包含 <span>SVG</span><span>文本</span>
      // 只选择包含 SVG 图标的元素，避免匹配到底部标签栏按钮
      // 英文模式下不处理，保持原始英文
      if ((isFutggEvolvePage || (window.location.pathname === '/evo-lab' || window.location.pathname === '/evo-lab/')) && evolutionFormat !== 2) {
        // ====================================================================
        // 球员特技元素专用处理（优先级最高）：
        // - 选择器：div.relative.table 容器，内含金色菱形 SVG（viewBox="0 0 256 256"）
        //   和底部 span.overflow-hidden 文本标签
        // - 处理规则：只读取 playstyles 特技字典翻译，只显示中文，
        //   不读取进化字典，不应用进化格式（不显示英文原文括号）
        // - FUTGG 翻译开：翻译为中文
        // - FUTGG 翻译关（skipGeneralTranslation=true）：保持英文不翻译，仅标记防止误处理
        // ====================================================================
        const playstyleContainers = root.querySelectorAll('div.relative.table:has(svg[viewBox="0 0 256 256"])');
        const playstyleDictPs = dictionaryCache.playstyles;
        playstyleContainers.forEach(psContainer => {
          const psTextSpan = psContainer.querySelector('span.overflow-hidden');
          if (!psTextSpan || psTextSpan.dataset.oaoPlaystyleProcessed === 'true') return;
          let psText = psTextSpan.textContent.trim();
          if (!psText) return;
          // FUTGG 翻译关时：保持英文不翻译，仅标记防止其他翻译器误处理
          if (!options || !options.skipGeneralTranslation) {
            if (playstyleDictPs) {
              const psContainsChinese = /[\u4e00-\u9fa5]/.test(psText);
              let psBaseText = psText;
              // 如果已被其他翻译器翻译为「中文 (英文)」或纯中文，通过反向查找还原英文 key
              if (psContainsChinese) {
                const pureChinese = psText.replace(/\s*\([^)]+\)\s*$/, '').trim();
                for (const psKey in playstyleDictPs) {
                  const psTrans = getTranslationValue(playstyleDictPs[psKey], options.useShortenTerms, psKey);
                  if (psTrans === pureChinese || psTrans === psText) {
                    psBaseText = psKey;
                    break;
                  }
                }
              }
              const psBaseTextUpper = psBaseText.toUpperCase();
              if (playstyleDictPs[psBaseText] || playstyleDictPs[psBaseTextUpper]) {
                const psKey = playstyleDictPs[psBaseText] ? psBaseText : psBaseTextUpper;
                const psTranslation = getTranslationValue(playstyleDictPs[psKey], options.useShortenTerms, psKey);
                psTextSpan.textContent = psTranslation;
              }
            }
          }
          psTextSpan.dataset.oaoPlaystyleProcessed = 'true';
          psTextSpan.dataset.oaoTranslated = 'true';
        });

        const evoButtons = root.querySelectorAll(':is(button,div).text-evo:has(svg)');
        evoButtons.forEach(button => {
          const textSpan = button.querySelector('span:not(.shrink-0)');
          if (textSpan) {
            let text = textSpan.textContent.trim();
            if (text) {
              // 检测是否为球员特技元素：特技元素包含菱形背景 SVG（viewBox="0 0 256 256"，金色菱形）
              // 或其自身为 relative table 容器（特技图标展示位）
              // 球员特技只读取特技字典翻译，不读取进化字典，不应用进化格式
              const isPlaystyleTrait = !!button.querySelector('svg[viewBox="0 0 256 256"]') ||
                                       (button.classList.contains('relative') && button.classList.contains('table'));
              if (isPlaystyleTrait) {
                const playstyleDict = dictionaryCache.playstyles;
                if (playstyleDict) {
                  const containsChinesePs = /[\u4e00-\u9fa5]/.test(text);
                  let baseTextPs = text;
                  // 若已被其他翻译器翻译为中文，通过反向查找还原英文 key，确保只使用特技字典
                  if (containsChinesePs) {
                    for (const psKey in playstyleDict) {
                      const psTrans = getTranslationValue(playstyleDict[psKey], options.useShortenTerms, psKey);
                      if (psTrans === text) {
                        baseTextPs = psKey;
                        break;
                      }
                    }
                  }
                  const baseTextPsUpper = baseTextPs.toUpperCase();
                  if (playstyleDict[baseTextPs] || playstyleDict[baseTextPsUpper]) {
                    const psKey = playstyleDict[baseTextPs] ? baseTextPs : baseTextPsUpper;
                    const psTranslation = getTranslationValue(playstyleDict[psKey], options.useShortenTerms, psKey);
                    // 普通翻译格式：仅显示中文，不应用进化格式，不带英文原文
                    textSpan.textContent = psTranslation;
                  }
                }
                // 标记为已处理，避免重复处理与进化格式覆盖
                textSpan.dataset.oaoFutggEvoProcessed = 'true';
                textSpan.dataset.oaoTranslated = 'true';
                return;
              }
              const containsChinese = /[\u4e00-\u9fa5]/.test(text);
              if (containsChinese && textSpan.dataset.oaoTranslated === 'true') {
                if (evolutionFormat !== 1 && evolutionFormat !== 2) {
                  // 文本已经被其他翻译器翻译为中文，需要重新处理以添加英文原文
                } else {
                  // 格式1（来源中文）和格式2（英文）不需要重新处理
                  return;
                }
              }
              // 匹配后缀模式 - 支持各种括号内的内容
              const suffixMatch = text.match(/\s*\[[^\]]+\]$/);
              let baseText = text;
              let suffix = '';
              if (suffixMatch) {
                baseText = text.replace(suffixMatch[0], '').trim();
                suffix = suffixMatch[0];
              }
              const baseTextUpper = baseText.toUpperCase();
              let translated = false;
              // 首先在进化字典中查找
              if (options.evolutionDictionary) {
                const evoKey = findEvolutionKey(options.evolutionDictionary, baseText, suffix);
                if (evoKey) {
                  const key = evoKey;
                  const dictValue = options.evolutionDictionary[key];
                  const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
                  const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                  // 按照进化格式显示
                  switch (evolutionFormat) {
                  case 0: // 中文（英文）
                    textSpan.textContent = `${translation || key} (${key})${suffix}`;
                    break;
                  case 1: // 来源中文
                    textSpan.textContent = `${getSourceValue(selectedEntry) ? '【' + getSourceValue(selectedEntry) + '】' : ''}${translation || key}${suffix}`;
                    break;
                  case 2: // 英文 - 保持原始英文，不翻译
                    textSpan.textContent = key + suffix;
                    break;
                  case 3: // 【来源】中文（英文）
                    textSpan.textContent = `${getSourceValue(selectedEntry) ? '【' + getSourceValue(selectedEntry) + '】' : ''}${translation || key} (${key})${suffix}`;
                    break;
                  }
                  translated = true;
                }
              }
              // 如果进化字典中没找到，在所有字典中查找
              if (!translated) {
                for (const dict of allDictionaries) {
                  // 正向查找：baseText 作为 key
                  if (dict[baseText] || dict[baseTextUpper]) {
                    const key = dict[baseText] ? baseText : baseTextUpper;
                    const dictValue = dict[key];
                    const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                    // 判断：当前字典是否为进化字典。如果不是进化字典
                    // （例如命中了 playstyles/roles/basic/sixStat 等通用字典），
                    // 则只输出纯中文，不应用进化格式（不加英文括号）
                    const isFromEvolutionDict = options.evolutionDictionary && dict === options.evolutionDictionary;
                    if (!isFromEvolutionDict) {
                      textSpan.textContent = (translation || key) + suffix;
                    } else {
                      // 进化字典才应用进化格式显示
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          textSpan.textContent = `${translation || key} (${key})${suffix}`;
                          break;
                        case 1: // 来源中文
                          textSpan.textContent = `${getSourceValue(dictValue) ? '【' + getSourceValue(dictValue) + '】' : ''}${translation || key}${suffix}`;
                          break;
                        case 2: // 英文 - 保持原始英文，不翻译
                          textSpan.textContent = key + suffix;
                          break;
                        case 3: // 【来源】中文（英文）
                          textSpan.textContent = `${getSourceValue(dictValue) ? '【' + getSourceValue(dictValue) + '】' : ''}${translation || key} (${key})${suffix}`;
                          break;
                      }
                    }
                    translated = true;
                    break;
                  }
                  // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                  if (!translated && (evolutionFormat === 0 || evolutionFormat === 2 || evolutionFormat === 3)) {
                    const reverseResult = reverseLookupEvolution(dict, baseText, null, null, options);
                    if (reverseResult) {
                      const isRevFromEvolutionDict = options.evolutionDictionary && dict === options.evolutionDictionary;
                      // 非进化字典的反向查找命中，同样只显示纯中文
                      if (!isRevFromEvolutionDict) {
                        textSpan.textContent = reverseResult.translation + suffix;
                      } else {
                        switch (evolutionFormat) {
                          case 0: // 中文（英文）
                            textSpan.textContent = `${reverseResult.translation} (${reverseResult.key})${suffix}`;
                            break;
                          case 1: // 来源中文
                            textSpan.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}${suffix}`;
                            break;
                          case 2: // 英文
                            textSpan.textContent = reverseResult.key + suffix;
                            break;
                          case 3: // 【来源】中文（英文）
                            textSpan.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})${suffix}`;
                            break;
                        }
                      }
                      translated = true;
                    }
                  }
                  if (translated) break;
                }
              }
            }
            // 标记为已处理，避免重复处理
            textSpan.dataset.oaoFutggEvoProcessed = 'true';
            textSpan.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 futgg players/***/evolutions 页面的特定 HTML 格式进行特殊处理
      // 该格式为：<div><svg/><div>文本</div></div>
      if (isFutggPlayerEvolutionsPage) {
        const evoItems = root.querySelectorAll('div.flex.items-center.w-full.gap-2');
        evoItems.forEach(item => {
          const textDiv = item.querySelector('div.overflow-hidden');
          if (textDiv) {
            let text = textDiv.textContent.trim();
            if (text && !textDiv.dataset.oaoFutggEvoProcessed) {
              // 匹配后缀模式 - 支持各种括号内的内容
              const suffixMatch = text.match(/\s*\[[^\]]+\]$/);
              let baseText = text;
              let suffix = '';
              if (suffixMatch) {
                baseText = text.replace(suffixMatch[0], '').trim();
                suffix = suffixMatch[0];
              }
              const baseTextUpper = baseText.toUpperCase();
              let translated = false;
              // 首先在进化字典中查找
              if (options.evolutionDictionary) {
                const evoKey = findEvolutionKey(options.evolutionDictionary, baseText, suffix);
                if (evoKey) {
                  const key = evoKey;
                  const dictValue = options.evolutionDictionary[key];
                  const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
                  const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                  const source = getSourceValue(selectedEntry);
                  // 按照进化格式显示
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      textDiv.textContent = `${translation || key} (${key})${suffix}`;
                      break;
                    case 1: // 来源中文
                      textDiv.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                      break;
                    case 2: // 英文 - 保持原始英文，不翻译
                      textDiv.textContent = key + suffix;
                      break;
                    case 3: // 【来源】中文（英文）
                      textDiv.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                      break;
                  }
                  translated = true;
                }
              }
              // 如果进化字典中没找到，在所有字典中查找
              if (!translated) {
                for (const dict of allDictionaries) {
                  // 正向查找：baseText 作为 key
                  if (dict[baseText] || dict[baseTextUpper]) {
                    const key = dict[baseText] ? baseText : baseTextUpper;
                    const dictValue = dict[key];
                    const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
                    const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                    const source = getSourceValue(selectedEntry);
                    // 按照进化格式显示
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        textDiv.textContent = `${translation || key} (${key})${suffix}`;
                        break;
                      case 1: // 来源中文
                        textDiv.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                        break;
                      case 2: // 英文 - 保持原始英文，不翻译
                        textDiv.textContent = key + suffix;
                        break;
                      case 3: // 【来源】中文（英文）
                        textDiv.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                        break;
                    }
                    translated = true;
                    break;
                  }
                  // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                  if (!translated && (evolutionFormat === 0 || evolutionFormat === 2 || evolutionFormat === 3)) {
                    const reverseResult = reverseLookupEvolution(dict, baseText, null, null, options);
                    if (reverseResult) {
                      // console.log(`[OAO][同名ID追踪][FUTGG] 反向查找匹配成功 | 页面文本:${baseText} | 英文key:${reverseResult.key}`);
                      switch (evolutionFormat) {
                        case 0:
                          textDiv.textContent = `${reverseResult.translation} (${reverseResult.key})${suffix}`;
                          break;
                        case 1:
                          textDiv.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}${suffix}`;
                          break;
                        case 2:
                          textDiv.textContent = reverseResult.key + suffix;
                          break;
                        case 3:
                          textDiv.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})${suffix}`;
                          break;
                      }
                      translated = true;
                    }
                  }
                  if (translated) break;
                }
              }
              // 标记为已处理，避免重复处理
              textDiv.dataset.oaoFutggEvoProcessed = 'true';
              textDiv.dataset.oaoTranslated = 'true';
            }
            
            // 样式调整：允许换行显示完整内容（无论是否已翻译都执行，但只执行一次）
            if (!textDiv.dataset.oaoEvoStyleFixed) {
              textDiv.classList.remove('text-ellipsis');
              textDiv.classList.remove('whitespace-nowrap');
              textDiv.style.whiteSpace = 'normal';
              textDiv.style.overflow = 'visible';
              textDiv.style.textOverflow = 'clip';
              textDiv.style.lineHeight = '1.4';
              
              // 移除中间容器的 overflow-hidden
              item.classList.remove('overflow-hidden');
              
              // 调整最外层容器高度
              const container = item.closest('div.bg-gray-900.rounded-md.font-bold.text-xs');
              if (container) {
                container.classList.remove('overflow-hidden');
                container.style.height = 'auto';
                container.style.minHeight = '48px';
                container.dataset.oaoEvoNameResized = 'true';
              }
              
              textDiv.dataset.oaoEvoStyleFixed = 'true';
            }
          }
        });
      }

      // 针对 futgg evo-lab/your-upgrades 页面的特定 HTML 格式进行特殊处理
      // 该格式为：<div class="bg-gray-900 rounded-md ..."> 包含 <div class="flex items-center gap-2"><img/><文本></div>
      if (isFutggYourUpgradesPage) {
        const evoItems = root.querySelectorAll('div.bg-gray-900.rounded-md.flex.items-center.justify-between.flex-wrap.p-2.text-sm.gap-2.font-bold.grow');
        evoItems.forEach(item => {
          const textContainer = item.querySelector('div.flex.items-center.gap-2');
          if (textContainer && !textContainer.dataset.oaoFutggEvoProcessed) {
            const textNodes = Array.from(textContainer.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
            const textNode = textNodes.find(node => node.textContent.trim());
            if (textNode) {
              let text = textNode.textContent.trim();
              if (text) {
                const textUpper = text.toUpperCase();
                let translated = false;
                // 首先在进化字典中查找
                if (options.evolutionDictionary) {
                  if (options.evolutionDictionary[text] || options.evolutionDictionary[textUpper]) {
                    const key = options.evolutionDictionary[text] ? text : textUpper;
                    const dictValue = options.evolutionDictionary[key];
                    const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
                    const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                    const source = getSourceValue(selectedEntry);
                    // 按照进化格式显示
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        textNode.textContent = `${translation || key} (${key})`;
                        break;
                      case 1: // 来源中文
                        textNode.textContent = `${source ? '【' + source + '】' : ''}${translation || key}`;
                        break;
                      case 2: // 英文 - 保持原始英文，不翻译
                        textNode.textContent = key;
                        break;
                      case 3: // 【来源】中文（英文）
                        textNode.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})`;
                        break;
                    }
                    translated = true;
                  }
                }
                // 如果进化字典中没找到，在所有字典中查找
                if (!translated) {
                  for (const dict of allDictionaries) {
                    // 正向查找：text 作为 key
                    if (dict[text] || dict[textUpper]) {
                      const key = dict[text] ? text : textUpper;
                      const dictValue = dict[key];
                      const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
                      const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                      const source = getSourceValue(selectedEntry);
                      // 按照进化格式显示
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          textNode.textContent = `${translation || key} (${key})`;
                          break;
                        case 1: // 来源中文
                          textNode.textContent = `${source ? '【' + source + '】' : ''}${translation || key}`;
                          break;
                        case 2: // 英文 - 保持原始英文，不翻译
                          textNode.textContent = key;
                          break;
                        case 3: // 【来源】中文（英文）
                          textNode.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})`;
                          break;
                      }
                      translated = true;
                      break;
                    }
                    // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                    if (!translated && (evolutionFormat === 0 || evolutionFormat === 2 || evolutionFormat === 3)) {
                      const reverseResult = reverseLookupEvolution(dict, text, null, null, options);
                      if (reverseResult) {
                        // console.log(`[OAO][同名ID追踪][FUTGG] 反向查找匹配成功 | 页面文本:${text} | 英文key:${reverseResult.key}`);
                        switch (evolutionFormat) {
                          case 0:
                            textNode.textContent = `${reverseResult.translation} (${reverseResult.key})`;
                            break;
                          case 1:
                            textNode.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}`;
                            break;
                          case 2:
                            textNode.textContent = reverseResult.key;
                            break;
                          case 3:
                            textNode.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})`;
                            break;
                        }
                        translated = true;
                      }
                    }
                    if (translated) break;
                  }
                }
              }
              // 标记为已处理，避免重复处理
              textContainer.dataset.oaoFutggEvoProcessed = 'true';
              textContainer.dataset.oaoTranslated = 'true';
            }
          }
        });
      }

      // 针对 futgg evo-lab/evolve 页面的 p.text-xs.uppercase.font-bold 格式进行特殊处理
      if (isFutggEvolvePage) {
        // 处理 p.text-xs.uppercase.font-bold 元素
        const evoParagraphs = root.querySelectorAll('p.text-xs.uppercase.font-bold');
        evoParagraphs.forEach(p => {
          // 在英语格式下，不做任何处理，直接保留原英文
          if (evolutionFormat === 2) {
            p.dataset.oaoFutggEvoProcessed = 'true';
            p.dataset.oaoTranslated = 'true';
            return;
          }
          if (!p.dataset.oaoFutggEvoProcessed) {
            let text = p.textContent.trim();
            if (text) {
              // 匹配后缀模式 - 支持各种括号内的内容
              const suffixMatch = text.match(/\s*\[[^\]]+\]$/);
              let baseText = text;
              let suffix = '';
              if (suffixMatch) {
                baseText = text.replace(suffixMatch[0], '').trim();
                suffix = suffixMatch[0];
              }
              
              const baseTextUpper = baseText.toUpperCase();
              let translated = false;
              // 在所有字典中查找翻译
              for (const dict of allDictionaries) {
                // 正向查找：baseText 作为 key
                if (dict[baseText] || dict[baseTextUpper]) {
                  const key = dict[baseText] ? baseText : baseTextUpper;
                  const dictValue = dict[key];
                  const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
                  const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                  const source = getSourceValue(selectedEntry);
                  // 按照进化格式显示
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      p.textContent = `${translation || key} (${key})${suffix}`;
                      break;
                    case 1: // 来源中文
                      p.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                      break;
                    case 2: // 英文 - 保持原始英文，不翻译
                      p.textContent = key + suffix;
                      break;
                    case 3: // 【来源】中文（英文）
                      p.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 1 || evolutionFormat === 2 || evolutionFormat === 3)) {
                  const reverseResult = reverseLookupEvolution(dict, baseText, null, null, options);
                  if (reverseResult) {
                    // console.log(`[OAO][同名ID追踪][FUTGG] 反向查找匹配成功 | 页面文本:${baseText} | 英文key:${reverseResult.key}`);
                    switch (evolutionFormat) {
                      case 0:
                        p.textContent = `${reverseResult.translation} (${reverseResult.key})${suffix}`;
                        break;
                      case 1:
                        p.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}${suffix}`;
                        break;
                      case 2:
                        p.textContent = reverseResult.key + suffix;
                        break;
                      case 3:
                        p.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})${suffix}`;
                        break;
                    }
                    translated = true;
                  }
                }
                if (translated) break;
              }
            }
            // 标记为已处理，避免重复处理
            p.dataset.oaoFutggEvoProcessed = 'true';
            p.dataset.oaoTranslated = 'true';
          }
        });
        
        // 处理按钮中的进化名称（点击 APPLY 后动态添加的元素）
        // 使用更宽松的选择器：包含 bg-evo 和 text-evo 类的按钮，且包含 SVG 图标
        // 同时处理 bg-evo/10 的按钮
        const evoButtons = root.querySelectorAll('button[class*="bg-evo"][class*="text-evo"]:has(svg)');
        evoButtons.forEach(button => {
          // 使用更宽松的选择器查找文本 span：不包含 svg 的 span，或者 .break-words span，或者 .min-w-0 span
          const span = button.querySelector('span:not(:has(svg))') || 
                       button.querySelector('span.break-words') ||
                       button.querySelector('span.min-w-0');
          if (span) {
            const text = span.textContent.trim();
            // 在英语格式下，不做任何处理，直接保留原英文
            if (evolutionFormat === 2) {
              span.dataset.oaoFutggEvoProcessed = 'true';
              span.dataset.oaoTranslated = 'true';
              return;
            }
            // 检查是否需要翻译：要么没有处理过标记，要么是纯英文（没有中文）
            const needsTranslation = !span.dataset.oaoFutggEvoProcessed || 
              (!text.includes('的') && !text.includes('版') && /^(\d|[A-Za-z])/.test(text));
            if (needsTranslation && text) {
              // 匹配后缀模式 - 支持各种括号内的内容
              const suffixMatch = text.match(/\s*\[[^\]]+\]$/);
              let baseText = text;
              let suffix = '';
              if (suffixMatch) {
                baseText = text.replace(suffixMatch[0], '').trim();
                suffix = suffixMatch[0];
              }
              
              // 检查是否已经是中文（英文）格式
              const chineseEnglishMatch = baseText.match(/^(.+)\s*\(([^)]+)\)$/);
              if (chineseEnglishMatch) {
                // 如果已经是中文（英文）格式，使用英文部分作为 key
                baseText = chineseEnglishMatch[2];
              }
              
              const baseTextUpper = baseText.toUpperCase();
              let translated = false;
              // 在所有字典中查找翻译
              for (const dict of allDictionaries) {
                // 正向查找：baseText 作为 key
                if (dict[baseText] || dict[baseTextUpper]) {
                  const key = dict[baseText] ? baseText : baseTextUpper;
                  const dictValue = dict[key];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  const source = getSourceValue(dictValue);
                  // 按照进化格式显示
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      span.textContent = `${translation || key} (${key})${suffix}`;
                      break;
                    case 1: // 来源中文
                      span.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                      break;
                    case 2: // 英文 - 保持原始英文，不翻译
                      span.textContent = key + suffix;
                      break;
                    case 3: // 【来源】中文（英文）
                      span.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 1 || evolutionFormat === 2 || evolutionFormat === 3)) {
                  const reverseResult = reverseLookupEvolution(dict, baseText, null, null, options);
                  if (reverseResult) {
                    // console.log(`[OAO][同名ID追踪][FUTGG] 反向查找匹配成功 | 页面文本:${baseText} | 英文key:${reverseResult.key}`);
                    switch (evolutionFormat) {
                      case 0:
                        span.textContent = `${reverseResult.translation} (${reverseResult.key})${suffix}`;
                        break;
                      case 1:
                        span.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}${suffix}`;
                        break;
                      case 2:
                        span.textContent = reverseResult.key + suffix;
                        break;
                      case 3:
                        span.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})${suffix}`;
                        break;
                    }
                    translated = true;
                  }
                }
                if (translated) break;
              }
            }
            // 标记为已处理，避免重复处理
            span.dataset.oaoFutggEvoProcessed = 'true';
            span.dataset.oaoTranslated = 'true';
          }
        });
        
        // 处理页面导航按钮（如 Evolve、Players、SBC 等）
        // 这些按钮不包含 SVG 图标，需要单独处理
        const navButtons = root.querySelectorAll('button.text-evo:not(:has(svg))');
        navButtons.forEach(button => {
          if (!button.dataset.oaoFutggNavProcessed) {
            const text = button.textContent.trim();
            if (text) {
              const textUpper = text.toUpperCase();
              let translated = false;
              for (const dict of allDictionaries) {
                if (dict[text] || dict[textUpper]) {
                  const key = dict[text] ? text : textUpper;
                  const dictValue = dict[key];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  button.textContent = translation;
                  translated = true;
                  break;
                }
              }
            }
            button.dataset.oaoFutggNavProcessed = 'true';
            button.dataset.oaoTranslated = 'true';
          }
        });
        
        // 处理进化名称显示不全的问题
        // 针对 bg-gray-900 rounded-md font-bold text-xs overflow-hidden 格式的容器
        // 以及内部的 text-ellipsis whitespace-nowrap 文本元素
        const evoNameContainers = root.querySelectorAll('div.bg-gray-900.rounded-md.font-bold.text-xs.overflow-hidden');
        evoNameContainers.forEach(container => {
          // 在英语格式下，不做任何处理，直接保留原英文
          if (evolutionFormat === 2) {
            return;
          }
          
          // 查找内部文本元素（可能有 text-ellipsis/whitespace-nowrap，也可能已经被移除）
          // 使用更精确的选择器：优先选择 SVG 图标旁边的纯文本 div
          // 使用 :not(:has(*)) 确保只选中没有子元素的纯文本 div
          const textElement = container.querySelector('svg.lucide-dna + div.overflow-hidden:not(:has(*))') ||
                              container.querySelector('div.text-ellipsis.whitespace-nowrap:not(:has(*))') ||
                              container.querySelector('div.overflow-hidden:not(:has(*))') ||
                              container.querySelector('div.text-ellipsis.whitespace-nowrap') || 
                              container.querySelector('div.overflow-hidden');
          
          if (textElement) {
            // 样式调整：允许换行显示完整内容
            textElement.classList.remove('text-ellipsis');
            textElement.classList.remove('whitespace-nowrap');
            textElement.style.whiteSpace = 'normal';
            textElement.style.overflow = 'visible';
            textElement.style.textOverflow = 'clip';
            textElement.style.lineHeight = '1.4';
            
            container.style.height = 'auto';
            container.style.minHeight = '48px';
            container.dataset.oaoEvoNameResized = 'true';
            
            // 翻译处理：处理英文文本，或处理已被抢先翻译成中文的文本
            const text = textElement.textContent.trim();
            if (text) {
              const containsChinese = /[\u4e00-\u9fa5]/.test(text);
              
              // 如果文本包含中文，说明可能被其他翻译器抢先翻译，需要执行反向查找
              if (containsChinese) {
                // 匹配后缀模式
                const suffixMatch = text.match(/\s*\[[^\]]+\]$/);
                let baseText = text;
                let suffix = '';
                if (suffixMatch) {
                  baseText = text.replace(suffixMatch[0], '').trim();
                  suffix = suffixMatch[0];
                }
                
                // 执行反向查找
                for (const dict of allDictionaries) {
                  const reverseResult = reverseLookupEvolution(dict, baseText, null, null, options);
                  if (reverseResult) {
                    // console.log(`[OAO][同名ID追踪][FUTGG] 反向查找匹配成功（已翻译中文恢复）| 页面文本:${baseText} | 英文key:${reverseResult.key}`);
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        textElement.textContent = `${reverseResult.translation} (${reverseResult.key})${suffix}`;
                        break;
                      case 1: // 来源中文
                        textElement.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}${suffix}`;
                        break;
                      case 3: // 【来源】中文（英文）
                        textElement.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})${suffix}`;
                        break;
                    }
                    textElement.dataset.oaoEvoNameTranslated = 'true';
                    break;
                  }
                }
              } else if (/^[A-Za-z]/.test(text) && !text.includes('的') && !text.includes('版')) {
                // 匹配后缀模式
                const suffixMatch = text.match(/\s*\[[^\]]+\]$/);
                let baseText = text;
                let suffix = '';
                if (suffixMatch) {
                  baseText = text.replace(suffixMatch[0], '').trim();
                  suffix = suffixMatch[0];
                }
                
                const baseTextUpper = baseText.toUpperCase();
                let translated = false;
                
                // 首先在进化字典中查找
                if (options.evolutionDictionary) {
                  const evoKey = findEvolutionKey(options.evolutionDictionary, baseText, suffix);
                  if (evoKey) {
                    const key = evoKey;
                    const dictValue = options.evolutionDictionary[key];
                    const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
                    const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        textElement.textContent = `${translation || key} (${key})${suffix}`;
                        break;
                      case 1: // 来源中文
                        textElement.textContent = `${getSourceValue(selectedEntry) ? '【' + getSourceValue(selectedEntry) + '】' : ''}${translation || key}${suffix}`;
                        break;
                      case 3: // 【来源】中文（英文）
                        textElement.textContent = `${getSourceValue(selectedEntry) ? '【' + getSourceValue(selectedEntry) + '】' : ''}${translation || key} (${key})${suffix}`;
                        break;
                    }
                    translated = true;
                  }
                }
                
                // 如果进化字典中没找到，在所有字典中查找
                if (!translated) {
                  for (const dict of allDictionaries) {
                    if (dict[baseText] || dict[baseTextUpper]) {
                      const key = dict[baseText] ? baseText : baseTextUpper;
                      const dictValue = dict[key];
                      const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
                      const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                      const source = getSourceValue(selectedEntry);
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          textElement.textContent = `${translation || key} (${key})${suffix}`;
                          break;
                        case 1: // 来源中文
                          textElement.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                          break;
                        case 3: // 【来源】中文（英文）
                          textElement.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                          break;
                      }
                      translated = true;
                      break;
                    }
                  }
                }
                
                textElement.dataset.oaoEvoNameTranslated = 'true';
              }
            }
          }
        });
        
        // 处理 DNA 图标旁边的进化名称（如 Pinged Pass+）
        // 选择器：包含 border-dashed border-evo/50 的 div，内部有 lucide-dna 图标和 truncate span
        const dnaEvoItems = root.querySelectorAll('div.border-dashed.border-evo\\/50');
        dnaEvoItems.forEach(item => {
          const dnaSvg = item.querySelector('svg.lucide-dna');
          if (dnaSvg) {
            const truncateSpan = item.querySelector('span.truncate');
            if (truncateSpan && !truncateSpan.dataset.oaoFutggEvoProcessed) {
              const text = truncateSpan.textContent.trim();
              // 在英语格式下，不做任何处理，直接保留原英文
              if (evolutionFormat === 2) {
                truncateSpan.dataset.oaoFutggEvoProcessed = 'true';
                truncateSpan.dataset.oaoTranslated = 'true';
                return;
              }
              if (text && /^[A-Za-z]/.test(text) && !text.includes('的') && !text.includes('版')) {
                const suffixMatch = text.match(/\s*\[[^\]]+\]$/);
                let baseText = text;
                let suffix = '';
                if (suffixMatch) {
                  baseText = text.replace(suffixMatch[0], '').trim();
                  suffix = suffixMatch[0];
                }
                
                const baseTextUpper = baseText.toUpperCase();
                let translated = false;
                
                for (const dict of allDictionaries) {
                  if (dict[baseText] || dict[baseTextUpper]) {
                    const key = dict[baseText] ? baseText : baseTextUpper;
                    const dictValue = dict[key];
                    const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
                    const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                    const source = getSourceValue(selectedEntry);
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        truncateSpan.textContent = `${translation || key} (${key})${suffix}`;
                        break;
                      case 1: // 来源中文
                        truncateSpan.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                        break;
                      case 2: // 英文
                        truncateSpan.textContent = key + suffix;
                        break;
                    }
                    translated = true;
                    break;
                  }
                }
                
                // 样式调整：移除省略号，允许完整显示
                truncateSpan.classList.remove('truncate');
                truncateSpan.style.whiteSpace = 'normal';
                truncateSpan.style.overflow = 'visible';
              }
              truncateSpan.dataset.oaoFutggEvoProcessed = 'true';
              truncateSpan.dataset.oaoTranslated = 'true';
            }
          }
        });
      }

      // 针对 futgg evo-lab/ 及 evo-lab/evolve 抽屉标题（drawer-title h2，含 DNA 图标 + 进化名称文本）的专门处理
      // 需求：中英 / 来源中文 / 来源中英 模式统一显示为「中文（英文）」，英文模式保持英文
      // 作用于 evo-lab 主页面和 evo-lab/evolve 页面的进化抽屉标题
      if (isFutggEvoLabPage) {
        const drawerTitleH2s = root.querySelectorAll('h2[data-slot="drawer-title"]');
        drawerTitleH2s.forEach(h2 => {
          if (h2.dataset.oaoFutggDrawerTitleProcessed === 'true') return;
          // 仅处理包含 DNA 图标的抽屉标题（即进化名称）
          if (!h2.querySelector('svg.lucide-dna')) return;

          // 提取直接文本节点（排除 svg 等子元素），拼接第一个/全部文本节点
          let rawText = '';
          for (const child of h2.childNodes) {
            if (child.nodeType === Node.TEXT_NODE) rawText += child.textContent;
          }
          rawText = rawText.trim();
          if (!rawText) {
            h2.dataset.oaoFutggDrawerTitleProcessed = 'true';
            return;
          }

          // 英文模式：保持原始英文，不翻译
          if (evolutionFormat === 2) {
            h2.dataset.oaoFutggDrawerTitleProcessed = 'true';
            h2.dataset.oaoTranslated = 'true';
            return;
          }

          // 匹配后缀（如 " [SP 25]"），保留到翻译结果中
          const suffixMatch = rawText.match(/\s*\[[^\]]+\]$/);
          let baseText = rawText;
          let suffix = '';
          if (suffixMatch) {
            baseText = rawText.replace(suffixMatch[0], '').trim();
            suffix = suffixMatch[0];
          }

          const baseTextUpper = baseText.toUpperCase();
          let finalText = null;

          if (options && options.evolutionDictionary) {
            const evoKey = findEvolutionKey(options.evolutionDictionary, baseText, suffix);
            if (evoKey) {
              const key = evoKey;
              const dictValue = options.evolutionDictionary[key];
              const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
              const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
              // 有中文翻译则显示「中文（英文）」，否则保持英文
              if (translation && translation !== key) {
                finalText = `${translation} (${key})${suffix}`;
              }
            }
          }

          // 仅在能翻译时修改文本；无法翻译则保留原始英文
          if (finalText) {
            for (const child of h2.childNodes) {
              if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                child.textContent = finalText;
                break;
              }
            }
          }

          h2.dataset.oaoFutggDrawerTitleProcessed = 'true';
          h2.dataset.oaoTranslated = 'true';
        });
      }

      // 针对 futgg evo-lab/evolutions 页面的特定 HTML 格式进行特殊处理（在通用翻译之前执行）
      // 该格式为：<a> 包含 <h2>文本</h2>
      if (isFutggEvolutionsLabPage) {
        const evolutionLinks = root.querySelectorAll('a[href*="/evolutions/"]');
        evolutionLinks.forEach(link => {
          const h2 = link.querySelector('h2.font-bold') || link.querySelector('h2.text-lg');
          if (h2 && !h2.dataset.oaoFutggEvoProcessed) {
            let text = h2.textContent.trim();
            if (text) {
              const suffixMatch = text.match(/\s*\[[^\]]+\]$/);
              let baseText = text;
              let suffix = '';
              if (suffixMatch) {
                baseText = text.replace(suffixMatch[0], '').trim();
                suffix = suffixMatch[0];
              }
              let futggId = extractFutggEvoId(link);
              
              const baseTextUpper = baseText.toUpperCase();
              let translated = false;
              
              if (futggId && options.evolutionDictionary) {
                const found = findEvolutionById(options.evolutionDictionary, futggId, 'futgg_id');
                if (found) {
                  const dictValue = found.entry;
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, found.key);
                  switch (evolutionFormat) {
                    case 0:
                      h2.textContent = `${translation || found.key} (${found.key})${suffix}`;
                      break;
                    case 1:
                      h2.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || found.key}${suffix}`;
                      break;
                    case 2:
                      h2.textContent = found.key + suffix;
                      break;
                    case 3:
                      h2.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || found.key} (${found.key})${suffix}`;
                      break;
                  }
                  translated = true;
                }
              }
              
              if (!translated && options.evolutionDictionary) {
                const evoKey = findEvolutionKey(options.evolutionDictionary, baseText, suffix);
                if (evoKey) {
                  const key = evoKey;
                  const dictValue = options.evolutionDictionary[key];
                  
                  if (futggId) {
                    if (Array.isArray(dictValue)) {
                      const matchedItem = dictValue.find(item => typeof item === 'object' && !item.futgg_id);
                      if (!matchedItem) {
                        const firstItem = dictValue[0];
                        if (firstItem && typeof firstItem === 'object') {
                          const translation = getTranslationValue(firstItem, options.useShortenTerms, key);
                          const source = firstItem.source || '';
                          switch (evolutionFormat) {
                            case 0:
                              h2.textContent = `${translation || key} (${key})${suffix}`;
                              break;
                            case 1:
                              h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                              break;
                            case 2:
                              h2.textContent = key + suffix;
                              break;
                            case 3:
                              h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                              break;
                          }
                          translated = true;
                        }
                      } else {
                        const translation = getTranslationValue(matchedItem, options.useShortenTerms, key);
                        const source = matchedItem.source || '';
                        switch (evolutionFormat) {
                          case 0:
                            h2.textContent = `${translation || key} (${key})${suffix}`;
                            break;
                          case 1:
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                            break;
                          case 2:
                            h2.textContent = key + suffix;
                            break;
                          case 3:
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                            break;
                        }
                        translated = true;
                      }
                    } else if (typeof dictValue === 'object') {
                      if (!dictValue.futgg_id) {
                        const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                        const source = dictValue.source || '';
                        switch (evolutionFormat) {
                          case 0:
                            h2.textContent = `${translation || key} (${key})${suffix}`;
                            break;
                          case 1:
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                            break;
                          case 2:
                            h2.textContent = key + suffix;
                            break;
                          case 3:
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                            break;
                        }
                        translated = true;
                      }
                    } else {
                      switch (evolutionFormat) {
                        case 0:
                          h2.textContent = `${dictValue} (${key})${suffix}`;
                          break;
                        case 1:
                          h2.textContent = `${dictValue}${suffix}`;
                          break;
                        case 2:
                          h2.textContent = key + suffix;
                          break;
                        case 3:
                          h2.textContent = `${dictValue} (${key})${suffix}`;
                          break;
                      }
                      translated = true;
                    }
                  } else {
                    if (Array.isArray(dictValue)) {
                      const firstItem = dictValue[0];
                      if (firstItem && typeof firstItem === 'object') {
                        const translation = getTranslationValue(firstItem, options.useShortenTerms, key);
                        const source = firstItem.source || '';
                        switch (evolutionFormat) {
                          case 0:
                            h2.textContent = `${translation || key} (${key})${suffix}`;
                            break;
                          case 1:
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                            break;
                          case 2:
                            h2.textContent = key + suffix;
                            break;
                          case 3:
                            h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                            break;
                        }
                      } else {
                        h2.textContent = key + suffix;
                      }
                    } else if (typeof dictValue === 'object') {
                      const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                      const source = dictValue.source || '';
                      switch (evolutionFormat) {
                        case 0:
                          h2.textContent = `${translation || key} (${key})${suffix}`;
                          break;
                        case 1:
                          h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key}${suffix}`;
                          break;
                        case 2:
                          h2.textContent = key + suffix;
                          break;
                        case 3:
                          h2.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})${suffix}`;
                          break;
                      }
                    } else {
                      switch (evolutionFormat) {
                        case 0:
                          h2.textContent = `${dictValue} (${key})${suffix}`;
                          break;
                        case 1:
                          h2.textContent = `${dictValue}${suffix}`;
                          break;
                        case 2:
                          h2.textContent = key + suffix;
                          break;
                        case 3:
                          h2.textContent = `${dictValue} (${key})${suffix}`;
                          break;
                      }
                    }
                    translated = true;
                  }
                }
              }
              
              if (!translated) {
                if (futggId) {
                  for (const dict of allDictionaries) {
                    const found = findEvolutionById(dict, futggId, 'futgg_id');
                    if (found) {
                      const dictValue = found.entry;
                      const translation = getTranslationValue(dictValue, options.useShortenTerms, found.key);
                      switch (evolutionFormat) {
                        case 0:
                          h2.textContent = `${translation || found.key} (${found.key})${suffix}`;
                          break;
                        case 1:
                          h2.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || found.key}${suffix}`;
                          break;
                        case 2:
                          h2.textContent = found.key + suffix;
                          break;
                        case 3:
                          h2.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || found.key} (${found.key})${suffix}`;
                          break;
                      }
                      translated = true;
                      break;
                    }
                  }
                }
                
                if (!translated) {
                  for (const dict of allDictionaries) {
                    if (dict[baseText] || dict[baseTextUpper]) {
                      const key = dict[baseText] ? baseText : baseTextUpper;
                      const dictValue = dict[key];
                      const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                      switch (evolutionFormat) {
                        case 0:
                          h2.textContent = `${translation || key} (${key})${suffix}`;
                          break;
                        case 1:
                          h2.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || key}${suffix}`;
                          break;
                        case 2:
                          h2.textContent = key + suffix;
                          break;
                      }
                      translated = true;
                      break;
                    }
                    if (!translated && (evolutionFormat === 0 || evolutionFormat === 2 || evolutionFormat === 3)) {
                      const reverseResult = reverseLookupEvolution(dict, baseText, futggId, 'futgg_id', options);
                      if (reverseResult) {
                        switch (evolutionFormat) {
                          case 0:
                            h2.textContent = `${reverseResult.translation} (${reverseResult.key})${suffix}`;
                            break;
                          case 1:
                            h2.textContent = `${reverseResult.translation}${suffix}`;
                            break;
                          case 2:
                            h2.textContent = reverseResult.key + suffix;
                            break;
                          case 3:
                            h2.textContent = `${reverseResult.translation} (${reverseResult.key})${suffix}`;
                            break;
                        }
                        translated = true;
                      }
                      if (translated) break;
                    }
                  }
                }
              }
              
              h2.dataset.oaoFutggEvoProcessed = 'true';
              h2.dataset.oaoTranslated = 'true';
            }
          }
        });
      }

      // 针对 futgg 首页/普通列表页中的「进化内容卡片」（如首页 "热门内容"/"新内容" 区块的进化卡）
      // 卡片结构：<a href="/evolutions/2481-grounded-guardian/"> ... <h3>进化名称</h3></a>
      // 这些卡片位于普通 futgg 页面，通用批处理循环默认排除进化字典（dictsForElement = allDictionariesWithoutEvo），
      // 故在此用 options.evolutionDictionary 专门翻译进化卡标题，使其能读取进化字典。
      // 跳过已有专用块处理的页面（/evolutions/ 列表、evo-lab/evolutions、gg-club、players/.../evolutions），避免重复/冲突。
      const isFutggEvoCardHandledElsewhere = isFutggEvolutionsPage || isFutggEvolutionsLabPage ||
        isFutggGgClubEvolutionsPage || isFutggPlayerEvolutionsPage;
      if (!isFutggEvoCardHandledElsewhere && options && options.evolutionDictionary && evolutionFormat !== 2) {
        const evoCardLinks = root.querySelectorAll('a[href*="/evolutions/"]');
        evoCardLinks.forEach(link => {
          // evo-lab/evolve 的进化名按钮已由其他专用块处理
          if (isFutggEvolvePage && link.closest(':is(button,div).text-evo')) return;
          const titleEl = link.querySelector('h3') || link.querySelector('h2.font-bold') || link.querySelector('h2.text-lg');
          if (!titleEl || titleEl.dataset.oaoFutggEvoProcessed === 'true') return;
          const text = titleEl.textContent.trim();
          if (!text) return;

          // 英文模式：保持原始英文
          if (evolutionFormat === 2) {
            titleEl.dataset.oaoFutggEvoProcessed = 'true';
            titleEl.dataset.oaoTranslated = 'true';
            return;
          }

          // 匹配后缀（如 " [SP 25]"），保留到翻译结果中
          const suffixMatch = text.match(/\s*\[[^\]]+\]$/);
          let baseText = text;
          let suffix = '';
          if (suffixMatch) {
            baseText = text.replace(suffixMatch[0], '').trim();
            suffix = suffixMatch[0];
          }
          const baseTextUpper = baseText.toUpperCase();

          // 从卡片链接提取 futgg_id（兜底：closest('a') 失败时向上遍历祖先容器内的 <a>）
          let futggId = extractFutggEvoId(link);

          // 识别紧凑 token 行（如首页卡片顶部图标+名称行），其宽度很窄，
          // 需要去掉来源前缀和英文原名、允许换行，保证完整展示中文进化名
          function isCompactTokenRow(el) {
            const parent = el.parentElement;
            if (!parent) return false;
            if (!(parent.classList.contains('flex') && parent.classList.contains('items-center'))) return false;
            // 顶栏标题本身被截断，且旁边有图标（token 用 img，部分进化用 lucide SVG 如 lucide-dna text-evo）
            if (!el.classList.contains('truncate')) return false;
            const hasIcon = parent.querySelector(':scope > img, :scope > svg');
            return !!hasIcon;
          }
          function formatEvoTitle(title, translation, source, suffix, compactRow) {
            const showSource = !compactRow && source;
            const showOriginal = !compactRow;
            const base = translation || title;
            switch (evolutionFormat) {
              case 0:
                return showOriginal ? `${base} (${title})${suffix}` : `${base}${suffix}`;
              case 1:
                return `${showSource ? '【' + source + '】' : ''}${base}${suffix}`;
              case 3:
                return `${showSource ? '【' + source + '】' : ''}${base}${showOriginal ? ' (' + title + ')' : ''}${suffix}`;
              default:
                return showOriginal ? `${base} (${title})${suffix}` : `${base}${suffix}`;
            }
          }
          function applyCompactRowStyle(el, compactRow) {
            if (compactRow) {
              el.classList.remove('truncate');
              el.classList.add('whitespace-normal', 'break-words');
            }
          }

          let translated = false;
          const compactRow = isCompactTokenRow(titleEl);

          // 优先按 futgg_id 精确匹配
          if (futggId) {
            const found = findEvolutionById(options.evolutionDictionary, futggId, 'futgg_id');
            if (found) {
              const dictValue = found.entry;
              const translation = getTranslationValue(dictValue, options.useShortenTerms, found.key);
              const source = getSourceValue(dictValue);
              titleEl.textContent = formatEvoTitle(found.key, translation, source, suffix, compactRow);
              applyCompactRowStyle(titleEl, compactRow);
              translated = true;
            }
          }

          // 按名称在进化字典中查找
          if (!translated) {
            const evoKey = findEvolutionKey(options.evolutionDictionary, baseText, suffix);
            if (evoKey) {
              const key = evoKey;
              const dictValue = options.evolutionDictionary[key];
              const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futgg_id');
              const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
              const source = getSourceValue(selectedEntry);
              titleEl.textContent = formatEvoTitle(key, translation, source, suffix, compactRow);
              applyCompactRowStyle(titleEl, compactRow);
              translated = true;
            }
          }

          if (translated) {
            titleEl.dataset.oaoFutggEvoProcessed = 'true';
            titleEl.dataset.oaoTranslated = 'true';
          }
        });
      }

      // FUTGG 翻译关闭时（例如 evo-lab 页面只需要进化名称翻译）
      // 跳过通用批处理循环，避免误翻译特技、角色、六项数据、基础术语等通用字典内容
      // 仅保留上方各页面专用的进化名称处理逻辑
      if (options && options.skipGeneralTranslation) {
        return;
      }

      // 优化选择器，只选择可能包含文本的元素
      // 进一步限制选择器范围，只选择最常用的元素类型
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label, th, td');
      let translatedCount = 0;
      
      // 使用分批处理，避免一次性处理太多元素导致卡顿
      const BATCH_SIZE = 50; // 每批处理50个元素
      let currentIndex = 0;
      
      function processBatch() {
        const endIndex = Math.min(currentIndex + BATCH_SIZE, elements.length);

        // 预先计算过滤后的字典列表，避免每次循环都创建新数组
        const allDictionariesWithoutEvo = options.evolutionDictionary 
          ? allDictionaries.filter(dict => dict !== options.evolutionDictionary) 
          : allDictionaries;

        for (let i = currentIndex; i < endIndex; i++) {
        const element = elements[i];
        // 跳过已翻译的元素，避免重复翻译
        if (element.dataset.oaoTranslated === 'true') {
          continue;
        }

        // 检测元素是否在下拉菜单内
        const isInDropdown = !!element.closest('.dropdown-menu');
        // futgg 普通页面（非进化/evo-lab 类页面）的常规内容（含导航与侧边栏）只读取 futgg 字典，
        // 不读取进化字典；进化名称由专用块通过 options.evolutionDictionary 直接处理，不进入通用批处理字典集。
        // 进化/evo-lab 类页面保留 allDictionaries（含进化字典）以维持原有进化名兜底翻译，避免回归。
        const isEvoContentPage = isFutggEvolutionsPage || isFutggEvoLabPage || isFutggEvolvePage ||
          isFutggPlayerEvolutionsPage || isFutggGgClubEvolutionsPage || isEvolutionsPage || isFutggYourUpgradesPage;
        const dictsForElement = isEvoContentPage ? allDictionaries : allDictionariesWithoutEvo;

        // 跳过侧边栏按钮，避免翻译按钮文字
        if (element.classList.contains('oaevo-sidebar-btn')) {
          continue;
        }

        // 跳过翻译管理弹窗内的元素
        if (isInTranslationModal(element)) {
          continue;
        }

        // 跳过 futgg evolutions 页面的特殊 HTML 格式元素
        // 这些元素由专门的代码处理，避免重复翻译导致闪烁
        if (isFutggEvolutionsPage) {
          const closestWrapper = element.closest('.bg-gray-900.rounded');
          if (closestWrapper && closestWrapper.querySelector('h2.font-bold')) {
            continue;
          }
          // 跳过详情页的 h1.text-3xl.font-bold 进化标题
          if (element.tagName === 'H1' && element.classList.contains('text-3xl') && element.classList.contains('font-bold')) {
            continue;
          }
        }

        // 跳过 futgg evo-lab/your-upgrades 页面的特殊 HTML 格式元素
        if (isFutggYourUpgradesPage) {
          const closestItem = element.closest('div.bg-gray-900.rounded-md.flex.items-center.justify-between.flex-wrap.p-2.text-sm.gap-2.font-bold.grow');
          if (closestItem) {
            continue;
          }
        }

        // 跳过 futgg evo-lab/evolve 页面的特殊 HTML 格式元素
        if (isFutggEvolvePage) {
          const closestButton = element.closest(':is(button,div).text-evo');
          if (closestButton) {
            continue;
          }
        }

        // 跳过 futgg evo-lab/evolutions 页面的特殊 HTML 格式元素
        if (isFutggEvolutionsLabPage) {
          const closestLink = element.closest('a[href*="/evolutions/"]');
          if (closestLink) {
            continue;
          }
        }

        // 跳过 futgg players/***/evolutions 页面的特殊 HTML 格式元素
        if (isFutggPlayerEvolutionsPage) {
          const closestItem = element.closest('div.flex.items-center.w-full.gap-2');
          if (closestItem) {
            continue;
          }
        }

        // 跳过 futgg evo-lab/evolve 页面的 p.text-xs.uppercase.font-bold 格式元素
        if (isFutggEvolvePage) {
          const closestP = element.closest('p.text-xs.uppercase.font-bold');
          if (closestP) {
            continue;
          }
        }

        // 跳过 futgg evo-lab/evolve 页面的进化名称容器元素
        if (isFutggEvolvePage) {
          const closestEvoName = element.closest('div.bg-gray-900.rounded-md.font-bold.text-xs.overflow-hidden');
          if (closestEvoName) {
            continue;
          }
        }

        // 只在 evo-lab/evolutions 页面跳过球员六项数据（速度、射门、传球、盘带、防守、身体）
        // 这些数据在页面中重复出现，且已经通过 translateWithDictionaries 翻译
        if (isEvolutionsPage && (element.className.includes('font-cruyff-condensed-medium') || 
            element.className.includes('font-cruyff-condensed-numbers-medium'))) {
          continue;
        }
        
        // 检查元素是否包含 <a> 标签，如果包含，跳过翻译
        // 因为 <a> 标签内的文本会单独被翻译
        if (element.querySelector('a')) {
          continue;
        }
        
        // 检查是否包含已翻译的子元素，跳过父元素避免重复翻译
        const hasTranslatedChildren = Array.from(element.children).some(child => 
          child.dataset.oaoTranslated === 'true'
        );
        if (hasTranslatedChildren) {
          continue;
        }
        
        // 检查元素是否有子元素（除了文本节点）
        // 如果有子元素，继续处理，因为可能包含 SVG + 文本的组合
        const hasElementChildren = element.children.length > 0;
        
        // 获取元素的直接文本节点内容（不包括子元素的文本）
        const directTextNodes = [];
        for (let j = 0; j < element.childNodes.length; j++) {
          const child = element.childNodes[j];
          if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            directTextNodes.push(child.textContent.trim());
          }
        }
        const directText = directTextNodes.join(' ').trim();
        
        // 特殊处理：属性提升标签（如 +25 Jumping, +20 Vision, +15 OVR 等）
        // 这些标签的特征：class 包含 bg-gray、rounded
        const isStatBoostTag = element.tagName === 'DIV' && 
                               element.classList.contains('bg-gray') && 
                               element.classList.contains('rounded');
        
        // 处理包含 SVG 的元素（如 <a><svg/>Evo Lab</a> 或 <div><svg/>+4 WF</div>）
        let hasDirectSvg = false;
        for (let j = 0; j < element.children.length; j++) {
          if (element.children[j].tagName === 'SVG') {
            hasDirectSvg = true;
            break;
          }
        }
        
        // 处理没有直接文本但有子元素的情况（确保跳过空元素）
        // 注意：需要排除特殊标签和包含 SVG 的元素，因为它们可能没有直接文本但需要翻译
        if (hasElementChildren && !directText && !isStatBoostTag && !hasDirectSvg) {
          // 标记为空父元素，避免后续重复处理
          element.dataset.oaoTranslated = 'true';
          continue;
        }
        
        if (isStatBoostTag) {
          // 获取直接文本节点内容
          const textNodes = [];
          for (let j = 0; j < element.childNodes.length; j++) {
            const child = element.childNodes[j];
            if (child.nodeType === Node.TEXT_NODE) {
              textNodes.push(child.textContent.trim());
            }
          }
          const text = textNodes.join(' ').trim();
          
          if (text) {
            // 处理HTML实体
            const normalizedText = text.replace(/&amp;/g, '&');
            
            // 匹配格式: +数字 + 可选空格 + 英文（如 +25 Jumping, +15OVR, +4 WF, + 40 Jumping）
            // 英文部分可能包含空格（如 Shot Power）
            // 注意：+ 和数字之间可能有空格（如 "+ 40 Jumping"）
            const boostMatch = normalizedText.match(/^\+\s*(\d+)\s*([a-zA-Z\s\.]+)$/);
            
            if (boostMatch) {
              const number = boostMatch[1];  // "25" 或 "15"
              const englishText = boostMatch[2].trim();  // "Jumping" 或 "OVR"
              const englishTextUpper = englishText.toUpperCase();
              const prefix = '+' + number;  // "+25" 或 "+15"
              
              // 在所有字典中查找翻译
              let found = false;
              for (let k = 0; k < dictsForElement.length; k++) {
                const dict = dictsForElement[k];
                if (dict[englishText] || dict[englishTextUpper]) {
                  const key = dict[englishText] ? englishText : englishTextUpper;
                  const dictValue = dict[key];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  const finalTranslation = prefix + ' ' + translation;
                  
                  // 替换文本节点，保留子元素
                  let textNodeIndex = 0;
                  for (let j = 0; j < element.childNodes.length; j++) {
                    const child = element.childNodes[j];
                    if (child.nodeType === Node.TEXT_NODE) {
                      if (child.textContent.trim()) {
                        if (textNodeIndex === 0) {
                          child.textContent = finalTranslation;
                        } else {
                          child.textContent = '';  // 清空其他文本节点
                        }
                      }
                      textNodeIndex++;
                    }
                  }
                  element.dataset.oaoTranslated = 'true';
                  translatedCount++;
                  continue;  // 处理完成，跳过后续代码
                }
              }
            }
            // 如果没有匹配到 +数字 格式，尝试完整匹配
            else {
              const textUpper = normalizedText.toUpperCase();
              for (let k = 0; k < dictsForElement.length; k++) {
                const dict = dictsForElement[k];
                if (dict[normalizedText] || dict[textUpper]) {
                  const key = dict[normalizedText] ? normalizedText : textUpper;
                  const dictValue = dict[key];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  
                  for (let j = 0; j < element.childNodes.length; j++) {
                    const child = element.childNodes[j];
                    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                      child.textContent = translation;
                    }
                  }
                  element.dataset.oaoTranslated = 'true';
                  translatedCount++;
                  continue;  // 处理完成，跳过后续代码
                }
              }
            }
          }
        }
        
        // 处理包含 SVG 的元素（如 <a><svg/>Evo Lab</a> 或 <div><svg/>+4 WF</div>）
        if (hasDirectSvg) {
          // 获取当前元素的直接文本节点内容
          const textNodes = [];
          for (let j = 0; j < element.childNodes.length; j++) {
            const child = element.childNodes[j];
            if (child.nodeType === Node.TEXT_NODE) {
              textNodes.push(child.textContent.trim());
            }
          }
          const text = textNodes.join(' ').trim();
          
          if (text) {
            // 处理HTML实体
            const normalizedText = text.replace(/&amp;/g, '&');
            
            // 匹配格式: +数字 + 可选空格 + 英文
            const boostMatch = normalizedText.match(/^(\+\d+)\s*(.+)$/);
            if (boostMatch) {
              const prefix = boostMatch[1];
              const englishText = boostMatch[2].trim();
              const englishTextUpper = englishText.toUpperCase();
              
              for (let k = 0; k < dictsForElement.length; k++) {
                const dict = dictsForElement[k];
                if (dict[englishText] || dict[englishTextUpper]) {
                  const key = dict[englishText] ? englishText : englishTextUpper;
                  const dictValue = dict[key];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  const finalTranslation = prefix + ' ' + translation;
                  
                  for (let j = 0; j < element.childNodes.length; j++) {
                    const child = element.childNodes[j];
                    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                      child.textContent = finalTranslation;
                    }
                  }
                  element.dataset.oaoTranslated = 'true';
                  translatedCount++;
                  continue;  // 处理完成，跳过后续代码
                }
              }
            }
            
            // 尝试匹配带有后缀的进化名称（如 "Architect of Play [SP+ 4]"）
            const suffixMatch = normalizedText.match(/\s*\[[^\]]+\]$/);
            if (suffixMatch) {
              const baseText = normalizedText.replace(suffixMatch[0], '').trim();
              const baseTextUpper = baseText.toUpperCase();
              // 首先在进化字典中查找
              if (options.evolutionDictionary) {
                const evoKey = findEvolutionKey(options.evolutionDictionary, baseText, suffix);
                if (evoKey) {
                  const key = evoKey;
                  const dictValue = options.evolutionDictionary[key];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  const finalTranslation = translation + suffixMatch[0];
                  
                  for (let j = 0; j < element.childNodes.length; j++) {
                    const child = element.childNodes[j];
                    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                      child.textContent = finalTranslation;
                    }
                  }
                  
                  element.dataset.oaoTranslated = 'true';
                  translatedCount++;
                  continue;  // 处理完成，跳过后续代码
                }
              }
              // 然后在所有字典中查找
              for (let k = 0; k < dictsForElement.length; k++) {
                const dict = dictsForElement[k];
                if (dict[baseText] || dict[baseTextUpper]) {
                  const key = dict[baseText] ? baseText : baseTextUpper;
                  const dictValue = dict[key];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  const finalTranslation = translation + suffixMatch[0];
                  
                  for (let j = 0; j < element.childNodes.length; j++) {
                    const child = element.childNodes[j];
                    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                      child.textContent = finalTranslation;
                    }
                  }
                  
                  element.dataset.oaoTranslated = 'true';
                  translatedCount++;
                  continue;  // 处理完成，跳过后续代码
                }
              }
            }
            
            // 尝试完整匹配（如 "Evo Lab"）
            const textUpper = normalizedText.toUpperCase();
            for (let k = 0; k < dictsForElement.length; k++) {
              const dict = dictsForElement[k];
              if (dict[normalizedText] || dict[textUpper]) {
                const key = dict[normalizedText] ? normalizedText : textUpper;
                const dictValue = dict[key];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                
                for (let j = 0; j < element.childNodes.length; j++) {
                  const child = element.childNodes[j];
                  if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                    child.textContent = translation;
                  }
                }
                
                element.dataset.oaoTranslated = 'true';
                translatedCount++;
                continue;  // 处理完成，跳过后续代码
              }
            }
          }
        }
        
        // 处理HTML实体，将&amp;转换为&
        const normalizedDirectText = directText.replace(/&amp;/g, '&');
        const directTextUpper = normalizedDirectText.toUpperCase();
        
        // 尝试在所有字典中查找翻译
        let foundTranslation = false;
        for (let k = 0; k < dictsForElement.length; k++) {
          const dict = dictsForElement[k];
          // 首先尝试直接文本匹配（不包括子元素的文本）
          if (normalizedDirectText && (dict[normalizedDirectText] || dict[directTextUpper])) {
            const key = dict[normalizedDirectText] ? normalizedDirectText : directTextUpper;
            const dictValue = dict[key];
            const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
            const source = getSourceValue(dictValue);
            
            // 只替换直接文本节点，保留子元素
            for (let j = 0; j < element.childNodes.length; j++) {
              const child = element.childNodes[j];
              if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                // 检查翻译是否来自进化字典
                const isEvolutionTranslation = options.evolutionDictionary && dict === options.evolutionDictionary;
                if (isEvolutionTranslation) {
                  // 根据进化格式设置决定显示方式
                  switch (evolutionFormat) {
                  case 0: // 中文（英文）
                    child.textContent = `${translation} (${normalizedDirectText})`;
                    break;
                  case 1: // 来源中文
                    child.textContent = `${source ? '【' + source + '】' : ''}${translation || key}`;
                    break;
                  case 2: // 英文
                    child.textContent = normalizedDirectText;
                    break;
                }
                } else {
                  // 其他字典的翻译直接显示中文
                  child.textContent = translation;
                }
              }
            }

            foundTranslation = true;
            break;
          }
          // 尝试去除后缀后匹配（如 [SP 24], [SP+ 26], [SP+ 4], [SP 3]）
          else if (normalizedDirectText) {
            // 匹配后缀模式 - 更通用的匹配，支持各种括号内的内容
            const suffixMatch = normalizedDirectText.match(/\s*\[[^\]]+\]$/);
            if (suffixMatch) {
              const baseText = normalizedDirectText.replace(suffixMatch[0], '').trim();
              const baseTextUpper = baseText.toUpperCase();
              // 首先在进化字典中查找
              if (options.evolutionDictionary && !isInDropdown) {
                const evoKey = findEvolutionKey(options.evolutionDictionary, baseText, suffix);
                if (evoKey) {
                  const key = evoKey;
                  const dictValue = options.evolutionDictionary[key];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  const source = getSourceValue(dictValue);
                  
                  // 只替换直接文本节点，保留子元素
                  for (let j = 0; j < element.childNodes.length; j++) {
                    const child = element.childNodes[j];
                    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                      // 根据进化格式设置决定显示方式
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          child.textContent = `${translation || baseText} (${baseText})${suffixMatch[0]}`;
                          break;
                        case 1: // 来源中文
                          child.textContent = `${source ? '【' + source + '】' : ''}${translation}${suffixMatch[0]}`;
                          break;
                        case 2: // 英文
                          child.textContent = normalizedDirectText;
                          break;
                      }
                    }
                  }
                  
                  foundTranslation = true;
                  break;
                }
              }
              // 然后在当前字典中查找
              if (!foundTranslation && (dict[baseText] || dict[baseTextUpper])) {
                const key = dict[baseText] ? baseText : baseTextUpper;
                const dictValue = dict[key];
                const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                const source = getSourceValue(dictValue);
                
                // 只替换直接文本节点，保留子元素
                for (let j = 0; j < element.childNodes.length; j++) {
                  const child = element.childNodes[j];
                  if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                    // 检查翻译是否来自进化字典
                    const isEvolutionTranslation = options.evolutionDictionary && dict === options.evolutionDictionary;
                    if (isEvolutionTranslation) {
                      // 根据进化格式设置决定显示方式
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          child.textContent = `${translation || baseText} (${baseText})${suffixMatch[0]}`;
                          break;
                        case 1: // 来源中文
                          child.textContent = `${source ? '【' + source + '】' : ''}${translation || baseText}${suffixMatch[0]}`;
                          break;
                        case 2: // 英文
                          child.textContent = normalizedDirectText;
                          break;
                      }
                    } else {
                      // 其他字典的翻译直接显示中文
                      child.textContent = (translation || normalizedDirectText) + suffixMatch[0];
                    }
                  }
                }
                
                foundTranslation = true;
                break;
              }
            }
          }
        }
        
        if (!foundTranslation && normalizedDirectText) {
          // 使用已经获取的 directTextNodes，不再重复获取
          const normalizedText = normalizedDirectText;
          const textUpper = directTextUpper;
          
          // 尝试在所有字典中查找翻译
          for (let k = 0; k < dictsForElement.length; k++) {
            const dict = dictsForElement[k];
            if (normalizedText && (dict[normalizedText] || dict[textUpper])) {
              const key = dict[normalizedText] ? normalizedText : textUpper;
              const dictValue = dict[key];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
              
              // 只替换直接文本节点，保留子元素
              for (let j = 0; j < element.childNodes.length; j++) {
                const child = element.childNodes[j];
                if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                  child.textContent = translation;
                }
              }

              foundTranslation = true;
              break;
            }
          }
        }
        
        if (!foundTranslation) {
          // 特殊处理 Evolutions 相关的短语
          const text = element.textContent.trim();
          if (text) {
            const textUpper = text.toUpperCase();
            // 检查是否是 Evolutions 相关的短语
            if (textUpper === 'ELIGIBLE EVOLUTIONS' || 
                textUpper === 'ACTIVE EVOLUTIONS' || 
                textUpper === 'USED EVOLUTIONS' || 
                textUpper === 'ALL EVOLUTIONS') {
              // 在所有字典中查找翻译
              for (let k = 0; k < dictsForElement.length; k++) {
                const dict = dictsForElement[k];
                if (dict[textUpper]) {
                  const dictValue = dict[textUpper];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, textUpper);
                  // 替换所有文本节点内容
                  for (let j = 0; j < element.childNodes.length; j++) {
                    const child = element.childNodes[j];
                    if (child.nodeType === Node.TEXT_NODE) {
                      child.textContent = translation;
                    }
                  }

                  foundTranslation = true;
                  break;
                }
              }
            }
          }
        }
        
        if (foundTranslation) {
          // 标记为已翻译，避免重复处理
          element.dataset.oaoTranslated = 'true';
          translatedCount++;
        }
      }
      
      currentIndex = endIndex;
      
      // 如果还有元素需要处理，继续处理下一批
      if (currentIndex < elements.length) {
        // 使用 setTimeout 让出主线程，避免阻塞
        setTimeout(processBatch, 0);
      } else {
        // 处理角色名称（使用 roleTranslator）
        const rolesDictionary = allDictionaries.find(dict => dict['Fullback']);
        if (rolesDictionary) {
          roleTranslator.translate(root, rolesDictionary, options);
        }
        
        if (translatedCount > 0) {
          // log('info', 'futggTranslator 翻译完成，共翻译了', translatedCount, '个元素');
        }
        
        // 分批处理完成，清除翻译标记
        if (root === document && root.dataset) {
          delete root.dataset.oaoTranslating;
        }
      }
    }
    
    // 设置翻译标记，避免 MutationObserver 在分批处理过程中触发
    if (root === document && root.dataset) {
      root.dataset.oaoTranslating = 'true';
    }
    
    // 开始处理第一批元素
    processBatch();
    },
    isTargetPage: function() {
      return window.location.hostname.includes('fut.gg');
    }
  };

  // Futbin翻译器
  const futbinTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 合并所有字典
      // 进化字典优先于主字典，用于同名进化区分
      const allDictionaries = [];
      if (options && options.extraDictionaries) {
        allDictionaries.push(...options.extraDictionaries);
      }
      allDictionaries.push(dictionary);

      // 预先计算不包含进化字典的列表，用于下拉菜单等不需要进化字典的场景
      const evolutionDictIndex = allDictionaries.findIndex(d => d === options?.evolutionDictionary);
      const allDictionariesWithoutEvo = evolutionDictIndex !== -1 
        ? allDictionaries.filter((_, i) => i !== evolutionDictIndex) 
        : allDictionaries;

      // 页面检测
      // futbin 的 URL 带游戏版本前缀（如 /26/、/27/），检测需版本无关：
      //   - 进化列表页：https://www.futbin.com/27/evolutions
      //   - 进化详情页：https://www.futbin.com/27/evolutions/{futbin_id}/* （** 即 futbin id）
      const isFutbinEvolutionsPage = window.location.href.includes('/evolutions') && !window.location.href.includes('/builder');
      // 进化详情页：URL 形如 /{ver}/evolutions/{id}/...（带斜杠 + id，区别于列表页 /evolutions 本身、builder 页 /evolutions/builder/）
      // 用版本无关正则精确匹配，避免误命中 builder 页或列表页
      const isFutbinEvolutionDetailPage = /\/\d+\/evolutions\/\d+/.test(window.location.href) && !window.location.href.includes('/builder');
      const isFutbinPopularEvolutionsPage = window.location.href.includes('/popular/evolutions');
      // 球员页：版本无关，匹配 /{ver}/player/...（修复此前写死的 /26/player/ 在 FC27 下失效的问题）
      const isFutbinPlayerPage = /\/\d+\/player\//.test(window.location.pathname);
      const isFutbinPlayerEvolutionPage = window.location.href.includes('/player/') && window.location.href.includes('/evolution');
      const isFutbinEvolutionBuilderPage = window.location.href.includes('/evolutions/builder/');

      // 针对 futbin 页面的下拉菜单（如顶部菜单栏的 Squads 下拉菜单）进行特殊处理
      // 这些元素应该只使用通用字典翻译，不使用进化字典
      const dropdownMenus = root.querySelectorAll('.dropdown-menu');
      dropdownMenus.forEach(menu => {
        const textElements = menu.querySelectorAll('div, span, p, a, li');
        textElements.forEach(element => {
          if (element.dataset.oaoTranslated === 'true') {
            return;
          }
          const textNodes = [];
          for (let j = 0; j < element.childNodes.length; j++) {
            const child = element.childNodes[j];
            if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
              textNodes.push(child);
            }
          }
          if (textNodes.length === 0) {
            return;
          }
          const text = textNodes.map(n => n.textContent.trim()).join(' ').trim();
          if (!text) {
            return;
          }
          const textUpper = text.toUpperCase();
          let translated = false;
          for (const dict of allDictionariesWithoutEvo) {
            if (dict[text] || dict[textUpper]) {
              const key = dict[text] ? text : textUpper;
              const dictValue = dict[key];
              const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
              textNodes.forEach(node => {
                node.textContent = translation;
              });
              element.dataset.oaoTranslated = 'true';
              translated = true;
              break;
            }
          }
        });
      });

      // 针对 futbin 页面的进化分类标签进行特殊处理
      const evoCategoryPills = root.querySelectorAll('.evo-category-pill, .category-pill');
      evoCategoryPills.forEach(pill => {
        // 清除已翻译标记，确保重新处理
        delete pill.dataset.oaoTranslated;
        pill.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent.trim();
            // 优先使用字典进行翻译（不使用进化字典，分类标签应该使用通用字典翻译）
            let translated = false;
            for (const dict of allDictionariesWithoutEvo) {
              // 优先匹配完整字符串（保持原始大小写）
              if (dict[text]) {
                const dictValue = dict[text];
                const translation = getTranslationValue(dictValue, options.useShortenTerms, text);
                child.textContent = translation;
                translated = true;
                break;
              }
              // 如果原始大小写没有匹配到，再尝试全大写匹配
              const textUpper = text.toUpperCase();
              if (dict[textUpper]) {
                const dictValue = dict[textUpper];
                const translation = getTranslationValue(dictValue, options.useShortenTerms, textUpper);
                child.textContent = translation;
                translated = true;
                break;
              }
            }
            // 如果字典中没有找到翻译，使用硬编码的分类标签翻译
            if (!translated) {
              const categoryTranslations = {
                'All': '全部',
                'Expiring Soon': '即将过期',
                'Cosmetics': '外观',
                'Evolutions': '进化',
                'FoF: Pelé': 'FoF: 贝利',
                'PlayStyles Lab': '比赛风格实验室',
                'PlayStyles+ Lab': '比赛风格+实验室',
                'Rewards': '奖励',
                'Roles': '角色',
                'Training Camp': '训练营'
              };
              if (categoryTranslations[text]) {
                child.textContent = categoryTranslations[text];
                translated = true;
              }
            }
            pill.dataset.oaoTranslated = 'true';
          }
        });
      });

      // 针对 futbin /evolutions 列表/详情页卡片右上角的 evolution-badge 标签进行翻译
      // 例如 <div class="evolution-badge ...">Evolutions</div> / <div class="evolution-badge ...">New</div>
      // 注意：这些元素自身带 xs-row align-center 类，会被下方通用循环跳过（closest('div.xs-row.align-center') 命中自身），
      // 因此必须在此单独处理。仅翻译字典命中或已知 UI 标签，未知文本保持原样，不会误伤进化名。
      if (isFutbinEvolutionsPage || isFutbinPlayerEvolutionPage || isFutbinEvolutionDetailPage) {
        const evoBadges = root.querySelectorAll('.evolution-badge');
        evoBadges.forEach(badge => {
          if (badge.dataset.oaoTranslated === 'true') return;
          badge.childNodes.forEach(child => {
            if (child.nodeType !== Node.TEXT_NODE) return;
            const text = child.textContent.trim();
            if (!text) return;
            let translated = false;
            // 第一阶段：优先使用字典（不使用进化字典，标签用通用字典翻译）
            for (const dict of allDictionariesWithoutEvo) {
              if (dict[text]) {
                child.textContent = getTranslationValue(dict[text], options.useShortenTerms, text);
                translated = true;
                break;
              }
              const textUpper = text.toUpperCase();
              if (dict[textUpper]) {
                child.textContent = getTranslationValue(dict[textUpper], options.useShortenTerms, textUpper);
                translated = true;
                break;
              }
            }
            // 第二阶段：硬编码兜底（与分类标签 categoryTranslations 保持一致）
            if (!translated) {
              const badgeTranslations = {
                'Evolutions': '进化',
                'New': '新',
                'All': '全部',
                'Expiring Soon': '即将过期',
                'Cosmetics': '外观',
                'Rewards': '奖励',
                'Roles': '角色',
                'Training Camp': '训练营',
                'PlayStyles Lab': '比赛风格实验室',
                'PlayStyles+ Lab': '比赛风格+实验室'
              };
              if (badgeTranslations[text]) {
                child.textContent = badgeTranslations[text];
                translated = true;
              }
            }
            badge.dataset.oaoTranslated = 'true';
          });
        });
      }

      // 针对 futbin /evolutions 页面的特定 HTML 格式进行特殊处理
      // 该格式为：<div class="xs-row align-center"><div class="xs-font text-center">文本</div></div>
      // 注意：只处理真正的进化名称元素，跳过 div.evo-box-req 内的内容（如球员要求、进化提升等）
      if (isFutbinEvolutionsPage || isFutbinPlayerEvolutionPage) {
        const evoRows = root.querySelectorAll('div.xs-row.align-center');
        evoRows.forEach(row => {
          // 跳过 evo-box-req 内的元素，这些应该使用通用翻译器处理
          const isInsideEvoBoxReq = row.closest('div.evo-box-req');
          if (isInsideEvoBoxReq) {
            return;
          }
          
          const textDiv = row.querySelector('div.xs-font.text-center');
          if (textDiv) {
            // 检查是否需要重新处理：已标记但文本不符合预期格式
            const alreadyProcessed = textDiv.dataset.oaoFutbinEvoProcessed === 'true';
            const needsReprocess = alreadyProcessed && checkIfNeedsReprocess(textDiv.textContent.trim(), evolutionFormat);
            if (alreadyProcessed && !needsReprocess) {
              return;
            }
            let text = textDiv.textContent.trim();
            // 如果内层 div 为空，尝试从父级 div 获取文本（处理新的 HTML 结构）
            if (!text) {
              text = row.textContent.trim();
            }
            if (text) {
              // 检查是否包含 "-" 分隔符，格式为 "进化名字 - ***"
              const dashIndex = text.indexOf(' - ');
              let evoName = text;
              let suffix = '';
              if (dashIndex !== -1) {
                evoName = text.substring(0, dashIndex);
                suffix = text.substring(dashIndex); // 包含 "- " 部分
              }
              
              // 从父元素 <a> 标签提取 futbin_id
              const parentLink = row.closest('a');
              let futbinId = '';
              if (parentLink && parentLink.href) {
                const match = parentLink.href.match(/\/evolutions\/(\d+)/);
                if (match) {
                  futbinId = match[1];
                }
              }
              
              const evoNameUpper = evoName.toUpperCase();
              const fullTextUpper = text.toUpperCase();
              let translated = false;
              
              // 第一阶段：优先在所有字典中按 futbin_id 精确匹配
              if (futbinId) {
                for (const dict of allDictionaries) {
                  const found = findEvolutionById(dict, futbinId, 'futbin_id');
                  if (found) {
                    const dictValue = found.entry;
                    // console.log(`[OAO][同名ID追踪][FUTBIN] 按ID匹配成功 | 页面ID:${futbinId} | 英文名称:${found.key} | 条目:`, dictValue);
                    const translation = getTranslationValue(dictValue, options.useShortenTerms, found.key);
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        row.textContent = `${translation || found.key} (${found.key})`;
                        break;
                      case 1: // 来源中文
                        row.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || found.key}`;
                        break;
                      case 2: // 英文
                        row.textContent = found.key;
                        break;
                      case 3: // 【来源】中文（英文）
                        row.textContent = `${dictValue.source ? '【' + dictValue.source + '】' : ''}${translation || found.key} (${found.key})`;
                        break;
                    }
                    translated = true;
                    break;
                  }
                }
                if (!translated) {
                  // console.log(`[OAO][同名ID追踪][FUTBIN] 按ID未找到匹配 | 页面ID:${futbinId} | 页面文本:${text} | 进入名称匹配阶段`);
                }
              }
              
              // 第二阶段：按名称匹配（优先使用完整文本查找，再尝试 "-" 前的部分）
              if (!translated) {
                for (const dict of allDictionaries) {
                  // 优先尝试完整文本查找（包括 "-" 后面的部分）
                  let key = '';
                  let dictValue = null;
                  if (dict[text] || dict[fullTextUpper]) {
                    key = dict[text] ? text : fullTextUpper;
                    dictValue = dict[key];
                  } else if (dict[evoName] || dict[evoNameUpper]) {
                    // 如果完整文本没找到，再尝试 "-" 前面的部分
                    key = dict[evoName] ? evoName : evoNameUpper;
                    dictValue = dict[key];
                  }
                  
                  if (key && dictValue) {
                    // 如果页面元素有 futbin_id，名称匹配时只匹配没有配置 futbin_id 的条目
                    let selectedEntry = dictValue;
                    if (futbinId) {
                      if (Array.isArray(dictValue)) {
                        // 打印数组中所有条目的ID信息，方便调试
                        const allIds = dictValue.map(item => {
                          if (item && typeof item === 'object') {
                            return item.futbin_id || '(无ID-通用)';
                          }
                          return '(简单值)';
                        }).join(', ');
                        // console.log(`[OAO][同名ID追踪][FUTBIN] 名称匹配-数组格式 | 页面ID:${futbinId} | 英文名称:${key} | 数组中所有条目ID: [${allIds}]`);
                        
                        const matchedItem = dictValue.find(item => typeof item === 'object' && !item.futbin_id);
                        if (!matchedItem) {
                          // 没有找到无ID的通用条目时，使用数组中第一个条目
                          // console.log(`[OAO][同名ID追踪][FUTBIN] 名称匹配-使用第一个条目 | 页面ID:${futbinId} | 英文名称:${key} | 原因:数组中无通用条目`);
                          selectedEntry = dictValue[0];
                        } else {
                          // console.log(`[OAO][同名ID追踪][FUTBIN] 名称匹配-使用通用条目 | 页面ID:${futbinId} | 英文名称:${key} | 通用条目:`, matchedItem);
                          selectedEntry = matchedItem;
                        }
                      } else if (typeof dictValue === 'object') {
                        if (dictValue.futbin_id) {
                          // console.log(`[OAO][同名ID追踪][FUTBIN] 名称匹配-跳过 | 页面ID:${futbinId} | 英文名称:${key} | 原因:该条目有ID:${dictValue.futbin_id}`);
                          continue;
                        }
                        // console.log(`[OAO][同名ID追踪][FUTBIN] 名称匹配-使用通用条目 | 页面ID:${futbinId} | 英文名称:${key} | 通用条目:`, dictValue);
                      }
                    }
                    
                    // 获取翻译和来源
                    const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                    const source = getSourceValue(selectedEntry);
                    
                    // 翻译成功时，直接使用翻译结果，不附加后缀
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        row.textContent = `${translation || key} (${key})`;
                        break;
                      case 1: // 来源中文
                        row.textContent = `${source ? '【' + source + '】' : ''}${translation || key}`;
                        break;
                      case 2: // 英文
                        row.textContent = key;
                        break;
                      case 3: // 【来源】中文（英文）
                        row.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})`;
                        break;
                    }
                    translated = true;
                    break;
                  }
                  // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                  if (!translated && (evolutionFormat === 0 || evolutionFormat === 1 || evolutionFormat === 2 || evolutionFormat === 3)) {
                    const reverseResult = reverseLookupEvolution(dict, text, futbinId, 'futbin_id', options);
                    if (reverseResult) {
                      // console.log(`[OAO][同名ID追踪][FUTBIN] 反向查找匹配成功 | 页面ID:${futbinId} | 页面文本:${text} | 英文key:${reverseResult.key}`);
                      switch (evolutionFormat) {
                        case 0:
                          row.textContent = `${reverseResult.translation} (${reverseResult.key})`;
                          break;
                        case 1:
                          row.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}`;
                          break;
                        case 2:
                          row.textContent = reverseResult.key;
                          break;
                        case 3:
                          row.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})`;
                          break;
                      }
                      translated = true;
                    }
                    if (translated) break;
                  }
                }
              }
            }
            textDiv.dataset.oaoFutbinEvoProcessed = 'true';
            textDiv.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 futbin /popular/evolutions 页面的 og-pill-primary 格式进行特殊处理
      if (isFutbinPopularEvolutionsPage) {
        const evoPills = root.querySelectorAll('a.og-pill-primary');
        evoPills.forEach(pill => {
          if (!pill.dataset.oaoFutbinEvoProcessed) {
            const text = pill.textContent.trim();
            if (text) {
              const textUpper = text.toUpperCase();
              let translated = false;
              for (const dict of allDictionaries) {
                // 正向查找
                if (dict[text] || dict[textUpper]) {
                  const key = dict[text] ? text : textUpper;
                  const dictValue = dict[key];
                  // 优先选择无 futbin_id 的通用条目
                  const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futbin_id');
                  const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                  const source = getSourceValue(selectedEntry);
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      pill.textContent = `${translation || key} (${key})`;
                      break;
                    case 1: // 来源中文
                      pill.textContent = `${source ? '【' + source + '】' : ''}${translation || key}`;
                      break;
                    case 2: // 英文
                      pill.textContent = key;
                      break;
                    case 3: // 【来源】中文（英文）
                      pill.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})`;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 1 || evolutionFormat === 2 || evolutionFormat === 3)) {
                  const reverseResult = reverseLookupEvolution(dict, text, null, null, options);
                  if (reverseResult) {
                    // console.log(`[OAO][同名ID追踪][FUTBIN] 反向查找匹配成功 | 页面文本:${text} | 英文key:${reverseResult.key}`);
                    switch (evolutionFormat) {
                      case 0:
                        pill.textContent = `${reverseResult.translation} (${reverseResult.key})`;
                        break;
                      case 1:
                        pill.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}`;
                        break;
                      case 2:
                        pill.textContent = reverseResult.key;
                        break;
                      case 3:
                        pill.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})`;
                        break;
                    }
                    translated = true;
                  }
                }
                if (translated) break;
              }
            }
            // 样式调整：移除省略号，允许换行，调小字体2个字号，垂直居中
            pill.classList.remove('text-ellipsis');
            pill.style.whiteSpace = 'normal';
            pill.style.overflow = 'visible';
            pill.style.textOverflow = 'clip';
            pill.style.lineHeight = '1.3';
            pill.style.fontSize = '0.9rem';
            pill.style.height = 'auto';
            pill.style.minHeight = '2rem';
            pill.style.display = 'flex';
            pill.style.alignItems = 'center';
            pill.style.justifyContent = 'center';
            pill.style.paddingTop = '0.25rem';
            pill.style.paddingBottom = '0.25rem';
            pill.dataset.oaoFutbinEvoProcessed = 'true';
            pill.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 futbin /player/***/**** 页面的 og-pill 格式进行特殊处理
      if (isFutbinPlayerPage) {
        const evoPills = root.querySelectorAll('a.og-pill-evo.player-evo-card-title');
        evoPills.forEach(pill => {
          if (!pill.dataset.oaoFutbinEvoProcessed) {
            const text = pill.textContent.trim();
            if (text) {
              const textUpper = text.toUpperCase();
              let translated = false;
              for (const dict of allDictionaries) {
                // 正向查找
                if (dict[text] || dict[textUpper]) {
                  const key = dict[text] ? text : textUpper;
                  const dictValue = dict[key];
                  // 优先选择无 futbin_id 的通用条目
                  const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futbin_id');
                  const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                  const source = getSourceValue(selectedEntry);
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      pill.textContent = `${translation || key} (${key})`;
                      break;
                    case 1: // 来源中文
                      pill.textContent = `${source ? '【' + source + '】' : ''}${translation || key}`;
                      break;
                    case 2: // 英文
                      pill.textContent = key;
                      break;
                    case 3: // 【来源】中文（英文）
                      pill.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})`;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 1 || evolutionFormat === 2 || evolutionFormat === 3)) {
                  const reverseResult = reverseLookupEvolution(dict, text, null, null, options);
                  if (reverseResult) {
                    // console.log(`[OAO][同名ID追踪][FUTBIN] 反向查找匹配成功 | 页面文本:${text} | 英文key:${reverseResult.key}`);
                    switch (evolutionFormat) {
                      case 0:
                        pill.textContent = `${reverseResult.translation} (${reverseResult.key})`;
                        break;
                      case 1:
                        pill.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}`;
                        break;
                      case 2:
                        pill.textContent = reverseResult.key;
                        break;
                      case 3:
                        pill.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})`;
                        break;
                    }
                    translated = true;
                  }
                }
                if (translated) break;
              }
            }
            // 样式调整：移除省略号，允许完整显示
            pill.classList.remove('text-ellipsis');
            pill.style.whiteSpace = 'normal';
            pill.style.overflow = 'visible';
            pill.style.textOverflow = 'clip';
            pill.style.lineHeight = '1.4';
            pill.dataset.oaoFutbinEvoProcessed = 'true';
            pill.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 futbin /player/***/evolution 页面的 og-pill 格式进行特殊处理
      if (isFutbinPlayerEvolutionPage) {
        const evoPills = root.querySelectorAll('a.og-pill-evo.player-evo-card-title');
        evoPills.forEach(pill => {
          if (!pill.dataset.oaoFutbinEvoProcessed) {
            const text = pill.textContent.trim();
            if (text) {
              const textUpper = text.toUpperCase();
              let translated = false;
              for (const dict of allDictionaries) {
                // 正向查找
                if (dict[text] || dict[textUpper]) {
                  const key = dict[text] ? text : textUpper;
                  const dictValue = dict[key];
                  // 优先选择无 futbin_id 的通用条目
                  const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futbin_id');
                  const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                  const source = getSourceValue(selectedEntry);
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      pill.textContent = `${translation || key} (${key})`;
                      break;
                    case 1: // 来源中文
                      pill.textContent = `${source ? '【' + source + '】' : ''}${translation || key}`;
                      break;
                    case 2: // 英文
                      pill.textContent = key;
                      break;
                    case 3: // 【来源】中文（英文）
                      pill.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})`;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 1 || evolutionFormat === 2 || evolutionFormat === 3)) {
                  const reverseResult = reverseLookupEvolution(dict, text, null, null, options);
                  if (reverseResult) {
                    // console.log(`[OAO][同名ID追踪][FUTBIN] 反向查找匹配成功 | 页面文本:${text} | 英文key:${reverseResult.key}`);
                    switch (evolutionFormat) {
                      case 0:
                        pill.textContent = `${reverseResult.translation} (${reverseResult.key})`;
                        break;
                      case 1:
                        pill.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}`;
                        break;
                      case 2:
                        pill.textContent = reverseResult.key;
                        break;
                      case 3:
                        pill.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})`;
                        break;
                    }
                    translated = true;
                  }
                }
                if (translated) break;
              }
            }
            // 样式调整：移除省略号，允许完整显示
            pill.classList.remove('text-ellipsis');
            pill.style.whiteSpace = 'normal';
            pill.style.overflow = 'visible';
            pill.style.textOverflow = 'clip';
            pill.style.lineHeight = '1.4';
            pill.dataset.oaoFutbinEvoProcessed = 'true';
            pill.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 futbin /evolutions/builder/*** 页面的 og-pill 格式进行特殊处理
      if (isFutbinEvolutionBuilderPage) {
        const evoPills = root.querySelectorAll('a.og-pill-evo.player-evo-card-title');
        evoPills.forEach(pill => {
          if (!pill.dataset.oaoFutbinEvoProcessed) {
            const text = pill.textContent.trim();
            if (text) {
              const textUpper = text.toUpperCase();
              let translated = false;
              for (const dict of allDictionaries) {
                // 正向查找
                if (dict[text] || dict[textUpper]) {
                  const key = dict[text] ? text : textUpper;
                  const dictValue = dict[key];
                  // 优先选择无 futbin_id 的通用条目
                  const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futbin_id');
                  const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                  const source = getSourceValue(selectedEntry);
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      pill.textContent = `${translation || key} (${key})`;
                      break;
                    case 1: // 来源中文
                      pill.textContent = `${source ? '【' + source + '】' : ''}${translation || key}`;
                      break;
                    case 2: // 英文
                      pill.textContent = key;
                      break;
                    case 3: // 【来源】中文（英文）
                      pill.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key})`;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 1 || evolutionFormat === 2 || evolutionFormat === 3)) {
                  const reverseResult = reverseLookupEvolution(dict, text, null, null, options);
                  if (reverseResult) {
                    // console.log(`[OAO][同名ID追踪][FUTBIN] 反向查找匹配成功 | 页面文本:${text} | 英文key:${reverseResult.key}`);
                    switch (evolutionFormat) {
                      case 0:
                        pill.textContent = `${reverseResult.translation} (${reverseResult.key})`;
                        break;
                      case 1:
                        pill.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation}`;
                        break;
                      case 2:
                        pill.textContent = reverseResult.key;
                        break;
                      case 3:
                        pill.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key})`;
                        break;
                    }
                    translated = true;
                  }
                }
                if (translated) break;
              }
            }
            // 样式调整：移除省略号，允许完整显示
            pill.classList.remove('text-ellipsis');
            pill.style.whiteSpace = 'normal';
            pill.style.overflow = 'visible';
            pill.style.textOverflow = 'clip';
            pill.style.lineHeight = '1.4';
            pill.dataset.oaoFutbinEvoProcessed = 'true';
            pill.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 futbin 进化详情页的 page-header-top H1 标题进行特殊处理
      // 格式：<h1>FUTTIES 5th Low Driven Shot+ EA FC 26 Evolution</h1>
      // 需要翻译进化名称部分，保留 "EA FC 26 Evolution" 后缀
      if (isFutbinEvolutionsPage || isFutbinPlayerEvolutionPage || isFutbinEvolutionDetailPage) {
        const pageHeaders = root.querySelectorAll('h1.page-header-top');
        pageHeaders.forEach(header => {
          if (header.dataset.oaoFutbinEvoProcessed) return;
          
          const text = header.textContent.trim();
          if (!text) return;
          
          // 提取进化名称：尝试匹配常见后缀模式
          // 格式通常为：{进化名称} EA FC 26 Evolution
          let evoName = text;
          let suffix = '';
          
          // 尝试匹配 "EA FC XX Evolution" 后缀
          const evoSuffixMatch = text.match(/^(.+?)\s+EA\s+FC\s+\d+\s+Evolution$/i);
          if (evoSuffixMatch) {
            evoName = evoSuffixMatch[1].trim();
            suffix = text.substring(evoName.length).trim();
          } else {
            // 尝试匹配 " EA FC XX" 或其他常见后缀
            const eaFcMatch = text.match(/^(.+?)\s+EA\s+FC\s+\d+$/i);
            if (eaFcMatch) {
              evoName = eaFcMatch[1].trim();
              suffix = text.substring(evoName.length).trim();
            }
          }
          
          const evoNameUpper = evoName.toUpperCase();
          let translated = false;
          
          // 从 URL 提取 futbin_id（如果可用）
          let futbinId = '';
          const urlMatch = window.location.href.match(/\/evolutions\/(\d+)/);
          if (urlMatch) {
            futbinId = urlMatch[1];
          }
          
          // 尝试在进化字典中查找翻译
          for (const dict of allDictionaries) {
            // 第一阶段：按 futbin_id 匹配
            if (futbinId) {
              const found = findEvolutionById(dict, futbinId, 'futbin_id');
              if (found) {
                const selectedEntry = found.entry;
                const translation = getTranslationValue(selectedEntry, options.useShortenTerms, found.key);
                const source = getSourceValue(selectedEntry);
                switch (evolutionFormat) {
                  case 0: // 中文（英文）
                    header.textContent = `${translation || found.key} (${found.key}) ${suffix}`.trim();
                    break;
                  case 1: // 来源中文
                    header.textContent = `${source ? '【' + source + '】' : ''}${translation || found.key} ${suffix}`.trim();
                    break;
                  case 2: // 英文
                    header.textContent = `${found.key} ${suffix}`.trim();
                    break;
                  case 3: // 【来源】中文（英文）
                    header.textContent = `${source ? '【' + source + '】' : ''}${translation || found.key} (${found.key}) ${suffix}`.trim();
                    break;
                }
                translated = true;
                break;
              }
            }
            
            // 第二阶段：按名称匹配
            if (!translated) {
              if (dict[evoName] || dict[evoNameUpper]) {
                const key = dict[evoName] ? evoName : evoNameUpper;
                const dictValue = dict[key];
                const selectedEntry = selectEvolutionEntryByPriority(dictValue, 'futbin_id');
                const translation = getTranslationValue(selectedEntry, options.useShortenTerms, key);
                const source = getSourceValue(selectedEntry);
                switch (evolutionFormat) {
                  case 0: // 中文（英文）
                    header.textContent = `${translation || key} (${key}) ${suffix}`.trim();
                    break;
                  case 1: // 来源中文
                    header.textContent = `${source ? '【' + source + '】' : ''}${translation || key} ${suffix}`.trim();
                    break;
                  case 2: // 英文
                    header.textContent = `${key} ${suffix}`.trim();
                    break;
                  case 3: // 【来源】中文（英文）
                    header.textContent = `${source ? '【' + source + '】' : ''}${translation || key} (${key}) ${suffix}`.trim();
                    break;
                }
                translated = true;
                break;
              }
            }
          }
          
          // 反向查找：处理其他插件抢先翻译的情况
          if (!translated && (evolutionFormat === 0 || evolutionFormat === 1 || evolutionFormat === 2 || evolutionFormat === 3)) {
            for (const dict of allDictionaries) {
              const reverseResult = reverseLookupEvolution(dict, evoName, futbinId || null, 'futbin_id', options);
              if (reverseResult) {
                switch (evolutionFormat) {
                  case 0:
                    header.textContent = `${reverseResult.translation} (${reverseResult.key}) ${suffix}`.trim();
                    break;
                  case 1:
                    header.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} ${suffix}`.trim();
                    break;
                  case 2:
                    header.textContent = `${reverseResult.key} ${suffix}`.trim();
                    break;
                  case 3:
                    header.textContent = `${reverseResult.source ? '【' + reverseResult.source + '】' : ''}${reverseResult.translation} (${reverseResult.key}) ${suffix}`.trim();
                    break;
                }
                translated = true;
                break;
              }
            }
          }
          
          header.dataset.oaoFutbinEvoProcessed = 'true';
          header.dataset.oaoTranslated = 'true';
        });
      }

      // 针对 futbin 包含图片的 filter-title 元素进行特殊处理
      const filterTitles = root.querySelectorAll('div.xs-row.align-center.bold.text-nowrap.filter-title');
      filterTitles.forEach(title => {
        // 清除已翻译标记，确保重新处理
        delete title.dataset.oaoTranslated;
        
        // 查找直接文本节点（图片后面的文本）
        title.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent.trim();
            if (text) {
              // 尝试在所有字典中查找翻译
              for (const dict of allDictionaries) {
                // 尝试原始文本
                if (dict[text]) {
                  const dictValue = dict[text];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, text);
                  child.textContent = translation;
                  break;
                }
                // 尝试大写形式（大小写不敏感）
                const textUpper = text.toUpperCase();
                if (dict[textUpper]) {
                  const dictValue = dict[textUpper];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, textUpper);
                  child.textContent = translation;
                  break;
                }
              }
            }
          }
        });
        
      // 标记为已翻译
      title.dataset.oaoTranslated = 'true';
    });

      // 针对 futbin /evolutions/builder/* 页面的 UI 导航/控件标签进行兜底翻译
      // 这些标签在 SPA 渲染或分批处理时机问题下可能错过通用循环，统一使用字典（而非硬编码）处理
      function translateBuilderUiLabels(builderRoot) {
        const selectors = [
          '.player-stats-evolution-button',
          '.top-bar-tab',
          '.top-bar-tab .inline-popup-content',
          '.filter-dropdown-menu-button',
          '.filter-dropdown-menu-button .menu-button-tag',
          '.filter-dropdown-menu-list-item span',
          '.filter-dropdown-menu-list-item label span',
          '.smartphone-only'
        ];
        const uiElements = builderRoot.querySelectorAll(selectors.join(','));
        uiElements.forEach(el => {
          // 清除已翻译标记，允许重新处理（此前可能被错误标记为已翻译）
          delete el.dataset.oaoTranslated;

          el.childNodes.forEach(child => {
            if (child.nodeType !== Node.TEXT_NODE) return;
            const text = child.textContent.trim();
            if (!text) return;
            const textUpper = text.toUpperCase();
            for (const dict of allDictionariesWithoutEvo) {
              let dictValue = null;
              let key = '';
              if (dict[text]) {
                key = text;
                dictValue = dict[text];
              } else if (dict[textUpper]) {
                key = textUpper;
                dictValue = dict[textUpper];
              }
              if (dictValue) {
                const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                if (translation && translation !== text) {
                  child.textContent = translation;
                }
                break;
              }
            }
          });

          el.dataset.oaoTranslated = 'true';
        });
      }

      // 优化：只收集可能包含文本的元素，而不是所有元素
      // 分批处理元素，避免阻塞主线程
      let translatedCount = 0;
      let currentIndex = 0;
      const batchSize = 100; // 每批处理的元素数量

      // 选择可能包含文本的元素，减少处理量
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label, th, td');

      function processBatch() {
        const endIndex = Math.min(currentIndex + batchSize, elements.length);
        
        for (let i = currentIndex; i < endIndex; i++) {
          const element = elements[i];
          
          // 跳过已翻译的元素，避免重复翻译
          if (element.dataset.oaoTranslated === 'true') {
            continue;
          }
          
          // 跳过下拉菜单内的元素，这些已经在前面的专门处理中处理过了
          if (element.closest('.dropdown-menu')) {
            continue;
          }

          // 跳过 futbin evolutions 页面的特殊 HTML 格式元素（进化名称）
          // 但不跳过 div.evo-box-req 内的内容（球员要求、进化提升等），这些需要通用翻译
          if (isFutbinEvolutionsPage) {
            const closestRow = element.closest('div.xs-row.align-center');
            if (closestRow) {
              const isInsideEvoBoxReq = element.closest('div.evo-box-req');
              if (!isInsideEvoBoxReq) {
                continue;
              }
            }
          }

          // 跳过 futbin popular/evolutions 页面的特殊 HTML 格式元素
          if (isFutbinPopularEvolutionsPage) {
            const closestPill = element.closest('a.og-pill-primary');
            if (closestPill) {
              continue;
            }
          }

          // 跳过 futbin player 页面的特殊 HTML 格式元素
          if (isFutbinPlayerPage || isFutbinPlayerEvolutionPage || isFutbinEvolutionBuilderPage) {
            const closestPill = element.closest('a.og-pill-evo.player-evo-card-title');
            if (closestPill) {
              continue;
            }
          }

          // 跳过 futbin player/evolution 页面的进化相关元素，避免破坏HTML结构
          if (isFutbinPlayerEvolutionPage) {
            // 跳过进化概览包装器
            const closestEvoWrapper = element.closest('div.evolutions-overview-wrapper');
            if (closestEvoWrapper) {
              continue;
            }
            
            // 跳过进化卡片
            const closestEvoCard = element.closest('div.evolution-card');
            if (closestEvoCard) {
              continue;
            }
            
            // 跳过进化标题
            const closestEvoTitle = element.closest('h2.evo-title');
            if (closestEvoTitle) {
              continue;
            }
            
            // 跳过进化需求和奖励区域
            const closestEvoRequirements = element.closest('div.evo-requirements');
            if (closestEvoRequirements) {
              continue;
            }
            
            const closestEvoRewards = element.closest('div.evo-rewards');
            if (closestEvoRewards) {
              continue;
            }
          }

          // 跳过侧边栏按钮，避免翻译按钮文字
          if (element.classList.contains('oaevo-sidebar-btn')) {
            continue;
          }
          
          // 跳过翻译管理弹窗内的元素
          if (isInTranslationModal(element)) {
            continue;
          }
          
          // 检查是否包含进化相关的子元素，跳过父元素避免重复翻译
          const hasEvolutionBadge = Array.from(element.children).some(child => 
            child.classList.contains('evolution-badge') || child.classList.contains('evo-box-req')
          );
          if (hasEvolutionBadge) {
            continue;
          }
          
          // 检查元素是否有子元素（除了文本节点）
          const hasElementChildren = Array.from(element.children).length > 0;
          
          // 获取元素的直接文本节点内容（不包括子元素的文本）
          const directTextNodes = [];
          element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
              directTextNodes.push(child.textContent.trim());
            }
          });
          const directText = directTextNodes.join(' ').trim();
          
          // 处理没有直接文本但有子元素的情况（确保跳过空元素）
          if (hasElementChildren && !directText) {
            // 标记为空父元素，避免后续重复处理
            element.dataset.oaoTranslated = 'true';
            continue;
          }
          
          // 只处理有直接文本内容的元素
          if (directText) {
            // 处理HTML实体，将&amp;转换为&
            const normalizedDirectText = directText.replace(/&amp;/g, '&');
            const normalizedDirectTextUpper = normalizedDirectText.toUpperCase();
            
            // 检查元素是否在 evo-box-req 内，如果是则跳过进化字典
            const isInsideEvoBoxReq = element.closest('div.evo-box-req');
            
            // 尝试在所有字典中查找翻译
            for (const dict of allDictionaries) {
              // 在 evo-box-req 内时跳过进化字典，使用通用字典翻译
              if (isInsideEvoBoxReq && options.evolutionDictionary && dict === options.evolutionDictionary) {
                continue;
              }
              // 尝试原始文本
              if (dict[normalizedDirectText]) {
                const translation = options.useShortenTerms ? dict[normalizedDirectText].shorten : dict[normalizedDirectText].webpagedata;
                
                // 只替换直接文本节点，保留子元素
                element.childNodes.forEach(child => {
                  if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                    child.textContent = options.showOriginalWithBrackets ? `${translation} (${directText})` : translation;
                  }
                });
                
                element.dataset.oaoTranslated = 'true';
                translatedCount++;
                break;
              }
              // 尝试大写形式（大小写不敏感）
              if (dict[normalizedDirectTextUpper]) {
                const translation = options.useShortenTerms ? dict[normalizedDirectTextUpper].shorten : dict[normalizedDirectTextUpper].webpagedata;
                
                // 只替换直接文本节点，保留子元素
                element.childNodes.forEach(child => {
                  if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                    child.textContent = options.showOriginalWithBrackets ? `${translation} (${directText})` : translation;
                  }
                });
                
                element.dataset.oaoTranslated = 'true';
                translatedCount++;
                break;
              }
            }
          } else {
            // 标记没有直接文本的元素为已处理
            element.dataset.oaoTranslated = 'true';
          }
        }
        
        currentIndex = endIndex;
        
        // 如果还有元素需要处理，继续处理下一批
        if (currentIndex < elements.length) {
          // 使用 setTimeout 让出主线程，避免阻塞
          setTimeout(processBatch, 0);
        } else {
          if (translatedCount > 0) {
            // log('info', 'futbinTranslator 翻译完成，共翻译了', translatedCount, '个元素');
          }
          
          // 分批处理完成，清除翻译标记
          if (root === document && root.dataset) {
            delete root.dataset.oaoTranslating;
          }

          // 针对 builder 页 UI 标签的兜底翻译（使用字典，处理 SPA 动态渲染导致的漏翻）
          if (isFutbinEvolutionBuilderPage && typeof translateBuilderUiLabels === 'function') {
            translateBuilderUiLabels(root);
          }
        }
      }
      
      // 设置翻译标记，避免 MutationObserver 在分批处理过程中触发
      if (root === document && root.dataset) {
        root.dataset.oaoTranslating = 'true';
      }
      
      // 开始处理第一批元素
      processBatch();
    }
  };

  // EASYSBC翻译器
  const easysbcTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) {
        return;
      }

      // 合并所有字典
      // 进化字典优先于主字典，用于同名进化区分
      const allDictionaries = [];
      if (options && options.extraDictionaries) {
        allDictionaries.push(...options.extraDictionaries);
      }
      allDictionaries.push(dictionary);

      // 获取 evolutionFormat
      const evolutionFormat = options && options.evolutionFormat !== undefined ? options.evolutionFormat : 0;

      // 页面检测
      const isEasysbcEvolutionsPlayersPage = window.location.href.includes('/evolutions/players');
      const isEasysbcEvolutionBuilderPage = window.location.href.includes('/evolutions/builder/');
      const isEasysbcEvolutionOverviewPage = window.location.href.includes('/evolutions/overview/');
      const isEasysbcTacticsPage = window.location.href.includes('/tactics');
      const isEasysbcSquadBuilderPage = window.location.href.includes('/squad-builder');

      // 针对 EASYSBC evolutions/players 页面的特定 HTML 格式进行特殊处理
      // 格式1：<div class="bg-evolution h-6 ..."><div><p>文本</p></div></div>
      // 处理带有数字后缀的进化名称，如 "Pinged Pass+ 1"
      if (isEasysbcEvolutionsPlayersPage) {
        const evoItems = root.querySelectorAll('div.bg-evolution.h-6');
        evoItems.forEach(item => {
          const p = item.querySelector('p.leading-4');
          if (p && !p.dataset.oaoEasysbcEvoProcessed) {
            const text = p.textContent.trim();
            if (text) {
              // 提取数字后缀，如 "Pinged Pass+ 1" 或 "Rapid+3" -> 名称: "Pinged Pass+" 或 "Rapid+", 数字: "1" 或 "3"
              let numberSuffix = '';
              let nameText = text;
              const suffixMatch = text.match(/^(.+?)(\s*\d+)$/);
              if (suffixMatch) {
                nameText = suffixMatch[1].trim();
                numberSuffix = ' ' + suffixMatch[2].trim();
              }

              const textUpper = nameText.toUpperCase();
              let translated = false;
              
              // 按名称匹配（easysbc 只使用英文名查找，不使用 easysbc_id）
              for (const dict of allDictionaries) {
                if (dict[nameText] || dict[textUpper]) {
                  const key = dict[nameText] ? nameText : textUpper;
                  const dictValue = dict[key];
                  
                  // 处理数组格式和对象格式
                  let translation;
                  if (Array.isArray(dictValue) && dictValue.length > 0) {
                    const firstItem = dictValue[0];
                    translation = getTranslationValue(firstItem, options.useShortenTerms, key);
                  } else {
                    translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  }
                  
                  // easysbc 只展示中文翻译，不显示来源前缀
                  // easysbc 不支持格式3，回退到格式0（中文（英文））
                  const displayFormat = evolutionFormat === 3 ? 0 : evolutionFormat;
                  switch (displayFormat) {
                    case 0: // 中文（英文）
                      p.textContent = `${translation || key} (${key})${numberSuffix}`;
                      break;
                    case 1: // 中文（只显示中文翻译，不显示来源）
                      p.textContent = `${translation || key}${numberSuffix}`;
                      break;
                    case 2: // 英文
                      p.textContent = key + numberSuffix;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2 || evolutionFormat === 3)) {
                  const reverseResult = reverseLookupEvolution(dict, nameText, null, null, options);
                  if (reverseResult) {
                    // easysbc 不支持格式3，回退到格式0（中文（英文））
                    const displayFormat = evolutionFormat === 3 ? 0 : evolutionFormat;
                    switch (displayFormat) {
                      case 0: // 中文（英文）
                        p.textContent = `${reverseResult.translation} (${reverseResult.key})${numberSuffix}`;
                        break;
                      case 1: // 中文（只显示中文翻译，不显示来源）
                        p.textContent = `${reverseResult.translation}${numberSuffix}`;
                        break;
                      case 2: // 英文
                        p.textContent = reverseResult.key + numberSuffix;
                        break;
                    }
                    translated = true;
                  }
                }
                if (translated) break;
              }
            }
            p.dataset.oaoEasysbcEvoProcessed = 'true';
            p.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 EASYSBC evolutions/players 页面的 h2 标签格式进行处理
      // 格式2：<h2 class="text-sm py-0 my-0 leading-none">Low Driven Shot+ 3</h2>
      if (isEasysbcEvolutionsPlayersPage) {
        const evoTitles = root.querySelectorAll('h2.text-sm.py-0.my-0.leading-none');
        evoTitles.forEach(h2 => {
          if (!h2.dataset.oaoEasysbcEvoProcessed) {
            const text = h2.textContent.trim();
            if (text) {
              // 提取数字后缀，如 "Low Driven Shot+ 3" 或 "Rapid+3" -> 名称: "Low Driven Shot+" 或 "Rapid+", 数字: "3"
              let numberSuffix = '';
              let nameText = text;
              const suffixMatch = text.match(/^(.+?)(\s*\d+)$/);
              if (suffixMatch) {
                nameText = suffixMatch[1].trim();
                numberSuffix = ' ' + suffixMatch[2].trim();
              }

              const textUpper = nameText.toUpperCase();
              let translated = false;
              
              // 按名称匹配（easysbc 只使用英文名查找，不使用 easysbc_id）
              for (const dict of allDictionaries) {
                if (dict[nameText] || dict[textUpper]) {
                  const key = dict[nameText] ? nameText : textUpper;
                  const dictValue = dict[key];
                  
                  // 处理数组格式和对象格式
                  let translation;
                  if (Array.isArray(dictValue) && dictValue.length > 0) {
                    const firstItem = dictValue[0];
                    translation = getTranslationValue(firstItem, options.useShortenTerms, key);
                  } else {
                    translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  }
                  
                  // easysbc 只展示中文翻译，不显示来源前缀
                  // easysbc 不支持格式3，回退到格式0（中文（英文））
                  const displayFormat = evolutionFormat === 3 ? 0 : evolutionFormat;
                  switch (displayFormat) {
                    case 0: // 中文（英文）
                      h2.textContent = `${translation || key} (${key})${numberSuffix}`;
                      break;
                    case 1: // 中文（只显示中文翻译，不显示来源）
                      h2.textContent = `${translation || key}${numberSuffix}`;
                      break;
                    case 2: // 英文
                      h2.textContent = key + numberSuffix;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2 || evolutionFormat === 3)) {
                  const reverseResult = reverseLookupEvolution(dict, nameText, null, null, options);
                  if (reverseResult) {
                    // easysbc 不支持格式3，回退到格式0（中文（英文））
                    const displayFormat = evolutionFormat === 3 ? 0 : evolutionFormat;
                    switch (displayFormat) {
                      case 0: // 中文（英文）
                        h2.textContent = `${reverseResult.translation} (${reverseResult.key})${numberSuffix}`;
                        break;
                      case 2:
                        h2.textContent = reverseResult.key + numberSuffix;
                        break;
                    }
                    translated = true;
                  }
                }
                if (translated) break;
              }
            }
            h2.dataset.oaoEasysbcEvoProcessed = 'true';
            h2.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 EASYSBC evolutions/overview/*** 页面的进化名称进行处理
      // 格式：<span class="font-semibold text-dark-secondary leading-6 truncate">文本</span>
      if (isEasysbcEvolutionOverviewPage) {
        // 使用更健壮的选择器：找到所有在 a[href*="/evolutions/overview/"] 内的 span.truncate
        const evoSpans = root.querySelectorAll('a[href*="/evolutions/overview/"] span.truncate');
        
        evoSpans.forEach(span => {
          if (!span.dataset.oaoEasysbcEvoProcessed) {
            const text = span.textContent.trim();
            
            if (text) {
              let numberSuffix = '';
              let nameText = text;
              const suffixMatch = text.match(/^(.+?)(\s*\d+)$/);
              if (suffixMatch) {
                nameText = suffixMatch[1].trim();
                numberSuffix = ' ' + suffixMatch[2].trim();
              }

              const textUpper = nameText.toUpperCase();
              let translated = false;
              
              // 按名称匹配（easysbc 只使用英文名查找，不使用 easysbc_id）
              for (const dict of allDictionaries) {
                if (dict[nameText] || dict[textUpper]) {
                  const key = dict[nameText] ? nameText : textUpper;
                  const dictValue = dict[key];
                  
                  // 处理数组格式和对象格式
                  let translation;
                  if (Array.isArray(dictValue) && dictValue.length > 0) {
                    const firstItem = dictValue[0];
                    translation = getTranslationValue(firstItem, options.useShortenTerms, key);
                  } else {
                    translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  }
                  
                  // easysbc 只展示中文翻译，不显示来源前缀
                  // easysbc 不支持格式3，回退到格式0（中文（英文））
                  const displayFormat = evolutionFormat === 3 ? 0 : evolutionFormat;
                  switch (displayFormat) {
                    case 0: // 中文（英文）
                      span.textContent = `${translation || key} (${key})${numberSuffix}`;
                      break;
                    case 1: // 中文（只显示中文翻译，不显示来源）
                      span.textContent = `${translation || key}${numberSuffix}`;
                      break;
                    case 2: // 英文
                      span.textContent = key + numberSuffix;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2 || evolutionFormat === 3)) {
                  const reverseResult = reverseLookupEvolution(dict, nameText, null, null, options);
                  if (reverseResult) {
                    // easysbc 不支持格式3，回退到格式0（中文（英文））
                    const displayFormat = evolutionFormat === 3 ? 0 : evolutionFormat;
                    switch (displayFormat) {
                      case 0: // 中文（英文）
                        span.textContent = `${reverseResult.translation} (${reverseResult.key})${numberSuffix}`;
                        break;
                      case 1: // 中文（只显示中文翻译，不显示来源）
                        span.textContent = `${reverseResult.translation}${numberSuffix}`;
                        break;
                      case 2: // 英文
                        span.textContent = reverseResult.key + numberSuffix;
                        break;
                    }
                    translated = true;
                  }
                }
                if (translated) break;
              }
            }
            span.dataset.oaoEasysbcEvoProcessed = 'true';
            span.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 EASYSBC evolutions/builder/*** 页面的特定 HTML 格式进行特殊处理
      // 该格式为：<div class="bg-evolution ..."><p>文本</p></div>
      // 处理带有数字后缀的进化名称，如 "Pinged Pass+ 1"
      if (isEasysbcEvolutionBuilderPage) {
        const evoItems = root.querySelectorAll('div.bg-evolution.box-border');
        evoItems.forEach(item => {
          const p = item.querySelector('p.font-sans');
          if (p && !p.dataset.oaoEasysbcEvoProcessed) {
            const text = p.textContent.trim();
            if (text) {
              // 提取数字后缀，如 "Pinged Pass+ 1" -> 名称: "Pinged Pass+", 数字: "1"
              let numberSuffix = '';
              let nameText = text;
              const suffixMatch = text.match(/^(.+?)(\s+\d+)$/);
              if (suffixMatch) {
                nameText = suffixMatch[1].trim();
                numberSuffix = ' ' + suffixMatch[2].trim();
              }

              const textUpper = nameText.toUpperCase();
              let translated = false;
              // 尝试解析格式：中文 (英文) 或 中文 英文
              const matchResult = nameText.match(/^(.+?)\s*\(?\s*([^)]+?)\s*\)?$/);
              let chineseText = nameText;
              let englishText = '';
              if (matchResult) {
                chineseText = matchResult[1].trim();
                englishText = matchResult[2].trim();
              }
              for (const dict of allDictionaries) {
                // 正向查找
                if (dict[nameText] || dict[textUpper]) {
                  const key = dict[nameText] ? nameText : textUpper;
                  const dictValue = dict[key];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, key);
                  const source = getSourceValue(dictValue);
                  // easysbc 不支持格式3，回退到格式0（中文（英文））
                  const displayFormat = evolutionFormat === 3 ? 0 : evolutionFormat;
                  switch (displayFormat) {
                    case 0: // 中文（英文）
                      p.textContent = `${translation || key} (${key})${numberSuffix}`;
                      break;
                    case 1: // 中文（只显示中文翻译，不显示来源）
                      p.textContent = `${translation || key}${numberSuffix}`;
                      break;
                    case 2: // 英文
                      p.textContent = key + numberSuffix;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：仅当页面文本包含中文时才执行（处理其他插件抢先翻译的情况）
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2 || evolutionFormat === 3)) {
                  let reverseResult = reverseLookupEvolution(dict, nameText, null, null, options);
                  if (!reverseResult) {
                    reverseResult = reverseLookupEvolution(dict, chineseText, null, null, options);
                  }
                  if (reverseResult) {
                    // easysbc 不支持格式3，回退到格式0（中文（英文））
                    const displayFormat = evolutionFormat === 3 ? 0 : evolutionFormat;
                    switch (displayFormat) {
                      case 0: // 中文（英文）
                        p.textContent = `${reverseResult.translation} (${reverseResult.key})${numberSuffix}`;
                        break;
                      case 1: // 中文（只显示中文翻译，不显示来源）
                        p.textContent = `${reverseResult.translation}${numberSuffix}`;
                        break;
                      case 2: // 英文
                        p.textContent = reverseResult.key + numberSuffix;
                        break;
                    }
                    translated = true;
                  }
                }
                if (translated) break;
              }
            }
            p.dataset.oaoEasysbcEvoProcessed = 'true';
            p.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 EASYSBC tactics 页面的特定 HTML 格式进行特殊处理
      // 在"最爱"按钮后面添加阵型战术推荐按钮
      if (isEasysbcTacticsPage) {
        // 使用更通用的选择器查找工具栏
        const toolbar = root.querySelector('article.bg-toolbar');
        if (toolbar) {
          // 查找包含按钮的容器
          const buttonGroup = toolbar.querySelector('div.flex.flex-row.gap-x-2.items-center');
          if (buttonGroup && !buttonGroup.dataset.oaoTacticsButtonAdded) {
            // 查找最爱按钮（检查原始英文和翻译后的中文）
            let favoriteButton = null;
            const buttons = buttonGroup.querySelectorAll('button');
            for (const button of buttons) {
              const spans = button.querySelectorAll('span');
              for (const span of spans) {
                const text = span.textContent.trim();
                if (text.includes('最爱') || text.includes('Favourites') || text.includes('Favorite')) {
                  favoriteButton = button;
                  break;
                }
              }
              if (favoriteButton) break;
            }
            
            if (favoriteButton) {
              // 创建阵型战术推荐链接
              const tacticsButton = document.createElement('a');
              tacticsButton.href = 'https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MzE2NzgyMQ==&action=getalbum&album_id=3714272208722886660#wechat_redirect';
              tacticsButton.target = '_blank';
              tacticsButton.rel = 'noopener noreferrer';
              tacticsButton.className = 'touch-device:p-0 touch-device:m-0';
              // 应用与 fut.gg 一致的样式，设置固定大小
              tacticsButton.style.cssText = `
                background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
                color: #fff;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(255, 87, 34, 0.5);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                white-space: nowrap;
                width: 150px;
                height: 40px;
                text-decoration: none;
              `;
              
              // 悬停效果
              tacticsButton.onmouseover = function() {
                this.style.boxShadow = '0 5px 15px rgba(255, 87, 34, 0.6)';
                this.style.transform = 'translateY(-2px)';
              };
              
              tacticsButton.onmouseout = function() {
                this.style.boxShadow = '0 4px 12px rgba(255, 87, 34, 0.5)';
                this.style.transform = 'translateY(0)';
              };
              
              // 按钮内容
              tacticsButton.innerHTML = `
                <span>每周阵型战术推荐</span>
              `;
              
              // 在最爱按钮后面添加分隔线
              const divider = document.createElement('div');
              divider.className = 'h-6 w-[1px] bg-new-gray-750 my-auto hidden touch-device:block';
              
              // 插入到最爱按钮后面
              favoriteButton.insertAdjacentElement('afterend', divider);
              divider.insertAdjacentElement('afterend', tacticsButton);
              
              // 标记已添加
              buttonGroup.dataset.oaoTacticsButtonAdded = 'true';
            }
          }
        }
      }

      // 针对 EASYSBC squad-builder 页面的特定 HTML 格式进行特殊处理
      // 在"组建阵容"按钮下面添加"每周阵型战术推荐"按钮
      if (isEasysbcSquadBuilderPage) {
        // 查找包含"组建阵容"按钮的容器
        const buildSquadsContainer = root.querySelector('div.mt-4.relative.flex.flex-col.items-center');
        if (buildSquadsContainer && !buildSquadsContainer.dataset.oaoSquadBuilderTacticsAdded) {
          // 查找"组建阵容"按钮
          const buildSquadsButton = buildSquadsContainer.querySelector('button');
          if (buildSquadsButton) {
            // 创建每周阵型战术推荐链接
            const tacticsButton = document.createElement('a');
            tacticsButton.href = 'https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MzE2NzgyMQ==&action=getalbum&album_id=3714272208722886660#wechat_redirect';
            tacticsButton.target = '_blank';
            tacticsButton.rel = 'noopener noreferrer';
            tacticsButton.className = 'touch-device:p-0 touch-device:m-0';
            // 应用与 fut.gg 一致的样式，设置固定大小
            tacticsButton.style.cssText = `
              background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
              color: #fff;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 4px 12px rgba(255, 87, 34, 0.5);
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              justify-content: center;
              white-space: nowrap;
              width: 150px;
              height: 40px;
              text-decoration: none;
              margin-top: 24px !important;
            `;
            
            // 悬停效果
            tacticsButton.onmouseover = function() {
              this.style.boxShadow = '0 5px 15px rgba(255, 87, 34, 0.6)';
              this.style.transform = 'translateY(-2px)';
            };
            
            tacticsButton.onmouseout = function() {
              this.style.boxShadow = '0 4px 12px rgba(255, 87, 34, 0.5)';
              this.style.transform = 'translateY(0)';
            };
            
            // 按钮内容
            tacticsButton.innerHTML = `每周阵型战术推荐`;
            
            // 插入到"组建阵容"按钮后面
            buildSquadsContainer.appendChild(tacticsButton);
            
            // 标记已添加
            buildSquadsContainer.dataset.oaoSquadBuilderTacticsAdded = 'true';
          }
        }
      }

      // 检查是否在 easysbc 主页面
      if (window.location.href === 'https://www.easysbc.io/') {
        // 检查是否已经添加过SBC球员评测按钮
        if (!document.querySelector('[data-oao-sbc-review-added]')) {
          // 查找代币交换按钮
          let tokenExchangeButton = null;
          const buttons = document.querySelectorAll('button');
          for (const button of buttons) {
            const text = button.textContent.trim();
            if (text === '代币交换' || text === 'Token Exchange') {
              tokenExchangeButton = button;
              break;
            }
          }
          
          if (tokenExchangeButton) {
            // 获取按钮的父容器
            const parentContainer = tokenExchangeButton.parentElement;
            if (parentContainer) {
              // 创建SBC球员评测链接
              const sbcReviewButton = document.createElement('a');
              sbcReviewButton.href = 'https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MzE2NzgyMQ==&action=getalbum&album_id=3721449259213029385&subscene=126&scenenote=https%3A%2F%2Fmp.weixin.qq.com%2Fs%3F__biz%3DMzA5MzE2NzgyMQ%3D%3D%26mid%3D2247492577%26idx%3D1%26sn%3Db4f86dad454872766eb573527ae27494%26chksm%3D91e50b31dfc2dc2c62b1bb9bb163b8d34dc47400d9141fbab57384642b353808518aab4ce177%26scene%3D126%26sessionid%3D1774093988%26subscene%3D91%26clicktime%3D1774093989%26enterid%3D1774093989%26key%3Ddaf9bdc5abc4e8d0ee55c68f2910b99b29485226d6b61da89c9017c359e2b1d2d2eff9249e28c7cd59ea10a7a3703048102ed34083bfcc6a4dd402ff4fd00b2235c1bc52222048dbb84cc9fccf5dcba6d81ac8763b863c59306c9336605af503784e85708c78f6913d66c1be11b0d25124ce3f6cf0f3a67cf0c5134918d98356%26ascene%3D0%26uin%3DNTg0ODA5NQ%253D%253D%26devicetype%3DUnifiedPCWindows%26version%3Df254181c%26lang%3Dzh_CN%26countrycode%3DCN%26exportkey%3Dn_ChQIAhIQow%252FRE3eo0zLDhnMRFsoPihLUAQIE97dBBAEAAAAAAMu2EHETHhcAAAAOpnltbLcz9gKNyK89dVj0J1GZgn44nGdTgdnHJWHB1r1x2e9Veg%252B75QPDr5JUgTAWhbvpz9NJOlu1%252FgJmwGKJOI8teFGTrEFXfeGFt7oVxVqmFib2AXc7FsWsOCvnmclnASzpzQqV%252BkhzPwQV5ZxgmBhvPW9gaW1YojKsRtKQb7x2n6Mv5UF9%252FCVPJu1QnsmEQOubi1fC%252BtH5dqU72MtUmjPMF9kc6Z6x0H6fVKHPdGJJv4NO%252Fs19oEIL6O83%26acctmode%3D0%26pass_ticket%3Dgms5p%252BXycs%252ByJ9UEMuOTnlvPQSGKn9Ed1WFHuIkgJHBsWjQGGlvoKV95IV3Qr1ly%26wx_header%3D0&nolastread=1&sessionid=#wechat_redirect';
              sbcReviewButton.target = '_blank';
              sbcReviewButton.rel = 'noopener noreferrer';
              sbcReviewButton.className = 'touch-device:p-0 touch-device:m-0';
              // 应用与每周阵型战术推荐按钮一致的样式
              sbcReviewButton.style.cssText = `
                background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
                color: #fff;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(255, 87, 34, 0.5);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                white-space: nowrap;
                width: 120px;
                height: 40px;
                text-decoration: none;
              `;
              
              // 悬停效果
              sbcReviewButton.onmouseover = function() {
                this.style.boxShadow = '0 5px 15px rgba(255, 87, 34, 0.6)';
                this.style.transform = 'translateY(-2px)';
              };
              
              sbcReviewButton.onmouseout = function() {
                this.style.boxShadow = '0 4px 12px rgba(255, 87, 34, 0.5)';
                this.style.transform = 'translateY(0)';
              };
              
              // 按钮内容
              sbcReviewButton.innerHTML = `SBC球员评测`;
              
              // 插入到代币交换按钮后面
              tokenExchangeButton.insertAdjacentElement('afterend', sbcReviewButton);
              
              // 标记已添加
              parentContainer.dataset.oaoSbcReviewAdded = 'true';
            }
          }
        }
      }

      // 优化：只收集可能包含文本的元素，而不是所有元素
      // 分批处理元素，避免阻塞主线程
      let translatedCount = 0;
      let currentIndex = 0;
      const batchSize = 100; // 每批处理的元素数量

      // 选择可能包含文本的元素，减少处理量
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label, th, td');

      function processBatch() {
        const endIndex = Math.min(currentIndex + batchSize, elements.length);
        
        for (let i = currentIndex; i < endIndex; i++) {
          const element = elements[i];
          
          // 跳过已翻译的元素，避免重复翻译
          if (element.dataset.oaoTranslated === 'true') {
            continue;
          }

          // 跳过侧边栏按钮，避免翻译按钮文字
          if (element.classList.contains('oaevo-sidebar-btn')) {
            continue;
          }
          
          // 跳过翻译管理弹窗内的元素
          if (isInTranslationModal(element)) {
            continue;
          }
          
          // 跳过已处理的特殊格式元素
          if (element.tagName === 'P') {
            if (element.classList.contains('leading-4') && isEasysbcEvolutionsPlayersPage) {
              continue;
            }
            if (element.classList.contains('font-sans') && isEasysbcEvolutionBuilderPage) {
              continue;
            }
          }
          
          // 检查元素是否有子元素（除了文本节点）
          const hasElementChildren = Array.from(element.children).length > 0;
          
          // 获取元素的直接文本节点内容（不包括子元素的文本）
          const directTextNodes = [];
          element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
              directTextNodes.push(child);
            }
          });
          
          // 处理没有直接文本但有子元素的情况（确保跳过空元素）
          if (hasElementChildren && directTextNodes.length === 0) {
            // 标记为空父元素，避免后续重复处理
            element.dataset.oaoTranslated = 'true';
            continue;
          }
          
          // 处理直接文本节点
          directTextNodes.forEach(node => {
            const text = node.textContent.trim();
            if (text) {
              // 尝试在所有字典中查找翻译
              let translatedText = text;
              
              // 首先尝试完整匹配（包括大小写敏感和不敏感）
              for (const dict of allDictionaries) {
                // 尝试原始文本
                if (dict[text]) {
                  const translation = options.useShortenTerms ? dict[text].shorten : dict[text].webpagedata;
                  if (translation && translation.trim() !== '') {
                    translatedText = options.showOriginalWithBrackets ? `${translation} (${text})` : translation;
                    break;
                  }
                }
                // 尝试大写形式（大小写不敏感）
                const textUpper = text.toUpperCase();
                if (dict[textUpper]) {
                  const dictValue = dict[textUpper];
                  const translation = getTranslationValue(dictValue, options.useShortenTerms, textUpper);
                  if (translation && translation.trim() !== '') {
                    translatedText = options.showOriginalWithBrackets ? `${translation} (${text})` : translation;
                    break;
                  }
                }
              }
              
              // 检查翻译结果
              if (translatedText !== text && translatedText.trim() !== '') {
                node.textContent = translatedText;
                translatedCount++;
              } else if (translatedText !== text && translatedText.trim() === '') {
                // 翻译为空，保留原文
              } else {
                // 未找到翻译，保留原文
                // 确保不会清空文本
                if (node.textContent !== text) {
                  node.textContent = text;
                }
              }
            }
          });
          
          // 标记已处理的元素，避免重复处理
          element.dataset.oaoTranslated = 'true';
        }
        
        currentIndex = endIndex;
        
        // 如果还有元素需要处理，继续处理下一批
        if (currentIndex < elements.length) {
          // 使用 setTimeout 让出主线程，避免阻塞
          setTimeout(processBatch, 0);
        } else {
          // 处理EASYSBC特定HTML格式
          handleEasysbcSpecificFormat();
          
          if (translatedCount > 0) {
            // console.log('[OAO] easysbcTranslator 翻译完成，共翻译:', translatedCount, '个文本节点');
          }
          
          // 分批处理完成，清除翻译标记
          if (root === document && root.dataset) {
            delete root.dataset.oaoTranslating;
          }
        }
      }
      
      // 针对EASYSBC特定HTML格式的处理
      function handleEasysbcSpecificFormat() {
        // 查找包含角色和位置的特定HTML结构（更宽松的选择器）
        const targetElements = root.querySelectorAll('div.flex.flex-row.items-center');
        
        targetElements.forEach(element => {
          // 查找包含文本的p元素
          const textElement = element.querySelector('p.text-tiny, p.text-sm, p.text-xs');
          if (textElement && !textElement.dataset.oaoEasysbcProcessed) {
            const text = textElement.textContent.trim();
            
            // 常见的位置缩写
            const positionAbbreviations = ['ST', 'CB', 'LB', 'RB', 'CM', 'CAM', 'CDM', 'LM', 'RM', 'LW', 'RW', 'GK'];
            let roleText = text;
            let position = '';
            
            // 提取角色名称，排除位置缩写
            for (const abbr of positionAbbreviations) {
              if (text.endsWith(` ${abbr}`)) {
                roleText = text.substring(0, text.length - abbr.length - 1);
                position = abbr;
                break;
              }
            }
            
            // 尝试在字典中查找翻译
            let translatedRole = roleText;
            for (const dict of allDictionaries) {
              // 尝试原始文本
              if (dict[roleText]) {
                const translation = options.useShortenTerms ? dict[roleText].shorten : dict[roleText].webpagedata;
                if (translation && translation.trim() !== '') {
                  translatedRole = translation;
                  break;
                }
              }
              // 尝试大写形式（大小写不敏感）
              const roleTextUpper = roleText.toUpperCase();
              if (dict[roleTextUpper]) {
                const translation = options.useShortenTerms ? dict[roleTextUpper].shorten : dict[roleTextUpper].webpagedata;
                if (translation && translation.trim() !== '') {
                  translatedRole = translation;
                  break;
                }
              }
            }
            
            if (translatedRole !== roleText) {
              // 组合翻译后的文本
              const translatedText = position ? `${translatedRole} ${position}` : translatedRole;
              textElement.textContent = translatedText;
              translatedCount++;
            }
            
            // 标记为已处理
            textElement.dataset.oaoEasysbcProcessed = 'true';
            textElement.dataset.oaoTranslated = 'true';
          }
        });
      }
      
      // 设置翻译标记，避免 MutationObserver 在分批处理过程中触发
      if (root === document && root.dataset) {
        root.dataset.oaoTranslating = 'true';
      }
      
      // 开始处理第一批元素
      processBatch();
      
    }
  };

  // 控制日志输出的开关
  const LOG_LEVEL = 'info'; // 'debug', 'info', 'error'
  
  // 日志工具函数
  function log(level, ...args) {
    if (level === 'error' || 
        (level === 'info' && (LOG_LEVEL === 'info' || LOG_LEVEL === 'debug')) || 
        (level === 'debug' && LOG_LEVEL === 'debug')) {
      console[level === 'debug' ? 'log' : level](...args);
    }
  }

  // SBC 标题翻译器：将 fut.gg /sbc/ 与 futbin /squad-building-challenges 的 SBC 卡片标题
  // 接入翻译，规则源为 miniapp-dictionaries.json 的 sbc 分类（通用基础字典）。
  // 选择器依据页面真实 HTML 结构推导：
  //   - fut.gg：SBC 卡片为 <a href*="/sbc/"> 内含 <h3 class="font-bold"> 标题
  //   - futbin：SBC 卡片容器 div.xs-row.align-center.space-between 内含首个 <div class="text-ellipsis"> 标题
  //     （徽章 <div class="sbc-badge ..."> 不带 text-ellipsis，不会被误选）
  // 复用 translateWithDictionaries：只翻译直接文本节点、自动跳过已标记元素，保留价格/徽章等子元素。
  const sbcTranslator = {
    translate: function(root, dictionary, options) {
      if (!root) return;
      const allDicts = [];
      if (options && options.extraDictionaries) {
        allDicts.push(...options.extraDictionaries);
      }
      if (dictionary) {
        allDicts.push(dictionary);
      }
      if (allDicts.length === 0) return;

      const isFutggPage = window.location.hostname.includes('fut.gg');
      const isFutbinPage = window.location.hostname.includes('futbin.com');
      const isFutggSbcPage = isFutggPage && window.location.pathname.startsWith('/sbc');
      const isFutbinSbcPage = isFutbinPage && window.location.pathname.includes('squad-building-challenges');

      let titleElements = [];
      if (isFutggSbcPage) {
        // fut.gg SBC 标题：<h3 class="font-bold">。标题可能包在 <a href*="/sbc/"> 卡片里，也可能在
        // 详情/列表区的 <div> 容器里（如 <div class="flex flex-row items-center gap-2 py-2">），
        // 故直接按 h3.font-bold 选取；未命中字典的标题会被跳过，不影响其它标题。
        titleElements = root.querySelectorAll('h3.font-bold');
      } else if (isFutbinSbcPage) {
        titleElements = root.querySelectorAll('div.xs-row.align-center.space-between div.text-ellipsis');
      }
      if (!titleElements || titleElements.length === 0) return;

      // 归一化键：SBC 名称在不同来源书写不一致，常见差异：
      //   - 数字与 x 之间的空格："3x 79+ Upgrade" vs "3 x 79+ Upgrade" vs "2x79+ Upgrade"
      //   - 大小写、多余空白
      // 仅把「数字 + 可选空格 + x/X/× + 可选空格 + 数字」这类倍率写法归一（避免误伤含 x 的普通单词，
      // 如 "Box To Box"）；再对页面文本做同样归一化，让 3x / 3 x / 3X 等写法都能命中同一条目。
      const normalizeKey = (s) => String(s || '')
        .replace(/(\d)\s*[xX×]\s*(?=\d)/g, '$1x') // 3 x / 3X / 3× 后接数字 -> 3x
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

      const normalizedDicts = []; // 归一化后的字典，按原顺序用于兜底查找
      for (const dict of allDicts) {
        if (!dict) continue;
        const nm = new Map();
        for (const [k, v] of Object.entries(dict)) {
          const nk = normalizeKey(k);
          if (nk && !nm.has(nk)) {
            nm.set(nk, { key: k, value: v });
          }
        }
        normalizedDicts.push(nm);
      }

      titleElements.forEach(element => {
        if (!element || element.dataset.oaoTranslated === 'true') return;
        if (element.classList && element.classList.contains('oaevo-sidebar-btn')) return;
        if (isInTranslationModal(element)) return;

        // 取直接文本节点（标题通常无子元素；若有价格等子元素也只会拼直接文本）
        const textNodes = [];
        for (let i = 0; i < element.childNodes.length; i++) {
          const child = element.childNodes[i];
          if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
            textNodes.push(child);
          }
        }
        if (textNodes.length === 0) return;
        const text = textNodes.map(n => n.textContent.trim()).join(' ').trim();
        if (!text) return;

        const nk = normalizeKey(text);
        for (const nm of normalizedDicts) {
          const hit = nm.get(nk);
          if (hit) {
            const translation = getTranslationValue(hit.value, options && options.useShortenTerms, hit.key);
            if (translation && translation !== text) {
              let idx = 0;
              element.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                  child.textContent = (idx === 0) ? translation : '';
                  idx++;
                }
              });
            }
            element.dataset.oaoTranslated = 'true';
            break;
          }
        }
      });
    }
  };

  // 翻译根元素
  async function translateRoot(root) {
    try {
      // 检查 root 是否存在
      if (!root) {
        // log('error', 'translateRoot: root is undefined');
        return;
      }
      
      // 设置翻译标记，避免 MutationObserver 重复触发
      if (root === document && root.dataset) {
        root.dataset.oaoTranslating = 'true';
      }
      
      // log('debug', '=== translateRoot 开始 ===');
      const dictionaries = await ensureDictionaries();
      // 检查是否是 Fut.gg 页面
      const isFutggPage = window.location.hostname.includes('fut.gg');
      // 检查是否是 Futbin 页面
      const isFutbinPage = window.location.hostname.includes('futbin.com');
      // 检查是否是 Easysbc 页面
      const isEasysbcPage = window.location.hostname.includes('easysbc.io');
      // 检查是否是进化相关页面
      const isEvolutionsPage = window.location.href.includes('evolutions') || window.location.href.includes('/evolution');
      // 检查是否是 Evo Lab 页面
      const isEvoLabPage = window.location.href.includes('evo-lab');
      
      // 根据页面类型确定使用哪个翻译开关
      let isTranslationEnabled;
      if (isFutggPage) {
        isTranslationEnabled = futggTranslationEnabled;
      } else if (isEasysbcPage) {
        isTranslationEnabled = easysbcTranslationEnabled;
      } else if (isUtWebPage()) {
        isTranslationEnabled = utwebTranslationEnabled;
      } else {
        isTranslationEnabled = futbinTranslationEnabled;
      }
      
      // log('debug', '翻译开关状态:', isTranslationEnabled);
      // log('debug', 'futggTranslationEnabled:', futggTranslationEnabled);
      // log('debug', 'futbinTranslationEnabled:', futbinTranslationEnabled);
      
      // 只有在翻译开启时才运行基本翻译器
      if (isTranslationEnabled) {
        // 统一查询所有需要翻译的元素，避免多个翻译器重复查询DOM
        const allTextElements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label, th, td');
        
        // 只有在非 Fut.gg 且非 EASYSBC 且非 UTWeb 页面上运行基本翻译器，避免重复翻译
        // 但不在进化页面运行，避免与 evolutionsTranslator 重复翻译
        // 英文模式下（evolutionFormat === 2）不运行基本翻译器，保持原始英文
        if (!isFutggPage && !isEasysbcPage && !isUtWebPage() && !isEvolutionsPage && evolutionFormat !== 2) {
          translateWithDictionaries(allTextElements, [dictionaries.basic], {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          });
        } else if (isEasysbcPage) {
          // 在EASYSBC页面上，只运行easysbcTranslator（已包含所有必要字典）
          // 不再单独调用 baseInfoTranslator，避免重复翻译
          const easysbcExtraDicts = [];
          if (evolutionFormat !== 2) {
            easysbcExtraDicts.push(dictionaries.evolutions);
          }
          easysbcExtraDicts.push(
            dictionaries.basic,
            dictionaries.sixStat,
            dictionaries.playstyles,
            dictionaries.roles,
            dictionaries.chemistry
          );
          const easysbcDict = (dictionaries.easysbc && Object.keys(dictionaries.easysbc).length > 0) ? dictionaries.easysbc : dictionaries.futbin;
          easysbcTranslator.translate(
            root,
            easysbcDict,
            {
              useShortenTerms: USE_SHORTEN_TERMS,
              showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
              extraDictionaries: easysbcExtraDicts,
              evolutionFormat: evolutionFormat
            }
          );
        }
        
        // 只有在非 EASYSBC 且非 UTWeb 页面上运行其他翻译器，避免重复翻译
        // 注意：进化格式=英文（evolutionFormat===2）只控制进化名的显示方式，
        // 化学/六维/角色/特技等通用字典仍需正常翻译（与 futbinTranslator/futggTranslator
        // 的 extraDictionaries 行为对齐——它们在英文模式下也带这些字典，仅排除进化字典）
        if (!isEasysbcPage && !isUtWebPage()) {
          // 使用统一的翻译函数，避免重复查询DOM
          translateWithDictionaries(allTextElements, [dictionaries.sixStat], {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          });
          translateWithDictionaries(allTextElements, [dictionaries.roles], {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          });
          translateWithDictionaries(allTextElements, [dictionaries.chemistry], {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          });
          translateWithDictionaries(allTextElements, [dictionaries.playstyles], {
            useShortenTerms: USE_SHORTEN_TERMS,
            // 球员特技翻译：只显示中文，不带英文原文括号
            showOriginalWithBrackets: false,
          });
        } else {
          // 在EASYSBC页面上，确保不运行其他翻译器
        }
        
        // UTWEB 页面翻译 - 只使用进化字典
        if (isUtWebPage() && utwebTranslationEnabled) {
          const utwebTextElements = root.querySelectorAll(
            '.ut-content div, .ut-content span, .ut-content p, .ut-content h1, .ut-content h2, .ut-content h3, .ut-content h4, .ut-content h5, .ut-content h6, .ut-content a, .ut-content li, .ut-content button, .ut-content label, .ut-content th, .ut-content td, .ut-navigation-bar-view *, .ut-tile-view *'
          );
          
          if (evolutionFormat !== 2) {
            translateWithDictionaries(utwebTextElements, [dictionaries.evolutions], {
              useShortenTerms: USE_SHORTEN_TERMS,
              showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
            });
          }

          translateUtwebEvolutionTitles(root, dictionaries.evolutions);
          insertUtwebEvolutionNameInHeader(root, dictionaries.evolutions);
        }
      }
      
      // 只有在进化相关页面上运行 evolutionsTranslator，英文状态时不运行
      if (isEvolutionsPage && evolutionFormat !== 2) {
        evolutionsTranslator.translate(root, dictionaries.evolutions, {
          useShortenTerms: USE_SHORTEN_TERMS,
          showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
        });
      }
      
      // 只有在 Evo Lab 页面上运行 futggEvolutionsTranslator，英文状态时不运行，避免翻译进化名称
      if (isEvoLabPage && evolutionFormat !== 2) {
        futggEvolutionsTranslator.translate(
          root,
          dictionaries.evolutions,
          {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          }
        );
      }
      
      // 只有在 Fut.gg 页面上运行 futggTranslator
      // evo-lab 页面始终运行，不受 futggTranslationEnabled 开关影响
      if (isFutggPage && (futggTranslationEnabled || isEvoLabPage)) {
        // 英文状态时不包含进化字典，避免翻译进化名称
        // 当 futgg 翻译开启时才添加通用翻译字典；关闭时只保留进化字典
        // 避免在 evo-lab 等页面上误翻译球员特技、六项数据等内容
        const extraDictionaries = [];
        if (futggTranslationEnabled) {
          extraDictionaries.push(
            dictionaries.basic,
            dictionaries.sixStat,
            dictionaries.playstyles,
            dictionaries.roles,
          );
        }
        let evolutionDictionary = null;
        const shouldApplyEvolutionFormat = evolutionFormat !== 2;
        if (shouldApplyEvolutionFormat) {
          evolutionDictionary = dictionaries.evolutions;
          extraDictionaries.push(evolutionDictionary);
        }
        // futgg evolutions 页面需要始终包含 evolutionDictionary，用于特殊处理
        const isFutggEvolutionsPage = window.location.href === 'https://www.fut.gg/evolutions/' ||
                                     window.location.href.includes('fut.gg/evolutions');
        if (isFutggEvolutionsPage && !evolutionDictionary) {
          evolutionDictionary = dictionaries.evolutions;
        }
        // 当 futgg 翻译关闭但在 evo-lab 页面时，跳过 futgg 字典，只使用进化字典
        if (futggTranslationEnabled && dictionaries.futgg) {
          extraDictionaries.push(dictionaries.futgg);
        }
        futggTranslator.translate(
          root,
          futggTranslationEnabled ? (dictionaries.futgg || dictionaries.basic) : dictionaries.evolutions,
          {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
            extraDictionaries: extraDictionaries,
            evolutionDictionary: evolutionDictionary,
            // FUTGG 翻译关闭时（evo-lab 专用），不运行通用批处理循环
            // 只执行各页面的进化名称专用处理块，避免翻译特技、角色、基础术语等通用字典内容
            skipGeneralTranslation: !futggTranslationEnabled
          }
        );
      }
      

      
      // 只有在非 Fut.gg 且非 EASYSBC 且非 UTWeb 页面上运行 futbinTranslator
      if (!isFutggPage && !isEasysbcPage && !isUtWebPage() && futbinTranslationEnabled) {
        // 英文状态时不包含进化字典，避免翻译进化名称
        const extraDictionaries = [
          dictionaries.basic,
          dictionaries.sixStat,
          dictionaries.playstyles,
          dictionaries.roles,
        ];
        if (evolutionFormat !== 2) {
          extraDictionaries.push(dictionaries.evolutions);
        }
        
        futbinTranslator.translate(
          root,
          dictionaries.futbin,
          {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
            extraDictionaries: extraDictionaries
          }
        );
      }

      // SBC 标题翻译（fut.gg /sbc/ 与 futbin /squad-building-challenges）
      // 此前 sbc 字典从未加载，标题文本（如 "3x 79+ Upgrade"）查不到 → 不翻译；
      // 接入后命中 sbc 字典即可翻译。仅在对应 SBC 页面且翻译开关开启时运行。
      const isFutggSbcPage = isFutggPage && window.location.pathname.startsWith('/sbc');
      const isFutbinSbcPage = isFutbinPage && window.location.pathname.includes('squad-building-challenges');
      if ((isFutggSbcPage || isFutbinSbcPage) && isTranslationEnabled) {
        const sbcExtraDicts = [dictionaries.basic, dictionaries.futbin, dictionaries.futgg];
        sbcTranslator.translate(root, dictionaries.sbc, {
          useShortenTerms: USE_SHORTEN_TERMS,
          showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          extraDictionaries: sbcExtraDicts
        });
      }

      // EASYSBC 页面已在前面处理，这里不再重复处理

      // 球员评测入口：futbin / fut.gg 球员详情页命中 PLAYER_REVIEW 时注入「球员评测」入口。
      //   fut.gg：按 EAID（字典键）匹配，插到顶部导航条末尾；找不到可见导航条时挂 fixed 浮动按钮。
      //   futbin：按条目的 shorten 字段匹配 futbin 球员页 URL id，插到 top-bar 标签行末尾。
      // 与翻译开关无关（属链接功能），未命中不渲染任何元素。
      injectPlayerReview();
    } catch (error) {
      // log('error', '翻译过程中出错:', error);
    } finally {
      // 移除翻译标记
      // 注意：FUTGG页面的futggTranslator使用分批处理，会在处理完成后自行清除标记
      // 这里只在非FUTGG页面或futggTranslator未运行时清除标记
      const isFutggPage = window.location.hostname.includes('fut.gg');
      if (root && root === document && root.dataset && (!isFutggPage || !futggTranslationEnabled)) {
        delete root.dataset.oaoTranslating;
      }
      // log('debug', '=== translateRoot 结束 ===');
    }
  }



  // 使用 MutationObserver 监听 DOM 变化，替代定时轮询
  function startTranslationObserver() {
    // 防抖函数
    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
    
    // 防抖的翻译函数（300ms 延迟，避免频繁触发）
    const debouncedTranslate = debounce((mutations) => {
      // 检查是否正在翻译，避免无限循环
      if (document && document.dataset && document.dataset.oaoTranslating) {
        // log('debug', '正在翻译中，跳过 MutationObserver 触发');
        return;
      }
      
      // 检查是否有新增节点需要翻译，过滤掉翻译操作产生的变化
      const hasNewNodes = mutations.some(mutation => {
        // 检查是否是子节点变化
        if (mutation.type === 'childList') {
          // 检查是否有新增节点
          if (mutation.addedNodes.length > 0) {
            return true;
          }
          // 检查是否有移除节点
          if (mutation.removedNodes.length > 0) {
            return true;
          }
        }
        // 检查是否是文本变化，过滤掉我们自己的翻译操作
        if (mutation.type === 'characterData') {
          // 检查父元素是否有翻译标记，避免无限循环
          const parentElement = mutation.target.parentElement;
          if (parentElement && !parentElement.dataset.oaoTranslating) {
            return true;
          }
        }
        return false;
      });
      
      if (hasNewNodes) {
        // 使用 requestIdleCallback 在浏览器空闲时执行翻译
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(() => translateRoot(document), { timeout: 500 });
        } else {
          translateRoot(document);
        }
      }
    }, 500);
    
    // 创建 MutationObserver
    const observer = new MutationObserver(debouncedTranslate);
    
    // 只监听特定容器，减少监听范围
    const targetContainers = [
      document.body, // 保留对 body 的监听作为备份
      document.querySelector('.content'),
      document.querySelector('.player-card'),
      document.querySelector('.evolution'),
      document.querySelector('.evo-'),
      document.querySelector('.futbin'),
      document.querySelector('.futgg')
    ];
    
    // 开始监听特定容器的变化
    targetContainers.forEach(container => {
      if (container) {
        observer.observe(container, {
          childList: true,  // 监听子节点的增删
          subtree: true     // 监听所有后代节点
        });
      }
    });
    
    
    // 若后续需要监听侧边栏自身变化，可在此定义 setupSidebarObserver；
    // 当前该函数未定义，做保护以避免观察者启动时抛出 ReferenceError。
    if (typeof setupSidebarObserver === 'function') {
      setupSidebarObserver();
    }
    
    // 专门针对 fut.gg evo-lab/evolve 页面的进化卡片翻译检测
    // 当用户点击 APPLY 按钮后，执行一次检测
    const checkEvoCardsOnce = () => {
      const isFutggEvolvePage = window.location.href.includes('/evo-lab/evolve');
      if (!isFutggEvolvePage) return;
      
      const evolutionDictionary = typeof dictionaryCache !== 'undefined' ? dictionaryCache.evolutions : null;
      if (!evolutionDictionary) return;
      
      const evolutionFormat = getEvolutionFormat();
      const useShortenTerms = getUseShortenTerms();
      
      // 检测带有进化卡片的按钮中的文本（包含FSU格式检测）
      const evoButtons = document.querySelectorAll('button[class*="bg-evo"][class*="text-evo"]:has(svg)');
      evoButtons.forEach(button => {
        const span = button.querySelector('span:not(:has(svg))');
        if (span) {
          const text = span.textContent.trim();
          
          // 检测FSU格式："[进化]-不朽大师"
          const fsuMatch = text.match(/^\[(.*?)\]-(.*)$/);
          if (fsuMatch) {
            // 提取中文部分
            const chineseName = fsuMatch[2].trim();
            // 尝试在进化字典中反向查找英文名称
            let foundOriginalName = false;
            for (const key in evolutionDictionary) {
              if (evolutionDictionary.hasOwnProperty(key)) {
                const dictValue = evolutionDictionary[key];
                const translation = typeof dictValue === 'object'
                  ? (useShortenTerms ? dictValue.shorten : dictValue.webpagedata) || dictValue
                  : dictValue;
                if (translation === chineseName) {
                  // 找到了原始英文名称，重新翻译
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      span.textContent = `${translation || key} (${key})`;
                      break;
                    case 1: // 来源中文
                      span.textContent = `${evolutionDictionary[key].source ? '【' + evolutionDictionary[key].source + '】' : ''}${translation || key}`;
                      break;
                    case 2: // 英文 - 保持原始英文，不翻译
                      span.textContent = key;
                      break;
                    case 3: // 【来源】中文（英文）
                      span.textContent = `${evolutionDictionary[key].source ? '【' + evolutionDictionary[key].source + '】' : ''}${translation || key} (${key})`;
                      break;
                  }
                  
                  // 添加保护标记
                  span.dataset.oaoFutggEvoProcessed = 'true';
                  span.dataset.oaoTranslated = 'true';
                  span.dataset.oaoProcessed = 'true';
                  span.dataset.oaoTranslationProtected = 'true';
                  span.dataset.oaoOriginalTranslation = span.textContent;
                  
                  foundOriginalName = true;
                  break;
                }
              }
            }
          } else if (span.dataset.oaoFutggEvoProcessed === 'true') {
            // 如果文本是纯英文（以数字或大写字母开头，不包含中文），则重新翻译
            if (text && /^(\d|[A-Z])/.test(text) && !text.includes('的') && !text.includes('版')) {
              // 清除标记，等待下次翻译周期重新翻译
              delete span.dataset.oaoFutggEvoProcessed;
              delete span.dataset.oaoTranslated;
            }
          } else {
            // 检查是否是纯英文且需要翻译
            const isEnglish = /^[a-zA-Z\s\-\[\]]+$/.test(text);
            if (isEnglish) {
              let foundKey = null;
              if (evolutionDictionary[text]) {
                foundKey = text;
              } else {
                const lowerText = text.toLowerCase();
                for (const key in evolutionDictionary) {
                  if (key.toLowerCase() === lowerText) {
                    foundKey = key;
                    break;
                  }
                }
              }
              
              if (foundKey) {
                const dictValue = evolutionDictionary[foundKey];
                const translation = typeof dictValue === 'object'
                  ? (useShortenTerms ? dictValue.shorten : dictValue.webpagedata) || dictValue
                  : dictValue;
                
                switch (evolutionFormat) {
                  case 0: // 中文（英文）
                    span.textContent = `${translation} (${foundKey})`;
                    break;
                  case 1: // 来源中文
                    span.textContent = `${evolutionDictionary[foundKey].source ? '【' + evolutionDictionary[foundKey].source + '】' : ''}${translation || foundKey}`;
                    break;
                  case 2: // 英文
                    span.textContent = foundKey;
                    break;
                  case 3: // 【来源】中文（英文）
                    span.textContent = `${evolutionDictionary[foundKey].source ? '【' + evolutionDictionary[foundKey].source + '】' : ''}${translation || foundKey} (${foundKey})`;
                    break;
                }
                
                // 添加保护标记
                span.dataset.oaoFutggEvoProcessed = 'true';
                span.dataset.oaoTranslated = 'true';
                span.dataset.oaoProcessed = 'true';
                span.dataset.oaoTranslationProtected = 'true';
                span.dataset.oaoOriginalTranslation = span.textContent;
              }
            }
          }
        }
      });
      
      // 检测导航按钮（如 Players、Evolutions、Evolve 等）是否被重置为英文
      const navButtons = document.querySelectorAll('button.text-evo:not(:has(svg))');
      navButtons.forEach(button => {
        if (button.dataset.oaoFutggNavProcessed === 'true') {
          const text = button.textContent.trim();
          // 如果文本是纯英文（首字母大写，不包含中文），则重新翻译
          if (text && /^[A-Z]/.test(text) && !text.includes('的') && !text.includes('(') && !text.includes('版')) {
            // 清除标记，等待下次翻译周期重新翻译
            delete button.dataset.oaoFutggNavProcessed;
            delete button.dataset.oaoTranslated;
          }
        }
      });
    };
    
    // 监听 APPLY 按钮的点击事件
    const setupApplyButtonListener = () => {
      const isFutggEvolvePage = window.location.href.includes('/evo-lab/evolve');
      if (!isFutggEvolvePage) return;
      
      // 使用事件委托，只注册一次
      document.addEventListener('click', (e) => {
        const button = e.target.closest('button[title="Apply evolution"]');
        if (button) {
          // 用户点击了 APPLY 按钮，执行一次检测
          checkEvoCardsOnce();
        }
      }, { passive: true });
    };
    
    // 在页面加载后设置 APPLY 按钮监听
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(setupApplyButtonListener, 3000);
      });
    } else {
      setTimeout(setupApplyButtonListener, 3000);
    }
    
    return observer;
  }

  // 检查是否是进化页面
  function isEvolutionPage() {
    return [evolutionsTranslator, futggEvolutionsTranslator, futggTranslator].some(
      (translator) =>
        translator &&
        typeof translator.isTargetPage === 'function' &&
        translator.isTargetPage()
    );
  }

  // 检查是否是 squad-builder 页面
  function isSquadBuilderPage() {
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;
    
    // FUTBIN squad-builder and tactics
    if (hostname.includes('futbin.com') && (pathname.includes('squad-builder') || pathname.includes('tactics'))) {
      return true;
    }
    
    // FUTGG squad-builder (beta-squad-builder)
    if (hostname.includes('fut.gg') && pathname.includes('squad-builder')) {
      return true;
    }
    
    return false;
  }

  // 检查是否是 SBC 页面
  function isSBCPage() {
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;
    
    // FUTGG SBC 页面
    if (hostname.includes('fut.gg') && pathname.startsWith('/sbc/')) {
      return true;
    }
    
    // FUTBIN SBC 页面
    if (hostname.includes('futbin.com') && pathname.startsWith('/squad-building-challenges')) {
      return true;
    }
    
    return false;
  }

  // 添加SBC球员评测按钮
  function addSBCPlayerReviewButton() {
    // 检查按钮是否已存在
    if (document.getElementById('oaevo-sbc-review-btn')) {
      return;
    }
    
    const hostname = window.location.hostname;
    let navContainer = null;
    
    if (hostname.includes('fut.gg')) {
      // FUTGG 页面
      navContainer = document.querySelector('.flex.flex-row.gap-4.themed-scrollbar.themed-scrollbar--x.themed-scrollbar--size-xs.sticky');
    } else if (hostname.includes('futbin.com')) {
      // FUTBIN 页面
      navContainer = document.querySelector('.scrollbox.full-width.desktop-horizontal-scroll.s-row.no-scrollbar.og-tab-menu');
    }
    
    if (!navContainer) {
      // console.log('[OAO] SBC导航容器未找到');
      return;
    }
    
    // 创建按钮
    const button = document.createElement('button');
    button.id = 'oaevo-sbc-review-btn';
    
    // 基础样式（与每周阵型战术推荐按钮一致）
    button.style.cssText = `
      background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(255, 87, 34, 0.4);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      padding: 8px 12px;
      z-index: 2147483647;
    `;
    
    // 添加图标
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      SBC球员评测
    `;
    
    // 鼠标悬停效果
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px) scale(1.02)';
      button.style.boxShadow = '0 6px 20px rgba(255, 87, 34, 0.6)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0) scale(1)';
      button.style.boxShadow = '0 3px 10px rgba(255, 87, 34, 0.4)';
    });
    
    // 点击事件
    button.addEventListener('click', () => {
      window.open('https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MzE2NzgyMQ==&action=getalbum&album_id=3721449259213029385&subscene=126&scenenote=https%3A%2F%2Fmp.weixin.qq.com%2Fs%3F__biz%3DMzA5MzE2NzgyMQ%3D%3D%26mid%3D2247492577%26idx%3D1%26sn%3Db4f86dad454872766eb573527ae27494%26chksm%3D91e50b31dfc2dc2c62b1bb9bb163b8d34dc47400d9141fbab57384642b353808518aab4ce177%26scene%3D126%26sessionid%3D1774093988%26subscene%3D91%26clicktime%3D1774093989%26enterid%3D1774093989%26key%3Ddaf9bdc5abc4e8d0ee55c68f2910b99b29485226d6b61da89c9017c359e2b1d2d2eff9249e28c7cd59ea10a7a3703048102ed34083bfcc6a4dd402ff4fd00b2235c1bc52222048dbb84cc9fccf5dcba6d81ac8763b863c59306c9336605af503784e85708c78f6913d66c1be11b0d25124ce3f6cf0f3a67cf0c5134918d98356%26ascene%3D0%26uin%3DNTg0ODA5NQ%253D%253D%26devicetype%3DUnifiedPCWindows%26version%3Df254181c%26lang%3Dzh_CN%26countrycode%3DCN%26exportkey%3Dn_ChQIAhIQow%252FRE3eo0zLDhnMRFsoPihLUAQIE97dBBAEAAAAAAMu2EHETHhcAAAAOpnltbLcz9gKNyK89dVj0J1GZgn44nGdTgdnHJWHB1r1x2e9Veg%252B75QPDr5JUgTAWhbvpz9NJOlu1%252FgJmwGKJOI8teFGTrEFXfeGFt7oVxVqmFib2AXc7FsWsOCvnmclnASzpzQqV%252BkhzPwQV5ZxgmBhvPW9gaW1YojKsRtKQb7x2n6Mv5UF9%252FCVPJu1QnsmEQOubi1fC%252BtH5dqU72MtUmjPMF9kc6Z6x0H6fVKHPdGJJv4NO%252Fs19oEIL6O83%26acctmode%3D0%26pass_ticket%3Dgms5p%252BXycs%252ByJ9UEMuOTnlvPQSGKn9Ed1WFHuIkgJHBsWjQGGlvoKV95IV3Qr1ly%26wx_header%3D0&nolastread=1&sessionid=#wechat_redirect', '_blank');
    });
    
    // 添加到导航容器末尾
    navContainer.appendChild(button);
    // console.log('[OAO] SBC球员评测按钮已添加');
  }



  // 在 squad-builder 页面添加"每周阵型战术推荐"按钮
  function addWeeklyTacticsButton() {
    // console.log('[OAO] addWeeklyTacticsButton called');
    
    // 检查是否已存在
    if (document.getElementById('oaevo-weekly-tactics-btn')) {
      // console.log('[OAO] Button already exists, skipping');
      return;
    }
    
    const hostname = window.location.hostname;
    // console.log('[OAO] Hostname:', hostname);
    // console.log('[OAO] isSquadBuilderPage:', isSquadBuilderPage());
    
    // 创建按钮
    const button = document.createElement('button');
    button.id = 'oaevo-weekly-tactics-btn';
    button.textContent = '每周阵型战术推荐';
    
    // 基础样式
    button.style.cssText = `
      background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(255, 87, 34, 0.4);
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      z-index: 2147483647;
    `;
    
    // 添加图标
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
      每周阵型战术推荐
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px) scale(1.02)';
      button.style.boxShadow = '0 6px 20px rgba(255, 87, 34, 0.6)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0) scale(1)';
      button.style.boxShadow = '0 3px 10px rgba(255, 87, 34, 0.4)';
    });
    
    button.addEventListener('click', () => {
      window.open('https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MzE2NzgyMQ==&action=getalbum&album_id=3714272208722886660#wechat_redirect', '_blank');
    });
    
    if (hostname.includes('fut.gg')) {
      // FUTGG 页面（squad-builder）
      // console.log('[OAO] FUTGG detected');
      // 目标：把按钮直接放到 grid 容器最上面（Row 0，工具栏上方），
      // 并同步把 grid-rows 改为 [auto_auto_auto_auto_1fr] 容纳 5 行，
      // 让原 Row 4（搜索结果区）仍为 1fr 弹性行 → 不挤压下方。
      let toolbar = null;

      // 优先用语义锚点 nav[aria-label*="Squad Builder"] 反查父级工具栏容器
      const squadNav = document.querySelector('nav[aria-label*="Squad Builder" i]');
      if (squadNav) {
        toolbar = squadNav.closest('div.flex.gap-2.pt-2.px-2') || squadNav.parentElement;
      }

      // 兜底：用工具栏自身的 class（gap-2 而非旧的 gap-x-4）精确匹配
      if (!toolbar) {
        toolbar = document.querySelector('div.flex.gap-2.pt-2.px-2');
      }

      if (toolbar) {
        const gridContainer = toolbar.parentElement;
        if (gridContainer && gridContainer.classList.contains('grid-rows-[auto_auto_auto_1fr]')) {
          // 改 grid-template-rows 容纳 5 行
          // 原 4 行：工具栏 / 化学摘要 / 标签栏 / 搜索结果(1fr)
          // 改后 5 行：按钮 / 工具栏 / 化学摘要 / 标签栏 / 搜索结果(1fr)
          // → 搜索结果仍是 1fr 弹性行，不被挤压
          gridContainer.style.gridTemplateRows = 'auto auto auto auto 1fr';

          // 紧凑高度样式（独立成行、不浮层、不与化学摘要重叠）
          button.style.cssText = `
            background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(255, 87, 34, 0.4);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
            padding: 6px 12px;
            width: 100%;
            justify-content: center;
          `;

          button.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            每周阵型战术推荐
          `;

          // wrapper 作为 grid Row 0，prepend 到 grid 容器第一个位置
          const wrapper = document.createElement('div');
          wrapper.className = 'oao-weekly-tactics-row flex gap-2 px-2 pt-1 pb-1';
          wrapper.setAttribute('data-oao-injected', 'weekly-tactics');
          wrapper.appendChild(button);
          gridContainer.insertBefore(wrapper, gridContainer.firstChild);
          // console.log('[OAO] Weekly tactics button prepended to grid container as Row 0');
        } else {
          // 找不到 grid 容器，回退到 fixed 浮动
          button.style.cssText = `
            background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(255, 87, 34, 0.6);
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
            z-index: 2147483647;
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
          `;
          document.body.appendChild(button);
          // console.log('[OAO] Grid container not found, using fixed position');
        }
      } else {
        // 如果找不到工具栏容器，回退到固定位置
        button.style.cssText += `
          position: fixed;
          top: 100px;
          right: 20px;
          padding: 12px 20px;
          box-shadow: 0 4px 20px rgba(255, 87, 34, 0.6);
        `;
        document.body.appendChild(button);
        // console.log('[OAO] Button added to FUTGG with fixed position');
      }
    } else if (hostname.includes('futbin.com')) {
      // console.log('[OAO] FUTBIN detected');
      
      // 检查是否是战术页面
      const isTacticsPage = window.location.pathname.includes('tactics');
      // console.log('[OAO] Is tactics page:', isTacticsPage);
      
      if (isTacticsPage) {
        // console.log('[OAO] FUTBIN tactics page detected');
        
        // 检查是否是战术和阵型构建器页面
        const isTacticsBuilderPage = window.location.pathname.includes('tactics-and-formations');
        // console.log('[OAO] Is tactics-and-formations page:', isTacticsBuilderPage);
        
        if (isTacticsBuilderPage) {
          // 战术和阵型构建器页面：把按钮 append 到 .tactics-and-formations-controls-section 容器底部
          // console.log('[OAO] Trying to append weekly-tactics button to tactics-and-formations-controls-section');

          const tryFindAndInsert = () => {
            const controlsSection = document.querySelector('.tactics-and-formations-controls-section');
            // console.log('[OAO] tactics-and-formations-controls-section found:', controlsSection);

            if (controlsSection) {
              // 重置为容器内普通 block 样式，避免 fixed / z-index 等回退样式残留
              button.style.cssText = `
                background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
                color: #fff;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                box-shadow: 0 3px 10px rgba(255, 87, 34, 0.4);
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                white-space: nowrap;
                padding: 12px 20px;
                margin: 10px 0 0 0;
                width: 100%;
                justify-content: center;
              `;
              button.setAttribute('data-oao-injected', 'weekly-tactics-futbin');

              // append 到控制面板容器末尾
              controlsSection.appendChild(button);
              // console.log('[OAO] Button appended to tactics-and-formations-controls-section');
              return true;
            }
            return false;
          };

          // 立即尝试插入
          if (!tryFindAndInsert()) {
            // 如果失败，使用 MutationObserver 等待元素加载
            // console.log('[OAO] tactics-and-formations-controls-section not ready, waiting with MutationObserver');
            const observer = new MutationObserver((mutations, obs) => {
              if (tryFindAndInsert()) {
                obs.disconnect();
                // console.log('[OAO] Observer disconnected after successful insertion');
              }
            });

            observer.observe(document.body, {
              childList: true,
              subtree: true
            });

            // 8秒后停止观察，使用固定定位作为回退
            setTimeout(() => {
              observer.disconnect();
              // console.log('[OAO] Observer timeout, checking if button exists');
              if (!document.getElementById('oaevo-weekly-tactics-btn')) {
                // console.log('[OAO] Button not inserted, using fixed position as fallback');
                button.style.cssText += `
                  position: fixed;
                  top: 120px;
                  right: 20px;
                  padding: 12px 20px;
                  box-shadow: 0 4px 15px rgba(255, 87, 34, 0.5);
                `;
                document.body.appendChild(button);
              }
            }, 8000);
          }
        } else {
          // 其他战术页面：使用固定定位
          console.log('[OAO] Using fixed position for other tactics page');
          button.style.cssText += `
            position: fixed;
            top: 120px;
            right: 20px;
            padding: 12px 20px;
            box-shadow: 0 4px 15px rgba(255, 87, 34, 0.5);
          `;
          document.body.appendChild(button);
          console.log('[OAO] Button added to tactics page with fixed position');
        }
      } else {
        // 阵容构建器页面：把按钮放到 .squad-info-container-modern 容器底部
        // 用户指定位置：价格区块下方的空位（append 到容器末尾）
        // console.log('[OAO] Trying to append weekly-tactics button to squad-info-container-modern');

        const tryFindAndInsert = () => {
          const squadInfoContainer = document.querySelector('.squad-info-container-modern');
          // console.log('[OAO] squad-info-container-modern found:', squadInfoContainer);

          if (squadInfoContainer) {
            // 重置为容器内普通 block 样式，避免 fixed / z-index 等回退样式残留
            button.style.cssText = `
              background: linear-gradient(135deg, #FF5722 0%, #E64A19 100%);
              color: #fff;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 3px 10px rgba(255, 87, 34, 0.4);
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 8px;
              white-space: nowrap;
              padding: 12px 20px;
              margin: 10px 0 0 0;
              width: 100%;
              justify-content: center;
            `;
            button.setAttribute('data-oao-injected', 'weekly-tactics-futbin');

            // append 到信息面板容器末尾
            squadInfoContainer.appendChild(button);
            // console.log('[OAO] Button appended to squad-info-container-modern');
            return true;
          }
          return false;
        };

        // 立即尝试插入
        if (!tryFindAndInsert()) {
          // 如果失败，使用 MutationObserver 等待元素加载
          // console.log('[OAO] squad-info-container-modern not ready, waiting with MutationObserver');
          const observer = new MutationObserver((mutations, obs) => {
            if (tryFindAndInsert()) {
              obs.disconnect();
              // console.log('[OAO] Observer disconnected after successful insertion');
            }
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true
          });

          // 8秒后停止观察，使用固定定位作为回退
          setTimeout(() => {
            observer.disconnect();
            // console.log('[OAO] Observer timeout, checking if button exists');
            if (!document.getElementById('oaevo-weekly-tactics-btn')) {
              // console.log('[OAO] Button not inserted, using fixed position as fallback');
              button.style.cssText += `
                position: fixed;
                top: 120px;
                right: 20px;
                padding: 12px 20px;
                box-shadow: 0 4px 15px rgba(255, 87, 34, 0.5);
              `;
              document.body.appendChild(button);
              // console.log('[OAO] Button added to squad builder with fixed position');
            }
          }, 8000);
        }
      }
    } else {
      // 其他网站使用固定定位
      console.log('[OAO] Other site, using fixed position');
      button.style.cssText += `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 12px 20px;
        box-shadow: 0 4px 20px rgba(255, 87, 34, 0.6);
      `;
      document.body.appendChild(button);
      console.log('[OAO] Button added to other site with fixed position');
    }
  }
  
  // 监听页面变化，确保按钮在页面刷新后重新创建
  function setupButtonWatcher() {
    // 定期检查按钮是否存在
    setInterval(() => {
      if (!document.getElementById('oaevo-weekly-tactics-btn') && isSquadBuilderPage()) {
        addWeeklyTacticsButton();
      }
      if (!document.getElementById('oaevo-sbc-review-btn') && isSBCPage()) {
        addSBCPlayerReviewButton();
      }
    }, 20000);
  }

  // 处理刷新按钮点击
  async function handleRefreshButtonClick(event) {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = '获取中...';
    try {
      const updatedDictionary = await forceRefreshEvolutionsDictionary();
      await translateRoot(document);
      button.textContent = '更新成功';
      setTimeout(() => {
        button.textContent = REFRESH_BUTTON_DEFAULT_TEXT;
      }, 1500);
    } catch (error) {
      button.textContent = '获取失败';
      setTimeout(() => {
        button.textContent = REFRESH_BUTTON_DEFAULT_TEXT;
      }, 2000);
      
      // 显示详细错误信息
      showErrorMessage(error);
    } finally {
      button.disabled = false;
    }
  }

  // 显示错误信息
  function showErrorMessage(error) {
    const errorDetails = analyzeError(error);
    const errorMessage = `获取进化翻译数据失败\n\n` +
      `错误原因: ${errorDetails.reason}\n\n` +
      `详细信息:\n${errorDetails.details}\n\n` +
      `建议:\n${errorDetails.suggestions}`;
    
    alert(errorMessage);
  }

  // 分析错误原因
  function analyzeError(error) {
    const result = {
      reason: '未知错误',
      details: error.message || error.toString(),
      suggestions: '请检查网络连接或联系开发者'
    };

    if (error.message && error.message.includes('Network error')) {
      result.reason = '网络连接失败';
      result.details = '无法连接到 GitHub 服务器\n' +
        '可能原因:\n' +
        '1. 网络连接不稳定\n' +
        '2. GitHub 服务暂时不可用\n' +
        '3. 需要使用 VPN 访问 GitHub';
      result.suggestions = '1. 检查网络连接\n' +
        '2. 尝试使用 VPN\n' +
        '3. 稍后重试';
    } else if (error.message && error.message.includes('Failed to parse JSON')) {
      result.reason = '数据格式错误';
      result.details = 'GitHub 上的 JSON 文件格式不正确\n' +
        '可能原因:\n' +
        '1. JSON 文件包含语法错误\n' +
        '2. JSON 文件格式不符合要求';
      result.suggestions = '1. 检查 GitHub 上的 JSON 文件格式\n' +
        '2. 确保文件包含有效的 JSON 数据\n' +
        '3. 联系开发者检查文件格式';
    } else if (error.message && error.message.includes('Request failed with status')) {
      const statusMatch = error.message.match(/status (\d+)/);
      const statusCode = statusMatch ? statusMatch[1] : '未知';
      
      if (statusCode === '404') {
        result.reason = '文件不存在';
        result.details = 'GitHub 上的 JSON 文件不存在\n' +
          '可能原因:\n' +
          '1. 文件路径错误\n' +
          '2. 文件已被删除\n' +
          '3. 仓库或文件未公开';
        result.suggestions = '1. 检查文件路径是否正确\n' +
          '2. 确保仓库已公开\n' +
          '3. 确认文件存在于仓库中';
      } else if (statusCode === '403') {
        result.reason = '访问被拒绝';
        result.details = '无法访问 GitHub 文件\n' +
          '可能原因:\n' +
          '1. 仓库未公开\n' +
          '2. GitHub 访问限制';
        result.suggestions = '1. 确保仓库已公开\n' +
          '2. 稍后重试';
      } else {
        result.reason = `HTTP 错误 (${statusCode})`;
        result.details = `GitHub 服务器返回错误状态码: ${statusCode}`;
        result.suggestions = '1. 稍后重试\n' +
          '2. 联系开发者';
      }
    } else if (error.message && error.message.includes('GM_xmlhttpRequest')) {
      result.reason = 'API 调用失败';
      result.details = '篡改猴 API 调用失败\n' +
        '可能原因:\n' +
        '1. 篡改猴版本过旧\n' +
        '2. 浏览器不支持相关 API';
      result.suggestions = '1. 更新篡改猴到最新版本\n' +
        '2. 检查浏览器兼容性\n' +
        '3. 尝试使用其他浏览器';
    }

    return result;
  }

  // 监控进化页面变化
  function monitorEvolutionPageChanges() {
    const getLocationSignature = () => {
      if (!window.location) {
        return '';
      }
      return window.location.hostname + window.location.pathname;
    };
    let lastLocationSignature = getLocationSignature();

    const notifyIfChanged = () => {
      const nextSignature = getLocationSignature();
      if (nextSignature !== lastLocationSignature) {
        lastLocationSignature = nextSignature;
        syncSidebarState(); // 同步侧边栏状态
        // SPA 路由切换（如 fut.gg 切换到另一球员页）时重建球员评测入口
        injectPlayerReview();
        // 检查是否需要添加或移除每周阵型战术推荐按钮
        if (isSquadBuilderPage()) {
          addWeeklyTacticsButton();
        } else {
          // 离开 squad-builder 页面，移除按钮并还原 grid-rows
          const btn = document.getElementById('oaevo-weekly-tactics-btn');
          if (btn) {
            // FUTGG：按钮被包裹在带 data-oao-injected="weekly-tactics" 的 wrapper 中
            const wrapper = btn.closest('[data-oao-injected="weekly-tactics"]');
            const gridContainer = wrapper ? wrapper.parentElement : null;
            if (wrapper) {
              wrapper.remove();
            } else {
              // FUTBIN：按钮直接 append 到容器，或 fallback 到 body
              btn.remove();
            }
            if (gridContainer && gridContainer.classList.contains('grid-rows-[auto_auto_auto_1fr]')) {
              gridContainer.style.gridTemplateRows = '';
            }
          }
        }
      }
    };

    const wrapHistoryMethod = (methodName) => {
      const original = history[methodName];
      if (typeof original !== 'function') {
        return;
      }
      history[methodName] = function (...args) {
        const result = original.apply(this, args);
        notifyIfChanged();
        return result;
      };
    };

    wrapHistoryMethod('pushState');
    wrapHistoryMethod('replaceState');
    window.addEventListener('popstate', notifyIfChanged);
    window.setInterval(notifyIfChanged, LOCATION_CHECK_INTERVAL_MS);
  }


  // 检查版本更新
  // mode: 'background' - 后台检查，只显示红点
  // mode: 'popup' - 满足间隔时显示弹窗
  // 版本号解析：支持 3~4 段（x.y.z 或 x.y.z.w）
  // 约定：外壳（Loader）用 3 段；内容包（bundle）用 4 段，两者独立演进。
  const OAO_VERSION_PATTERN = /^\d+(\.\d+){2,3}$/;
  function parseVersionParts(value) {
    const normalized = (value || '').trim();
    if (!OAO_VERSION_PATTERN.test(normalized)) return null;
    const parts = normalized.split('.').map(Number);
    if (parts.length < 3 || parts.length > 4) return null;
    if (parts.some(part => !Number.isSafeInteger(part) || part < 0)) return null;
    return parts;
  }
  // 比较版本号：返回 -1（a<b） / 0（相等） / 1（a>b）
  // 段数不同的版本按「缺少的段视为 0」比较（如 27.0.3 < 27.0.3.1）
  function compareOaoVersions(a, b) {
    const aParts = parseVersionParts(a);
    const bParts = parseVersionParts(b);
    // 版本号无效时视为「无更新」，避免因本地开发版本（如 local-dev）或脏数据导致弹窗整体崩溃
    if (!aParts || !bParts) return 0;
    const len = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < len; i++) {
      const diff = (aParts[i] || 0) - (bParts[i] || 0);
      if (diff !== 0) return diff < 0 ? -1 : 1;
    }
    return 0;
  }
  const OAO_RELEASE_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  function parseOaoVersionManifest(source) {
    const text = (source || '').trim();
    if (!text) throw new Error('版本清单为空');
    if (text.startsWith('<')) throw new Error('版本清单地址返回的是网页内容而非 JSON');
    let parsed;
    try { parsed = JSON.parse(text); }
    catch { throw new Error('版本清单不是有效的 JSON'); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('版本清单格式错误');

    // 解析内容包（bundle）版本信息：优先从 bundles[] 取与当前 id 匹配的项，否则取首个
    let bundleVersion = '';
    let releaseDate = '';
    let updateNotes = [];
    const currentBundleId = (typeof window !== 'undefined' && window.__OAO_BUNDLE_ID__) || 'oao-translate';
    if (Array.isArray(parsed.bundles) && parsed.bundles.length) {
      const target = parsed.bundles.find(b => b && b.id === currentBundleId) || parsed.bundles[0];
      bundleVersion = typeof target.version === 'string' ? target.version.trim() : '';
      releaseDate = typeof target.release_date === 'string' ? target.release_date.trim() : '';
      updateNotes = Array.isArray(target.update_notes) ? target.update_notes : [];
    } else {
      // 兼容旧形状（顶层 version / latest_version / release_date / update_notes）
      bundleVersion = (typeof parsed.version === 'string' && parsed.version.trim()) ||
                      (typeof parsed.latest_version === 'string' && parsed.latest_version.trim()) || '';
      releaseDate = typeof parsed.release_date === 'string' ? parsed.release_date.trim() : '';
      updateNotes = Array.isArray(parsed.update_notes) ? parsed.update_notes : [];
    }

    if (!parseVersionParts(bundleVersion)) throw new Error('版本号格式错误：' + bundleVersion);
    if (releaseDate && !OAO_RELEASE_DATE_PATTERN.test(releaseDate)) throw new Error('发布日期格式错误：' + releaseDate);
    const safeNotes = updateNotes.slice(0, 30).map(note => typeof note === 'string' ? note.trim() : '').filter(Boolean);

    // 外壳（Loader）版本：优先 loader_version，回退到内容包版本
    const loaderVersion = (typeof parsed.loader_version === 'string' && parsed.loader_version.trim()) ||
                          bundleVersion;
    if (!parseVersionParts(loaderVersion)) throw new Error('外壳版本号格式错误：' + loaderVersion);

    return {
      bundle_version: bundleVersion,
      release_date: releaseDate,
      update_notes: safeNotes,
      loader_version: loaderVersion
    };
  }
  function shouldPromptVersion(targetVersion, now) {
    try {
      const raw = localStorage.getItem(LAST_VERSION_PROMPT_KEY);
      if (!raw) return true;
      const record = JSON.parse(raw);
      if (!record || record.targetVersion !== targetVersion) return true;
      const promptedAt = Number(record.promptedAt);
      return !Number.isFinite(promptedAt) || (now - promptedAt) >= VERSION_CHECK_INTERVAL;
    } catch {
      return true;
    }
  }
  function markVersionPrompted(targetVersion, now) {
    try {
      localStorage.setItem(LAST_VERSION_PROMPT_KEY, JSON.stringify({
        targetVersion,
        promptedAt: now
      }));
    } catch {
      // ignore storage errors
    }
  }
  async function checkVersionUpdate(mode = 'background') {
    const lastCheckDate = localStorage.getItem(VERSION_CHECK_KEY);
    const now = Date.now();

    // 弹窗模式：满足间隔要求才继续；background 模式不受间隔限制，避免丢失新版本状态
    if (mode === 'popup') {
      if (lastCheckDate && (now - parseInt(lastCheckDate || '0')) < VERSION_CHECK_INTERVAL) {
        // 但如果已经缓存了新版本且尚未弹窗，仍尝试弹窗
        try {
          const cached = JSON.parse(localStorage.getItem(NEW_VERSION_KEY) || 'null');
          const liveLoaderVersion = getLoaderVersion();
          if (cached && cached.loaderRemote &&
              compareOaoVersions(cached.loaderRemote, liveLoaderVersion) > 0 &&
              shouldPromptVersion(cached.loaderRemote, now)) {
            markVersionPrompted(cached.loaderRemote, now);
            showUpdateDialog({
              bundle_version: cached.bundleVersion,
              release_date: cached.releaseDate,
              update_notes: cached.updateNotes,
              loader_version: cached.loaderRemote
            });
          }
        } catch {}
        return;
      }
    }
    // debug=1 强制清除检查缓存
    if (window.location.href.includes('debug=1')) {
      localStorage.removeItem(VERSION_CHECK_KEY);
    }

    try {
      GM_xmlhttpRequest({
        method: 'GET',
        url: VERSION_MANIFEST_URL,
        timeout: 6000,
        headers: { Accept: 'application/json' },
        onload: function (response) {
          if (response.status < 200 || response.status >= 300) return;
          let manifest;
          try {
            manifest = parseOaoVersionManifest(response.responseText);
          } catch (err) {
            console.warn('[OAO][Update] 版本清单解析失败：', err && err.message);
            return;
          }
          const loaderRemote = manifest.loader_version;
          const loaderCurrent = getLoaderVersion();
          const loaderHasNew = compareOaoVersions(loaderRemote, loaderCurrent) > 0;
          if (loaderHasNew) {
            newVersionInfo = {
              loaderRemote: loaderRemote,
              loaderCurrent: loaderCurrent,
              bundleVersion: manifest.bundle_version,
              releaseDate: manifest.release_date,
              updateNotes: manifest.update_notes
            };
            localStorage.setItem(NEW_VERSION_KEY, JSON.stringify(newVersionInfo));
            updateVersionIndicator(true);
            if (mode === 'popup' && shouldPromptVersion(loaderRemote, now)) {
              markVersionPrompted(loaderRemote, now);
              showUpdateDialog(manifest);
            }
          } else {
            localStorage.removeItem(NEW_VERSION_KEY);
            newVersionInfo = null;
            updateVersionIndicator(false);
          }
          localStorage.setItem(VERSION_CHECK_KEY, Date.now().toString());
        },
        onerror: function () { /* 静默 */ },
        ontimeout: function () { /* 静默 */ }
      });
    } catch (error) {
      // 静默处理错误
    }
  }
  
  // 点击侧边栏版本号时强制拉取 version.json 并弹窗（绕过 24h 间隔限制）
  function fetchVersionManifestForDialog() {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: VERSION_MANIFEST_URL,
        timeout: 8000,
        headers: { Accept: 'application/json' },
        onload: function (response) {
          if (response.status < 200 || response.status >= 300) {
            reject(new Error('HTTP ' + response.status));
            return;
          }
          let manifest;
          try {
            manifest = parseOaoVersionManifest(response.responseText);
          } catch (err) {
            reject(err);
            return;
          }
          // 直接弹窗展示远程版本信息（不做版本比较）
          try {
            showUpdateDialog(manifest);
          } catch (err) {
            console.error('[OAO] 更新弹窗渲染失败：', err && err.stack);
          }
          resolve(manifest);
        },
        onerror: function () { reject(new Error('网络请求失败')); },
        ontimeout: function () { reject(new Error('请求超时')); }
      });
    });
  }
  
  // 更新版本信息处的红点指示器
  function updateVersionIndicator(hasNewVersion) {
    const versionInfo = document.querySelector('#oaevo-sidebar-panel div[data-version-indicator]');
    if (versionInfo) {
      const dot = versionInfo.querySelector('.version-update-dot');
      if (hasNewVersion) {
        if (!dot) {
          const newDot = document.createElement('span');
          newDot.className = 'version-update-dot';
          newDot.style.cssText = `
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #ff4444;
            border-radius: 50%;
            margin-left: 6px;
            animation: pulse 2s infinite;
          `;
          versionInfo.appendChild(newDot);
        }
      } else {
        if (dot) {
          dot.remove();
        }
      }
    }
  }
  
  // 版本号比较函数（返回 1: remote > current, 0: 相等, -1: remote < current）
  function compareVersions(remote, current) {
    const remoteParts = remote.split('.').map(Number);
    const currentParts = current.split('.').map(Number);
    
    for (let i = 0; i < Math.max(remoteParts.length, currentParts.length); i++) {
      const remotePart = remoteParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (remotePart > currentPart) return 1;
      if (remotePart < currentPart) return -1;
    }
    
    return 0;
  }
  
  // 显示更新提示弹窗
  // 显示更新提示弹窗（两区块：外壳更新 / 内容包更新记录）
  // manifest: { bundle_version, release_date, update_notes, loader_version }
  function showUpdateDialog(manifest) {
    const m = manifest || {};
    const bundleVersion = m.bundle_version || getScriptVersion();
    const releaseDate = m.release_date || '';
    const notes = Array.isArray(m.update_notes) ? m.update_notes : [];

    const loaderRemote = m.loader_version || bundleVersion;
    const loaderCurrent = getLoaderVersion();
    const loaderHasNew = compareOaoVersions(loaderRemote, loaderCurrent) > 0;

    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.72);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Microsoft YaHei', sans-serif;
      padding: 16px;
    `;
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // 创建弹窗（参考 FCX 深色主题）
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #1e2127;
      border: 1px solid rgba(227, 192, 117, 0.3);
      border-radius: 16px;
      padding: 28px 28px 22px 28px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      color: #f5f5f5;
      position: relative;
    `;

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      position: absolute;
      top: 14px;
      right: 16px;
      background: transparent;
      border: none;
      color: #9ca3af;
      font-size: 26px;
      line-height: 1;
      cursor: pointer;
      padding: 0 4px;
    `;
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.color = '#ffffff'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.color = '#9ca3af'; });
    closeBtn.addEventListener('click', () => overlay.remove());

    // 标题
    const title = document.createElement('div');
    title.style.cssText = 'margin: 0 0 16px 0; font-size: 22px; font-weight: 700;';
    title.textContent = 'OAO-FCUT模式翻译插件 · 版本信息';

    // ===== 区块一：外壳（Loader / userscript 本体）=====
    const shellCard = document.createElement('div');
    shellCard.style.cssText = `
      background: linear-gradient(135deg, rgba(227, 192, 117, 0.12), rgba(227, 192, 117, 0.04));
      border: 1px solid rgba(227, 192, 117, 0.28);
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 14px;
    `;
    const shellTitle = document.createElement('div');
    shellTitle.style.cssText = 'font-size: 16px; font-weight: 700; color: #f5f5f5; margin-bottom: 12px; letter-spacing: 0.5px;';
    shellTitle.textContent = '插件本体';
    shellCard.appendChild(shellTitle);

    const shellVerRow = document.createElement('div');
    shellVerRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;';
    const shellCur = document.createElement('span');
    shellCur.style.cssText = 'font-size: 13px; color: #9ca3af;';
    shellCur.textContent = '当前 ';
    const shellCurVer = document.createElement('span');
    shellCurVer.style.cssText = 'font-size: 15px; font-weight: 700; color: #e3c075;';
    shellCurVer.textContent = 'v' + loaderCurrent;
    shellCur.appendChild(shellCurVer);
    const shellArrow = document.createElement('span');
    shellArrow.innerHTML = '&#10140;';
    shellArrow.style.cssText = 'color: #e3c075; font-size: 16px;';
    const shellLatest = document.createElement('span');
    shellLatest.style.cssText = 'font-size: 13px; color: #9ca3af;';
    shellLatest.textContent = '最新 ';
    const shellLatestVer = document.createElement('span');
    shellLatestVer.style.cssText = 'font-size: 15px; font-weight: 700; color: #e3c075;';
    shellLatestVer.textContent = 'v' + loaderRemote;
    shellLatest.appendChild(shellLatestVer);
    shellVerRow.appendChild(shellCur);
    shellVerRow.appendChild(shellArrow);
    shellVerRow.appendChild(shellLatest);
    shellCard.appendChild(shellVerRow);

    if (loaderHasNew) {
      const shellWarn = document.createElement('div');
      shellWarn.style.cssText = 'font-size: 13px; color: #f09595; margin-bottom: 12px;';
      shellWarn.textContent = '插件需要更新，请前往更新';
      shellCard.appendChild(shellWarn);

      const goBtn = document.createElement('button');
      goBtn.textContent = '前往更新';
      goBtn.style.cssText = `
        padding: 9px 20px;
        border: none;
        border-radius: 10px;
        background: linear-gradient(135deg, #4ade80, #22c55e);
        color: #0f172a;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        transition: filter 0.18s ease;
        box-shadow: 0 6px 18px rgba(34, 197, 94, 0.28);
      `;
      goBtn.addEventListener('mouseenter', () => { goBtn.style.filter = 'brightness(1.08)'; });
      goBtn.addEventListener('mouseleave', () => { goBtn.style.filter = 'brightness(1)'; });
      goBtn.addEventListener('click', () => {
        window.open(SCRIPTCAT_SCRIPT_URL, '_blank');
        overlay.remove();
      });
      shellCard.appendChild(goBtn);
    } else {
      const shellOk = document.createElement('div');
      shellOk.style.cssText = 'font-size: 13px; color: #5dcab5;';
      shellOk.textContent = '插件已是最新版本';
      shellCard.appendChild(shellOk);
    }

    // ===== 区块二：内容包（自动更新，纯展示）=====
    const contentCard = document.createElement('div');
    contentCard.style.cssText = `
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 22px;
    `;
    const contentTitle = document.createElement('div');
    contentTitle.style.cssText = 'font-size: 16px; font-weight: 700; color: #f5f5f5; margin-bottom: 12px; letter-spacing: 0.5px;';
    contentTitle.textContent = '内容包（自动更新）';
    contentCard.appendChild(contentTitle);

    const contentHead = document.createElement('div');
    contentHead.style.cssText = 'font-size: 13px; color: #9ca3af; margin-bottom: 4px; line-height: 1.7;';
    contentHead.appendChild(document.createTextNode('已更新至 '));
    const contentVer = document.createElement('span');
    contentVer.style.cssText = 'font-size: 15px; font-weight: 700; color: #e3c075;';
    contentVer.textContent = 'v' + bundleVersion;
    contentHead.appendChild(contentVer);
    if (releaseDate) {
      const contentDate = document.createElement('span');
      contentDate.style.cssText = 'font-size: 13px; font-weight: 700; color: #5dcab5;';
      contentDate.textContent = '  ·  更新日期 ' + releaseDate;
      contentHead.appendChild(contentDate);
    }
    contentHead.appendChild(document.createTextNode('，无需手动操作'));
    contentCard.appendChild(contentHead);

    const notesTitle = document.createElement('div');
    notesTitle.style.cssText = 'font-size: 13px; color: #9ca3af; margin: 12px 0 6px 0;';
    notesTitle.textContent = '更新内容';
    contentCard.appendChild(notesTitle);

    if (notes.length === 0) {
      const emptyNote = document.createElement('div');
      emptyNote.style.cssText = 'font-size: 13px; color: #9ca3af;';
      emptyNote.textContent = '本次更新包含常规优化与修复。';
      contentCard.appendChild(emptyNote);
    } else {
      const notesList = document.createElement('ul');
      notesList.style.cssText = 'margin: 0; padding-left: 20px; list-style: decimal;';
      notes.forEach(note => {
        const li = document.createElement('li');
        li.style.cssText = 'font-size: 13px; color: #e5e7eb; line-height: 1.75; margin-bottom: 4px;';
        // 去掉条目前面自带的 "1." / "-" 等编号
        li.textContent = String(note).replace(/^\s*[\d\-)、.]+\s*/, '');
        notesList.appendChild(li);
      });
      contentCard.appendChild(notesList);
    }

 

    // 按钮容器（仅关闭）
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭弹窗';
    closeButton.style.cssText = `
      padding: 10px 24px;
      border: none;
      border-radius: 10px;
      background: linear-gradient(135deg, #4ade80, #22c55e);
      color: #0f172a;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: filter 0.18s ease;
      box-shadow: 0 6px 18px rgba(34, 197, 94, 0.28);
    `;
    closeButton.addEventListener('mouseenter', () => { closeButton.style.filter = 'brightness(1.08)'; });
    closeButton.addEventListener('mouseleave', () => { closeButton.style.filter = 'brightness(1)'; });
    closeButton.addEventListener('click', () => overlay.remove());
    buttonContainer.appendChild(closeButton);

    // 组装
    dialog.appendChild(closeBtn);
    dialog.appendChild(title);
    dialog.appendChild(shellCard);
    dialog.appendChild(contentCard);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    if (document.body) {
      document.body.appendChild(overlay);
    } else {
      (document.documentElement || document).appendChild(overlay);
    }
  }

  // 启动函数
  // 检查并显示更新内容
  function checkAndShowUpdateContent() {
    console.log('=== 开始检查更新内容 ===');
    
    // 计算当天3点的时间戳
    const now = new Date();
    const today3am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 3, 0, 0, 0);
    const today3amTimestamp = today3am.getTime();
    const currentTimestamp = now.getTime();
    
    // 获取最后检查时间戳
    const lastCheckTimestamp = parseInt(getStorageValue(LAST_UPDATE_CHECK_KEY) || '0');
    
    console.log('当前时间戳:', currentTimestamp);
    console.log('当天3点时间戳:', today3amTimestamp);
    console.log('最后检查时间戳:', lastCheckTimestamp);
    
    // 检查是否需要更新
    if (currentTimestamp > today3amTimestamp && lastCheckTimestamp < today3amTimestamp) {
      console.log('需要检查更新内容（已过当天3点）');
      setStorageValue(LAST_UPDATE_CHECK_KEY, currentTimestamp.toString());
      
      // 从Gitee获取更新内容
      console.log('开始从Gitee获取更新内容:', UPDATE_CONTENT_URL);
      GM_xmlhttpRequest({
        method: 'GET',
        url: UPDATE_CONTENT_URL,
        onload: function(response) {
          console.log('Gitee请求状态:', response.status);
          if (response.status === 200) {
            console.log('Gitee请求成功，响应长度:', response.responseText.length);
            try {
              const data = JSON.parse(response.responseText);
              console.log('解析更新内容成功:', data);
              
              // 处理数据格式，确保 evo、sbc、objectives 都是一维数组
              const processedData = {
                date: data.date || new Date().toISOString().split('T')[0],
                evo: Array.isArray(data.evo) ? (Array.isArray(data.evo[0]) ? data.evo[0] : data.evo) : [],
                sbc: Array.isArray(data.sbc) ? data.sbc : [],
                objectives: Array.isArray(data.objectives) ? data.objectives : []
              };
              
              // 提取名称列表
              const formattedData = {
                date: processedData.date,
                evo: processedData.evo.map(item => item.name || item),
                sbc: processedData.sbc.map(item => item.name || item),
                objectives: processedData.objectives.map(item => item.name || item)
              };
              
              console.log('处理后的数据:', formattedData);
              setStorageValue(UPDATE_CONTENT_KEY, JSON.stringify(formattedData));
              console.log('更新内容已缓存');
              
              // 直接显示弹窗
              console.log('准备显示弹窗');
              setTimeout(() => {
                showUpdateContentPopup(formattedData);
              }, 1000);
            } catch (error) {
              console.error('解析更新内容失败:', error);
              
              // 尝试手动解析，处理可能的格式问题
              try {
                // 简单处理：提取所有名称
                const responseText = response.responseText;
                const names = [];
                
                // 提取所有 "name": "..." 格式的内容
                const nameRegex = /"name"\s*:\s*"([^"]+)"/g;
                let match;
                while ((match = nameRegex.exec(responseText)) !== null) {
                  names.push(match[1]);
                }
                
                if (names.length > 0) {
                  console.log('手动提取名称成功:', names);
                  const fallbackData = {
                    date: new Date().toISOString().split('T')[0],
                    evo: names.slice(0, Math.ceil(names.length / 3)),
                    sbc: names.slice(Math.ceil(names.length / 3), Math.ceil(names.length * 2 / 3)),
                    objectives: names.slice(Math.ceil(names.length * 2 / 3))
                  };
                  
                  console.log('回退数据:', fallbackData);
                  setStorageValue(UPDATE_CONTENT_KEY, JSON.stringify(fallbackData));
                  
                  setTimeout(() => {
                    showUpdateContentPopup(fallbackData);
                  }, 1000);
                }
              } catch (fallbackError) {
                console.error('回退解析也失败:', fallbackError);
                // 拉取失败，显示错误提示
                setTimeout(() => {
                  showErrorPopup('信息读取失败，请稍后前往快捷入口-今日更新再次查看');
                }, 1000);
              }
            }
          }
        },
        onerror: function(error) {
          console.error('获取更新内容失败:', error);
          // 拉取失败，显示错误提示
          setTimeout(() => {
            showErrorPopup('信息读取失败，请稍后前往快捷入口-今日更新再次查看');
          }, 1000);
        },
        ontimeout: function() {
          console.error('获取更新内容超时');
          // 拉取失败，显示错误提示
          setTimeout(() => {
            showErrorPopup('信息读取失败，请稍后前往快捷入口-今日更新再次查看');
          }, 1000);
        }
      });
    } else {
      console.log('今日已检查过更新内容，跳过');
    }
  }
  
  // 拉取更新内容（用于手动刷新）
  function fetchUpdateContent(callback) {
    console.log('手动拉取更新内容:', UPDATE_CONTENT_URL);
    GM_xmlhttpRequest({
      method: 'GET',
      url: UPDATE_CONTENT_URL,
      onload: function(response) {
        console.log('手动拉取请求状态:', response.status);
        if (response.status === 200) {
          try {
            const data = JSON.parse(response.responseText);
            console.log('手动拉取解析成功:', data);
            
            // 处理数据格式
            const processedData = {
              date: data.date || new Date().toISOString().split('T')[0],
              evo: Array.isArray(data.evo) ? (Array.isArray(data.evo[0]) ? data.evo[0] : data.evo) : [],
              sbc: Array.isArray(data.sbc) ? data.sbc : [],
              objectives: Array.isArray(data.objectives) ? data.objectives : []
            };
            
            // 提取名称列表
            const formattedData = {
              date: processedData.date,
              evo: processedData.evo.map(item => item.name || item),
              sbc: processedData.sbc.map(item => item.name || item),
              objectives: processedData.objectives.map(item => item.name || item)
            };
            
            // 更新缓存
            setStorageValue(UPDATE_CONTENT_KEY, JSON.stringify(formattedData));
            console.log('手动拉取成功，数据已缓存');
            
            if (callback) callback(formattedData);
          } catch (error) {
            console.error('手动拉取解析失败:', error);
            if (callback) callback(null);
          }
        } else {
          console.error('手动拉取请求失败，状态码:', response.status);
          if (callback) callback(null);
        }
      },
      onerror: function(error) {
        console.error('手动拉取请求错误:', error);
        if (callback) callback(null);
      },
      ontimeout: function() {
        console.error('手动拉取请求超时');
        if (callback) callback(null);
      }
    });
  }
  
  // 显示错误提示弹窗
  function showErrorPopup(message) {
    // 保存原始的 body 样式
    const originalBodyOverflow = document.body.style.overflow;
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // 点击遮罩层关闭弹窗
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        document.body.style.overflow = originalBodyOverflow;
      }
    });
    
    // 创建弹窗
    const popup = document.createElement('div');
    popup.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    `;
    
    // 错误图标
    const icon = document.createElement('div');
    icon.textContent = '⚠️';
    icon.style.cssText = `
      font-size: 48px;
      margin-bottom: 16px;
    `;
    
    // 错误消息
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.cssText = `
      font-size: 16px;
      color: #333;
      margin: 0 0 20px 0;
      line-height: 1.5;
    `;
    
    // 确定按钮
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确定';
    confirmBtn.style.cssText = `
      padding: 10px 32px;
      border: none;
      border-radius: 8px;
      background: #027ba0ff;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    
    confirmBtn.addEventListener('mouseenter', () => {
      confirmBtn.style.background = '#015a7a';
    });
    
    confirmBtn.addEventListener('mouseleave', () => {
      confirmBtn.style.background = '#027ba0ff';
    });
    
    confirmBtn.addEventListener('click', () => {
      overlay.remove();
      document.body.style.overflow = originalBodyOverflow;
    });
    
    popup.appendChild(icon);
    popup.appendChild(messageElement);
    popup.appendChild(confirmBtn);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
  }
  
  // 显示更新内容弹窗
  function showUpdateContentPopup(data, isAutoPopup = true) {
    if (!data || !data.date) return;
    
    // 保存原始的 body 样式
    const originalBodyOverflow = document.body.style.overflow;
    
    // 解析日期
    const dateObj = new Date(data.date);
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const title = `${month}月${day}日更新内容`;
    
    // 创建弹窗
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    `;
    
    // 点击遮罩层关闭弹窗
    overlay.addEventListener('click', (e) => {
      // 确保点击的是遮罩层本身，不是弹窗内容
      if (e.target === overlay) {
        overlay.remove();
        // 恢复原始的 body 样式
        document.body.style.overflow = originalBodyOverflow;
        if (isAutoPopup) {
          clearInterval(countdownInterval);
        }
      }
    });
    
    const popup = document.createElement('div');
    popup.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      position: relative;
      z-index: 1;
    `;
    
    // 阻止弹窗内部点击事件冒泡到遮罩层
    popup.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // 阻止弹窗内部滚动事件冒泡到遮罩层
    popup.addEventListener('wheel', (e) => {
      e.stopPropagation();
    });
    
    // 倒计时显示
    let countdownElement = null;
    if (isAutoPopup) {
      countdownElement = document.createElement('div');
      countdownElement.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        z-index: 2;
      `;
      popup.appendChild(countdownElement);
    }
    
    // 标题
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    titleElement.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 20px;
      font-weight: 700;
      color: #333;
      text-align: center;
    `;
    
    // 内容容器
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 16px;
    `;
    
    // 分类映射
    const categoryMap = {
      'evo': '进化',
      'sbc': 'SBC',
      'objectives': '任务'
    };
    
    // 遍历分类
    for (const [key, categoryName] of Object.entries(categoryMap)) {
      if (data[key] && data[key].length > 0) {
        const categoryDiv = document.createElement('div');
        categoryDiv.style.cssText = `
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
        `;
        
        const categoryTitle = document.createElement('h3');
        categoryTitle.textContent = categoryName;
        categoryTitle.style.cssText = `
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #027ba0;
        `;
        
        const itemsList = document.createElement('ul');
        itemsList.style.cssText = `
          margin: 0;
          padding-left: 20px;
          list-style: none;
        `;
        
        data[key].forEach(item => {
          const li = document.createElement('li');
          li.style.cssText = `
            padding: 4px 0;
            color: #666;
            font-size: 14px;
          `;
          li.textContent = `• ${item}`;
          itemsList.appendChild(li);
        });
        
        categoryDiv.appendChild(categoryTitle);
        categoryDiv.appendChild(itemsList);
        contentContainer.appendChild(categoryDiv);
      }
    }
    
    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.cssText = `
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: 6px;
      background: #027ba0;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 16px;
      transition: background 0.2s;
    `;
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = '#015a7a';
    });
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = '#027ba0';
    });
    closeButton.addEventListener('click', () => {
      overlay.remove();
      // 恢复原始的 body 样式
      document.body.style.overflow = originalBodyOverflow;
    });
    
    popup.appendChild(titleElement);
    popup.appendChild(contentContainer);
    popup.appendChild(closeButton);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // 禁止背景页面滚动
    document.body.style.overflow = 'hidden';
    
    // 自动关闭倒计时（仅自动弹窗）
    if (isAutoPopup) {
      let seconds = 10;
      countdownElement.textContent = `自动关闭 ${seconds}s`;
      
      const countdownInterval = setInterval(() => {
        seconds--;
        if (seconds > 0) {
          countdownElement.textContent = `自动关闭 ${seconds}s`;
        } else {
          clearInterval(countdownInterval);
          if (document.body.contains(overlay)) {
            overlay.remove();
            // 恢复原始的 body 样式
            document.body.style.overflow = originalBodyOverflow;
          }
        }
      }, 1000);
    }
  }

  function bootstrap() {
    console.log('[OAO] bootstrap 开始执行');

    // 预加载特技搭配推荐数据（全站：fut.gg / futbin / easysbc / utweb），后台异步、不阻塞主流程
    loadPlaystyleRecommendData().catch(() => {});
    console.log('[OAO] 当前页面:', window.location.hostname);
    console.log('[OAO] 当前路径:', window.location.pathname);
    
    if (isUtWebPage()) {
      document.body.classList.add('utweb-page');
      bootstrapUtWeb();
      return;
    }
    
    injectSidebarStyles();
    syncSidebarState();

    // 移动端兜底：加载完成后多次确认悬浮图标存在，
    // 以应对 fut.gg 等 SPA 在加载/重渲染过程中偶发把浮标冲掉、或脚本早期执行时 body 尚未就绪的情况。
    ensureMobileFloatIcon();
    setTimeout(ensureMobileFloatIcon, 1500);
    setTimeout(ensureMobileFloatIcon, 4000);
    setTimeout(ensureMobileFloatIcon, 8000);
    let oaevoResizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(oaevoResizeTimer);
      oaevoResizeTimer = setTimeout(ensureMobileFloatIcon, 300);
    });
    window.addEventListener('orientationchange', () => setTimeout(ensureMobileFloatIcon, 500));

    // 检查页面类型
    const isFutggPage = window.location.hostname.includes('fut.gg');
    const isEasysbcPage = window.location.hostname.includes('easysbc.io');
    const isFutbinPage = window.location.hostname.includes('futbin.com');
    
    console.log('[OAO] 页面类型判断:', {
      isFutggPage,
      isEasysbcPage,
      isFutbinPage
    });
    
    // FUTGG 页面使用 React，会有多次重新渲染，需要延迟翻译
    // EASYSBC 和 FUTBIN 页面立即翻译
    const translateDelay = isFutggPage ? 2000 : 0;
    console.log('[OAO] 翻译延迟:', translateDelay, 'ms');
    
    setTimeout(() => {
      console.log('[OAO] 开始翻译页面');
      translateRoot(document);
    }, translateDelay);
    
    // 延迟启动 MutationObserver，避免初始加载时的 DOM 变化触发重复翻译
    // FUTGG 页面在加载过程中会有大量 DOM 变化，需要等待页面稳定后再开始监听
    const observerDelay = isFutggPage ? 5000 : 500;
    console.log('[OAO] 观察器延迟:', observerDelay, 'ms');
    
    setTimeout(() => {
      console.log('[OAO] 启动翻译观察器');
      startTranslationObserver();
    }, observerDelay);
    
    monitorEvolutionPageChanges();
    
    // 检查版本更新（异步，不阻塞主流程）
    // 页面刷新时后台检查，有新版本则显示红点
    checkVersionUpdate('background');
    // 满足间隔时显示弹窗提醒
    checkVersionUpdate('popup');
    
    // 如果在 squad-builder 页面，添加每周阵型战术推荐按钮
    if (isSquadBuilderPage()) {
      console.log('[OAO] 检测到 squad-builder 页面，添加战术按钮');
      addWeeklyTacticsButton();
    }
    
    // 如果在 SBC 页面，添加SBC球员评测按钮
    if (isSBCPage()) {
      console.log('[OAO] 检测到 SBC 页面，添加评测按钮');
      addSBCPlayerReviewButton();
    }
    
    // 设置按钮监听器，确保页面刷新后按钮重新创建
    setupButtonWatcher();
    
    console.log('[OAO] bootstrap 执行完成');
  }

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // 获取进化字典
  function getEvolutionDictionary() {
    // 从dictionaryCache中获取进化字典
    if (typeof dictionaryCache !== 'undefined' && dictionaryCache.evolutions) {
      return dictionaryCache.evolutions;
    }
    // 尝试从GM存储中获取（预缓存的进化字典）
    const cachedEvolutions = GM_getValue('oao_evolutions_cache', null);
    if (cachedEvolutions) {
      try {
        return typeof cachedEvolutions === 'string' ? JSON.parse(cachedEvolutions) : cachedEvolutions;
      } catch (e) {
        console.error('[OAO] 解析进化字典缓存失败:', e);
      }
    }
    // 尝试从localStorage中获取
    const localStorageEvolutions = localStorage.getItem('oao_evolution_dictionary');
    if (localStorageEvolutions) {
      try {
        return JSON.parse(localStorageEvolutions);
      } catch (e) {
        console.error('[OAO] 解析进化字典缓存失败:', e);
      }
    }
    return null;
  }

  // 检查是否需要刷新缓存
  function shouldRefreshCache() {
    const lastRefreshTime = GM_getValue('oao_evolutions_cache_time', 0);
    const lastRefreshDate = GM_getValue('oao_evolutions_cache_date', '');
    const now = Date.now();
    const currentDate = new Date().toDateString();
    
    // 条件1：每3个小时刷新一次
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    if (now - lastRefreshTime > THREE_HOURS) {
      console.log('[OAO] 缓存超过3小时，需要刷新');
      return true;
    }
    
    // 条件2：每天3点后，首次使用OAO插件时刷新
    const currentHour = new Date().getHours();
    if (currentHour >= 3 && lastRefreshDate !== currentDate) {
      console.log('[OAO] 新的一天3点后首次使用，需要刷新');
      return true;
    }
    
    return false;
  }

  // 预加载进化字典到GM存储（参考FSU的快速访问机制）
  function preloadEvolutionDictionary() {
    // 立即从GM存储尝试获取
    let cachedEvolutions = GM_getValue('oao_evolutions_cache', null);
    const needRefresh = shouldRefreshCache();
    
    if (cachedEvolutions && !needRefresh) {
      try {
        if (typeof cachedEvolutions === 'string') {
          cachedEvolutions = JSON.parse(cachedEvolutions);
        }
        dictionaryCache.evolutions = normalizeTranslationDictionary(cachedEvolutions);
        console.log('[OAO] 预加载进化字典成功（GM存储）:', Object.keys(dictionaryCache.evolutions).length, '条');
        
        return;
      } catch (e) {
        console.error('[OAO] 预加载进化字典失败:', e);
      }
    }
    
    // 需要刷新或者没有缓存，从远程加载
    refreshCacheAsync();
  }

  // 异步刷新缓存
  function refreshCacheAsync() {
    fetchRemoteJsonWithFallback(withCacheBust(EVOLUTIONS_DICT_URLS)).then(data => {
      const normalized = normalizeTranslationDictionary(data);
      dictionaryCache.evolutions = normalized;
      // 缓存到GM存储
      GM_setValue('oao_evolutions_cache', JSON.stringify(data));
      GM_setValue('oao_evolutions_cache_time', Date.now());
      GM_setValue('oao_evolutions_cache_date', new Date().toDateString());
      console.log('[OAO] 刷新进化字典成功:', Object.keys(normalized).length, '条');
    }).catch(() => {
      // 尝试使用内置备用数据
      try {
        fetchRemoteJsonWithFallback(BUILT_IN_DICTIONARIES_URLS).then(data => {
          if (data && data.evolutions) {
            const normalized = normalizeTranslationDictionary(data.evolutions);
            dictionaryCache.evolutions = normalized;
            GM_setValue('oao_evolutions_cache', JSON.stringify(data.evolutions));
            GM_setValue('oao_evolutions_cache_time', Date.now());
            GM_setValue('oao_evolutions_cache_date', new Date().toDateString());
            console.log('[OAO] 刷新进化字典成功（备用数据）:', Object.keys(normalized).length, '条');
          }
        }).catch(() => {});
      } catch (e) {}
    });
  }

  // 在脚本加载时立即预加载进化字典
  preloadEvolutionDictionary();

  // 快速修复函数（参考FSU的fastHack）
  function fastHackEvolutions(obj) {
    if (!obj) return false;
    
    const evolutionDictionary = typeof dictionaryCache !== 'undefined' ? dictionaryCache.evolutions : null;
    if (!evolutionDictionary) return false;
    
    if (obj.evolutions && Array.isArray(obj.evolutions)) {
      for (let i = 0; i < obj.evolutions.length; i++) {
        const evo = obj.evolutions[i];
        if (!evo || !evo.name) continue;
        
        // 检测FSU格式："[进化]-不朽大师"
        const fsuMatch = evo.name.match(/^\[(.*?)\]-(.*)$/);
        if (fsuMatch) {
          const chineseName = fsuMatch[2].trim();
          
          // 在进化字典中反向查找英文名称
          for (const key in evolutionDictionary) {
            if (evolutionDictionary.hasOwnProperty(key)) {
              const dictValue = evolutionDictionary[key];
              const translation = typeof dictValue === 'object'
                ? dictValue.webpagedata || dictValue
                : dictValue;
              if (translation === chineseName) {
                evo.name = key;
                break;
              }
            }
          }
        }
      }
      return true;
    }
    
    return false;
  }

  // 重写JSON.parse，在数据层面拦截并修复FSU插件对进化名称的修改
  const originalParse = JSON.parse;
  JSON.parse = function () {
    const result = originalParse.apply(this, arguments);
    if (result && typeof result === 'object') {
      // 参考FSU的处理方式，立即处理
      if (!fastHackEvolutions(result)) {
        if (result.data) {
          fastHackEvolutions(result.data);
        } else if (Array.isArray(result)) {
          // 处理数组中的对象
          for (let i = 0; i < Math.min(result.length, 100); i++) {
            if (result[i] && typeof result[i] === 'object') {
              fastHackEvolutions(result[i]);
            }
          }
        }
      }
    }
    return result;
  };

  // 获取用户设置的进化格式
  function getEvolutionFormat() {
    const EVOLUTION_FORMAT_KEY = 'oaevo_evolution_format'; // 0: 中文（英文）, 1: 来源中文, 2: 英文
    // 尝试使用插件主体的存储方式
    if (typeof getStorageValue === 'function') {
      return getStorageValue(EVOLUTION_FORMAT_KEY) || 0;
    }
    // 备用方案：直接从localStorage获取
    const storedValue = localStorage.getItem(EVOLUTION_FORMAT_KEY);
    if (storedValue) {
      try {
        return parseInt(storedValue, 10) || 0;
      } catch (e) {
        console.error('[OAO] 解析进化格式设置失败:', e);
      }
    }
    return 0; // 默认格式：中文（英文）
  }

  // 获取用户设置的是否使用简写
  function getUseShortenTerms() {
    // USE_SHORTEN_TERMS是一个常量，直接返回true
    return true;
  }

// === OAO business bundle (由 generate_bundle.py 从源 userscript 抽取) ===
