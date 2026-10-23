import { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Database, 
  Server, 
  Layers, 
  Cpu, 
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  FileText,
  Phone,
  Shield,
  Eye,
  Calendar,
  Search,
  Filter,
  Bot,
  Flame,
  ArrowRight,
  User,
  Share2,
  Clock
} from 'lucide-react';
import { fetchPosts, fetchPost, fetchStats } from './api';

export default function App() {
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [readingPost, setReadingPost] = useState(null);
  const [loadingPost, setLoadingPost] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Categories list
  const categories = ['ทั้งหมด', 'วิชาการ', 'กิจกรรม', 'ข่าวสาร AI'];

  // Load initial data
  useEffect(() => {
    Promise.all([
      fetchPosts({ limit: 50 }),
      fetchStats().catch(() => null)
    ])
      .then(([postsData, statsData]) => {
        if (Array.isArray(postsData)) {
          setPosts(postsData);
        }
        if (statsData) {
          setStats(statsData);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  // Featured slider posts (take top 4 posts with images)
  const featuredPosts = posts.filter(p => p.image_url).slice(0, 4);

  // Auto advance slider every 5.5 seconds
  useEffect(() => {
    if (featuredPosts.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % featuredPosts.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [featuredPosts.length]);

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
      post.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Trending / popular posts (top 3 by views or latest)
  const trendingPosts = [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);

  // Open reading modal and fetch full post details (to increment view count)
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* 1. Main Navigation Bar (Clean Green & White) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Logo & School Name */}
          <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-lg text-slate-900 leading-tight truncate">
                {stats?.school_name || 'โรงเรียนสาธิตนวัตกรรมวิทยาการ'}
              </h1>
              <p className="text-[11px] sm:text-xs text-emerald-700 font-medium truncate">
                ศูนย์รวมข่าวสาร ประชาสัมพันธ์ และนวัตกรรมการศึกษา
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => { setSelectedCategory('ทั้งหมด'); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
              className="text-sm font-semibold text-slate-700 hover:text-emerald-600 transition"
            >
              ข่าวทั้งหมด
            </button>
            <button 
              onClick={() => { setSelectedCategory('วิชาการ'); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition"
            >
              วิชาการ
            </button>
            <button 
              onClick={() => { setSelectedCategory('กิจกรรม'); window.scrollTo({ top: 400, behavior: 'smooth' }); }}
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition"
            >
              กิจกรรม
            </button>

            <button 
              type="button"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              แอดมิน
            </button>
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2.5 shadow-lg">
            <button 
              onClick={() => { setSelectedCategory('ทั้งหมด'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              ข่าวทั้งหมด
            </button>
            <button 
              onClick={() => { setSelectedCategory('วิชาการ'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              วิชาการ
            </button>
            <button 
              onClick={() => { setSelectedCategory('กิจกรรม'); setMobileMenuOpen(false); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              กิจกรรม
            </button>
          </div>
        )}
      </header>

      {/* 2. Breaking News Ticker (แถบข่าวด่วน) */}
      {posts.length > 0 && (
        <div className="bg-slate-900 text-white py-2 px-4 text-xs sm:text-sm border-b border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[11px] uppercase tracking-wide shrink-0 animate-pulse">
              <Flame className="w-3.5 h-3.5" />
              ประกาศด่วน
            </div>
            <div className="truncate flex-1 cursor-pointer hover:underline text-slate-200" onClick={() => handleOpenPost(posts[0])}>
              {posts[0].title}
            </div>
            <span className="text-slate-400 text-xs hidden sm:inline shrink-0">
              {formatThaiDate(posts[0].created_at)}
            </span>
          </div>
        </div>
      )}

      {/* 3. Hero News Section (สไลเดอร์ข่าวเด่น + คอลัมน์ข่าวน่าสนใจข้างๆ) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Main Hero Slider (8 Columns on desktop) */}
          <div className="lg:col-span-8 relative rounded-3xl overflow-hidden shadow-md bg-slate-900 min-h-[360px] sm:min-h-[460px] flex flex-col justify-end group">
            {featuredPosts.length > 0 ? (
              <>
                {/* Current Slide Background Image with Zoom Effect */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out transform group-hover:scale-105"
                  style={{ backgroundImage: `url(${featuredPosts[activeSlide]?.image_url})` }}
                >
                  {/* High Contrast Gradient Overlay for Perfect Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-transparent to-transparent"></div>
                </div>

                {/* Slider Content */}
                <div className="relative z-10 p-6 sm:p-10 space-y-3 sm:space-y-4 max-w-2xl text-left cursor-pointer" onClick={() => handleOpenPost(featuredPosts[activeSlide])}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
                      {featuredPosts[activeSlide]?.category}
                    </span>
                    {featuredPosts[activeSlide]?.created_by_agent && (
                      <span className="px-3 py-1 rounded-full bg-purple-600/90 text-white font-medium text-xs flex items-center gap-1 shadow-xs backdrop-blur-xs">
                        <Bot className="w-3.5 h-3.5 text-purple-200" />
                        AI Agent: {featuredPosts[activeSlide]?.agent_name || 'AI'}
                      </span>
                    )}
                    <span className="text-slate-300 text-xs flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatThaiDate(featuredPosts[activeSlide]?.created_at)}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight sm:leading-snug hover:text-emerald-300 transition line-clamp-2">
                    {featuredPosts[activeSlide]?.title}
                  </h2>

                  <p className="text-slate-200 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 leading-relaxed opacity-90">
                    {featuredPosts[activeSlide]?.summary}
                  </p>

                  <div className="pt-2 flex items-center gap-4 text-xs text-emerald-300 font-semibold">
                    <span className="flex items-center gap-1.5 underline underline-offset-4">
                      อ่านต่อฉบับเต็ม <ArrowRight className="w-4 h-4" />
                    </span>
                    <span className="text-slate-400 flex items-center gap-1 font-normal">
                      <Eye className="w-3.5 h-3.5" /> {featuredPosts[activeSlide]?.views || 0} ครั้ง
                    </span>
                  </div>
                </div>

                {/* Slider Controls (Prev / Next Buttons) */}
                <div className="absolute top-1/2 -translate-y-1/2 left-3 right-3 flex justify-between z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveSlide(prev => (prev - 1 + featuredPosts.length) % featuredPosts.length); }}
                    className="w-10 h-10 rounded-full bg-black/50 hover:bg-emerald-600 text-white flex items-center justify-center backdrop-blur-md transition pointer-events-auto cursor-pointer"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveSlide(prev => (prev + 1) % featuredPosts.length); }}
                    className="w-10 h-10 rounded-full bg-black/50 hover:bg-emerald-600 text-white flex items-center justify-center backdrop-blur-md transition pointer-events-auto cursor-pointer"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                {/* Slide Indicators (Dots) */}
                <div className="absolute bottom-4 right-6 sm:right-10 z-20 flex items-center gap-2">
                  {featuredPosts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        activeSlide === idx ? 'w-8 bg-emerald-400' : 'w-2 bg-white/50 hover:bg-white'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-400">
                กำลังโหลดข่าวสาร...
              </div>
            )}
          </div>

          {/* Side Column: Trending & Top Stories (4 Columns on desktop) */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                  <h3 className="font-bold text-slate-900 text-base">ข่าวยอดนิยมประจำสัปดาห์</h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Trending</span>
              </div>

              {/* Side Stories List */}
              <div className="space-y-4">
                {trendingPosts.map((post, idx) => (
                  <div 
                    key={post.id || idx}
                    onClick={() => handleOpenPost(post)}
                    className="group flex items-start gap-3.5 pb-3 border-b border-slate-100 last:border-b-0 cursor-pointer"
                  >
                    <span className="text-xl font-extrabold text-slate-300 group-hover:text-emerald-600 transition shrink-0 w-5">
                      0{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {post.category}
                      </span>
                      <h4 className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-emerald-700 transition leading-snug line-clamp-2 mt-0.5">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-slate-400">
                        <span>{formatThaiDate(post.created_at)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* School Stats Box */}
            <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100/80 flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-medium">รวมข่าวและประกาศทั้งหมด</span>
              <span className="font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                {posts.length} ข่าว
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Category Tabs & Search Bar (ตัวกรองหมวดหมู่และค้นหา) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-6">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat === 'ข่าวสาร AI' ? (
                  <span className="flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" />
                    {cat}
                  </span>
                ) : cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="ค้นหาหัวข้อข่าวสาร..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      </section>

      {/* 5. Main News Cards Grid (คลังข่าวสารและกิจกรรม) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 flex-1">
        
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {selectedCategory === 'ทั้งหมด' ? 'ข่าวประชาสัมพันธ์ล่าสุด' : `หมวดหมู่: ${selectedCategory}`}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              พบข่าวสารทั้งหมด {filteredPosts.length} รายการ
            </p>
          </div>
        </div>

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <article 
                key={post.id}
                onClick={() => handleOpenPost(post)}
                className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-emerald-200 transition-all duration-300 flex flex-col group cursor-pointer"
              >
                {/* News Card Image Cover */}
                <div className="relative aspect-video sm:aspect-16/10 overflow-hidden bg-slate-100">
                  <img 
                    src={post.image_url || 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80'} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  
                  {/* Category Pill Tag */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/95 text-emerald-800 shadow-xs backdrop-blur-xs">
                      {post.category}
                    </span>
                    {post.created_by_agent && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-700/95 text-white flex items-center gap-1 shadow-xs backdrop-blur-xs">
                        <Bot className="w-3 h-3" />
                        AI
                      </span>
                    )}
                  </div>
                </div>

                {/* News Card Body */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatThaiDate(post.created_at)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author || 'โรงเรียน'}
                      </span>
                    </div>

                    <h4 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-emerald-700 transition leading-snug line-clamp-2">
                      {post.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {post.summary || post.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 font-semibold group-hover:underline flex items-center gap-1">
                      อ่านรายละเอียด <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> {post.views || 0}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-800 text-lg">ไม่พบข่าวสารในหมวดหมู่นี้</h4>
            <p className="text-slate-500 text-xs sm:text-sm">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่นเพื่อดูรายการข่าว</p>
            <button 
              onClick={() => { setSelectedCategory('ทั้งหมด'); setSearchQuery(''); }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer"
            >
              แสดงข่าวทั้งหมด
            </button>
          </div>
        )}

      </main>

      {/* 6. Single Post Reader Modal (หน้าต่างอ่านข่าวฉบับเต็ม สบายตา) */}
      {readingPost && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setReadingPost(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative my-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setReadingPost(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cover Image */}
            {readingPost.image_url && (
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                <img 
                  src={readingPost.image_url} 
                  alt={readingPost.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Article Content */}
            <div className="p-6 sm:p-10 space-y-6">
              
              {/* Category & Metadata */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {readingPost.category}
                  </span>
                  {readingPost.created_by_agent && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" />
                      ข่าวสร้างโดย AI: {readingPost.agent_name || 'Agent'}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                  {readingPost.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 pt-1 pb-4 border-b border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-400" />
                    ผู้เขียน: {readingPost.author || 'โรงเรียน'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {formatThaiDate(readingPost.created_at)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-slate-400" />
                    ยอดเข้าชม: {readingPost.views || 0} ครั้ง
                  </span>
                </div>
              </div>

              {/* Summary Lead Paragraph */}
              {readingPost.summary && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border-l-4 border-emerald-600 text-slate-700 text-sm sm:text-base font-medium leading-relaxed">
                  {readingPost.summary}
                </div>
              )}

              {/* Body Content */}
              <div className="text-slate-800 text-sm sm:text-base leading-loose space-y-4 whitespace-pre-line font-normal">
                {readingPost.content}
              </div>

              {/* Modal Footer */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {stats?.school_name || 'โรงเรียนสาธิตนวัตกรรมวิทยาการ'}
                </span>
                <button 
                  onClick={() => setReadingPost(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 7. Footer (Clean School News Footer) */}
      <footer className="border-t border-slate-200 bg-white py-10 px-4 sm:px-6 text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-800">
              {stats?.school_name || 'โรงเรียนสาธิตนวัตกรรมวิทยาการ'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 text-xs">
            <span>ขับเคลื่อนด้วย Go 1.26 + Remote PostgreSQL (fame_vps)</span>
            <span className="text-slate-300">|</span>
            <span className="text-purple-700 font-medium">AI Agent-Ready Architecture</span>
          </div>

          <p className="text-xs text-slate-400">
            © 2026 สงวนลิขสิทธิ์ตาม พ.ร.บ.
          </p>
        </div>
      </footer>

    </div>
  );
}
