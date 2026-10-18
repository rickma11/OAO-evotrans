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
  const EVOLUTIONS_DICT_URLS = [
    'https://gitee.com/rickma11/OAO-evotrans/raw/master/evolutions1.json?inline=true', // 主数据源（Gitee）
    'https://raw.githubusercontent.com/rickma11/OAO-evotrans/refs/heads/main/evolutions.json', // 备用数据源（GitHub）
    'https://cdn.jsdelivr.net/gh/rickma11/OAO-evotrans@main/evolutions.json', // CDN 数据源
    'https://rawcdn.githack.com/rickma11/OAO-evotrans/main/evolutions.json' // CDN 数据源
  ];
  
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

  function findEvolutionById(dict, idValue, idField) {
    for (const key in dict) {
      const dictValue = dict[key];
      if (Array.isArray(dictValue)) {
        for (const item of dictValue) {
          if (item && typeof item === 'object' && item[idField] === idValue) {
            return { key, entry: item };
          }
        }
      } else if (dictValue && typeof dictValue === 'object' && dictValue[idField] === idValue) {
        return { key, entry: dictValue };
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
            const remoteJson = await fetchRemoteJsonWithFallback(EVOLUTIONS_DICT_URLS);
            const normalized = normalizeTranslationDictionary(remoteJson);
            
            // 保存到缓存
            setStorageValue(EVOLUTIONS_STORAGE_KEY, {
              timestamp: Date.now(),
              data: remoteJson
            });
            
            dictionaryCache.evolutions = normalized;
            return normalized;
          } catch (error) {
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
      const remoteJson = await fetchRemoteJsonWithFallback(EVOLUTIONS_DICT_URLS);
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
          return { key, translation, source };
        }
        
        if (translation && pageTranslationValue) {
          const translationBase = translation.replace(/\+$/, '');
          const pageBase = pageTranslationValue.replace(/\+$/, '');
          if (translationBase === pageBase) {
            return { key, translation, source };
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
                  if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                    const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
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
              // 从父元素 <a> 标签提取 futgg_id
              const parentLink = wrapper.closest('a');
              let futggId = '';
              if (parentLink && parentLink.href) {
                const match = parentLink.href.match(/\/evolutions\/(\d+)-/);
                if (match) {
                  futggId = match[1];
                }
              }
              
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
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
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
            if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
              const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
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
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
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
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
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
                  if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                    const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
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
            if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
              const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
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
              let futggId = '';
              if (link && link.href) {
                const match = link.href.match(/\/evolutions\/(\d+)-/);
                if (match) {
                  futggId = match[1];
                }
              }
              
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
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
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

          // 从 URL 提取 futgg_id
          let futggId = '';
          const urlMatch = link.href && link.href.match(/\/evolutions\/(\d+)-/);
          if (urlMatch) futggId = urlMatch[1];

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
            if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
              const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
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
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
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
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
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
    fetchRemoteJsonWithFallback(EVOLUTIONS_DICT_URLS).then(data => {
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
