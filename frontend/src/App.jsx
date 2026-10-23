import { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Phone, 
  Shield, 
  Eye, 
  Calendar, 
  Search, 
  ArrowRight, 
  Clock, 
  Loader2, 
  MapPin, 
  Mail, 
  Sparkles,
  BookOpen,
  Award,
  ExternalLink,
  Users,
  Building2,
  Globe,
  FileText,
  Compass,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Home,
  Bot
} from 'lucide-react';
import { fetchPosts, fetchPost, fetchStats, fetchHomepageConfig, fetchMenu, fetchPage } from './api';
import BlockRenderer from './components/BlockRenderer';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'about' | 'eservice' | 'news' | 'contact' | 'dynamic_page'
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [homepageConfig, setHomepageConfig] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [activeDynamicPage, setActiveDynamicPage] = useState(null);
  const [loadingDynamicPage, setLoadingDynamicPage] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [readingPost, setReadingPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutActiveTab, setAboutActiveTab] = useState('history'); // history | admin | teachers | vision

  // Categories list
  const categories = ['ทั้งหมด', 'วิชาการ', 'กิจกรรม'];

  const loadDynamicPage = async (slug) => {
    setLoadingDynamicPage(true);
    setCurrentPage('dynamic_page');
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

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('page/')) {
        const slug = hash.replace('page/', '');
        loadDynamicPage(slug);
      } else if (['home', 'about', 'eservice', 'news', 'contact'].includes(hash)) {
        setCurrentPage(hash);
        setActiveDynamicPage(null);
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (target) => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (!target) return;
    if (target.startsWith('/page/') || target.startsWith('page/')) {
      const slug = target.replace(/^\/?page\//, '');
      window.location.hash = 'page/' + slug;
      loadDynamicPage(slug);
    } else if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, '_blank');
    } else {
      const cleanRoute = target.replace(/^#/, '');
      setCurrentPage(cleanRoute);
      window.location.hash = cleanRoute;
      setActiveDynamicPage(null);
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
      image: '/images/hero-banner.jpg',
      manualUrl: null,
      badge: 'สมรรถนะสากล'
    }
  ];

  // 4 Core Groups
  const departmentGroups = [
    { title: 'กลุ่มบริหารงานวิชาการ', img: '/images/artboard-1.png', head: 'นายดนุพล คำชมภู' },
    { title: 'กลุ่มบริหารงานบุคคล', img: '/images/artboard-2.png', head: 'นางสุปราณี อันทรินทร์' },
    { title: 'กลุ่มบริหารงบประมาณ', img: '/images/artboard-3.png', head: 'น.ส. สุดารัตน์ กองเพชร' },
    { title: 'กลุ่มบริหารงานทั่วไป', img: '/images/artboard-4.png', head: 'นายณรงค์ศักดิ์ บัวลาด' },
  ];

  // Administration list with REAL photos
  const administrators = [
    {
      name: 'นายดนุพล คำชมภู',
      role: 'หัวหน้ากลุ่มงานวิชาการ',
      position: 'ครูชำนาญการ',
      photo: '/images/head-academic.jpg',
      group: 'กลุ่มบริหารงานวิชาการ'
    },
    {
      name: 'นางสุปราณี อันทรินทร์',
      role: 'หัวหน้ากลุ่มงานบุคคล',
      position: 'ครูชำนาญการ',
      photo: '/images/head-personnel.jpg',
      group: 'กลุ่มบริหารงานบุคคล'
    },
    {
      name: 'น.ส. สุดารัตน์ กองเพชร',
      role: 'หัวหน้ากลุ่มงานงบประมาณ',
      position: 'ครูชำนาญการ',
      photo: '/images/head-budget.jpg',
      group: 'กลุ่มบริหารงบประมาณ'
    },
    {
      name: 'นายณรงค์ศักดิ์ บัวลาด',
      role: 'หัวหน้ากลุ่มบริหารทั่วไป',
      position: 'ครูชำนาญการ',
      photo: '/images/head-general.jpg',
      group: 'กลุ่มบริหารงานทั่วไป'
    },
  ];

  // Teachers and Staff with REAL photos
  const teachers = [
    { name: 'นางสดชื่น ดวงคำน้อย', position: 'ครูชำนาญการพิเศษ', department: 'กลุ่มสาระการเรียนรู้', photo: '/images/teacher-sodchuen.jpg' },
    { name: 'นายยธิน อสุริยิน', position: 'ครูชำนาญการ', department: 'กลุ่มสาระการเรียนรู้', photo: '/images/teacher-yathin.jpg' },
    { name: 'นายปรมินทร์ อัตตะเนย์', position: 'ครูชำนาญการ', department: 'กลุ่มสาระการเรียนรู้', photo: '/images/teacher-poramin.jpg' },
    { name: 'นางสาวพัชรินทร์ โมหา', position: 'ครู ค.ศ.1', department: 'กลุ่มสาระการเรียนรู้', photo: '/images/teacher-patcharin.jpg' },
    { name: 'นายเกียรติยศ ชมเชย', position: 'ครูผู้ช่วย', department: 'กลุ่มสาระการเรียนรู้', photo: '/images/teacher-kiattiyos.jpg' },
    { name: 'นายทินกร นิลพุฒ', position: 'พนักงานราชการ', department: 'กลุ่มสาระการเรียนรู้', photo: '/images/teacher-thinnakorn.jpg' },
    { name: 'นางสาวอโนทัย พึ่งเปี่ยม', position: 'ครูอัตราจ้าง', department: 'กลุ่มสาระการเรียนรู้', photo: '/images/teacher-anothai.jpg' },
    { name: 'นายบุญเรือง ดวงสุฤทธิ์', position: 'นักการภารโรง', department: 'ฝ่ายบริการและสนับสนุน', photo: '/images/staff-boonrueng.jpg' },
  ];

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetchPosts({ limit: 50 }),
      fetchStats().catch(() => null),
      fetchHomepageConfig().catch(() => null),
      fetchMenu().catch(() => null)
    ])
      .then(([postsData, statsData, hpCfg, menuData]) => {
        if (Array.isArray(postsData)) {
          setPosts(postsData);
        }
        if (statsData) {
          setStats(statsData);
        }
        if (hpCfg) {
          setHomepageConfig(hpCfg);
        }
        if (Array.isArray(menuData) && menuData.length > 0) {
          setMenuItems(menuData);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  // Keyboard shortcut: ESC to close reading modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setReadingPost(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered posts
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'ทั้งหมด' || post.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenPost = async (post) => {
    setLoadingPost(true);
    setReadingPost(post);
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

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. Header (Clean Green & White with Official Logo) */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo & School Name */}
          <div 
            className="flex items-center gap-3.5 cursor-pointer select-none" 
            onClick={() => navigateTo('home')}
          >
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-0.5 border border-slate-100 shadow-xs shrink-0 overflow-hidden">
              <img 
                src="/images/logo.png" 
                alt="ตราสัญลักษณ์โรงเรียนโพนงามพิทยานุกูล" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/favicon.svg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                  {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200/70">
                  พ.พ.ก.
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/70">
            {(menuItems && menuItems.length > 0 ? menuItems : [
              { id: 'home', title: 'หน้าแรก', path: 'home' },
              { id: 'about', title: 'เกี่ยวกับโรงเรียน', path: 'about' },
              { id: 'eservice', title: 'ระบบ E-Service', path: 'eservice' },
              { id: 'news', title: 'ข่าวและประกาศ', path: 'news' },
              { id: 'contact', title: 'ติดต่อเรา', path: 'contact' },
            ]).map((item) => {
              const active = currentPage === item.path || 
                (currentPage === 'dynamic_page' && activeDynamicPage?.slug === item.path?.replace(/^\/?page\//, ''));
              
              const icon = item.id === 'home' ? <Home className="w-4 h-4" /> :
                item.id === 'about' ? <Building2 className="w-4 h-4" /> :
                item.id === 'eservice' ? <Globe className="w-4 h-4" /> :
                item.id === 'news' ? <Award className="w-4 h-4" /> :
                item.id === 'contact' ? <Phone className="w-4 h-4" /> :
                <FileText className="w-4 h-4 text-emerald-600" />;

              if (item.children && item.children.length > 0) {
                return (
                  <div className="relative group" key={item.id || item.path}>
                    <button
                      onClick={() => navigateTo(item.path)}
                      className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      {icon}
                      {item.title}
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition" />
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-full pt-1.5 hidden group-hover:block z-50 min-w-[210px] animate-in fade-in duration-100">
                      <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 p-1.5 space-y-0.5">
                        {item.children.map((child) => (
                          <button
                            key={child.id || child.path}
                            onClick={() => navigateTo(child.path)}
                            className="w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 flex items-center gap-2 transition cursor-pointer font-medium"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{child.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={item.id || item.path}
                  onClick={() => navigateTo(item.path)}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    active
                      ? item.id === 'eservice' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-emerald-800 shadow-xs'
                      : item.id === 'eservice' ? 'text-emerald-700 hover:text-emerald-800 hover:bg-white/50' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {icon}
                  {item.title}
                </button>
              );
            })}
          </nav>

          {/* Admin portal shortcut */}
          <div className="hidden lg:flex items-center">
            <button 
              type="button"
              onClick={() => alert('ระบบบริหารจัดการแอดมิน (Admin Portal)\nสามารถเข้าใช้งานผ่าน API หรือหลังบ้านผู้ดูแลระบบ')}
              className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5" />
              แอดมิน
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 transition cursor-pointer rounded-lg hover:bg-slate-50"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-2 shadow-lg">
            {(menuItems && menuItems.length > 0 ? menuItems : [
              { id: 'home', title: 'หน้าแรก', path: 'home' },
              { id: 'about', title: 'เกี่ยวกับโรงเรียน', path: 'about' },
              { id: 'eservice', title: 'ระบบ E-Service', path: 'eservice' },
              { id: 'news', title: 'ข่าวและประกาศ', path: 'news' },
              { id: 'contact', title: 'ติดต่อเรา', path: 'contact' },
            ]).map((item) => {
              const active = currentPage === item.path || 
                (currentPage === 'dynamic_page' && activeDynamicPage?.slug === item.path?.replace(/^\/?page\//, ''));
              return (
                <div key={item.id || item.path} className="space-y-1">
                  <button 
                    onClick={() => navigateTo(item.path)}
                    className={`block w-full text-left py-2.5 px-3 rounded-lg text-sm font-medium flex items-center justify-between ${
                      active ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span>{item.title}</span>
                    {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  {item.children && item.children.length > 0 && (
                    <div className="pl-4 space-y-1 border-l-2 border-emerald-100 ml-3 py-1">
                      {item.children.map((child) => (
                        <button
                          key={child.id || child.path}
                          onClick={() => navigateTo(child.path)}
                          className="block w-full text-left py-1.5 px-2.5 text-xs text-slate-600 hover:text-emerald-700 font-medium rounded"
                        >
                          • {child.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      {loading ? (
        <div className="max-w-4xl mx-auto px-4 py-24 flex-1 w-full space-y-8 animate-pulse text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-100 border-t-emerald-600 animate-spin mb-4"></div>
            <p className="text-sm font-medium text-slate-600">กำลังโหลดข้อมูลโรงเรียนโพนงามพิทยานุกูล...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1">

          {/* ========================================================= */}
          {/* PAGE 1: หน้าแรก (HOME)                                   */}
          {/* ========================================================= */}
          {currentPage === 'home' && (
            <div className="animate-in fade-in duration-200">
              
              {/* Optional Announcement Ticker */}
              {(homepageConfig?.show_ticker !== false) && (
                <div className="bg-emerald-800 text-white py-2 px-4 text-xs">
                  <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="bg-emerald-600 font-bold px-2 py-0.5 rounded text-[11px] shrink-0 uppercase tracking-wider">
                        ประกาศด่วน
                      </span>
                      <p className="truncate text-emerald-50">
                        {homepageConfig?.announcement || 'ขอเชิญชวนศิษย์เก่าทุกท่านร่วมลงทะเบียนเครือข่ายศิษย์เก่าออนไลน์ (PPK Alumni) เพื่อร่วมพัฒนาโรงเรียน'}
                      </p>
                    </div>
                    <button 
                      onClick={() => navigateTo('news')}
                      className="text-[11px] underline text-emerald-200 hover:text-white shrink-0 hidden sm:inline-block cursor-pointer"
                    >
                      ดูประกาศทั้งหมด
                    </button>
                  </div>
                </div>
              )}

              {/* Hero Banner with REAL photo */}
              <section className="bg-gradient-to-b from-emerald-50/60 to-white pt-10 pb-16 border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
                  
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-white rounded-full border border-emerald-200/80 shadow-2xs mb-6">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    {homepageConfig?.hero?.badge || 'ยินดีต้อนรับสู่ โรงเรียนโพนงามพิทยานุกูล (พ.พ.ก.)'}
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight mb-4 whitespace-pre-line">
                    {homepageConfig?.hero?.heading || (
                      <>
                        องค์กรคุณภาพ สืบสานศาสตร์พระราชา <br className="hidden sm:inline" />
                        <span className="text-emerald-700">จัดการศึกษาสู่ความเป็นเลิศ</span>
                      </>
                    )}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8 font-normal whitespace-pre-line">
                    {homepageConfig?.hero?.subheading || (
                      <>
                        “ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์” <br />
                        ตำบลโพนงาม อำเภอโกสุมพิสัย จังหวัดมหาสารคาม สังกัด สพม.มหาสารคาม
                      </>
                    )}
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button 
                      onClick={() => navigateTo(homepageConfig?.hero?.primary_url || 'eservice')}
                      className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition cursor-pointer shadow-sm shadow-emerald-200 flex items-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      {homepageConfig?.hero?.primary_cta || 'เข้าระบบ E-Service ออนไลน์'}
                    </button>
                    <button 
                      onClick={() => navigateTo('about')}
                      className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer shadow-2xs"
                    >
                      เกี่ยวกับโรงเรียน
                    </button>
                    <button 
                      onClick={() => navigateTo('news')}
                      className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition cursor-pointer shadow-2xs"
                    >
                      ข่าวสารและกิจกรรม
                    </button>
                  </div>

                  {/* Real School Banner Image */}
                  <div className="mt-10 rounded-2xl overflow-hidden border border-slate-200 shadow-md aspect-21/9 bg-slate-100 relative group">
                    <img 
                      src={homepageConfig?.hero?.image_url || "/images/hero-banner.jpg"} 
                      alt="โรงเรียนโพนงามพิทยานุกูล" 
                      className="w-full h-full object-cover group-hover:scale-102 transition duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6 sm:p-8 text-left">
                      <div className="text-white">
                        <span className="text-[11px] uppercase tracking-wider font-semibold text-emerald-300 bg-emerald-950/70 px-2.5 py-1 rounded-md backdrop-blur-xs">
                          อำเภอโกสุมพิสัย จังหวัดมหาสารคาม
                        </span>
                        <h3 className="text-lg sm:text-2xl font-bold mt-1.5">
                          {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'} (พ.พ.ก.)
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-200 mt-1 font-light">
                          เปิดสอนระดับมัธยมศึกษาปีที่ 1 ถึงมัธยมศึกษาปีที่ 6 บนเนื้อที่ 32 ไร่ 3 งาน 72 ตารางวา โคกหนองเรือ
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* 4 Core Groups Section (Official Artboards) */}
              <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
                <div className="text-center max-w-xl mx-auto mb-10">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                    โครงสร้างการบริหารสถานศึกษา
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                    4 กลุ่มบริหารงานโรงเรียนโพนงามพิทยานุกูล
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {departmentGroups.map((grp, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        setAboutActiveTab('admin');
                        navigateTo('about');
                      }}
                      className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-emerald-300 hover:shadow-sm transition cursor-pointer text-center group flex flex-col items-center justify-between"
                    >
                      <div className="w-20 h-20 mb-3 flex items-center justify-center p-2 rounded-xl bg-slate-50 group-hover:bg-emerald-50 transition">
                        <img 
                          src={grp.img} 
                          alt={grp.title} 
                          className="w-full h-full object-contain group-hover:scale-105 transition"
                        />
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition">
                        {grp.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {grp.head}
                      </p>
                      <span className="mt-3 text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 group-hover:underline">
                        ดูข้อมูล <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* E-Service Quick Hub */}
              <section className="py-14 bg-white border-y border-slate-200/70">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                        ระบบสารสนเทศ
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                        บริการออนไลน์ E-Service สำหรับนักเรียนและบุคลากร
                      </h3>
                    </div>
                    <button 
                      onClick={() => navigateTo('eservice')}
                      className="hidden sm:flex text-xs font-semibold text-emerald-700 hover:text-emerald-800 items-center gap-1 cursor-pointer bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/60"
                    >
                      ดูระบบทั้งหมด ({eServices.length}) <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {eServices.slice(0, 3).map((srv) => (
                      <div 
                        key={srv.id}
                        className="bg-slate-50/70 rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-300 hover:shadow-xs transition flex flex-col justify-between"
                      >
                        <div className="aspect-16/7 w-full overflow-hidden bg-slate-200 border-b border-slate-100">
                          <img 
                            src={srv.image} 
                            alt={srv.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
                              {srv.badge}
                            </span>
                            <h4 className="font-bold text-sm text-slate-900 mt-2 leading-snug">
                              {srv.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {srv.desc}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                            <a 
                              href={srv.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            >
                              เข้าสู่ระบบ <ExternalLink className="w-3 h-3" />
                            </a>
                            {srv.manualUrl && (
                              <a 
                                href={srv.manualUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-slate-600 hover:text-emerald-700 underline flex items-center gap-1"
                              >
                                <FileText className="w-3 h-3" /> คู่มือ
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 text-center sm:hidden">
                    <button 
                      onClick={() => navigateTo('eservice')}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      ดูระบบ E-Service ทั้งหมด ({eServices.length}) →
                    </button>
                  </div>
                </div>
              </section>

              {/* Latest News Highlight (3 cards) */}
              <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                      ข่าวประชาสัมพันธ์
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                      ข่าวและกิจกรรมล่าสุด
                    </h3>
                  </div>
                  <button 
                    onClick={() => navigateTo('news')}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    ดูข่าวทั้งหมด ({posts.length}) →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {posts.slice(0, 3).map((post) => (
                    <article 
                      key={post.id}
                      onClick={() => handleOpenPost(post)}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="aspect-16/10 w-full overflow-hidden bg-slate-100">
                        <img 
                          src={post.image_url || '/images/hero-banner.jpg'} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                            <span className="text-emerald-700 font-semibold">{post.category}</span>
                            <span>•</span>
                            <span>{formatThaiDate(post.created_at)}</span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition leading-snug line-clamp-2">
                            {post.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                            {post.summary || post.content}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                          อ่านต่อ <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              {/* Optional Custom Homepage Blocks Rendered from MCP / Site Editor */}
              {homepageConfig?.custom_blocks && (
                <div className="py-6">
                  <BlockRenderer blocks={homepageConfig.custom_blocks} />
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 2: เกี่ยวกับโรงเรียน (ABOUT SCHOOL - DEDICATED PAGE) */}
          {/* ========================================================= */}
          {currentPage === 'about' && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 animate-in fade-in duration-200">
              
              {/* Header Title */}
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                  เกี่ยวกับโรงเรียน
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  ข้อมูลพื้นฐานและประวัติโรงเรียนโพนงามพิทยานุกูล
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม
                </p>
              </div>

              {/* Subtabs */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-10 border-b border-slate-200 pb-4">
                <button
                  onClick={() => setAboutActiveTab('history')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
                    aboutActiveTab === 'history'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  ประวัติความเป็นมา
                </button>
                <button
                  onClick={() => setAboutActiveTab('admin')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
                    aboutActiveTab === 'admin'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  คณะผู้บริหาร & กลุ่มงาน
                </button>
                <button
                  onClick={() => setAboutActiveTab('teachers')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
                    aboutActiveTab === 'teachers'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  คณะครูและบุคลากร
                </button>
                <button
                  onClick={() => setAboutActiveTab('vision')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center gap-2 ${
                    aboutActiveTab === 'vision'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  วิสัยทัศน์ & PPK Model
                </button>
              </div>

              {/* Subtab 1: History */}
              {aboutActiveTab === 'history' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 space-y-8 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="w-24 h-24 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 shrink-0">
                      <img src="/images/logo.png" alt="PPKS Logo" className="w-full h-full object-contain" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                        ประวัติความเป็นมา โรงเรียนโพนงามพิทยานุกูล
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        จุดเริ่มต้นจากการมีส่วนร่วมของชุมชนตำบลโพนงาม และกรมสามัญศึกษา
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                    <p>
                      <strong>จุดเริ่มต้น (พ.ศ. 2534):</strong> โรงเรียนโพนงามพิทยานุกูล เดิมมีฐานะเป็น <strong>“สาขาโรงเรียนโกสุมวิทยาสรรค์”</strong> จัดตั้งขึ้นตามนโยบายของกรมสามัญศึกษาในขณะนั้น ที่ต้องการขยายโอกาสทางการศึกษาไปสู่ตำบลห่างไกล เพื่อให้เด็กนักเรียนในชุมชนมีโรงเรียนมัธยมศึกษาประจำตำบล
                    </p>
                    <p>
                      โดยในปี พ.ศ. 2534 นายณรงค์ จันทชุม ผู้อำนวยการโรงเรียนโกสุมวิทยาสรรค์ในขณะนั้น ได้มอบหมายให้คณะครูประชุมร่วมกับผู้นำชุมชน นำโดย <strong>นายวินัย สมศรีลัย</strong> กำนันตำบลโพนงาม พร้อมด้วยผู้ใหญ่บ้าน มีมติเห็นชอบร่วมกันในการใช้พื้นที่ดินสาธารณประโยชน์ <strong>“โคกหนองเรือ”</strong> เนื้อที่รวม <strong>32 ไร่ 3 งาน 72 ตารางวา</strong> ตั้งอยู่เลขที่ 3 หมู่ที่ 2 ตำบลโพนงาม อำเภอโกสุมพิสัย จังหวัดมหาสารคาม เพื่อเป็นสถานที่ก่อตั้งโรงเรียน
                    </p>
                    <p>
                      <strong>ยกฐานะเป็นโรงเรียนเอกเทศ (3 กุมภาพันธ์ พ.ศ. 2538):</strong> ต่อมาได้รับอนุมัติจากกรมสามัญศึกษา กระทรวงศึกษาธิการ ให้ยกฐานะเป็นโรงเรียนเอกเทศอย่างเป็นทางการ เมื่อวันที่ <strong>3 กุมภาพันธ์ พ.ศ. 2538</strong> (ตามคำสั่งกรมสามัญศึกษาที่ 391/2538) และใช้ชื่อว่า <strong>“โรงเรียนโพนงามพิทยานุกูล”</strong> โดยมีอักษรย่อว่า <strong>“พ.พ.ก.”</strong> นับแต่นั้นเป็นต้นมา
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-center">
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <div className="text-2xl font-extrabold text-emerald-800">พ.ศ. 2534</div>
                      <div className="text-xs text-slate-600 mt-1">เริ่มจัดตั้งสาขาโรงเรียน</div>
                    </div>
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <div className="text-2xl font-extrabold text-emerald-800">3 ก.พ. 2538</div>
                      <div className="text-xs text-slate-600 mt-1">ยกฐานะเป็นโรงเรียนเอกเทศ</div>
                    </div>
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <div className="text-2xl font-extrabold text-emerald-800">32 ไร่ 3 งาน</div>
                      <div className="text-xs text-slate-600 mt-1">ที่ดินโคกหนองเรือ ต.โพนงาม</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 2: Executive & Department Heads with REAL Photos */}
              {aboutActiveTab === 'admin' && (
                <div className="space-y-8">
                  {/* Director Card with REAL Photo */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 shadow-xs text-center sm:text-left">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-emerald-600 shadow-sm shrink-0 bg-slate-100">
                      <img 
                        src="/images/director.jpg" 
                        alt="นายวัชรินทร์ ติดวงษา ผู้อำนวยการโรงเรียน" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
                        ผู้อำนวยการสถานศึกษา
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                        นายวัชรินทร์ ติดวงษา
                      </h3>
                      <p className="text-sm text-emerald-700 font-medium mt-0.5">
                        ผู้อำนวยการโรงเรียนโพนงามพิทยานุกูล
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        วิทยฐานะชำนาญการพิเศษ • สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม
                      </p>
                    </div>
                  </div>

                  {/* 4 Department Heads with REAL Photos */}
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      หัวหน้ากลุ่มบริหารงาน 4 ฝ่าย
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {administrators.map((adm, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:border-emerald-300 transition shadow-2xs">
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                            <img 
                              src={adm.photo} 
                              alt={adm.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              {adm.group}
                            </span>
                            <h5 className="font-bold text-sm sm:text-base text-slate-900 mt-1">
                              {adm.name}
                            </h5>
                            <p className="text-xs text-slate-600 mt-0.5 font-medium">
                              {adm.role}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {adm.position}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 3: Teachers & Staff with REAL Photos */}
              {aboutActiveTab === 'teachers' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-lg text-slate-900">คณะครูและบุคลากรทางการศึกษา</h4>
                      <p className="text-xs text-slate-500">โรงเรียนโพนงามพิทยานุกูล อำเภอโกสุมพิสัย</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md">
                      รวม {teachers.length} ท่าน
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {teachers.map((t, idx) => (
                      <div key={idx} className="bg-slate-50/60 rounded-xl border border-slate-200/80 p-3.5 text-center hover:border-emerald-300 transition group flex flex-col justify-between">
                        <div>
                          <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-xl overflow-hidden bg-white border border-slate-200 mb-3 shadow-2xs">
                            <img 
                              src={t.photo} 
                              alt={t.name} 
                              className="w-full h-full object-cover group-hover:scale-103 transition"
                            />
                          </div>
                          <h5 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
                            {t.name}
                          </h5>
                          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                            {t.position}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                          {t.department}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 4: Vision & PPK Team Model */}
              {aboutActiveTab === 'vision' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-7 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Compass className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-lg text-slate-900">วิสัยทัศน์ (Vision)</h4>
                      <p className="text-slate-800 text-sm leading-relaxed font-medium bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                        “เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ” <br />
                        <span className="text-xs text-slate-500 mt-1 block font-mono font-normal">
                          (Quality Organization to Excellent Education)
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed font-normal">
                        มุ่งเน้นการยกระดับผลสัมฤทธิ์ทางการศึกษาและการปลูกฝังคุณธรรม จริยธรรมตามศาสตร์พระราชา
                      </p>
                    </div>

                    <div className="bg-white p-7 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-lg text-slate-900">คำขวัญ & เอกลักษณ์ประจำโรงเรียน</h4>
                      <p className="text-slate-800 text-sm leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        “ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์”
                      </p>
                      <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                        <p><strong>• อักษรย่อ:</strong> พ.พ.ก.</p>
                        <p><strong>• การจัดการเรียนการสอน:</strong> ชั้นมัธยมศึกษาปีที่ 1 - 6</p>
                        <p><strong>• สังกัด:</strong> สพม. มหาสารคาม</p>
                      </div>
                    </div>
                  </div>

                  {/* PPK Team Model Infographic with REAL asset */}
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
                    <h4 className="font-bold text-base text-slate-900 mb-2">
                      รูปแบบการบริหารสถานศึกษา: PPK TEAM MODEL
                    </h4>
                    <p className="text-xs text-slate-500 mb-6">
                      นวัตกรรมการบริหารงานแบบมีส่วนร่วม โรงเรียนโพนงามพิทยานุกูล
                    </p>
                    <div className="rounded-xl overflow-hidden border border-slate-100 max-w-2xl mx-auto bg-slate-50">
                      <img 
                        src="/images/ppk-team-model.png" 
                        alt="PPK Team Model" 
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 3: ระบบสารสนเทศ E-SERVICE (DEDICATED PAGE)           */}
          {/* ========================================================= */}
          {currentPage === 'eservice' && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 animate-in fade-in duration-200">
              
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                  ระบบสารสนเทศดิจิทัล
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  ระบบบริการอิเล็กทรอนิกส์ (E-Service)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  บริการออนไลน์ครบวงจรสำหรับนักเรียน ครู ผู้ปกครอง ศิษย์เก่า และประชาชน
                </p>
              </div>

              {/* 6 E-Services Cards with REAL Banners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {eServices.map((service) => (
                  <div 
                    key={service.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-emerald-300 hover:shadow-md transition duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Real Banner Image */}
                      <div className="aspect-16/7 w-full overflow-hidden bg-slate-100 border-b border-slate-100 relative">
                        <img 
                          src={service.image} 
                          alt={service.title} 
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 right-3 text-[10px] font-semibold text-emerald-800 bg-white/95 px-2.5 py-1 rounded-md shadow-2xs">
                          {service.badge}
                        </span>
                      </div>

                      <div className="p-6">
                        <span className="text-xs font-medium text-slate-400">
                          {service.category}
                        </span>
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 mt-1 leading-snug">
                          {service.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed font-normal">
                          {service.desc}
                        </p>
                      </div>
                    </div>

                    <div className="p-6 pt-0 flex items-center justify-between gap-3 border-t border-slate-100 mt-4 pt-4">
                      <a 
                        href={service.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        เข้าใช้งานระบบ
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      {service.manualUrl ? (
                        <a 
                          href={service.manualUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          ดาวน์โหลดคู่มือ
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">เปิดบริการ 24 ชม.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 4: ข่าวและประกาศ (NEWS - DEDICATED PAGE)              */}
          {/* ========================================================= */}
          {currentPage === 'news' && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 animate-in fade-in duration-200">
              
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                  ข่าวสารและกิจกรรม
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  ข่าวและประกาศโรงเรียนโพนงามพิทยานุกูล
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  ติดตามผลงานวิชาการ ประกาศทางการ และกิจกรรมสำคัญ
                </p>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        selectedCategory === cat 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาหัวข้อข่าว..."
                    className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-emerald-500 focus:bg-white w-full transition"
                  />
                </div>
              </div>

              {/* Posts Grid */}
              {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map((post) => (
                    <article 
                      key={post.id}
                      onClick={() => handleOpenPost(post)}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-emerald-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="aspect-16/10 w-full overflow-hidden bg-slate-100">
                        <img 
                          src={post.image_url || '/images/hero-banner.jpg'} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                        />
                      </div>
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                              {post.category}
                            </span>
                            <span>•</span>
                            <span>{formatThaiDate(post.created_at)}</span>
                          </div>
                          <h4 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition leading-snug line-clamp-2">
                            {post.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-3 leading-relaxed font-normal">
                            {post.summary || post.content}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            อ่านต่อ <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                          <span className="text-[11px] text-slate-400 font-normal">
                            {post.views || 0} views
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
                  ไม่พบข้อมูลข่าวสารที่ตรงกับเงื่อนไขการค้นหา
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 5: ติดต่อเรา (CONTACT US - DEDICATED PAGE)           */}
          {/* ========================================================= */}
          {currentPage === 'contact' && (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 animate-in fade-in duration-200">
              
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60">
                  ติดต่อสอบถาม
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  ติดต่อโรงเรียนโพนงามพิทยานุกูล
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  ยินดีต้อนรับและพร้อมอำนวยความสะดวกแก่นักเรียน ผู้ปกครอง และประชาชน
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Contact Card */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900">
                      ข้อมูลที่ตั้งและการติดต่อ
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      สำนักงานกลุ่มอำนวยการ โรงเรียนโพนงามพิทยานุกูล
                    </p>
                  </div>

                  <div className="space-y-4 text-sm text-slate-700">
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-slate-900 text-xs font-semibold uppercase tracking-wider">
                          ที่ตั้งสถานศึกษา
                        </strong>
                        <span className="text-sm mt-0.5 block leading-relaxed">
                          เลขที่ 3 หมู่ที่ 2 ตำบลโพนงาม อำเภอโกสุมพิสัย จังหวัดมหาสารคาม 44140
                        </span>
                        <span className="text-xs text-slate-400 mt-0.5 block">
                          (ที่ดินสาธารณประโยชน์โคกหนองเรือ)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-slate-900 text-xs font-semibold uppercase tracking-wider">
                          หมายเลขโทรศัพท์
                        </strong>
                        <a href="tel:043996058" className="text-sm text-emerald-700 hover:underline font-medium">
                          0-4399-6058
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-slate-900 text-xs font-semibold uppercase tracking-wider">
                          ไปรษณีย์อิเล็กทรอนิกส์ (อีเมล)
                        </strong>
                        <a href="mailto:44012012@ppks.ac.th" className="text-sm text-emerald-700 hover:underline font-medium">
                          44012012@ppks.ac.th
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="block text-slate-900 text-xs font-semibold uppercase tracking-wider">
                          เวลาทำการ
                        </strong>
                        <span className="text-sm">
                          จันทร์ – ศุกร์: 08:30 – 16:30 น.
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          (เว้นวันหยุดราชการและวันหยุดนักขัตฤกษ์)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Map & Directions Card */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900">
                      การเดินทางและพิกัดที่ตั้ง
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม
                    </p>

                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                      <p>
                        <strong>เส้นทาง:</strong> ตั้งอยู่ริมถนนทางหลวงชนบทในตำบลโพนงาม สะดวกต่อการเดินทางเชื่อมต่อระหว่างอำเภอโกสุมพิสัย และพื้นที่ใกล้เคียง
                      </p>
                      <p>
                        <strong>เว็บไซต์ทางการ:</strong>{' '}
                        <a href="https://www.ppks.ac.th" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-medium">
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
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-200"
                    >
                      <MapPin className="w-4 h-4" />
                      เปิดพิกัดนำทางบน Google Maps
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <p className="text-[11px] text-slate-400 text-center">
                      * สามารถใช้ Google Maps ค้นหา "โรงเรียนโพนงามพิทยานุกูล" เพื่อนำทางด้วย GPS
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 6: DYNAMIC PAGE (FULL SITE EDITING / GUTENBERG BLOCKS) */}
          {/* ========================================================= */}
          {currentPage === 'dynamic_page' && (
            <div className="min-h-[60vh] py-10 animate-in fade-in duration-200">
              {loadingDynamicPage ? (
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                  <p className="text-sm font-medium text-slate-600">กำลังโหลดเนื้อหาหน้าเพจ...</p>
                </div>
              ) : activeDynamicPage ? (
                <div>
                  {/* Page Breadcrumbs & Meta header */}
                  <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pb-4 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigateTo('home')} className="hover:text-emerald-700 cursor-pointer font-medium">หน้าแรก</button>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-800 font-semibold">{activeDynamicPage.title}</span>
                      </div>
                      {activeDynamicPage.created_by_agent && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <Bot className="w-3.5 h-3.5 text-emerald-600" />
                          ออกแบบโดย {activeDynamicPage.agent_name || 'AI Webmaster'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Render Gutenberg Blocks if available */}
                  {activeDynamicPage.layout_type === 'blocks' && activeDynamicPage.layout_data ? (
                    <BlockRenderer blocks={activeDynamicPage.layout_data} />
                  ) : (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 bg-white rounded-2xl border border-slate-200 shadow-xs">
                      <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mb-6 pb-4 border-b border-slate-100">
                        {activeDynamicPage.title}
                      </h1>
                      <div className="prose prose-slate prose-emerald max-w-none text-slate-700 whitespace-pre-line leading-relaxed text-sm sm:text-base">
                        {activeDynamicPage.content}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-xl mx-auto px-4 py-20 text-center bg-white rounded-2xl border border-slate-200 shadow-xs my-10">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-800 mb-2">ไม่พบหน้าที่คุณต้องการ</h3>
                  <p className="text-sm text-slate-500 mb-6">หน้าเพจนี้อาจยังไม่ได้รับการเผยแพร่ หรือถูกย้ายไปแล้ว</p>
                  <button 
                    onClick={() => navigateTo('home')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition shadow-xs cursor-pointer"
                  >
                    กลับสู่หน้าแรก
                  </button>
                </div>
              )}
            </div>
          )}

        </main>
      )}

      {/* 6. Post Reader Modal */}
      {readingPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setReadingPost(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-xl border border-slate-200 relative my-auto animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingPost && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-white/95 rounded-full text-xs text-slate-600 border border-slate-200">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                กำลังโหลด...
              </div>
            )}

            <button 
              onClick={() => setReadingPost(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {readingPost.image_url && (
              <div className="aspect-16/9 w-full overflow-hidden bg-slate-100">
                <img 
                  src={readingPost.image_url} 
                  alt={readingPost.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 sm:p-10 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    {readingPost.category}
                  </span>
                  <span>•</span>
                  <span>{formatThaiDate(readingPost.created_at)}</span>
                  <span>•</span>
                  <span>ผู้เขียน: {readingPost.author || 'โรงเรียนโพนงามพิทยานุกูล'}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {readingPost.title}
                </h3>
              </div>

              {readingPost.summary && (
                <div className="p-4 rounded-xl bg-slate-50 border-l-3 border-emerald-600 text-slate-700 text-sm sm:text-base leading-relaxed font-medium">
                  {readingPost.summary}
                </div>
              )}

              <div className="text-slate-700 text-sm sm:text-base leading-loose whitespace-pre-line font-normal">
                {readingPost.content}
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>ยอดเข้าชม {readingPost.views || 0} ครั้ง</span>
                <button 
                  onClick={() => setReadingPost(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
                >
                  ปิด (ESC)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 text-slate-400 text-xs mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 p-0.5 flex items-center justify-center shrink-0">
              <img src="/images/logo.png" alt="PPKS" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-slate-800 font-bold text-sm">
                {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'} (พ.พ.ก.)
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
            <button onClick={() => navigateTo('home')} className="hover:text-emerald-700">หน้าแรก</button>
            <button onClick={() => navigateTo('about')} className="hover:text-emerald-700">เกี่ยวกับโรงเรียน</button>
            <button onClick={() => navigateTo('eservice')} className="hover:text-emerald-700">E-Service</button>
            <button onClick={() => navigateTo('news')} className="hover:text-emerald-700">ข่าวสาร</button>
            <button onClick={() => navigateTo('contact')} className="hover:text-emerald-700">ติดต่อเรา</button>
          </div>

          <div className="text-slate-400 text-xs space-y-1">
            <p>เว็บไซต์ทางการ: <a href="https://www.ppks.ac.th" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700 underline font-medium">www.ppks.ac.th</a></p>
            <p>© 2026 โรงเรียนโพนงามพิทยานุกูล All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
