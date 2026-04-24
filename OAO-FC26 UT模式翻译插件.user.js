// ==UserScript==
// @name         OAO-FC26 UT模式翻译插件
// @namespace    https://github.com/
// @version      1.5.5
// @description  中文翻译Futbin、Futgg网站的英文信息，包括球员信息、进化名称等
// @author       我要欧啊欧
// @match        https://www.fut.gg/*
// @match        https://fut.gg/*
// @match        https://www.futbin.com/*
// @match        https://futbin.com/*
// @match        https://www.easysbc.io/*
// @match        https://easysbc.io/*
// @connect      gitee.com
// @connect      github.com
// @connect      cdn.jsdelivr.net
// @connect      example.com
// @connect      open.feishu.cn
// @connect      scriptcat.org
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  // console.log('[OAO] 脚本开始执行');
  // console.log('[OAO] 当前页面:', window.location.href);
  // console.log('[OAO] 当前域名:', window.location.hostname);

  // 存储相关函数
  function getStorageValue(key) {
    try {
      const value = GM_getValue(key, null);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.warn('Failed to get storage value:', error);
      return null;
    }
  }

  // 设置缓存
  function setStorageValue(key, value) {
    try {
      GM_setValue(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to set storage value:', error);
    }
  }

  const _d = ['www.fut.gg', 'fut.gg', 'www.futbin.com', 'futbin.com', 'www.easysbc.io', 'easysbc.io'];
  const _h = window.location.hostname;
  // console.log('[OAO] 域名检查:', { hostname: _h, allowedDomains: _d, isAllowed: _d.includes(_h) });
  if (!_d.includes(_h)) {
    // console.log('[OAO] 域名不在允许列表中，脚本停止执行');
    return;
  }
  // console.log('[OAO] 域名检查通过，继续执行');
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
  const THREE_HOURS_MS =  1000; // 3小时
  // 多数据源配置（优先使用 Gitee，国内访问更快）
  const EVOLUTIONS_DICT_URLS = [
    'https://gitee.com/rickma11/OAO-evotrans/raw/master/evolutions.json', // 主数据源（Gitee）
    'https://raw.githubusercontent.com/rickma11/OAO-evotrans/refs/heads/main/evolutions.json', // 备用数据源（GitHub）
    'https://cdn.jsdelivr.net/gh/rickma11/OAO-evotrans@main/evolutions.json' // CDN 数据源
  ];
  
  // 内置翻译字典多数据源配置
  const BUILT_IN_DICTIONARIES_URLS = [
    'https://gitee.com/rickma11/OAO-evotrans/raw/master/built-in-dictionaries.json', // 主数据源（Gitee）
    'https://raw.githubusercontent.com/rickma11/OAO-evotrans/refs/heads/main/built-in-dictionaries.json', // 备用数据源（GitHub）
    'https://cdn.jsdelivr.net/gh/rickma11/OAO-evotrans@main/built-in-dictionaries.json' // CDN 数据源
  ];
  
  const BUILT_IN_DICTIONARIES_STORAGE_KEY = 'oaevo_built_in_dictionaries_cache';
  const REMOTE_EVOLUTIONS_DICT_URL = EVOLUTIONS_DICT_URLS[0]; // 主数据源
  const SIDEBAR_ID = 'oaevo-sidebar';
  const SIDEBAR_DOCK_ID = 'oaevo-sidebar-dock';
  const SIDEBAR_PANEL_ID = 'oaevo-sidebar-panel';
  const SIDEBAR_BUTTON_CLASS = 'oaevo-sidebar-btn';
  const FUTGG_TRANSLATION_ENABLED_KEY = 'oaevo_futgg_translation_enabled';
  const FUTBIN_TRANSLATION_ENABLED_KEY = 'oaevo_futbin_translation_enabled';
  const EASYSBC_TRANSLATION_ENABLED_KEY = 'oaevo_easysbc_translation_enabled';
  const EVOLUTION_FORMAT_KEY = 'oaevo_evolution_format'; // 0: 中文（英文）, 1: 中文, 2: 英文
  const SIDEBAR_HIDDEN_KEY = 'oaevo_sidebar_hidden'; // 侧边栏隐藏状态
  const FLOAT_ICON_POSITION_KEY = 'oaevo_float_icon_position'; // 悬浮图标位置
  
  // 版本检查配置
  const SCRIPTCAT_SCRIPT_URL = 'https://scriptcat.org/zh-CN/script-show-page/5488';
  const VERSION_CHECK_KEY = 'oaevo_last_version_check_date';
  const VERSION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24小时检查一次
  const NEW_VERSION_KEY = 'oaevo_new_version_available'; // 存储新版本信息
  
  // 更新内容配置
  const UPDATE_CONTENT_URL = 'https://gitee.com/rickma11/OAO-evotrans/raw/master/catch-evo.json';
  const LAST_UPDATE_CHECK_KEY = 'oaevo_last_update_check_date'; // 最后检查更新内容的日期
  const UPDATE_CONTENT_KEY = 'oaevo_update_content_cache'; // 缓存更新内容
  
  // 全局变量存储新版本信息
  let newVersionInfo = null;
  
  // 自定义翻译配置
  const CUSTOM_TRANSLATIONS_KEY = 'oaevo_custom_translations';
  
  // 标记翻译管理弹窗是否有修改（使用window对象确保全局可访问）
  window.translationManagerHasChanges = false;
  
  // 初始化翻译开关状态
  let futggTranslationEnabled = getStorageValue(FUTGG_TRANSLATION_ENABLED_KEY) !== false; // 默认打开
  let futbinTranslationEnabled = getStorageValue(FUTBIN_TRANSLATION_ENABLED_KEY) !== false; // 默认打开
  let easysbcTranslationEnabled = getStorageValue(EASYSBC_TRANSLATION_ENABLED_KEY) !== false; // 默认打开
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
    }
    .${SIDEBAR_BUTTON_CLASS}--evolution-format.chinese-only{
      background:#2196f3;
      color:#fff;
    }
    .${SIDEBAR_BUTTON_CLASS}--evolution-format.english-only{
      background:#f44336;
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
  `;

  // 注入侧边栏样式
  function injectSidebarStyles() {
    const style = document.createElement('style');
    style.textContent = SIDEBAR_STYLES;
    document.head.appendChild(style);
  }



  // 移除侧边栏
  function removeSidebar() {
    const sidebar = document.getElementById(SIDEBAR_ID);
    if (sidebar) {
      sidebar.remove();
    }
  }

  // 同步侧边栏显示状态
  function syncSidebarState() {
    console.log('[OAO] syncSidebarState 开始执行');
    
    const isFutggPage = window.location.hostname.includes('fut.gg');
    const isEasysbcPage = window.location.hostname.includes('easysbc.io');
    const isFutbinPage = window.location.hostname.includes('futbin.com');
    
    console.log('[OAO] syncSidebarState 页面类型:', { isFutggPage, isEasysbcPage, isFutbinPage });
    console.log('Syncing sidebar state:', {
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      isFutggPage,
      isEasysbcPage,
      isFutbinPage,
      bodyExists: !!document.body,
      readyState: document.readyState
    });
    
    // 确保 body 存在且页面加载完成
    if (!document.body || document.readyState === 'loading') {
      console.log('Page not ready, delaying sidebar creation...');
      setTimeout(() => syncSidebarState(), 100);
      return;
    }
    
    if (isFutggPage || isFutbinPage || isEasysbcPage) {
      console.log('Creating sidebar for FUTGG/FUTBIN/EASYSBC page');
      createSidebar();
      // 检查是否应该保持隐藏状态
      const isHidden = getStorageValue(SIDEBAR_HIDDEN_KEY) === true;
      if (isHidden) {
        const panel = document.getElementById(SIDEBAR_PANEL_ID);
        if (panel) {
          panel.style.display = 'none';
          createFloatIcon();
        }
      }
    } else {
      console.log('Removing sidebar for non-FUTGG/FUTBIN/EASYSBC page');
      removeSidebar();
    }
    
    console.log('[OAO] syncSidebarState 执行完成');
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
    floatIcon.style.zIndex = '9999';
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
          const panel = document.getElementById(SIDEBAR_PANEL_ID);
          if (panel) {
            panel.style.display = 'flex';
            setStorageValue(SIDEBAR_HIDDEN_KEY, false);
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
        const panel = document.getElementById(SIDEBAR_PANEL_ID);
        if (panel) {
          panel.style.display = 'flex';
          setStorageValue(SIDEBAR_HIDDEN_KEY, false);
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
    console.log('[OAO] createSidebar 开始执行');
    
    if (document.getElementById(SIDEBAR_ID)) {
      console.log('[OAO] 侧边栏已存在，跳过创建');
      return;
    }
    
    console.log('[OAO] 开始创建侧边栏');
    
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
    
    console.log('[OAO] createSidebar 页面类型:', { isFutggPage, isEasysbcPage, isFutbinPage });
    console.log('[OAO] 当前hostname:', window.location.hostname);
    console.log('[OAO] easysbc判断结果:', window.location.hostname.includes('easysbc.io'));

    const settingsBtn = document.createElement('button');
    settingsBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--settings`;
    
    // 优先检查EASYSBC页面
    if (isEasysbcPage) {
      console.log('[OAO] 创建EASYSBC翻译按钮');
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
        { text: '每日开包视频', url: 'https://space.bilibili.com/21399808/dynamic' },
        { text: 'SBC球员评测', url: 'https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MzE2NzgyMQ==&action=getalbum&album_id=3721449259213029385#wechat_redirect' },
        { text: '每周阵型战术推荐', url: 'https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzA5MzE2NzgyMQ==&action=getalbum&album_id=3714272208722886660#wechat_redirect' }
      ];
      
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
          window.open(link.url, '_blank');
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
        { text: '球员特技', url: 'https://mp.weixin.qq.com/s/W0-JG1l533IRB7EK5HZDww' },
        { text: '化学加成&加速类型', url: 'https://mp.weixin.qq.com/s/W2o3hFm0tElcWMJ8B3zc3A' }
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
    // 排除"添加"选项
    if (category.id !== 'add') {
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
  
  // 添加默认翻译
  if (dictionaryCache[category]) {
    for (const [key, value] of Object.entries(dictionaryCache[category])) {
      translations[key] = value.webpagedata;
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
  
  // 按原文排序
  const sortedKeys = Object.keys(translations).sort();
  
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
          evolutionFormatBtn.textContent = '进化格式: 中英';
          evolutionFormatBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--evolution-format`;
          evolutionFormatBtn.style.backgroundColor = '#049c04ff'; // 保持黄色
          evolutionFormatBtn.style.color = '#FFFFFF';
          break;
        case 1:
          evolutionFormatBtn.textContent = '进化格式: 中文';
          evolutionFormatBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--evolution-format chinese-only`;
          evolutionFormatBtn.style.backgroundColor = '#049c04ff'; // 保持黄色
          evolutionFormatBtn.style.color = '#FFFFFF';
          break;
        case 2:
          evolutionFormatBtn.textContent = '进化格式: 英文';
          evolutionFormatBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--evolution-format english-only`;
          evolutionFormatBtn.style.backgroundColor = '#049c04ff'; // 保持黄色
          evolutionFormatBtn.style.color = '#FFFFFF';
          break;
      }
    }
    updateEvolutionFormatButton();
    evolutionFormatBtn.addEventListener('click', () => {
      // 循环切换状态: 0 → 1 → 2 → 0
      evolutionFormat = (evolutionFormat + 1) % 3;
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

    // 添加"关注欧啊欧"按钮
    const followBtn = document.createElement('button');
    followBtn.className = `${SIDEBAR_BUTTON_CLASS} ${SIDEBAR_BUTTON_CLASS}--follow`;
    followBtn.textContent = '关注欧啊欧';
    followBtn.style.backgroundColor = '#FF69B4'; // 粉色
    followBtn.style.color = '#FFFFFF';
    followBtn.style.cursor = 'default'; // 不可点击的鼠标样式
    
    // 创建悬浮窗
    const hoverWindow = document.createElement('div');
    hoverWindow.style.position = 'absolute';
    hoverWindow.style.left = '-320px'; // 在按钮左侧显示，放大后调整位置
    hoverWindow.style.top = '0';
    hoverWindow.style.width = '300px'; // 宽度放大1倍
    hoverWindow.style.backgroundColor = '#fff';
    hoverWindow.style.borderRadius = '8px';
    hoverWindow.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    hoverWindow.style.padding = '10px';
    hoverWindow.style.display = 'none';
    hoverWindow.style.zIndex = '10000';
    
    // 添加图片到悬浮窗
    const hoverImage = document.createElement('img');
    hoverImage.src = 'https://s41.ax1x.com/2026/03/01/peS2q8f.png';
    hoverImage.style.width = '100%';
    hoverImage.style.borderRadius = '4px';
    
    // 图片加载失败时显示文字信息
    hoverImage.onerror = function() {
      // 移除图片
      hoverImage.style.display = 'none';
      // 创建文字提示
      const textTip = document.createElement('div');
      textTip.textContent = '微信搜索"我要欧啊欧"';
      textTip.style.fontSize = '20px';
      textTip.style.fontWeight = 'bold';
      textTip.style.color = '#333';
      textTip.style.textAlign = 'center';
      textTip.style.padding = '20px';
      hoverWindow.appendChild(textTip);
    };
    
    hoverWindow.appendChild(hoverImage);
    
    // 鼠标悬停显示悬浮窗
    followBtn.addEventListener('mouseenter', () => {
      hoverWindow.style.display = 'block';
    });
    
    // 鼠标离开隐藏悬浮窗
    followBtn.addEventListener('mouseleave', () => {
      hoverWindow.style.display = 'none';
    });
    
    // 将悬浮窗添加到按钮
    followBtn.style.position = 'relative';
    followBtn.appendChild(hoverWindow);

    // 重新排列按钮顺序
    panel.appendChild(title);
    
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
    panel.appendChild(followBtn);
    
    // 添加版本信息
    const versionInfo = document.createElement('div');
    versionInfo.setAttribute('data-version-indicator', 'true');
    // 从 UserScript 头部读取版本号
    let scriptVersion = 'unknown';
    try {
      // 方法1: 从 GM_info 获取（Tampermonkey/Violentmonkey 支持）
      if (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) {
        scriptVersion = GM_info.script.version;
      } else {
        // 方法2: 从当前脚本内容解析
        const scriptContent = document.querySelector('script[id^="tampermonkey"], script[id^="violentmonkey"]');
        if (scriptContent) {
          const versionMatch = scriptContent.textContent.match(/@version\s+([\d.]+)/);
          if (versionMatch) {
            scriptVersion = versionMatch[1];
          }
        }
      }
    } catch (e) {
      // console.warn('Failed to get script version:', e);
    }
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
    
    // 点击版本信息时显示更新弹窗
    versionInfo.addEventListener('click', () => {
      if (newVersionInfo) {
        showUpdateDialog(newVersionInfo.remoteVersion, newVersionInfo.currentVersion);
      } else {
        // 没有新版本信息，执行一次检查
        checkVersionUpdate('popup');
      }
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
    easysbc: null
  };

  let evolutionsLoadPromise = null;
  let builtInDictionariesLoadPromise = null;

  // 工具函数
  function normalizeTranslationDictionary(rawDict) {
    const normalized = {};
    if (!rawDict) {
      return normalized;
    }

    Object.entries(rawDict).forEach(([english, entry]) => {
      if (!english) {
        return;
      }
      // 支持多种格式
      const webpagedata = String(entry?.webpagedata || entry?.formal || entry?.professional || entry?.CN || '').trim();
      const shorten = String(entry?.shorten || entry?.casual || entry?.playerSlang || entry?.CN || webpagedata).trim();
      normalized[english.trim()] = {
        webpagedata,
        shorten: shorten || webpagedata,
      };
    });

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
      
      // 保存到缓存
      setStorageValue(EVOLUTIONS_STORAGE_KEY, {
        timestamp: Date.now(),
        data: remoteJson
      });
      
      dictionaryCache.evolutions = normalized;
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
          if (isCacheEntryValid(cachedEntry)) {
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
    const needLoadBuiltIn = !dictionaryCache.basic || !dictionaryCache.sixStat || !dictionaryCache.easysbc ||
                           Object.keys(dictionaryCache.basic).length === 0 || 
                           Object.keys(dictionaryCache.sixStat).length === 0 ||
                           Object.keys(dictionaryCache.easysbc).length === 0;
    
    if (needLoadBuiltIn) {
      // console.log('[OAO] 加载内置翻译字典');
      await loadBuiltInDictionaries();
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
            // 覆盖默认翻译
            mergedDictionaries[category][key] = {
              webpagedata: value,
              shorten: value // 简化版也使用相同翻译
            };
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

  // 基础信息翻译器
  const baseInfoTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 优化选择器，只选择可能包含文本的元素
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label, th, td');
      elements.forEach(element => {
        // 跳过已翻译的元素，避免重复翻译
        if (element.dataset.oaoTranslated === 'true') {
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

        // 跳过 EASYSBC evolutions/players 页面的特殊 HTML 格式元素
        // 这些元素由 easysbcTranslator 专门处理
        const isEasysbcPage = window.location.hostname.includes('easysbc.io');
        if (isEasysbcPage) {
          // 检查是否是 evolutions/players 页面
          if (window.location.href.includes('/evolutions/players')) {
            const closestEvoItem = element.closest('div.bg-evolution.h-6');
            if (closestEvoItem) {
              return;
            }
          }
          // 检查是否是 evolutions/builder/*** 页面
          if (window.location.href.includes('/evolutions/builder/')) {
            const closestEvoItem = element.closest('div.bg-evolution.box-border');
            if (closestEvoItem) {
              return;
            }
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
            const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
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

  // 六维属性翻译器
  const sixStatTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 检查是否是 evo-lab/evolutions 页面
      const isEvolutionsPage = window.location.href.includes('evo-lab/evolutions');
      
      // 优化选择器，只选择可能包含文本的元素
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label, th, td');
      elements.forEach(element => {
        // 跳过已翻译的元素，避免重复翻译
        if (element.dataset.oaoTranslated === 'true') {
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

        // 跳过 EASYSBC evolutions/players 页面的特殊 HTML 格式元素
        // 这些元素由 easysbcTranslator 专门处理
        const isEasysbcPage = window.location.hostname.includes('easysbc.io');
        if (isEasysbcPage) {
          // 检查是否是 evolutions/players 页面
          if (window.location.href.includes('/evolutions/players')) {
            const closestEvoItem = element.closest('div.bg-evolution.h-6');
            if (closestEvoItem) {
              return;
            }
          }
          // 检查是否是 evolutions/builder/*** 页面
          if (window.location.href.includes('/evolutions/builder/')) {
            const closestEvoItem = element.closest('div.bg-evolution.box-border');
            if (closestEvoItem) {
              return;
            }
          }
        }

        // 在 evo-lab/evolutions 页面跳过球员六项数据（速度、射门、传球、盘带、防守、身体）
        if (isEvolutionsPage && (element.className.includes('font-cruyff-condensed-medium') || 
            element.className.includes('font-cruyff-condensed-numbers-medium'))) {
          // 标记为已翻译，避免重复翻译
          element.dataset.oaoTranslated = 'true';
          return;
        }
        
        if (element.childNodes.length === 1 && element.firstChild.nodeType === Node.TEXT_NODE) {
          const text = element.textContent.trim();
          const textUpper = text.toUpperCase();
          // 首先尝试原始键查找，然后使用大小写不敏感的sixStatLowerMap
          let translation = null;
          if (dictionary[text]) {
            translation = options.useShortenTerms ? dictionary[text].shorten : dictionary[text].webpagedata;
          } else if (dictionary[textUpper]) {
            translation = options.useShortenTerms ? dictionary[textUpper].shorten : dictionary[textUpper].webpagedata;
          } else if (dictionaryCache.sixStatLowerMap && dictionaryCache.sixStatLowerMap[textUpper]) {
            translation = options.useShortenTerms ? dictionaryCache.sixStatLowerMap[textUpper].shorten : dictionaryCache.sixStatLowerMap[textUpper].webpagedata;
          }
          if (translation) {
            element.textContent = options.showOriginalWithBrackets ? `${translation} (${text})` : translation;
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
        // 跳过已翻译的元素，避免重复翻译
        if (element.dataset.oaoTranslated === 'true') {
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
        // 跳过已翻译的元素，避免重复翻译
        if (element.dataset.oaoTranslated === 'true') {
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

  // 化学反应翻译器
  const chemistryTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 优化选择器，只选择可能包含文本的元素
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label, th, td');
      elements.forEach(element => {
        // 跳过已翻译的元素，避免重复翻译
        if (element.dataset.oaoTranslated === 'true') {
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
          const textUpper = text.toUpperCase();
          if (dictionary[text] || dictionary[textUpper]) {
            const key = dictionary[text] ? text : textUpper;
            const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
            element.textContent = options.showOriginalWithBrackets ? `${translation} (${text})` : translation;
            // 标记为已翻译，避免重复翻译
            element.dataset.oaoTranslated = 'true';
          }
        }
        // 处理带有图标的化学反应风格按钮
        else if (element.classList.contains('chem-style-button')) {
          element.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
              const text = child.textContent.trim();
              if (text && dictionary[text]) {
                const translation = options.useShortenTerms ? dictionary[text].shorten : dictionary[text].webpagedata;
                child.textContent = options.showOriginalWithBrackets ? `${translation} (${text})` : translation;
              }
            }
          });
          // 标记为已翻译，避免重复翻译
          element.dataset.oaoTranslated = 'true';
        }
        // 处理社区化学反应风格按钮
        else if (element.classList.contains('community-chem-style')) {
          const boldDiv = element.querySelector('.xxs-row.align-center.bold');
          if (boldDiv) {
            boldDiv.childNodes.forEach(child => {
              if (child.nodeType === Node.TEXT_NODE) {
                const text = child.textContent.trim();
                if (text && dictionary[text]) {
                  const translation = options.useShortenTerms ? dictionary[text].shorten : dictionary[text].webpagedata;
                  child.textContent = options.showOriginalWithBrackets ? `${translation} (${text})` : translation;
                }
              }
            });
            // 标记为已翻译，避免重复翻译
            element.dataset.oaoTranslated = 'true';
          }
        }
      });
    }
  };

  // 风格翻译器
  const playstylesTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 优化选择器，只选择可能包含文本的元素
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label, th, td');
      elements.forEach(element => {
        // 跳过已翻译的元素，避免重复翻译
        if (element.dataset.oaoTranslated === 'true') {
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
          const textUpper = text.toUpperCase();
          if (dictionary[text] || dictionary[textUpper]) {
            const key = dictionary[text] ? text : textUpper;
            const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
            element.textContent = options.showOriginalWithBrackets ? `${translation} (${text})` : translation;
            // 标记为已翻译，避免重复翻译
            element.dataset.oaoTranslated = 'true';
          }
        }
        // 处理带有 evo-cap-line 子元素的情况（如 Finesse Shot | 8）
        else if (element.querySelector('.evo-cap-line')) {
          const firstChild = element.firstChild;
          if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
            const text = firstChild.textContent.trim();
            const textUpper = text.toUpperCase();
            if (dictionary[text] || dictionary[textUpper]) {
              const key = dictionary[text] ? text : textUpper;
              const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
              firstChild.textContent = options.showOriginalWithBrackets ? `${translation} (${text})` : translation;
              // 标记为已翻译，避免重复翻译
              element.dataset.oaoTranslated = 'true';
            }
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
        // 跳过已翻译的元素
        if (element.dataset.oaoTranslated === 'true') {
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
              const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
                  // 根据进化格式设置决定显示方式
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      child.textContent = `${translation} (${normalizedText})`;
                      break;
                    case 1: // 中文
                      child.textContent = translation;
                      break;
                    case 2: // 英文
                      child.textContent = normalizedText;
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
                    const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
                    const suffix = normalizedText.substring(normalizedText.indexOf(' - Season'));
                    // 根据进化格式设置决定显示方式
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        child.textContent = `${translation} (${baseName})${suffix}`;
                        break;
                      case 1: // 中文
                        child.textContent = translation + suffix;
                        break;
                      case 2: // 英文
                        child.textContent = normalizedText;
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
                  const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
                  // 根据进化格式设置决定显示方式
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      child.textContent = `${translation} (${normalizedChildText})`;
                      break;
                    case 1: // 中文
                      child.textContent = translation;
                      break;
                    case 2: // 英文
                      child.textContent = normalizedChildText;
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
                    const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
                    const suffix = normalizedChildText.substring(normalizedChildText.indexOf(' - Season'));
                    // 根据进化格式设置决定显示方式
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        child.textContent = `${translation} (${baseName})${suffix}`;
                        break;
                      case 1: // 中文
                        child.textContent = translation + suffix;
                        break;
                      case 2: // 英文
                        child.textContent = normalizedChildText;
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
                          const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
                          // 根据进化格式设置决定显示方式
                          switch (evolutionFormat) {
                            case 0: // 中文（英文）
                              grandChild.textContent = `${translation} (${normalizedGrandChildText})`;
                              break;
                            case 1: // 中文
                              grandChild.textContent = translation;
                              break;
                            case 2: // 英文
                              grandChild.textContent = normalizedGrandChildText;
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
            const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
            // 根据进化格式设置决定显示方式
            switch (evolutionFormat) {
              case 0: // 中文（英文）
                element.textContent = `${translation} (${normalizedText})`;
                break;
              case 1: // 中文
                element.textContent = translation;
                break;
              case 2: // 英文
                element.textContent = normalizedText;
                break;
            }
            element.dataset.oaoTranslated = 'true';
          }
          // 处理带后缀的进化名称，如 "Dribble Mastery - Season 5 Lvl 8"
          else if (normalizedText.includes(' - Season')) {
            const baseName = normalizedText.split(' - Season')[0].trim();
            if (dictionary[baseName]) {
              const translation = options.useShortenTerms ? dictionary[baseName].shorten : dictionary[baseName].webpagedata;
              const suffix = normalizedText.substring(normalizedText.indexOf(' - Season'));
              // 根据进化格式设置决定显示方式
              switch (evolutionFormat) {
                case 0: // 中文（英文）
                  element.textContent = `${translation} (${baseName})${suffix}`;
                  break;
                case 1: // 中文
                  element.textContent = translation + suffix;
                  break;
                case 2: // 英文
                  element.textContent = normalizedText;
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
              const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
              // 替换所有文本节点内容
              let firstTextNodeFound = false;
              element.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                  if (!firstTextNodeFound) {
                    // 根据进化格式设置决定显示方式
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        child.textContent = `${translation} (${normalizedFullText})`;
                        break;
                      case 1: // 中文
                        child.textContent = translation;
                        break;
                      case 2: // 英文
                        child.textContent = normalizedFullText;
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
                      const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
                      // 根据进化格式设置决定显示方式
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          child.textContent = `${translation} (${normalizedChildText})`;
                          break;
                        case 1: // 中文
                          child.textContent = translation;
                          break;
                        case 2: // 英文
                          child.textContent = normalizedChildText;
                          break;
                      }
                      hasTranslated = true;
                    }
                    // 处理带后缀的进化名称，如 "Dribble Mastery - Season 5 Lvl 8"
                    else if (normalizedChildText.includes(' - Season')) {
                      const baseName = normalizedChildText.split(' - Season')[0].trim();
                      if (dictionary[baseName]) {
                        const translation = options.useShortenTerms ? dictionary[baseName].shorten : dictionary[baseName].webpagedata;
                        const suffix = normalizedChildText.substring(normalizedChildText.indexOf(' - Season'));
                        // 根据进化格式设置决定显示方式
                        switch (evolutionFormat) {
                          case 0: // 中文（英文）
                            child.textContent = `${translation} (${baseName})${suffix}`;
                            break;
                          case 1: // 中文
                            child.textContent = translation + suffix;
                            break;
                          case 2: // 英文
                            child.textContent = normalizedChildText;
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
                    const translation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
                    // 根据进化格式设置决定显示方式
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        child.textContent = `${translation} (${normalizedChildText})`;
                        break;
                      case 1: // 中文
                        child.textContent = translation;
                        break;
                      case 2: // 英文
                        child.textContent = normalizedChildText;
                        break;
                    }
                    hasTranslated = true;
                  }
                  // 处理带后缀的进化名称，如 "Dribble Mastery - Season 5 Lvl 8"
                  else if (normalizedChildText && normalizedChildText.includes(' - Season')) {
                    const baseName = normalizedChildText.split(' - Season')[0].trim();
                    if (dictionary[baseName]) {
                      const translation = options.useShortenTerms ? dictionary[baseName].shorten : dictionary[baseName].webpagedata;
                      const suffix = normalizedChildText.substring(normalizedChildText.indexOf(' - Season'));
                      // 根据进化格式设置决定显示方式
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          child.textContent = `${translation} (${baseName})${suffix}`;
                          break;
                        case 1: // 中文
                          child.textContent = translation + suffix;
                          break;
                        case 2: // 英文
                          child.textContent = normalizedChildText;
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
                    const childTranslation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
                      // 根据进化格式设置决定显示方式
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          child.textContent = `${childTranslation} (${normalizedChildText})`;
                          break;
                        case 1: // 中文
                          child.textContent = childTranslation;
                          break;
                        case 2: // 英文
                          child.textContent = normalizedChildText;
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
                              const grandChildTranslation = options.useShortenTerms ? dictionary[key].shorten : dictionary[key].webpagedata;
                              // 根据进化格式设置决定显示方式
                              switch (evolutionFormat) {
                                case 0: // 中文（英文）
                                  grandChild.textContent = `${grandChildTranslation} (${normalizedGrandChildText})`;
                                  break;
                                case 1: // 中文
                                  grandChild.textContent = grandChildTranslation;
                                  break;
                                case 2: // 英文
                                  grandChild.textContent = normalizedGrandChildText;
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
      return window.location.href.includes('evolutions') || window.location.href.includes('/evolution');
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
         window.location.href.includes('evo-lab/evolve'));
      
      // 优化选择器，只选择可能包含文本的元素
      const elements = root.querySelectorAll('div, span, p, h1, h2, h3, h4, h5, h6, a, li, button, label');
      elements.forEach(element => {
        // 跳过已翻译的元素
        if (element.dataset.oaoTranslated === 'true') {
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
            // 根据进化格式设置决定显示方式
            switch (evolutionFormat) {
              case 0: // 中文（英文）
                element.textContent = `${translation} (${text})`;
                break;
              case 1: // 中文
                element.textContent = translation;
                break;
              case 2: // 英文
                element.textContent = text;
                break;
            }
            // 标记为已翻译
            element.dataset.oaoTranslated = 'true';
          }
        }
      });
    },
    isTargetPage: function() {
      return window.location.href.includes('evo-lab');
    }
  };

  // Fut.gg翻译器
  const futggTranslator = {
    translate: function(root, dictionary, options) {
      if (!dictionary) return;
      
      // 合并所有字典
      const allDictionaries = [dictionary];
      if (options && options.extraDictionaries) {
        allDictionaries.push(...options.extraDictionaries);
      }
      
      // 检查是否是 evo-lab/evolutions 页面
      const isEvolutionsPage = window.location.href.includes('evo-lab/evolutions');
      const isFutggEvolutionsPage = window.location.href === 'https://www.fut.gg/evolutions/' ||
                                     window.location.href.includes('fut.gg/evolutions');
      const isFutggEvolvePage = window.location.href.includes('/evo-lab/evolve');
      const isFutggEvolutionsLabPage = window.location.href.includes('/evo-lab/evolutions');
      const isFutggPlayerEvolutionsPage = window.location.href.includes('/players/') && window.location.href.includes('/evolutions/');

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
              const baseTextUpper = baseText.toUpperCase();
              let translated = false;
              // 首先在进化字典中查找
              if (options.evolutionDictionary) {
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
                  const dictValue = options.evolutionDictionary[key];
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  // 按照进化格式显示
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      h2.textContent = `${translation} (${key})${suffix}`;
                      break;
                    case 1: // 中文
                      h2.textContent = translation + suffix;
                      break;
                    case 2: // 英文 - 保持原始英文，不翻译
                      h2.textContent = key + suffix;
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
                    const translation = typeof dictValue === 'object'
                      ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                      : dictValue;
                    // 按照进化格式显示
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        h2.textContent = `${translation} (${key})${suffix}`;
                        break;
                      case 1: // 中文
                        h2.textContent = translation + suffix;
                        break;
                      case 2: // 英文 - 保持原始英文，不翻译
                        h2.textContent = key + suffix;
                        break;
                    }
                    translated = true;
                    break;
                  }
                  // 反向查找：当元素显示中文时，尝试找到对应的原始英文 key
                  // 在 evolutionFormat === 0 或 2 时，如果当前是中文，需要恢复英文
                  if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                    for (const key in dict) {
                      if (dict.hasOwnProperty(key)) {
                        const dictValue = dict[key];
                        const translation = typeof dictValue === 'object'
                          ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                          : dictValue;
                        if (translation === baseText) {
                          // 找到了匹配的翻译，按照格式显示
                          switch (evolutionFormat) {
                            case 0: // 中文（英文）
                              h2.textContent = `${baseText} (${key})${suffix}`;
                              break;
                            case 2: // 英文 - 恢复原始英文
                              h2.textContent = key + suffix;
                              break;
                          }
                          translated = true;
                          break;
                        }
                      }
                    }
                  }
                  if (translated) break;
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

      // 针对 futgg evo-lab/evolve 页面的特定 HTML 格式进行特殊处理
      // 该格式为：<button> 包含 <span>SVG</span><span>文本</span>
      // 只选择包含 SVG 图标的按钮，避免匹配到底部标签栏按钮
      if (isFutggEvolvePage) {
        const evoButtons = root.querySelectorAll('button.text-evo:has(svg)');
        evoButtons.forEach(button => {
          const textSpan = button.querySelector('span:not(.shrink-0)');
          if (textSpan && !textSpan.dataset.oaoFutggEvoProcessed) {
            let text = textSpan.textContent.trim();
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
              // 首先在进化字典中查找
              if (options.evolutionDictionary) {
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
                  const dictValue = options.evolutionDictionary[key];
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  // 按照进化格式显示
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      textSpan.textContent = `${translation} (${key})${suffix}`;
                      break;
                    case 1: // 中文
                      textSpan.textContent = translation + suffix;
                      break;
                    case 2: // 英文 - 保持原始英文，不翻译
                      textSpan.textContent = key + suffix;
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
                    const translation = typeof dictValue === 'object'
                      ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                      : dictValue;
                    // 按照进化格式显示
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        textSpan.textContent = `${translation} (${key})${suffix}`;
                        break;
                      case 1: // 中文
                        textSpan.textContent = translation + suffix;
                        break;
                      case 2: // 英文 - 保持原始英文，不翻译
                        textSpan.textContent = key + suffix;
                        break;
                    }
                    translated = true;
                    break;
                  }
                  // 反向查找：当元素显示中文时，尝试找到对应的原始英文 key
                  if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                    for (const key in dict) {
                      if (dict.hasOwnProperty(key)) {
                        const dictValue = dict[key];
                        const translation = typeof dictValue === 'object'
                          ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                          : dictValue;
                        if (translation === baseText) {
                          // 找到了匹配的翻译，按照格式显示
                          switch (evolutionFormat) {
                            case 0: // 中文（英文）
                              textSpan.textContent = `${baseText} (${key})${suffix}`;
                              break;
                            case 2: // 英文 - 恢复原始英文
                              textSpan.textContent = key + suffix;
                              break;
                          }
                          translated = true;
                          break;
                        }
                      }
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
        
        // 处理带有 bg-evo/10 class 的按钮
        const bgEvoButtons = root.querySelectorAll('button.bg-evo\\/10.text-evo');
        bgEvoButtons.forEach(button => {
          const textSpan = button.querySelector('span:not(.shrink-0)');
          if (textSpan && !textSpan.dataset.oaoFutggEvoProcessed) {
            let text = textSpan.textContent.trim();
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
              // 首先在进化字典中查找
              if (options.evolutionDictionary) {
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
                  const dictValue = options.evolutionDictionary[key];
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  // 按照进化格式显示
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      textSpan.textContent = `${translation} (${key})${suffix}`;
                      break;
                    case 1: // 中文
                      textSpan.textContent = translation + suffix;
                      break;
                    case 2: // 英文 - 保持原始英文，不翻译
                      textSpan.textContent = key + suffix;
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
                    const translation = typeof dictValue === 'object'
                      ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                      : dictValue;
                    // 按照进化格式显示
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        textSpan.textContent = `${translation} (${key})${suffix}`;
                        break;
                      case 1: // 中文
                        textSpan.textContent = translation + suffix;
                        break;
                      case 2: // 英文 - 保持原始英文，不翻译
                        textSpan.textContent = key + suffix;
                        break;
                    }
                    translated = true;
                    break;
                  }
                  // 反向查找：当元素显示中文时，尝试找到对应的原始英文 key
                  if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                    for (const key in dict) {
                      if (dict.hasOwnProperty(key)) {
                        const dictValue = dict[key];
                        const translation = typeof dictValue === 'object'
                          ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                          : dictValue;
                        if (translation === baseText) {
                          // 找到了匹配的翻译，按照格式显示
                          switch (evolutionFormat) {
                            case 0: // 中文（英文）
                              textSpan.textContent = `${baseText} (${key})${suffix}`;
                              break;
                            case 2: // 英文 - 恢复原始英文
                              textSpan.textContent = key + suffix;
                              break;
                          }
                          translated = true;
                          break;
                        }
                      }
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

      // 针对 futgg evo-lab/evolutions 页面的特定 HTML 格式进行特殊处理
      // 该格式为：<a> 包含 <h2>文本</h2>
      if (isFutggEvolutionsLabPage) {
        const evolutionLinks = root.querySelectorAll('a[href*="/evolutions/"]');
        evolutionLinks.forEach(link => {
          const h2 = link.querySelector('h2.text-lg');
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
              const baseTextUpper = baseText.toUpperCase();
              let translated = false;
              // 首先在进化字典中查找
              if (options.evolutionDictionary) {
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
                  const dictValue = options.evolutionDictionary[key];
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  // 按照进化格式显示
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      h2.textContent = `${translation} (${key})${suffix}`;
                      break;
                    case 1: // 中文
                      h2.textContent = translation + suffix;
                      break;
                    case 2: // 英文 - 保持原始英文，不翻译
                      h2.textContent = key + suffix;
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
                    const translation = typeof dictValue === 'object'
                      ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                      : dictValue;
                    // 按照进化格式显示
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        h2.textContent = `${translation} (${key})${suffix}`;
                        break;
                      case 1: // 中文
                        h2.textContent = translation + suffix;
                        break;
                      case 2: // 英文 - 保持原始英文，不翻译
                        h2.textContent = key + suffix;
                        break;
                    }
                    translated = true;
                    break;
                  }
                  // 反向查找：当元素显示中文时，尝试找到对应的原始英文 key
                  if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                    for (const key in dict) {
                      if (dict.hasOwnProperty(key)) {
                        const dictValue = dict[key];
                        const translation = typeof dictValue === 'object'
                          ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                          : dictValue;
                        if (translation === baseText) {
                          // 找到了匹配的翻译，按照格式显示
                          switch (evolutionFormat) {
                            case 0: // 中文（英文）
                              h2.textContent = `${baseText} (${key})${suffix}`;
                              break;
                            case 2: // 英文 - 恢复原始英文
                              h2.textContent = key + suffix;
                              break;
                          }
                          translated = true;
                          break;
                        }
                      }
                    }
                  }
                  if (translated) break;
                }
              }
            }
            // 标记为已处理，避免重复处理
            h2.dataset.oaoFutggEvoProcessed = 'true';
            h2.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 futgg players/***/evolutions 页面的特定 HTML 格式进行特殊处理
      // 该格式为：<div><svg/><div>文本</div></div>
      if (isFutggPlayerEvolutionsPage) {
        const evoItems = root.querySelectorAll('div.flex.items-center.w-full.gap-2');
        evoItems.forEach(item => {
          const textDiv = item.querySelector('div.overflow-hidden');
          if (textDiv && !textDiv.dataset.oaoFutggEvoProcessed) {
            let text = textDiv.textContent.trim();
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
              // 首先在进化字典中查找
              if (options.evolutionDictionary) {
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
                  const dictValue = options.evolutionDictionary[key];
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  // 按照进化格式显示
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      textDiv.textContent = `${translation} (${key})${suffix}`;
                      break;
                    case 1: // 中文
                      textDiv.textContent = translation + suffix;
                      break;
                    case 2: // 英文 - 保持原始英文，不翻译
                      textDiv.textContent = key + suffix;
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
                    const translation = typeof dictValue === 'object'
                      ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                      : dictValue;
                    // 按照进化格式显示
                    switch (evolutionFormat) {
                      case 0: // 中文（英文）
                        textDiv.textContent = `${translation} (${key})${suffix}`;
                        break;
                      case 1: // 中文
                        textDiv.textContent = translation + suffix;
                        break;
                      case 2: // 英文 - 保持原始英文，不翻译
                        textDiv.textContent = key + suffix;
                        break;
                    }
                    translated = true;
                    break;
                  }
                  // 反向查找：当元素显示中文时，尝试找到对应的原始英文 key
                  if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                    for (const key in dict) {
                      if (dict.hasOwnProperty(key)) {
                        const dictValue = dict[key];
                        const translation = typeof dictValue === 'object'
                          ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                          : dictValue;
                        if (translation === baseText) {
                          // 找到了匹配的翻译，按照格式显示
                          switch (evolutionFormat) {
                            case 0: // 中文（英文）
                              textDiv.textContent = `${baseText} (${key})${suffix}`;
                              break;
                            case 2: // 英文 - 恢复原始英文
                              textDiv.textContent = key + suffix;
                              break;
                          }
                          translated = true;
                          break;
                        }
                      }
                    }
                  }
                  if (translated) break;
                }
              }
            }
            // 标记为已处理，避免重复处理
            textDiv.dataset.oaoFutggEvoProcessed = 'true';
            textDiv.dataset.oaoTranslated = 'true';
          }
        });
      }

      // 针对 futgg evo-lab/evolve 页面的 p.text-xs.uppercase.font-bold 格式进行特殊处理
      if (isFutggEvolvePage) {
        // 处理 p.text-xs.uppercase.font-bold 元素
        const evoParagraphs = root.querySelectorAll('p.text-xs.uppercase.font-bold');
        evoParagraphs.forEach(p => {
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
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  // 按照进化格式显示
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      p.textContent = `${translation} (${key})${suffix}`;
                      break;
                    case 1: // 中文
                      p.textContent = translation + suffix;
                      break;
                    case 2: // 英文 - 保持原始英文，不翻译
                      p.textContent = key + suffix;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：当元素显示中文时，尝试找到对应的原始英文 key
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                  for (const key in dict) {
                    if (dict.hasOwnProperty(key)) {
                      const dictValue = dict[key];
                      const translation = typeof dictValue === 'object'
                        ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                        : dictValue;
                      if (translation === baseText) {
                        // 找到了匹配的翻译，按照格式显示
                        switch (evolutionFormat) {
                          case 0: // 中文（英文）
                            p.textContent = `${baseText} (${key})${suffix}`;
                            break;
                          case 2: // 英文 - 恢复原始英文
                            p.textContent = key + suffix;
                            break;
                        }
                        translated = true;
                        break;
                      }
                    }
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
        // 使用更精确的选择器：包含 bg-evo/10 和 text-evo 类的按钮，且包含 SVG 图标
        const evoButtons = root.querySelectorAll('button[class*="bg-evo"][class*="text-evo"]:has(svg)');
        evoButtons.forEach(button => {
          const span = button.querySelector('span:not(:has(svg))');
          if (span) {
            const text = span.textContent.trim();
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
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  // 按照进化格式显示
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      span.textContent = `${translation} (${key})${suffix}`;
                      break;
                    case 1: // 中文
                      span.textContent = translation + suffix;
                      break;
                    case 2: // 英文 - 保持原始英文，不翻译
                      span.textContent = key + suffix;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找：当元素显示中文时，尝试找到对应的原始英文 key
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                  for (const key in dict) {
                    if (dict.hasOwnProperty(key)) {
                      const dictValue = dict[key];
                      const translation = typeof dictValue === 'object'
                        ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                        : dictValue;
                      if (translation === baseText) {
                        // 找到了匹配的翻译，按照格式显示
                        switch (evolutionFormat) {
                          case 0: // 中文（英文）
                            span.textContent = `${baseText} (${key})${suffix}`;
                            break;
                          case 2: // 英文 - 恢复原始英文
                            span.textContent = key + suffix;
                            break;
                        }
                        translated = true;
                        break;
                      }
                    }
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
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
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

        // 跳过 futgg evolutions 页面的特殊 HTML 格式元素
        // 这些元素由专门的代码处理，避免重复翻译导致闪烁
        if (isFutggEvolutionsPage) {
          const closestWrapper = element.closest('.bg-gray-900.rounded');
          if (closestWrapper && closestWrapper.querySelector('h2.font-bold')) {
            continue;
          }
        }

        // 跳过 futgg evo-lab/evolve 页面的特殊 HTML 格式元素
        if (isFutggEvolvePage) {
          const closestButton = element.closest('button.text-evo');
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

        // 只在 evo-lab/evolutions 页面跳过球员六项数据（速度、射门、传球、盘带、防守、身体）
        // 这些数据在页面中重复出现，且已经通过 sixStatTranslator 翻译
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
              for (let k = 0; k < allDictionaries.length; k++) {
                const dict = allDictionaries[k];
                if (dict[englishText] || dict[englishTextUpper]) {
                  const key = dict[englishText] ? englishText : englishTextUpper;
                  const translation = options.useShortenTerms ? dict[key].shorten : dict[key].webpagedata;
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
              for (let k = 0; k < allDictionaries.length; k++) {
                const dict = allDictionaries[k];
                if (dict[normalizedText] || dict[textUpper]) {
                  const key = dict[normalizedText] ? normalizedText : textUpper;
                  const translation = options.useShortenTerms ? dict[key].shorten : dict[key].webpagedata;
                  
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
              
              for (let k = 0; k < allDictionaries.length; k++) {
                const dict = allDictionaries[k];
                if (dict[englishText] || dict[englishTextUpper]) {
                  const key = dict[englishText] ? englishText : englishTextUpper;
                  const translation = options.useShortenTerms ? dict[key].shorten : dict[key].webpagedata;
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
                  const translation = options.useShortenTerms ? options.evolutionDictionary[key].shorten : options.evolutionDictionary[key].webpagedata;
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
              for (let k = 0; k < allDictionaries.length; k++) {
                const dict = allDictionaries[k];
                if (dict[baseText] || dict[baseTextUpper]) {
                  const key = dict[baseText] ? baseText : baseTextUpper;
                  const translation = options.useShortenTerms ? dict[key].shorten : dict[key].webpagedata;
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
            for (let k = 0; k < allDictionaries.length; k++) {
              const dict = allDictionaries[k];
              if (dict[normalizedText] || dict[textUpper]) {
                const key = dict[normalizedText] ? normalizedText : textUpper;
                const translation = options.useShortenTerms ? dict[key].shorten : dict[key].webpagedata;
                
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
        for (let k = 0; k < allDictionaries.length; k++) {
          const dict = allDictionaries[k];
          // 首先尝试直接文本匹配（不包括子元素的文本）
          if (normalizedDirectText && (dict[normalizedDirectText] || dict[directTextUpper])) {
            const key = dict[normalizedDirectText] ? normalizedDirectText : directTextUpper;
            const translation = options.useShortenTerms ? dict[key].shorten : dict[key].webpagedata;
            
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
                    case 1: // 中文
                      child.textContent = translation;
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
              if (options.evolutionDictionary) {
                if (options.evolutionDictionary[baseText] || options.evolutionDictionary[baseTextUpper]) {
                  const key = options.evolutionDictionary[baseText] ? baseText : baseTextUpper;
                  const translation = options.useShortenTerms ? options.evolutionDictionary[key].shorten : options.evolutionDictionary[key].webpagedata;
                  
                  // 只替换直接文本节点，保留子元素
                  for (let j = 0; j < element.childNodes.length; j++) {
                    const child = element.childNodes[j];
                    if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                      // 根据进化格式设置决定显示方式
                      switch (evolutionFormat) {
                        case 0: // 中文（英文）
                          child.textContent = `${translation} (${baseText})${suffixMatch[0]}`;
                          break;
                        case 1: // 中文
                          child.textContent = translation + suffixMatch[0];
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
                const translation = options.useShortenTerms ? dict[key].shorten : dict[key].webpagedata;
                
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
                          child.textContent = `${translation} (${baseText})${suffixMatch[0]}`;
                          break;
                        case 1: // 中文
                          child.textContent = translation + suffixMatch[0];
                          break;
                        case 2: // 英文
                          child.textContent = normalizedDirectText;
                          break;
                      }
                    } else {
                      // 其他字典的翻译直接显示中文
                      child.textContent = translation + suffixMatch[0];
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
          for (let k = 0; k < allDictionaries.length; k++) {
            const dict = allDictionaries[k];
            if (normalizedText && (dict[normalizedText] || dict[textUpper])) {
              const key = dict[normalizedText] ? normalizedText : textUpper;
              const translation = options.useShortenTerms ? dict[key].shorten : dict[key].webpagedata;
              
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
              for (let k = 0; k < allDictionaries.length; k++) {
                const dict = allDictionaries[k];
                if (dict[textUpper]) {
                  const translation = options.useShortenTerms ? dict[textUpper].shorten : dict[textUpper].webpagedata;
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
      
      // 合并所有字典，包括进化字典
      const allDictionaries = [dictionary];
      if (options && options.extraDictionaries) {
        allDictionaries.push(...options.extraDictionaries);
      }

      // 页面检测
      const isFutbinEvolutionsPage = window.location.href.includes('/evolutions') && !window.location.href.includes('/builder');
      const isFutbinPopularEvolutionsPage = window.location.href.includes('/popular/evolutions');
      const isFutbinPlayerPage = window.location.href.includes('/26/player/');
      const isFutbinPlayerEvolutionPage = window.location.href.includes('/player/') && window.location.href.includes('/evolution');
      const isFutbinEvolutionBuilderPage = window.location.href.includes('/evolutions/builder/');

      // 针对 futbin 页面的进化分类标签进行特殊处理
      const evoCategoryPills = root.querySelectorAll('.evo-category-pill');
      evoCategoryPills.forEach(pill => {
        // 清除已翻译标记，确保重新处理
        delete pill.dataset.oaoTranslated;
        pill.childNodes.forEach(child => {
          if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent.trim();
            // 优先使用字典进行翻译
            let translated = false;
            for (const dict of allDictionaries) {
              const textUpper = text.toUpperCase();
              if (dict[text] || dict[textUpper]) {
                const key = dict[text] ? text : textUpper;
                const translation = options.useShortenTerms ? dict[key].shorten : dict[key].webpagedata;
                child.textContent = translation;
                translated = true;
                break;
              }
            }
            // 不使用硬编码的翻译，只使用字典中的翻译
            pill.dataset.oaoTranslated = 'true';
          }
        });
      });

      // 针对 futbin /evolutions 页面的特定 HTML 格式进行特殊处理
      // 该格式为：<div class="xs-row align-center"><div class="xs-font text-center">文本</div></div>
      if (isFutbinEvolutionsPage || isFutbinPlayerEvolutionPage) {
        const evoRows = root.querySelectorAll('div.xs-row.align-center');
        evoRows.forEach(row => {
          const textDiv = row.querySelector('div.xs-font.text-center');
          if (textDiv && !textDiv.dataset.oaoFutbinEvoProcessed) {
            const text = textDiv.textContent.trim();
            if (text) {
              // 检查是否包含 "-" 分隔符，格式为 "进化名字 - ***"
              const dashIndex = text.indexOf(' - ');
              let evoName = text;
              let suffix = '';
              if (dashIndex !== -1) {
                evoName = text.substring(0, dashIndex);
                suffix = text.substring(dashIndex); // 包含 "- " 部分
              }
              
              const evoNameUpper = evoName.toUpperCase();
              let translated = false;
              for (const dict of allDictionaries) {
                // 正向查找
                if (dict[evoName] || dict[evoNameUpper]) {
                  const key = dict[evoName] ? evoName : evoNameUpper;
                  const dictValue = dict[key];
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      textDiv.textContent = `${translation} (${key})${suffix}`;
                      break;
                    case 1: // 中文
                      textDiv.textContent = `${translation}${suffix}`;
                      break;
                    case 2: // 英文
                      textDiv.textContent = `${key}${suffix}`;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                  for (const key in dict) {
                    if (dict.hasOwnProperty(key)) {
                      const dictValue = dict[key];
                      const translation = typeof dictValue === 'object'
                        ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                        : dictValue;
                      if (translation === evoName) {
                        switch (evolutionFormat) {
                          case 0:
                            textDiv.textContent = `${evoName} (${key})${suffix}`;
                            break;
                          case 2:
                            textDiv.textContent = `${key}${suffix}`;
                            break;
                        }
                        translated = true;
                        break;
                      }
                    }
                  }
                }
                if (translated) break;
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
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      pill.textContent = `${translation} (${key})`;
                      break;
                    case 1: // 中文
                      pill.textContent = translation;
                      break;
                    case 2: // 英文
                      pill.textContent = key;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                  for (const key in dict) {
                    if (dict.hasOwnProperty(key)) {
                      const dictValue = dict[key];
                      const translation = typeof dictValue === 'object'
                        ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                        : dictValue;
                      if (translation === text) {
                        switch (evolutionFormat) {
                          case 0:
                            pill.textContent = `${text} (${key})`;
                            break;
                          case 2:
                            pill.textContent = key;
                            break;
                        }
                        translated = true;
                        break;
                      }
                    }
                  }
                }
                if (translated) break;
              }
            }
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
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      pill.textContent = `${translation} (${key})`;
                      break;
                    case 1: // 中文
                      pill.textContent = translation;
                      break;
                    case 2: // 英文
                      pill.textContent = key;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                  for (const key in dict) {
                    if (dict.hasOwnProperty(key)) {
                      const dictValue = dict[key];
                      const translation = typeof dictValue === 'object'
                        ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                        : dictValue;
                      if (translation === text) {
                        switch (evolutionFormat) {
                          case 0:
                            pill.textContent = `${text} (${key})`;
                            break;
                          case 2:
                            pill.textContent = key;
                            break;
                        }
                        translated = true;
                        break;
                      }
                    }
                  }
                }
                if (translated) break;
              }
            }
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
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      pill.textContent = `${translation} (${key})`;
                      break;
                    case 1: // 中文
                      pill.textContent = translation;
                      break;
                    case 2: // 英文
                      pill.textContent = key;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                  for (const key in dict) {
                    if (dict.hasOwnProperty(key)) {
                      const dictValue = dict[key];
                      const translation = typeof dictValue === 'object'
                        ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                        : dictValue;
                      if (translation === text) {
                        switch (evolutionFormat) {
                          case 0:
                            pill.textContent = `${text} (${key})`;
                            break;
                          case 2:
                            pill.textContent = key;
                            break;
                        }
                        translated = true;
                        break;
                      }
                    }
                  }
                }
                if (translated) break;
              }
            }
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
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      pill.textContent = `${translation} (${key})`;
                      break;
                    case 1: // 中文
                      pill.textContent = translation;
                      break;
                    case 2: // 英文
                      pill.textContent = key;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                  for (const key in dict) {
                    if (dict.hasOwnProperty(key)) {
                      const dictValue = dict[key];
                      const translation = typeof dictValue === 'object'
                        ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                        : dictValue;
                      if (translation === text) {
                        switch (evolutionFormat) {
                          case 0:
                            pill.textContent = `${text} (${key})`;
                            break;
                          case 2:
                            pill.textContent = key;
                            break;
                        }
                        translated = true;
                        break;
                      }
                    }
                  }
                }
                if (translated) break;
              }
            }
            pill.dataset.oaoFutbinEvoProcessed = 'true';
            pill.dataset.oaoTranslated = 'true';
          }
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
                  const translation = options.useShortenTerms ? dict[text].shorten : dict[text].webpagedata;
                  child.textContent = translation;
                  break;
                }
                // 尝试大写形式（大小写不敏感）
                const textUpper = text.toUpperCase();
                if (dict[textUpper]) {
                  const translation = options.useShortenTerms ? dict[textUpper].shorten : dict[textUpper].webpagedata;
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

          // 跳过 futbin evolutions 页面的特殊 HTML 格式元素
          if (isFutbinEvolutionsPage) {
            const closestRow = element.closest('div.xs-row.align-center');
            if (closestRow) {
              continue;
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
            
            // 尝试在所有字典中查找翻译
            for (const dict of allDictionaries) {
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

      // 合并所有字典，包括进化字典
      // 与 Futgg 保持一致，使用简单的方式构建字典数组
      const allDictionaries = [dictionary];
      if (options && options.extraDictionaries) {
        allDictionaries.push(...options.extraDictionaries);
      }

      // 页面检测
      const isEasysbcEvolutionsPlayersPage = window.location.href.includes('/evolutions/players');
      const isEasysbcEvolutionBuilderPage = window.location.href.includes('/evolutions/builder/');
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
              for (const dict of allDictionaries) {
                // 正向查找
                if (dict[nameText] || dict[textUpper]) {
                  const key = dict[nameText] ? nameText : textUpper;
                  const dictValue = dict[key];
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      p.textContent = `${translation} (${key})${numberSuffix}`;
                      break;
                    case 1: // 中文
                      p.textContent = translation + numberSuffix;
                      break;
                    case 2: // 英文
                      p.textContent = key + numberSuffix;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                  for (const key in dict) {
                    if (dict.hasOwnProperty(key)) {
                      const dictValue = dict[key];
                      const translation = typeof dictValue === 'object'
                        ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                        : dictValue;
                      if (translation === nameText) {
                        switch (evolutionFormat) {
                          case 0:
                            p.textContent = `${nameText} (${key})${numberSuffix}`;
                            break;
                          case 2:
                            p.textContent = key + numberSuffix;
                            break;
                        }
                        translated = true;
                        break;
                      }
                    }
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
              for (const dict of allDictionaries) {
                // 正向查找
                if (dict[nameText] || dict[textUpper]) {
                  const key = dict[nameText] ? nameText : textUpper;
                  const dictValue = dict[key];
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      h2.textContent = `${translation} (${key})${numberSuffix}`;
                      break;
                    case 1: // 中文
                      h2.textContent = translation + numberSuffix;
                      break;
                    case 2: // 英文
                      h2.textContent = key + numberSuffix;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                  for (const key in dict) {
                    if (dict.hasOwnProperty(key)) {
                      const dictValue = dict[key];
                      const translation = typeof dictValue === 'object'
                        ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                        : dictValue;
                      if (translation === nameText) {
                        switch (evolutionFormat) {
                          case 0:
                            h2.textContent = `${nameText} (${key})${numberSuffix}`;
                            break;
                          case 2:
                            h2.textContent = key + numberSuffix;
                            break;
                        }
                        translated = true;
                        break;
                      }
                    }
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
                  const translation = typeof dictValue === 'object'
                    ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                    : dictValue;
                  switch (evolutionFormat) {
                    case 0: // 中文（英文）
                      p.textContent = `${translation} (${key})${numberSuffix}`;
                      break;
                    case 1: // 中文
                      p.textContent = translation + numberSuffix;
                      break;
                    case 2: // 英文
                      p.textContent = key + numberSuffix;
                      break;
                  }
                  translated = true;
                  break;
                }
                // 反向查找
                if (!translated && (evolutionFormat === 0 || evolutionFormat === 2)) {
                  for (const key in dict) {
                    if (dict.hasOwnProperty(key)) {
                      const dictValue = dict[key];
                      const translation = typeof dictValue === 'object'
                        ? (options.useShortenTerms ? dictValue.shorten : dictValue.webpagedata)
                        : dictValue;
                      if (translation === chineseText || translation === nameText) {
                        switch (evolutionFormat) {
                          case 0:
                            p.textContent = `${translation} (${key})${numberSuffix}`;
                            break;
                          case 2:
                            p.textContent = key + numberSuffix;
                            break;
                        }
                        translated = true;
                        break;
                      }
                    }
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
                  const translation = options.useShortenTerms ? dict[textUpper].shorten : dict[textUpper].webpagedata;
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
      } else {
        isTranslationEnabled = futbinTranslationEnabled;
      }
      // log('debug', '翻译开关状态:', isTranslationEnabled);
      // log('debug', 'futggTranslationEnabled:', futggTranslationEnabled);
      // log('debug', 'futbinTranslationEnabled:', futbinTranslationEnabled);
      
      // 只有在翻译开启时才运行基本翻译器
      if (isTranslationEnabled) {
        // 只有在非 Fut.gg 且非 EASYSBC 页面上运行基本翻译器，避免重复翻译
        // 但不在进化页面运行，避免与 evolutionsTranslator 重复翻译
        if (!isFutggPage && !isEasysbcPage && !isEvolutionsPage) {
          baseInfoTranslator.translate(root, dictionaries.basic, {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          });
        } else if (isEasysbcPage) {
          // 在EASYSBC页面上，先运行baseInfoTranslator翻译基本信息
          baseInfoTranslator.translate(root, dictionaries.basic, {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          });
          // 在EASYSBC页面上，也运行sixStatTranslator翻译六维属性
          sixStatTranslator.translate(root, dictionaries.sixStat, {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          });
        }
        
        // 只有在非 EASYSBC 页面上运行其他翻译器，避免重复翻译
        if (!isEasysbcPage) {
          sixStatTranslator.translate(root, dictionaries.sixStat, {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          });
          roleTranslator.translate(root, dictionaries.roles, {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          });
          chemistryTranslator.translate(root, dictionaries.chemistry, {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          });
          playstylesTranslator.translate(root, dictionaries.playstyles, {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
          });
        } else {
          // 在EASYSBC页面上，确保不运行其他翻译器
        }
      }
      
      // 只有在进化相关页面上运行 evolutionsTranslator，英文状态时不运行
      if (isEvolutionsPage && evolutionFormat !== 2) {
        evolutionsTranslator.translate(root, dictionaries.evolutions, {
          useShortenTerms: USE_SHORTEN_TERMS,
          showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
        });
      }
      
      // 只有在 Evo Lab 页面上运行 futggEvolutionsTranslator，英文状态时不运行
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
      if (isFutggPage && futggTranslationEnabled) {
        // 英文状态时不包含进化字典，避免翻译进化名称
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
        }
        // 添加 futgg 字典到 extraDictionaries
        if (dictionaries.futgg) {
          extraDictionaries.push(dictionaries.futgg);
        }
        futggTranslator.translate(
          root,
          dictionaries.futgg || dictionaries.basic,
          {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
            extraDictionaries: extraDictionaries,
            evolutionDictionary: evolutionDictionary
          }
        );
      }
      

      
      // 只有在非 Fut.gg 且非 EASYSBC 页面上运行 futbinTranslator
      if (!isFutggPage && !isEasysbcPage && futbinTranslationEnabled) {
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
      
      // 只有在 Easysbc 页面上运行 easysbcTranslator
      if (isEasysbcPage && easysbcTranslationEnabled) {
        // 英文状态时不包含进化字典，避免翻译进化名称
        const extraDictionaries = [
          dictionaries.basic,
          dictionaries.sixStat,
          dictionaries.playstyles,
          dictionaries.roles,
          dictionaries.chemistry, // 添加chemistry字典
        ];
        if (evolutionFormat !== 2) {
          extraDictionaries.push(dictionaries.evolutions);
        }
        
        // 使用easysbc字典或fallback到futbin字典
        const easysbcDict = (dictionaries.easysbc && Object.keys(dictionaries.easysbc).length > 0) ? dictionaries.easysbc : dictionaries.futbin;
        
        // 检查字典内容
        // console.log('[OAO] easysbcDict 条目数:', Object.keys(easysbcDict).length);
        // console.log('[OAO] basic字典 条目数:', Object.keys(dictionaries.basic).length);
        // console.log('[OAO] roles字典 条目数:', Object.keys(dictionaries.roles).length);
        // console.log('[OAO] chemistry字典 条目数:', Object.keys(dictionaries.chemistry).length);
        // console.log('[OAO] easysbcDict 包含 Target Forward ST:', 'Target Forward ST' in easysbcDict);
        // console.log('[OAO] basic字典 包含 Target Forward ST:', 'Target Forward ST' in dictionaries.basic);
        // console.log('[OAO] easysbcDict 包含 Left Foot:', 'Left Foot' in easysbcDict);
        // console.log('[OAO] basic字典 包含 Left Foot:', 'Left Foot' in dictionaries.basic);
        
        // 清除EASYSBC页面上的翻译标记，确保重新翻译
        const easysbcElements = root.querySelectorAll('[data-oao-translated="true"]');
        easysbcElements.forEach(element => {
          delete element.dataset.oaoTranslated;
        });
        
        // 使用专门的easysbcTranslator
        easysbcTranslator.translate(
          root,
          easysbcDict,
          {
            useShortenTerms: USE_SHORTEN_TERMS,
            showOriginalWithBrackets: SHOW_ORIGINAL_WITH_BRACKETS,
            extraDictionaries: extraDictionaries
          }
        );
      } else if (isEasysbcPage) {
        // 翻译未启用，不做处理
      }
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
    
    // 专门针对 fut.gg evo-lab/evolve 页面，在 SAVE PLAYER 按钮左侧添加提示
    const addSavePlayerHint = () => {
      const isFutggEvolvePage = window.location.href.includes('/evo-lab/evolve');
      if (!isFutggEvolvePage) return;
      
      // 检查是否已经添加过提示
      if (document.getElementById('oaevo-save-player-hint')) return;
      
      // 等待按钮容器加载
      const checkButtonContainer = setInterval(() => {
        const buttonContainer = document.querySelector('button.bg-evo:has(svg)')?.parentElement;
        if (buttonContainer && !document.getElementById('oaevo-save-player-hint')) {
          clearInterval(checkButtonContainer);
          
          // 创建提示元素
          const hint = document.createElement('span');
          hint.id = 'oaevo-save-player-hint';
          hint.style.color = 'red';
          hint.style.fontSize = '14px';
          hint.style.marginRight = 'auto';
          hint.style.marginLeft = '0';
          hint.style.whiteSpace = 'nowrap';
          hint.textContent = '备注：进化选择过程，进化名称会短暂恢复成英语，正常2秒内会刷新翻译，如有问题请联系欧啊欧处理！';
          
          // 在按钮左侧插入提示
          buttonContainer.insertBefore(hint, buttonContainer.firstChild);
        }
      }, 500);
      
      // 10秒后停止检查
      setTimeout(() => clearInterval(checkButtonContainer), 10000);
    };
    
    // 监听页面重渲染，确保侧边栏在页面变化后仍能显示
    let consecutiveExists = 0;
    const maxConsecutiveExists = 5;
    const sidebarCheckInterval = setInterval(() => {
      const isFutggPage = window.location.hostname.includes('fut.gg');
      const isFutbinPage = window.location.hostname.includes('futbin.com');
      const sidebarExists = document.getElementById(SIDEBAR_ID);
      
      if ((isFutggPage || isFutbinPage)) {
        if (sidebarExists) {
          consecutiveExists++;
          console.log(`Sidebar exists, consecutive count: ${consecutiveExists}`);
          
          // 如果连续5次检测到侧边栏存在，停止检查
          if (consecutiveExists >= maxConsecutiveExists) {
            console.log('Sidebar stable, stopping check');
            clearInterval(sidebarCheckInterval);
          }
        } else {
          console.log('Sidebar not found, recreating...');
          createSidebar();
          consecutiveExists = 0; // 重置连续计数
        }
      } else {
        // 非FUTGG/FUTBIN页面，停止检查
        console.log('Not FUTGG/FUTBIN page, stopping check');
        clearInterval(sidebarCheckInterval);
      }
    }, 5000); // 5秒检查一次
    
    // 专门针对 fut.gg evo-lab/evolve 页面的进化卡片翻译检测
    // 当用户点击 APPLY 按钮后，执行一次检测
    const checkEvoCardsOnce = () => {
      const isFutggEvolvePage = window.location.href.includes('/evo-lab/evolve');
      if (!isFutggEvolvePage) return;
      
      // 检测带有进化卡片的按钮中的文本
      const evoButtons = document.querySelectorAll('button[class*="bg-evo"][class*="text-evo"]:has(svg)');
      evoButtons.forEach(button => {
        const span = button.querySelector('span:not(:has(svg))');
        if (span && span.dataset.oaoFutggEvoProcessed === 'true') {
          const text = span.textContent.trim();
          // 如果文本是纯英文（以数字或大写字母开头，不包含中文），则重新翻译
          if (text && /^(\d|[A-Z])/.test(text) && !text.includes('的') && !text.includes('版')) {
            // 清除标记，等待下次翻译周期重新翻译
            delete span.dataset.oaoFutggEvoProcessed;
            delete span.dataset.oaoTranslated;
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
        setTimeout(addSavePlayerHint, 3000);
      });
    } else {
      setTimeout(setupApplyButtonListener, 3000);
      setTimeout(addSavePlayerHint, 3000);
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
    console.log('[OAO] addWeeklyTacticsButton called');
    
    // 检查是否已存在
    if (document.getElementById('oaevo-weekly-tactics-btn')) {
      console.log('[OAO] Button already exists, skipping');
      return;
    }
    
    const hostname = window.location.hostname;
    console.log('[OAO] Hostname:', hostname);
    console.log('[OAO] isSquadBuilderPage:', isSquadBuilderPage());
    
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
      // FUTGG 页面
      // console.log('[OAO] FUTGG detected');
      // 尝试找到目标位置
      let targetElement = null;
      
      // 尝试多个选择器
      const selectors = [
        '.flex.gap-x-4.pt-2.px-2',
        'div.flex.gap-x-4.pt-2.px-2',
        '.flex.gap-x-4',
        'div.flex.gap-x-4',
        '.flex-1',
        'div.flex-1'
      ];
      
      for (const selector of selectors) {
        targetElement = document.querySelector(selector);
        if (targetElement) {
          break;
        }
      }
      
      if (targetElement) {
        // 调整按钮样式以适应容器
        button.style.cssText += `
          padding: 8px 12px;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(255, 87, 34, 0.4);
          gap: 6px;
        `;
        
        // 插入到目标容器中
        if (targetElement.firstChild) {
          targetElement.insertBefore(button, targetElement.firstChild);
        } else {
          targetElement.appendChild(button);
        }
        // console.log('[OAO] Button added to FUTGG container');
      } else {
        // 如果找不到目标容器，回退到固定位置
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
          // 战术和阵型构建器页面：尝试插入到用户指定位置
          // console.log('[OAO] Trying to insert into tactics-and-formations page');
          
          const tryFindAndInsert = () => {
            // 尝试找到 tactics-and-formations-controls-section 容器
            const controlsSection = document.querySelector('.tactics-and-formations-controls-section');
            const formationTitle = document.querySelector('.tactics-and-formations-controls-section h3.og-h3');
            
            console.log('[OAO] controls-section found:', controlsSection);
            console.log('[OAO] formation-title found:', formationTitle);
            
            if (controlsSection) {
              // 调整按钮样式以适应容器
              button.style.cssText += `
                padding: 12px 20px;
                margin: 10px 0;
                width: 100%;
                justify-content: center;
              `;
              
              // 插入到 Formation 标题之前
              if (formationTitle) {
                controlsSection.insertBefore(button, formationTitle);
                console.log('[OAO] Button inserted before Formation title');
              } else {
                // 如果找不到标题，插入到容器开头
                if (controlsSection.firstChild) {
                  controlsSection.insertBefore(button, controlsSection.firstChild);
                } else {
                  controlsSection.appendChild(button);
                }
                console.log('[OAO] Button inserted at beginning of controls section');
              }
              return true;
            }
            return false;
          };
          
          // 立即尝试插入
          if (!tryFindAndInsert()) {
            // 如果失败，使用 MutationObserver 等待元素加载
            console.log('[OAO] Elements not ready, waiting with MutationObserver');
            const observer = new MutationObserver((mutations, obs) => {
              if (tryFindAndInsert()) {
                obs.disconnect();
                console.log('[OAO] Observer disconnected after successful insertion');
              }
            });
            
            observer.observe(document.body, {
              childList: true,
              subtree: true
            });
            
            // 8秒后停止观察，使用固定定位作为回退
            setTimeout(() => {
              observer.disconnect();
              console.log('[OAO] Observer timeout, checking if button exists');
              if (!document.getElementById('oaevo-weekly-tactics-btn')) {
                console.log('[OAO] Button not inserted, using fixed position as fallback');
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
        // 阵容构建器页面：尝试插入到用户指定位置
        console.log('[OAO] Trying to insert into user specified position for squad builder');
        
        // 尝试找到用户指定的位置
        const tryFindAndInsert = () => {
          const squadInfoContainer = document.querySelector('.squad-info-container-modern');
          const squadSaverForm = document.querySelector('form.squad-builder-squad-saver');
          
          console.log('[OAO] squad-info-container-modern found:', squadInfoContainer);
          console.log('[OAO] squad-builder-squad-saver form found:', squadSaverForm);
          
          if (squadInfoContainer && squadSaverForm) {
            // 调整按钮样式以适应新位置
            button.style.cssText += `
              padding: 12px 20px;
              margin: 10px 0;
              width: 100%;
              justify-content: center;
            `;
            
            // 插入到 form 之前
            squadInfoContainer.insertBefore(button, squadSaverForm);
            console.log('[OAO] Button inserted before squad-builder-squad-saver form');
            return true;
          }
          return false;
        };
        
        // 立即尝试插入
        if (!tryFindAndInsert()) {
          // 如果失败，使用 MutationObserver 等待元素加载
          console.log('[OAO] User specified position not ready, waiting with MutationObserver');
          const observer = new MutationObserver((mutations, obs) => {
            if (tryFindAndInsert()) {
              obs.disconnect();
              console.log('[OAO] Observer disconnected after successful insertion');
            }
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
          // 8秒后停止观察，使用固定定位作为回退
          setTimeout(() => {
            observer.disconnect();
            console.log('[OAO] Observer timeout, checking if button exists');
            if (!document.getElementById('oaevo-weekly-tactics-btn')) {
              console.log('[OAO] Button not inserted, using fixed position as fallback');
              button.style.cssText += `
                position: fixed;
                top: 120px;
                right: 20px;
                padding: 12px 20px;
                box-shadow: 0 4px 15px rgba(255, 87, 34, 0.5);
              `;
              document.body.appendChild(button);
              console.log('[OAO] Button added to squad builder with fixed position');
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
        // 检查是否需要添加或移除每周阵型战术推荐按钮
        if (isSquadBuilderPage()) {
          addWeeklyTacticsButton();
        } else {
          // 如果不是 squad-builder 页面，移除按钮
          const btn = document.getElementById('oaevo-weekly-tactics-btn');
          if (btn) {
            btn.remove();
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
  async function checkVersionUpdate(mode = 'background') {
    const lastCheckDate = localStorage.getItem(VERSION_CHECK_KEY);
    const now = Date.now();
    
    // 如果是弹窗模式，检查是否满足间隔要求
    if (mode === 'popup') {
      if (lastCheckDate && (now - parseInt(lastCheckDate)) < VERSION_CHECK_INTERVAL) {
        // 不满足间隔，直接返回
        return;
      }
    }
    
    // 如果 URL 中包含 debug=1，强制清除检查时间缓存
    if (window.location.href.includes('debug=1')) {
      localStorage.removeItem(VERSION_CHECK_KEY);
    }
    
    try {
      // 使用 GM_xmlhttpRequest 绕过 CORS 限制
      GM_xmlhttpRequest({
        method: 'GET',
        url: SCRIPTCAT_SCRIPT_URL,
        onload: function(response) {
          // 尝试多种方式匹配版本号
          let versionMatch = response.responseText.match(/当前版本[\s\S]*?<span[^>]*>([\d.]+)<\/span>/i);
          
          if (!versionMatch) {
            versionMatch = response.responseText.match(/@version\s+([\d.]+)/);
          }
          
          if (!versionMatch) {
            versionMatch = response.responseText.match(/version[:\s]*([\d.]+)/i);
          }
          
          if (!versionMatch) {
            versionMatch = response.responseText.match(/ant-statistic-content-value[^>]*>([\d.]+)<\/span>/i);
          }
          
          if (versionMatch) {
            const remoteVersion = versionMatch[1];
            const currentVersion = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) ? GM_info.script.version : '1.1.19';
            
            // 比较版本号
            const comparison = compareVersions(remoteVersion, currentVersion);
            
            if (comparison > 0) {
              // 发现新版本，保存信息
              newVersionInfo = {
                remoteVersion: remoteVersion,
                currentVersion: currentVersion
              };
              localStorage.setItem(NEW_VERSION_KEY, JSON.stringify(newVersionInfo));
              
              // 更新侧边栏红点
              updateVersionIndicator(true);
              
              // 如果是弹窗模式，显示弹窗
              if (mode === 'popup') {
                showUpdateDialog(remoteVersion, currentVersion);
              }
            } else {
              // 版本已是最新，清除红点
              localStorage.removeItem(NEW_VERSION_KEY);
              newVersionInfo = null;
              updateVersionIndicator(false);
            }
            
            // 保存检查时间
            localStorage.setItem(VERSION_CHECK_KEY, Date.now().toString());
          }
        },
        onerror: function(error) {
          // 静默处理错误
        }
      });
    } catch (error) {
      // 静默处理错误
    }
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
  function showUpdateDialog(newVersion, currentVersion) {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // 创建弹窗
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      text-align: center;
    `;
    
    // 标题
    const title = document.createElement('h2');
    title.textContent = '发现新版本';
    title.style.cssText = `
      margin: 0 0 16px 0;
      color: #333;
      font-size: 20px;
      font-weight: 600;
    `;
    
    // 内容
    const content = document.createElement('p');
    content.textContent = `当前版本：${currentVersion}\n最新版本：${newVersion}`;
    content.style.cssText = `
      margin: 0 0 24px 0;
      color: #666;
      font-size: 14px;
      line-height: 1.6;
      white-space: pre-line;
    `;
    
    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: center;
    `;
    
    // 前往更新按钮
    const updateButton = document.createElement('button');
    updateButton.textContent = '前往更新';
    updateButton.style.cssText = `
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      background: #007bff;
      color: white;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    `;
    updateButton.addEventListener('mouseenter', () => {
      updateButton.style.background = '#0056b3';
    });
    updateButton.addEventListener('mouseleave', () => {
      updateButton.style.background = '#007bff';
    });
    updateButton.addEventListener('click', () => {
      window.open(SCRIPTCAT_SCRIPT_URL, '_blank');
      overlay.remove();
    });
    
    // 稍后提醒按钮
    const laterButton = document.createElement('button');
    laterButton.textContent = '稍后提醒';
    laterButton.style.cssText = `
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      background: #f0f0f0;
      color: #333;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    `;
    laterButton.addEventListener('mouseenter', () => {
      laterButton.style.background = '#e0e0e0';
    });
    laterButton.addEventListener('mouseleave', () => {
      laterButton.style.background = '#f0f0f0';
    });
    laterButton.addEventListener('click', () => {
      overlay.remove();
    });
    
    // 组装弹窗
    buttonContainer.appendChild(updateButton);
    buttonContainer.appendChild(laterButton);
    dialog.appendChild(title);
    dialog.appendChild(content);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
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
    console.log('[OAO] 当前页面:', window.location.hostname);
    console.log('[OAO] 当前路径:', window.location.pathname);
    
    injectSidebarStyles();
    syncSidebarState();
    
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
})();