
import { Video } from './types';

const CLOUD_NAME = 'dlrvn33p0'.trim();
const COMMON_TAG = 'hadiqa_v4';

/**
 * وظيفة "المستودع الذكي": تقوم بتحميل فيديوهات في ذاكرة الكاش (Cache) 
 * لضمان تشغيلها فوراً بدون انتظار تحميل.
 */
export const cacheTrendingVideos = async (videos: Video[]) => {
  if (!('caches' in window)) return;
  try {
    const videoCache = await caches.open('horror-garden-v1');
    // تحميل أول 7 فيديوهات لضمان تجربة فورية
    const priorityVideos = videos.slice(0, 7);
    
    priorityVideos.forEach(async (video) => {
      const cacheResponse = await videoCache.match(video.video_url);
      if (!cacheResponse) {
        fetch(video.video_url, { mode: 'cors' }).then(res => {
          if (res.ok) videoCache.put(video.video_url, res);
        }).catch(() => {});
      }
    });
  } catch (e) {
    console.error("Cache system failed", e);
  }
};

/**
 * وظيفة إضافية لتحميل الفيديوهات التي لم تظهر للمستخدم بعد
 */
export const forcePreloadUnseenVideos = async (videos: Video[]) => {
  if (!('caches' in window)) return;
  const cache = await caches.open('horror-garden-v1');
  const seenIds = JSON.parse(localStorage.getItem('seen_video_ids') || '[]');
  const unseen = videos.filter(v => !seenIds.includes(v.id)).slice(0, 5);

  unseen.forEach(video => {
    fetch(video.video_url, { mode: 'cors' }).then(res => {
      if (res.ok) cache.put(video.video_url, res);
    }).catch(() => {});
  });
};

export const fetchCloudinaryVideos = async (): Promise<Video[]> => {
  try {
    const timestamp = new Date().getTime();
    const targetUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/list/${COMMON_TAG}.json?t=${timestamp}`;
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      mode: 'cors',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store' 
    });

    if (!response.ok) {
      const cached = localStorage.getItem('app_videos_cache');
      return cached ? JSON.parse(cached) : [];
    }

    const data = await response.json();
    return mapCloudinaryData(data.resources || []);
  } catch (error) {
    const cached = localStorage.getItem('app_videos_cache');
    return cached ? JSON.parse(cached) : [];
  }
};

const mapCloudinaryData = (resources: any[]): Video[] => {
  const mapped = resources.map((res: any) => {
    const videoType: 'short' | 'long' = (res.height > res.width) ? 'short' : 'long';
    const baseUrl = `https://res.cloudinary.com/${CLOUD_NAME}/video/upload`;
    
    // إعدادات سينمائية + سرعة (Baseline) متوافقة مع AppCreator24
    // e_sharpen:100 للحدة، vc_h264:baseline للتوافق، br_5m لثبات البت ريت
    const params = `q_auto:best,f_auto,e_sharpen:100,c_limit,w_1080,br_5m,vc_h264:baseline`;
    
    const optimizedUrl = `${baseUrl}/${params}/v${res.version}/${res.public_id}.mp4`;
    const posterUrl = `${baseUrl}/q_auto:best,f_auto,so_0/v${res.version}/${res.public_id}.jpg`;
    
    return {
      id: res.public_id,
      public_id: res.public_id,
      video_url: optimizedUrl,
      poster_url: posterUrl,
      type: videoType,
      title: res.context?.custom?.caption || 'فيديو مرعب',
      likes: 0,
      views: 0,
      category: res.context?.custom?.caption || 'غموض',
      created_at: res.created_at
    } as Video;
  });

  if (mapped.length > 0) {
    localStorage.setItem('app_videos_cache', JSON.stringify(mapped));
  }
  return mapped;
};

export const updateCloudinaryMetadata = async (publicId: string, metadata: any) => {
  console.warn("Metadata update via Client-side is restricted. Requires signed upload.");
};
