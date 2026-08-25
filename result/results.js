const body = document.body;
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  const NAV_COLLAPSE_QUERY = '(max-width: 1024px)';

  function closeNavMenu(){
    if(!navLinks || !navToggle) return;
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  function openNavMenu(){
    if(!navLinks || !navToggle) return;
    navLinks.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
  }
  function toggleNavMenu(){
    if(!navLinks) return;
    if(navLinks.classList.contains('open')) closeNavMenu();
    else openNavMenu();
  }

  if(navToggle && navLinks){

    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleNavMenu();
    });

    document.addEventListener('click', (e) => {
      if(!window.matchMedia(NAV_COLLAPSE_QUERY).matches) return;
      if(navLinks.contains(e.target) || navToggle.contains(e.target)) return;
      closeNavMenu();
    });

    ['navHome', 'navAbout', 'navPractice', 'navHelp'].forEach(id => {
      const el = document.getElementById(id);
      if(el){
        el.addEventListener('click', () => {
          if(window.matchMedia(NAV_COLLAPSE_QUERY).matches) closeNavMenu();
        });
      }
    });

    window.addEventListener('resize', () => {
      if(!window.matchMedia(NAV_COLLAPSE_QUERY).matches) closeNavMenu();
    });
  }

  const settingsBtn = document.getElementById('settingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');
  const lightBtn = document.getElementById('lightBtn');
  const darkBtn = document.getElementById('darkBtn');
  const sizeBtns = document.querySelectorAll('.size-btn');
  const viBtn = document.getElementById('viBtn');
  const enBtn = document.getElementById('enBtn');

  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = settingsPanel.classList.toggle('open');
    settingsBtn.setAttribute('aria-expanded', isOpen);
  });
  document.addEventListener('click', (e) => {
    if(!settingsPanel.contains(e.target) && e.target !== settingsBtn){
      settingsPanel.classList.remove('open');
      settingsBtn.setAttribute('aria-expanded', 'false');
    }
  });

  function setTheme(theme){
    body.setAttribute('data-theme', theme);
    lightBtn.classList.toggle('active', theme === 'light');
    darkBtn.classList.toggle('active', theme === 'dark');
  }
  lightBtn.addEventListener('click', () => setTheme('light'));
  darkBtn.addEventListener('click', () => setTheme('dark'));

  sizeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sizeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.documentElement.style.setProperty('--font-scale', btn.dataset.scale);
    });
  });
  const HERO_TYPING_TEXT = {
    vi: 'Không gian tìm kiếm sự hỗ trợ tâm lý an toàn!',
    en: 'A respectful space to find mental health support!',
  };
  const heroTypingVi = document.getElementById('heroTypingVi');
  const heroTypingEn = document.getElementById('heroTypingEn');
  let heroTypingTimer = null;

  function stopHeroTyping(){
    if(heroTypingTimer){
      clearInterval(heroTypingTimer);
      heroTypingTimer = null;
    }
    document.querySelectorAll('.typing-cursor').forEach(c => c.classList.remove('is-active'));
  }

  function typeHeroTitle(lang, instant){
    stopHeroTyping();
    const text = HERO_TYPING_TEXT[lang];
    const target = lang === 'vi' ? heroTypingVi : heroTypingEn;
    const other = lang === 'vi' ? heroTypingEn : heroTypingVi;
    const cursor = target.parentElement.querySelector('.typing-cursor');

    other.textContent = '';
    target.textContent = '';

    if(instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      target.textContent = text;
      return;
    }

    cursor.classList.add('is-active');
    let i = 0;
    const speed = lang === 'vi' ? 42 : 34;

    heroTypingTimer = setInterval(() => {
      if(i < text.length){
        target.textContent += text.charAt(i);
        i++;
      } else {
        stopHeroTyping();
      }
    }, speed);
  }

    function setLang(lang){
    body.setAttribute('data-lang', lang);
    viBtn.classList.toggle('active', lang === 'vi');
    enBtn.classList.toggle('active', lang === 'en');
    if(!pageHome.classList.contains('hidden')) typeHeroTitle(lang);
    if(!pageDirectory.classList.contains('hidden')) refreshDirectoryUI();
  }
  viBtn.addEventListener('click', () => setLang('vi'));
  enBtn.addEventListener('click', () => setLang('en'));
  typeHeroTitle(body.getAttribute('data-lang') || 'vi');

  const navHome = document.getElementById('navHome');
  const navAbout = document.getElementById('navAbout');
  const navHelp = document.getElementById('navHelp');
  const navPractice = document.getElementById('navPractice');
  const pageHome = document.getElementById('pageHome');
  const pageAbout = document.getElementById('pageAbout');
  const pageHelp = document.getElementById('pageHelp');
  const pagePractice = document.getElementById('pagePractice');
  const navDirectory = document.getElementById('navDirectory');
  const pageDirectory = document.getElementById('pageDirectory');
  const footerDirectory = document.getElementById('footerDirectory');
  if (footerDirectory) {
    footerDirectory.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('directory');
    });
  }
  const footerAbout = document.getElementById('footerAbout');
      footerAbout.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('about');
      });
  const footerPractice = document.getElementById('footerPractice');
      footerPractice.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('practice');
      });
  const footerHelp = document.getElementById('footerHelp');
      footerHelp.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('help');
      });
  const footerHome = document.getElementById('footerHome');
      footerHome.addEventListener('click', (e) => {
      e.preventDefault();
      showPage('home');
      });
  const footerFeedback = document.getElementById('footerFeedback');
  const feedbackF = document.getElementById('feedbackForm');

if (footerFeedback && feedbackF) {
  footerFeedback.addEventListener('click', (e) => {
    e.preventDefault();

    showPage('help');

    setTimeout(() => {
      const y =
        feedbackF.getBoundingClientRect().top +
        window.scrollY -
        100;

      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }, 150);
  });
}

function showPage(page) {
  pageHome.classList.toggle('hidden', page !== 'home');
  pageAbout.classList.toggle('hidden', page !== 'about');
  pageHelp.classList.toggle('hidden', page !== 'help');
  pagePractice.classList.toggle('hidden', page !== 'practice');
  pageDirectory.classList.toggle('hidden', page !== 'directory');
  navHome.classList.remove('active');
  navAbout.classList.remove('active');
  navHelp.classList.remove('active');
  navPractice.classList.remove('active');
  navDirectory.classList.remove('active');
  if (page === 'home') navHome.classList.add('active');
  if (page === 'about') navAbout.classList.add('active');
  if (page === 'help') navHelp.classList.add('active');
  if (page === 'practice') navPractice.classList.add('active');
  if (page === 'directory') {
    navDirectory.classList.add('active');
    ensureDirectoryLoaded();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (page === 'home') {
    typeHeroTitle(body.getAttribute('data-lang') || 'vi');
  }
}
  navHome.addEventListener('click', () => showPage('home'));
  navAbout.addEventListener('click', () => showPage('about'));
  navHelp.addEventListener('click', () => showPage('help'));
  navPractice.addEventListener('click', () => showPage('practice'));
  navDirectory.addEventListener('click', () => showPage('directory'));

  const noticeOverlay = document.getElementById('noticeOverlay');
  const noticeClose = document.getElementById('noticeClose');

  function openNotice(){ noticeOverlay.classList.add('open'); }
  function closeNotice(){ noticeOverlay.classList.remove('open'); }

  noticeClose.addEventListener('click', closeNotice);
  noticeOverlay.addEventListener('click', (e) => {
    if(e.target === noticeOverlay) closeNotice();
  });
(function () {
  'use strict';

  const STORAGE_KEY = 'mappingWizardResult';
  const CLINICS_API = '/api/clinics';
  const FORCE_MOCK = false; 
  const MINUTES_TO_KM = { 0: 2, 1: 5, 2: 8, 3: 0 }; 
  const DEFAULT_RADIUS_KM = 5;
  const FALLBACK_CENTER = { lat: 10.7769, lng: 106.7009 };
  const PROVINCE_FALLBACK_CENTERS = {
    'Hồ Chí Minh': { lat: 10.7769, lng: 106.7009 },
    'Đồng Nai': { lat: 10.9574, lng: 106.8426 },
  };
  function fallbackForProvince(provinceVi){
   const key = (provinceVi || '').toLowerCase();
   const match = Object.keys(PROVINCE_FALLBACK_CENTERS).find(k => key.includes(k));
    return match ? PROVINCE_FALLBACK_CENTERS[match] : FALLBACK_CENTER;
  }
  const TOPICS_Q8 = [
    { vi: 'Lo âu', en: 'Anxiety', kw: ['lo âu', 'anxiety'] },
    { vi: 'Trầm cảm', en: 'Depression', kw: ['trầm cảm', 'depression'] },
    { vi: 'Stress', en: 'Stress', kw: ['stress', 'căng thẳng'] },
    { vi: 'Kiệt sức', en: 'Burnout', kw: ['kiệt sức', 'burnout'] },
    { vi: 'Khủng hoảng cảm xúc', en: 'Emotional crisis', kw: ['khủng hoảng', 'crisis'] },
    { vi: 'Mất ngủ', en: 'Insomnia', kw: ['mất ngủ', 'insomnia'] },
    { vi: 'Quan hệ gia đình', en: 'Family relationships', kw: ['gia đình', 'family'] },
    { vi: 'Quan hệ tình cảm', en: 'Romantic relationships', kw: ['tình cảm', 'relationship'] },
    { vi: 'Hôn nhân', en: 'Marriage', kw: ['hôn nhân', 'marriage'] },
    { vi: 'Nuôi dạy con', en: 'Parenting', kw: ['nuôi dạy con', 'parenting'] },
    { vi: 'Sang chấn', en: 'Trauma', kw: ['sang chấn', 'trauma'] },
    { vi: 'ADHD', en: 'ADHD', kw: ['adhd', 'tăng động'] },
    { vi: 'Phổ Tự kỷ', en: 'Autism Spectrum Disorder', kw: ['tự kỷ', 'autism'] },
    { vi: 'Rối loạn ăn uống', en: 'Eating disorders', kw: ['ăn uống', 'eating disorder'] },
    { vi: 'Nghiện', en: 'Addiction', kw: ['nghiện', 'addiction'] },
    { vi: 'Khó khăn trong học tập', en: 'Academic difficulties', kw: ['học tập', 'academic'] },
    { vi: 'Khó khăn trong công việc', en: 'Work difficulties', kw: ['công việc', 'work'] },
    { vi: 'Khác', en: 'Other', kw: [] },
  ];
  const TOPICS_Q9 = [
    { vi: 'Hỗ trợ LGBTQ+', en: 'LGBTQ+ support', kw: ['lgbt', 'lgbtq'] },
    { vi: 'Hỗ trợ người bệnh H.', en: 'Support for people living with HIV', kw: ['hiv', 'người bệnh h'] },
    { vi: 'Hỗ trợ Nhân viên Y Tế', en: 'Support for healthcare workers', kw: ['nhân viên y tế', 'healthcare worker'] },
    { vi: 'Hỗ trợ nạn nhân nạn buôn bán người', en: 'Support for survivors of human trafficking', kw: ['buôn bán người', 'trafficking'] },
    { vi: 'Hỗ trợ nạn nhân bạo lực học đường / bạo lực gia đình', en: 'Support for survivors of school or domestic violence', kw: ['bạo lực', 'violence'] },
    { vi: 'Hỗ trợ người mắc bệnh mạn tính', en: 'Support for people with chronic illness', kw: ['bệnh mạn tính', 'chronic illness'] },
  ];
  const FACILITY_TYPE_OPTS = [
    { vi: 'Công lập', en: 'Public' },
    { vi: 'Tư nhân', en: 'Private' },
    { vi: 'Không quan trọng', en: 'No preference' },
  ];
  const AGE_GROUP_KEYWORDS = [
    { vi: 'Dưới 12 tuổi', en: 'Under 12', kw: ['trẻ em', 'nhi', 'children', 'child'] },
    { vi: '12–17 tuổi', en: '12–17', kw: ['vị thành niên', 'thanh thiếu niên', 'teen', 'adolescen'] },
    { vi: '18–25 tuổi', en: '18–25', kw: ['thanh niên', 'người trẻ', 'sinh viên', 'young adult'] },
    { vi: '26–40 tuổi', en: '26–40', kw: ['người lớn', 'adult'] },
    { vi: '41–60 tuổi', en: '41–60', kw: ['người lớn', 'trung niên', 'adult'] },
    { vi: 'Trên 60 tuổi', en: 'Over 60', kw: ['người cao tuổi', 'elderly', 'senior'] },
  ];

  const state = {
    lang: 'vi',
    answers: null,
    location: null,
    refPoint: null, 
    radiusKm: DEFAULT_RADIUS_KM,
    clinics: [],
    matches: [], 
    currentIndex: 0,
    map: null,
    markers: {},           
    usingMock: false,       
  };

  const $ = (id) => document.getElementById(id);

  function loadWizardData() {
    let raw;
    try {
      raw = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    } catch (e) {
      raw = null;
    }
    if (!raw || !raw.answers) {
      showNoDataAndRedirect();
      return false;
    }
    state.answers = raw.answers;
    state.location = raw.location || {};
    state.lang = document.body.getAttribute('data-lang') || 'vi';
    return true;
  }

  function showNoDataAndRedirect() {
    $('resultsLoading').classList.add('hidden');
    $('resultsEmpty').classList.remove('hidden');
    $('resultsEmpty').querySelector('h3').innerHTML =
      '<span lang-el="vi">Chưa có dữ liệu sàng lọc</span><span lang-el="en">No screening data found</span>';
    $('resultsEmpty').querySelector('p').innerHTML =
      '<span lang-el="vi">Đang đưa bạn về trang chủ để bắt đầu…</span><span lang-el="en">Redirecting you to the homepage to start…</span>';
    setTimeout(() => { window.location.href = '../app/index.html'; }, 2500);
  }

  function getReferencePoint() {
    return new Promise((resolve) => {
      if (state.location && state.location.type === 'geo' && state.location.coords) {
        resolve({ lat: state.location.coords.lat, lng: state.location.coords.lng, source: 'gps' });
        return;
      }
      geocodeSelectedWard().then(resolve);
    });
  }

  async function tryGeocode(query) {

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.lat != null && data.lng != null) {
          return { lat: parseFloat(data.lat), lng: parseFloat(data.lng) };
        }
        console.warn(`Không tìm thấy kết quả cho truy vấn "${query}" (backend geocode)`);
      } else {
        console.warn(`Geocode API trả về lỗi HTTP ${res.status} cho truy vấn "${query}" — thử Nominatim.`);
      }
    } catch (e) {
      console.warn(`Geocode nội bộ lỗi cho truy vấn "${query}", thử Nominatim:`, e);
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) {
        console.warn(`Nominatim trả về lỗi HTTP ${res.status} cho truy vấn "${query}"`);
        return null;
      }
      const results = await res.json();
      if (Array.isArray(results) && results.length && results[0].lat != null && results[0].lon != null) {
        return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
      }
      console.warn(`Không tìm thấy kết quả cho truy vấn "${query}" (Nominatim)`);
      return null;
    } catch (e) {
      console.warn(`Geocode lỗi cho truy vấn "${query}" (Nominatim):`, e);
      return null;
    }
  }

  async function geocodeSelectedWard() {
    const { wardVi, provinceVi } = state.location || {};
    if (!wardVi && !provinceVi) {
      console.warn('Không có wardVi/provinceVi trong state.location — dùng toạ độ mặc định.');
      return { ...FALLBACK_CENTER, source: 'fallback' };
    }

    if (wardVi && provinceVi) {
      const preciseResult = await tryGeocode([wardVi, provinceVi, 'Việt Nam'].filter(Boolean).join(', '));
      if (preciseResult) return { ...preciseResult, source: 'geocode' };
    }

    if (provinceVi) {
      const provinceResult = await tryGeocode([provinceVi, 'Việt Nam'].filter(Boolean).join(', '));
      if (provinceResult) return { ...provinceResult, source: 'geocode-province' };
    }
    console.warn(`Không geocode được "${wardVi || ''}, ${provinceVi || ''}" — dùng toạ độ mặc định của tỉnh/thành.`);
    return { ...fallbackForProvince(provinceVi), source: 'fallback' };
  }

  async function loadClinics() {
    if (FORCE_MOCK) {
      state.usingMock = true;
      return MOCK_CLINICS;
    }
    try {
      const res = await fetch(CLINICS_API);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Phản hồi /api/clinics không đúng định dạng mảng');
      state.usingMock = false;
      return data;
    } catch (e) {
      console.warn('Không gọi được /api/clinics, tạm dùng dữ liệu MẪU để test giao diện:', e);
      state.usingMock = true;
      return MOCK_CLINICS;
    }
  }

  function haversineKm(a, b) {
    if (!a || !b || a.lat == null || b.latitude == null) return null;
    const R = 6371;
    const dLat = ((b.latitude - a.lat) * Math.PI) / 180;
    const dLng = ((b.longitude - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.latitude * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }

  const CLINIC_TYPE_MAP = {
    'bệnh viện công lập': 'public',
    'bệnh viện tư nhân': 'private',
    'phòng khám tư nhân': 'private',
    'tổ chức cộng đồng': 'community',
  };

  function normType(clinicType) {
    const t = (clinicType || '').trim().toLowerCase();
    if (CLINIC_TYPE_MAP[t]) return CLINIC_TYPE_MAP[t];
    if (t.includes('cộng đồng')) return 'community';
    if (t.includes('công lập')) return 'public';
    if (t.includes('tư nhân')) return 'private';
    return 'other';
  }

  function textIncludesAny(text, kwList) {
    const t = (text || '').toLowerCase();
    return kwList.some((kw) => kw && t.includes(kw));
  }

  function evaluateClinic(clinic) {
    const a = state.answers;
    const selectedGroupIdx = Array.isArray(a.q9) ? a.q9 : [];
    const selectedGroups = selectedGroupIdx.map((i) => TOPICS_Q9[i]).filter(Boolean);
    const matchedGroups = selectedGroups.filter(
      (g) => textIncludesAny(clinic.target_groups, g.kw) || textIncludesAny(clinic.description, g.kw)
    );
    const q9AllMatched = selectedGroups.length === 0 || matchedGroups.length === selectedGroups.length;
    let ageMatch = null;
    if (a.q2 !== undefined && AGE_GROUP_KEYWORDS[a.q2]) {
      const ageInfo = AGE_GROUP_KEYWORDS[a.q2];
      if (textIncludesAny(clinic.target_groups, ageInfo.kw) || textIncludesAny(clinic.description, ageInfo.kw)) {
        ageMatch = ageInfo;
      }
    }
    const typePref = a.q6;
    const wantedType = typePref !== undefined ? FACILITY_TYPE_OPTS[typePref] : null;
    const type = normType(clinic.clinic_type);
    let typeMatch = true;
    let typeExactMatch = false;
    if (wantedType && wantedType.vi !== 'Không quan trọng') {
      const wantsPublic = wantedType.vi === 'Công lập';
      typeMatch = type === (wantsPublic ? 'public' : 'private');
      typeExactMatch = typeMatch;
    }
    const serviceTags = (clinic.service || '')
      .split(/[,;]/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const selectedTopicIdx = Array.isArray(a.q8) ? a.q8 : [];
    const selectedTopics = selectedTopicIdx.map((i) => TOPICS_Q8[i]).filter(Boolean);
    const matchedTopics = selectedTopics.filter((topic) => {
      const exactTagMatch = serviceTags.includes(topic.vi.toLowerCase());
      const fuzzyMatch =
        !serviceTags.length &&
        (textIncludesAny(clinic.description, topic.kw) || textIncludesAny(clinic.target_groups, topic.kw));
      return exactTagMatch || fuzzyMatch;
    });
    const q8AllMatched = selectedTopics.length === 0 || matchedTopics.length === selectedTopics.length;

    const verified = !!(clinic.license_number && clinic.license_number.trim());

    return {
      typeMatch,
      q8AllMatched,
      q9AllMatched,
      typeExactMatch,
      matchedGroups,
      matchedTopics,
      ageMatch,
      verified,
    };
  }

  function buildExplanation(clinic, evalInfo, distanceKm) {
    const vi = state.lang === 'vi';
    const parts = [];
    const name = clinic.clinic_name;

    if (evalInfo.verified) {
      parts.push(
        vi
          ? `${name} đã được cấp Giấy phép hoạt động chính thức (${clinic.license_number})`
          : `${name} holds an officially issued operating license (${clinic.license_number})`
      );
    } else {
      parts.push(vi ? `${name}` : `${name}`);
    }

    const groupNames = [
      ...evalInfo.matchedGroups,
      ...(evalInfo.ageMatch ? [evalInfo.ageMatch] : []),
    ];
    if (groupNames.length) {
      const names = groupNames.map((g) => (vi ? g.vi : g.en).toLowerCase()).join(', ');
      parts.push(
        vi
          ? `phù hợp với nhóm đối tượng bạn cần: ${names}`
          : `is suited to the group you need support for: ${names}`
      );
    }

    if (evalInfo.typeExactMatch) {
      parts.push(
        vi ? `đúng loại hình cơ sở bạn ưu tiên` : `matches the facility type you preferred`
      );
    }

    if (evalInfo.matchedTopics.length) {
      const names = evalInfo.matchedTopics.map((t) => (vi ? t.vi : t.en).toLowerCase()).join(', ');
      parts.push(
        vi
          ? `có kinh nghiệm với các vấn đề bạn đang quan tâm: ${names}`
          : `has experience with the topics you're concerned about: ${names}`
      );
    }

    if (distanceKm != null) {
      parts.push(
        vi
          ? `cách bạn khoảng ${distanceKm.toFixed(1)} km`
          : `is about ${distanceKm.toFixed(1)} km from you`
      );
    }

    const sentence = parts.join(vi ? ', ' : ', ') + '.';
    return sentence.charAt(0).toUpperCase() + sentence.slice(1);
  }

  function computeMatches() {
    const willingToTravelFar = state.answers.q5 === 2;
    if (willingToTravelFar) {
      state.radiusKm = 0;
      const radiusSelect = $('radiusSelect');
      if (radiusSelect) radiusSelect.value = '0';
    }
    const radius = state.radiusKm;

    const evaluated = state.clinics
      .map((c) => {
        const d = state.refPoint ? haversineKm(state.refPoint, c) : null;
        const e = evaluateClinic(c);
        return { clinic: c, distanceKm: d, ...e };
      })
      .filter((m) => {
        if (radius && radius !== 0 && m.distanceKm != null && m.distanceKm > radius) return false;
        if (!m.typeMatch) return false;
        if (!m.q8AllMatched) return false;
        if (!m.q9AllMatched) return false;
        return true;
      })
      .sort((a, b) => {
        const ageA = a.ageMatch ? 1 : 0;
        const ageB = b.ageMatch ? 1 : 0;
        if (ageB !== ageA) return ageB - ageA;

        const verA = a.verified ? 1 : 0;
        const verB = b.verified ? 1 : 0;
        if (verB !== verA) return verB - verA;

        const da = a.distanceKm == null ? Infinity : a.distanceKm;
        const db = b.distanceKm == null ? Infinity : b.distanceKm;
        return da - db;
      });

    state.matches = evaluated;
    state.currentIndex = 0;
  }


  function renderHeader() {
    const vi = state.lang === 'vi';
    const n = state.matches.length;
    $('resultsHeadline').innerHTML = n
      ? (vi
          ? `Tìm thấy <b>${n}</b> cơ sở phù hợp với bạn`
          : `Found <b>${n}</b> facilities that fit you`)
      : (vi ? 'Không tìm thấy cơ sở phù hợp' : 'No matching facilities found');

    $('resultsSub').textContent = vi
      ? 'Vuốt qua từng gợi ý bên dưới hoặc xem trực tiếp vị trí trên bản đồ.'
      : 'Browse through each suggestion below or view its location on the map.';

    $('resultsCount').textContent = vi
      ? `${n} kết quả trong bán kính ${state.radiusKm === 0 ? 'không giới hạn' : state.radiusKm + ' km'}`
      : `${n} results within ${state.radiusKm === 0 ? 'unlimited radius' : state.radiusKm + ' km'}`;

    const banner = $('mockBanner');
    if (banner) banner.classList.toggle('hidden', !state.usingMock);
  }

  function renderCard() {
    const shell = $('resultsCardShell');
    const loading = $('resultsLoading');
    const empty = $('resultsEmpty');
    const card = $('resultsCard');
    loading.classList.add('hidden');

    if (!state.matches.length) {
      empty.classList.remove('hidden');
      card.classList.add('hidden');
      $('resultsProgress').textContent = '0 / 0';
      $('prevClinic').disabled = true;
      $('nextClinic').disabled = true;
      return;
    }
    empty.classList.add('hidden');
    card.classList.remove('hidden');

    const vi = state.lang === 'vi';
    const m = state.matches[state.currentIndex];
    const c = m.clinic;
    const type = normType(c.clinic_type);

    const tag = $('rcTypeTag');
    tag.dataset.type = type;
    tag.textContent = c.clinic_type || (vi ? 'Không rõ' : 'Unknown');

    $('rcName').textContent = c.clinic_name || '—';
    $('rcVerifiedBadge').classList.toggle('hidden', !m.verified);

    $('rcAddress').textContent = c.address || c.old_address || '—';
    $('rcDistance').textContent =
      m.distanceKm != null
        ? (vi ? `Cách bạn ~ ${m.distanceKm.toFixed(1)} km` : `~ ${m.distanceKm.toFixed(1)} km away`)
        : (vi ? 'Không xác định được khoảng cách' : 'Distance unavailable');

    const directionsBtn = $('rcDirections');
    const hasDirectionsLink = !!(c.ggmaps_link && c.ggmaps_link.trim());
    directionsBtn.classList.toggle('hidden', !hasDirectionsLink);
    if (hasDirectionsLink) {
      directionsBtn.href = c.ggmaps_link.trim();
    }

    $('rcPhone').textContent = c.phone || '—';
    $('rcHours').textContent = c.operating_hours || '—';
    $('rcPricing').textContent = (c.price && c.price.trim()) || c.pricing || '—';
    const webEl = $('rcWebsite');
    if (c.website) {
      webEl.href = c.website;
      webEl.textContent = c.website.replace(/^https?:\/\//, '');
    } else {
      webEl.removeAttribute('href');
      webEl.textContent = '—';
    }

    $('rcDesc').textContent = c.description || '';

    const chipsWrap = $('rcTargetGroups');
    chipsWrap.innerHTML = '';
    const matchedLabels = new Set(
      [...m.matchedTopics, ...m.matchedGroups].map((x) => (vi ? x.vi : x.en))
    );
    (c.target_groups || '')
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((label) => {
        const chip = document.createElement('span');
        chip.className = 'rc-chip';
        if ([...matchedLabels].some((ml) => label.toLowerCase().includes(ml.toLowerCase().slice(0, 6)))) {
          chip.classList.add('matched');
        }
        chip.textContent = label;
        chipsWrap.appendChild(chip);
      });

    $('rcLicense').innerHTML = m.verified
      ? (vi
          ? `<b>GPHĐ:</b> ${c.license_number}${c.license_issue_date ? ' · cấp ngày ' + c.license_issue_date : ''}`
          : `<b>License:</b> ${c.license_number}${c.license_issue_date ? ' · issued ' + c.license_issue_date : ''}`)
      : (vi ? 'Chưa có thông tin GPHĐ được xác nhận.' : 'No verified license information yet.');

    $('rcAiExplain').textContent = buildExplanation(c, m, m.distanceKm);

    $('resultsProgress').textContent = `${state.currentIndex + 1} / ${state.matches.length}`;
    $('prevClinic').disabled = state.currentIndex === 0;
    $('nextClinic').disabled = state.currentIndex === state.matches.length - 1;

    highlightMarker(c.id);
  }

  // --- Tile layer: primary = OpenStreetMap, fallback = CartoDB Voyager ---
  // If the OSM tile hostnames can't be resolved (DNS/network block) or tiles
  // otherwise fail to load, swap to a different tile provider automatically
  // instead of leaving the map blank.
  const MAPTILER_KEY = '4ryegTLnvRGlcrr8Phnu';

const TILE_PROVIDERS = [
  {
    // MapTiler — thay OpenStreetMap
    url: `https://api.maptiler.com/maps/base-v4/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`,
    options: {
      attribution:
        '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 20,
      tileSize: 512,   // MapTiler trả tile 512px, bắt buộc phải set
      zoomOffset: -1,  // bù lại cho tileSize 512 để không bị lệch vị trí
    },
  },
  {
    // Dự phòng nếu MapTiler lỗi (hết quota, mất mạng...)
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    options: {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    },
  },
];

function addResilientTileLayer(map) {
  let providerIndex = 0;
  let switched = false;
  let tileErrorCount = 0;
  const ERROR_THRESHOLD = 3;

  function attach(idx) {
    const provider = TILE_PROVIDERS[idx];
    const layer = L.tileLayer(provider.url, provider.options);
    layer.on('tileerror', () => {
      tileErrorCount++;
      if (!switched && tileErrorCount >= ERROR_THRESHOLD && idx + 1 < TILE_PROVIDERS.length) {
        switched = true;
        console.warn(`Nhiều tile bị lỗi từ provider #${idx} — chuyển sang provider dự phòng.`);
        map.removeLayer(layer);
        attach(idx + 1);
      }
    });
    layer.addTo(map);
  }

  attach(providerIndex);
}

  function initMap() {
    state.map = L.map('resultsMap', { scrollWheelZoom: true }).setView(
      [state.refPoint?.lat || FALLBACK_CENTER.lat, state.refPoint?.lng || FALLBACK_CENTER.lng],
      13
    );

    addResilientTileLayer(state.map);

    if (state.refPoint) {
      L.circleMarker([state.refPoint.lat, state.refPoint.lng], {
        radius: 7,
        color: '#4A3B52',
        fillColor: '#4A3B52',
        fillOpacity: 0.9,
        weight: 2,
      })
        .addTo(state.map)
        .bindPopup(state.lang === 'vi' ? 'Vị trí của bạn' : 'Your location');
    }
  }

  function buildMarkerIcon(clinic, active) {
    const type = normType(clinic.clinic_type);
    const pinClass = type === 'public' ? 'pin-public' : type === 'community' ? 'pin-community' : 'pin-private';
    const verified = !!(clinic.license_number && clinic.license_number.trim());
    const html = `
      <div class="rm-pin ${pinClass} ${active ? 'pin-active' : ''}" style="position:relative;">
        <i class="fa-solid fa-brain rm-pin-icon"></i>
        ${verified ? '<span class="rm-verified-badge"><i class="fa-solid fa-check"></i></span>' : ''}
      </div>`;
    return L.divIcon({ html, className: '', iconSize: [30, 30], iconAnchor: [15, 30] });
  }

  function renderMarkers() {
    Object.values(state.markers).forEach((mk) => state.map.removeLayer(mk));
    state.markers = {};

    state.matches.forEach((m, idx) => {
      const c = m.clinic;
      if (c.latitude == null || c.longitude == null) return;
      const hasDirectionsLink = !!(c.ggmaps_link && c.ggmaps_link.trim());
      const directionsLine = hasDirectionsLink
        ? `<br><a href="${c.ggmaps_link.trim()}" target="_blank" rel="noopener noreferrer">${state.lang === 'vi' ? 'Chỉ đường →' : 'Directions →'}</a>`
        : '';
      const marker = L.marker([c.latitude, c.longitude], { icon: buildMarkerIcon(c, idx === state.currentIndex) })
        .addTo(state.map)
        .bindPopup(
          `<div class="rm-popup"><b>${c.clinic_name}</b><br>${c.address || ''}${directionsLine}</div>`
        );
      marker.on('click', () => {
        state.currentIndex = idx;
        renderCard();
      });
      state.markers[c.id] = marker;
    });
  }

  function highlightMarker(clinicId) {
    Object.entries(state.markers).forEach(([id, marker]) => {
      const c = state.matches.find((m) => String(m.clinic.id) === String(id));
      if (!c) return;
      marker.setIcon(buildMarkerIcon(c.clinic, String(id) === String(clinicId)));
    });
    const active = state.markers[clinicId];
    if (active && state.map) {
      state.map.flyTo(active.getLatLng(), 15, { duration: 0.6 });
      active.openPopup();
    }
  }

  function goPrev() {
    if (state.currentIndex > 0) {
      state.currentIndex--;
      renderCard();
    }
  }
  function goNext() {
    if (state.currentIndex < state.matches.length - 1) {
      state.currentIndex++;
      renderCard();
    }
  }

  function setLang(lang) {
    state.lang = lang;
    document.body.setAttribute('data-lang', lang);
    $('viBtn').classList.toggle('active', lang === 'vi');
    $('enBtn').classList.toggle('active', lang === 'en');
    renderHeader();
    if (state.matches.length) renderCard();
  }

  async function init() {
    if (!loadWizardData()) return;

    $('backHomeBtn').addEventListener('click', () => (window.location.href = '../app/index.html'));
    $('viBtn').addEventListener('click', () => setLang('vi'));
    $('enBtn').addEventListener('click', () => setLang('en'));
    $('prevClinic').addEventListener('click', goPrev);
    $('nextClinic').addEventListener('click', goNext);

    const radiusSelect = $('radiusSelect');
    const willingToTravelFar = state.answers.q5 === 2;
    if (willingToTravelFar) {
      radiusSelect.value = '0';
      radiusSelect.disabled = true;
      state.radiusKm = 0;
    } else {
      const q5b = state.answers.q5b;
      const suggested = q5b !== undefined ? MINUTES_TO_KM[q5b] : DEFAULT_RADIUS_KM;
      radiusSelect.value = String(suggested ?? DEFAULT_RADIUS_KM);
      state.radiusKm = Number(radiusSelect.value);
    }
    radiusSelect.addEventListener('change', () => {
      state.radiusKm = Number(radiusSelect.value);
      computeMatches();
      renderHeader();
      renderCard();
      renderMarkers();
    });

    const [refPoint, clinics] = await Promise.all([getReferencePoint(), loadClinics()]);
    state.refPoint = refPoint;
    state.clinics = clinics;

    computeMatches();
    initMap();
    renderMarkers();
    renderHeader();
    renderCard();
  }

  document.addEventListener('DOMContentLoaded', init);
})();

