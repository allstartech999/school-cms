import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Files,
  Image as ImageIcon,
  Sliders,
  Settings,
  LogOut,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Upload,
  RefreshCw,
  Eye,
  Key,
  ShieldAlert,
  Save,
  X,
  AlertCircle,
  Sparkles,
  Bot,
  Layers,
  Globe,
  Loader2,
  Users,
  KeyRound,
  Shield,
  UserCheck,
  Power,
  Lock,
  Tag,
  ChevronLeft,
  ChevronRight,
  Home,
  Building2,
  Newspaper,
  Phone,
  GraduationCap,
  Puzzle
} from 'lucide-react';
import AdminExtensions from './AdminExtensions';
import {
  fetchPosts,
  createPost,
  updatePost,
  deletePost,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchPages,
  createPage,
  updatePage,
  deletePage,
  fetchAdminStats,
  fetchMedia,
  uploadMedia,
  deleteMedia,
  fetchHomepageConfig,
  updateHomepageConfig,
  fetchSiteSettings,
  updateSiteSettings,
  adminChangePassword,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  fetchAgentKeys,
  createAgentKey,
  deleteAgentKey,
  toggleAgentKey
} from '../../api';
import {
  Skeleton,
  AdminStatCardSkeleton,
  AdminTableSkeleton,
  MediaGridSkeleton
} from '../skeleton';

export default function AdminDashboard({ onLogout, onViewSite, token, initialMustChangePassword = false }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, posts, pages, media, customizer, settings
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('school_admin_user') || 'null');
    } catch {
      return null;
    }
  });

  // Force Change Password State (on first login)
  const [mustChangePassword, setMustChangePassword] = useState(initialMustChangePassword);
  const [forceOldPassword, setForceOldPassword] = useState('');
  const [forceNewPassword, setForceNewPassword] = useState('');
  const [forceConfirmPassword, setForceConfirmPassword] = useState('');
  const [forcePasswordLoading, setForcePasswordLoading] = useState(false);
  const [forcePasswordError, setForcePasswordError] = useState('');

  // Data States
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [homepageConfig, setHomepageConfigState] = useState(null);
  const [siteSettings, setSiteSettingsState] = useState(null);

  // Posts Filters & Pagination
  const [postSearch, setPostSearch] = useState('');
  const [postCategoryFilter, setPostCategoryFilter] = useState('ทั้งหมด');
  const [adminPostPage, setAdminPostPage] = useState(1);
  const adminPostsPerPage = 10;

  // Modals
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null); // null = create new
  const [postFormData, setPostFormData] = useState({
    title: '',
    slug: '',
    category: 'วิชาการ',
    summary: '',
    content: '',
    image_url: '',
    status: 'published',
    author: 'โรงเรียนโพนงามพิทยานุกูล'
  });

  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [pageFormData, setPageFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'published',
    show_in_menu: false,
    show_in_bottom_nav: false,
    menu_icon: ''
  });

  // Users Management State
  const [users, setUsers] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    name: '',
    role: 'admin',
    password: ''
  });
  const [submittingUser, setSubmittingUser] = useState(false);

  // AI Agent API Keys State
  const [agentKeys, setAgentKeys] = useState([]);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [keyFormData, setKeyFormData] = useState({
    name: '',
    description: ''
  });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [submittingKey, setSubmittingKey] = useState(false);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Media Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedMediaId, setCopiedMediaId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Submitting States
  const [submittingPost, setSubmittingPost] = useState(false);
  const [submittingPage, setSubmittingPage] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingHomepage, setSavingHomepage] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, postsData, categoriesData, pagesData, mediaData, homeData, settingsData, usersData, keysData] = await Promise.all([
        fetchAdminStats(token).catch(() => null),
        fetchPosts({ limit: 100 }).catch(() => []),
        fetchCategories().catch(() => []),
        fetchPages().catch(() => []),
        fetchMedia(100).catch(() => []),
        fetchHomepageConfig().catch(() => null),
        fetchSiteSettings().catch(() => null),
        fetchUsers(token).catch(() => []),
        fetchAgentKeys(token).catch(() => [])
      ]);

      if (statsData) {
        setStats(statsData);
        if (statsData.must_change_password) {
          setMustChangePassword(true);
        }
      }
      if (postsData) setPosts(Array.isArray(postsData) ? postsData : []);
      if (categoriesData) setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      if (pagesData) setPages(Array.isArray(pagesData) ? pagesData : []);
      if (mediaData) setMediaList(Array.isArray(mediaData) ? mediaData : []);
      if (homeData) setHomepageConfigState(homeData);
      if (settingsData) setSiteSettingsState(settingsData);
      if (usersData) setUsers(Array.isArray(usersData) ? usersData : []);
      if (keysData) setAgentKeys(Array.isArray(keysData) ? keysData : []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      showNotification('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForceChangePassword = async (e) => {
    e.preventDefault();
    setForcePasswordError('');

    if (!forceOldPassword.trim()) {
      setForcePasswordError('กรุณากรอกรหัสผ่านเดิม');
      return;
    }
    if (forceNewPassword.length < 4) {
      setForcePasswordError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }
    if (forceNewPassword === forceOldPassword) {
      setForcePasswordError('รหัสผ่านใหม่ต้องไม่ตรงกับรหัสผ่านเดิม');
      return;
    }
    if (forceNewPassword !== forceConfirmPassword) {
      setForcePasswordError('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน');
      return;
    }

    setForcePasswordLoading(true);
    try {
      await adminChangePassword(forceOldPassword, forceNewPassword, token);
      setMustChangePassword(false);
      showNotification('ตั้งรหัสผ่านใหม่สำเร็จแล้ว สามารถเริ่มใช้งานระบบได้ทันที');
      const updatedStats = await fetchAdminStats(token);
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to change initial password:', err);
      setForcePasswordError(err.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาตรวจสอบรหัสผ่านเดิม');
    } finally {
      setForcePasswordLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  // Handle Post Modal Open
  const handleOpenCreatePost = () => {
    setEditingPost(null);
    setPostFormData({
      title: '',
      slug: '',
      category: categories[0]?.name || 'วิชาการ',
      summary: '',
      content: '',
      image_url: '',
      status: 'published',
      author: stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'
    });
    setPostModalOpen(true);
  };

  const handleOpenEditPost = (post) => {
    setEditingPost(post);
    setPostFormData({
      title: post.title || '',
      slug: post.slug || '',
      category: post.category || categories[0]?.name || 'วิชาการ',
      summary: post.summary || '',
      content: post.content || '',
      image_url: post.image_url || '',
      status: post.status || 'published',
      author: post.author || stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'
    });
    setPostModalOpen(true);
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!postFormData.title.trim()) {
      showNotification('กรุณากรอกหัวข้อข่าว', 'error');
      return;
    }

    setSubmittingPost(true);
    try {
      // Auto-generate slug if empty
      const payload = {
        ...postFormData,
        slug: postFormData.slug.trim() || `post-${Date.now()}`
      };

      if (editingPost) {
        await updatePost(editingPost.id, payload, token);
        showNotification('บันทึกการแก้ไขข่าวสารเรียบร้อยแล้ว');
      } else {
        await createPost(payload, token);
        showNotification('สร้างข่าวสารใหม่เรียบร้อยแล้ว');
      }

      setPostModalOpen(false);
      const updatedPosts = await fetchPosts({ limit: 100 });
      setPosts(updatedPosts);
      const updatedStats = await fetchAdminStats(token);
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to save post:', err);
      showNotification(err.message || 'บันทึกข่าวสารไม่สำเร็จ', 'error');
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleDeletePost = async (id, title) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข่าว "${title}"? การลบนี้ไม่สามารถย้อนกลับได้`)) {
      return;
    }

    try {
      await deletePost(id, token);
      showNotification('ลบข่าวสารสำเร็จ');
      setPosts(posts.filter((p) => p.id !== id));
      const updatedStats = await fetchAdminStats(token);
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to delete post:', err);
      showNotification(err.message || 'ลบข่าวสารไม่สำเร็จ', 'error');
    }
  };

  // Category Management Handlers
  const handleCreateCategory = async (e) => {
    e?.preventDefault();
    const name = newCategoryName.trim();
    if (!name) {
      showNotification('กรุณาระบุชื่อหมวดหมู่', 'error');
      return;
    }
    setCategoryLoading(true);
    try {
      await createCategory({ name }, token);
      showNotification(`เพิ่มหมวดหมู่ "${name}" สำเร็จ`);
      setNewCategoryName('');
      const updatedCats = await fetchCategories();
      setCategories(Array.isArray(updatedCats) ? updatedCats : []);
    } catch (err) {
      console.error('Failed to create category:', err);
      showNotification(err.message || 'เพิ่มหมวดหมู่ไม่สำเร็จ', 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleUpdateCategory = async (catId, newName) => {
    const name = newName.trim();
    if (!name) return;
    setCategoryLoading(true);
    try {
      await updateCategory(catId, { name }, token);
      showNotification('แก้ไขหมวดหมู่สำเร็จ');
      setEditingCategoryId(null);
      setEditingCategoryName('');
      const [updatedCats, updatedPosts] = await Promise.all([
        fetchCategories().catch(() => []),
        fetchPosts({ limit: 100 }).catch(() => [])
      ]);
      setCategories(Array.isArray(updatedCats) ? updatedCats : []);
      setPosts(Array.isArray(updatedPosts) ? updatedPosts : []);
    } catch (err) {
      console.error('Failed to update category:', err);
      showNotification(err.message || 'แก้ไขหมวดหมู่ไม่สำเร็จ', 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (cat.name === 'ทั่วไป') {
      showNotification('ไม่สามารถลบหมวดหมู่เริ่มต้น "ทั่วไป" ได้', 'error');
      return;
    }
    if (!window.confirm(`ยืนยันการลบหมวดหมู่ "${cat.name}" หรือไม่?\n\nหมายเหตุ: ข่าวสารที่อยู่ในหมวดหมู่นี้ทั้งหมด (${cat.posts_count || 0} ข่าว) จะถูกย้ายไปอยู่หมวดหมู่ "ทั่วไป" โดยอัตโนมัติ`)) {
      return;
    }
    setCategoryLoading(true);
    try {
      await deleteCategory(cat.id, token);
      showNotification(`ลบหมวดหมู่ "${cat.name}" สำเร็จ`);
      const [updatedCats, updatedPosts] = await Promise.all([
        fetchCategories().catch(() => []),
        fetchPosts({ limit: 100 }).catch(() => [])
      ]);
      setCategories(Array.isArray(updatedCats) ? updatedCats : []);
      setPosts(Array.isArray(updatedPosts) ? updatedPosts : []);
    } catch (err) {
      console.error('Failed to delete category:', err);
      showNotification(err.message || 'ลบหมวดหมู่ไม่สำเร็จ', 'error');
    } finally {
      setCategoryLoading(false);
    }
  };

  // Helper to render icon preview
  const renderMenuIconPreview = (iconName) => {
    switch (iconName) {
      case 'Home': return <Home className="w-5 h-5 text-emerald-600" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-emerald-600" />;
      case 'Newspaper': return <Newspaper className="w-5 h-5 text-emerald-600" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-emerald-600" />;
      case 'Phone': return <Phone className="w-5 h-5 text-emerald-600" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5 text-emerald-600" />;
      case 'Users': return <Users className="w-5 h-5 text-emerald-600" />;
      case 'FileText': return <FileText className="w-5 h-5 text-emerald-600" />;
      default: return <Sparkles className="w-5 h-5 text-neutral-400" />;
    }
  };

  // Handle Page Modal Open
  const handleOpenCreatePage = () => {
    setEditingPage(null);
    setPageFormData({
      title: '',
      slug: '',
      content: '',
      status: 'published',
      show_in_menu: false,
      show_in_bottom_nav: false,
      menu_icon: ''
    });
    setPageModalOpen(true);
  };

  const handleOpenEditPage = (page) => {
    setEditingPage(page);
    setPageFormData({
      title: page.title || '',
      slug: page.slug || '',
      content: page.content || '',
      status: page.status || 'published',
      show_in_menu: !!page.show_in_menu,
      show_in_bottom_nav: !!page.show_in_bottom_nav,
      menu_icon: page.menu_icon || ''
    });
    setPageModalOpen(true);
  };

  const handleSavePage = async (e) => {
    e.preventDefault();
    if (!pageFormData.title.trim() || !pageFormData.slug.trim()) {
      showNotification('กรุณากรอกชื่อหน้าเพจและ Slug', 'error');
      return;
    }

    setSubmittingPage(true);
    try {
      if (editingPage) {
        await updatePage(editingPage.id, pageFormData, token);
        showNotification('แก้ไขหน้าเพจเรียบร้อยแล้ว');
      } else {
        await createPage(pageFormData, token);
        showNotification('สร้างหน้าเพจใหม่เรียบร้อยแล้ว');
      }

      setPageModalOpen(false);
      const updatedPages = await fetchPages();
      setPages(updatedPages);
      const updatedStats = await fetchAdminStats(token);
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to save page:', err);
      showNotification(err.message || 'บันทึกหน้าเพจไม่สำเร็จ', 'error');
    } finally {
      setSubmittingPage(false);
    }
  };

  const handleDeletePage = async (id, title) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหน้า "${title}"?`)) {
      return;
    }

    try {
      await deletePage(id, token);
      showNotification('ลบหน้าเพจสำเร็จ');
      setPages(pages.filter((p) => p.id !== id));
      const updatedStats = await fetchAdminStats(token);
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to delete page:', err);
      showNotification(err.message || 'ลบหน้าเพจไม่สำเร็จ', 'error');
    }
  };

  // Handle Media Upload
  const handleUploadMedia = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      showNotification('กรุณาเลือกไฟล์ภาพที่ต้องการอัปโหลด', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadAlt) formData.append('alt_text', uploadAlt);

      const res = await uploadMedia(formData, token);
      showNotification('อัปโหลดไฟล์สำเร็จ');
      setUploadFile(null);
      setUploadAlt('');
      // Refresh media list
      const updatedMedia = await fetchMedia(100);
      setMediaList(updatedMedia);
    } catch (err) {
      console.error('Failed to upload media:', err);
      showNotification(err.message || 'อัปโหลดไฟล์ไม่สำเร็จ', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (id) => {
    if (!window.confirm('คุณต้องการลบรูปภาพนี้ออกจากระบบหรือไม่?')) return;
    try {
      await deleteMedia(id, token);
      showNotification('ลบรูปภาพสำเร็จ');
      setMediaList(mediaList.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Failed to delete media:', err);
      showNotification(err.message || 'ลบรูปภาพไม่สำเร็จ', 'error');
    }
  };

  const copyToClipboard = (text, mediaId = null) => {
    navigator.clipboard.writeText(text);
    if (mediaId) {
      setCopiedMediaId(mediaId);
      setTimeout(() => setCopiedMediaId(null), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
    showNotification('คัดลอก URL เรียบร้อยแล้ว');
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword) {
      showNotification('กรุณากรอกรหัสผ่านเดิม', 'error');
      return;
    }
    if (newPassword.length < 4) {
      showNotification('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification('รหัสผ่านใหม่และการยืนยันไม่ตรงกัน', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      await adminChangePassword(oldPassword, newPassword, token);
      showNotification('เปลี่ยนรหัสผ่านสำเร็จแล้ว กรุณาจำรหัสผ่านใหม่ของคุณ');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Failed to change password:', err);
      showNotification(err.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle Save Site Settings
  const handleSaveSiteSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await updateSiteSettings(siteSettings, { 'X-Admin-Token': token });
      setSiteSettingsState(updated?.settings || updated);
      showNotification('บันทึกการตั้งค่าเว็บไซต์สำเร็จ');
    } catch (err) {
      console.error('Failed to save settings:', err);
      showNotification(err.message || 'บันทึกการตั้งค่าไม่สำเร็จ', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Save Homepage Config
  const handleSaveHomepageConfig = async (e) => {
    e.preventDefault();
    setSavingHomepage(true);
    try {
      const updated = await updateHomepageConfig(homepageConfig, token);
      const savedConfig = updated?.config || updated;
      setHomepageConfigState(savedConfig);
      try {
        localStorage.setItem('ppk_homepage_config', JSON.stringify(savedConfig));
      } catch (_) {}
      showNotification('บันทึกการตั้งค่าหน้าแรกสำเร็จ');
    } catch (err) {
      console.error('Failed to save homepage config:', err);
      showNotification(err.message || 'บันทึกการตั้งค่าไม่สำเร็จ', 'error');
    } finally {
      setSavingHomepage(false);
    }
  };

  // User Handlers
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserFormData({
      username: '',
      name: '',
      role: 'admin',
      password: ''
    });
    setUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      password: ''
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!userFormData.name.trim()) {
      showNotification('กรุณากรอกชื่อผู้ใช้', 'error');
      return;
    }
    if (!editingUser && !userFormData.username.trim()) {
      showNotification('กรุณากรอกชื่อบัญชี (Username)', 'error');
      return;
    }
    if (!editingUser && (!userFormData.password || userFormData.password.length < 4)) {
      showNotification('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร', 'error');
      return;
    }

    setSubmittingUser(true);
    try {
      if (editingUser) {
        const payload = {
          name: userFormData.name.trim(),
          role: userFormData.role,
        };
        if (userFormData.password && userFormData.password.trim()) {
          payload.password = userFormData.password.trim();
        }
        const updated = await updateUser(editingUser.id, payload, token);
        setUsers(users.map(u => u.id === editingUser.id ? updated : u));
        showNotification('อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว');
      } else {
        const created = await createUser({
          username: userFormData.username.trim(),
          password: userFormData.password.trim(),
          name: userFormData.name.trim(),
          role: userFormData.role
        }, token);
        setUsers([...users, created]);
        showNotification('สร้างผู้ใช้งานใหม่เรียบร้อยแล้ว');
      }
      setUserModalOpen(false);
    } catch (err) {
      console.error('Error saving user:', err);
      showNotification(err.message || 'บันทึกผู้ใช้ไม่สำเร็จ', 'error');
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${user.name}" (${user.username})?`)) {
      return;
    }
    try {
      await deleteUser(user.id, token);
      setUsers(users.filter(u => u.id !== user.id));
      showNotification('ลบผู้ใช้เรียบร้อยแล้ว');
    } catch (err) {
      console.error('Error deleting user:', err);
      showNotification(err.message || 'ลบผู้ใช้ไม่สำเร็จ', 'error');
    }
  };

  // Agent Key Handlers
  const handleOpenCreateKey = () => {
    setKeyFormData({ name: '', description: '' });
    setNewlyCreatedKey(null);
    setKeyModalOpen(true);
  };

  const handleSaveKey = async (e) => {
    e.preventDefault();
    if (!keyFormData.name.trim()) {
      showNotification('กรุณาระบุชื่อเรียก API Key', 'error');
      return;
    }

    setSubmittingKey(true);
    try {
      const res = await createAgentKey(keyFormData, token);
      if (res.key) {
        setNewlyCreatedKey(res.key);
        setAgentKeys([res.key, ...agentKeys]);
        showNotification('สร้าง API Key ใหม่สำเร็จ');
        fetchAdminStats(token).then(s => setStats(s)).catch(() => {});
      }
    } catch (err) {
      console.error('Error creating agent key:', err);
      showNotification(err.message || 'สร้าง API Key ไม่สำเร็จ', 'error');
    } finally {
      setSubmittingKey(false);
    }
  };

  const handleDeleteAgentKey = async (key) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการเพิกถอน/ลบ API Key "${key.name}"? AI Agent ที่ใช้ Key นี้จะไม่สามารถเข้าถึงระบบได้อีก`)) {
      return;
    }
    try {
      await deleteAgentKey(key.id, token);
      setAgentKeys(agentKeys.filter(k => k.id !== key.id));
      showNotification('ลบและเพิกถอน API Key สำเร็จ');
      fetchAdminStats(token).then(s => setStats(s)).catch(() => {});
    } catch (err) {
      console.error('Error deleting agent key:', err);
      showNotification(err.message || 'ลบ API Key ไม่สำเร็จ', 'error');
    }
  };

  const handleToggleAgentKey = async (key) => {
    try {
      const updated = await toggleAgentKey(key.id, token);
      setAgentKeys(agentKeys.map(k => k.id === key.id ? updated : k));
      showNotification(updated.is_active ? 'เปิดใช้งาน API Key แล้ว' : 'ปิดใช้งาน API Key ชั่วคราวแล้ว');
      fetchAdminStats(token).then(s => setStats(s)).catch(() => {});
    } catch (err) {
      console.error('Error toggling agent key:', err);
      showNotification(err.message || 'เปลี่ยนสถานะ API Key ไม่สำเร็จ', 'error');
    }
  };

  // Filtered Posts
  const filteredPosts = posts.filter((p) => {
    const matchCategory = postCategoryFilter === 'ทั้งหมด' || p.category === postCategoryFilter;
    const matchSearch =
      postSearch === '' ||
      p.title?.toLowerCase().includes(postSearch.toLowerCase()) ||
      p.summary?.toLowerCase().includes(postSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Reset admin post page when filter changes
  useEffect(() => {
    setAdminPostPage(1);
  }, [postCategoryFilter, postSearch]);

  const totalAdminPostPages = Math.ceil(filteredPosts.length / adminPostsPerPage) || 1;
  const paginatedAdminPosts = filteredPosts.slice(
    (adminPostPage - 1) * adminPostsPerPage,
    adminPostPage * adminPostsPerPage
  );

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-800 flex flex-col font-sans">
      {/* Top Notification Toast */}
      {notification && (
        <div
          className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-in slide-in-from-top-4 duration-200 text-xs sm:text-sm font-medium ${
            notification.type === 'error'
              ? 'bg-red-600 text-white border-red-700'
              : 'bg-emerald-700 text-white border-emerald-800'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <Check className="w-5 h-5 shrink-0" />}
          <span className="flex-1">{notification.message}</span>
        </div>
      )}

      {/* Admin Navbar */}
      <header className="bg-neutral-900 text-white border-b border-neutral-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-sm shrink-0">
              พ
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-xs sm:text-sm tracking-tight text-white truncate max-w-[125px] xs:max-w-[200px] sm:max-w-xs md:max-w-none">
                  {stats?.school_name || 'โรงเรียนโพนงามพิทยานุกูล'}
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  {currentUser?.name || currentUser?.username || 'Admin'} ({currentUser?.role || 'admin'})
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate hidden xs:block">ระบบบริหารจัดการเว็บไซต์และเนื้อหาหลังบ้าน</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={onViewSite}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer border border-neutral-700"
              title="ดูหน้าเว็บหลัก"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">ดูหน้าเว็บหลัก</span>
            </button>

            <button
              onClick={loadAllData}
              title="รีเฟรชข้อมูล"
              className="p-1.5 sm:p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer border border-neutral-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={onLogout}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="ออกจากระบบ"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-7xl mx-auto px-2 sm:px-6 flex overflow-x-auto scrollbar-none border-t border-neutral-800/80">
          <nav className="flex space-x-1 py-1.5 min-w-max">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>ภาพรวม (Overview)</span>
            </button>

            <button
              onClick={() => setActiveTab('posts')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'posts'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>ข่าวสาร ({posts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('pages')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'pages'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Files className="w-3.5 h-3.5" />
              <span>หน้าเพจ ({pages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'media'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>คลังภาพและสื่อ ({mediaList.length})</span>
            </button>

            {(!currentUser || !currentUser.role || currentUser.role === 'admin' || currentUser.role === 'administrator') && (
              <button
                onClick={() => setActiveTab('extensions')}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'extensions'
                    ? 'bg-emerald-600 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Puzzle className="w-3.5 h-3.5" />
                <span>ปลั๊กอิน & ส่วนเสริม (Plugins)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('customizer')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'customizer'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>ปรับแต่งหน้าแรก</span>
            </button>

            {(!currentUser || currentUser.role === 'admin') && (
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'bg-emerald-600 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>ผู้ใช้งาน ({users.length})</span>
              </button>
            )}

            {(!currentUser || currentUser.role === 'admin') && (
              <button
                onClick={() => setActiveTab('agent_keys')}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'agent_keys'
                    ? 'bg-emerald-600 text-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI API Keys ({agentKeys.length})</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>ตั้งค่า & รหัสผ่าน</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8">
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* 4 Stat Cards */}
            {loading ? (
              <AdminStatCardSkeleton count={4} />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-medium text-neutral-500 truncate">ข่าวสารทั้งหมด</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{stats?.total_posts ?? posts.length}</span>
                    <span className="text-[11px] sm:text-xs text-neutral-400">บทความ</span>
                  </div>
                  <div className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] text-emerald-600 font-medium truncate flex items-center gap-1">
                    <span>สถานะระบบปกติ เผยแพร่ทันที</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-medium text-neutral-500 truncate">หน้าเพจทั้งหมด</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Files className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{stats?.total_pages ?? pages.length}</span>
                    <span className="text-[11px] sm:text-xs text-neutral-400">หน้า</span>
                  </div>
                  <div className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] text-blue-600 font-medium truncate">
                    <span>รองรับ Block-based</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-medium text-neutral-500 truncate">สร้างโดย AI Agent</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{stats?.agent_posts ?? 0}</span>
                    <span className="text-[11px] sm:text-xs text-neutral-400">บทความ</span>
                  </div>
                  <div className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] text-purple-600 font-medium truncate">
                    <span>ผ่าน MCP & Agent API</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-medium text-neutral-500 truncate">ยอดเปิดอ่านรวม</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5 sm:gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900">{stats?.total_views ?? 0}</span>
                    <span className="text-[11px] sm:text-xs text-neutral-400">ครั้ง</span>
                  </div>
                  <div className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] text-amber-600 font-medium truncate">
                    <span>สถิติการเข้าชมจริง</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions & AI Status Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Left: Quick Actions */}
              <div className="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">จัดการด่วน (Quick Actions)</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">เครื่องมือที่ใช้งานบ่อยสำหรับแอดมิน</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    onClick={handleOpenCreatePost}
                    className="p-3.5 sm:p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 transition text-left cursor-pointer group flex sm:block items-center gap-3 sm:gap-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center sm:mb-2.5 shadow-sm group-hover:scale-105 transition shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">เขียนข่าวใหม่</div>
                      <div className="text-[11px] text-emerald-600/80 mt-0.5">เพิ่มข่าวสาร กิจกรรม วิชาการ</div>
                    </div>
                  </button>

                  <button
                    onClick={handleOpenCreatePage}
                    className="p-3.5 sm:p-4 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-800 transition text-left cursor-pointer group flex sm:block items-center gap-3 sm:gap-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center sm:mb-2.5 shadow-sm group-hover:scale-105 transition shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">สร้างหน้าเพจใหม่</div>
                      <div className="text-[11px] text-blue-600/80 mt-0.5">เพิ่มหน้าเนื้อหาเฉพาะโรงเรียน</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('media')}
                    className="p-3.5 sm:p-4 rounded-xl border border-purple-200 bg-purple-50/50 hover:bg-purple-100/60 text-purple-800 transition text-left cursor-pointer group flex sm:block items-center gap-3 sm:gap-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center sm:mb-2.5 shadow-sm group-hover:scale-105 transition shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">อัปโหลดรูปภาพ</div>
                      <div className="text-[11px] text-purple-600/80 mt-0.5">คลังสื่อและรูปภาพโรงเรียน</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('extensions')}
                    className="p-3.5 sm:p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-amber-900 transition text-left cursor-pointer group flex sm:block items-center gap-3 sm:gap-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center sm:mb-2.5 shadow-sm group-hover:scale-105 transition shrink-0">
                      <Puzzle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs">ปลั๊กอิน & Storage (Plugins)</div>
                      <div className="text-[11px] text-amber-700/80 mt-0.5">Cloudflare R2, S3 & ส่วนเสริม</div>
                    </div>
                  </button>
                </div>

                {/* Recent Posts List */}
                <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-neutral-800">ข่าวสารล่าสุดในระบบ</h4>
                    <button
                      onClick={() => setActiveTab('posts')}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer"
                    >
                      ดูทั้งหมด →
                    </button>
                  </div>

                  <div className="space-y-2">
                    {loading ? (
                      <AdminTableSkeleton rows={4} compact={true} />
                    ) : (
                      <>
                        {posts.slice(0, 4).map((post) => (
                          <div
                            key={post.id}
                            className="p-2.5 sm:p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100/80 transition flex items-center justify-between gap-2.5 text-xs"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-semibold shrink-0">
                                {post.category}
                              </span>
                              <span className="font-medium text-neutral-900 truncate">{post.title}</span>
                              {post.created_by_agent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-medium shrink-0 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5" /> AI
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] sm:text-[11px] text-neutral-400 hidden xs:inline">
                                {post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH') : ''}
                              </span>
                              <button
                                onClick={() => handleOpenEditPost(post)}
                                className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                                title="แก้ไข"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {posts.length === 0 && (
                          <div className="text-center py-6 text-xs text-neutral-400">ยังไม่มีข่าวสารในระบบ</div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Recent Pages List */}
                <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-neutral-800">หน้าเพจล่าสุดในระบบ</h4>
                    <button
                      onClick={() => setActiveTab('pages')}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      ดูทั้งหมด →
                    </button>
                  </div>

                  <div className="space-y-2">
                    {loading ? (
                      <AdminTableSkeleton rows={3} compact={true} hasThumbnail={false} />
                    ) : (
                      <>
                        {pages.slice(0, 3).map((page) => (
                          <div
                            key={page.id}
                            className="p-2.5 sm:p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100/80 transition flex items-center justify-between gap-2.5 text-xs"
                          >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold shrink-0">
                                {page.layout_type === 'blocks' ? 'Blocks' : 'Page'}
                              </span>
                              <span className="font-medium text-neutral-900 truncate">{page.title}</span>
                              <span className="font-mono text-[10px] text-neutral-400 truncate hidden xs:inline">
                                /{page.slug}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] sm:text-[11px] text-neutral-400 hidden xs:inline">
                                {page.updated_at ? new Date(page.updated_at).toLocaleDateString('th-TH') : ''}
                              </span>
                              <button
                                onClick={() => handleOpenEditPage(page)}
                                className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                                title="แก้ไข"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {pages.length === 0 && (
                          <div className="text-center py-4 text-xs text-neutral-400">ยังไม่มีหน้าเพจในระบบ</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: AI Agent & MCP Connection Box */}
              <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 border border-neutral-800 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs">AI Agent & MCP Ready</h4>
                      <p className="text-[11px] text-emerald-400">เชื่อมต่อ Claude, Gemini, หรือ Bot</p>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed mt-2">
                    ระบบ School CMS รองรับ Model Context Protocol (MCP) ให้ AI Agent เข้ามาดึงข้อมูลและร่างข่าวสารได้แบบอัตโนมัติ
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-black/40 border border-neutral-800 space-y-2">
                    <div className="text-[10px] text-neutral-400 flex items-center justify-between">
                      <span>X-Agent-Key (API Key):</span>
                      {stats?.agent_key ? (
                        <button
                          onClick={() => copyToClipboard(stats.agent_key)}
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-mono"
                        >
                          {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedKey ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                        </button>
                      ) : null}
                    </div>

                    {loading ? (
                      <div className="py-2 space-y-1.5">
                        <Skeleton variant="dark" className="h-4 w-3/4 rounded" />
                        <Skeleton variant="dark" className="h-3 w-1/2 rounded" />
                      </div>
                    ) : stats?.agent_key || stats?.agent_key_preview ? (
                      <div className="font-mono text-xs text-emerald-300 break-all select-all">
                        {stats.agent_key || stats.agent_key_preview}
                      </div>
                    ) : (
                      <div className="py-2 px-1 text-xs text-amber-300 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                        <span>ยังไม่ได้สร้าง API Key สำหรับ AI Agent</span>
                        <button
                          onClick={() => {
                            setActiveTab('agent_keys');
                            handleOpenCreateKey();
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-semibold cursor-pointer shrink-0"
                        >
                          + สร้าง Key ทันที
                        </button>
                      </div>
                    )}

                    <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between text-[10px]">
                      <span className="text-neutral-400">
                        คีย์ที่เปิดใช้งาน: <strong className="text-emerald-300">{stats?.agent_keys_count ?? agentKeys.filter(k => k.is_active).length} คีย์</strong>
                      </span>
                      <button
                        onClick={() => setActiveTab('agent_keys')}
                        className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>จัดการ API Keys ทั้งหมด</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 text-[10px] sm:text-[11px] text-neutral-400 space-y-1">
                    <div>• MCP SSE Endpoint: <code className="text-emerald-300 font-mono">/mcp/sse</code></div>
                    <div>• Stdio CLI: <code className="text-emerald-300 font-mono">--mcp-stdio</code></div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                  <span>สถานะการเชื่อมต่อ:</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    พร้อมใช้งาน (Online)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: POSTS MANAGEMENT ================= */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            {/* Header Toolbar */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="text"
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                    placeholder="ค้นหาชื่อข่าวสาร หรือเนื้อหา..."
                    className="w-full pl-9 pr-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>

                <select
                  value={postCategoryFilter}
                  onChange={(e) => setPostCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-700 outline-none cursor-pointer shrink-0"
                >
                  <option value="ทั้งหมด">ทุกหมวดหมู่</option>


                  {categories.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(true)}
                  className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
                  title="จัดการหมวดหมู่ข่าวสาร"
                >
                  <Tag className="w-3.5 h-3.5 text-neutral-500" />
                  <span>จัดการหมวดหมู่</span>
                </button>

                <button
                  onClick={handleOpenCreatePost}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>เขียนข่าวใหม่</span>
                </button>
              </div>
            </div>

            {/* Posts Table / Card List */}
            {loading ? (
              <AdminTableSkeleton rows={6} columns={7} />
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              {/* Desktop / Tablet Table View */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-neutral-50 border-b border-neutral-200/80 text-neutral-500 font-medium">
                    <tr>
                      <th className="py-3 px-4">รูปภาพ</th>
                      <th className="py-3 px-4">หัวข้อข่าว</th>
                      <th className="py-3 px-4">หมวดหมู่</th>
                      <th className="py-3 px-4">วันที่ / ผู้เขียน</th>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4">ยอดวิว</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {paginatedAdminPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-neutral-50/80 transition">
                        <td className="py-3 px-4 w-16">
                          <div className="w-12 h-10 rounded-lg bg-neutral-100 overflow-hidden border border-neutral-200 flex items-center justify-center">
                            {post.image_url ? (
                              <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-neutral-400" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs sm:max-w-md">
                          <div className="font-semibold text-neutral-900 line-clamp-1">{post.title}</div>
                          <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{post.summary || post.slug}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-semibold">
                            {post.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-500 text-[11px]">
                          <div>{post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH') : '-'}</div>
                          <div className="text-neutral-400 flex items-center gap-1 mt-0.5">
                            {post.created_by_agent ? (
                              <span className="text-purple-600 font-medium flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" /> {post.agent_name || 'AI Agent'}
                              </span>
                            ) : (
                              post.author || 'แอดมิน'
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              post.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            {post.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                          {post.views || 0}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditPost(post)}
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
                              title="แก้ไขข่าว"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id, post.title)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                              title="ลบข่าว"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPosts.length === 0 && (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-xs text-neutral-400">
                          ไม่พบข่าวสารที่ค้นหา
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="divide-y divide-neutral-100 md:hidden">
                {paginatedAdminPosts.map((post) => (
                  <div key={post.id} className="p-3.5 hover:bg-neutral-50/80 transition space-y-2.5">
                    <div className="flex gap-3">
                      <div className="w-14 h-14 rounded-xl bg-neutral-100 overflow-hidden border border-neutral-200 flex items-center justify-center shrink-0">
                        {post.image_url ? (
                          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-neutral-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-[10px] font-semibold">
                            {post.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              post.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            {post.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                          </span>
                          {post.created_by_agent && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-700 font-medium flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> AI
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold text-neutral-900 text-xs line-clamp-2 leading-snug">
                          {post.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[11px] text-neutral-500">
                      <div className="flex items-center gap-2">
                        <span>{post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH') : '-'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-neutral-400" />
                          <span className="font-mono">{post.views || 0}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditPost(post)}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>แก้ไข</span>
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id, post.title)}
                          className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium text-xs flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>ลบ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPosts.length === 0 && (
                  <div className="py-10 text-center text-xs text-neutral-400">
                    ไม่พบข่าวสารที่ค้นหา
                  </div>
                )}
              </div>

              {/* Admin Posts Pagination Bar */}
              {totalAdminPostPages > 1 && (
                <div className="p-4 border-t border-neutral-200/80 bg-neutral-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-neutral-500">
                    แสดง <span className="font-semibold text-neutral-800">{(adminPostPage - 1) * adminPostsPerPage + 1}</span> ถึง{' '}
                    <span className="font-semibold text-neutral-800">{Math.min(adminPostPage * adminPostsPerPage, filteredPosts.length)}</span> จาก{' '}
                    <span className="font-semibold text-neutral-800">{filteredPosts.length}</span> ข่าว
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setAdminPostPage(p => Math.max(1, p - 1))}
                      disabled={adminPostPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-neutral-700 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>ก่อนหน้า</span>
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalAdminPostPages }, (_, i) => i + 1).map((pg) => {
                        if (
                          totalAdminPostPages > 7 &&
                          pg !== 1 &&
                          pg !== totalAdminPostPages &&
                          Math.abs(pg - adminPostPage) > 1
                        ) {
                          if (pg === 2 || pg === totalAdminPostPages - 1) {
                            return <span key={pg} className="px-1 text-neutral-400">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={pg}
                            onClick={() => setAdminPostPage(pg)}
                            className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                              adminPostPage === pg
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            {pg}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setAdminPostPage(p => Math.min(totalAdminPostPages, p + 1))}
                      disabled={adminPostPage === totalAdminPostPages}
                      className="px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 text-neutral-700 cursor-pointer"
                    >
                      <span>ถัดไป</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

        {/* ================= TAB 3: PAGES MANAGEMENT ================= */}
        {activeTab === 'pages' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">จัดการหน้าเพจอิสระ (Custom Pages)</h3>
                <p className="text-xs text-neutral-500 mt-0.5">หน้าเพจข้อมูลเฉพาะ เช่น ประวัติ, บุคลากร, ข้อมูลพื้นฐาน</p>
              </div>
              <button
                onClick={handleOpenCreatePage}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>สร้างหน้าเพจใหม่</span>
              </button>
            </div>

            {loading ? (
              <AdminTableSkeleton rows={5} columns={6} hasThumbnail={false} />
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              {/* Desktop / Tablet Table View */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left text-xs min-w-[600px]">
                  <thead className="bg-neutral-50 border-b border-neutral-200/80 text-neutral-500 font-medium">
                    <tr>
                      <th className="py-3 px-4">ชื่อหน้าเพจ</th>
                      <th className="py-3 px-4">Slug (URL)</th>
                      <th className="py-3 px-4">แสดงในเมนู</th>
                      <th className="py-3 px-4">สถานะ</th>
                      <th className="py-3 px-4">อัปเดตล่าสุด</th>
                      <th className="py-3 px-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {pages.map((page) => (
                      <tr key={page.id} className="hover:bg-neutral-50/80 transition">
                        <td className="py-3 px-4 font-semibold text-neutral-900">{page.title}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-emerald-700">
                          /page/{page.slug}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                page.show_in_menu
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                              }`}
                            >
                              {page.show_in_menu ? 'บนบาร์' : 'ซ่อน'}
                            </span>
                            {page.show_in_bottom_nav && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                ลัดล่าง
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              page.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                            }`}
                          >
                            {page.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-400 text-[11px]">
                          {page.updated_at ? new Date(page.updated_at).toLocaleDateString('th-TH') : '-'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`#page/${page.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition cursor-pointer"
                              title="เปิดดูหน้าเพจ"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleOpenEditPage(page)}
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
                              title="แก้ไขหน้าเพจ"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePage(page.id, page.title)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                              title="ลบหน้าเพจ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pages.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-xs text-neutral-400">
                          ยังไม่มีหน้าเพจในระบบ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View for Pages */}
              <div className="divide-y divide-neutral-100 md:hidden">
                {pages.map((page) => (
                  <div key={page.id} className="p-3.5 hover:bg-neutral-50/80 transition space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-neutral-900 text-xs">{page.title}</h4>
                        <div className="font-mono text-[11px] text-emerald-700 mt-0.5 truncate">
                          /page/{page.slug}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            page.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                          }`}
                        >
                          {page.status === 'published' ? 'เผยแพร่' : 'ร่าง'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            page.show_in_menu
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                          }`}
                        >
                          {page.show_in_menu ? 'บนบาร์' : 'ซ่อน'}
                        </span>
                        {page.show_in_bottom_nav && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ลัดล่าง
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[11px] text-neutral-400">
                      <span>อัปเดต: {page.updated_at ? new Date(page.updated_at).toLocaleDateString('th-TH') : '-'}</span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`#page/${page.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition cursor-pointer"
                          title="เปิดดูหน้าเพจ"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleOpenEditPage(page)}
                          className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition cursor-pointer"
                          title="แก้ไขหน้าเพจ"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePage(page.id, page.title)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                          title="ลบหน้าเพจ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {pages.length === 0 && (
                  <div className="py-10 text-center text-xs text-neutral-400">
                    ยังไม่มีหน้าเพจในระบบ
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

        {/* ================= TAB 4: MEDIA LIBRARY ================= */}
        {activeTab === 'media' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Storage Provider Status Banner */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Puzzle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">ระบบจัดเก็บไฟล์และปลั๊กอิน (Storage & Plugins)</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    สามารถเชื่อมต่อ Cloudflare R2, AWS S3, MinIO หรือจัดการส่วนเสริมของระบบได้ที่นี่
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('extensions')}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <span>เปิดหน้าตั้งค่าปลั๊กอิน (Plugins)</span>
                <span>→</span>
              </button>
            </div>

            {/* Upload Box */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-neutral-900 mb-1">อัปโหลดรูปภาพใหม่ (Media Upload)</h3>
              <p className="text-xs text-neutral-500 mb-4">
                ไฟล์รูปภาพที่อัปโหลดจะถูกจัดเก็บไว้ในโฟลเดอร์ <code>/uploads</code> พร้อมใช้งานได้ตลอดเวลา
              </p>

              <form onSubmit={handleUploadMedia} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">เลือกไฟล์รูปภาพ</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                      className="w-full text-xs text-neutral-600 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 mb-1">คำอธิบายภาพ (Alt Text)</label>
                    <input
                      type="text"
                      value={uploadAlt}
                      onChange={(e) => setUploadAlt(e.target.value)}
                      placeholder="เช่น บรรยากาศกิจกรรมวันไหว้ครู 2569"
                      className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile}
                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพ'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Media Grid */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/80 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
                <h3 className="text-sm font-bold text-neutral-900">คลังสื่อในระบบ ({mediaList.length} รายการ)</h3>
                <span className="text-xs text-neutral-400">คลิกที่ปุ่มคัดลอกเพื่อนำ URL ไปใช้ในเนื้อหา</span>
              </div>

              {loading ? (
                <MediaGridSkeleton count={12} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
                  {mediaList.map((media) => (
                    <div
                      key={media.id}
                      className="group rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden relative flex flex-col justify-between hover:shadow-md transition"
                    >
                      <div className="aspect-square bg-neutral-200/60 overflow-hidden relative flex items-center justify-center">
                        <img
                          src={media.url}
                          alt={media.alt_text || ''}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/uploads/2026/10/1792825601083477305-ai.png';
                          }}
                        />
                      </div>

                      <div className="p-2 text-[10px] space-y-1.5 bg-white">
                        <div className="truncate font-medium text-neutral-800" title={media.original_name}>
                          {media.original_name}
                        </div>
                        <div className="flex items-center gap-1 pt-0.5">
                          <button
                            onClick={() => copyToClipboard(media.url, media.id)}
                            className={`flex-1 py-1 px-1 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition cursor-pointer truncate ${
                              copiedMediaId === media.id
                                ? 'bg-emerald-600 text-white'
                                : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                            }`}
                          >
                            {copiedMediaId === media.id ? <Check className="w-3 h-3 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                            <span className="truncate">{copiedMediaId === media.id ? 'คัดลอกแล้ว' : 'คัดลอก URL'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteMedia(media.id)}
                            className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                            title="ลบรูปภาพนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {mediaList.length === 0 && (
                    <div className="col-span-full py-12 text-center text-xs text-neutral-400">
                      ยังไม่มีรูปภาพในคลังสื่อ กรุณาอัปโหลดรูปภาพใหม่
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: HOMEPAGE CUSTOMIZER ================= */}
        {activeTab === 'customizer' && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/80 shadow-xs max-w-3xl w-full">
            <h3 className="text-sm font-bold text-neutral-900 mb-1">ปรับแต่งหน้าแรก (Homepage Customizer)</h3>
            <p className="text-xs text-neutral-500 mb-5 sm:mb-6">แก้ไขข้อความพาดหัว, คำขวัญ, และแถบประกาศด่วนบนหน้าแรกของโรงเรียน</p>

            {homepageConfig ? (
              <form onSubmit={handleSaveHomepageConfig} className="space-y-4 sm:space-y-5 text-xs">
                {/* Hero Settings */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                  <h4 className="font-bold text-neutral-800 text-xs">ส่วน Hero Banner</h4>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">ข้อความป้ายกำกับด้านบน (Badge)</label>
                    <input
                      type="text"
                      value={homepageConfig.hero?.badge || ''}
                      onChange={(e) =>
                        setHomepageConfigState({
                          ...homepageConfig,
                          hero: { ...homepageConfig.hero, badge: e.target.value }
                        })
                      }
                      className="w-full py-2 px-3 bg-white rounded-xl border border-neutral-200 text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">หัวข้อหลัก (Heading)</label>
                    <input
                      type="text"
                      value={homepageConfig.hero?.heading || ''}
                      onChange={(e) =>
                        setHomepageConfigState({
                          ...homepageConfig,
                          hero: { ...homepageConfig.hero, heading: e.target.value }
                        })
                      }
                      className="w-full py-2 px-3 bg-white rounded-xl border border-neutral-200 text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">คำขวัญ / คำบรรยายรอง (Subheading)</label>
                    <textarea
                      rows="3"
                      value={homepageConfig.hero?.subheading || ''}
                      onChange={(e) =>
                        setHomepageConfigState({
                          ...homepageConfig,
                          hero: { ...homepageConfig.hero, subheading: e.target.value }
                        })
                      }
                      className="w-full py-2 px-3 bg-white rounded-xl border border-neutral-200 text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Announcement Ticker */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                  <h4 className="font-bold text-neutral-800 text-xs">แถบประกาศด่วน (News Ticker)</h4>
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">ข้อความประกาศวิ่ง</label>
                    <input
                      type="text"
                      value={homepageConfig.announcement || ''}
                      onChange={(e) =>
                        setHomepageConfigState({
                          ...homepageConfig,
                          announcement: e.target.value
                        })
                      }
                      className="w-full py-2 px-3 bg-white rounded-xl border border-neutral-200 text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                </div>

                {/* Section Visibility Toggles */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2.5">
                  <h4 className="font-bold text-neutral-800 text-xs mb-2">เปิด/ปิด ส่วนประกอบหน้าแรก</h4>
                  {[
                    { key: 'show_ticker', label: 'แสดงแถบประกาศด่วน (Announcement Ticker)' },
                    { key: 'show_slider', label: 'แสดงแบนเนอร์สไลด์ภาพกิจกรรม (Hero Slider)' },
                    { key: 'show_eservices', label: 'แสดงระบบบริการออนไลน์ (E-Services Portal)' },
                    { key: 'show_recent_news', label: 'แสดงข่าวสารและกิจกรรมล่าสุด (Recent News)' },
                    { key: 'show_trending', label: 'แสดงข่าวยอดนิยม (Trending News)' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2.5 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={!!homepageConfig[item.key]}
                        onChange={(e) =>
                          setHomepageConfigState({
                            ...homepageConfig,
                            [item.key]: e.target.checked
                          })
                        }
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-neutral-700 font-medium">{item.label}</span>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingHomepage}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingHomepage ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าหน้าแรก'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-10 text-xs text-neutral-400">กำลังโหลดการตั้งค่า...</div>
            )}
          </div>
        )}

        {/* ================= TAB 5: USERS MANAGEMENT ================= */}
        {activeTab === 'users' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header Toolbar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>จัดการผู้ใช้งานระบบ (User Management)</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  จัดการบัญชีผู้ดูแลระบบและเจ้าหน้าที่สำหรับเข้าใช้งานระบบหลังบ้าน School CMS
                </p>
              </div>

              <button
                onClick={handleOpenCreateUser}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มผู้ใช้งานใหม่</span>
              </button>
            </div>

            {/* Users List */}
            {loading ? (
              <AdminTableSkeleton rows={4} columns={5} />
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-700">
                  รายชื่อผู้ใช้ทั้งหมด ({users.length} บัญชี)
                </span>
                <span className="text-[11px] text-neutral-400">
                  จัดเก็บรหัสผ่านแบบเข้ารหัสความปลอดภัยสูง (bcrypt)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/70 border-b border-neutral-200/80 text-neutral-500">
                    <tr>
                      <th className="py-3 px-4 font-semibold">ผู้ใช้งาน</th>
                      <th className="py-3 px-4 font-semibold">ชื่อบัญชี (Username)</th>
                      <th className="py-3 px-4 font-semibold">ระดับสิทธิ์ (Role)</th>
                      <th className="py-3 px-4 font-semibold hidden md:table-cell">วันที่สร้าง</th>
                      <th className="py-3 px-4 font-semibold text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-neutral-900">{u.name}</div>
                              <div className="text-[11px] text-neutral-400 md:hidden font-mono">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600 font-medium">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>@{u.username}</span>
                            {u.username === 'admin' && (
                              <span className="px-1.5 py-0.5 text-[9px] bg-amber-50 text-amber-700 border border-amber-200/80 rounded font-sans font-semibold">
                                Super Admin
                              </span>
                            )}
                            {u.id === currentUser?.id && (
                              <span className="px-1.5 py-0.5 text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded font-sans font-semibold">
                                คุณ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                              u.role === 'admin'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : u.role === 'editor'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            <span>
                              {u.role === 'admin'
                                ? 'ผู้ดูแลระบบ (Admin)'
                                : u.role === 'editor'
                                ? 'ผู้แก้ไขข่าว (Editor)'
                                : 'คุณครู/เจ้าหน้าที่'}
                            </span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-400 text-[11px] hidden md:table-cell">
                          {u.created_at || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="แก้ไขข้อมูลผู้ใช้"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {u.username !== 'admin' && u.id !== currentUser?.id ? (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                title="ลบผู้ใช้"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span
                                className="p-1.5 text-neutral-300 cursor-not-allowed"
                                title={u.username === 'admin' ? "บัญชี Super Admin ได้รับการปกป้อง ห้ามลบ" : "ไม่สามารถลบบัญชีของตนเองได้"}
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-neutral-400 text-xs">
                          ยังไม่มีผู้ใช้งานในระบบ
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

        {/* ================= TAB 6: AI AGENT API KEYS ================= */}
        {activeTab === 'agent_keys' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Header Toolbar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-600" />
                  <span>API Keys สำหรับ AI Agent (Agent API Keys)</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  สร้างและเพิกถอน API Key สำหรับเชื่อมต่อ AI Agent, Claude Desktop, Gemini หรือ Script ภายนอก
                </p>
              </div>

              <button
                onClick={handleOpenCreateKey}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>สร้าง API Key ใหม่</span>
              </button>
            </div>

            {/* Connection Instructions Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-neutral-900 to-neutral-900 text-white border border-neutral-800 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                <Shield className="w-4 h-4 shrink-0" />
                <span>การเชื่อมต่อ AI Agent (Authentication)</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                ส่งคำขอผ่าน HTTP Header <code className="text-emerald-300 font-mono bg-black/40 px-1.5 py-0.5 rounded">X-Agent-Key: &lt;API_KEY&gt;</code> หรือ Bearer Token โดยใช้ API Key ที่สร้างขึ้นจากระบบนี้ เพื่อยืนยันตัวตนสำหรับ AI Agent และบอทภายนอก
              </p>
              <div className="pt-2 flex flex-wrap gap-4 text-[11px] text-neutral-400 border-t border-neutral-800/80">
                <span>• รองรับ MCP Endpoint: <code className="text-emerald-400 font-mono">/mcp/sse</code></span>
                <span>• Header: <code className="text-emerald-400 font-mono">X-Agent-Key</code></span>
                <span>• Format: <code className="text-emerald-400 font-mono">ppk_agent_xxxxxxxx...</code></span>
              </div>
            </div>

            {/* API Keys List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-3 w-48" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-24 rounded-xl" />
                        <Skeleton className="h-8 w-20 rounded-xl" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <div className="flex justify-between pt-2 border-t border-neutral-100">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {agentKeys.map((k) => (
                  <div
                    key={k.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition shadow-xs ${
                      k.is_active ? 'border-neutral-200/80' : 'border-neutral-200/50 bg-neutral-50/50 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-bold text-sm text-neutral-900">{k.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              k.is_active
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-200'
                            }`}
                          >
                            {k.is_active ? 'พร้อมใช้งาน (Active)' : 'ปิดใช้งานชั่วคราว (Disabled)'}
                          </span>
                        </div>
                        {k.description && (
                          <p className="text-xs text-neutral-500">{k.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleToggleAgentKey(k)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition ${
                            k.is_active
                              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{k.is_active ? 'ระงับชั่วคราว' : 'เปิดใช้งาน'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteAgentKey(k)}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบ/เพิกถอน</span>
                        </button>
                      </div>
                    </div>

                    {/* Key Box */}
                    <div className="mt-3.5 p-3 rounded-xl bg-neutral-900 text-neutral-200 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs font-mono">
                      <div className="break-all select-all text-emerald-300">
                        {k.key}
                      </div>
                      <button
                        onClick={() => copyToClipboard(k.key)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 cursor-pointer transition self-end xs:self-auto shrink-0 text-[11px]"
                      >
                        {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>คัดลอก</span>
                      </button>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400 pt-2 border-t border-neutral-100">
                      <span>
                        สร้างเมื่อ:{' '}
                        <strong className="text-neutral-600">
                          {k.created_at ? new Date(k.created_at).toLocaleString('th-TH') : '-'}
                        </strong>
                      </span>
                      <span>
                        ใช้งานล่าสุด:{' '}
                        <strong className={k.last_used_at ? 'text-emerald-600 font-semibold' : 'text-neutral-500'}>
                          {k.last_used_at ? new Date(k.last_used_at).toLocaleString('th-TH') : 'ยังไม่เคยใช้งาน'}
                        </strong>
                      </span>
                    </div>
                  </div>
                ))}

                {agentKeys.length === 0 && (
                  <div className="bg-white rounded-2xl p-8 border border-neutral-200/80 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                      <Bot className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-neutral-800">ยังไม่มี API Key สำหรับ AI Agent</h4>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      คลิกปุ่มด้านล่างเพื่อสร้าง API Key สำหรับบอท หรือเครื่องมือ AI Agent ให้สามารถเข้ามาเขียนข่าวสารได้
                    </p>
                    <button
                      onClick={handleOpenCreateKey}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>สร้าง API Key แรกของคุณ</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: EXTENSIONS & STORAGE PLUGINS ================= */}
        {activeTab === 'extensions' && (
          <AdminExtensions token={token} showNotification={showNotification} />
        )}

        {/* ================= TAB 7: SETTINGS & SECURITY ================= */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Site Identity Settings */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-neutral-900 mb-1">ข้อมูลอัตลักษณ์ของโรงเรียน</h3>
              <p className="text-xs text-neutral-500 mb-5">ตั้งค่าชื่อโรงเรียน สังกัด และรูปภาพโลโก้</p>

              {siteSettings ? (
                <form onSubmit={handleSaveSiteSettings} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">ชื่อโรงเรียน (ภาษาไทย)</label>
                    <input
                      type="text"
                      value={siteSettings.school_name || ''}
                      onChange={(e) => setSiteSettingsState({ ...siteSettings, school_name: e.target.value })}
                      className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">ชื่อโรงเรียน (ภาษาอังกฤษ)</label>
                    <input
                      type="text"
                      value={siteSettings.school_name_en || ''}
                      onChange={(e) => setSiteSettingsState({ ...siteSettings, school_name_en: e.target.value })}
                      className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">สังกัด / หน่วยงานต้นสังกัด</label>
                    <input
                      type="text"
                      value={siteSettings.school_subtitle || ''}
                      onChange={(e) => setSiteSettingsState({ ...siteSettings, school_subtitle: e.target.value })}
                      className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">URL โลโก้โรงเรียน</label>
                    <input
                      type="text"
                      value={siteSettings.logo_url || ''}
                      onChange={(e) => setSiteSettingsState({ ...siteSettings, logo_url: e.target.value })}
                      className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">URL ไอคอน Favicon</label>
                    <input
                      type="text"
                      value={siteSettings.favicon_url || ''}
                      onChange={(e) => setSiteSettingsState({ ...siteSettings, favicon_url: e.target.value })}
                      className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* SEO & Open Graph Section */}
                  <div className="pt-4 border-t border-neutral-200/80 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        <span>การตั้งค่า SEO & Social Sharing (Open Graph)</span>
                      </h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        ปรับแต่งข้อมูลที่จะปรากฏบนผลการค้นหา Google และภาพตัวอย่างเมื่อแชร์ลิงก์บน Facebook, LINE, Discord
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">SEO Title (พาดหัวเว็บไซต์สำหรับ Google & โซเชียล)</label>
                      <input
                        type="text"
                        value={siteSettings.seo_title || ''}
                        placeholder="เช่น โรงเรียนโพนงามพิทยานุกูล – สพม.มหาสารคาม"
                        onChange={(e) => setSiteSettingsState({ ...siteSettings, seo_title: e.target.value })}
                        className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">SEO Meta Description (คำอธิบายเว็บไซต์ย่อ)</label>
                      <textarea
                        rows={2}
                        value={siteSettings.seo_description || ''}
                        placeholder="คำอธิบายสั้นๆ แนะนำโรงเรียน จะปรากฏใต้ชื่อเว็บในหน้าค้นหา Google"
                        onChange={(e) => setSiteSettingsState({ ...siteSettings, seo_description: e.target.value })}
                        className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">SEO Keywords (คำค้นหาหลัก คั่นด้วยเครื่องหมายจุลภาค)</label>
                      <input
                        type="text"
                        value={siteSettings.seo_keywords || ''}
                        placeholder="เช่น โรงเรียนโพนงามพิทยานุกูล, สพม.มหาสารคาม, มหาสารคาม, การศึกษา"
                        onChange={(e) => setSiteSettingsState({ ...siteSettings, seo_keywords: e.target.value })}
                        className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">URL ภาพพรีวิวเริ่มต้น (Default Open Graph Image)</label>
                      <input
                        type="text"
                        value={siteSettings.og_default_image || ''}
                        placeholder="เช่น /images/hero-banner.jpg หรือ URL รูปภาพ"
                        onChange={(e) => setSiteSettingsState({ ...siteSettings, og_default_image: e.target.value })}
                        className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Google Search Console Verification Tag</label>
                      <input
                        type="text"
                        value={siteSettings.google_site_verification || ''}
                        placeholder="เช่น google-site-verification token หรือ meta content code"
                        onChange={(e) => setSiteSettingsState({ ...siteSettings, google_site_verification: e.target.value })}
                        className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                      />
                    </div>

                    {/* Sitemap & Robots.txt links */}
                    <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-600">
                      <span className="font-medium text-neutral-700">เครื่องมือสำหรับ Search Engine Crawler:</span>
                      <div className="flex items-center gap-3">
                        <a
                          href="/sitemap.xml"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1 font-semibold"
                        >
                          <FileText className="w-3 h-3" />
                          <span>sitemap.xml</span>
                        </a>
                        <a
                          href="/robots.txt"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1 font-semibold"
                        >
                          <FileText className="w-3 h-3" />
                          <span>robots.txt</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingSettings ? 'กำลังบันทึก...' : 'บันทึกข้อมูลโรงเรียนและ SEO'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8 text-xs text-neutral-400">กำลังโหลด...</div>
              )}
            </div>

            {/* Change Password & Security */}
            <div className="space-y-4 sm:space-y-6">
              {/* Plugins & Storage Extension Shortcut Card */}
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-4 sm:p-5 text-white border border-neutral-700/80 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Puzzle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">ปลั๊กอินและส่วนเสริมระบบ (Plugins & Storage)</h4>
                      <p className="text-[11px] text-neutral-300 mt-0.5">
                        ติดตั้งส่วนเสริม, เชื่อมต่อ Cloud Storage (Cloudflare R2, AWS S3, MinIO), สถิติ และ SEO
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-neutral-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">ระบบจัดเก็บไฟล์และ Extensions</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('extensions')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>เปิดหน้าปลั๊กอิน (Plugins)</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-neutral-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-neutral-900">
                    เปลี่ยนรหัสผ่านผู้ใช้งาน ({currentUser?.name || currentUser?.username || 'ผู้ดูแลระบบ'})
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 mb-5">เพื่อความปลอดภัย แนะนำให้เปลี่ยนรหัสผ่านเป็นประจำ</p>

                <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">รหัสผ่านปัจจุบัน</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านปัจจุบัน..."
                      className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">รหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่..."
                      className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่อีกครั้ง..."
                      className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{passwordLoading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'เปลี่ยนรหัสผ่าน'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Hint Box */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>คำแนะนำด้านความปลอดภัย</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800/90">
                  หากท่านต้องการเปิดสิทธิ์ให้ AI Agent เข้ามาทำงานร่วมกัน สามารถให้ AI Agent ยิงคำขอผ่าน API พร้อม Header{' '}
                  <code className="font-mono bg-amber-100/80 px-1 py-0.5 rounded text-amber-950">
                    X-Agent-Key
                  </code>{' '}
                  โดยไม่ต้องเปิดเผยรหัสผ่านแอดมิน
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= CATEGORY MANAGEMENT MODAL ================= */}
      {categoryModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => {
            setCategoryModalOpen(false);
            setEditingCategoryId(null);
            setEditingCategoryName('');
          }}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200 relative my-auto animate-in fade-in zoom-in-95 duration-150 p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900">จัดการหมวดหมู่ข่าวสาร</h3>
                  <p className="text-[11px] text-neutral-500">เพิ่ม แก้ไข หรือลบหมวดหมู่สำหรับจัดกลุ่มข่าวสาร</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCategoryModalOpen(false);
                  setEditingCategoryId(null);
                  setEditingCategoryName('');
                }}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Create Category Form */}
            <form onSubmit={handleCreateCategory} className="mb-5">
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">เพิ่มหมวดหมู่ใหม่</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="เช่น ผลงานและรางวัล, รับสมัครนักเรียน..."
                  disabled={categoryLoading}
                  className="flex-1 py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={categoryLoading || !newCategoryName.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่ม</span>
                </button>
              </div>
            </form>

            {/* Category List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-700">หมวดหมู่ทั้งหมด ({categories.length})</span>
                <span className="text-[11px] text-neutral-400">จำนวนข่าว</span>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {categoryLoading ? (
                  <div className="space-y-2 py-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/50">
                        <Skeleton className="h-4 w-28" />
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-12 rounded" />
                          <Skeleton className="h-6 w-6 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-6 text-xs text-neutral-400">ยังไม่มีหมวดหมู่</div>
                ) : (
                  categories.map((cat) => (
                    <div
                      key={cat.id || cat.name}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/70 hover:bg-neutral-100/60 transition"
                    >
                      {editingCategoryId === cat.id ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            value={editingCategoryName}
                            onChange={(e) => setEditingCategoryName(e.target.value)}
                            className="flex-1 py-1 px-2.5 bg-white rounded-lg border border-emerald-500 text-xs outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleUpdateCategory(cat.id, editingCategoryName);
                              } else if (e.key === 'Escape') {
                                setEditingCategoryId(null);
                                setEditingCategoryName('');
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateCategory(cat.id, editingCategoryName)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                            title="บันทึก"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(null);
                              setEditingCategoryName('');
                            }}
                            className="p-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 text-neutral-700 transition cursor-pointer"
                            title="ยกเลิก"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-neutral-900">{cat.name}</span>
                          {cat.name === 'ทั่วไป' && (
                            <span className="text-[10px] text-neutral-400 bg-neutral-200/60 px-1.5 py-0.5 rounded font-normal">
                              ค่าเริ่มต้น
                            </span>
                          )}
                        </div>
                      )}

                      {editingCategoryId !== cat.id && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium text-neutral-500 bg-white border border-neutral-200/60 px-2 py-0.5 rounded-md">
                            {cat.posts_count || 0} ข่าว
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setEditingCategoryName(cat.name);
                            }}
                            className="p-1.5 rounded-lg hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 transition cursor-pointer"
                            title="แก้ไขชื่อหมวดหมู่"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {cat.name !== 'ทั่วไป' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600 transition cursor-pointer"
                              title="ลบหมวดหมู่"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="w-7 h-7" />
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setCategoryModalOpen(false);
                  setEditingCategoryId(null);
                  setEditingCategoryName('');
                }}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= POST MODAL (CREATE / EDIT) ================= */}
      {postModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto"
          onClick={() => setPostModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200 relative my-auto animate-in fade-in zoom-in-95 duration-150 p-4 sm:p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-100 mb-4 sm:mb-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                  {editingPost ? 'แก้ไขข่าวสาร' : 'เขียนข่าวสารใหม่'}
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">กรอกข้อมูลและรายละเอียดของข่าวสารเพื่อเผยแพร่บนเว็บไซต์</p>
              </div>
              <button
                onClick={() => setPostModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-3.5 sm:space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">หัวข้อข่าว *</label>
                <input
                  type="text"
                  required
                  value={postFormData.title}
                  onChange={(e) => setPostFormData({ ...postFormData, title: e.target.value })}
                  placeholder="เช่น พิธีมอบเกียรติบัตรนักเรียนดีเด่น ประจำปีการศึกษา 2569"
                  className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">หมวดหมู่</label>
                  <select
                    value={postFormData.category}
                    onChange={(e) => setPostFormData({ ...postFormData, category: e.target.value })}
                    className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
                  >
  
  
                    {categories.map((cat) => (
                    <option key={cat.id || cat.name} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}

                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">สถานะ</label>
                  <select
                    value={postFormData.status}
                    onChange={(e) => setPostFormData({ ...postFormData, status: e.target.value })}
                    className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="published">เผยแพร่ทันที (Published)</option>
                    <option value="draft">บันทึกเป็นฉบับร่าง (Draft)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">URL Slug (เว้นว่างไว้เพื่อสร้างอัตโนมัติ)</label>
                  <input
                    type="text"
                    value={postFormData.slug}
                    onChange={(e) => setPostFormData({ ...postFormData, slug: e.target.value })}
                    placeholder="เช่น student-award-2026"
                    className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">ชื่อผู้เขียน</label>
                  <input
                    type="text"
                    value={postFormData.author}
                    onChange={(e) => setPostFormData({ ...postFormData, author: e.target.value })}
                    placeholder="โรงเรียนโพนงามพิทยานุกูล"
                    className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">URL รูปภาพหน้าปก</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={postFormData.image_url}
                    onChange={(e) => setPostFormData({ ...postFormData, image_url: e.target.value })}
                    placeholder="เช่น /uploads/2026/10/event.jpg หรือ https://..."
                    className="flex-1 py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                  />
                  {postFormData.image_url && (
                    <div className="w-10 h-9 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-100 shrink-0">
                      <img src={postFormData.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">สรุปย่อข่าว (สำหรับแสดงบนการ์ด)</label>
                <textarea
                  rows="2"
                  value={postFormData.summary}
                  onChange={(e) => setPostFormData({ ...postFormData, summary: e.target.value })}
                  placeholder="คำโปรยสั้นๆ 1-2 ประโยคเพื่อดึงดูดผู้อ่าน..."
                  className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">เนื้อหาข่าวฉบับเต็ม *</label>
                <textarea
                  rows="6"
                  required
                  value={postFormData.content}
                  onChange={(e) => setPostFormData({ ...postFormData, content: e.target.value })}
                  placeholder="เขียนเนื้อหาข่าว รายละเอียด วันที่ สถานที่..."
                  className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none leading-relaxed"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setPostModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium transition cursor-pointer text-center"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingPost}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition shadow-sm cursor-pointer disabled:opacity-50 text-center"
                >
                  {submittingPost ? 'กำลังบันทึก...' : editingPost ? 'บันทึกการแก้ไข' : 'สร้างข่าวสาร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PAGE MODAL (CREATE / EDIT) ================= */}
      {pageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto"
          onClick={() => setPageModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200 relative my-auto animate-in fade-in zoom-in-95 duration-150 p-4 sm:p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-100 mb-4 sm:mb-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                  {editingPage ? 'แก้ไขหน้าเพจ' : 'สร้างหน้าเพจใหม่'}
                </h3>
                <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">สร้างหน้าเนื้อหาสำหรับเว็บไซต์โรงเรียน</p>
              </div>
              <button
                onClick={() => setPageModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePage} className="space-y-3.5 sm:space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">ชื่อหน้าเพจ (Page Title) *</label>
                <input
                  type="text"
                  required
                  value={pageFormData.title}
                  onChange={(e) => setPageFormData({ ...pageFormData, title: e.target.value })}
                  placeholder="เช่น ประวัติโรงเรียน, แผนผังอาคารเรียน"
                  className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">Slug (URL Path) *</label>
                  <input
                    type="text"
                    required
                    value={pageFormData.slug}
                    onChange={(e) => setPageFormData({ ...pageFormData, slug: e.target.value })}
                    placeholder="เช่น school-history"
                    className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">สถานะ</label>
                  <select
                    value={pageFormData.status}
                    onChange={(e) => setPageFormData({ ...pageFormData, status: e.target.value })}
                    className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="published">เผยแพร่ทันที (Published)</option>
                    <option value="draft">บันทึกเป็นฉบับร่าง (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Menu Display Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pageFormData.show_in_menu}
                      onChange={(e) => setPageFormData({ ...pageFormData, show_in_menu: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-neutral-700 text-xs sm:text-sm">แสดงในเมนูนำทางหลักด้านบน</span>
                  </label>
                  <p className="text-[11px] text-neutral-400 ml-6">แสดงใน Navbar หลักของเว็บไซต์</p>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pageFormData.show_in_bottom_nav}
                      onChange={(e) => setPageFormData({ ...pageFormData, show_in_bottom_nav: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-neutral-700 text-xs sm:text-sm">แสดงในเมนูลัดด้านล่างบนมือถือ (Mobile Bottom Nav)</span>
                  </label>
                  <p className="text-[11px] text-neutral-400 ml-6">แสดงเป็นปุ่มลัดด้านล่างเมื่อเปิดบนสมาร์ทโฟน</p>
                </div>
              </div>

              {/* Menu Icon Selector */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1 text-xs sm:text-sm">
                  ไอคอนเมนู (Menu Icon)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 shadow-xs">
                    {renderMenuIconPreview(pageFormData.menu_icon)}
                  </div>
                  <select
                    value={pageFormData.menu_icon || ''}
                    onChange={(e) => setPageFormData({ ...pageFormData, menu_icon: e.target.value })}
                    className="flex-1 py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="">ตรวจจับอัตโนมัติ (Auto-detect ตามชื่อหน้า)</option>
                    <option value="Home">Home (หน้าแรก / อาคาร)</option>
                    <option value="Building2">Building2 (เกี่ยวกับเรา / องค์กร)</option>
                    <option value="Newspaper">Newspaper (ข่าวสาร / ประชาสัมพันธ์)</option>
                    <option value="Sparkles">Sparkles (E-Service / บริการ)</option>
                    <option value="Phone">Phone (ติดต่อเรา / เบอร์โทร)</option>
                    <option value="GraduationCap">GraduationCap (วิชาการ / การศึกษา)</option>
                    <option value="Users">Users (บุคลากร / ครู / นักเรียน)</option>
                    <option value="FileText">FileText (เอกสาร / ทั่วไป)</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { id: '', label: 'Auto', icon: Sparkles },
                    { id: 'Home', label: 'Home', icon: Home },
                    { id: 'Building2', label: 'Building', icon: Building2 },
                    { id: 'Newspaper', label: 'News', icon: Newspaper },
                    { id: 'Sparkles', label: 'Service', icon: Sparkles },
                    { id: 'Phone', label: 'Phone', icon: Phone },
                    { id: 'GraduationCap', label: 'Academic', icon: GraduationCap },
                    { id: 'Users', label: 'Users', icon: Users },
                    { id: 'FileText', label: 'Doc', icon: FileText },
                  ].map((preset) => {
                    const PresetIcon = preset.icon;
                    const isSelected = (pageFormData.menu_icon || '') === preset.id;
                    return (
                      <button
                        key={preset.id || 'auto'}
                        type="button"
                        onClick={() => setPageFormData({ ...pageFormData, menu_icon: preset.id })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                            : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                        }`}
                      >
                        <PresetIcon className="w-3 h-3" />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">เนื้อหาหน้าเพจ (Content) *</label>
                <textarea
                  rows="8"
                  required
                  value={pageFormData.content}
                  onChange={(e) => setPageFormData({ ...pageFormData, content: e.target.value })}
                  placeholder="เขียนเนื้อหาของหน้านี้ (รองรับข้อความ, HTML หรือ JSON Blocks)..."
                  className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none leading-relaxed"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setPageModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium transition cursor-pointer text-center"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingPage}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition shadow-sm cursor-pointer disabled:opacity-50 text-center"
                >
                  {submittingPage ? 'กำลังบันทึก...' : editingPage ? 'บันทึกการแก้ไข' : 'สร้างหน้าเพจ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= USER MODAL (CREATE / EDIT) ================= */}
      {userModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
          onClick={() => setUserModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 relative my-auto animate-in fade-in zoom-in-95 duration-150 p-5 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-100 mb-4 sm:mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                    {editingUser ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้งานใหม่'}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-neutral-500">
                    {editingUser ? 'แก้ไขชื่อ สิทธิ์ หรือรีเซ็ตรหัสผ่าน' : 'สร้างบัญชีผู้ใช้สำหรับเข้าสู่ระบบหลังบ้าน'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  ชื่อ-นามสกุล หรือชื่อแสดง *
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="เช่น ครูสมชาย ใจดี"
                  className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  ชื่อผู้ใช้งาน (Username) *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingUser}
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  placeholder="เช่น somchai_admin"
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs outline-none ${
                    editingUser
                      ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                      : 'bg-neutral-50 border-neutral-200 focus:bg-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  ระดับสิทธิ์ (Role) *
                </label>
                <select
                  value={userFormData.role}
                  disabled={editingUser && (editingUser.username === 'admin' || editingUser.id === currentUser?.id)}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs outline-none ${
                    editingUser && (editingUser.username === 'admin' || editingUser.id === currentUser?.id)
                      ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                      : 'bg-neutral-50 border-neutral-200 focus:bg-white focus:border-emerald-500 cursor-pointer'
                  }`}
                >
                  <option value="admin">ผู้ดูแลระบบ (Admin) - จัดการได้ทุกส่วน</option>
                  <option value="editor">ผู้แก้ไขเนื้อหา (Editor) - จัดการข่าวสารและหน้าเพจ</option>
                  <option value="teacher">คุณครู / เจ้าหน้าที่ (Teacher)</option>
                </select>
                {editingUser && editingUser.username === 'admin' && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    * บัญชีผู้ดูแลระบบหลัก (Super Admin) ได้รับการคุ้มครอง ไม่สามารถเปลี่ยนระดับสิทธิ์ได้
                  </p>
                )}
                {editingUser && editingUser.username !== 'admin' && editingUser.id === currentUser?.id && (
                  <p className="text-[10px] text-amber-600 mt-1">
                    * ไม่สามารถลดหรือเปลี่ยนระดับสิทธิ์ของบัญชีตนเองที่กำลังใช้งานอยู่ได้
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  {editingUser ? 'รหัสผ่านใหม่ (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)' : 'รหัสผ่าน (อย่างน้อย 4 ตัวอักษร) *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  placeholder={editingUser ? 'กรอกเมื่อต้องการเปลี่ยนรหัสผ่านใหม่...' : 'ตั้งรหัสผ่านสำหรับเข้าสู่ระบบ...'}
                  className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 mt-5">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-semibold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {submittingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUser ? 'บันทึกการแก้ไข' : 'สร้างผู้ใช้'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= AGENT KEY MODAL ================= */}
      {keyModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto"
          onClick={() => {
            if (!newlyCreatedKey) setKeyModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 relative my-auto animate-in fade-in zoom-in-95 duration-150 p-5 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            {newlyCreatedKey ? (
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <h3 className="text-base font-bold text-neutral-900">สร้าง API Key สำเร็จแล้ว!</h3>
                  <p className="text-xs text-neutral-500 mt-1">
                    API Key สำหรับ <strong className="text-emerald-700">{newlyCreatedKey.name}</strong> พร้อมใช้งานแล้ว
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-2">
                  <div className="text-[10px] text-neutral-400 flex items-center justify-between">
                    <span>API KEY (X-Agent-Key):</span>
                    <button
                      onClick={() => copyToClipboard(newlyCreatedKey.key)}
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-mono"
                    >
                      {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey ? 'คัดลอกสำเร็จ' : 'คัดลอกคีย์'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-emerald-300 break-all select-all py-1">
                    {newlyCreatedKey.key}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  ⚠️ <strong>คำเตือน:</strong> โปรดคัดลอก API Key นี้เก็บไว้ทันที ท่านสามารถนำไปใส่ใน Header <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">X-Agent-Key</code> ของ AI Agent (เช่น Claude, Cursor, Gemini หรือ Python Agent)
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setNewlyCreatedKey(null);
                    setKeyModalOpen(false);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition"
                >
                  เสร็จสิ้น / ปิดหน้าต่าง
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-neutral-100 mb-4 sm:mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                        สร้าง API Key สำหรับ AI Agent
                      </h3>
                      <p className="text-[11px] sm:text-xs text-neutral-500">
                        ออกรหัสยืนยันตัวตนสำหรับ AI Agent หรือบอทภายนอก
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setKeyModalOpen(false)}
                    className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveKey} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      ชื่อเรียกของ API Key *
                    </label>
                    <input
                      type="text"
                      required
                      value={keyFormData.name}
                      onChange={(e) => setKeyFormData({ ...keyFormData, name: e.target.value })}
                      placeholder="เช่น Claude Desktop, Cursor Agent, Gemini Bot"
                      className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-neutral-700 mb-1">
                      คำอธิบายการใช้งาน (ทางเลือก)
                    </label>
                    <input
                      type="text"
                      value={keyFormData.description}
                      onChange={(e) => setKeyFormData({ ...keyFormData, description: e.target.value })}
                      placeholder="เช่น บอทสำหรับเขียนข่าวสารกิจกรรมวิชาการประจำสัปดาห์"
                      className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 mt-5">
                    <button
                      type="button"
                      onClick={() => setKeyModalOpen(false)}
                      className="px-4 py-2 rounded-xl text-neutral-600 hover:bg-neutral-100 font-semibold cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={submittingKey}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {submittingKey && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>สร้างและออกคีย์ (Generate Key)</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= FORCE CHANGE PASSWORD MODAL (ON FIRST LOGIN) ================= */}
      {mustChangePassword && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 p-5 sm:p-6 text-white text-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-2.5 flex items-center justify-center mx-auto mb-3 shadow-md">
                <Key className="w-6 h-6 sm:w-7 sm:h-7 text-amber-200" />
              </div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">เข้าสู่ระบบครั้งแรก: บังคับเปลี่ยนรหัสผ่าน</h3>
              <p className="text-amber-100/90 text-[11px] sm:text-xs mt-1">
                เพื่อความปลอดภัยของเว็บไซต์โรงเรียน ท่านต้องเปลี่ยนรหัสผ่านเพื่อความปลอดภัยก่อนเริ่มใช้งาน
              </p>
            </div>

            <form onSubmit={handleForceChangePassword} className="p-6 space-y-4 text-xs">
              {forcePasswordError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{forcePasswordError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  รหัสผ่านเดิม *
                </label>
                <input
                  type="password"
                  required
                  value={forceOldPassword}
                  onChange={(e) => setForceOldPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านเดิม..."
                  className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  รหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร) *
                </label>
                <input
                  type="password"
                  required
                  value={forceNewPassword}
                  onChange={(e) => setForceNewPassword(e.target.value)}
                  placeholder="ตั้งรหัสผ่านใหม่..."
                  className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  ยืนยันรหัสผ่านใหม่อีกครั้ง *
                </label>
                <input
                  type="password"
                  required
                  value={forceConfirmPassword}
                  onChange={(e) => setForceConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน..."
                  className="w-full py-2.5 px-3 bg-neutral-50 rounded-xl border border-neutral-200 focus:bg-white focus:border-amber-500 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={forcePasswordLoading}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {forcePasswordLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึกรหัสผ่านใหม่...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>บันทึกรหัสผ่านใหม่และเข้าใช้งานระบบ</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-[11px] text-neutral-400 hover:text-neutral-600 cursor-pointer"
                >
                  ออกจากระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
