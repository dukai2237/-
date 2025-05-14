'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { getMangaById } from '@/lib/mock-data';
import Link from 'next/link';

export default function ChapterReaderPage({ params }: { params: Promise<{ mangaId: string, chapterId: string }> }) {
  const { mangaId, chapterId } = use(params);
  const manga = getMangaById(mangaId);
  if (!manga) return <div>404 Not Found</div>;
  const chapter = manga.chapters.find(c => c.id === chapterId);
  if (!chapter) return <div>Chapter Not Found</div>;
  const pages = chapter.pages || [];
  const [pageIdx, setPageIdx] = useState(0);
  const [imgLoading, setImgLoading] = useState(true);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setPageIdx(idx => Math.min(idx + 1, pages.length - 1));
      if (e.key === 'ArrowLeft') setPageIdx(idx => Math.max(idx - 1, 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pages.length]);

  const goPrev = useCallback(() => setPageIdx(idx => Math.max(idx - 1, 0)), []);
  const goNext = useCallback(() => setPageIdx(idx => Math.min(idx + 1, pages.length - 1)), [pages.length]);
  const jumpTo = (idx: number) => setPageIdx(Math.max(0, Math.min(idx, pages.length - 1)));

  // Chapter navigation
  const chapterIdx = manga.chapters.findIndex(c => c.id === chapter.id);
  const prevChapter = manga.chapters[chapterIdx - 1];
  const nextChapter = manga.chapters[chapterIdx + 1];

  // Responsive style
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(120deg,#23243a 0%,#18181a 100%)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 0 }}>
      {/* Top navigation bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 20, background: 'rgba(24,24,26,0.98)',
        borderBottom: '1px solid #222', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 8px' : '0 32px',
      }}>
        <Link href={`/manga/${manga.id}`} style={{ color: '#fff', textDecoration: 'none', fontSize: 18 }}>&larr; Back to Manga Detail</Link>
        <div style={{ fontWeight: 600, fontSize: 20 }}>{manga.title} - {chapter.title}</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {prevChapter && <Link href={`/manga/${manga.id}/chapter/${prevChapter.id}`} style={{ color: '#fff', fontSize: 16 }}>&larr; Previous Chapter</Link>}
          {nextChapter && <Link href={`/manga/${manga.id}/chapter/${nextChapter.id}`} style={{ color: '#fff', fontSize: 16 }}>Next Chapter &rarr;</Link>}
        </div>
      </div>
      {/* Top card-style manga info */}
      <div style={{
        width: '100%',
        maxWidth: 900,
        margin: isMobile ? '64px 0 16px 0' : '72px 0 24px 0',
        padding: isMobile ? 8 : 32,
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 4px 32px #0002',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? 16 : 32,
        minHeight: 220,
      }}>
        {/* Cover */}
        <img src={manga.coverImage || '/default-cover.png'} alt={manga.title} style={{ width: isMobile ? 120 : 180, height: isMobile ? 170 : 260, objectFit: 'cover', borderRadius: 12, boxShadow: '0 2px 12px #0003', background: '#eee', flexShrink: 0 }} />
        {/* Right-side info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: isMobile ? 22 : 32, fontWeight: 800, color: '#23243a', lineHeight: 1.2 }}>{manga.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 2 }}>
            <span style={{ fontSize: 16, color: '#666', fontWeight: 500 }}>Author:</span>
            <span style={{ fontSize: 16, color: '#23243a', fontWeight: 600 }}>{manga.author.name}</span>
            {manga.author.contactDetails?.email && <span style={{ color: '#888', fontSize: 14, marginLeft: 8 }}>{manga.author.contactDetails.email}</span>}
          </div>
          {/* Summary */}
          <div style={{ fontSize: 15, color: '#444', margin: '6px 0 2px 0', lineHeight: 1.7, maxHeight: 80, overflow: 'auto' }}>{manga.summary}</div>
          {/* Tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '4px 0' }}>
            {manga.genres?.map((g, i) => <span key={g} style={{ background: '#f3f4f6', color: '#6b7280', fontSize: 13, borderRadius: 6, padding: '2px 10px', fontWeight: 500 }}>{g}</span>)}
          </div>
          {/* Financial/Subscription info (if any) */}
          <div style={{ display: 'flex', gap: 24, margin: '8px 0 0 0', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#888', fontSize: 14 }}>Subscription Revenue: <b style={{ color: '#23243a' }}>{manga.totalRevenueFromSubscriptions?.toFixed(2) || 0} USD</b></span>
            <span style={{ color: '#888', fontSize: 14 }}>Donation Revenue: <b style={{ color: '#23243a' }}>{manga.totalRevenueFromDonations?.toFixed(2) || 0} USD</b></span>
            <span style={{ color: '#888', fontSize: 14 }}>Views: <b style={{ color: '#23243a' }}>{manga.viewCount}</b></span>
          </div>
          {/* Subscription button/Back to catalog */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {manga.subscriptionModel !== 'none' && (
              <button style={{ background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 16, border: 'none', borderRadius: 8, padding: '10px 28px', boxShadow: '0 1px 8px #2563eb22', cursor: 'pointer', transition: 'background 0.2s' }}>
                Subscribe {manga.subscriptionModel === 'monthly' && `(${manga.subscriptionPrice?.toFixed(2) || 0} USD/month)`}
                {manga.subscriptionModel === 'per_chapter' && `(Per Chapter)`}
              </button>
            )}
            <Link href={`/manga/${manga.id}`} style={{ color: '#2563eb', background: '#f3f4f6', borderRadius: 8, padding: '10px 24px', fontSize: 16, textDecoration: 'none', fontWeight: 600, boxShadow: '0 1px 4px #0001', border: '1px solid #e5e7eb', transition: 'background 0.2s' }}>Back to Catalog</Link>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 8 }}>
        <div style={{ position: 'relative', background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px #0007', margin: isMobile ? '16px 0' : '32px 0', maxWidth: 900, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 480, overflow: 'hidden' }}>
          {/* Left and right large buttons */}
          {pageIdx > 0 && (
            <button onClick={goPrev} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(90deg,rgba(30,30,30,0.18),rgba(0,0,0,0))', border: 'none', color: '#222', fontSize: 36, cursor: 'pointer', zIndex: 2, borderRadius: '16px 0 0 16px', opacity: 0.7, transition: 'opacity 0.2s', outline: 'none' }} aria-label="Previous Page" onMouseOver={e => (e.currentTarget.style.opacity = '1')} onMouseOut={e => (e.currentTarget.style.opacity = '0.7')}>&#8592;</button>
          )}
          {/* Image loading animation and gradient mask */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400, position: 'relative', background: '#222' }}>
            {pages.length > 0 ? (
              <>
                <img
                  src={pages[pageIdx].imageUrl}
                  alt={`${chapter.title} Page ${pageIdx + 1}`}
                  style={{ width: '100%', maxWidth: 900, borderRadius: 0, background: '#222', objectFit: 'contain', margin: 0, userSelect: 'none', boxShadow: '0 2px 16px #0004', opacity: imgLoading ? 0.2 : 1, transition: 'opacity 0.4s' }}
                  draggable={false}
                  onLoad={() => setImgLoading(false)}
                  onError={() => setImgLoading(false)}
                />
                {imgLoading && <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,34,34,0.2)' }}><span className="loader" style={{ width: 40, height: 40, border: '4px solid #eee', borderTop: '4px solid #888', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} /></div>}
                {/* Bottom gradient mask */}
                <div style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 60, background: 'linear-gradient(0deg,rgba(24,24,26,0.7),rgba(24,24,26,0))', pointerEvents: 'none' }} />
              </>
            ) : (
              <p style={{ color: '#222', padding: 32 }}>No manga content available</p>
            )}
          </div>
          {pageIdx < pages.length - 1 && (
            <button onClick={goNext} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, background: 'linear-gradient(270deg,rgba(30,30,30,0.18),rgba(0,0,0,0))', border: 'none', color: '#222', fontSize: 36, cursor: 'pointer', zIndex: 2, borderRadius: '0 16px 16px 0', opacity: 0.7, transition: 'opacity 0.2s', outline: 'none' }} aria-label="Next Page" onMouseOver={e => (e.currentTarget.style.opacity = '1')} onMouseOut={e => (e.currentTarget.style.opacity = '0.7')}>&#8594;</button>
          )}
        </div>
        {/* Page number and navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, marginTop: 4 }}>
          <button onClick={goPrev} disabled={pageIdx === 0} style={{ padding: '8px 20px', fontSize: 18, borderRadius: 8, border: 'none', background: pageIdx === 0 ? '#444' : '#23243a', color: '#fff', cursor: pageIdx === 0 ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px #0002', transition: 'background 0.2s' }}>&larr; Previous Page</button>
          <span style={{ fontSize: 16, color: '#bbb', minWidth: 60, textAlign: 'center' }}>{pageIdx + 1} / {pages.length}</span>
          <button onClick={goNext} disabled={pageIdx === pages.length - 1} style={{ padding: '8px 20px', fontSize: 18, borderRadius: 8, border: 'none', background: pageIdx === pages.length - 1 ? '#444' : '#23243a', color: '#fff', cursor: pageIdx === pages.length - 1 ? 'not-allowed' : 'pointer', boxShadow: '0 1px 4px #0002', transition: 'background 0.2s' }}>Next Page &rarr;</button>
          <input
            type="number"
            min={1}
            max={pages.length}
            value={pageIdx + 1}
            onChange={e => jumpTo(Number(e.target.value) - 1)}
            style={{ width: 60, fontSize: 16, borderRadius: 6, border: '1px solid #888', padding: '4px 8px', marginLeft: 8, background: '#23243a', color: '#fff', outline: 'none', textAlign: 'center' }}
          />
          <span style={{ color: '#bbb' }}>Jump</span>
        </div>
        {/* Bottom action area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 900, padding: isMobile ? '0 8px' : '0 32px', marginBottom: 24 }}>
          <Link href={`/manga/${manga.id}`} style={{ color: '#fff', background: '#23243a', borderRadius: 8, padding: '8px 20px', fontSize: 16, textDecoration: 'none', boxShadow: '0 1px 4px #0002', transition: 'background 0.2s' }}>Back to Catalog</Link>
          <a href="#comments" style={{ color: '#fff', background: '#23243a', borderRadius: 8, padding: '8px 20px', fontSize: 16, textDecoration: 'none', boxShadow: '0 1px 4px #0002', transition: 'background 0.2s' }}>Comments</a>
        </div>
      </div>
      {/* Simple loader animation keyframes */}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
        @media (max-width: 600px) {
          .reader-mobile { padding: 0 4px !important; }
        }
      `}</style>
    </div>
  );
}