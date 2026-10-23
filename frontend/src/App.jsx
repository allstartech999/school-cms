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
  Bot,
  GraduationCap,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react';
import { fetchPosts, fetchPost, fetchStats, fetchHomepageConfig, fetchMenu, fetchPage } from './api';
import BlockRenderer from './components/BlockRenderer';

const INITIAL_POSTS = [
  {
    id: 1,
    title: "โรงเรียนโพนงามพิทยานุกูล คว้ารางวัลระดับดีเด่น การขับเคลื่อนหลักสูตร ต้านทุจริตศึกษา ปีการศึกษา 2568",
    slug: "anti-corruption-curriculum-award-2568",
    category: "วิชาการ",
    summary: "โรงเรียนโพนงามพิทยานุกูล ได้รับการคัดเลือกและรับรางวัลระดับดีเด่น ในการขับเคลื่อนหลักสูตรต้านทุจริตศึกษา ประจำปีการศึกษา 2568 สพม.มหาสารคาม",
    content: "โรงเรียนโพนงามพิทยานุกูล สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม มุ่งมั่นปลูกฝังคุณธรรมและความซื่อสัตย์สุจริตให้แก่นักเรียนอย่างต่อเนื่อง ล่าสุดทางโรงเรียนได้รับรางวัลระดับดีเด่น ในโครงการขับเคลื่อนหลักสูตรต้านทุจริตศึกษา ประจำปีการศึกษา 2568 สะท้อนถึงความมุ่งมั่นของคณะผู้บริหาร คณะครู และนักเรียนในการร่วมกันสร้างสังคมคุณธรรมและโปร่งใส",
    image_url: "/images/news-active-learning.jpg",
    author: "กลุ่มบริหารงานวิชาการ",
    created_at: "2026-10-20T08:30:00Z",
    views: 320
  },
  {
    id: 2,
    title: "การบริหารสถานศึกษาแบบมีส่วนร่วมเพื่อยกระดับคุณภาพการศึกษา โดยใช้ PPK SMART Model",
    slug: "ppk-smart-model-management",
    category: "วิชาการ",
    summary: "โรงเรียนโพนงามพิทยานุกูล พัฒนานวัตกรรมการบริหารสถานศึกษาด้วยรูปแบบ PPK SMART Model เพื่อเสริมสร้างประสิทธิภาพการเรียนรู้รอบด้าน",
    content: "เพื่อการพัฒนาคุณภาพการศึกษาที่ยั่งยืน โรงเรียนโพนงามพิทยานุกูล ได้นำนวัตกรรมการบริหารแบบมีส่วนร่วม 'PPK SMART Model' มาขับเคลื่อนงานทั้ง 4 กลุ่มงาน (วิชาการ, บุคคล, งบประมาณ, บริหารทั่วไป) สอดคล้องกับวิสัยทัศน์ 'เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ'",
    image_url: "/images/news-smart-model.jpg",
    author: "นายวัชรินทร์ ติดวงษา ผู้อำนวยการ",
    created_at: "2026-10-18T09:00:00Z",
    views: 450
  },
  {
    id: 3,
    title: "การพัฒนาการจัดการเรียนรู้เชิงรุก (Active Learning) ด้วยเกมเป็นฐาน รูปแบบ PM SMART MODEL",
    slug: "active-learning-pm-smart-model",
    category: "กิจกรรม",
    summary: "กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ ขับเคลื่อนการเรียนรู้เชิงรุกโดยใช้เกมเป็นฐาน ส่งเสริมทักษะภาษาอังกฤษของนักเรียน",
    content: "คณะครูกลุ่มสาระการเรียนรู้ภาษาต่างประเทศ โรงเรียนโพนงามพิทยานุกูล ได้ดำเนินการพัฒนาการจัดกิจกรรมการเรียนรู้ภาษาอังกฤษเชิงรุก (Active Learning) ด้วยเกมเป็นฐาน ผ่านโมเดล 'PM SMART MODEL' ส่งผลให้นักเรียนเกิดความสนุกสนาน กล้าแสดงออก และมีเจตคติที่ดีต่อการสื่อสารภาษาอังกฤษ",
    image_url: "/images/banner-semarak.png",
    author: "กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ",
    created_at: "2026-10-15T10:15:00Z",
    views: 290
  },
  {
    id: 4,
    title: "ขอเชิญชวนศิษย์เก่าโรงเรียนโพนงามพิทยานุกูล ร่วมลงทะเบียนผ่านระบบ PPK Alumni",
    slug: "ppk-alumni-network-invitation",
    category: "กิจกรรม",
    summary: "เปิดให้บริการระบบเครือข่ายทำเนียบศิษย์เก่าออนไลน์ เพื่อเชื่อมความสัมพันธ์และร่วมพัฒนาสถานศึกษา",
    content: "โรงเรียนโพนงามพิทยานุกูล ขอเชิญชวนศิษย์เก่าทุกรุ่น ร่วมลงทะเบียนฐานข้อมูลศิษย์เก่าผ่านระบบ E-Service (PPK Alumni) ที่ https://alumni.ppks.ac.th เพื่อสร้างเครือข่ายความร่วมมือ อัพเดตข่าวสาร และร่วมเป็นพลังในการพัฒนาคุณภาพการศึกษาของน้องๆ รุ่นต่อไป",
    image_url: "/images/banner-alumni.png",
    author: "งานประชาสัมพันธ์และเครือข่ายศิษย์เก่า",
    created_at: "2026-10-12T11:00:00Z",
    views: 512
  }
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'about' | 'eservice' | 'news' | 'contact' | 'dynamic_page'
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [stats, setStats] = useState({
    school_name: "โรงเรียนโพนงามพิทยานุกูล",
    school_name_en: "Phon-ngam Pittayanukun School",
    total_posts: 4,
    total_pages: 3
  });
  const [homepageConfig, setHomepageConfig] = useState({
    hero: {
      badge: "โรงเรียนคุณภาพมาตรฐานสากล • สพม.มหาสารคาม",
      heading: "โรงเรียนโพนงามพิทยานุกูล",
      subheading: "“ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์”\nเป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ",
      primary_cta: "บริการออนไลน์ (E-Service)",
      primary_url: "eservice"
    },
    announcement: "ขอเชิญชวนศิษย์เก่าทุกท่านร่วมลงทะเบียนเครือข่ายศิษย์เก่าออนไลน์ (PPK Alumni) เพื่อร่วมพัฒนาโรงเรียน",
    show_ticker: true,
    show_slider: true,
    show_eservices: true,
    show_recent_news: true,
    show_trending: true
  });
  const [menuItems, setMenuItems] = useState([]);
  const [activeDynamicPage, setActiveDynamicPage] = useState(null);
  const [loadingDynamicPage, setLoadingDynamicPage] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(false);
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
      image: '/images/artboard-1.png',
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

  // Load initial data from backend if available
  useEffect(() => {
    Promise.all([
      fetchPosts({ limit: 50 }).catch(() => null),
      fetchStats().catch(() => null),
      fetchHomepageConfig().catch(() => null),
      fetchMenu().catch(() => null)
    ])
      .then(([postsData, statsData, hpCfg, menuData]) => {
        if (Array.isArray(postsData) && postsData.length > 0) {
          setPosts(postsData);
        }
        if (statsData) {
          setStats(statsData);
        }
        if (hpCfg) {
          setHomepageConfig(prev => ({ ...prev, ...hpCfg }));
        }
        if (Array.isArray(menuData) && menuData.length > 0) {
          setMenuItems(menuData);
        }
      })
      .catch(err => {
        console.error('Error fetching data:', err);
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
    <div className="min-h-screen bg-[#FEF9E1] text-[#454F5E] flex flex-col font-sans selection:bg-[#FEDB3B] selection:text-[#141006]">
      
      {/* 1. Header (Akat Coding Center Sunny Header) */}
      <header className="bg-[#FFE042] border-b border-[#F9F0C8] sticky top-0 z-50 transition-all shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo & School Name */}
          <div 
            className="flex items-center gap-3.5 cursor-pointer select-none group shrink-0" 
            onClick={() => navigateTo('home')}
          >
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-1 border border-white/80 shadow-xs shrink-0 overflow-hidden group-hover:scale-105 transition">
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
                <span className="font-bold text-base sm:text-lg text-[#141006] leading-tight tracking-tight group-hover:text-[#E98C00] transition whitespace-nowrap">
                  {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-[#FD9800] text-white rounded-full whitespace-nowrap">
                  พ.พ.ก.
                </span>
              </div>
              <p className="text-xs text-[#141006]/70 font-medium whitespace-nowrap">
                สพม.มหาสารคาม • อ.โกสุมพิสัย
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {(menuItems && menuItems.length > 0 ? menuItems : [
              { id: 'home', title: 'หน้าแรก', path: 'home' },
              { id: 'about', title: 'เกี่ยวกับโรงเรียน', path: 'about' },
              { id: 'eservice', title: 'ระบบ E-Service', path: 'eservice' },
              { id: 'news', title: 'ข่าวและประกาศ', path: 'news' },
              { id: 'contact', title: 'ติดต่อเรา', path: 'contact' },
            ]).map((item) => {
              const active = currentPage === item.path || 
                (currentPage === 'dynamic_page' && activeDynamicPage?.slug === item.path?.replace(/^\/?page\//, ''));

              if (item.children && item.children.length > 0) {
                return (
                  <div className="relative group" key={item.id || item.path}>
                    <button
                      onClick={() => navigateTo(item.path)}
                      className={`px-3.5 py-2 text-sm font-semibold whitespace-nowrap rounded-xl transition-colors flex items-center gap-1 cursor-pointer ${
                        active
                          ? 'text-[#E98C00] bg-white/70 shadow-2xs'
                          : 'text-[#222222] hover:text-[#E98C00] hover:bg-white/40'
                      }`}
                    >
                      <span>{item.title}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#141006]/60 group-hover:text-[#E98C00] transition" />
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-50 min-w-[200px] animate-in fade-in duration-100">
                      <div className="bg-white rounded-2xl shadow-xl border border-[#F9F0C8] p-2 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.id || child.path}
                            onClick={() => navigateTo(child.path)}
                            className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-[#FEF9E1] hover:text-[#E98C00] text-[#454F5E] flex items-center gap-2 transition cursor-pointer font-semibold"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-[#FD9800] shrink-0" />
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
                  className={`px-3.5 py-2 text-sm font-semibold whitespace-nowrap rounded-xl transition-colors cursor-pointer ${
                    active
                      ? 'text-[#E98C00] bg-white/70 shadow-2xs'
                      : 'text-[#222222] hover:text-[#E98C00] hover:bg-white/40'
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
          </nav>

          {/* Right Action Button (Akat site-login style) */}
          <div className="hidden lg:flex items-center gap-3">
            <button 
              type="button"
              onClick={() => navigateTo('eservice')}
              className="px-6 py-2.5 rounded-full bg-[#FD9800] hover:bg-[#E98C00] text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-sm hover:shadow-md flex items-center gap-1.5"
            >
              <span>เข้าสู่ระบบ E-Service</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#141006] hover:text-[#FD9800] transition cursor-pointer rounded-xl hover:bg-white/40"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#F9F0C8] bg-[#FFE042] px-6 py-4 space-y-1.5 shadow-lg">
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
                    className={`block w-full text-left py-2.5 px-3 rounded-xl text-sm font-semibold flex items-center justify-between ${
                      active ? 'bg-white text-[#E98C00] shadow-xs' : 'text-[#141006] hover:bg-white/40'
                    }`}
                  >
                    <span>{item.title}</span>
                    {item.children && item.children.length > 0 && <ChevronDown className="w-4 h-4 text-[#141006]/60" />}
                  </button>
                  {item.children && item.children.length > 0 && (
                    <div className="pl-4 space-y-1 border-l-2 border-[#FD9800] ml-3 py-1">
                      {item.children.map((child) => (
                        <button
                          key={child.id || child.path}
                          onClick={() => navigateTo(child.path)}
                          className="block w-full text-left py-1.5 px-2.5 text-xs text-[#222222] hover:text-[#E98C00] font-medium rounded-lg"
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
            <div className="w-10 h-10 rounded-full border-3 border-[#FFE042] border-t-[#FD9800] animate-spin mb-4"></div>
            <p className="text-sm font-medium text-[#454F5E]">กำลังโหลดข้อมูลโรงเรียนโพนงามพิทยานุกูล...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1">

          {/* ========================================================= */}
          {/* PAGE 1: หน้าแรก (HOME - Akat Coding Center Style)         */}
          {/* ========================================================= */}
          {currentPage === 'home' && (
            <div className="animate-in fade-in duration-200">
              
              {/* Akat Signature Hero (Dark Warm BG + Floating Glass Chips + Center Glass Card) */}
              <section className="relative min-h-[660px] pb-36 pt-16 flex items-center justify-center overflow-hidden bg-[#141006] text-center">
                
                {/* Background Photo with Gradient Tint & Atmosphere */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src="/images/news-active-learning.jpg" 
                    alt="บรรยากาศการเรียนรู้โรงเรียนโพนงามพิทยานุกูล"
                    className="w-full h-full object-cover opacity-20 scale-105 blur-[3px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141006] via-[#141006]/85 to-black/60"></div>
                </div>

                {/* Floating Glass Chips (Akat Style) */}
                <div className="absolute inset-0 z-1 pointer-events-none hidden md:block">
                  <span className="glass-chip px-4 py-2 rounded-2xl text-sm font-bold absolute left-[6%] top-[22%] shadow-lg">
                    🏫 พ.พ.ก.
                  </span>
                  <span className="glass-chip px-4 py-2 rounded-2xl text-sm font-bold absolute right-[8%] top-[18%] shadow-lg">
                    ✨ Active Learning
                  </span>
                  <span className="glass-chip px-4 py-2 rounded-2xl text-sm font-bold absolute left-[9%] bottom-[38%] shadow-lg">
                    🎓 100% ศึกษาต่อ
                  </span>
                  <span className="glass-chip px-4 py-2 rounded-2xl text-sm font-bold absolute right-[9%] bottom-[34%] shadow-lg">
                    🏆 15+ รางวัลเด่น
                  </span>
                  <span className="glass-chip px-4 py-2 rounded-2xl text-sm font-bold absolute right-[26%] top-[12%] shadow-lg">
                    ⚡ PPK SMART Model
                  </span>
                </div>

                {/* Center Glass Card */}
                <div className="relative z-10 max-w-4xl mx-4 glass-hero-card rounded-[32px] p-8 sm:p-14 text-center shadow-2xl">
                  
                  {/* Eyebrow */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FEF9E1] border border-[#F9F0C8] text-[#8A6210] text-xs sm:text-sm font-semibold mb-4 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-[#FD9800]"></span>
                    <span>มาเริ่มต้นเรียนรู้และเติบโตไปด้วยกันที่นี่ !</span>
                  </div>

                  {/* Big Gold Title */}
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold site-gold tracking-tight leading-tight mb-4 whitespace-nowrap">
                    {homepageConfig?.hero?.heading || 'โรงเรียนโพนงามพิทยานุกูล'}
                  </h1>

                  {/* Subtitle */}
                  <div className="text-sm sm:text-base text-[#454F5E] max-w-xl mx-auto font-medium leading-relaxed space-y-1">
                    <p className="text-[#8A6210] font-semibold text-xs sm:text-sm">
                      “ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์”
                    </p>
                    <p className="text-xs sm:text-sm">
                      เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ
                    </p>
                  </div>

                  {/* Scroll Down Circle Button */}
                  <div className="mt-8">
                    <a 
                      href="#highlights"
                      className="inline-flex w-12 h-12 rounded-full bg-[#FEDB3B] hover:bg-[#FD9800] text-[#141006] hover:text-white items-center justify-center transition shadow-lg transform hover:scale-110"
                    >
                      <ChevronDown className="w-6 h-6" />
                    </a>
                  </div>

                </div>
              </section>

              {/* Akat Overlapping 4-Pillars Card Grid */}
              <section id="highlights" className="relative z-20 -mt-24 sm:-mt-28 max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  
                  {/* Card 1 */}
                  <div className="akat-card p-8 flex flex-col items-center text-center justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-xl bg-[#FEDB3B] text-[#141006] text-xs font-bold shadow-2xs mb-3">
                        Active Learning
                      </span>
                      <h3 className="text-lg font-bold text-[#0F172A]">กลุ่มบริหารวิชาการ</h3>
                      <p className="text-xs text-[#454F5E] mt-2 leading-relaxed">
                        ขับเคลื่อนหลักสูตรต้านทุจริตศึกษา ยกระดับการจัดการเรียนรู้เชิงรุก และส่งเสริมการใช้สื่อนวัตกรรม
                      </p>
                    </div>
                    <span className="mt-5 text-xs font-bold text-[#FD9800] hover:underline flex items-center gap-1 cursor-pointer" onClick={() => { setAboutActiveTab('admin'); navigateTo('about'); }}>
                      ดูข้อมูลฝ่ายวิชาการ →
                    </span>
                  </div>

                  {/* Card 2 */}
                  <div className="akat-card p-8 flex flex-col items-center text-center justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-xl bg-[#FEDB3B] text-[#141006] text-xs font-bold shadow-2xs mb-3">
                        PPK Model
                      </span>
                      <h3 className="text-lg font-bold text-[#0F172A]">กลุ่มบริหารงานบุคคล</h3>
                      <p className="text-xs text-[#454F5E] mt-2 leading-relaxed">
                        พัฒนาครูและบุคลากรทางการศึกษา เสริมสร้างวินัย คุณธรรมจริยธรรม และการมีส่วนร่วมของชุมชน
                      </p>
                    </div>
                    <span className="mt-5 text-xs font-bold text-[#FD9800] hover:underline flex items-center gap-1 cursor-pointer" onClick={() => { setAboutActiveTab('admin'); navigateTo('about'); }}>
                      ดูข้อมูลฝ่ายบุคคล →
                    </span>
                  </div>

                  {/* Card 3 */}
                  <div className="akat-card p-8 flex flex-col items-center text-center justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-xl bg-[#FEDB3B] text-[#141006] text-xs font-bold shadow-2xs mb-3">
                        Transparency
                      </span>
                      <h3 className="text-lg font-bold text-[#0F172A]">กลุ่มบริหารงบประมาณ</h3>
                      <p className="text-xs text-[#454F5E] mt-2 leading-relaxed">
                        บริหารงบประมาณโปร่งใส ตรวจสอบได้ตามหลักธรรมาภิบาล และการประเมินคุณธรรม ITA
                      </p>
                    </div>
                    <span className="mt-5 text-xs font-bold text-[#FD9800] hover:underline flex items-center gap-1 cursor-pointer" onClick={() => { setAboutActiveTab('admin'); navigateTo('about'); }}>
                      ดูข้อมูลฝ่ายงบประมาณ →
                    </span>
                  </div>

                  {/* Card 4 */}
                  <div className="akat-card p-8 flex flex-col items-center text-center justify-between">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-xl bg-[#FEDB3B] text-[#141006] text-xs font-bold shadow-2xs mb-3">
                        Campus 32 ไร่
                      </span>
                      <h3 className="text-lg font-bold text-[#0F172A]">กลุ่มบริหารทั่วไป</h3>
                      <p className="text-xs text-[#454F5E] mt-2 leading-relaxed">
                        พัฒนาสภาพแวดล้อมและภูมิทัศน์สถานศึกษา ร่มรื่น ปลอดภัย น่าอยู่ และเอื้อต่อการเรียนรู้รอบด้าน
                      </p>
                    </div>
                    <span className="mt-5 text-xs font-bold text-[#FD9800] hover:underline flex items-center gap-1 cursor-pointer" onClick={() => { setAboutActiveTab('admin'); navigateTo('about'); }}>
                      ดูข้อมูลฝ่ายทั่วไป →
                    </span>
                  </div>

                </div>

                {/* Center Yellow Pill Button */}
                <div className="text-center mt-10">
                  <button 
                    onClick={() => navigateTo('about')}
                    className="px-8 py-3.5 rounded-full bg-[#FEDB3B] hover:bg-[#FD9800] text-[#141006] hover:text-white font-bold text-sm shadow-md transition transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>ดูข้อมูลและโครงสร้างสถานศึกษาทั้งหมด</span>
                    <span>+</span>
                  </button>
                </div>
              </section>

              {/* Akat Journey & Director Showcase */}
              <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  
                  {/* Left Column: Intro */}
                  <div className="lg:col-span-4">
                    <h2 className="text-3xl sm:text-4xl font-bold site-gold leading-tight">
                      ก้าวสู่อนาคตการศึกษา ที่มีคุณภาพ
                    </h2>
                    <p className="text-sm text-[#454F5E] mt-4 leading-relaxed">
                      โรงเรียนโพนงามพิทยานุกูล มุ่งเน้นการพัฒนาผู้เรียนเป็นสำคัญ สืบสานศาสตร์พระราชา และเสริมสร้างทักษะแห่งศตวรรษที่ 21 เพื่อเยาวชนในชุมชนตำบลโพนงามและอำเภอโกสุมพิสัย
                    </p>
                    <hr className="w-24 border-0 border-t-3 border-[#FD9800] mt-6" />
                  </div>

                  {/* Center Column: Director Photo */}
                  <div className="lg:col-span-4 flex justify-center">
                    <div className="relative w-full max-w-sm rounded-[32px] overflow-hidden bg-white shadow-xl border border-white/80 p-3">
                      <div className="rounded-[24px] overflow-hidden aspect-4/5 bg-[#FEF9E1]">
                        <img 
                          src="/images/director.jpg" 
                          alt="นายวัชรินทร์ ติดวงษา ผู้อำนวยการ"
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/head-academic.jpg';
                          }}
                        />
                      </div>
                      <div className="p-4 text-center">
                        <h4 className="font-bold text-base text-[#0F172A]">นายวัชรินทร์ ติดวงษา</h4>
                        <p className="text-xs text-[#FD9800] font-semibold mt-0.5">ผู้อำนวยการโรงเรียนโพนงามพิทยานุกูล</p>
                        <p className="text-xs text-[#454F5E] mt-2 italic bg-[#FEF9E1] p-3 rounded-xl border border-[#F9F0C8]">
                          “เราพร้อมส่งเสริมเยาวชนให้เติบโตอย่างมีคุณภาพและรอบด้าน”
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 3 Numbered Steps (Akat Style) */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#FEDB3B] text-[#141006] font-bold text-2xl flex items-center justify-center shrink-0 shadow-xs">
                        1
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#0F172A]">องค์กรคุณภาพ</h4>
                        <p className="text-xs text-[#454F5E] mt-1 leading-relaxed">
                          บริหารจัดการสถานศึกษาด้วยระบบคุณภาพมาตรฐานสากล สพม.มหาสารคาม
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#FEDB3B] text-[#141006] font-bold text-2xl flex items-center justify-center shrink-0 shadow-xs">
                        2
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#0F172A]">ศาสตร์พระราชา</h4>
                        <p className="text-xs text-[#454F5E] mt-1 leading-relaxed">
                          น้อมนำหลักปรัชญาของเศรษฐกิจพอเพียง ปลูกฝังคุณธรรมและความซื่อสัตย์สุจริต
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#FEDB3B] text-[#141006] font-bold text-2xl flex items-center justify-center shrink-0 shadow-xs">
                        3
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-[#0F172A]">สู่ความเป็นเลิศ</h4>
                        <p className="text-xs text-[#454F5E] mt-1 leading-relaxed">
                          จัดการเรียนรู้เชิงรุก (Active Learning) สร้างสรรค์นวัตกรรมและต่อยอดสู่อุดมศึกษา
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </section>

              {/* Akat E-Service Section */}
              <section className="py-20 bg-gradient-to-b from-[#FEF9E1] to-white border-t border-[#F9F0C8]">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
                    <div>
                      <span className="text-[#FD9800] text-xs font-bold uppercase tracking-wider bg-[#FEDB3B]/40 px-3 py-1 rounded-full">
                        ระบบสารสนเทศออนไลน์
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
                        บริการอิเล็กทรอนิกส์ E-Service สำหรับนักเรียนและบุคลากร
                      </h2>
                    </div>
                    <button 
                      onClick={() => navigateTo('eservice')}
                      className="px-5 py-2.5 rounded-full bg-[#FEDB3B] hover:bg-[#FD9800] text-[#141006] font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
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
                            <span className="text-[10px] font-bold text-[#141006] bg-[#FEDB3B] px-2.5 py-1 rounded-lg">
                              {srv.badge}
                            </span>
                            <span className="text-xs text-[#454F5E] font-medium">
                              {srv.category}
                            </span>
                          </div>
                          <h4 className="font-bold text-base text-[#0F172A] leading-snug">
                            {srv.title}
                          </h4>
                          <p className="text-xs text-[#454F5E] mt-2 leading-relaxed line-clamp-2">
                            {srv.desc}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-[#F9F0C8] flex items-center justify-between">
                          <a 
                            href={srv.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2 bg-[#FD9800] hover:bg-[#E98C00] text-white rounded-full text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <span>เข้าสู่ระบบ</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                          {srv.manualUrl && (
                            <a 
                              href={srv.manualUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#FD9800] hover:underline font-semibold"
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

              {/* Akat News / Articles Section (เรื่องเล่าและข่าวสารจากโรงเรียน) */}
              <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6">
                
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
                  <div>
                    <span className="text-[#FD9800] text-xs font-bold uppercase tracking-wider bg-[#FEDB3B]/40 px-3 py-1 rounded-full">
                      บทความ & ข่าวสาร
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
                      เรื่องเล่าและความรู้จากสถานศึกษา
                    </h2>
                  </div>
                  <button 
                    onClick={() => navigateTo('news')}
                    className="px-5 py-2.5 rounded-full bg-[#FEDB3B] hover:bg-[#FD9800] text-[#141006] font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>ดูบทความทั้งหมด</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {posts.slice(0, 3).map((post) => (
                    <article 
                      key={post.id}
                      onClick={() => handleOpenPost(post)}
                      className="akat-card overflow-hidden cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="aspect-16/10 w-full overflow-hidden bg-[#FEF9E1]">
                        <img 
                          src={post.image_url || '/images/news-active-learning.jpg'} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs text-[#454F5E] mb-2.5">
                            <span className="font-bold text-[#141006] bg-[#FEDB3B] px-2 py-0.5 rounded-md text-[10px]">
                              {post.category}
                            </span>
                            <span>•</span>
                            <span>{formatThaiDate(post.created_at)}</span>
                          </div>
                          <h4 className="font-bold text-base text-[#0F172A] group-hover:text-[#FD9800] transition leading-snug line-clamp-2">
                            {post.title}
                          </h4>
                          <p className="text-xs text-[#454F5E] mt-2 line-clamp-2 leading-relaxed">
                            {post.summary || post.content}
                          </p>
                        </div>
                        <div className="mt-5 pt-3 border-t border-[#F9F0C8] text-xs font-bold text-[#FD9800] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          อ่านต่อ →
                        </div>
                      </div>
                    </article>
                  ))}
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
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 animate-in fade-in duration-200">
              
              {/* Header Title */}
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-medium uppercase tracking-widest text-neutral-400">
                  เกี่ยวกับโรงเรียน
                </span>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-950 mt-1.5">
                  ข้อมูลพื้นฐานและประวัติสถานศึกษา
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-2">
                  สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม
                </p>
              </div>

              {/* Subtabs */}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                {[
                  { id: 'history', label: 'ประวัติความเป็นมา', icon: Building2 },
                  { id: 'admin', label: 'คณะผู้บริหาร & กลุ่มงาน', icon: Users },
                  { id: 'teachers', label: 'คณะครูและบุคลากร', icon: Award },
                  { id: 'vision', label: 'วิสัยทัศน์ & PPK Model', icon: Compass }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = aboutActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAboutActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-neutral-950 text-white shadow-xs'
                          : 'bg-neutral-100 text-neutral-600 hover:text-neutral-950 hover:bg-neutral-200/80'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Subtab 1: History */}
              {aboutActiveTab === 'history' && (
                <div className="space-y-6">
                  <div className="bg-white p-8 sm:p-12 rounded-3xl border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-6 text-neutral-600 leading-relaxed text-sm sm:text-base font-normal">
                    <h3 className="text-xl font-semibold text-neutral-950 pb-4 border-b border-neutral-100">
                      ประวัติการก่อตั้งสถานศึกษา
                    </h3>
                    <p>
                      โรงเรียนโพนงามพิทยานุกูล อำเภอโกสุมพิสัย จังหวัดมหาสารคาม สังกัดสำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม (สพม.มหาสารคาม) เดิมมีฐานะเป็น <strong>"สาขาโรงเรียนโกสุมวิทยาสรรค์"</strong>
                    </p>
                    <p>
                      ก่อตั้งขึ้นเมื่อปี พ.ศ. 2534 โดย <strong>นายณรงค์ จันทชุม</strong> ผู้อำนวยการโรงเรียนโกสุมวิทยาสรรค์ในขณะนั้น ได้ร่วมกับผู้นำชุมชน นำโดย <strong>นายวินัย สมศรีลัย</strong> กำนันตำบลโพนงาม พร้อมด้วยผู้ใหญ่บ้านทุกหมู่บ้าน มีมติเห็นชอบร่วมกันในการใช้พื้นที่ดินสาธารณประโยชน์ <strong>"โคกหนองเรือ"</strong> เนื้อที่ 32 ไร่ 3 งาน 72 ตารางวา เป็นสถานที่ตั้งโรงเรียนสาขา
                    </p>
                    <p>
                      ต่อมาได้รับอนุมัติจากกรมสามัญศึกษาให้ยกฐานะเป็นโรงเรียนเอกเทศอย่างเป็นทางการ เมื่อวันที่ <strong>3 กุมภาพันธ์ พ.ศ. 2538</strong> (คำสั่งกรมสามัญศึกษาที่ 391/2538) และใช้ชื่อว่า <strong>"โรงเรียนโพนงามพิทยานุกูล"</strong> โดยมีอักษรย่อว่า <strong>"พ.พ.ก."</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Subtab 2: Admin */}
              {aboutActiveTab === 'admin' && (
                <div className="space-y-10">
                  {/* Director Card */}
                  <div className="bg-white p-8 rounded-3xl border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    <div className="w-32 h-40 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/80 shrink-0">
                      <img 
                        src="/images/director.jpg" 
                        alt="ผู้อำนวยการโรงเรียน" 
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200/60">
                        ผู้บริหารสูงสุดของสถานศึกษา
                      </span>
                      <h3 className="text-2xl font-semibold text-neutral-950 mt-2">
                        นายวัชรินทร์ ติดวงษา
                      </h3>
                      <p className="text-sm font-medium text-neutral-700 mt-0.5">
                        ผู้อำนวยการโรงเรียนโพนงามพิทยานุกูล
                      </p>
                      <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed max-w-xl">
                        วิทยฐานะ: ผู้อำนวยการชำนาญการพิเศษ <br />
                        มุ่งมั่นบริหารงานสถานศึกษาด้วยความโปร่งใส ตามหลักธรรมาภิบาล และการมีส่วนร่วมของชุมชน
                      </p>
                    </div>
                  </div>

                  {/* 4 Group Heads */}
                  <div>
                    <h4 className="font-semibold text-base text-neutral-950 mb-5">
                      หัวหน้ากลุ่มบริหารงาน 4 ฝ่าย
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {administrators.map((admin, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-2xl border border-neutral-200/80 text-center flex flex-col items-center hover:border-neutral-300 transition">
                          <div className="w-24 h-32 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/80 mb-3.5 shrink-0">
                            <img 
                              src={admin.photo} 
                              alt={admin.name} 
                              className="w-full h-full object-cover object-top"
                            />
                          </div>
                          <h5 className="font-semibold text-xs sm:text-sm text-neutral-950 leading-tight">
                            {admin.name}
                          </h5>
                          <p className="text-xs text-neutral-600 font-medium mt-1">
                            {admin.role}
                          </p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {admin.position}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtab 3: Teachers */}
              {aboutActiveTab === 'teachers' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-neutral-950">
                      ทำเนียบคณะครูและบุคลากรทางการศึกษา
                    </h3>
                    <p className="text-xs text-neutral-500 mt-1">
                      คณะครูผู้สอนโรงเรียนโพนงามพิทยานุกูล สพม.มหาสารคาม
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {teachers.map((t, idx) => (
                      <div key={idx} className="bg-white p-5 rounded-2xl border border-neutral-200/80 text-center flex flex-col items-center hover:border-neutral-300 transition">
                        <div className="w-20 h-28 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200/80 mb-3 shrink-0">
                          <img 
                            src={t.photo} 
                            alt={t.name} 
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <h5 className="font-semibold text-xs sm:text-sm text-neutral-950 leading-tight">
                          {t.name}
                        </h5>
                        <p className="text-[11px] text-neutral-600 font-medium mt-0.5">
                          {t.position}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          {t.department}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subtab 4: Vision */}
              {aboutActiveTab === 'vision' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 sm:p-10 rounded-3xl border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200/60">
                        วิสัยทัศน์ (Vision)
                      </span>
                      <h4 className="text-xl font-semibold text-neutral-950 leading-snug">
                        เป็นองค์กรคุณภาพ สืบสานศาสตร์พระราชา จัดการศึกษาสู่ความเป็นเลิศ
                      </h4>
                      <p className="text-xs text-neutral-500 leading-relaxed font-normal">
                        มุ่งเน้นการพัฒนาผู้เรียนให้มีสมรรถนะตามมาตรฐานสากล มีทักษะในศตวรรษที่ 21 ควบคู่คุณธรรมจริยธรรม และน้อมนำหลักปรัชญาของเศรษฐกิจพอเพียงมาปรับใช้ในการดำเนินชีวิต
                      </p>
                    </div>

                    <div className="bg-white p-8 sm:p-10 rounded-3xl border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-4">
                      <span className="text-[10px] font-semibold tracking-wider uppercase text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200/60">
                        คำขวัญโรงเรียน (Motto)
                      </span>
                      <h4 className="text-xl font-semibold text-neutral-950 leading-snug">
                        ส่องความรู้คู่คุณธรรมนำชุมชน พัฒนาคนให้รู้คิดจิตสร้างสรรค์
                      </h4>
                      <p className="text-xs text-neutral-500 leading-relaxed font-normal">
                        ส่งเสริมการเรียนรู้ตลอดชีวิตของนักเรียน สร้างสรรค์ปัญญา พัฒนาตนเองและร่วมสร้างประโยชน์ให้แก่ชุมชนและสังคมอย่างยั่งยืน
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
              {filteredPosts.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-neutral-200/80 p-8">
                  <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-xs font-medium text-neutral-500">ไม่พบข่าวสารในหมวดหมู่นี้</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredPosts.map((post) => (
                    <article 
                      key={post.id}
                      onClick={() => handleOpenPost(post)}
                      className="group cursor-pointer flex flex-col justify-between"
                    >
                      <div className="aspect-16/10 w-full overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-200/70 mb-4">
                        <img 
                          src={post.image_url || '/images/news-active-learning.jpg'} 
                          alt={post.title} 
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
                <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-neutral-900 mx-auto mb-4" />
                  <p className="text-xs font-medium text-neutral-500">กำลังโหลดเนื้อหาหน้าเพจ...</p>
                </div>
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
                      {activeDynamicPage.created_by_agent && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                          <Bot className="w-3.5 h-3.5 text-neutral-600" />
                          ออกแบบโดย {activeDynamicPage.agent_name || 'AI Webmaster'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Render Gutenberg Blocks if available */}
                  {activeDynamicPage.layout_type === 'blocks' && activeDynamicPage.layout_data ? (
                    <BlockRenderer blocks={activeDynamicPage.layout_data} />
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
      )}

      {/* 6. Post Reader Modal (Apple Minimal) */}
      {readingPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setReadingPost(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-neutral-200 relative my-auto animate-in fade-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingPost && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1 bg-white/95 rounded-full text-xs text-neutral-600 border border-neutral-200">
                <Loader2 className="w-3 h-3 animate-spin text-neutral-900" />
                กำลังโหลด...
              </div>
            )}

            <button 
              onClick={() => setReadingPost(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-neutral-900/60 hover:bg-neutral-900 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {readingPost.image_url && (
              <div className="aspect-16/9 w-full overflow-hidden bg-neutral-100">
                <img 
                  src={readingPost.image_url} 
                  alt={readingPost.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 sm:p-10 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
                  <span className="text-neutral-900 font-medium bg-neutral-100 px-2.5 py-0.5 rounded-full">
                    {readingPost.category}
                  </span>
                  <span>•</span>
                  <span>{formatThaiDate(readingPost.created_at)}</span>
                  <span>•</span>
                  <span>ผู้เขียน: {readingPost.author || 'โรงเรียนโพนงามพิทยานุกูล'}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-semibold text-neutral-950 leading-snug">
                  {readingPost.title}
                </h3>
              </div>

              {readingPost.summary && (
                <div className="p-4 rounded-2xl bg-neutral-50 border-l-2 border-neutral-900 text-neutral-700 text-xs sm:text-sm leading-relaxed font-normal">
                  {readingPost.summary}
                </div>
              )}

              <div className="text-neutral-600 text-xs sm:text-sm leading-loose whitespace-pre-line font-normal">
                {readingPost.content}
              </div>

              <div className="pt-6 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-400">
                <span>ยอดเข้าชม {readingPost.views || 0} ครั้ง</span>
                <button 
                  onClick={() => setReadingPost(null)}
                  className="px-5 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full font-medium transition cursor-pointer"
                >
                  ปิด (ESC)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Footer (Akat Coding Center Warm Dark Footer) */}
      <footer className="border-t-2 border-[#FD9800] bg-[#141006] py-14 px-4 sm:px-6 text-[#FEF9E1]/70 text-xs mt-auto">
        <div className="max-w-6xl mx-auto space-y-10">
          
          <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white p-1 flex items-center justify-center shrink-0 shadow-md">
                <img src="/images/logo.png" alt="PPKS" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-white font-bold text-base">
                  {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'}
                </p>
                <p className="text-[#FEDB3B] text-xs mt-0.5">
                  สำนักงานเขตพื้นที่การศึกษามัธยมศึกษาจังหวัดมหาสารคาม
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-[#FEF9E1]/80 font-medium">
              <button onClick={() => navigateTo('home')} className="hover:text-[#FEDB3B] transition cursor-pointer">หน้าแรก</button>
              <button onClick={() => navigateTo('about')} className="hover:text-[#FEDB3B] transition cursor-pointer">เกี่ยวกับโรงเรียน</button>
              <button onClick={() => navigateTo('eservice')} className="hover:text-[#FEDB3B] transition cursor-pointer">ระบบ E-Service</button>
              <button onClick={() => navigateTo('news')} className="hover:text-[#FEDB3B] transition cursor-pointer">บทความ & ข่าวสาร</button>
              <button onClick={() => navigateTo('contact')} className="hover:text-[#FEDB3B] transition cursor-pointer">ติดต่อเรา</button>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[#FEF9E1]/50 gap-4 text-xs">
            <p>Copyright © 2026 {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'} (พ.พ.ก.)</p>
            <p>Powered by Smart School CMS • เว็บไซต์ทางการ: <a href="https://www.ppks.ac.th" target="_blank" rel="noopener noreferrer" className="text-[#FEDB3B] hover:underline">www.ppks.ac.th</a></p>
          </div>

        </div>
      </footer>

    </div>
  );
}
