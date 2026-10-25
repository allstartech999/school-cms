import React, { useState, useEffect, useMemo } from 'react';
import {
  Puzzle,
  HardDrive,
  Cloud,
  Server,
  Database,
  FolderArchive,
  Activity,
  Sparkles,
  Settings,
  Download,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Plus,
  Search,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  HelpCircle,
  X,
  FileCode,
  Check,
  Copy
} from 'lucide-react';
import {
  fetchExtensions,
  installExtension,
  uninstallExtension,
  toggleExtension,
  updateExtensionConfig,
  testExtension,
  fetchGoogleDriveOAuthURL,
  disconnectGoogleDrive
} from '../../api';

// Icon resolver helper
function renderExtensionIcon(iconName, className = "w-6 h-6") {
  switch (iconName) {
    case 'HardDrive':
      return <HardDrive className={className} />;
    case 'Cloud':
      return <Cloud className={className} />;
    case 'Server':
      return <Server className={className} />;
    case 'Database':
      return <Database className={className} />;
    case 'FolderArchive':
      return <FolderArchive className={className} />;
    case 'Activity':
      return <Activity className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    default:
      return <Puzzle className={className} />;
  }
}

export default function AdminExtensions({ token, showNotification }) {
  const [extensions, setExtensions] = useState([]);
  const [activeStorageEngine, setActiveStorageEngine] = useState('storage-local');
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all'); // all, storage, analytics, seo, other
  const [selectedStatus, setSelectedStatus] = useState('all'); // all, installed, available

  // Modal: Configure Extension
  const [configModalExt, setConfigModalExt] = useState(null);
  const [configForm, setConfigForm] = useState({});
  const [showSecrets, setShowSecrets] = useState({});
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Modal: Install Custom Extension
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customManifestJSON, setCustomManifestJSON] = useState('');
  const [installingCustom, setInstallingCustom] = useState(false);

  // Action Loading states per extension ID
  const [actionLoading, setActionLoading] = useState({});

  const setItemLoading = (id, isLoading) => {
    setActionLoading((prev) => ({ ...prev, [id]: isLoading }));
  };

  // Load extensions
  const loadExtensions = async () => {
    try {
      setLoading(true);
      const data = await fetchExtensions(token);
      setExtensions(data.extensions || []);
      setActiveStorageEngine(data.active_storage_engine || 'storage-local');
    } catch (err) {
      showNotification('ไม่สามารถโหลดรายการส่วนเสริมได้: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExtensions();
  }, []);

  // Filter extensions
  const filteredExtensions = useMemo(() => {
    return extensions.filter((ext) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'other') {
          if (['storage', 'analytics', 'seo'].includes(ext.category)) return false;
        } else if (ext.category !== selectedCategory) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus === 'installed' && !ext.installed) return false;
      if (selectedStatus === 'available' && ext.installed) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = ext.name?.toLowerCase().includes(q);
        const matchDesc = ext.description?.toLowerCase().includes(q);
        const matchId = ext.id?.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchId) return false;
      }

      return true;
    });
  }, [extensions, selectedCategory, selectedStatus, searchQuery]);

  // Handle Install
  const handleInstall = async (ext) => {
    try {
      setItemLoading(ext.id, true);
      await installExtension({ id: ext.id }, token);
      showNotification(`ติดตั้งส่วนเสริม "${ext.name}" เรียบร้อยแล้ว`);
      await loadExtensions();
    } catch (err) {
      showNotification(err.message || 'เกิดข้อผิดพลาดในการติดตั้ง', 'error');
    } finally {
      setItemLoading(ext.id, false);
    }
  };

  // Handle Uninstall
  const handleUninstall = async (ext) => {
    if (ext.id === 'storage-local') {
      showNotification('Local Disk Storage เป็นระบบจัดเก็บหลักของระบบ ไม่สามารถถอนการติดตั้งได้', 'error');
      return;
    }
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการถอนการติดตั้งส่วนเสริม "${ext.name}"?`)) {
      return;
    }

    try {
      setItemLoading(ext.id, true);
      await uninstallExtension(ext.id, token);
      showNotification(`ถอนการติดตั้งส่วนเสริม "${ext.name}" เรียบร้อยแล้ว`);
      await loadExtensions();
    } catch (err) {
      showNotification(err.message || 'เกิดข้อผิดพลาดในการถอนการติดตั้ง', 'error');
    } finally {
      setItemLoading(ext.id, false);
    }
  };

  // Handle Toggle Enabled
  const handleToggle = async (ext) => {
    try {
      setItemLoading(ext.id, true);
      const res = await toggleExtension(ext.id, token);
      showNotification(res.message || 'อัปเดตสถานะส่วนเสริมสำเร็จ');
      await loadExtensions();
    } catch (err) {
      showNotification(err.message || 'ไม่สามารถเปลี่ยนสถานะส่วนเสริมได้', 'error');
    } finally {
      setItemLoading(ext.id, false);
    }
  };

  // Open Configure Modal
  const openConfigModal = (ext) => {
    setConfigModalExt(ext);
    setConfigForm(ext.config || {});
    setShowSecrets({});
    setTestResult(null);
  };

  // Save Configuration
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!configModalExt) return;

    try {
      setSavingConfig(true);
      await updateExtensionConfig(configModalExt.id, configForm, undefined, token);
      showNotification(`บันทึกการตั้งค่า "${configModalExt.name}" เรียบร้อยแล้ว`);
      setConfigModalExt(null);
      await loadExtensions();
    } catch (err) {
      showNotification(err.message || 'บันทึกการตั้งค่าไม่สำเร็จ', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    if (!configModalExt) return;
    try {
      setTestingConnection(true);
      setTestResult(null);
      const res = await testExtension(configModalExt.id, configForm, token);
      setTestResult(res);
      if (res.success) {
        showNotification(res.message);
      } else {
        showNotification(res.message, 'error');
      }
    } catch (err) {
      setTestResult({ success: false, message: err.message });
      showNotification(err.message, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  // Google Drive OAuth Connect Flow
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [disconnectingGoogle, setDisconnectingGoogle] = useState(false);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  const handleConnectGoogleDrive = async () => {
    const targetExtId = configModalExt?.id || 'storage-filo';
    try {
      setConnectingGoogle(true);
      // Auto save current client_id / secret first
      await updateExtensionConfig(targetExtId, configForm, undefined, token);

      const res = await fetchGoogleDriveOAuthURL(configForm.client_id, targetExtId, token);
      if (!res.auth_url) {
        throw new Error('ไม่พบ URL สำหรับเชื่อมต่อ Google OAuth');
      }

      // Open OAuth in Popup Window
      const width = 580;
      const height = 680;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const popup = window.open(
        res.auth_url,
        'GoogleDriveOAuth',
        `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
      );

      // Listen for OAuth success message from callback window
      const handleMessage = async (event) => {
        if (event.data?.type === 'GOOGLE_DRIVE_OAUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          if (event.data.success) {
            showNotification(`เชื่อมต่อ Google Drive สำเร็จ! (${event.data.email || ''})`);
            // Refresh data
            const refreshed = await fetchExtensions(token);
            setExtensions(refreshed.extensions || []);
            setActiveStorageEngine(refreshed.active_storage_engine || 'storage-local');
            const updated = (refreshed.extensions || []).find((e) => e.id === targetExtId);
            if (updated) {
              setConfigModalExt(updated);
              setConfigForm(updated.config || {});
            }
          } else {
            showNotification(event.data.message || 'การเชื่อมต่อล้มเหลว', 'error');
          }
          setConnectingGoogle(false);
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (err) {
      showNotification(err.message || 'เกิดข้อผิดพลาดในการเริ่มเชื่อมต่อ Google Drive', 'error');
      setConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogleDrive = async () => {
    const targetExtId = configModalExt?.id || 'storage-filo';
    if (!window.confirm('คุณต้องการยกเลิกการเชื่อมต่อบัญชี Google Drive นี้หรือไม่? ระบบจะสลับกลับไปใช้ Local Storage ชั่วคราว')) {
      return;
    }
    try {
      setDisconnectingGoogle(true);
      const res = await disconnectGoogleDrive(targetExtId, token);
      showNotification(res.message || 'ยกเลิกการเชื่อมต่อ Google Drive เรียบร้อยแล้ว');
      await loadExtensions();
      setConfigForm((prev) => ({
        ...prev,
        connected_email: '',
        connected_name: '',
        refresh_token: '',
        access_token: ''
      }));
      if (configModalExt) {
        setConfigModalExt((prev) => ({
          ...prev,
          config: {
            ...prev.config,
            connected_email: '',
            connected_name: ''
          }
        }));
      }
    } catch (err) {
      showNotification(err.message || 'ยกเลิกการเชื่อมต่อไม่สำเร็จ', 'error');
    } finally {
      setDisconnectingGoogle(false);
    }
  };

  const copyRedirectURI = () => {
    const uri = `${window.location.origin}/api/v1/extensions/google-drive/oauth/callback`;
    navigator.clipboard.writeText(uri);
    setCopiedRedirect(true);
    showNotification('คัดลอก Redirect URI เรียบร้อยแล้ว');
    setTimeout(() => setCopiedRedirect(false), 2500);
  };

  // Install Custom Extension via Manifest JSON
  const handleInstallCustom = async (e) => {
    e.preventDefault();
    if (!customManifestJSON.trim()) {
      showNotification('กรุณาวางโค้ด JSON Manifest ของส่วนเสริม', 'error');
      return;
    }

    try {
      setInstallingCustom(true);
      // Validate JSON syntax first
      JSON.parse(customManifestJSON);
      await installExtension({ manifest_json: customManifestJSON }, token);
      showNotification('ติดตั้งส่วนเสริมภายนอกเรียบร้อยแล้ว');
      setShowCustomModal(false);
      setCustomManifestJSON('');
      await loadExtensions();
    } catch (err) {
      showNotification('ติดตั้งไม่สำเร็จ: ' + err.message, 'error');
    } finally {
      setInstallingCustom(false);
    }
  };

  // Sample manifest template
  const loadSampleManifest = () => {
    const sample = {
      id: "storage-sftp",
      name: "SFTP School Archive Storage",
      category: "storage",
      description: "เชื่อมต่อพื้นที่จัดเก็บไฟล์สำรองผ่าน SFTP ไปยังเซิร์ฟเวอร์สำรองของโรงเรียน",
      version: "1.0.0",
      author: "School IT Team",
      icon: "FolderArchive",
      config: {
        host: "sftp.school.ac.th",
        port: 22,
        username: "school_backup",
        remote_path: "/var/storage/uploads"
      },
      config_schema: [
        {
          key: "host",
          label: "SFTP Host Server",
          type: "text",
          required: true,
          placeholder: "sftp.school.ac.th"
        },
        {
          key: "port",
          label: "Port",
          type: "number",
          default: "22",
          required: true
        },
        {
          key: "username",
          label: "Username",
          type: "text",
          required: true
        },
        {
          key: "password",
          label: "SFTP Password / Private Key",
          type: "password",
          required: true
        },
        {
          key: "remote_path",
          label: "Remote Directory Path",
          type: "text",
          default: "/var/storage/uploads"
        }
      ]
    };
    setCustomManifestJSON(JSON.stringify(sample, null, 2));
  };

  // Active storage provider details
  const activeStorageExt = extensions.find((e) => e.id === activeStorageEngine);

  return (
    <div className="space-y-6">
      {/* Top Banner: Active File Storage Engine Status */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border border-neutral-700/60 rounded-2xl p-5 sm:p-6 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  ระบบจัดเก็บไฟล์ปัจจุบัน (Active File Storage)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeStorageExt ? activeStorageExt.name : activeStorageEngine}
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
                รูปภาพและไฟล์สื่อที่อัปโหลดใหม่จะถูกส่งไปยังระบบจัดเก็บนี้อัตโนมัติ
                {activeStorageEngine === 'storage-local' ? (
                  <span className="text-neutral-400 ml-1">
                    (จัดเก็บไว้ในเซิร์ฟเวอร์หลักของโรงเรียน สามารถเปลี่ยนไปใช้ Cloudflare R2 หรือ AWS S3 ได้เพียงเปิดใช้งานส่วนเสริมด้านล่าง)
                  </span>
                ) : (
                  <span className="text-emerald-300 ml-1">
                    (จัดเก็บไฟล์บน Cloud Storage ความเร็วสูงและกระจายแคชทั่วโลก)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-end lg:self-center shrink-0">
            <button
              onClick={() => setShowCustomModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ติดตั้งส่วนเสริมภายนอก</span>
            </button>
            <button
              onClick={loadExtensions}
              disabled={loading}
              title="รีเฟรชข้อมูล"
              className="p-2 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-neutral-200/80 shadow-xs flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'storage', label: 'ระบบจัดเก็บไฟล์ (Storage)' },
            { id: 'analytics', label: 'สถิติและการตลาด' },
            { id: 'seo', label: 'SEO & โซเชียล' },
            { id: 'other', label: 'อื่นๆ' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right Controls: Status & Search */}
        <div className="flex items-center gap-2">
          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">สถานะ: ทั้งหมด</option>
            <option value="installed">เฉพาะที่ติดตั้งแล้ว</option>
            <option value="available">ยังไม่ติดตั้ง</option>
          </select>

          {/* Search Bar */}
          <div className="relative min-w-[160px] sm:min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="ค้นหาส่วนเสริม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs focus:bg-white focus:border-emerald-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Extensions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-neutral-200/80 animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-neutral-200 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="w-2/3 h-4 bg-neutral-200 rounded" />
                  <div className="w-1/3 h-3 bg-neutral-100 rounded" />
                </div>
              </div>
              <div className="w-full h-12 bg-neutral-100 rounded" />
              <div className="w-full h-8 bg-neutral-200 rounded-lg" />
            </div>
          ))}
        </div>
      ) : filteredExtensions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200/80">
          <Puzzle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-neutral-800 mb-1">ไม่พบส่วนเสริมที่ตรงกับเงื่อนไข</h4>
          <p className="text-xs text-neutral-500 mb-4">ลองปรับคำค้นหาหรือเปลี่ยนตัวกรองหมวดหมู่</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedStatus('all');
            }}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs font-medium cursor-pointer"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredExtensions.map((ext) => {
            const isInstalled = ext.installed;
            const isEnabled = ext.enabled;
            const isActiveStorage = ext.is_active_storage;
            const isLoading = actionLoading[ext.id];

            return (
              <div
                key={ext.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isActiveStorage
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : isInstalled && isEnabled
                    ? 'border-neutral-300 shadow-xs'
                    : 'border-neutral-200/80 hover:border-neutral-300'
                }`}
              >
                <div>
                  {/* Card Header: Icon, Category Badge & Version */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          ext.category === 'storage'
                            ? 'bg-blue-50 text-blue-600 border border-blue-100'
                            : ext.category === 'analytics'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : ext.category === 'seo'
                            ? 'bg-purple-50 text-purple-600 border border-purple-100'
                            : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                        }`}
                      >
                        {renderExtensionIcon(ext.icon)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 leading-snug">{ext.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-neutral-500">v{ext.version}</span>
                          <span className="text-[10px] text-neutral-300">•</span>
                          <span className="text-[10px] text-neutral-500 truncate max-w-[120px]">{ext.author}</span>
                        </div>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                        ext.category === 'storage'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : ext.category === 'analytics'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : ext.category === 'seo'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                      }`}
                    >
                      {ext.category}
                    </span>
                  </div>

                  {/* Active Storage Engine Banner */}
                  {isActiveStorage && (
                    <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center gap-2 text-emerald-800 text-[11px] font-semibold">
                      <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>กำลังเป็นระบบจัดเก็บไฟล์หลัก</span>
                    </div>
                  )}

                  {/* Google Drive / Filo Storage Connected Account Badge */}
                  {(ext.id === 'storage-filo' || ext.id === 'storage-google-drive') && ext.config?.connected_email && (
                    <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-between text-blue-900 text-[11px] font-semibold">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">Drive: {ext.config.connected_email}</span>
                      </div>
                      <span className="text-[10px] text-blue-600 bg-white px-1.5 py-0.5 rounded border border-blue-200 shrink-0">OAuth 2.0</span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed mb-4">
                    {ext.description}
                  </p>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-neutral-100 space-y-2">
                  <div className="flex items-center justify-between">
                    {/* Status Badge */}
                    <div>
                      {!isInstalled ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                          <span className="w-2 h-2 rounded-full bg-neutral-300" />
                          ยังไม่ติดตั้ง
                        </span>
                      ) : isEnabled ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          เปิดใช้งานอยู่
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
                          <span className="w-2 h-2 rounded-full bg-neutral-300" />
                          ปิดการใช้งาน
                        </span>
                      )}
                    </div>

                    {/* Enable / Disable Toggle (only if installed) */}
                    {isInstalled && (
                      <button
                        onClick={() => handleToggle(ext)}
                        disabled={isLoading}
                        title={isEnabled ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? 'bg-emerald-600' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            isEnabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-2 pt-1">
                    {!isInstalled ? (
                      <button
                        onClick={() => handleInstall(ext)}
                        disabled={isLoading}
                        className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        <span>ติดตั้งส่วนเสริม</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openConfigModal(ext)}
                          className="flex-1 py-1.5 px-3 rounded-lg border border-neutral-200 hover:border-neutral-300 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>ตั้งค่า</span>
                        </button>

                        {ext.id !== 'storage-local' && (
                          <button
                            onClick={() => handleUninstall(ext)}
                            disabled={isLoading}
                            title="ถอนการติดตั้ง"
                            className="p-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition cursor-pointer"
                          >
                            {isLoading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: CONFIGURE EXTENSION ================= */}
      {configModalExt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  {renderExtensionIcon(configModalExt.icon, 'w-5 h-5')}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 leading-snug">
                    ตั้งค่า: {configModalExt.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    กำหนดค่าคอนฟิกและการเชื่อมต่อสำหรับส่วนเสริมนี้
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfigModalExt(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Test Result Alert Banner */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.details && (
                      <p className="text-[11px] mt-1 opacity-80 break-all">{testResult.details}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Filo Storage / Google Drive OAuth 2.0 Integration Card */}
              {(configModalExt.id === 'storage-filo' || configModalExt.id === 'storage-google-drive') && (
                <div className="space-y-4">
                  {(configForm.connected_email || configModalExt.config?.connected_email) ? (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-blue-500/10 border border-emerald-500/30 text-neutral-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-white shadow-xs border border-neutral-200 flex items-center justify-center shrink-0">
                            <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                            </svg>
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 mb-1">
                              ✓ ยืนยันสิทธิ์เรียบร้อยแล้ว
                            </span>
                            <p className="text-xs font-bold text-neutral-900">
                              บัญชี Google: {configForm.connected_email || configModalExt.config?.connected_email}
                            </p>
                            <p className="text-[11px] text-neutral-500 mt-0.5">
                              โฟลเดอร์จัดเก็บ: <strong className="text-neutral-700">{configForm.folder_name || 'School-CMS-Uploads'}</strong>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleDisconnectGoogleDrive}
                          disabled={disconnectingGoogle}
                          className="px-3 py-1.5 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold transition cursor-pointer shrink-0 shadow-xs"
                        >
                          {disconnectingGoogle ? 'กำลังยกเลิก...' : 'ตัดการเชื่อมต่อ'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-neutral-50 border border-neutral-200 text-center space-y-4">
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-xs border border-neutral-200 flex items-center justify-center">
                        <svg className="w-8 h-8" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                        </svg>
                      </div>

                      <div className="max-w-md mx-auto">
                        <h4 className="text-sm font-bold text-neutral-900">
                          เข้าสู่ระบบด้วย Google Drive ของคุณ
                        </h4>
                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                          กดปุ่มด้านล่างเพื่อเข้าสู่ระบบ Google และยืนยันสิทธิ์การจัดเก็บไฟล์ภาพของโรงเรียนลงใน Google Drive ของคุณ
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleConnectGoogleDrive}
                        disabled={connectingGoogle}
                        className="w-full sm:w-auto mx-auto py-3 px-6 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 flex items-center justify-center gap-3 shadow-xs hover:shadow transition cursor-pointer"
                      >
                        {connectingGoogle ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                        )}
                        <span>เข้าสู่ระบบด้วย Google Drive (Sign in with Google)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Form Schema for non-OAuth fields */}
              {configModalExt.config_schema && configModalExt.config_schema.filter(f => !['client_id', 'client_secret', 'filo_api_key'].includes(f.key)).length > 0 ? (
                <form id="ext-config-form" onSubmit={handleSaveConfig} className="space-y-4 text-xs pt-2 border-t border-neutral-100">
                  {configModalExt.config_schema
                    .filter(f => !['client_id', 'client_secret', 'filo_api_key'].includes(f.key))
                    .map((field) => {
                    const value = configForm[field.key] ?? field.default ?? '';
                    const isSecret = field.type === 'password';
                    const showSecret = showSecrets[field.key];

                    return (
                      <div key={field.key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-neutral-700">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                        </div>

                        {field.type === 'textarea' ? (
                          <textarea
                            rows={3}
                            value={value}
                            placeholder={field.placeholder}
                            onChange={(e) =>
                              setConfigForm({ ...configForm, [field.key]: e.target.value })
                            }
                            className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none font-mono"
                          />
                        ) : isSecret ? (
                          <div className="relative">
                            <input
                              type={showSecret ? 'text' : 'password'}
                              value={value}
                              placeholder={field.placeholder || '••••••••••••'}
                              onChange={(e) =>
                                setConfigForm({ ...configForm, [field.key]: e.target.value })
                              }
                              className="w-full py-2 pl-3 pr-9 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none font-mono"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowSecrets((prev) => ({ ...prev, [field.key]: !prev[field.key] }))
                              }
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
                            >
                              {showSecret ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={value}
                            placeholder={field.placeholder}
                            onChange={(e) =>
                              setConfigForm({ ...configForm, [field.key]: e.target.value })
                            }
                            className="w-full py-2 px-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs focus:bg-white focus:border-emerald-500 outline-none"
                          />
                        )}

                        {field.description && (
                          <p className="text-[11px] text-neutral-500">{field.description}</p>
                        )}
                      </div>
                    );
                  })}
                </form>
              ) : (
                !(configModalExt.id === 'storage-filo' || configModalExt.id === 'storage-google-drive') && (
                  <p className="text-xs text-neutral-500 text-center py-4">
                    ส่วนเสริมนี้ไม่มีการตั้งค่าเพิ่มเติมที่ต้องระบุ
                  </p>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200/80 bg-neutral-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Test connection button for storage extensions */}
              {configModalExt.category === 'storage' && (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection || savingConfig}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {testingConnection ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>ทดสอบการเชื่อมต่อ</span>
                </button>
              )}

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setConfigModalExt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-200/60 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  form="ext-config-form"
                  disabled={savingConfig}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  {savingConfig ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>บันทึกการตั้งค่า</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INSTALL CUSTOM EXTENSION ================= */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">ติดตั้งส่วนเสริมภายนอก (Custom Extension)</h3>
                  <p className="text-[11px] text-neutral-500">
                    นำเข้าโครงสร้างส่วนเสริมและระบบจัดเก็บไฟล์ผ่าน JSON Manifest
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form id="custom-ext-form" onSubmit={handleInstallCustom} className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-700">
                  Extension Manifest (JSON)
                </label>
                <button
                  type="button"
                  onClick={loadSampleManifest}
                  className="text-[11px] text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>โหลดตัวอย่าง Manifest Template</span>
                </button>
              </div>

              <textarea
                rows={12}
                value={customManifestJSON}
                onChange={(e) => setCustomManifestJSON(e.target.value)}
                placeholder='{\n  "id": "custom-storage",\n  "name": "My Custom Storage",\n  "category": "storage",\n  "version": "1.0.0"\n}'
                className="w-full p-3 bg-neutral-900 text-emerald-400 font-mono text-xs rounded-xl border border-neutral-800 outline-none focus:border-emerald-500 leading-relaxed scrollbar-none"
              />

              <p className="text-[11px] text-neutral-500 leading-relaxed">
                💡 รูปแบบ Manifest ประกอบด้วย <code className="bg-neutral-100 px-1 py-0.5 rounded">id</code>,{' '}
                <code className="bg-neutral-100 px-1 py-0.5 rounded">name</code>,{' '}
                <code className="bg-neutral-100 px-1 py-0.5 rounded">category</code>,{' '}
                <code className="bg-neutral-100 px-1 py-0.5 rounded">config_schema</code>{' '}
                เพื่อรองรับการกำหนดค่าฟิลด์เชื่อมต่อในอนาคตได้อย่างยืดหยุ่น
              </p>
            </form>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200/80 bg-neutral-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-200/60 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                form="custom-ext-form"
                disabled={installingCustom}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                {installingCustom ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>ติดตั้งส่วนเสริม</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
