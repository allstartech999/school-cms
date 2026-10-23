import { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Menu, 
  X, 
  Phone, 
  Shield, 
  Eye, 
  Calendar, 
  Search, 
  ArrowRight, 
  User, 
  Clock, 
  Loader2, 
  MapPin, 
  Mail, 
  Sparkles,
  BookOpen,
  Award,
  Layers,
  ExternalLink,
  Users,
  Building2,
  Globe,
  FileText,
  Compass,
  CheckCircle2,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { fetchPosts, fetchPost, fetchStats, fetchPages, fetchPage } from './api';
import BlockRenderer from './components/BlockRenderer';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagesList, setPagesList] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [pagesDropdownOpen, setPagesDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [readingPost, setReadingPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutActiveTab, setAboutActiveTab] = useState('history'); // history | admin | teachers | vision

  // Categories list
  const categories = ['ทั้งหมด', 'วิชาการ', 'กิจกรรม'];

  // E-Services data from ppks.ac.th
  const eServices = [
    {
      id: 'sgs',
      title: 'ระบบ SGS ประเมินผลการเรียนออนไลน์',
      category: 'นักเรียน / ผู้ปกครอง / ครู',
      desc: 'ระบบ Secondary Grading System (สพฐ.) ตรวจสอบผลการเรียน บันทึกคะแนน และติดตามพัฒนาการเรียนรู้',
      url: 'https://sgs.bopp-obec.info/',
      manualUrl: 'https://sgs.bopp-obec.info/Data/Manual.zip',
      icon: Award,
      badge: 'สพฐ. OBEC',
      color: 'emerald'
    },
    {
      id: 'alumni',
      title: 'ระบบเครือข่ายทำเนียบศิษย์เก่า (PPK Alumni)',
      category: 'ศิษย์เก่า & ชุมชน',
      desc: 'เครือข่ายฐานข้อมูลศิษย์เก่าโรงเรียนโพนงามพิทยานุกูลทุกรุ่น เพื่อการติดต่อสื่อสารและร่วมพัฒนาสถานศึกษา',
      url: 'https://alumni.ppks.ac.th/',
      manualUrl: 'https://www.ppks.ac.th/%e0%b8%84%e0%b8%b9%e0%b9%88%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%81%e0%b8%b2%e0%b8%a3%e0%b9%83%e0%b8%8a%e0%b9%89%e0%b8%87%e0%b8%b2%e0%b8%99-%e0%b8%a3%e0%b8%b0%e0%b8%9a%e0%b8%9a%e0%b8%97%e0%b8%b3',
      icon: Users,
      badge: 'เครือข่ายศิษย์เก่า',
      color: 'teal'
    },
    {
      id: 'semarak',
      title: 'ตู้เสมารักษ์ (ร้องเรียน & ข้อเสนอแนะ)',
      category: 'บริการประชาชน & ITA',
      desc: 'ช่องทางออนไลน์สำหรับนักเรียน ผู้ปกครอง และประชาชนในการส่งข้อเสนอแนะ ร้องเรียน หรือสอบถามข้อมูลอย่างโปร่งใส',
      url: 'https://www.ppks.ac.th/?page_id=768',
      manualUrl: 'https://www.ppks.ac.th/%e0%b8%84%e0%b8%b9%e0%b9%88%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%81%e0%b8%b2%e0%b8%a3%e0%b9%83%e0%b8%8a%e0%b9%89%e0%b8%87%e0%b8%b2%e0%b8%99-%e0%b8%95%e0%b8%b9%e0%b9%89%e0%b9%80%e0%b8%aa%e0%b8%a1',
      icon: Shield,
      badge: 'ITA โปร่งใส',
      color: 'blue'
    },
    {
      id: 'pp5',
      title: 'ระบบ ปพ.5 ออนไลน์ (PP5 Online)',
      category: 'ครูและบุคลากร',
      desc: 'ระบบประเมินผลและบันทึกคะแนนคุณภาพผู้เรียน เอกสาร ปพ.5 ออนไลน์ สำหรับคุณครูผู้สอนทุกกลุ่มสาระฯ',
      url: 'https://pp5.ppks.ac.th/',
      manualUrl: null,
      icon: FileText,
      badge: 'ระบบภายในโรงเรียน',
      color: 'indigo'
    },
    {
      id: 'pp1',
      title: 'ระบบ ปพ.1 ออนไลน์ (PP1 Online)',
      category: 'งานทะเบียนและวัดผล',
      desc: 'ระบบบริหารจัดการและจัดทำระเบียนแสดงผลการเรียน ปพ.1 เพื่อการออกหลักฐานทางการศึกษาที่ถูกต้องรวดเร็ว',
      url: 'https://pp1.ppks.ac.th',
      manualUrl: null,
      icon: BookOpen,
      badge: 'งานทะเบียนวัดผล',
      color: 'emerald'
    },
    {
      id: 'pisa',
      title: 'ระบบเตรียมความพร้อม PISA สพฐ.',
      category: 'วิชาการ & นักเรียน',
      desc: 'ระบบส่งเสริมและประเมินสมรรถนะความฉลาดรู้ PISA สำหรับนักเรียนมัธยมศึกษา สพม.มหาสารคาม',
      url: 'https://pisa.ppks.ac.th/',
      manualUrl: null,
      icon: Sparkles,
      badge: 'สมรรถนะสากล',
      color: 'amber'
    }
  ];

  // Administration and Teachers list from ppks.ac.th
  const administrators = [
    { name: 'นายวัชรินทร์ ติดวงษา', role: 'ผู้อำนวยการโรงเรียน', group: 'ผู้บริหารสถานศึกษา' },
    { name: 'นายดนุพล คำชมภู', role: 'หัวหน้ากลุ่มงานวิชาการ (ครูชำนาญการ)', group: 'กลุ่มบริหารงานวิชาการ' },
    { name: 'นางสุปราณี อันทรินทร์', role: 'หัวหน้ากลุ่มงานบุคคล (ครูชำนาญการ)', group: 'กลุ่มบริหารงานบุคคล' },
    { name: 'น.ส. สุดารัตน์ กองเพชร', role: 'หัวหน้ากลุ่มงานงบประมาณ (ครูชำนาญการ)', group: 'กลุ่มบริหารงานงบประมาณ' },
    { name: 'นายณรงค์ศักดิ์ บัวลาด', role: 'หัวหน้ากลุ่มบริหารทั่วไป (ครูชำนาญการ)', group: 'กลุ่มบริหารทั่วไป' },
  ];

  const teachers = [
    { name: 'นางสดชื่น ดวงคำน้อย', position: 'ครูชำนาญการพิเศษ', department: 'กลุ่มสาระการเรียนรู้' },
    { name: 'นายยธิน อสุริยิน', position: 'ครูชำนาญการ', department: 'กลุ่มสาระการเรียนรู้' },
    { name: 'นายปรมินทร์ อัตตะเนย์', position: 'ครูชำนาญการ', department: 'กลุ่มสาระการเรียนรู้' },
    { name: 'นางสาวพัชรินทร์ โมหา', position: 'ครู ค.ศ.1', department: 'กลุ่มสาระการเรียนรู้' },
    { name: 'นายเกียรติยศ ชมเชย', position: 'ครูผู้ช่วย', department: 'กลุ่มสาระการเรียนรู้' },
    { name: 'นายทินกร นิลพุฒ', position: 'พนักงานราชการ', department: 'กลุ่มสาระการเรียนรู้' },
    { name: 'นางสาวอโนทัย พึ่งเปี่ยม', position: 'ครูอัตราจ้าง', department: 'กลุ่มสาระการเรียนรู้' },
    { name: 'นายบุญเรือง ดวงสุฤทธิ์', position: 'นักการภารโรง', department: 'ฝ่ายบริการและสนับสนุน' },
  ];

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetchPosts({ limit: 50 }),
      fetchStats().catch(() => null),
      fetchPages().catch(() => [])
    ])
      .then(([postsData, statsData, pagesData]) => {
        if (Array.isArray(postsData)) {
          setPosts(postsData);
        }
        if (statsData) {
          setStats(statsData);
        }
        if (Array.isArray(pagesData)) {
          setPagesList(pagesData);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  // Listen to URL hash for deep linking (e.g. #page/slug)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#page/')) {
        const slug = hash.replace('#page/', '');
        if (slug) {
          loadPageBySlug(slug);
        }
      } else if (!hash || hash === '#home') {
        setActivePage(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const loadPageBySlug = async (slug) => {
    setLoadingPage(true);
    setMobileMenuOpen(false);
    setPagesDropdownOpen(false);
    try {
      const page = await fetchPage(slug);
      setActivePage(page);
      window.location.hash = `page/${slug}`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error fetching page:', err);
    } finally {
      setLoadingPage(false);
    }
  };

  const goHome = () => {
    setActivePage(null);
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Filtered posts for the grid
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'ทั้งหมด' || post.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Open reading modal and fetch full post details
  const handleOpenPost = async (post) => {
    setLoadingPost(true);
    setReadingPost(post);
    try {
      const fullPost = await fetchPost(post.id || post.slug);
      setReadingPost(fullPost);
      // update local view count
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views: (p.views || 0) + 1 } : p));
    } catch (err) {
      console.error('Error opening post:', err);
    } finally {
      setLoadingPost(false);
    }
  };

  // Helper to scroll smoothly to section
  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    setPagesDropdownOpen(false);
    if (activePage) {
      setActivePage(null);
      window.location.hash = '';
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          const offset = 80;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const offsetPosition = elementRect - bodyRect - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const offsetPosition = elementRect - bodyRect - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper to format Thai date
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
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. Header (Clean Green & White) */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo & School Name */}
          <div 
            className="flex items-center gap-3.5 cursor-pointer select-none" 
            onClick={() => scrollToSection('home')}
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-emerald-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">
                  {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200/60">
                  พ.พ.ก.
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <button 
              onClick={() => scrollToSection('home')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition cursor-pointer"
            >
              หน้าแรก
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition cursor-pointer"
            >
              เกี่ยวกับโรงเรียน
            </button>
            <button 
              onClick={() => scrollToSection('eservice')}
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 transition cursor-pointer font-semibold flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4 text-emerald-600" />
              E-Service
            </button>
            <button 
              onClick={() => scrollToSection('news')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition cursor-pointer"
            >
              ข่าวและประกาศ
            </button>

            {/* Dynamic Pages / Curriculums Menu */}
            {pagesList.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setPagesDropdownOpen(!pagesDropdownOpen)}
                  className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition cursor-pointer flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>หลักสูตร & หน้าเพจ</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                    {pagesList.length}
                  </span>
                </button>

                {pagesDropdownOpen && (
                  <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95">
                    {pagesList.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => loadPageBySlug(p.slug)}
                        className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 text-xs sm:text-sm text-slate-700 hover:text-emerald-800 transition flex items-center justify-between group"
                      >
                        <span className="truncate group-hover:font-semibold">{p.title}</span>
                        {p.created_by_agent && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                            AI
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={() => scrollToSection('contact')}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition cursor-pointer"
            >
              ติดต่อเรา
            </button>

            <button 
              type="button"
              onClick={() => alert('ระบบบริหารจัดการแอดมิน (Admin Portal)\nสามารถเข้าใช้งานผ่าน API หรือหลังบ้านผู้ดูแลระบบ')}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              เจ้าหน้าที่
            </button>
          </nav>

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
          <div className="lg:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-3 shadow-lg">
            <button 
              onClick={() => scrollToSection('home')}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
            >
              หน้าแรก
            </button>
            <button 
              onClick={() => scrollToSection('about')}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
            >
              เกี่ยวกับโรงเรียน
            </button>
            <button 
              onClick={() => scrollToSection('eservice')}
              className="block w-full text-left py-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              ระบบสารสนเทศ (E-Service)
            </button>
            <button 
              onClick={() => scrollToSection('news')}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
            >
              ข่าวสารและกิจกรรม
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left py-2 text-sm font-medium text-slate-700 hover:text-emerald-600"
            >
              ติดต่อเรา
            </button>

            {pagesList.length > 0 && (
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  หลักสูตรและหน้าเพจพิเศษ ({pagesList.length})
                </div>
                {pagesList.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadPageBySlug(p.slug)}
                    className="block w-full text-left py-1.5 text-xs font-medium text-slate-700 hover:text-emerald-700 truncate"
                  >
                    • {p.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      {/* Loading Wrapper */}
      {loading ? (
        <div className="max-w-4xl mx-auto px-4 py-24 flex-1 w-full space-y-8 animate-pulse text-center">
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-emerald-100 border-t-emerald-600 animate-spin mb-4"></div>
            <p className="text-sm font-medium text-slate-600">กำลังโหลดข้อมูลโรงเรียน...</p>
          </div>
          <div className="h-64 rounded-2xl bg-slate-100"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="h-48 rounded-xl bg-slate-100"></div>
            <div className="h-48 rounded-xl bg-slate-100"></div>
            <div className="h-48 rounded-xl bg-slate-100"></div>
          </div>
        </div>
      ) : activePage ? (
        /* Dynamic Page View (Block-Based & Markdown with Clean Green-White Theme) */
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full animate-in fade-in duration-200">
          {/* Breadcrumb & Navigation Topbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-100">
            <button
              onClick={goHome}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-sm font-semibold transition cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              <span>กลับสู่หน้าหลัก</span>
            </button>

            <div className="flex items-center gap-3">
              {activePage.created_by_agent && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>AI Generated Page ({activePage.agent_name || 'AI Assistant'})</span>
                </span>
              )}
              <span className="text-xs text-slate-400">
                อัปเดต: {formatThaiDate(activePage.updated_at || activePage.created_at)}
              </span>
            </div>
          </div>

          {/* Dynamic Block Layout or Plain Content Fallback */}
          {activePage.layout_type === 'blocks' && activePage.layout_data ? (
            <BlockRenderer blocks={activePage.layout_data} />
          ) : (
            <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xs space-y-6">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
                {activePage.title}
              </h1>
              <div className="text-slate-700 leading-relaxed whitespace-pre-line text-base space-y-4">
                {activePage.content}
              </div>
            </div>
          )}
        </main>
      ) : (
        <>
          {/* 2. Hero Section */}
          <section id="home" className="max-w-5xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-16 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-full border border-emerald-200/50 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              ยินดีต้อนรับสู่เว็บไซต์ทางการ โรงเรียนโพนงามพิทยานุกูล
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight mb-5">
              องค์กรคุณภาพ สืบสานศาสตร์พระราชา <br className="hidden sm:inline" />
              <span className="text-emerald-700">จัดการศึกษาสู่ความเป็นเลิศ</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto mb-8 font-normal">
              “ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์” <br className="hidden sm:inline" />
              โรงเรียนโพนงามพิทยานุกูล ตำบลโพนงาม อำเภอโกสุมพิสัย จังหวัดมหาสารคาม สังกัด สพม.มหาสารคาม
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button 
                onClick={() => scrollToSection('eservice')}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold transition cursor-pointer shadow-sm shadow-emerald-200 flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                เข้าสู่ระบบ E-Service
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition cursor-pointer"
              >
                เกี่ยวกับโรงเรียน
              </button>
              <button 
                onClick={() => scrollToSection('news')}
                className="px-6 py-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-medium transition cursor-pointer"
              >
                ข่าวและประกาศ
              </button>
            </div>

            {/* School Hero Image */}
            <div className="mt-12 sm:mt-16 rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-21/9 bg-slate-100 relative group">
              <img 
                src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1600&auto=format&fit=crop&q=80" 
                alt="บรรยากาศโรงเรียนโพนงามพิทยานุกูล" 
                className="w-full h-full object-cover group-hover:scale-102 transition duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6 sm:p-8 text-left">
                <div className="text-white">
                  <span className="text-xs uppercase tracking-wider font-semibold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-md backdrop-blur-xs">
                    อำเภอโกสุมพิสัย จังหวัดมหาสารคาม
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold mt-2">โรงเรียนโพนงามพิทยานุกูล (พ.พ.ก.)</h3>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1 font-light">
                    เปิดสอนระดับมัธยมศึกษาปีที่ 1 ถึงมัธยมศึกษาปีที่ 6 บนเนื้อที่ 32 ไร่ 3 งาน 72 ตารางวา โคกหนองเรือ
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Quick E-Service Highlights Bar */}
          <section className="border-y border-slate-100 bg-slate-50/70 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    บริการสารสนเทศออนไลน์ยอดนิยม (E-Service)
                  </span>
                </div>
                <button 
                  onClick={() => scrollToSection('eservice')}
                  className="text-xs font-medium text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ดูทั้งหมด ({eServices.length}) →
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {eServices.slice(0, 4).map((srv) => {
                  const IconComp = srv.icon;
                  return (
                    <a
                      key={srv.id}
                      href={srv.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-4 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 hover:shadow-xs transition duration-200 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 transition" />
                        </div>
                        <h4 className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition line-clamp-1">
                          {srv.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {srv.desc}
                        </p>
                      </div>
                      <span className="inline-block mt-3 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded self-start">
                        {srv.badge}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 4. Section: เกี่ยวกับโรงเรียน (About School) */}
          <section id="about" className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                เกี่ยวกับโรงเรียน
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                ข้อมูลพื้นฐานและประวัติโรงเรียนโพนงามพิทยานุกูล
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                มุ่งเน้นการจัดการศึกษาอย่างมีคุณภาพ พัฒนาผู้เรียนทั้งด้านวิชาการ คุณธรรม และทักษะชีวิต
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10 border-b border-slate-100 pb-4">
              <button
                onClick={() => setAboutActiveTab('history')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  aboutActiveTab === 'history'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                📜 ประวัติความเป็นมา
              </button>
              <button
                onClick={() => setAboutActiveTab('admin')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  aboutActiveTab === 'admin'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                👥 คณะผู้บริหารและกลุ่มงาน
              </button>
              <button
                onClick={() => setAboutActiveTab('teachers')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  aboutActiveTab === 'teachers'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🎓 คณะครูและบุคลากร
              </button>
              <button
                onClick={() => setAboutActiveTab('vision')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  aboutActiveTab === 'vision'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                🎯 วิสัยทัศน์ & อัตลักษณ์
              </button>
            </div>

            {/* Tab 1: ประวัติความเป็นมา */}
            {aboutActiveTab === 'history' && (
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 sm:p-10 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">ประวัติโรงเรียนโพนงามพิทยานุกูล</h4>
                    <p className="text-xs text-slate-500">กำเนิดจากการมีส่วนร่วมของชุมชนและหน่วยงานการศึกษา</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                  <p>
                    <strong>จุดเริ่มต้น (พ.ศ. 2534):</strong> โรงเรียนโพนงามพิทยานุกูล เดิมมีฐานะเป็น <strong>“สาขาโรงเรียนโกสุมวิทยาสรรค์”</strong> จัดตั้งขึ้นตามนโยบายของกรมสามัญศึกษาในขณะนั้น ที่มุ่งเน้นขยายโอกาสทางการศึกษาไปสู่ตำบลห่างไกล โดยนายณรงค์ จันทชุม ผู้อำนวยการโรงเรียนโกสุมวิทยาสรรค์ ได้มอบหมายให้คณะครูประชุมร่วมกับผู้นำชุมชน นำโดย <strong>นายวินัย สมศรีลัย</strong> กำนันตำบลโพนงาม พร้อมด้วยผู้ใหญ่บ้านทุกหมู่บ้าน
                  </p>
                  <p>
                    <strong>สถานที่ตั้ง:</strong> ที่ประชุมมีมติเห็นชอบร่วมกันในการใช้พื้นที่ดินสาธารณประโยชน์ <strong>“โคกหนองเรือ”</strong> เนื้อที่รวม <strong>32 ไร่ 3 งาน 72 ตารางวา</strong> ตั้งอยู่เลขที่ 3 หมู่ที่ 2 ตำบลโพนงาม อำเภอโกสุมพิสัย จังหวัดมหาสารคาม เพื่อเป็นสถานที่ก่อตั้งโรงเรียน
                  </p>
                  <p>
                    <strong>ยกฐานะเป็นโรงเรียนเอกเทศ (3 กุมภาพันธ์ 2538):</strong> ต่อมาได้รับอนุมัติจากกรมสามัญศึกษา กระทรวงศึกษาธิการ ให้ยกฐานะเป็นโรงเรียนเอกเทศอย่างเป็นทางการ เมื่อวันที่ <strong>3 กุมภาพันธ์ พ.ศ. 2538</strong> (ตามคำสั่งกรมสามัญศึกษาที่ 391/2538) โดยใช้ชื่อว่า <strong>“โรงเรียนโพนงามพิทยานุกูล”</strong> และใช้อักษรย่อว่า <strong>“พ.พ.ก.”</strong> นับแต่นั้นเป็นต้นมา
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-center">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                    <div className="text-xl font-bold text-emerald-700">2534</div>
                    <div className="text-xs text-slate-500 mt-1">ปีที่เริ่มก่อตั้งสาขา</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                    <div className="text-xl font-bold text-emerald-700">3 ก.พ. 2538</div>
                    <div className="text-xs text-slate-500 mt-1">ประกาศเป็นโรงเรียนเอกเทศ</div>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200/60">
                    <div className="text-xl font-bold text-emerald-700">32 ไร่เศษ</div>
                    <div className="text-xs text-slate-500 mt-1">โคกหนองเรือ ต.โพนงาม</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: คณะผู้บริหารและกลุ่มงาน */}
            {aboutActiveTab === 'admin' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* School Director Card */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                    <User className="w-10 h-10" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-emerald-200">
                      ผู้อำนวยการสถานศึกษา
                    </span>
                    <h4 className="text-xl font-bold text-slate-900 mt-2">
                      นายวัชรินทร์ ติดวงษา
                    </h4>
                    <p className="text-sm text-slate-600 mt-1">
                      ผู้อำนวยการโรงเรียนโพนงามพิทยานุกูล
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม
                    </p>
                  </div>
                </div>

                {/* 4 Core Department Heads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {administrators.slice(1).map((adm, idx) => (
                    <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-300 transition flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-sm">
                        0{idx + 1}
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                          {adm.group}
                        </span>
                        <h5 className="font-bold text-sm sm:text-base text-slate-900 mt-0.5">
                          {adm.name}
                        </h5>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {adm.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: คณะครูและบุคลากร */}
            {aboutActiveTab === 'teachers' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900">รายนามบุคลากรครูและเจ้าหน้าที่</h4>
                    <p className="text-xs text-slate-500">โรงเรียนโพนงามพิทยานุกูล อำเภอโกสุมพิสัย</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md">
                    รวม {teachers.length} ท่าน
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {teachers.map((t, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 hover:border-emerald-200 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-900">{t.name}</div>
                          <div className="text-xs text-emerald-700 font-medium">{t.position}</div>
                          <div className="text-[11px] text-slate-400">{t.department}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: วิสัยทัศน์ & อัตลักษณ์ */}
            {aboutActiveTab === 'vision' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
                <div className="bg-white p-7 rounded-2xl border border-slate-200 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-lg text-slate-900">วิสัยทัศน์ (Vision)</h4>
                  <p className="text-slate-700 text-sm leading-relaxed font-normal bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    “เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ” <br />
                    <span className="text-xs text-slate-500 mt-1 block font-mono">
                      (Quality Organization to Excellent Education)
                    </span>
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    มุ่งพัฒนาผู้เรียนให้มีความพร้อมทั้งด้านความรู้ ทักษะทางเทคโนโลยี และคุณธรรมจริยธรรม
                  </p>
                </div>

                <div className="bg-white p-7 rounded-2xl border border-slate-200 space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-lg text-slate-900">คำขวัญ & อัตลักษณ์ประจำโรงเรียน</h4>
                  <p className="text-slate-700 text-sm leading-relaxed font-normal bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                    “ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์”
                  </p>
                  <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                    <p><strong>• อักษรย่อ:</strong> พ.พ.ก.</p>
                    <p><strong>• ระดับที่เปิดสอน:</strong> มัธยมศึกษาปีที่ 1 - 6</p>
                    <p><strong>• นวัตกรรมการบริหาร:</strong> PPK SMART Model</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* 5. Section: ระบบสารสนเทศ E-Service (Full Interactive Portal) */}
          <section id="eservice" className="border-t border-slate-100 bg-slate-50/60 py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              
              <div className="text-center max-w-2xl mx-auto mb-14">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/70 px-3 py-1 rounded-full">
                  ระบบสารสนเทศดิจิทัล
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  ระบบบริการอิเล็กทรอนิกส์ (E-Service)
                </h3>
                <p className="text-sm text-slate-500 mt-2 font-normal">
                  ศูนย์รวมบริการออนไลน์เพื่อการบริหารจัดการ การจัดการเรียนรู้ และการบริการนักเรียน ครู ศิษย์เก่า และประชาชน
                </p>
              </div>

              {/* 6 E-Services Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eServices.map((service) => {
                  const IconC = service.icon;
                  return (
                    <div 
                      key={service.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between hover:shadow-md hover:border-emerald-300 transition duration-200"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                            <IconC className="w-5 h-5" />
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                            {service.badge}
                          </span>
                        </div>

                        <span className="text-xs font-medium text-slate-400">
                          {service.category}
                        </span>
                        <h4 className="font-bold text-base text-slate-900 mt-1 leading-snug">
                          {service.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed font-normal">
                          {service.desc}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                        <a 
                          href={service.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          เข้าใช้งานระบบ
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {service.manualUrl ? (
                          <a 
                            href={service.manualUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                            title="ดาวน์โหลดหรือดูคู่มือการใช้งาน"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            คู่มือ
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-400">ออนไลน์ 24 ชม.</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* User Manuals Callout */}
              <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-base text-slate-900">
                    ต้องการคู่มือการใช้งานระบบ E-Service เพิ่มเติม?
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500">
                    สามารถดาวน์โหลดเอกสารคู่มือระบบ SGS, ทำเนียบศิษย์เก่า PPK Alumni และตู้เสมารักษ์ได้โดยตรง
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href="https://sgs.bopp-obec.info/Data/Manual.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    คู่มือ SGS (Zip)
                  </a>
                  <a
                    href="https://www.ppks.ac.th/%e0%b8%84%e0%b8%b9%e0%b9%88%e0%b8%a1%e0%b8%b7%e0%b8%ad%e0%b8%81%e0%b8%b2%e0%b8%a3%e0%b9%83%e0%b8%8a%e0%b9%89%e0%b8%87%e0%b8%b2%e0%b8%99-%e0%b8%a3%e0%b8%b0%e0%b8%9a%e0%b8%9a%e0%b8%97%e0%b8%b3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    คู่มือ Alumni
                  </a>
                </div>
              </div>

            </div>
          </section>

          {/* 6. Section: ข่าวและประกาศล่าสุด (News & Announcements) */}
          <section id="news" className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
            
            {/* Header + Filter + Search */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                  ข่าวประชาสัมพันธ์
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  ข่าวสารและกิจกรรมโรงเรียน
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-normal">
                  ติดตามผลงานวิชาการ ประกาศสำคัญ และกิจกรรมของโรงเรียนโพนงามพิทยานุกูล
                </p>
              </div>

              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาข่าว..."
                    className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-500 focus:bg-white w-full sm:w-44 transition"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                        selectedCategory === cat 
                          ? 'bg-white text-slate-900 shadow-2xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* News Cards Grid */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                  <article 
                    key={post.id}
                    onClick={() => handleOpenPost(post)}
                    className="group cursor-pointer flex flex-col justify-between bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 hover:shadow-md transition p-4"
                  >
                    <div>
                      {/* Image */}
                      <div className="aspect-16/10 rounded-xl overflow-hidden bg-slate-100 mb-3.5 border border-slate-100">
                        <img 
                          src={post.image_url || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&auto=format&fit=crop&q=80'} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                          loading="lazy"
                        />
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                          {post.category}
                        </span>
                        <span>•</span>
                        <span>{formatThaiDate(post.created_at)}</span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-base text-slate-900 group-hover:text-emerald-700 transition leading-snug line-clamp-2">
                        {post.title}
                      </h4>

                      {/* Summary */}
                      <p className="text-xs sm:text-sm text-slate-500 line-clamp-3 mt-2 leading-relaxed font-normal">
                        {post.summary || post.content}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700 flex items-center justify-between group-hover:text-emerald-800">
                      <span className="flex items-center gap-1">
                        อ่านรายละเอียด <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {post.views || 0} views
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-200">
                ไม่พบข้อมูลข่าวสารที่ตรงกับเงื่อนไขการค้นหา
              </div>
            )}

          </section>

          {/* 7. Section: ติดต่อเรา (Contact Information) */}
          <section id="contact" className="border-t border-slate-100 bg-slate-50/70 py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              
              <div className="text-center max-w-xl mx-auto mb-14">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-100/70 px-3 py-1 rounded-full">
                  ติดต่อสอบถาม
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
                  ติดต่อโรงเรียนโพนงามพิทยานุกูล
                </h3>
                <p className="text-sm text-slate-500 mt-2 font-normal">
                  พร้อมให้บริการและอำนวยความสะดวกแก่นักเรียน ผู้ปกครอง และประชาชนทุกท่าน
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                
                {/* Contact Card */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900">
                      ข้อมูลการติดต่อและที่ทำการ
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      สำนักงานกลุ่มอำนวยการและธุรการ โรงเรียนโพนงามพิทยานุกูล
                    </p>
                  </div>

                  <div className="space-y-4 text-sm text-slate-700 font-normal">
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
                          เวลาเปิดทำการ
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

                {/* Map & Direction */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-6">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900">
                      แผนที่และการเดินทาง
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      ตั้งอยู่ริมถนนทางหลวงชนบทในตำบลโพนงาม สะดวกต่อการเดินทางจากอำเภอโกสุมพิสัย
                    </p>

                    <div className="mt-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
                      <p>
                        <strong>สังกัด:</strong> สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม (สพม. มหาสารคาม)
                      </p>
                      <p>
                        <strong>เว็บไซต์หลัก:</strong>{' '}
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
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-emerald-200"
                    >
                      <MapPin className="w-4 h-4" />
                      เปิดพิกัดนำทางบน Google Maps
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <p className="text-[11px] text-slate-400 text-center">
                      * ค้นหาคำว่า "โรงเรียนโพนงามพิทยานุกูล" เพื่อนำทางด้วย GPS
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>
        </>
      )}

      {/* 8. Single Post Reader Modal */}
      {readingPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setReadingPost(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-xl border border-slate-200 relative my-auto animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Loading Indicator */}
            {loadingPost && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-white/95 rounded-full text-xs text-slate-600 border border-slate-200">
                <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                กำลังโหลด...
              </div>
            )}

            {/* Close Button */}
            <button 
              onClick={() => setReadingPost(null)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cover Image */}
            {readingPost.image_url && (
              <div className="aspect-16/9 w-full overflow-hidden bg-slate-100">
                <img 
                  src={readingPost.image_url} 
                  alt={readingPost.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Content */}
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

      {/* 9. Minimal Clean Footer */}
      <footer className="border-t border-slate-100 bg-white py-12 px-4 sm:px-6 text-slate-400 text-xs mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-700 font-bold text-sm">
                {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'} (พ.พ.ก.)
              </p>
              <p className="text-slate-400 text-xs">
                สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม
              </p>
            </div>
          </div>
          <div className="text-slate-400 text-xs space-y-1">
            <p>เว็บไซต์ทางการ: <a href="https://www.ppks.ac.th" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700 underline">www.ppks.ac.th</a></p>
            <p>© 2026 โรงเรียนโพนงามพิทยานุกูล All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
