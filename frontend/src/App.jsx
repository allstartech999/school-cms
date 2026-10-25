import { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Phone, 
  Eye, 
  Calendar, 
  Search, 
  ArrowRight, 
  Clock, 
  MapPin, 
  Mail, 
  Sparkles,
  Award,
  ExternalLink,
  Users,
  Building2,
  FileText,
  Compass,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  ArrowUpRight,
  UserCheck,
  Lock,
  LayoutDashboard,
  Share2,
  Check
} from 'lucide-react';
import { fetchPosts, fetchPost, fetchStats, fetchHomepageConfig, fetchMenu, fetchPage, fetchCategories } from './api';
import BlockRenderer from './components/BlockRenderer';
import PostContent from './components/PostContent';
import OptimizedImage from './components/OptimizedImage';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import { useAdaptive } from './context/AdaptiveContext';
import AdaptiveBottomNav from './components/adaptive/AdaptiveBottomNav';
import AdaptiveModeSwitcher from './components/adaptive/AdaptiveModeSwitcher';
import { NewsCardSkeleton, PostDetailSkeleton, DynamicPageSkeleton } from './components/skeleton';

export default function App() {
  const { isMobile, isTablet, isForcedDesktop, isForcedMobile, setMode } = useAdaptive();
  const showMobileNav = (isMobile || isTablet) && !isForcedDesktop;
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'about' | 'eservice' | 'news' | 'contact' | 'dynamic_page'
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [stats, setStats] = useState({
    school_name: "โรงเรียนโพนงามพิทยานุกูล",
    school_name_en: "Phon-ngam Pittayanukun School",
    school_subtitle: "สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม",
    logo_url: "/uploads/2026/10/1792825601083477305-ai.png",
    favicon_url: "/uploads/2026/10/1792825601083477305-ai.png",
    total_posts: 0,
    total_pages: 0
  });
  const [homepageConfig, setHomepageConfig] = useState(() => {
    try {
      const cached = localStorage.getItem('ppk_homepage_config');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.hero) return parsed;
      }
    } catch (_) {}
    return {
      hero: {
        badge: "โรงเรียนคุณภาพมาตรฐานสากล • สพม.มหาสารคาม",
        heading: "โรงเรียนโพนงามพิทยานุกูล",
        subheading: "“ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์”\nเป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ",
        primary_cta: "บริการออนไลน์ (E-Service)",
        primary_url: "eservice",
        image_url: "https://www.ppks.ac.th/wp-content/uploads/2023/09/www.ppks.ac.th-img20191029155618-768x576.jpg"
      },
      announcement: "ขอเชิญชวนศิษย์เก่าทุกท่านร่วมลงทะเบียนเครือข่ายศิษย์เก่าออนไลน์ (PPK Alumni) เพื่อร่วมพัฒนาโรงเรียน",
      show_ticker: true,
      show_slider: true,
      show_eservices: true,
      show_recent_news: true,
      show_trending: true
    };
  });
  const [menuItems, setMenuItems] = useState([]);
  const [activeDynamicPage, setActiveDynamicPage] = useState(null);
  const [loadingDynamicPage, setLoadingDynamicPage] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [newsCurrentPage, setNewsCurrentPage] = useState(1);
  const postsPerPage = 9;
  const [readingPost, setReadingPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [facultyCategoryFilter, setFacultyCategoryFilter] = useState('all'); // 'all' | 'teacher' | 'staff'

  // Admin Auth States
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('school_admin_token') || '');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => !!localStorage.getItem('school_admin_token'));
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Categories list (Dynamic)
  const [categoryList, setCategoryList] = useState(['วิชาการ', 'กิจกรรม', 'ประชาสัมพันธ์', 'ทั่วไป']);
  const categories = ['ทั้งหมด', ...categoryList];

  const handleAdminLoginSuccess = (token, mustChange = false) => {
    setAdminToken(token);
    setIsAdminLoggedIn(true);
    setMustChangePassword(mustChange);
    setShowAdminLoginModal(false);
    setCurrentPage('admin');
    window.location.hash = 'admin';
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('school_admin_token');
    localStorage.removeItem('school_admin_user');
    setAdminToken('');
    setIsAdminLoggedIn(false);
    navigateTo('home');
  };

  const [copiedLink, setCopiedLink] = useState(false);

  const loadDynamicPage = async (slug, updateHistory = false) => {
    setLoadingDynamicPage(true);
    setCurrentPage('dynamic_page');
    setReadingPost(null);
    if (updateHistory && window.history && window.history.pushState) {
      window.history.pushState(null, '', `/pages/${slug}`);
    }
    try {
      const pageData = await fetchPage(slug);
      setActiveDynamicPage(pageData);
    } catch (err) {
      console.error('Failed to load dynamic page:', err);
      setActiveDynamicPage(null);
    } finally {
      setLoadingDynamicPage(false);
    }
  };

  const openPostByIdOrSlug = async (idOrSlug) => {
    setLoadingPost(true);
    setCurrentPage('news');
    setActiveDynamicPage(null);
    try {
      const fullPost = await fetchPost(idOrSlug);
      setReadingPost(fullPost);
    } catch (err) {
      console.error('Failed to load post by URL:', err);
    } finally {
      setLoadingPost(false);
    }
  };

  // Sync routing: support both clean pathnames (/posts/:id, /pages/:slug) and hash routes (#page/...)
  useEffect(() => {
    const handleLocationChange = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash.replace('#', '');

      // 1. Direct post URL: /posts/:id or /post/:id or #post/:id
      if (pathname.startsWith('/posts/') || pathname.startsWith('/post/') || hash.startsWith('post/')) {
        let identifier = '';
        if (hash.startsWith('post/')) {
          identifier = hash.replace(/^post\//, '');
        } else if (pathname.startsWith('/posts/')) {
          identifier = pathname.replace(/^\/posts\//, '');
        } else {
          identifier = pathname.replace(/^\/post\//, '');
        }
        identifier = identifier.split('/')[0].split('?')[0];
        if (identifier) {
          openPostByIdOrSlug(identifier);
          return;
        }
      }

      // 2. Direct dynamic page URL: /pages/:slug or /page/:slug or #page/:slug
      if (pathname.startsWith('/pages/') || pathname.startsWith('/page/') || hash.startsWith('page/')) {
        let slug = '';
        if (hash.startsWith('page/')) {
          slug = hash.replace(/^page\//, '');
        } else if (pathname.startsWith('/pages/')) {
          slug = pathname.replace(/^\/pages\//, '');
        } else {
          slug = pathname.replace(/^\/page\//, '');
        }
        slug = slug.split('/')[0].split('?')[0];
        if (slug) {
          loadDynamicPage(slug);
          return;
        }
      }

      if (pathname === '/basic-info' || hash === 'basic-info') {
        loadDynamicPage('basic-info');
        return;
      }

      if (pathname === '/history' || pathname === '/history-vision' || hash === 'history' || hash === 'history-vision') {
        setCurrentPage('history');
        setActiveDynamicPage(null);
        setReadingPost(null);
        return;
      }

      if (pathname === '/admin' || hash === 'admin' || hash === 'login') {
        const token = localStorage.getItem('school_admin_token');
        if (token) {
          setIsAdminLoggedIn(true);
          setAdminToken(token);
          setCurrentPage('admin');
          setActiveDynamicPage(null);
          setReadingPost(null);
        } else {
          setShowAdminLoginModal(true);
        }
        return;
      }

      const cleanPath = pathname.replace(/^\//, '');
      if (cleanPath === '' || cleanPath === 'home' || (!cleanPath && !hash) || hash === 'home') {
        setCurrentPage('home');
        setActiveDynamicPage(null);
        setReadingPost(null);
        return;
      }

      const knownSections = ['about', 'eservice', 'news', 'contact'];
      if (knownSections.includes(cleanPath)) {
        setCurrentPage(cleanPath);
        setActiveDynamicPage(null);
        setReadingPost(null);
        return;
      }
      if (knownSections.includes(hash)) {
        setCurrentPage(hash);
        setActiveDynamicPage(null);
        setReadingPost(null);
        return;
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (target) => {
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!target) return;
    if (target === 'admin' || target === '/admin' || target === 'login') {
      const token = localStorage.getItem('school_admin_token');
      if (token) {
        setIsAdminLoggedIn(true);
        setAdminToken(token);
        setCurrentPage('admin');
        if (window.history && window.history.pushState) {
          window.history.pushState(null, '', '/admin');
        }
        setActiveDynamicPage(null);
        setReadingPost(null);
      } else {
        setShowAdminLoginModal(true);
      }
      return;
    }

    if (target.startsWith('/page/') || target.startsWith('page/') || target.startsWith('/pages/') || target.startsWith('pages/')) {
      const slug = target.replace(/^\/?(pages|page)\//, '');
      loadDynamicPage(slug, true);
    } else if (target === 'basic-info' || target === '/basic-info') {
      loadDynamicPage('basic-info', true);
    } else if (target === 'history' || target === '/history' || target === 'history-vision' || target === '/history-vision') {
      setCurrentPage('history');
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', '/history');
      }
      setActiveDynamicPage(null);
      setReadingPost(null);
    } else if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, '_blank');
    } else {
      const cleanRoute = target.replace(/^#/, '').replace(/^\//, '');
      setCurrentPage(cleanRoute);
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', cleanRoute === 'home' ? '/' : `/${cleanRoute}`);
      }
      setActiveDynamicPage(null);
      setReadingPost(null);
    }
  };

  // E-Services data from ppks.ac.th with REAL banner assets
  const eServices = [
    {
      id: 'alumni',
      title: 'ระบบทำเนียบศิษย์เก่า (PPK Alumni)',
      category: 'ศิษย์เก่า & ชุมชน',
      desc: 'ระบบเครือข่ายและฐานข้อมูลศิษย์เก่าโรงเรียนโพนงามพิทยานุกูลทุกรุ่น เพื่อการติดต่อสื่อสารและร่วมพัฒนาโรงเรียน',
      url: 'https://alumni.ppks.ac.th/',
      image: '/images/banner-alumni.png',
      manualUrl: 'https://www.ppks.ac.th/%e0%b8%84%e0%b8%b9%e0%b9%88%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%81%e0%b8%b2%e0%b8%a3%e0%b9%83%e0%b8%8a%e0%b9%89%e0%b8%87%e0%b8%b2%e0%b8%99-%e0%b8%a3%e0%b8%b0%e0%b8%9a%e0%b8%9a%e0%b8%97%e0%b8%b3',
      badge: 'เครือข่ายศิษย์เก่า'
    },
    {
      id: 'sgs',
      title: 'ระบบประเมินผลการเรียนออนไลน์ (SGS)',
      category: 'นักเรียน / ครู / ผู้ปกครอง',
      desc: 'Secondary Grading System ระบบประเมินผลการเรียนออนไลน์ ตรวจสอบผลการเรียนและบันทึกคะแนน สพฐ.',
      url: 'https://sgs.bopp-obec.info/',
      image: '/images/banner-sgs.png',
      manualUrl: 'https://sgs.bopp-obec.info/Data/Manual.zip',
      badge: 'สพฐ. OBEC'
    },
    {
      id: 'semarak',
      title: 'ตู้เสมารักษ์ (รับเรื่องร้องเรียนออนไลน์)',
      category: 'บริการประชาชน & ITA',
      desc: 'ช่องทางอิเล็กทรอนิกส์สำหรับนักเรียน ผู้ปกครอง และประชาชนในการส่งข้อเสนอแนะ ร้องเรียน หรือสอบถามข้อมูลอย่างโปร่งใส',
      url: 'https://www.ppks.ac.th/?page_id=768',
      image: '/images/banner-semarak.png',
      manualUrl: 'https://www.ppks.ac.th/%e0%b8%84%e0%b8%b9%e0%b9%88%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%81%e0%b8%b2%e0%b8%a3%e0%b9%83%e0%b8%8a%e0%b9%89%e0%b8%87%e0%b8%b2%e0%b8%99-%e0%b8%95%e0%b8%b9%e0%b9%89%e0%b9%80%e0%b8%aa%e0%b8%a1',
      badge: 'ITA โปร่งใส'
    },
    {
      id: 'pp5',
      title: 'ระบบ ปพ.5 ออนไลน์ (PP5 Online)',
      category: 'ครูและบุคลากร',
      desc: 'ระบบบันทึกและประเมินผลการพัฒนาคุณภาพผู้เรียน เอกสาร ปพ.5 ออนไลน์ ประจำชั้นเรียน',
      url: 'https://pp5.ppks.ac.th/',
      image: '/images/banner-pp5.jpg',
      manualUrl: null,
      badge: 'ระบบภายในสถานศึกษา'
    },
    {
      id: 'pp1',
      title: 'ระบบ ปพ.1 ออนไลน์ (PP1 Online)',
      category: 'งานทะเบียนและวัดผล',
      desc: 'ระบบบริหารจัดการและจัดทำระเบียนแสดงผลการเรียน ปพ.1 และการออกหลักฐานทางการศึกษา',
      url: 'https://pp1.ppks.ac.th',
      image: '/images/banner-pp1.jpg',
      manualUrl: null,
      badge: 'งานทะเบียนวัดผล'
    },
    {
      id: 'pisa',
      title: 'ระบบเตรียมความพร้อม PISA สพฐ.',
      category: 'วิชาการ & นักเรียน',
      desc: 'ระบบส่งเสริมและประเมินสมรรถนะความฉลาดรู้ PISA สำหรับนักเรียนมัธยมศึกษา สพม.มหาสารคาม',
      url: 'https://pisa.ppks.ac.th/',
      image: '/images/artboard-1.png',
      manualUrl: null,
      badge: 'สมรรถนะสากล'
    }
  ];



  // Administration list with REAL photos & structured duties
  const administrators = [
    {
      name: 'นายดนุพล คำชมภู',
      role: 'หัวหน้ากลุ่มบริหารงานวิชาการ',
      position: 'ครูชำนาญการ',
      photo: '/uploads/2026/10/1792825707114914547-ai.jfif',
      group: 'กลุ่มบริหารงานวิชาการ',
      badge: 'ฝ่ายวิชาการ',
      duties: [
        'หลักสูตรต้านทุจริตศึกษา',
        'Active Learning & นวัตกรรมการสอน',
        'งานวัดผล ประเมินผล และทะเบียน',
        'การประเมินสมรรถนะความฉลาดรู้ PISA'
      ]
    },
    {
      name: 'นางสุปราณี อันทรินทร์',
      role: 'หัวหน้ากลุ่มบริหารงานบุคคล',
      position: 'ครูชำนาญการ',
      photo: '/uploads/2026/10/1792825718445051488-ai.jfif',
      group: 'กลุ่มบริหารงานบุคคล',
      badge: 'ฝ่ายบุคคล',
      duties: [
        'วินัยและการรักษาวินัยครูและบุคลากร',
        'การพัฒนาข้าราชการครูสู่ความเป็นเลิศ',
        'ระบบดูแลช่วยเหลือนักเรียนรอบด้าน',
        'กิจการนักเรียนและส่งเสริมประชาธิปไตย'
      ]
    },
    {
      name: 'น.ส. สุดารัตน์ กองเพชร',
      role: 'หัวหน้ากลุ่มบริหารงบประมาณ',
      position: 'ครูชำนาญการ',
      photo: '/uploads/2026/10/1792825719567880192-ai.jfif',
      group: 'กลุ่มบริหารงบประมาณ',
      badge: 'ฝ่ายงบประมาณ',
      duties: [
        'งานแผนงานและงบประมาณสถานศึกษา',
        'งานการเงินและบัญชีโปร่งใส ตรวจสอบได้',
        'งานพัสดุ สินทรัพย์ และอาคารสถานที่',
        'การประเมินคุณธรรมและความโปร่งใส ITA'
      ]
    },
    {
      name: 'นายณรงค์ศักดิ์ บัวลาด',
      role: 'หัวหน้ากลุ่มบริหารทั่วไป',
      position: 'ครูชำนาญการ',
      photo: '/uploads/2026/10/1792825719806958850-ai.jfif',
      group: 'กลุ่มบริหารงานทั่วไป',
      badge: 'ฝ่ายทั่วไป',
      duties: [
        'งานอาคารสถานที่และสิ่งแวดล้อม 32 ไร่',
        'งานสารบรรณและธุรการสถานศึกษา',
        'การสร้างความสัมพันธ์กับชุมชนตำบลโพนงาม',
        'ระบบสารสนเทศและการสื่อสารสถานศึกษา'
      ]
    },
  ];

  // Teachers and Staff with REAL photos and department categorization
  const teachers = [
    { 
      name: 'นางสดชื่น ดวงคำน้อย', 
      position: 'ครูชำนาญการพิเศษ', 
      department: 'กลุ่มสาระการเรียนรู้ภาษาไทย', 
      subject: 'กลุ่มสาระภาษาไทย',
      category: 'teacher',
      photo: '/uploads/2026/10/1792825720045790953-ai.jfif' 
    },
    { 
      name: 'นายยธิน อสุริยิน', 
      position: 'ครูชำนาญการ', 
      department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์', 
      subject: 'กลุ่มสาระคณิตศาสตร์',
      category: 'teacher',
      photo: '/uploads/2026/10/1792825720240762293-ai.jfif' 
    },
    { 
      name: 'นายปรมินทร์ อัตตะเนย์', 
      position: 'ครูชำนาญการ', 
      department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี', 
      subject: 'กลุ่มสาระวิทยาศาสตร์ฯ',
      category: 'teacher',
      photo: '/uploads/2026/10/1792825720471807597-ai.jfif' 
    },
    { 
      name: 'นางสาวพัชรินทร์ โมหา', 
      position: 'ครู ค.ศ.1', 
      department: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ', 
      subject: 'กลุ่มสาระภาษาต่างประเทศ',
      category: 'teacher',
      photo: '/uploads/2026/10/1792825721062810425-ai.jfif' 
    },
    { 
      name: 'นายเกียรติยศ ชมเชย', 
      position: 'ครูผู้ช่วย', 
      department: 'กลุ่มสาระการเรียนรู้สังคมศึกษาฯ', 
      subject: 'กลุ่มสาระสังคมศึกษาฯ',
      category: 'teacher',
      photo: '/uploads/2026/10/1792825721246164453-ai.jfif' 
    },
    { 
      name: 'นายทินกร นิลพุฒ', 
      position: 'พนักงานราชการ', 
      department: 'กลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา', 
      subject: 'กลุ่มสาระสุขศึกษาและพลศึกษา',
      category: 'teacher',
      photo: '/uploads/2026/10/1792825721472141397-ai.jfif' 
    },
    { 
      name: 'นางสาวอโนทัย พึ่งเปี่ยม', 
      position: 'ครูอัตราจ้าง', 
      department: 'กลุ่มสาระการเรียนรู้ศิลปะและการงานอาชีพ', 
      subject: 'กลุ่มสาระศิลปะ & การงานฯ',
      category: 'teacher',
      photo: '/uploads/2026/10/1792825721696068022-ai.jfif' 
    },
    { 
      name: 'นายบุญเรือง ดวงสุฤทธิ์', 
      position: 'นักการภารโรง', 
      department: 'ฝ่ายบริการและสนับสนุนการศึกษา', 
      subject: 'บริการ อาคารสถานที่ และยานพาหนะ',
      category: 'staff',
      photo: '/uploads/2026/10/1792825721899201512-ai.jfif' 
    },
  ];

  // Load initial data from backend if available
  useEffect(() => {
    Promise.all([
      fetchPosts({ limit: 50 }).catch(() => null),
      fetchStats().catch(() => null),
      fetchHomepageConfig().catch(() => null),
      fetchMenu().catch(() => null),
      fetchCategories().catch(() => null)
    ])
      .then(([postsData, statsData, hpCfg, menuData, categoriesData]) => {
        if (Array.isArray(postsData)) {
          setPosts(postsData);
        } else if (postsData && Array.isArray(postsData.data)) {
          setPosts(postsData.data);
        }
        if (statsData) {
          setStats(statsData);
        }
        if (hpCfg) {
          setHomepageConfig(prev => ({ ...prev, ...hpCfg }));
          try {
            localStorage.setItem('ppk_homepage_config', JSON.stringify(hpCfg));
          } catch (_) {}
        }
        if (Array.isArray(menuData) && menuData.length > 0) {
          setMenuItems(menuData);
        }
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          setCategoryList(categoriesData.map(c => c.name));
        }
      })
      .catch(err => {
        console.error('Error fetching data:', err);
      })
      .finally(() => {
        setLoadingPosts(false);
        setInitialLoading(false);
      });
  }, []);

  const handleClosePost = () => {
    setReadingPost(null);
    setLoadingPost(false);
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path.startsWith('/posts/') || path.startsWith('/post/') || hash.startsWith('#post/')) {
      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', currentPage === 'news' ? '/news' : '/');
      }
    }
  };

  const handleCopyPostLink = (post) => {
    const targetUrl = `${window.location.origin}/posts/${post?.id || post?.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    }
  };

  // Dynamic Favicon and Document Title & SEO tags sync
  useEffect(() => {
    const faviconUrl = stats?.favicon_url || stats?.logo_url || '/uploads/2026/10/1792825601083477305-ai.png';
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = faviconUrl;

    const schoolName = stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล';
    let title = stats?.seo_title || `${schoolName} – ${stats?.school_subtitle || 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม'}`;
    let canonical = window.location.origin + '/';
    let description = stats?.seo_description || stats?.school_subtitle || 'เว็บไซต์อย่างเป็นทางการของโรงเรียนโพนงามพิทยานุกูล';

    if (readingPost) {
      title = `${readingPost.title} | ${schoolName}`;
      canonical = `${window.location.origin}/posts/${readingPost.id}`;
      if (readingPost.summary) {
        description = readingPost.summary;
      } else if (readingPost.content) {
        description = readingPost.content.replace(/<[^>]*>/g, ' ').trim().slice(0, 160);
      }
    } else if (activeDynamicPage) {
      title = `${activeDynamicPage.title} | ${schoolName}`;
      canonical = `${window.location.origin}/pages/${activeDynamicPage.slug}`;
      if (activeDynamicPage.content) {
        description = activeDynamicPage.content.replace(/<[^>]*>/g, ' ').trim().slice(0, 160);
      }
    } else if (currentPage === 'about') {
      title = `เกี่ยวกับโรงเรียน | ${schoolName}`;
      canonical = `${window.location.origin}/about`;
    } else if (currentPage === 'history') {
      title = `ประวัติความเป็นมาและวิสัยทัศน์ | ${schoolName}`;
      canonical = `${window.location.origin}/history`;
    } else if (currentPage === 'news') {
      title = `ข่าวสารและกิจกรรม | ${schoolName}`;
      canonical = `${window.location.origin}/news`;
    } else if (currentPage === 'eservice') {
      title = `ระบบบริการออนไลน์ (E-Service) | ${schoolName}`;
      canonical = `${window.location.origin}/eservice`;
    } else if (currentPage === 'contact') {
      title = `ติดต่อเรา | ${schoolName}`;
      canonical = `${window.location.origin}/contact`;
    }

    document.title = title;

    // Canonical Link
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonical);

    // Meta Description
    let metaDescEl = document.querySelector('meta[name="description"]');
    if (!metaDescEl) {
      metaDescEl = document.createElement('meta');
      metaDescEl.setAttribute('name', 'description');
      document.head.appendChild(metaDescEl);
    }
    metaDescEl.setAttribute('content', description);

    // Open Graph dynamic tags sync
    const ogTitleEl = document.querySelector('meta[property="og:title"]');
    if (ogTitleEl) ogTitleEl.setAttribute('content', title);
    const ogDescEl = document.querySelector('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.setAttribute('content', description);
    const ogUrlEl = document.querySelector('meta[property="og:url"]');
    if (ogUrlEl) ogUrlEl.setAttribute('content', canonical);
  }, [stats?.favicon_url, stats?.logo_url, stats?.school_name, stats?.school_subtitle, stats?.seo_title, stats?.seo_description, readingPost, activeDynamicPage, currentPage]);

  // Keyboard shortcut: ESC to close reading modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClosePost();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  // Filtered posts
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'ทั้งหมด' || post.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Reset pagination when filter changes
  useEffect(() => {
    setNewsCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  const totalNewsPages = Math.ceil(filteredPosts.length / postsPerPage) || 1;
  const paginatedPosts = filteredPosts.slice(
    (newsCurrentPage - 1) * postsPerPage,
    newsCurrentPage * postsPerPage
  );

  const handleOpenPost = async (post) => {
    setLoadingPost(true);
    setReadingPost(post);
    if (window.history && window.history.pushState) {
      window.history.pushState({ postId: post.id }, '', `/posts/${post.id}`);
    }
    try {
      const fullPost = await fetchPost(post.id || post.slug);
      setReadingPost(fullPost);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views: (p.views || 0) + 1 } : p));
    } catch (err) {
      console.error('Error opening post:', err);
    } finally {
      setLoadingPost(false);
    }
  };

  const formatThaiDate = (dateString) => {
    if (!dateString) return 'เร็วๆ นี้';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  if (currentPage === 'admin') {
    if (!isAdminLoggedIn) {
      return (
        <AdminLogin
          onClose={() => navigateTo('home')}
          onLoginSuccess={handleAdminLoginSuccess}
          schoolInfo={stats}
        />
      );
    }

    const adminContent = (
      <div className={`flex flex-col flex-1 ${isForcedDesktop ? 'w-[1200px] min-w-[1200px] mx-auto' : 'w-full'}`}>
        <AdminDashboard
          onLogout={handleAdminLogout}
          onViewSite={() => {
            setLoadingPosts(true);
            fetchCategories().then(c => { if (Array.isArray(c) && c.length > 0) setCategoryList(c.map(x => x.name)); }).catch(() => {});
            fetchPosts({ limit: 50 }).then(p => { 
              if (Array.isArray(p)) setPosts(p); 
              else if (p && Array.isArray(p.data)) setPosts(p.data); 
            }).catch(() => {}).finally(() => {
              setLoadingPosts(false);
            });
            navigateTo('home');
          }}
          token={adminToken}
          initialMustChangePassword={mustChangePassword}
        />
        <AdaptiveBottomNav
          menuItems={menuItems}
          currentPage={currentPage}
          activeDynamicPage={activeDynamicPage}
          onNavigate={navigateTo}
          isAdminLoggedIn={isAdminLoggedIn}
          newsCount={posts?.length || 0}
        />
      </div>
    );

    if (isForcedMobile) {
      return (
        <div className="min-h-screen bg-slate-900/10 py-6 px-3 flex flex-col items-center justify-start overflow-y-auto selection:bg-[#D1FAE5] selection:text-[#065F46]">
          <div className="w-full max-w-[430px] mb-3 bg-emerald-950 text-emerald-100 text-xs py-2 px-4 rounded-2xl flex items-center justify-between shadow-md border border-emerald-800/80">
            <div className="flex items-center gap-2">
              <span>📱</span>
              <span className="font-semibold">จำลอง "มุมมองมือถือ (Mobile View)"</span>
            </div>
            <button
              onClick={() => setMode('auto')}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer border border-emerald-500/50"
            >
              กลับสู่โหมดอัตโนมัติ
            </button>
          </div>
          <div className="w-full max-w-[430px] min-h-[90vh] bg-[#F4F8F5] text-[#334155] rounded-3xl shadow-2xl border border-slate-300/80 overflow-hidden relative flex flex-col">
            {adminContent}
          </div>
          <AdaptiveModeSwitcher />
        </div>
      );
    }

    if (isForcedDesktop) {
      return (
        <div className="min-h-screen bg-slate-900/5 overflow-x-auto selection:bg-[#D1FAE5] selection:text-[#065F46]">
          <div className="w-[1200px] min-w-[1200px] mx-auto min-h-screen bg-[#F4F8F5] text-[#334155] flex flex-col shadow-xl">
            {adminContent}
          </div>
          <AdaptiveModeSwitcher />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F4F8F5] text-[#334155] flex flex-col font-sans selection:bg-[#D1FAE5] selection:text-[#065F46]">
        {adminContent}
        <AdaptiveModeSwitcher />
      </div>
    );
  }

  const appContent = (
    <div className={`flex flex-col flex-1 ${isForcedDesktop ? 'w-[1200px] min-w-[1200px] mx-auto' : 'w-full'}`}>
      {/* Top Initial Loading Progress Bar */}
      {initialLoading && (
        <div className="fixed top-0 left-0 right-0 h-0.5 z-[100] overflow-hidden bg-emerald-100">
          <div className="h-full w-full skeleton-strip-emerald" />
        </div>
      )}

      {/* Forced Desktop Mode Notification Banner */}
      {isForcedDesktop && (
        <div className="bg-emerald-950 text-emerald-100 text-xs py-2 px-4 border-b border-emerald-800 sticky top-0 z-[70] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span>💻</span>
            <span className="font-semibold">กำลังแสดงผลใน "มุมมองเดสก์ท็อป (Desktop View 1,200px)"</span>
            <span className="text-emerald-300/80 text-[11px] hidden sm:inline">• เลื่อนแนวนอนเพื่อดูข้อมูลเต็มจอ</span>
          </div>
          <button
            onClick={() => setMode('auto')}
            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 border border-emerald-500/50"
          >
            กลับสู่โหมดอัตโนมัติ
          </button>
        </div>
      )}

      {/* Admin Floating / Sticky Top Bar when logged in */}
      {isAdminLoggedIn && (
        <div className="bg-emerald-950 text-white text-xs px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between border-b border-emerald-800/80 sticky top-0 z-[60] shadow-sm gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-emerald-300 truncate text-[11px] sm:text-xs">
              <span className="hidden xs:inline">เข้าสู่ระบบ: </span>Admin
            </span>
            <span className="hidden md:inline text-emerald-100/70 text-[11px]">• จัดการเนื้อหา ข่าวสาร และเว็บไซต์โรงเรียน</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => navigateTo('admin')}
              className="px-2.5 sm:px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-[11px] sm:text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">ระบบหลังบ้าน (Dashboard)</span>
              <span className="sm:hidden">Dashboard</span>
            </button>
            <button
              onClick={handleAdminLogout}
              className="px-2 sm:px-2.5 py-1 bg-black/40 hover:bg-black/60 text-red-200 hover:text-red-100 rounded-lg text-[11px] sm:text-xs transition cursor-pointer"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}

      {/* 1. Header (Akat Clean Layout with Fresh White & Emerald Tone) */}
      <header className={`bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] sticky ${isAdminLoggedIn ? 'top-[37px]' : 'top-0'} z-50 transition-all shadow-2xs`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6 lg:gap-10 ${isForcedDesktop ? 'w-[1200px] min-w-[1200px]' : ''}`}>
          
          {/* Logo & School Name */}
          <div 
            className="flex items-center gap-3.5 cursor-pointer select-none group shrink-0 mr-4 lg:mr-8 xl:mr-12" 
            onClick={() => navigateTo('home')}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] flex items-center justify-center p-1 border border-[#D1FAE5] shadow-xs shrink-0 overflow-hidden group-hover:scale-105 transition">
              <img 
                src={stats?.logo_url || "/uploads/2026/10/1792825601083477305-ai.png"} 
                alt={`ตราสัญลักษณ์${stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'}`} 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/uploads/2026/10/1792825601083477305-ai.png';
                }}
              />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg text-[#0F172A] leading-tight tracking-tight group-hover:text-[#059669] transition whitespace-nowrap block">
                {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'}
              </span>
              <p className="text-xs text-[#64748B] font-medium whitespace-nowrap">
                {stats?.school_subtitle?.includes('สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม')
                  ? 'สพม.มหาสารคาม • อ.โกสุมพิสัย'
                  : (stats?.school_subtitle || 'สพม.มหาสารคาม • อ.โกสุมพิสัย')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links & Action Button Group */}
          <div className={`${showMobileNav ? 'hidden' : 'flex'} items-center gap-3 xl:gap-5 shrink-0`}>
            <nav className="flex items-center gap-1 xl:gap-1.5">
            {(menuItems && menuItems.length > 0 ? menuItems : [
              { id: 'home', title: 'หน้าแรก', path: 'home' },
              { 
                id: 'about', 
                title: 'เกี่ยวกับโรงเรียน', 
                path: 'about',
                children: [
                  { id: 'about-history', title: 'ประวัติความเป็นมาและวิสัยทัศน์', path: 'history' },
                  { id: 'about-basic-info', title: 'ข้อมูลพื้นฐานโรงเรียน', path: '/page/basic-info' },
                  { id: 'about-personnel', title: 'โครงสร้างและบุคลากร', path: 'about' },
                ]
              },
              { id: 'eservice', title: 'ระบบ E-Service', path: 'eservice' },
              { id: 'news', title: 'ข่าวและประกาศ', path: 'news' },
              { id: 'contact', title: 'ติดต่อเรา', path: 'contact' },
            ]).filter(item => item.show_in_menu !== false).map((item) => {
              const active = currentPage === item.path || 
                (currentPage === 'dynamic_page' && activeDynamicPage?.slug === item.path?.replace(/^\/?page\//, '')) ||
                (item.children && item.children.some(child => 
                  currentPage === child.path || 
                  (currentPage === 'dynamic_page' && activeDynamicPage?.slug === child.path?.replace(/^\/?page\//, ''))
                ));

              if (item.children && item.children.length > 0) {
                return (
                  <div className="relative group" key={item.id || item.path}>
                    <button
                      onClick={() => navigateTo(item.path)}
                      className={`px-3.5 py-2 text-sm font-semibold whitespace-nowrap rounded-xl transition-colors flex items-center gap-1 cursor-pointer ${
                        active
                          ? 'text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0]/70'
                          : 'text-[#334155] hover:text-[#059669] hover:bg-[#F0FDF4]'
                      }`}
                    >
                      <span>{item.title}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#059669] transition" />
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-50 min-w-[220px] animate-in fade-in duration-100">
                      <div className="bg-white rounded-2xl shadow-xl border border-[#E2E8F0] p-2 space-y-1">
                        {item.children.map((child) => {
                          const childActive = currentPage === child.path || 
                            (currentPage === 'dynamic_page' && activeDynamicPage?.slug === child.path?.replace(/^\/?page\//, ''));
                          return (
                            <button
                              key={child.id || child.path}
                              onClick={() => navigateTo(child.path)}
                              className={`w-full text-left px-3 py-2 text-xs rounded-xl flex items-center gap-2 transition cursor-pointer font-semibold ${
                                childActive
                                  ? 'bg-[#ECFDF5] text-[#065F46]'
                                  : 'text-[#334155] hover:bg-[#ECFDF5] hover:text-[#065F46]'
                              }`}
                            >
                              <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${childActive ? 'text-[#059669]' : 'text-[#94A3B8]'}`} />
                              <span className="truncate">{child.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id || item.path}
                  onClick={() => navigateTo(item.path)}
                  className={`px-3.5 py-2 text-sm font-semibold whitespace-nowrap rounded-xl transition-colors cursor-pointer ${
                    active
                      ? 'text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0]/70'
                      : 'text-[#334155] hover:text-[#059669] hover:bg-[#F0FDF4]'
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
          </nav>

            {/* Right Action Button (Login / Admin Portal) */}
            <button 
              type="button"
              onClick={() => navigateTo('admin')}
              className="relative group overflow-hidden h-9 px-4 rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-500 text-white font-semibold text-xs whitespace-nowrap shrink-0 shadow-[0_2px_10px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_16px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 cursor-pointer border border-emerald-300/40 inline-flex items-center gap-2"
            >
              {/* Shimmer sweep effect */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
              
              {/* Glowing indicator dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white shadow-xs"></span>
              </span>

              <span className="relative tracking-normal whitespace-nowrap font-medium drop-shadow-xs">
                {isAdminLoggedIn ? 'ระบบหลังบ้าน' : 'เข้าสู่ระบบ'}
              </span>
              {isAdminLoggedIn ? (
                <LayoutDashboard className="relative w-3.5 h-3.5 text-emerald-100 group-hover:text-white transition-transform duration-200 shrink-0" />
              ) : (
                <Lock className="relative w-3.5 h-3.5 text-emerald-100 group-hover:text-white transition-transform duration-200 shrink-0" />
              )}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className={showMobileNav ? 'block' : 'hidden'}>
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#0F172A] hover:text-[#059669] transition cursor-pointer rounded-xl hover:bg-[#F0FDF4] min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className={`${showMobileNav ? 'block' : 'hidden'} border-t border-[#E2E8F0] bg-white px-6 py-4 space-y-1.5 shadow-lg`}>
            {(menuItems && menuItems.length > 0 ? menuItems : [
              { id: 'home', title: 'หน้าแรก', path: 'home' },
              { 
                id: 'about', 
                title: 'เกี่ยวกับโรงเรียน', 
                path: 'about',
                children: [
                  { id: 'about-history', title: 'ประวัติความเป็นมาและวิสัยทัศน์', path: 'history' },
                  { id: 'about-basic-info', title: 'ข้อมูลพื้นฐานโรงเรียน', path: '/page/basic-info' },
                  { id: 'about-personnel', title: 'โครงสร้างและบุคลากร', path: 'about' },
                ]
              },
              { id: 'eservice', title: 'ระบบ E-Service', path: 'eservice' },
              { id: 'news', title: 'ข่าวและประกาศ', path: 'news' },
              { id: 'contact', title: 'ติดต่อเรา', path: 'contact' },
            ]).filter(item => item.show_in_menu !== false).map((item) => {
              const active = currentPage === item.path || 
                (currentPage === 'dynamic_page' && activeDynamicPage?.slug === item.path?.replace(/^\/?page\//, '')) ||
                (item.children && item.children.some(child => 
                  currentPage === child.path || 
                  (currentPage === 'dynamic_page' && activeDynamicPage?.slug === child.path?.replace(/^\/?page\//, ''))
                ));
              return (
                <div key={item.id || item.path} className="space-y-1">
                  <button 
                    onClick={() => navigateTo(item.path)}
                    className={`block w-full text-left py-2.5 px-3 rounded-xl text-sm font-semibold flex items-center justify-between ${
                      active ? 'bg-[#ECFDF5] text-[#065F46]' : 'text-[#334155] hover:bg-[#F0FDF4]'
                    }`}
                  >
                    <span>{item.title}</span>
                    {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4 text-[#64748B]" />}
                  </button>
                  {item.children && item.children.length > 0 && (
                    <div className="pl-4 space-y-1 border-l-2 border-[#10B981] ml-3 py-1">
                      {item.children.map((child) => {
                        const childActive = currentPage === child.path || 
                          (currentPage === 'dynamic_page' && activeDynamicPage?.slug === child.path?.replace(/^\/?page\//, ''));
                        return (
                          <button
                            key={child.id || child.path}
                            onClick={() => navigateTo(child.path)}
                            className={`block w-full text-left py-2 px-2.5 text-xs font-semibold rounded-lg transition ${
                              childActive
                                ? 'bg-[#ECFDF5] text-[#065F46]'
                                : 'text-[#334155] hover:text-[#059669]'
                            }`}
                          >
                            • {child.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile Action Button (Login / Admin Portal) */}
            <div className="pt-3 pb-1">
              <button 
                type="button"
                onClick={() => navigateTo('admin')}
                className="w-full relative group overflow-hidden px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-bold text-sm shadow-[0_4px_16px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all duration-200 cursor-pointer border border-emerald-400/40 flex items-center justify-center gap-2"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <span>{isAdminLoggedIn ? 'ระบบหลังบ้าน (Dashboard)' : 'เข้าสู่ระบบแอดมิน'}</span>
                {isAdminLoggedIn ? (
                  <LayoutDashboard className="w-4 h-4 text-emerald-100" />
                ) : (
                  <Lock className="w-4 h-4 text-emerald-100" />
                )}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 ${isForcedDesktop ? 'w-[1200px] min-w-[1200px] mx-auto overflow-x-auto' : ''}`}>

          {/* ========================================================= */}
          {/* PAGE 1: หน้าแรก (HOME - Akat Clean Layout in Emerald Tone) */}
          {/* ========================================================= */}
          {currentPage === 'home' && (
            <div className="animate-in fade-in duration-200">
              
              {/* Signature Hero (Deep Emerald BG + Floating Glass Chips + Center Glass Card) */}
              <section className="relative min-h-[660px] pb-36 pt-16 flex items-center justify-center overflow-hidden bg-[#032017] text-center">
                
                {/* Background Photo with Gradient Tint & Atmosphere */}
                <div className="absolute inset-0 z-0">
                  {homepageConfig?.hero?.image_url && (
                    <img 
                      src={homepageConfig.hero.image_url} 
                      alt="บรรยากาศการเรียนรู้โรงเรียนโพนงามพิทยานุกูล"
                      className="w-full h-full object-cover opacity-50 scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#032017] via-[#032017]/65 to-black/40"></div>
                </div>

                {/* Floating Glass Chips (Emerald Theme) */}
                <div className="absolute inset-0 z-1 pointer-events-none hidden md:block">
                  <span className="glass-chip-emerald px-4 py-2 rounded-2xl text-sm font-bold absolute left-[6%] top-[22%] shadow-lg">
                    🏫 พ.พ.ก.
                  </span>
                  <span className="glass-chip-emerald px-4 py-2 rounded-2xl text-sm font-bold absolute right-[8%] top-[18%] shadow-lg">
                    ✨ Active Learning
                  </span>
                  <span className="glass-chip-emerald px-4 py-2 rounded-2xl text-sm font-bold absolute left-[9%] bottom-[38%] shadow-lg">
                    🎓 100% ศึกษาต่อ
                  </span>
                  <span className="glass-chip-emerald px-4 py-2 rounded-2xl text-sm font-bold absolute right-[9%] bottom-[34%] shadow-lg">
                    🏆 15+ รางวัลเด่น
                  </span>
                  <span className="glass-chip-emerald px-4 py-2 rounded-2xl text-sm font-bold absolute right-[26%] top-[12%] shadow-lg">
                    ⚡ PPK SMART Model
                  </span>
                </div>

                {/* Center Glass Card */}
                <div className="relative z-10 max-w-4xl mx-4 glass-hero-card rounded-[32px] p-8 sm:p-14 text-center shadow-2xl">
                  
                  {/* Eyebrow */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs sm:text-sm font-semibold mb-4 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
                    <span>มาเริ่มต้นเรียนรู้และเติบโตไปด้วยกันที่นี่ !</span>
                  </div>

                  {/* Big Emerald Gradient Title */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold site-emerald tracking-tight leading-tight mb-4 whitespace-nowrap">
                    {homepageConfig?.hero?.heading || 'โรงเรียนโพนงามพิทยานุกูล'}
                  </h1>

                  {/* Subtitle */}
                  <div className="text-sm sm:text-base text-[#475569] max-w-xl mx-auto font-medium leading-relaxed space-y-1">
                    <p className="text-[#059669] font-semibold text-xs sm:text-sm">
                      “ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์”
                    </p>
                    <p className="text-xs sm:text-sm text-[#64748B]">
                      เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ
                    </p>
                  </div>

                  {/* Scroll Down Circle Button */}
                  <div className="mt-8">
                    <a 
                      href="#highlights"
                      className="inline-flex w-12 h-12 rounded-full bg-[#10B981] hover:bg-[#059669] text-white items-center justify-center transition shadow-lg transform hover:scale-110"
                    >
                      <ChevronDown className="w-6 h-6" />
                    </a>
                  </div>

                </div>
              </section>

              {/* Overlapping 4-Pillars Card Grid (Clean Emerald Accent) */}
              <section id="highlights" className="relative z-20 -mt-24 sm:-mt-28 max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Card 1 */}
                  <div className="akat-card p-8 flex flex-col items-center text-center justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-xl bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-xs font-bold shadow-2xs mb-3">
                        Active Learning
                      </span>
                      <h3 className="text-lg font-bold text-[#0F172A]">กลุ่มบริหารวิชาการ</h3>
                      <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                        ขับเคลื่อนหลักสูตรต้านทุจริตศึกษา ยกระดับการจัดการเรียนรู้เชิงรุก และส่งเสริมการใช้สื่อนวัตกรรม
                      </p>
                    </div>
                    <span className="mt-5 text-xs font-bold text-[#059669] hover:underline flex items-center gap-1 cursor-pointer" onClick={() => { navigateTo('about'); setTimeout(() => { document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }}>
                      ดูข้อมูลฝ่ายวิชาการ →
                    </span>
                  </div>

                  {/* Card 2 */}
                  <div className="akat-card p-8 flex flex-col items-center text-center justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-xl bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-xs font-bold shadow-2xs mb-3">
                        PPK Model
                      </span>
                      <h3 className="text-lg font-bold text-[#0F172A]">กลุ่มบริหารงานบุคคล</h3>
                      <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                        พัฒนาครูและบุคลากรทางการศึกษา เสริมสร้างวินัย คุณธรรมจริยธรรม และการมีส่วนร่วมของชุมชน
                      </p>
                    </div>
                    <span className="mt-5 text-xs font-bold text-[#059669] hover:underline flex items-center gap-1 cursor-pointer" onClick={() => { navigateTo('about'); setTimeout(() => { document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }}>
                      ดูข้อมูลฝ่ายบุคคล →
                    </span>
                  </div>

                  {/* Card 3 */}
                  <div className="akat-card p-8 flex flex-col items-center text-center justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-xl bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-xs font-bold shadow-2xs mb-3">
                        Transparency
                      </span>
                      <h3 className="text-lg font-bold text-[#0F172A]">กลุ่มบริหารงบประมาณ</h3>
                      <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                        บริหารงบประมาณโปร่งใส ตรวจสอบได้ตามหลักธรรมาภิบาล และการประเมินคุณธรรม ITA
                      </p>
                    </div>
                    <span className="mt-5 text-xs font-bold text-[#059669] hover:underline flex items-center gap-1 cursor-pointer" onClick={() => { navigateTo('about'); setTimeout(() => { document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }}>
                      ดูข้อมูลฝ่ายงบประมาณ →
                    </span>
                  </div>

                  {/* Card 4 */}
                  <div className="akat-card p-8 flex flex-col items-center text-center justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-xl bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] text-xs font-bold shadow-2xs mb-3">
                        Campus 32 ไร่
                      </span>
                      <h3 className="text-lg font-bold text-[#0F172A]">กลุ่มบริหารทั่วไป</h3>
                      <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                        พัฒนาสภาพแวดล้อมและภูมิทัศน์สถานศึกษา ร่มรื่น ปลอดภัย น่าอยู่ และเอื้อต่อการเรียนรู้รอบด้าน
                      </p>
                    </div>
                    <span className="mt-5 text-xs font-bold text-[#059669] hover:underline flex items-center gap-1 cursor-pointer" onClick={() => { navigateTo('about'); setTimeout(() => { document.getElementById('departments')?.scrollIntoView({ behavior: 'smooth' }); }, 100); }}>
                      ดูข้อมูลฝ่ายทั่วไป →
                    </span>
                  </div>

                </div>

                {/* Center Emerald Pill Button */}
                <div className="text-center mt-10">
                  <button 
                    onClick={() => navigateTo('about')}
                    className="px-8 py-3.5 rounded-full bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-md transition transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>ดูข้อมูลและโครงสร้างสถานศึกษาทั้งหมด</span>
                    <span>+</span>
                  </button>
                </div>
              </section>

              {/* Journey & Director Showcase (3-Column Layout) */}
              <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  
                  {/* Left Column: Intro */}
                  <div className="lg:col-span-4">
                    <h2 className="text-3xl sm:text-4xl font-bold site-emerald leading-tight">
                      ก้าวสู่อนาคตการศึกษา ที่มีคุณภาพ
                    </h2>
                    <p className="text-sm text-[#475569] mt-4 leading-relaxed">
                      โรงเรียนโพนงามพิทยานุกูล มุ่งเน้นการพัฒนาผู้เรียนเป็นสำคัญ สืบสานศาสตร์พระราชา และเสริมสร้างทักษะแห่งศตวรรษที่ 21 เพื่อเยาวชนในชุมชนตำบลโพนงามและอำเภอโกสุมพิสัย
                    </p>
                    <hr className="w-24 border-0 border-t-3 border-[#10B981] mt-6" />
                  </div>

                  {/* Center Column: Director Photo */}
                  <div className="lg:col-span-4 flex justify-center">
                    <div className="relative w-full max-w-sm rounded-[32px] overflow-hidden bg-white shadow-xl border border-[#E2E8F0] p-3">
                      <div className="rounded-[24px] overflow-hidden aspect-4/5 bg-[#F0FDF4]">
                        <OptimizedImage 
                          src="/uploads/2026/10/1792823594077728192-ai.jfif" 
                          alt="นายวัชรินทร์ ติดวงษา ผู้อำนวยการ"
                          width={400}
                          quality={80}
                          fallbackSrc=""
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                      <div className="p-4 text-center">
                        <h4 className="font-bold text-base text-[#0F172A]">นายวัชรินทร์ ติดวงษา</h4>
                        <p className="text-xs text-[#059669] font-semibold mt-0.5">ผู้อำนวยการโรงเรียนโพนงามพิทยานุกูล</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 3 Numbered Steps (Emerald Accents) */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] text-[#047857] border-2 border-[#A7F3D0] font-bold text-2xl flex items-center justify-center shrink-0 shadow-xs">
                        1
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#0F172A]">องค์กรคุณภาพ</h4>
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                          บริหารจัดการสถานศึกษาด้วยระบบคุณภาพมาตรฐานสากล สพม.มหาสารคาม
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] text-[#047857] border-2 border-[#A7F3D0] font-bold text-2xl flex items-center justify-center shrink-0 shadow-xs">
                        2
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#0F172A]">ศาสตร์พระราชา</h4>
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                          น้อมนำหลักปรัชญาของเศรษฐกิจพอเพียง ปลูกฝังคุณธรรมและความซื่อสัตย์สุจริต
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] text-[#047857] border-2 border-[#A7F3D0] font-bold text-2xl flex items-center justify-center shrink-0 shadow-xs">
                        3
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#0F172A]">สู่ความเป็นเลิศ</h4>
                        <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                          จัดการเรียนรู้เชิงรุก (Active Learning) สร้างสรรค์นวัตกรรมและต่อยอดสู่อุดมศึกษา
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* Clean E-Service Section */}
              <section className="py-20 bg-gradient-to-b from-[#F4F8F5] to-white border-t border-[#E2E8F0]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
                    <div>
                      <span className="text-[#059669] text-xs font-bold uppercase tracking-wider bg-[#ECFDF5] border border-[#A7F3D0] px-3.5 py-1 rounded-full">
                        ระบบสารสนเทศออนไลน์
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
                        บริการอิเล็กทรอนิกส์ E-Service สำหรับนักเรียนและบุคลากร
                      </h2>
                    </div>
                    <button 
                      onClick={() => navigateTo('eservice')}
                      className="px-5 py-2.5 rounded-full bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0] font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>ดูระบบทั้งหมด ({eServices.length})</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {eServices.slice(0, 3).map((srv) => (
                      <div 
                        key={srv.id}
                        className="akat-card p-6 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-lg">
                              {srv.badge}
                            </span>
                            <span className="text-xs text-[#64748B] font-medium">
                              {srv.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-base text-[#0F172A] leading-snug">
                            {srv.title}
                          </h4>
                          <p className="text-xs text-[#64748B] mt-2 leading-relaxed line-clamp-2">
                            {srv.desc}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                          <a 
                            href={srv.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-full text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <span>เข้าสู่ระบบ</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                          {srv.manualUrl && (
                            <a 
                              href={srv.manualUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#059669] hover:underline font-semibold"
                            >
                              คู่มือการใช้งาน
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </section>

              {/* Clean News / Articles Section (เรื่องเล่าและข่าวสารจากโรงเรียน) */}
              <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
                
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
                  <div>
                    <span className="text-[#059669] text-xs font-bold uppercase tracking-wider bg-[#ECFDF5] border border-[#A7F3D0] px-3.5 py-1 rounded-full">
                      บทความ & ข่าวสาร
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
                      เรื่องเล่าและความรู้จากสถานศึกษา
                    </h2>
                  </div>
                  <button 
                    onClick={() => navigateTo('news')}
                    className="px-5 py-2.5 rounded-full bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0] font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>ดูบทความทั้งหมด</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {loadingPosts ? (
                    <NewsCardSkeleton count={6} variant="akat" />
                  ) : posts.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-neutral-100">
                      ยังไม่มีบทความในขณะนี้
                    </div>
                  ) : (
                    posts.slice(0, 6).map((post) => (
                      <article 
                        key={post.id}
                        onClick={() => handleOpenPost(post)}
                        className="akat-card overflow-hidden cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="aspect-16/10 w-full overflow-hidden bg-[#F0FDF4]">
                          <OptimizedImage 
                            src={post.image_url || '/images/news-active-learning.jpg'} 
                            alt={post.title} 
                            width={600}
                            quality={75}
                            responsive={true}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>
                        <div className="p-6 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-2.5">
                              <span className="font-bold text-[#047857] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-md text-[10px]">
                                {post.category}
                              </span>
                              <span>•</span>
                              <span>{formatThaiDate(post.created_at)}</span>
                            </div>
                            <h4 className="font-bold text-base text-[#0F172A] group-hover:text-[#059669] transition leading-snug line-clamp-2">
                              {post.title}
                            </h4>
                            <p className="text-xs text-[#64748B] mt-2 line-clamp-2 leading-relaxed">
                              {post.summary || post.content}
                            </p>
                          </div>
                          <div className="mt-5 pt-3 border-t border-[#E2E8F0] text-xs font-bold text-[#059669] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                            อ่านต่อ →
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>

              </section>

              {/* Optional Custom Homepage Blocks Rendered from MCP / Site Editor */}
              {homepageConfig?.custom_blocks && (
                <div className="py-6 max-w-6xl mx-auto px-4 sm:px-6">
                  <BlockRenderer blocks={homepageConfig.custom_blocks} />
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 2: เกี่ยวกับโรงเรียน (ABOUT SCHOOL - Apple Minimal)   */}
          {/* ========================================================= */}
          {currentPage === 'about' && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 animate-in fade-in duration-200">
              
              {/* Header Title */}
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] uppercase tracking-wider mb-2.5 shadow-2xs">
                  แผนผังโครงสร้างสายการบริหาร • สพม.มหาสารคาม
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold site-emerald tracking-tight">
                  โครงสร้างการบริหารและทำเนียบบุคลากร
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-2.5 font-medium max-w-xl mx-auto">
                  โรงเรียนโพนงามพิทยานุกูล อำเภอโกสุมพิสัย จังหวัดมหาสารคาม
                </p>
                
                {/* Fast Anchor Navigation Bar */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-6">
                  <button
                    onClick={() => navigateTo('history')}
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#059669]" />
                    <span>ประวัติ & วิสัยทัศน์</span>
                  </button>
                  <button
                    onClick={() => navigateTo('page/basic-info')}
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                    <span>ข้อมูลพื้นฐานโรงเรียน (ตรา/คำขวัญ)</span>
                  </button>
                  <a
                    href="#director"
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-[#ECFDF5] text-[#0F172A] hover:text-[#059669] border border-[#E2E8F0] hover:border-[#10B981] transition shadow-xs flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#059669]" />
                    <span>ผู้บริหารสถานศึกษา</span>
                  </a>
                  <a
                    href="#departments"
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-[#ECFDF5] text-[#0F172A] hover:text-[#059669] border border-[#E2E8F0] hover:border-[#10B981] transition shadow-xs flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#059669]" />
                    <span>4 กลุ่มบริหารงานหลัก</span>
                  </a>
                  <a
                    href="#faculty"
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-[#ECFDF5] text-[#0F172A] hover:text-[#059669] border border-[#E2E8F0] hover:border-[#10B981] transition shadow-xs flex items-center gap-1.5"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-[#059669]" />
                    <span>คณะครูและบุคลากร</span>
                  </a>
                </div>
              </div>

              {/* ======================================================== */}
              {/* LEVEL 1: ผู้บริหารสถานศึกษา (EXECUTIVE LEADERSHIP)        */}
              {/* ======================================================== */}
              <div id="director" className="scroll-mt-24">
                <div className="max-w-2xl mx-auto akat-card p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left relative z-10 shadow-lg border-2 border-[#D1FAE5]">
                  <div className="w-36 h-48 sm:w-44 sm:h-56 rounded-2xl overflow-hidden bg-[#F0FDF4] border-2 border-[#10B981]/40 shadow-md shrink-0">
                    <img 
                      src="/uploads/2026/10/1792823594077728192-ai.jfif" 
                      alt="นายวัชรินทร์ ติดวงษา ผู้อำนวยการโรงเรียน" 
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                      <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                      <span>ผู้บริหารสูงสุดของสถานศึกษา (School Director)</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
                      นายวัชรินทร์ ติดวงษา
                    </h2>
                    <p className="text-sm font-bold text-[#059669]">
                      ผู้อำนวยการโรงเรียนโพนงามพิทยานุกูล
                    </p>
                    <p className="text-xs text-[#64748B] font-medium">
                      วิทยฐานะ: ผู้อำนวยการชำนาญการพิเศษ
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#64748B]">
                      <span className="bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-md font-bold text-[#047857]">
                        ประธาน กก.สถานศึกษา
                      </span>
                      <span className="bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-0.5 rounded-md font-bold text-[#047857]">
                        ITA ระดับผ่านดีเยี่ยม
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tree Connector: Downward Line from Director */}
                <div className="flex flex-col items-center my-6">
                  <div className="w-0.5 h-10 bg-gradient-to-b from-[#10B981] to-[#059669]"></div>
                  <div className="px-4 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-bold shadow-xs flex items-center gap-1.5 z-10">
                    <Building2 className="w-3.5 h-3.5 text-[#059669]" />
                    <span>โครงสร้างการบริหาร 4 กลุ่มงานหลักสถานศึกษา</span>
                  </div>
                  <div className="w-0.5 h-6 bg-[#059669]"></div>
                </div>

                {/* Tree Horizontal Branch (Desktop) */}
                <div className="hidden lg:block relative max-w-5xl mx-auto -mt-6 mb-8">
                  <div className="h-0.5 bg-[#A7F3D0] w-3/4 mx-auto"></div>
                  <div className="grid grid-cols-4 w-3/4 mx-auto">
                    <div className="flex justify-center"><div className="w-0.5 h-6 bg-[#A7F3D0]"></div></div>
                    <div className="flex justify-center"><div className="w-0.5 h-6 bg-[#A7F3D0]"></div></div>
                    <div className="flex justify-center"><div className="w-0.5 h-6 bg-[#A7F3D0]"></div></div>
                    <div className="flex justify-center"><div className="w-0.5 h-6 bg-[#A7F3D0]"></div></div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* LEVEL 2: 4 เสาหลักกลุ่มบริหารงาน (4 DEPARTMENTS GRID)      */}
              {/* ======================================================== */}
              <div id="departments" className="scroll-mt-24">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {administrators.map((admin, idx) => (
                    <div 
                      key={idx} 
                      className="akat-card p-6 flex flex-col justify-between text-center relative hover:shadow-xl transition-all"
                    >
                      <div>
                        {/* Group Pill Header */}
                        <div className="mb-4">
                          <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] shadow-2xs">
                            {admin.group}
                          </span>
                        </div>

                        {/* Head Portrait */}
                        <div className="w-28 h-36 rounded-2xl overflow-hidden bg-[#F0FDF4] border border-[#D1FAE5] shadow-xs mx-auto mb-4">
                          <img 
                            src={admin.photo} 
                            alt={admin.name} 
                            className="w-full h-full object-cover object-top"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/uploads/2026/10/1792825601083477305-ai.png';
                            }}
                          />
                        </div>

                        {/* Name & Titles */}
                        <h3 className="font-bold text-sm sm:text-base text-[#0F172A] leading-tight">
                          {admin.name}
                        </h3>
                        <p className="text-xs text-[#059669] font-bold mt-1">
                          {admin.role}
                        </p>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          {admin.position}
                        </p>
                      </div>

                      {/* Duties List */}
                      <div className="mt-5 pt-4 border-t border-[#E2E8F0] text-left">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-2">
                          ภาระหน้าที่หลัก
                        </span>
                        <ul className="space-y-1.5 text-xs text-[#475569]">
                          {admin.duties && admin.duties.map((duty, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0 mt-0.5" />
                              <span className="leading-tight text-[11px]">{duty}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Tree Connector: Downward Line to Faculty */}
              <div className="flex flex-col items-center my-10">
                <div className="w-0.5 h-10 bg-gradient-to-b from-[#059669] to-[#10B981]"></div>
                <div className="px-4 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-bold shadow-xs flex items-center gap-1.5 z-10">
                  <GraduationCap className="w-4 h-4 text-[#059669]" />
                  <span>คณะครูผู้สอนและบุคลากรทางการศึกษาประจำสถานศึกษา</span>
                </div>
                <div className="w-0.5 h-6 bg-[#10B981]"></div>
              </div>

              {/* ======================================================== */}
              {/* LEVEL 3: ทำเนียบคณะครูและบุคลากร (FACULTY DIRECTORY)     */}
              {/* ======================================================== */}
              <div id="faculty" className="scroll-mt-24">
                
                {/* Section Subhead & Filter */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E2E8F0]">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">
                      ทำเนียบคณะครูและบุคลากรทางการศึกษา
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      บุคลากรผู้ปฏิบัติหน้าที่จัดการเรียนการสอนและสนับสนุนการศึกษา ({teachers.length} ท่าน)
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-[#E2E8F0] shadow-xs">
                    <button
                      onClick={() => setFacultyCategoryFilter('all')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                        facultyCategoryFilter === 'all'
                          ? 'bg-[#059669] text-white shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      ทั้งหมด ({teachers.length})
                    </button>
                    <button
                      onClick={() => setFacultyCategoryFilter('teacher')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                        facultyCategoryFilter === 'teacher'
                          ? 'bg-[#059669] text-white shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      กลุ่มสาระการเรียนรู้ (7)
                    </button>
                    <button
                      onClick={() => setFacultyCategoryFilter('staff')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                        facultyCategoryFilter === 'staff'
                          ? 'bg-[#059669] text-white shadow-xs'
                          : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
                      }`}
                    >
                      ฝ่ายสนับสนุน (1)
                    </button>
                  </div>
                </div>

                {/* Faculty 8-Card Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {teachers
                    .filter(t => facultyCategoryFilter === 'all' || t.category === facultyCategoryFilter)
                    .map((t, idx) => (
                      <div 
                        key={idx} 
                        className="akat-card p-5 text-center flex flex-col items-center justify-between hover:shadow-lg transition-all group"
                      >
                        <div className="flex flex-col items-center w-full">
                          <div className="w-24 h-32 rounded-2xl overflow-hidden bg-[#F0FDF4] border border-[#D1FAE5] shadow-xs mb-3.5 group-hover:scale-105 transition-transform duration-300">
                            <img 
                              src={t.photo} 
                              alt={t.name} 
                              className="w-full h-full object-cover object-top"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/uploads/2026/10/1792825601083477305-ai.png';
                              }}
                            />
                          </div>
                          <h4 className="font-bold text-xs sm:text-sm text-[#0F172A] leading-tight group-hover:text-[#059669] transition line-clamp-1">
                            {t.name}
                          </h4>
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] mt-1.5">
                            {t.position}
                          </span>
                        </div>

                        <div className="mt-3.5 pt-2.5 border-t border-[#E2E8F0] w-full">
                          <p className="text-[11px] font-semibold text-[#334155] line-clamp-1">
                            {t.subject || t.department}
                          </p>
                          <p className="text-[10px] text-[#94A3B8] mt-0.5">
                            {t.category === 'staff' ? 'ฝ่ายสนับสนุนการศึกษา' : 'ผู้ปฏิบัติหน้าที่การสอน'}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>

              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE: ประวัติความเป็นมาและวิสัยทัศน์ (HISTORY & VISION ROUTE) */}
          {/* ========================================================= */}
          {currentPage === 'history' && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 animate-in fade-in duration-200">
              
              {/* Header Title */}
              <div className="text-center max-w-3xl mx-auto mb-10">
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0] uppercase tracking-wider mb-2.5 shadow-2xs">
                  ข้อมูลสถานศึกษา • โรงเรียนโพนงามพิทยานุกูล
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold site-emerald tracking-tight">
                  ประวัติความเป็นมาและวิสัยทัศน์
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-2.5 font-medium max-w-xl mx-auto">
                  รากฐานการศึกษา ภารกิจ อัตลักษณ์ และทิศทางการพัฒนาโรงเรียนโพนงามพิทยานุกูล
                </p>

                {/* Sub Navigation Bar to related school info */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-6">
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#059669] text-white shadow-xs flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-white" />
                    <span>ประวัติ & วิสัยทัศน์</span>
                  </span>
                  <button
                    onClick={() => navigateTo('page/basic-info')}
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-[#ECFDF5] text-[#0F172A] hover:text-[#059669] border border-[#E2E8F0] hover:border-[#10B981] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                    <span>ข้อมูลพื้นฐานโรงเรียน (ตรา/คำขวัญ)</span>
                  </button>
                  <button
                    onClick={() => navigateTo('about')}
                    className="px-4 py-1.5 rounded-full text-xs font-bold bg-white hover:bg-[#ECFDF5] text-[#0F172A] hover:text-[#059669] border border-[#E2E8F0] hover:border-[#10B981] transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-[#059669]" />
                    <span>โครงสร้างและบุคลากร</span>
                  </button>
                </div>
              </div>

              {/* Main Content Grid: 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* 1. History Section */}
                <div className="akat-card p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E2E8F0]">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-[#059669]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#0F172A]">
                        ประวัติการก่อตั้งสถานศึกษา
                      </h2>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        จุดเริ่มต้นและวิวัฒนาการของโรงเรียนโพนงามพิทยานุกูล
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm text-[#334155] leading-relaxed">
                    <p>
                      โรงเรียนโพนงามพิทยานุกูล อำเภอโกสุมพิสัย จังหวัดมหาสารคาม สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม (สพม.มหาสารคาม) เดิมมีฐานะเป็น <strong className="text-[#0F172A]">"สาขาโรงเรียนโกสุมวิทยาสรรค์"</strong>
                    </p>
                    <p>
                      ก่อตั้งขึ้นเมื่อปี <strong className="text-[#0F172A]">พ.ศ. 2534</strong> โดย <strong className="text-[#0F172A]">นายณรงค์ จันทชุม</strong> ผู้อำนวยการโรงเรียนโกสุมวิทยาสรรค์ในขณะนั้น ได้ร่วมกับผู้นำชุมชน นำโดย <strong className="text-[#0F172A]">นายวินัย สมศรีลัย</strong> กำนันตำบลโพนงาม พร้อมด้วยผู้ใหญ่บ้านทุกหมู่บ้าน มีมติเห็นชอบร่วมกันในการใช้พื้นที่ดินสาธารณประโยชน์ <strong className="text-[#059669]">"โคกหนองเรือ"</strong> เนื้อที่ 32 ไร่ 3 งาน 72 ตารางวา เป็นสถานที่ตั้งโรงเรียนสาขา
                    </p>
                    <p>
                      ต่อมาได้รับอนุมัติจากกรมสามัญศึกษาให้ยกฐานะเป็นโรงเรียนเอกเทศอย่างเป็นทางการ เมื่อวันที่ <strong className="text-[#0F172A]">3 กุมภาพันธ์ พ.ศ. 2538</strong> (คำสั่งกรมสามัญศึกษาที่ 391/2538) และใช้ชื่อว่า <strong className="text-[#065F46]">"โรงเรียนโพนงามพิทยานุกูล"</strong> โดยมีอักษรย่อว่า <strong className="text-[#059669]">"พ.พ.ก."</strong>
                    </p>
                  </div>

                  {/* Founding Timeline Highlights */}
                  <div className="pt-2 border-t border-[#F1F5F9] space-y-3">
                    <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                      หมุดหมายสำคัญ (Milestones)
                    </h3>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs shrink-0 mt-0.5">
                          2534
                        </span>
                        <div className="text-xs text-[#334155]">
                          <strong className="text-[#0F172A] block font-semibold">จัดตั้งสาขาโรงเรียนโกสุมวิทยาสรรค์</strong>
                          <span>ริเริ่มโดยผู้นำชุมชนกำนันตำบลโพนงามและผู้ใหญ่บ้าน ใช้พื้นที่โคกหนองเรือ 32 ไร่ 3 งาน 72 ตร.ว.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-xs shrink-0 mt-0.5">
                          2538
                        </span>
                        <div className="text-xs text-[#334155]">
                          <strong className="text-[#065F46] block font-semibold">ยกฐานะเป็นโรงเรียนเอกเทศ (3 ก.พ. 2538)</strong>
                          <span>คำสั่งกรมสามัญศึกษาที่ 391/2538 นามพระราชทานโรงเรียนโพนงามพิทยานุกูล อักษรย่อ พ.พ.ก.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Badges */}
                  <div className="pt-2 flex flex-wrap gap-2 text-xs">
                    <span className="px-3 py-1.5 bg-[#F1F5F9] rounded-xl font-semibold text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ที่ดินโคกหนองเรือ 32 ไร่</span>
                    </span>
                    <span className="px-3 py-1.5 bg-[#F1F5F9] rounded-xl font-semibold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ยกฐานะ 3 ก.พ. 2538</span>
                    </span>
                    <span className="px-3 py-1.5 bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] rounded-xl font-bold flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      <span>อักษรย่อ: พ.พ.ก.</span>
                    </span>
                  </div>
                </div>

                {/* 2. Vision, Mission & Motto Section */}
                <div className="akat-card p-6 sm:p-8 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E2E8F0]">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Compass className="w-5 h-5 text-[#059669]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-[#0F172A]">
                        วิสัยทัศน์ พันธกิจ และคำขวัญ
                      </h2>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        ทิศทาง กลยุทธ์ และเป้าหมายการพัฒนาคุณภาพการศึกษา
                      </p>
                    </div>
                  </div>

                  {/* Vision Box */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border border-[#D1FAE5] space-y-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      วิสัยทัศน์ (Vision)
                    </span>
                    <h3 className="text-lg font-bold text-[#065F46] leading-snug">
                      “เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ”
                    </h3>
                    <p className="text-xs text-[#047857] leading-relaxed">
                      มุ่งเน้นการพัฒนาผู้เรียนให้มีสมรรถนะตามมาตรฐานสากล มีทักษะในศตวรรษที่ 21 ควบคู่คุณธรรมจริยธรรม และน้อมนำหลักปรัชญาของเศรษฐกิจพอเพียงมาปรับใช้
                    </p>
                  </div>

                  {/* Mission Box */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      พันธกิจหลัก (Mission)
                    </span>
                    <ul className="space-y-2 text-xs text-[#334155]">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                        <span>จัดการศึกษาเพื่อพัฒนาผู้เรียนให้มีคุณภาพตามมาตรฐานการศึกษาขั้นพื้นฐานและทักษะแห่งอนาคต</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                        <span>น้อมนำศาสตร์พระราชาและหลักปรัชญาของเศรษฐกิจพอเพียงมาบูรณาการในการจัดการเรียนรู้</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                        <span>ส่งเสริมคุณธรรม จริยธรรม ธรรมาภิบาล และการป้องกันการทุจริตในสถานศึกษา</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                        <span>พัฒนาระบบการบริหารจัดการด้วยนวัตกรรม PPK SMART Model และเทคโนโลยีดิจิทัล</span>
                      </li>
                    </ul>
                  </div>

                  {/* Motto Box */}
                  <div className="p-5 rounded-2xl bg-white border border-[#E2E8F0] space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/60">
                      คำขวัญโรงเรียน (Motto)
                    </span>
                    <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                      “ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์”
                    </h3>
                  </div>

                  {/* Pali Motto Box */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] block">
                      พุทธศาสนสุภาษิต / ปรัชญาโรงเรียน
                    </span>
                    <p className="text-sm font-bold text-emerald-800">
                      “ปญฺญา นรานํ รตนํ”
                    </p>
                    <p className="text-xs text-[#64748B]">
                      (ปัญญา คือ ดวงประทีปแก้วของนรชน)
                    </p>
                  </div>

                  {/* Management Model */}
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-[#334155] flex items-center justify-between">
                    <div>
                      <strong className="block text-[#065F46] font-bold">รูปแบบการบริหารจัดการสถานศึกษา</strong>
                      <span>PPK SMART Model (4 ด้าน 12 ตัวชี้วัด)</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-md bg-[#059669] text-white font-bold text-[10px] shadow-2xs">
                      SMART
                    </span>
                  </div>

                </div>

              </div>

              {/* Bottom Quick Navigation Cards */}
              <div className="mt-12 pt-8 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigateTo('page/basic-info')}
                  className="p-5 rounded-2xl bg-white hover:bg-emerald-50/50 border border-[#E2E8F0] hover:border-emerald-300 text-left transition shadow-xs group cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#0F172A] group-hover:text-emerald-700 transition">
                        ข้อมูลพื้นฐานโรงเรียน
                      </p>
                      <p className="text-xs text-[#64748B]">
                        ตราสัญลักษณ์ สีประจำโรงเรียน และข้อมูลทั่วไป
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                </button>

                <button
                  onClick={() => navigateTo('about')}
                  className="p-5 rounded-2xl bg-white hover:bg-emerald-50/50 border border-[#E2E8F0] hover:border-emerald-300 text-left transition shadow-xs group cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#0F172A] group-hover:text-emerald-700 transition">
                        โครงสร้างและทำเนียบบุคลากร
                      </p>
                      <p className="text-xs text-[#64748B]">
                        แผนผังผู้บริหาร 4 กลุ่มบริหารงาน และคณะครูอาจารย์
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#94A3B8] group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                </button>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 3: ระบบสารสนเทศ E-SERVICES (Apple Minimal)           */}
          {/* ========================================================= */}
          {currentPage === 'eservice' && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 animate-in fade-in duration-200">
              
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                  ระบบสารสนเทศออนไลน์
                </span>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-950 mt-1.5">
                  บริการอิเล็กทรอนิกส์ E-Service
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-2">
                  ศูนย์รวมระบบสารสนเทศ การประเมินผลการเรียน และบริการอิเล็กทรอนิกส์
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eServices.map((service) => (
                  <div 
                    key={service.id} 
                    className="bg-white rounded-3xl border border-neutral-200/80 p-6 flex flex-col justify-between hover:border-neutral-300 hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition duration-200"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full uppercase tracking-wider border border-neutral-200/60">
                          {service.badge}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-normal">
                          {service.category}
                        </span>
                      </div>
                      <h4 className="font-semibold text-base text-neutral-950 leading-snug">
                        {service.title}
                      </h4>
                      <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                      <a 
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-full text-xs font-medium transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>เข้าสู่ระบบ</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                      {service.manualUrl && (
                        <a 
                          href={service.manualUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-neutral-500 hover:text-neutral-950 underline flex items-center gap-1 font-normal"
                        >
                          คู่มือการใช้งาน
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 4: ข่าวสารและประกาศ (NEWS & ARTICLES - Apple Minimal) */}
          {/* ========================================================= */}
          {currentPage === 'news' && (
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 animate-in fade-in duration-200">
              
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                  ข่าวประชาสัมพันธ์
                </span>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-950 mt-1.5">
                  ข่าวสารและกิจกรรมโรงเรียน
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-2">
                  ติดตามประกาศ กิจกรรมวิชาการ และผลงานนักเรียนล่าสุด
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 pb-6 border-b border-neutral-200/60">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-neutral-950 text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/70'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาข่าวสาร..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-neutral-50 rounded-full border border-neutral-200/80 text-xs focus:outline-none focus:border-neutral-400 transition"
                  />
                </div>
              </div>

              {/* News Grid */}
              {loadingPosts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <NewsCardSkeleton count={6} variant="archive" />
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-neutral-200/80 p-8">
                  <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-xs font-medium text-neutral-500">ไม่พบข่าวสารในหมวดหมู่นี้</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {paginatedPosts.map((post) => (
                      <article 
                        key={post.id}
                        onClick={() => handleOpenPost(post)}
                        className="group cursor-pointer flex flex-col justify-between"
                      >
                        <div className="aspect-16/10 w-full overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-200/70 mb-4">
                          <OptimizedImage 
                            src={post.image_url || '/images/news-active-learning.jpg'} 
                            alt={post.title} 
                            width={600}
                            quality={75}
                            responsive={true}
                            className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mb-2">
                              <span className="font-medium text-neutral-900">{post.category}</span>
                              <span>•</span>
                              <span>{formatThaiDate(post.created_at)}</span>
                            </div>
                            <h4 className="font-semibold text-base text-neutral-950 group-hover:text-neutral-600 transition leading-snug line-clamp-2">
                              {post.title}
                            </h4>
                            <p className="text-xs text-neutral-500 mt-2 line-clamp-2 leading-relaxed font-normal">
                              {post.summary || post.content}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-neutral-100 text-xs font-medium text-neutral-900 flex items-center justify-between">
                            <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">อ่านต่อ <ArrowRight className="w-3.5 h-3.5" /></span>
                            <span className="text-neutral-400 font-normal flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {post.views || 0}</span>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* News Pagination Bar */}
                  {totalNewsPages > 1 && (
                    <div className="mt-12 pt-8 border-t border-neutral-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-xs text-neutral-500">
                        แสดง <span className="font-medium text-neutral-900">{(newsCurrentPage - 1) * postsPerPage + 1}</span> ถึง{' '}
                        <span className="font-medium text-neutral-900">{Math.min(newsCurrentPage * postsPerPage, filteredPosts.length)}</span> จากทั้งหมด{' '}
                        <span className="font-medium text-neutral-900">{filteredPosts.length}</span> ข่าว
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setNewsCurrentPage(p => Math.max(1, p - 1));
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          disabled={newsCurrentPage === 1}
                          className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>ก่อนหน้า</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalNewsPages }, (_, i) => i + 1).map((page) => {
                            if (
                              totalNewsPages > 7 &&
                              page !== 1 &&
                              page !== totalNewsPages &&
                              Math.abs(page - newsCurrentPage) > 1
                            ) {
                              if (page === 2 || page === totalNewsPages - 1) {
                                return <span key={page} className="px-1 text-xs text-neutral-400">...</span>;
                              }
                              return null;
                            }
                            return (
                              <button
                                key={page}
                                onClick={() => {
                                  setNewsCurrentPage(page);
                                  window.scrollTo({ top: 350, behavior: 'smooth' });
                                }}
                                className={`w-8 h-8 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-center ${
                                  newsCurrentPage === page
                                    ? 'bg-neutral-950 text-white font-semibold shadow-xs'
                                    : 'text-neutral-600 hover:bg-neutral-100 border border-transparent hover:border-neutral-200'
                                }`}
                              >
                                {page}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => {
                            setNewsCurrentPage(p => Math.min(totalNewsPages, p + 1));
                            window.scrollTo({ top: 350, behavior: 'smooth' });
                          }}
                          disabled={newsCurrentPage === totalNewsPages}
                          className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
                        >
                          <span>ถัดไป</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 5: ติดต่อเรา (CONTACT US - Apple Minimal)             */}
          {/* ========================================================= */}
          {currentPage === 'contact' && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 animate-in fade-in duration-200">
              
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                  ติดต่อสอบถาม
                </span>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-950 mt-1.5">
                  ติดต่อโรงเรียนโพนงามพิทยานุกูล
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-2">
                  ยินดีต้อนรับและพร้อมอำนวยความสะดวกแก่นักเรียน ผู้ปกครอง และประชาชน
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Contact Card */}
                <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-6">
                  <div>
                    <h4 className="font-semibold text-base text-neutral-950">
                      ข้อมูลที่ตั้งและการติดต่อ
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      สำนักงานกลุ่มอำนวยการ โรงเรียนโพนงามพิทยานุกูล
                    </p>
                  </div>

                  <div className="space-y-4 text-sm text-neutral-600">
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200/60">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-neutral-900 text-xs font-semibold uppercase tracking-wider">
                          ที่ตั้งสถานศึกษา
                        </strong>
                        <span className="text-xs sm:text-sm mt-0.5 block leading-relaxed text-neutral-600">
                          เลขที่ 3 หมู่ที่ 2 ตำบลโพนงาม อำเภอโกสุมพิสัย จังหวัดมหาสารคาม 44140
                        </span>
                        <span className="text-xs text-neutral-400 mt-0.5 block">
                          (ที่ดินสาธารณประโยชน์โคกหนองเรือ)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200/60">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-neutral-900 text-xs font-semibold uppercase tracking-wider">
                          หมายเลขโทรศัพท์
                        </strong>
                        <a href="tel:043996058" className="text-xs sm:text-sm text-neutral-950 hover:underline font-medium">
                          0-4399-6058
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200/60">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-neutral-900 text-xs font-semibold uppercase tracking-wider">
                          ไปรษณีย์อิเล็กทรอนิกส์ (อีเมล)
                        </strong>
                        <a href="mailto:44012012@ppks.ac.th" className="text-xs sm:text-sm text-neutral-950 hover:underline font-medium">
                          44012012@ppks.ac.th
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center shrink-0 border border-neutral-200/60">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-neutral-900 text-xs font-semibold uppercase tracking-wider">
                          เวลาทำการ
                        </strong>
                        <span className="text-xs sm:text-sm text-neutral-600 block">
                          จันทร์ – ศุกร์: 08:30 – 16:30 น.
                        </span>
                        <span className="text-xs text-neutral-400 block mt-0.5">
                          (เว้นวันหยุดราชการและวันหยุดนักขัตฤกษ์)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map & Directions Card */}
                <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-6">
                  <div>
                    <h4 className="font-semibold text-base text-neutral-950">
                      การเดินทางและพิกัดที่ตั้ง
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม
                    </p>

                    <div className="mt-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 text-xs text-neutral-600 leading-relaxed space-y-2">
                      <p>
                        <strong>เส้นทาง:</strong> ตั้งอยู่ริมถนนทางหลวงชนบทในตำบลโพนงาม สะดวกต่อการเดินทางเชื่อมต่อระหว่างอำเภอโกสุมพิสัย และพื้นที่ใกล้เคียง
                      </p>
                      <p>
                        <strong>เว็บไซต์ทางการ:</strong>{' '}
                        <a href="https://www.ppks.ac.th" target="_blank" rel="noopener noreferrer" className="text-neutral-950 underline font-medium">
                          www.ppks.ac.th
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=โรงเรียนโพนงามพิทยานุกูล+โกสุมพิสัย+มหาสารคาม"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <MapPin className="w-4 h-4" />
                      เปิดพิกัดนำทางบน Google Maps
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 6: DYNAMIC PAGE (FULL SITE EDITING / GUTENBERG BLOCKS) */}
          {/* ========================================================= */}
          {currentPage === 'dynamic_page' && (
            <div className="min-h-[60vh] py-12 animate-in fade-in duration-200">
              {loadingDynamicPage ? (
                <DynamicPageSkeleton />
              ) : activeDynamicPage ? (
                <div>
                  {/* Page Breadcrumbs & Meta header */}
                  <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 pb-4 border-b border-neutral-200/60">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigateTo('home')} className="hover:text-neutral-950 cursor-pointer font-medium">หน้าแรก</button>
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-neutral-900 font-medium">{activeDynamicPage.title}</span>
                      </div>
                    </div>
                  </div>

                  {/* Render Gutenberg Blocks if available */}
                  {activeDynamicPage.layout_type === 'blocks' && activeDynamicPage.layout_data ? (
                    <BlockRenderer
                      blocks={activeDynamicPage.layout_data}
                      pageId={activeDynamicPage.id}
                      onPageUpdated={() => loadDynamicPage(activeDynamicPage.slug)}
                    />
                  ) : (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 bg-white rounded-3xl border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-950 mb-6 pb-4 border-b border-neutral-100">
                        {activeDynamicPage.title}
                      </h1>
                      <div className="prose prose-neutral max-w-none text-neutral-600 whitespace-pre-line leading-relaxed text-sm sm:text-base font-normal">
                        {activeDynamicPage.content}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-xl mx-auto px-4 py-20 text-center bg-white rounded-3xl border border-neutral-200/80 shadow-xs my-10">
                  <FileText className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-neutral-900 mb-2">ไม่พบหน้าที่คุณต้องการ</h3>
                  <p className="text-xs text-neutral-500 mb-6">หน้าเพจนี้อาจยังไม่ได้รับการเผยแพร่ หรือถูกย้ายไปแล้ว</p>
                  <button 
                    onClick={() => navigateTo('home')}
                    className="px-6 py-2.5 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-medium transition cursor-pointer"
                  >
                    กลับสู่หน้าแรก
                  </button>
                </div>
              )}
            </div>
          )}

        </main>

      {/* 6. Post Reader Modal (Adaptive: Full-width Bottom Sheet on Mobile, Centered Modal on Desktop) */}
      {(readingPost || loadingPost) && (
        <div 
          className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex overflow-y-auto ${
            isMobile && !isForcedDesktop
              ? 'items-end justify-center p-0'
              : 'items-center justify-center p-3 sm:p-6 md:p-8'
          }`}
          onClick={handleClosePost}
        >
          <div 
            className={`bg-white shadow-2xl border border-neutral-200 relative animate-in fade-in duration-200 overflow-y-auto ${
              isMobile && !isForcedDesktop
                ? 'w-full rounded-t-3xl rounded-b-none max-h-[92vh] pb-8'
                : 'rounded-3xl max-w-4xl lg:max-w-5xl w-full max-h-[90vh] my-auto'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Sheet Drag Indicator */}
            {isMobile && !isForcedDesktop && (
              <div className="sticky top-0 bg-white/95 backdrop-blur-md pt-3 pb-2 z-20 flex justify-center border-b border-neutral-100">
                <div className="w-12 h-1.5 rounded-full bg-neutral-300" />
              </div>
            )}

            <button 
              onClick={handleClosePost}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-neutral-900/70 hover:bg-neutral-900 text-white flex items-center justify-center backdrop-blur-sm shadow-md transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {loadingPost && (!readingPost || !readingPost.content) ? (
              <PostDetailSkeleton />
            ) : readingPost ? (
              <>
                {readingPost.image_url && (
                  <div className="w-full max-h-[360px] sm:max-h-[440px] md:max-h-[480px] overflow-hidden bg-neutral-100 flex items-center justify-center">
                    <OptimizedImage 
                      src={readingPost.image_url} 
                      alt={readingPost.title} 
                      width={1200}
                      quality={85}
                      priority={true}
                      responsive={true}
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                )}

                <div className="p-6 sm:p-10 md:p-12 space-y-6 sm:space-y-8">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                      <span className="text-neutral-900 font-semibold bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200/60">
                        {readingPost.category}
                      </span>
                      <span>•</span>
                      <span>{formatThaiDate(readingPost.created_at)}</span>
                      <span>•</span>
                      <span>ผู้เขียน: {readingPost.author || 'โรงเรียนโพนงามพิทยานุกูล'}</span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-950 leading-snug tracking-tight">
                      {readingPost.title}
                    </h3>
                  </div>

                  {readingPost.summary && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-neutral-50 border-l-4 border-amber-500 text-neutral-800 text-sm sm:text-base leading-relaxed">
                      {readingPost.summary}
                    </div>
                  )}

                  <PostContent content={readingPost.content} />

                  <div className="pt-6 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-neutral-400">
                    <span>ยอดเข้าชม {readingPost.views || 0} ครั้ง</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleCopyPostLink(readingPost)}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-full font-medium transition cursor-pointer text-xs sm:text-sm flex items-center gap-1.5"
                        title="คัดลอกลิงก์สำหรับแชร์บน Facebook, Line"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{copiedLink ? 'คัดลอกลิงก์แล้ว!' : 'แชร์ลิงก์'}</span>
                      </button>
                      <button 
                        onClick={handleClosePost}
                        className="px-6 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full font-medium transition cursor-pointer text-xs sm:text-sm"
                      >
                        ปิด (ESC)
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* 7. Footer (Akat Clean Layout with Deep Emerald Green) */}
      <footer className={`border-t-2 border-[#10B981] bg-[#032017] py-14 px-4 sm:px-6 text-[#ECFDF5]/70 text-xs mt-auto ${isMobile && !isForcedDesktop ? 'pb-24' : ''}`}>
        <div className={`max-w-6xl mx-auto space-y-10 ${isForcedDesktop ? 'w-[1200px] min-w-[1200px]' : ''}`}>
          
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md overflow-hidden">
                <img 
                  src={stats?.logo_url || "/uploads/2026/10/1792825601083477305-ai.png"} 
                  alt={stats?.school_name || "PPKS"} 
                  className="w-full h-full object-contain" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/uploads/2026/10/1792825601083477305-ai.png';
                  }}
                />
              </div>
              <div>
                <p className="text-white font-bold text-base">
                  {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'}
                </p>
                <p className="text-[#A7F3D0] text-xs mt-0.5">
                  {stats?.school_subtitle || 'สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#ECFDF5]/80 font-medium">
              <button onClick={() => navigateTo('home')} className="hover:text-[#34D399] transition cursor-pointer">หน้าแรก</button>
              <button onClick={() => navigateTo('history')} className="hover:text-[#34D399] transition cursor-pointer">ประวัติและวิสัยทัศน์</button>
              <button onClick={() => navigateTo('page/basic-info')} className="hover:text-[#34D399] transition cursor-pointer">ข้อมูลพื้นฐาน</button>
              <button onClick={() => navigateTo('about')} className="hover:text-[#34D399] transition cursor-pointer">โครงสร้างและบุคลากร</button>
              <button onClick={() => navigateTo('eservice')} className="hover:text-[#34D399] transition cursor-pointer">ระบบ E-Service</button>
              <button onClick={() => navigateTo('news')} className="hover:text-[#34D399] transition cursor-pointer">บทความ & ข่าวสาร</button>
              <button onClick={() => navigateTo('contact')} className="hover:text-[#34D399] transition cursor-pointer">ติดต่อเรา</button>
              <button 
                onClick={() => navigateTo('admin')} 
                className="hover:text-[#34D399] text-emerald-400 font-semibold transition cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700/50"
              >
                <Lock className="w-3 h-3" />
                <span>{isAdminLoggedIn ? 'ระบบหลังบ้าน (Admin)' : 'เข้าสู่ระบบแอดมิน'}</span>
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[#ECFDF5]/50 gap-4 text-xs">
            <p>Copyright © 2026 {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'} (พ.พ.ก.)</p>
            <div className="flex items-center gap-4">
              <span>Powered by Smart School CMS</span>
              <span>•</span>
              <a href="https://www.ppks.ac.th" target="_blank" rel="noopener noreferrer" className="text-[#34D399] hover:underline font-medium">www.ppks.ac.th</a>
            </div>
          </div>

        </div>
      </footer>

      {/* Admin Login Modal (Triggered anywhere via showAdminLoginModal) */}
      {showAdminLoginModal && (
        <AdminLogin
          onClose={() => setShowAdminLoginModal(false)}
          onLoginSuccess={handleAdminLoginSuccess}
          schoolInfo={stats}
        />
      )}

      {/* Adaptive Mobile Bottom Navigation Bar (Thumb Zone) */}
      <AdaptiveBottomNav
        menuItems={menuItems}
        currentPage={currentPage}
        activeDynamicPage={activeDynamicPage}
        onNavigate={navigateTo}
        isAdminLoggedIn={isAdminLoggedIn}
        newsCount={posts?.length || 0}
      />

    </div>
  );

  if (isForcedMobile) {
    return (
      <div className="min-h-screen bg-slate-900/10 py-6 px-3 flex flex-col items-center justify-start overflow-y-auto selection:bg-[#D1FAE5] selection:text-[#065F46]">
        {/* Mobile Viewport Simulation Top Bar */}
        <div className="w-full max-w-[430px] mb-3 bg-emerald-950 text-emerald-100 text-xs py-2 px-4 rounded-2xl flex items-center justify-between shadow-md border border-emerald-800/80">
          <div className="flex items-center gap-2">
            <span>📱</span>
            <span className="font-semibold">จำลอง "มุมมองมือถือ (Mobile View)"</span>
          </div>
          <button
            onClick={() => setMode('auto')}
            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition cursor-pointer border border-emerald-500/50"
          >
            กลับสู่โหมดอัตโนมัติ
          </button>
        </div>

        <div className="w-full max-w-[430px] min-h-[90vh] bg-[#F4F8F5] text-[#334155] rounded-3xl shadow-2xl border border-slate-300/80 overflow-hidden relative flex flex-col">
          {appContent}
        </div>

        <AdaptiveModeSwitcher />
      </div>
    );
  }

  if (isForcedDesktop) {
    return (
      <div className="min-h-screen bg-slate-900/5 overflow-x-auto selection:bg-[#D1FAE5] selection:text-[#065F46]">
        <div className="w-[1200px] min-w-[1200px] mx-auto min-h-screen bg-[#F4F8F5] text-[#334155] flex flex-col shadow-xl">
          {appContent}
        </div>
        <AdaptiveModeSwitcher />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F8F5] text-[#334155] flex flex-col font-sans selection:bg-[#D1FAE5] selection:text-[#065F46]">
      {appContent}
      <AdaptiveModeSwitcher />
    </div>
  );
}
