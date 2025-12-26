
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Video, UserInteractions } from './types.ts';
import { LOGO_URL, getDeterministicStats, formatBigNumber } from './utils.ts';

const VideoCardThumbnail: React.FC<{ 
  video: Video, 
  isOverlayActive: boolean, 
  progress?: number, 
  showNewBadge?: boolean,
  onCategorySelect?: (cat: string) => void,
  onLike?: (id: string) => void,
  isLiked?: boolean
}> = ({ video, isOverlayActive, progress, showNewBadge, onCategorySelect, onLike, isLiked }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const stats = useMemo(() => getDeterministicStats(video.video_url), [video.video_url]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isOverlayActive) {
      v.pause();
      if (observerRef.current) observerRef.current.disconnect();
      return;
    }
    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) v.play().catch(() => {}); else v.pause();
    }, { threshold: 0.1 });
    observerRef.current.observe(v);
    return () => observerRef.current?.disconnect();
  }, [video.video_url, isOverlayActive]);

  return (
    <div className="w-full h-full relative bg-neutral-950 overflow-hidden group rounded-2xl shadow-2xl border border-white/5 pointer-events-auto transition-all duration-500 hover:border-red-600/30">
      <video 
        ref={videoRef}
        src={video.video_url} 
        poster={video.poster_url}
        muted loop playsInline 
        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-700 pointer-events-none"
      />
      
      <div className="absolute top-2 left-2 z-30 flex flex-col gap-2">
        {showNewBadge && (
          <div className="backdrop-blur-xl bg-blue-600/30 border border-blue-400 px-3 py-0.5 rounded-lg shadow-[0_0_15px_#3b82f6] animate-pulse">
            <span className="text-[8px] font-black text-blue-400 italic tracking-widest uppercase">جديد</span>
          </div>
        )}
      </div>

      <div className="absolute top-2 right-2 z-30">
        <button 
          onClick={(e) => { e.stopPropagation(); onLike?.(video.id); }}
          className={`p-2 rounded-xl backdrop-blur-md border transition-all active:scale-75 ${isLiked ? 'bg-red-600/80 border-red-400 text-white shadow-[0_0_15px_red]' : 'bg-black/40 border-white/10 text-white/70 hover:text-white'}`}
        >
          <svg className="w-4 h-4" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent p-3 z-20 flex flex-col gap-1 pointer-events-none">
        <div className="flex justify-start">
          <button 
            onClick={(e) => { e.stopPropagation(); onCategorySelect?.(video.category); }}
            className="border border-red-600/50 bg-red-600/20 px-2 py-0.5 rounded-md backdrop-blur-md shadow-[0_0_10px_rgba(220,38,38,0.2)] pointer-events-auto active:scale-95 transition-transform"
          >
            <span className="text-[7px] font-black text-red-400 uppercase tracking-tighter">
              {video.category}
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-white text-[9px] font-black line-clamp-1 italic text-right drop-shadow-lg leading-tight flex-1">
            {video.title}
          </p>
          
          <div className="flex items-center gap-1.5 shrink-0 bg-black/60 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
             <div className="flex items-center gap-0.5">
                <svg className="w-2.5 h-2.5 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span className="text-[7px] font-black text-white/90">{formatBigNumber(stats.likes)}</span>
             </div>
             <div className="flex items-center gap-0.5 border-l border-white/20 pl-1.5 ml-0.5">
                <svg className="w-2.5 h-2.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                <span className="text-[7px] font-black text-white/90">{formatBigNumber(stats.views)}</span>
             </div>
          </div>
        </div>
      </div>

      {progress !== undefined && progress > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-30">
          <div className="h-full bg-red-600 shadow-[0_0_8px_red] transition-all duration-500" style={{ width: `${progress * 100}%` }}></div>
        </div>
      )}
    </div>
  );
};

const SmartMarquee: React.FC<{ 
  items: Video[], 
  onPlay: (v: Video) => void, 
  isOverlayActive: boolean,
  isShort?: boolean,
  direction?: 'ltr' | 'rtl',
  onCategorySelect?: (cat: string) => void,
  onLike?: (id: string) => void,
  likedIds?: string[]
}> = ({ items, onPlay, isOverlayActive, isShort = true, direction = 'rtl', onCategorySelect, onLike, likedIds = [] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const resumeTimerRef = useRef<number | null>(null);
  
  const tripledItems = useMemo(() => [...items, ...items, ...items], [items]);

  useEffect(() => {
    if (!scrollRef.current || isOverlayActive || isPaused || isInteracting || items.length === 0) return;

    const scroll = () => {
      if (scrollRef.current) {
        const step = direction === 'rtl' ? 1 : -1;
        scrollRef.current.scrollLeft += step;
        
        const scrollWidth = scrollRef.current.scrollWidth / 3;
        if (Math.abs(scrollRef.current.scrollLeft) >= scrollWidth * 2 || scrollRef.current.scrollLeft >= 0) {
           scrollRef.current.scrollLeft = -scrollWidth;
        }
      }
    };

    const timer = setInterval(scroll, 30);
    return () => clearInterval(timer);
  }, [isOverlayActive, isPaused, isInteracting, items, direction]);

  const handleInteractionStart = () => {
    setIsInteracting(true);
    setIsPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
    }, 3000); 
  };

  if (items.length === 0) return null;

  return (
    <div 
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto scrollbar-hide px-2 py-2 cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      style={{ direction: 'rtl' }}
    >
      {tripledItems.map((v, i) => (
        <div key={`${v.id}-${i}`} onClick={() => onPlay(v)} className={`${isShort ? 'w-32 aspect-[9/16]' : 'w-52 aspect-video'} shrink-0 active:scale-95 transition-transform`}>
          <VideoCardThumbnail 
            video={v} 
            isOverlayActive={isOverlayActive} 
            onCategorySelect={onCategorySelect} 
            onLike={onLike}
            isLiked={likedIds.includes(v.id)}
          />
        </div>
      ))}
    </div>
  );
};

const UnwatchedMarquee: React.FC<{ 
  items: { video: Video, progress: number }[], 
  onPlayShort: (v: Video, list: Video[]) => void, 
  onPlayLong: (v: Video) => void,
  isOverlayActive: boolean,
  onCategorySelect?: (cat: string) => void,
  onLike?: (id: string) => void,
  likedIds?: string[]
}> = ({ items, onPlayShort, onPlayLong, isOverlayActive, onCategorySelect, onLike, likedIds = [] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const resumeTimerRef = useRef<number | null>(null);

  const tripledItems = useMemo(() => [...items, ...items, ...items], [items]);

  useEffect(() => {
    if (!scrollRef.current || isOverlayActive || isPaused || isInteracting || items.length === 0) return;

    const scroll = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollLeft += 1; 
        const scrollWidth = scrollRef.current.scrollWidth / 3;
        if (Math.abs(scrollRef.current.scrollLeft) >= scrollWidth * 2) {
          scrollRef.current.scrollLeft = -scrollWidth;
        }
      }
    };

    const timer = setInterval(scroll, 30);
    return () => clearInterval(timer);
  }, [isOverlayActive, isPaused, isInteracting, items]);

  const handleInteractionStart = () => {
    setIsInteracting(true);
    setIsPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
    resumeTimerRef.current = window.setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  if (items.length === 0) return null;

  return (
    <div 
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto scrollbar-hide px-2 py-2 cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      style={{ direction: 'rtl' }}
    >
      {tripledItems.map((item, i) => (
        <div 
          key={`${item.video.id}-${i}`} 
          onClick={() => item.video.type === 'short' ? onPlayShort(item.video, items.map(it => it.video)) : onPlayLong(item.video)} 
          className={`${item.video.type === 'short' ? 'w-32 aspect-[9/16]' : 'w-52 aspect-video'} shrink-0 active:scale-95 transition-transform`}
        >
          <VideoCardThumbnail 
            video={item.video} 
            isOverlayActive={isOverlayActive} 
            progress={item.progress} 
            onCategorySelect={onCategorySelect} 
            onLike={onLike}
            isLiked={likedIds.includes(item.video.id)}
          />
        </div>
      ))}
    </div>
  );
};

interface MainContentProps {
  videos: Video[];
  categoriesList: string[];
  interactions: UserInteractions;
  onPlayShort: (v: Video, list: Video[]) => void;
  onPlayLong: (v: Video, list: Video[]) => void;
  onHardRefresh: () => void;
  loading: boolean;
  isTitleYellow: boolean;
  onShowToast?: (msg: string) => void;
  onSearchToggle?: () => void;
  isOverlayActive: boolean;
  onCategorySelect?: (category: string) => void;
  onLike?: (id: string) => void;
}

const LionIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5.5c-3.5 0-6.5 2-8 5.5 1.5 3.5 4.5 5.5 8 5.5s6.5-2 8-5.5c-1.5-3.5-4.5-5.5-8-5.5z"/>
    <circle cx="12" cy="11" r="2.5"/>
    <path d="M7 3c.5 1.5.5 3.5 0 5M17 3c-.5 1.5-.5 3.5 0 5M4 11h1M19 11h1M12 16v3m-3-1.5h6"/>
    <path d="M9 21h6l.5-1.5L12 18l-3.5 1.5L9 21z"/>
    <path d="M12 2v2M5 5l2 2M19 5l-2 2"/>
  </svg>
);

const MainContent: React.FC<MainContentProps> = ({ 
  videos, categoriesList, interactions, onPlayShort, onPlayLong, onHardRefresh, loading, isTitleYellow, onSearchToggle, isOverlayActive, onCategorySelect, onLike
}) => {
  const [startY, setStartY] = useState(0);
  const [pullOffset, setPullOffset] = useState(0);
  const [cacheStatus, setCacheStatus] = useState<'idle' | 'downloading' | 'finished'>('idle');
  const hasStartedAutoCache = useRef(false);

  const filteredVideos = useMemo(() => {
    const excludedIds = interactions.dislikedIds;
    return videos.filter(v => !excludedIds.includes(v.id || v.video_url));
  }, [videos, interactions.dislikedIds]);

  const handleCacheAll = async () => {
    if (filteredVideos.length === 0) return;
    setCacheStatus('downloading');
    try {
      const cache = await caches.open('hadiqa-video-cache-v1');
      for (const v of filteredVideos) {
        try {
          const match = await cache.match(v.video_url);
          if (!match) {
            const response = await fetch(v.video_url);
            if (response.ok) await cache.put(v.video_url, response);
          }
        } catch (e) { console.error("Cache fail:", v.video_url); }
      }
      setCacheStatus('finished');
    } catch (e) {
      console.error("Cache Error:", e);
      setCacheStatus('idle');
    }
  };

  useEffect(() => {
    if (!loading && filteredVideos.length > 0 && !hasStartedAutoCache.current) {
      hasStartedAutoCache.current = true;
      handleCacheAll();
    }
  }, [loading, filteredVideos]);

  const unwatchedData = useMemo(() => {
    const seen = new Set();
    const result: { video: Video, progress: number }[] = [];
    const history = [...interactions.watchHistory].reverse();
    for (const h of history) {
      if (h.progress > 0.05 && h.progress < 0.95) {
        const video = videos.find(v => v.id === h.id || v.video_url === h.id);
        if (video && !seen.has(video.id)) {
          seen.add(video.id);
          result.push({ video, progress: h.progress });
        }
      }
    }
    return result;
  }, [interactions.watchHistory, videos]);

  const sectionsData = useMemo(() => {
    let availShorts = [...filteredVideos.filter(v => v.type === 'short')];
    let availLongs = [...filteredVideos.filter(v => v.type === 'long')];

    const takeShorts = (n: number) => {
      const chunk = availShorts.slice(0, n);
      availShorts = availShorts.slice(n);
      return chunk;
    };
    const takeLongs = (n: number) => {
      const chunk = availLongs.slice(0, n);
      availLongs = availLongs.slice(n);
      return chunk;
    };

    return {
      s1: takeShorts(4),
      s2: takeShorts(4),
      sHappy: takeShorts(10),
      sNew: takeShorts(10),
      sScreams: takeShorts(4),
      sLabyrinth: takeShorts(10),
      sEnd: takeShorts(10),
      sCursed: takeShorts(4),
      sNoReturn: takeShorts(10),
      sBehind: takeShorts(10),
      sHell: takeShorts(4),
      l1: takeLongs(3),
      lInsight: takeLongs(10),
      lArchive: takeLongs(3),
      lVisions: takeLongs(10),
      lLegends: takeLongs(3)
    };
  }, [filteredVideos]);

  const { 
    s1, s2, sHappy, sNew, sScreams, sLabyrinth, sEnd, sCursed, sNoReturn, sBehind, sHell,
    l1, lInsight, lArchive, lVisions, lLegends 
  } = sectionsData;

  const allShorts = useMemo(() => filteredVideos.filter(v => v.type === 'short'), [filteredVideos]);
  const allLongs = useMemo(() => filteredVideos.filter(v => v.type === 'long'), [filteredVideos]);

  const lionBtnClass = useMemo(() => {
    if (cacheStatus === 'downloading') return 'text-green-400 border-green-500 bg-green-500/10 shadow-[0_0_20px_#22c55e] animate-pulse';
    if (cacheStatus === 'finished') return 'text-yellow-400 border-yellow-400 bg-yellow-400/10 shadow-[0_0_20px_#facc15]';
    return 'text-red-600 border-red-600 bg-red-600/5 shadow-[0_0_10px_rgba(220,38,38,0.2)]';
  }, [cacheStatus]);

  return (
    <div 
      onTouchStart={(e) => window.scrollY === 0 && setStartY(e.touches[0].pageY)}
      onTouchMove={(e) => startY !== 0 && (e.touches[0].pageY - startY) > 0 && (e.touches[0].pageY - startY) < 120 && setPullOffset(e.touches[0].pageY - startY)}
      onTouchEnd={() => { pullOffset > 70 && onHardRefresh(); setPullOffset(0); setStartY(0); }}
      className="flex flex-col pb-40 pt-0 px-4 w-full bg-black min-h-screen relative transition-all duration-300"
      style={{ transform: `translateY(${pullOffset / 2}px)` }}
      dir="rtl"
    >
      <section className="flex items-center justify-between py-1 border-b border-white/5 bg-black sticky top-0 z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onHardRefresh}>
          <img src={LOGO_URL} className="w-10 h-10 rounded-full border border-red-600 shadow-[0_0_10px_red]" alt="Logo" />
          <div className="flex flex-col text-right">
            <h1 className={`text-base font-black italic transition-all duration-500 ${isTitleYellow ? 'text-yellow-400 drop-shadow-[0_0_20px_#facc15]' : 'text-red-600 drop-shadow-[0_0_10px_red]'}`}>
              الحديقة المرعبة
            </h1>
            <p className="text-[5px] text-blue-400 font-black tracking-widest uppercase -mt-0.5 opacity-60">AI PERSONALIZED FEED</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={handleCacheAll}
             className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-500 active:scale-95 ${lionBtnClass}`}
             title="تحميل الكل للمشاهدة بدون إنترنت"
           >
             <LionIcon />
           </button>
           <button onClick={onSearchToggle} className="w-10 h-10 rounded-xl bg-blue-500/5 border border-blue-500/30 flex items-center justify-center text-blue-500 transition-all active:scale-95">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
           </button>
        </div>
      </section>

      {/* مؤشر التحديث تحت اللوجو المركزي - داخل إطار ومرتفع قليلاً */}
      {loading && (
        <div className="fixed top-[65px] left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
           <div className="bg-black/90 border border-yellow-500/50 px-4 py-1 rounded-lg backdrop-blur-md shadow-[0_0_15px_rgba(250,204,21,0.3)]">
             <span className="text-yellow-400 font-black text-[9px] animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] tracking-widest">تحديث...</span>
           </div>
        </div>
      )}

      {s1.length > 0 && (
        <section className="mt-2">
          {/* تم حذف عنوان القسم مختارات سريعة ورفع الشبكة للأعلى */}
          <div className="grid grid-cols-2 gap-3">
            {s1.map(v => (
              <div key={v.id} onClick={() => onPlayShort(v, allShorts)} className="aspect-[9/16] cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail video={v} isOverlayActive={isOverlayActive} showNewBadge={true} onCategorySelect={onCategorySelect} onLike={onLike} isLiked={interactions.likedIds.includes(v.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {unwatchedData.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce shadow-[0_0_10px_yellow]"></span>
            <h2 className="text-xs font-black text-yellow-500 uppercase tracking-[0.2em] italic">نواصل الحكاية</h2>
          </div>
          <UnwatchedMarquee items={unwatchedData} onPlayShort={onPlayShort} onPlayLong={(v) => onPlayLong(v, allLongs)} isOverlayActive={isOverlayActive} onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>
      )}

      {l1.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-purple-600 rounded-full shadow-[0_0_10px_purple]"></span>
            <h2 className="text-xs font-black text-purple-600 uppercase tracking-[0.2em] italic">كوابيس مطولة</h2>
          </div>
          <div className="flex flex-col gap-4">
            {l1.map((video) => (
              <div key={video.id} onClick={() => onPlayLong(video, allLongs)} className="aspect-video cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail video={video} isOverlayActive={isOverlayActive} onCategorySelect={onCategorySelect} onLike={onLike} isLiked={interactions.likedIds.includes(video.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {s2.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]"></span>
            <h2 className="text-xs font-black text-red-600 uppercase tracking-[0.2em] italic">جرعة رعب مكثفة</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {s2.map(v => (
              <div key={v.id} onClick={() => onPlayShort(v, allShorts)} className="aspect-[9/16] cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail video={v} isOverlayActive={isOverlayActive} onCategorySelect={onCategorySelect} onLike={onLike} isLiked={interactions.likedIds.includes(v.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {sHappy.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_10px_cyan] animate-pulse"></span>
            <h2 className="text-xs font-black text-cyan-500 uppercase tracking-[0.2em] italic">رحلة سعيدة</h2>
          </div>
          <SmartMarquee items={sHappy} onPlay={(v) => onPlayShort(v, allShorts)} isOverlayActive={isOverlayActive} isShort={true} direction="ltr" onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>
      )}

      {lInsight.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_green] animate-pulse"></span>
            <h2 className="text-xs font-black text-green-500 uppercase tracking-[0.2em] italic">نبذة</h2>
          </div>
          <SmartMarquee items={lInsight} onPlay={(v) => onPlayLong(v, allLongs)} isOverlayActive={isOverlayActive} isShort={false} direction="ltr" onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>
      )}

      {sNew.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-orange-600 rounded-full shadow-[0_0_10px_orange] animate-bounce"></span>
            <h2 className="text-xs font-black text-orange-600 uppercase tracking-[0.2em] italic">رحلة جديدة</h2>
          </div>
          <SmartMarquee items={sNew} onPlay={(v) => onPlayShort(v, allShorts)} isOverlayActive={isOverlayActive} isShort={true} direction="ltr" onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>
      )}

      {lArchive.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-gray-500 rounded-full shadow-[0_0_10px_gray]"></span>
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] italic">أرشيف الرعب</h2>
          </div>
          <div className="flex flex-col gap-4">
            {lArchive.map((video) => (
              <div key={video.id} onClick={() => onPlayLong(video, allLongs)} className="aspect-video cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail video={video} isOverlayActive={isOverlayActive} onCategorySelect={onCategorySelect} onLike={onLike} isLiked={interactions.likedIds.includes(video.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {sScreams.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-white/20 rounded-full animate-ping"></span>
            <h2 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] italic">صدى الأرواح</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sScreams.map(v => (
              <div key={v.id} onClick={() => onPlayShort(v, allShorts)} className="aspect-[9/16] cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail video={v} isOverlayActive={isOverlayActive} onCategorySelect={onCategorySelect} onLike={onLike} isLiked={interactions.likedIds.includes(v.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {sLabyrinth.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-indigo-600 rounded-full shadow-[0_0_10px_indigo]"></span>
            <h2 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] italic">همسات الليل</h2>
          </div>
          <SmartMarquee items={sLabyrinth} onPlay={(v) => onPlayShort(v, allShorts)} isOverlayActive={isOverlayActive} isShort={true} direction="rtl" onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>
      )}

      {lVisions.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-pink-600 rounded-full shadow-[0_0_10px_pink] animate-pulse"></span>
            <h2 className="text-xs font-black text-pink-600 uppercase tracking-[0.2em] italic">ما وراء الطبيعة</h2>
          </div>
          <SmartMarquee items={lVisions} onPlay={(v) => onPlayLong(v, allLongs)} isOverlayActive={isOverlayActive} isShort={false} direction="ltr" onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>
      )}

      {sEnd.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-red-800 rounded-full shadow-[0_0_10px_red] animate-bounce"></span>
            <h2 className="text-xs font-black text-red-800 uppercase tracking-[0.2em] italic">نهاية الدهليز</h2>
          </div>
          <SmartMarquee items={sEnd} onPlay={(v) => onPlayShort(v, allShorts)} isOverlayActive={isOverlayActive} isShort={true} direction="ltr" onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>
      )}

      {sCursed.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-orange-700 rounded-full animate-pulse"></span>
            <h2 className="text-xs font-black text-orange-700 uppercase tracking-[0.2em] italic">المدخل الملعون</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sCursed.map(v => (
              <div key={v.id} onClick={() => onPlayShort(v, allShorts)} className="aspect-[9/16] cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail video={v} isOverlayActive={isOverlayActive} onCategorySelect={onCategorySelect} onLike={onLike} isLiked={interactions.likedIds.includes(v.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {sNoReturn.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-emerald-600 rounded-full shadow-[0_0_10px_emerald]"></span>
            <h2 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] italic">طريق اللا عودة</h2>
          </div>
          <SmartMarquee items={sNoReturn} onPlay={(v) => onPlayShort(v, allShorts)} isOverlayActive={isOverlayActive} isShort={true} direction="ltr" onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>
      )}

      {lLegends.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-blue-900 rounded-full"></span>
            <h2 className="text-xs font-black text-blue-900 uppercase tracking-[0.2em] italic">أساطير سوداء</h2>
          </div>
          <div className="flex flex-col gap-4">
            {lLegends.map((video) => (
              <div key={video.id} onClick={() => onPlayLong(video, allLongs)} className="aspect-video cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail video={video} isOverlayActive={isOverlayActive} onCategorySelect={onCategorySelect} onLike={onLike} isLiked={interactions.likedIds.includes(video.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {sBehind.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-yellow-900 rounded-full animate-ping"></span>
            <h2 className="text-xs font-black text-yellow-900 uppercase tracking-[0.2em] italic">خلف الأبواب</h2>
          </div>
          <SmartMarquee items={sBehind} onPlay={(v) => onPlayShort(v, allShorts)} isOverlayActive={isOverlayActive} isShort={true} direction="rtl" onCategorySelect={onCategorySelect} onLike={onLike} likedIds={interactions.likedIds} />
        </section>
      )}

      {sHell.length > 0 && (
        <section className="mt-8 mb-24">
          <div className="flex items-center gap-2 mb-3 px-2">
            <span className="w-2 h-2 bg-red-950 rounded-full shadow-[0_0_15px_red]"></span>
            <h2 className="text-xs font-black text-red-950 uppercase tracking-[0.2em] italic">أعماق الجحيم</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {sHell.map(v => (
              <div key={v.id} onClick={() => onPlayShort(v, allShorts)} className="aspect-[9/16] cursor-pointer active:scale-95 transition-transform">
                <VideoCardThumbnail video={v} isOverlayActive={isOverlayActive} onCategorySelect={onCategorySelect} onLike={onLike} isLiked={interactions.likedIds.includes(v.id)} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default MainContent;
