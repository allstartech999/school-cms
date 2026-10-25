import React, { useState } from 'react';
import { ExternalLink, ZoomIn, X } from 'lucide-react';

/**
 * PostContent Component
 * Renders Markdown-formatted news content including embedded images, photo galleries, headings, lists, and links.
 */
export default function PostContent({ content }) {
  const [activeZoomImg, setActiveZoomImg] = useState(null);

  if (!content) return null;

  // Split into lines and group into structured blocks
  const lines = content.split('\n');
  const rawBlocks = [];
  let currentParagraph = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join('\n').trim();
      if (text) {
        rawBlocks.push({ type: 'paragraph', text });
      }
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Markdown Image: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      flushParagraph();
      rawBlocks.push({ type: 'image', alt: imgMatch[1], url: imgMatch[2] });
    } else if (trimmed.startsWith('### ')) {
      flushParagraph();
      rawBlocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
    } else if (trimmed.startsWith('## ')) {
      flushParagraph();
      rawBlocks.push({ type: 'h2', text: trimmed.replace(/^##\s+/, '') });
    } else if (trimmed.startsWith('# ')) {
      flushParagraph();
      rawBlocks.push({ type: 'h1', text: trimmed.replace(/^#\s+/, '') });
    } else if (trimmed === '---') {
      flushParagraph();
      rawBlocks.push({ type: 'hr' });
    } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      flushParagraph();
      rawBlocks.push({ type: 'bullet', text: trimmed.replace(/^[\*\-]\s+/, '') });
    } else if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      rawBlocks.push({ type: 'numbered', num: numMatch[1], text: numMatch[2] });
    } else if (trimmed === '') {
      flushParagraph();
    } else {
      currentParagraph.push(line);
    }
  }
  flushParagraph();

  // Group consecutive images into a single gallery block for better layout
  const blocks = [];
  let currentImageGroup = [];

  const flushImageGroup = () => {
    if (currentImageGroup.length > 0) {
      blocks.push({
        type: 'gallery',
        images: [...currentImageGroup]
      });
      currentImageGroup = [];
    }
  };

  for (const block of rawBlocks) {
    if (block.type === 'image') {
      currentImageGroup.push(block);
    } else {
      flushImageGroup();
      blocks.push(block);
    }
  }
  flushImageGroup();

  // Helper to render inline markdown (bold, links, code)
  const renderInline = (str) => {
    if (!str) return null;
    const tokens = [];
    let remaining = str;
    let keyIdx = 0;

    const regex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*)/;
    while (remaining) {
      const match = remaining.match(regex);
      if (!match) {
        tokens.push(remaining);
        break;
      }
      const matchIdx = match.index;
      if (matchIdx > 0) {
        tokens.push(remaining.slice(0, matchIdx));
      }
      const tokenStr = match[0];
      if (tokenStr.startsWith('[')) {
        const linkM = tokenStr.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkM) {
          tokens.push(
            <a 
              key={`link-${keyIdx++}`} 
              href={linkM[2]} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-700 hover:text-emerald-800 underline font-medium inline-flex items-center gap-1 transition"
            >
              <span>{linkM[1]}</span>
              <ExternalLink className="w-3.5 h-3.5 inline-block opacity-75 shrink-0" />
            </a>
          );
        }
      } else if (tokenStr.startsWith('**')) {
        const boldText = tokenStr.slice(2, -2);
        tokens.push(
          <strong key={`bold-${keyIdx++}`} className="font-semibold text-neutral-900">
            {boldText}
          </strong>
        );
      }
      remaining = remaining.slice(matchIdx + tokenStr.length);
    }
    return tokens;
  };

  return (
    <div className="space-y-5 text-neutral-700 text-sm sm:text-base leading-relaxed sm:leading-loose">
      {blocks.map((block, idx) => {
        // Image Gallery (1 or multiple consecutive images)
        if (block.type === 'gallery') {
          const imgCount = block.images.length;
          const gridCols = imgCount === 1 
            ? 'grid-cols-1' 
            : imgCount === 2 
              ? 'grid-cols-1 sm:grid-cols-2' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

          return (
            <div key={`gallery-${idx}`} className={`grid ${gridCols} gap-4 my-6`}>
              {block.images.map((imgItem, imgIdx) => (
                <div 
                  key={imgIdx} 
                  className="group relative rounded-2xl overflow-hidden border border-neutral-200/90 bg-neutral-100 shadow-xs hover:shadow-md transition duration-300"
                >
                  <div 
                    className={`cursor-pointer overflow-hidden ${imgCount === 1 ? 'max-h-[520px]' : 'aspect-4/3'}`}
                    onClick={() => setActiveZoomImg(imgItem)}
                  >
                    <img 
                      src={imgItem.url} 
                      alt={imgItem.alt || 'ภาพประกอบข่าว'} 
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-neutral-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="p-2.5 rounded-full bg-white/90 text-neutral-800 shadow-md transform translate-y-2 group-hover:translate-y-0 transition">
                        <ZoomIn className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                  {imgItem.alt && (
                    <div className="p-3 text-xs text-neutral-600 bg-white/95 border-t border-neutral-100 font-medium">
                      {imgItem.alt}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        }

        // Headings
        if (block.type === 'h1' || block.type === 'h2' || block.type === 'h3') {
          return (
            <h4 key={idx} className="text-lg sm:text-xl font-bold text-neutral-950 pt-3 pb-1 border-b border-neutral-100 flex items-center gap-2.5">
              <span className="w-1.5 h-5 bg-emerald-600 rounded-full inline-block shrink-0" />
              <span>{renderInline(block.text)}</span>
            </h4>
          );
        }

        // Bullet items
        if (block.type === 'bullet') {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-2 sm:ml-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2.5 shrink-0" />
              <div className="text-neutral-800">{renderInline(block.text)}</div>
            </div>
          );
        }

        // Numbered items
        if (block.type === 'numbered') {
          return (
            <div key={idx} className="flex items-start gap-2.5 ml-2 sm:ml-4">
              <span className="font-semibold text-emerald-700 min-w-5">{block.num}.</span>
              <div className="text-neutral-800">{renderInline(block.text)}</div>
            </div>
          );
        }

        // Horizontal Rule
        if (block.type === 'hr') {
          return <hr key={idx} className="border-t border-neutral-200/80 my-6" />;
        }

        // Regular Paragraph
        return (
          <p key={idx} className="whitespace-pre-line text-neutral-800 leading-relaxed sm:leading-loose">
            {renderInline(block.text)}
          </p>
        );
      })}

      {/* Lightbox / Zoom Modal */}
      {activeZoomImg && (
        <div 
          className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveZoomImg(null)}
        >
          <div className="relative max-w-5xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
            <button 
              onClick={() => setActiveZoomImg(null)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={activeZoomImg.url} 
              alt={activeZoomImg.alt} 
              className="w-full h-auto max-h-[85vh] object-contain mx-auto"
            />
            {activeZoomImg.alt && (
              <div className="p-3 text-center text-sm font-medium text-neutral-700 bg-neutral-50 border-t border-neutral-200">
                {activeZoomImg.alt}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
