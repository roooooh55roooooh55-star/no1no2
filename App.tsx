
import React, { useState, useEffect, useMemo, Suspense, lazy, useCallback } from 'react';
import { Video, AppView, UserInteractions } from './types.ts';
import { fetchCloudinaryVideos, cacheTrendingVideos, forcePreloadUnseenVideos } from './cloudinaryClient.ts';
import { getRecommendedFeed } from './geminiService.ts';
import AppBar from './AppBar.tsx';
import MainContent from './MainContent.tsx';
import SavedPage from './SavedPage.tsx';

const ShortsPlayerOverlay = lazy(() => import('./ShortsPlayerOverlay.tsx'));
const LongPlayerOverlay = lazy(() => import('./LongPlayerOverlay.tsx'));
const AdminDashboard = lazy(() => import('./AdminDashboard.tsx'));
const AIOracle = lazy(() => import('./AIOracle.tsx'));
const TrendPage = lazy(() => import('./TrendPage.tsx'));
const PrivacyPage = lazy(() => import('./PrivacyPage.tsx'));
const HiddenVideosPage = lazy(() => import('./HiddenVideosPage.tsx'));

const DEFAULT_CATEGORIES = [
  'رعب حقيقي ✴️', 
  'رعب الحيوانات 🔱', 
  'هجمات مرعبة ✴️', 
  'أخطر المشاهد 🔱', 
  'رعب الحديقة ⚠️', 
  'رعب كوميدي 😂 ⚠️', 
  'لحظات مرعبة'
];

const VideoPreloader: React.FC<{ videos: Video[] }> = ({ videos }) => {
  return (
    <div className="absolute opacity-0 pointer-events-none w-px h-px overflow-hidden">
      {videos.slice(0, 3).map(v => (
        <video key={v.id} src={v.video_url} muted preload="auto" />
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.HOME);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [rawVideos, setRawVideos] = useState<Video[]>([]); 
  const [loading, setLoading] = useState(true);
  const [selectedShort, setSelectedShort] = useState<{ video: Video, list: Video[] } | null>(null);
  const [selectedLong, setSelectedLong] = useState<{ video: Video, list: Video[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTitleYellow, setIsTitleYellow] = useState(false);

  const isOverlayActive = useMemo(() => !!selectedShort || !!selectedLong, [selectedShort, selectedLong]);

  const [interactions, setInteractions] = useState<UserInteractions>(() => {
    try {
      const saved = localStorage.getItem('al-hadiqa-interactions-v5');
      return saved ? JSON.parse(saved) : { likedIds: [], dislikedIds: [], savedIds: [], watchHistory: [] };
    } catch (e) {
      return { likedIds: [], dislikedIds: [], savedIds: [], watchHistory: [] };
    }
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async (isHardRefresh = false) => {
    if (isHardRefresh) setLoading(true);
    try {
      const data = await fetchCloudinaryVideos();
      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }
      
      setRawVideos(data);
      // تشغيل الكاش والمستودع الذكي فوراً
      cacheTrendingVideos(data);
      forcePreloadUnseenVideos(data);

      const recommendedOrder = await getRecommendedFeed(data, interactions).catch(() => []);
      const orderedVideos = recommendedOrder
        .map(id => data.find(v => v.id === id || v.public_id === id))
        .filter((v): v is Video => !!v);

      const remaining = data.filter(v => !recommendedOrder.includes(v.id));
      setRawVideos([...orderedVideos, ...remaining]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      if (isHardRefresh) {
        setIsTitleYellow(true);
        setTimeout(() => setIsTitleYellow(false), 2500);
      }
    }
  }, [interactions]);

  useEffect(() => { loadData(false); }, [loadData]);
  useEffect(() => { localStorage.setItem('al-hadiqa-interactions-v5', JSON.stringify(interactions)); }, [interactions]);

  const updateWatchHistory = (id: string, progress: number) => {
    setInteractions(prev => {
      const history = [...prev.watchHistory];
      const index = history.findIndex(h => h.id === id);
      if (index > -1) { if (progress > history[index].progress) history[index].progress = progress; }
      else { history.push({ id, progress }); }
      return { ...prev, watchHistory: history };
    });
  };

  const handleLikeToggle = (id: string) => {
    setInteractions(p => {
      if (p.likedIds.includes(id)) {
        return { ...p, likedIds: p.likedIds.filter(x => x !== id) };
      }
      return { ...p, likedIds: [...p.likedIds, id], dislikedIds: p.dislikedIds.filter(x => x !== id) };
    });
    if (!interactions.likedIds.includes(id)) {
      showToast("الأرواح تعتز بإعجابك! 💀");
    }
  };

  const handleDislike = (id: string) => {
    setInteractions(p => ({
      ...p,
      dislikedIds: Array.from(new Set([...p.dislikedIds, id])),
      likedIds: p.likedIds.filter(x => x !== id)
    }));
    showToast("تم نفي الفيديو إلى النسيان ⚰️");
    setSelectedShort(null);
    setSelectedLong(null);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentView(AppView.CATEGORY);
    setSelectedShort(null);
    setSelectedLong(null);
  };

  const handleSwitchLongVideo = (v: Video) => {
    setSelectedLong(prev => prev ? { ...prev, video: v } : null);
  };

  const handleNextVideoShorts = useCallback(() => {
    if (selectedShort) {
      const currentIndex = selectedShort.list.findIndex(v => v.id === selectedShort.video.id);
      if (currentIndex < selectedShort.list.length - 1) {
        setSelectedShort({
          video: selectedShort.list[currentIndex + 1],
          list: selectedShort.list
        });
      }
    }
  }, [selectedShort]);

  const renderContent = () => {
    const longsOnly = rawVideos.filter(v => v.type === 'long');

    switch(currentView) {
      case AppView.ADMIN:
        return <Suspense fallback={null}><AdminDashboard onClose={() => setCurrentView(AppView.HOME)} categories={DEFAULT_CATEGORIES} initialVideos={rawVideos} /></Suspense>;
      case AppView.TREND:
        return <Suspense fallback={null}><TrendPage onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:longsOnly})} excludedIds={interactions.dislikedIds} /></Suspense>;
      case AppView.LIKES:
        return <SavedPage savedIds={interactions.likedIds} allVideos={rawVideos} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:longsOnly})} title="الإعجابات" />;
      case AppView.SAVED:
        return <SavedPage savedIds={interactions.savedIds} allVideos={rawVideos} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:longsOnly})} title="المحفوظات" />;
      case AppView.HIDDEN:
        return <Suspense fallback={null}><HiddenVideosPage interactions={interactions} allVideos={rawVideos} onRestore={(id) => setInteractions(prev => ({...prev, dislikedIds: prev.dislikedIds.filter(x => x !== id)}))} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:longsOnly})} /></Suspense>;
      case AppView.PRIVACY:
        return <PrivacyPage onOpenAdmin={() => setCurrentView(AppView.ADMIN)} />;
      case AppView.CATEGORY:
        const categoryVideos = rawVideos.filter(v => v.category === selectedCategory);
        return <SavedPage savedIds={categoryVideos.map(v => v.id)} allVideos={rawVideos} onPlayShort={(v, l) => setSelectedShort({video:v, list:l})} onPlayLong={(v) => setSelectedLong({video:v, list:longsOnly})} title={selectedCategory || "القسم"} />;
      default:
        return (
          <MainContent 
            videos={rawVideos} 
            categoriesList={DEFAULT_CATEGORIES} 
            interactions={interactions}
            onPlayShort={(v, l) => setSelectedShort({video:v, list:l.filter(x => x.type === 'short')})}
            onPlayLong={(v, l) => setSelectedLong({video:v, list:l.filter(x => x.type === 'long')})}
            onHardRefresh={() => loadData(true)}
            loading={loading}
            isTitleYellow={isTitleYellow}
            onSearchToggle={() => setIsSearchOpen(true)}
            isOverlayActive={isOverlayActive}
            onCategorySelect={handleCategorySelect}
            onLike={handleLikeToggle}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-['Cairo']">
      <AppBar onViewChange={setCurrentView} onRefresh={() => loadData(false)} currentView={currentView} />
      <main className="pt-20 max-w-lg mx-auto overflow-x-hidden min-h-[calc(100vh-80px)]">
        {renderContent()}
      </main>

      {/* استدعاء المحمل الصامت للفيديوهات */}
      {!loading && rawVideos.length > 0 && <VideoPreloader videos={rawVideos} />}
      
      <Suspense fallback={null}><AIOracle /></Suspense>
      {toast && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[1100] bg-red-600 px-6 py-2 rounded-full font-bold shadow-lg shadow-red-600/40 text-xs">{toast}</div>}
      
      {selectedShort && (
        <Suspense fallback={null}>
          <ShortsPlayerOverlay 
            initialVideo={selectedShort.video} 
            videoList={selectedShort.list} 
            interactions={interactions} 
            onClose={() => setSelectedShort(null)} 
            onLike={handleLikeToggle} 
            onDislike={handleDislike} 
            onSave={(id) => setInteractions(p => p.savedIds.includes(id) ? p : ({...p, savedIds: [...p.savedIds, id]}))} 
            onProgress={updateWatchHistory} 
            onCategorySelect={handleCategorySelect}
            onVideoEnded={handleNextVideoShorts} // ربط حدث الانتهاء بالتشغيل التلقائي
          />
        </Suspense>
      )}
      
      {selectedLong && (
        <Suspense fallback={null}>
          <LongPlayerOverlay 
            video={selectedLong.video} 
            allLongVideos={selectedLong.list} 
            onClose={() => setSelectedLong(null)} 
            onLike={() => handleLikeToggle(selectedLong.video.id)} 
            onDislike={() => handleDislike(selectedLong.video.id)} 
            onSave={() => setInteractions(p => p.savedIds.includes(selectedLong.video.id) ? p : ({...p, savedIds: [...p.savedIds, selectedLong.video.id]}))} 
            onSwitchVideo={handleSwitchLongVideo} 
            isLiked={interactions.likedIds.includes(selectedLong.video.id)} 
            isDisliked={interactions.dislikedIds.includes(selectedLong.video.id)} 
            isSaved={interactions.savedIds.includes(selectedLong.video.id)} 
            onProgress={(p) => updateWatchHistory(selectedLong.video.id, p)} 
            onCategorySelect={handleCategorySelect}
          />
        </Suspense>
      )}
    </div>
  );
};

export default App;
