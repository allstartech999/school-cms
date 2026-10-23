import React, { useState } from 'react';
import {
  Flame,
  Award,
  BookOpen,
  Heart,
  Users,
  MapPin,
  School,
  X,
  ZoomIn,
  Sparkles,
} from 'lucide-react';

export default function SchoolBasicInfoBlock({
  title = 'ข้อมูลพื้นฐานโรงเรียน',
  subtitle = 'โรงเรียนโพนงามพิทยานุกูล อำเภอโกสุมพิสัย จังหวัดมหาสารคาม',
  emblem2d = '/images/ppk-emblem-2d.png',
  emblem3d = '/images/ppk-emblem-3d.png',
  abbreviation = 'พ.พ.ก.',
  schoolFullName = 'โรงเรียนโพนงามพิทยานุกูล',
  emblemMeaning = 'คบเพลิงและจักร หมายถึง แสงสว่างแห่งชีวิต และการปรับปรุงเปลี่ยนแปลงที่ดีขึ้น',
  colors = {
    primary: 'สีเขียว-ขาว',
    greenDesc: 'ความเจริญงอกงาม ความอุดมสมบูรณ์ และความร่มเย็น',
    whiteDesc: 'ความบริสุทธิ์ คุณธรรม จริยธรรม และความซื่อสัตย์สุจริต',
  },
  paliMotto = {
    pali: 'ปัญญา นรานํ รตนํ',
    meaning: 'ปัญญา คือ ดวงประทีปแก้วของ นรชน',
  },
  motto = 'เรียนดี กีฬาเด่น เน้นคุณธรรม นำชุมชน',
  mottoPillars = [
    { title: 'เรียนดี', desc: 'มุ่งเน้นความเป็นเลิศทางวิชาการและทักษะแห่งอนาคต', icon: BookOpen },
    { title: 'กีฬาเด่น', desc: 'ส่งเสริมสุขภาพพลานามัย มีน้ำใจนักกีฬา', icon: Award },
    { title: 'เน้นคุณธรรม', desc: 'ปลูกฝังคุณธรรม ความซื่อสัตย์สุจริต และระเบียบวินัย', icon: Heart },
    { title: 'นำชุมชน', desc: 'ประสานพลังร่วมพัฒนาท้องถิ่นและสิ่งแวดล้อม', icon: Users },
  ],
  vision = 'เป็นโรงเรียนที่พัฒนาคุณภาพ เพิ่มปริมาณ ประสานความร่วมมือกับทุกฝ่าย',
  serviceSchools = [
    'โรงเรียนชุมชนโพนงามโพนสว่าง',
    'โรงเรียนบ้านม่วงใหญ่ดอนน้อยวิทยา',
    'โรงเรียนบ้านดอนจำปาดอนสวรรค์',
    'โรงเรียนบ้านโนนสัง',
  ],
}) {
  const [lightboxImage, setLightboxImage] = useState(null);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-10">
      
      {/* 1. Header Title */}
      <div className="text-center space-y-2.5 pb-6 border-b border-slate-200/80">
        <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold tracking-wide">
          ข้อมูลสถานศึกษา
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-medium max-w-xl mx-auto">
          {subtitle}
        </p>
      </div>

      {/* 2. Section: ตราสัญลักษณ์โรงเรียน (School Emblems) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Flame className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              ตราสัญลักษณ์โรงเรียน
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เครื่องหมายประจำสถาบันโรงเรียนโพนงามพิทยานุกูล
            </p>
          </div>
        </div>

        {/* 2 Emblems Side-by-Side (Clean Balanced Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          
          {/* Emblem 1: 2D Digital Graphic */}
          <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/70 flex flex-col items-center text-center group hover:border-emerald-300 transition-all">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center p-2">
              <img
                src={emblem2d}
                alt="ตราสัญลักษณ์โรงเรียนโพนงามพิทยานุกูล"
                className="max-w-full max-h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => setLightboxImage(emblem2d)}
              />
              <button
                type="button"
                onClick={() => setLightboxImage(emblem2d)}
                className="absolute bottom-2 right-2 p-2 rounded-xl bg-white/90 shadow-xs border border-slate-200 text-slate-600 hover:text-emerald-600 transition cursor-pointer"
                title="ขยายภาพ"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs font-semibold text-slate-600 mt-3">
              ตราสัญลักษณ์รูปแบบดิจิทัล (Graphic)
            </span>
          </div>

          {/* Emblem 2: 3D Gold Relief */}
          <div className="bg-slate-50/70 rounded-2xl p-6 border border-slate-200/70 flex flex-col items-center text-center group hover:border-emerald-300 transition-all">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center p-2">
              <img
                src={emblem3d}
                alt="ตราสัญลักษณ์โรงเรียนโพนงามพิทยานุกูล แบบประติมากรรมนูนสีทอง"
                className="max-w-full max-h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => setLightboxImage(emblem3d)}
              />
              <button
                type="button"
                onClick={() => setLightboxImage(emblem3d)}
                className="absolute bottom-2 right-2 p-2 rounded-xl bg-white/90 shadow-xs border border-slate-200 text-slate-600 hover:text-emerald-600 transition cursor-pointer"
                title="ขยายภาพ"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs font-semibold text-slate-600 mt-3">
              ตราสัญลักษณ์ประติมากรรมนูนสีทอง (Relief)
            </span>
          </div>

        </div>
      </section>

      {/* 3. Section: ข้อมูลเอกลักษณ์สถานศึกษา (Table & Details) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100">
          ข้อมูลพื้นฐานและเอกลักษณ์สถานศึกษา
        </h2>

        {/* Structured Striped List Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 divide-y divide-slate-100">
          
          {/* Row 1: ชื่อ อักษรย่อ */}
          <div className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-5 hover:bg-slate-50/50 transition-colors gap-2 sm:gap-4 items-center">
            <div className="sm:col-span-3 text-xs sm:text-sm font-bold text-slate-700">
              ชื่อ อักษรย่อ
            </div>
            <div className="sm:col-span-9 flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white font-black text-sm tracking-widest shadow-2xs">
                {abbreviation}
              </span>
              <span className="text-xs sm:text-sm text-slate-600 font-medium">
                ({schoolFullName})
              </span>
            </div>
          </div>

          {/* Row 2: ตราสัญลักษณ์ */}
          <div className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-5 hover:bg-slate-50/50 transition-colors gap-2 sm:gap-4 items-center">
            <div className="sm:col-span-3 text-xs sm:text-sm font-bold text-slate-700">
              ตราสัญลักษณ์
            </div>
            <div className="sm:col-span-9 text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
              {emblemMeaning}
            </div>
          </div>

          {/* Row 3: สีประจำโรงเรียน */}
          <div className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-5 hover:bg-slate-50/50 transition-colors gap-2 sm:gap-4 items-center">
            <div className="sm:col-span-3 text-xs sm:text-sm font-bold text-slate-700">
              สีประจำโรงเรียน
            </div>
            <div className="sm:col-span-9 flex flex-wrap items-center gap-3">
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {colors.primary}
              </span>
              <div className="inline-flex rounded-xl overflow-hidden border border-slate-300 shadow-2xs h-6">
                <div className="w-10 bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold px-2">เขียว</div>
                <div className="w-10 bg-white flex items-center justify-center text-[10px] text-slate-700 font-bold px-2 border-l border-slate-200">ขาว</div>
              </div>
            </div>
          </div>

          {/* Row 4: คติพจน์ */}
          <div className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-5 hover:bg-slate-50/50 transition-colors gap-2 sm:gap-4 items-center">
            <div className="sm:col-span-3 text-xs sm:text-sm font-bold text-slate-700">
              คติพจน์
            </div>
            <div className="sm:col-span-9 space-y-1">
              <div className="text-xs sm:text-sm text-slate-900 font-medium">
                <strong className="text-emerald-800 font-bold">{paliMotto.pali}</strong> หมายถึง {paliMotto.meaning}
              </div>
            </div>
          </div>

          {/* Row 5: คำขวัญ */}
          <div className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-5 hover:bg-slate-50/50 transition-colors gap-2 sm:gap-4 items-start">
            <div className="sm:col-span-3 text-xs sm:text-sm font-bold text-slate-700 pt-1">
              คำขวัญ
            </div>
            <div className="sm:col-span-9 space-y-3">
              <div className="text-sm sm:text-base font-bold text-slate-900">
                {motto}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {mottoPillars.map((p, idx) => {
                  const Icon = p.icon;
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{p.title}</h4>
                        <p className="text-[11px] text-slate-500 leading-snug">{p.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 6: วิสัยทัศน์ */}
          <div className="grid grid-cols-1 sm:grid-cols-12 p-4 sm:p-5 hover:bg-slate-50/50 transition-colors gap-2 sm:gap-4 items-center">
            <div className="sm:col-span-3 text-xs sm:text-sm font-bold text-slate-700">
              วิสัยทัศน์
            </div>
            <div className="sm:col-span-9">
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 text-emerald-950 font-bold text-xs sm:text-sm leading-relaxed">
                {vision}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Section: โรงเรียนในเขตพื้นที่บริการ (Service Area Schools) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <School className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                โรงเรียนในเขตพื้นที่บริการ
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                โรงเรียนประถมศึกษาในเขตพื้นที่บริการของโรงเรียนโพนงามพิทยานุกูล
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80">
            {serviceSchools.length} แห่ง
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {serviceSchools.map((schoolName, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex items-center gap-3.5"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                {idx + 1}
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-slate-900">
                  {schoolName}
                </h3>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>ตำบลโพนงาม อำเภอโกสุมพิสัย จังหวัดมหาสารคาม</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox Modal for Full View */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-xl max-h-[85vh] bg-white rounded-3xl p-6 flex flex-col items-center justify-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="ตราสัญลักษณ์ขยายใหญ่"
              className="max-w-full max-h-[65vh] object-contain filter drop-shadow-xl"
            />
            <div className="mt-4 text-center">
              <h3 className="font-bold text-sm text-slate-900">ตราสัญลักษณ์โรงเรียนโพนงามพิทยานุกูล</h3>
              <p className="text-xs text-slate-500 mt-0.5">คบเพลิงและจักร • ปัญญา นรานํ รตนํ</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
