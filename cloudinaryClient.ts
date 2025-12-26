
import { Video } from './types';

const CLOUD_NAME = 'dlrvn33p0'.trim();
const COMMON_TAG = 'hadiqa_v4';

/**
 * وظيفة لتخزين الفيديوهات فعلياً في ذاكرة الهاتف (Cache Storage)
 */
export const cacheTrendingVideos = async (videos: Video[]) => {
  if ('caches' in window) {
    try {
      const videoCache = await caches.open('horror-garden-v1');
      // تحميل أول 7 فيديوهات لضمان تجربة فورية وسلسة
      const priorityVideos = videos.slice(0, 7);
      
      priorityVideos.forEach(async (video) => {
        const cacheResponse = await videoCache.match(video.video_url);
        if (!cacheResponse) {
          fetch(video.video_url).then(res => {
            if (res.ok) videoCache.put(video.video_url, res);
          }).catch(() => {});
        }
      });
    } catch (e) {
      console.error("Cache system failed", e);
    }
  }
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
    
    // الإعدادات السينمائية لضمان أعلى دقة ووضوح (Full HD + Sharpen)
    const cinematicParams = `q_auto:best,f_auto,e_sharpen:100,c_limit,w_1080,br_5m,vc_h264`;
    
    const optimizedUrl = `${baseUrl}/${cinematicParams}/v${res.version}/${res.public_id}.mp4`;
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

export const deleteCloudinaryVideo = async (publicId: string) => {
  console.warn("Delete requires Admin API credentials.");
  return false;
};

export const updateCloudinaryMetadata = async (publicId: string, title: string, category: string) => {
  console.warn("Update requires Admin API credentials.");
  return false;
};
