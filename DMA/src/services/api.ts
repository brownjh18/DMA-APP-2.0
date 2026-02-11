// API Service for connecting frontend to backend
import { Capacitor } from '@capacitor/core';
const API_BASE_URL = Capacitor.isNativePlatform() ? 'http://192.168.100.43:5000/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
export { API_BASE_URL };

// Base URL for direct backend access (for images, etc.)
const getBackendBaseUrl = () => {
  // For Capacitor apps, use the PC's IP
  if (Capacitor.isNativePlatform()) {
    return 'http://192.168.100.43:5000';
  }
  // If VITE_API_URL is set (for network/mobile testing), use it
  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL;
    // Remove '/api' suffix to get base URL
    return apiUrl.replace(/\/api$/, '');
  }
  // For localhost development, use direct backend URL
  return 'http://localhost:5000';
};

export const BACKEND_BASE_URL = getBackendBaseUrl();

class ApiService {
  private token: string | null = null;
  private logoutCallback: (() => void) | null = null;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  // Clear all API cache
  clearAllCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('api_cache_')) {
          localStorage.removeItem(key);
        }
      });
      console.log('All API cache cleared');
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }

  // Clear cache for specific endpoint type
  clearCacheByType(endpointType: 'sermons' | 'podcasts' | 'devotions') {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('api_cache_') && key.includes(endpointType)) {
          localStorage.removeItem(key);
          console.log(`Cleared cache for ${endpointType}:`, key);
        }
      });
    } catch (error) {
      console.error(`Error clearing ${endpointType} cache:`, error);
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  setLogoutCallback(callback: () => void) {
    this.logoutCallback = callback;
  }

  private isOnline(): boolean {
    return navigator.onLine;
  }

  private getCacheKey(endpoint: string, options: RequestInit = {}): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  private getCachedData(key: string): any | null {
    try {
      const cached = localStorage.getItem(`api_cache_${key}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < this.CACHE_DURATION) {
          return parsed.data;
        } else {
          localStorage.removeItem(`api_cache_${key}`);
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    try {
      const cacheEntry = { data, timestamp: Date.now() };
      localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheEntry));
    } catch (error) {
      console.error('Error writing cache:', error);
    }
  }

  private isAuthEndpoint(endpoint: string): boolean {
    return endpoint.startsWith('/auth/') || endpoint === '/auth/login' || endpoint === '/auth/signup';
  }

  private async request(endpoint: string, options: RequestInit = {}, retryCount = 0, forceRefresh: boolean = false): Promise<any> {
    const maxRetries = 5;
    const baseDelay = 2000; // 2 second base delay
    const cacheKey = this.getCacheKey(endpoint, options);

    // Check cache if offline or for GET requests (unless force refresh)
    if (!forceRefresh && (!this.isOnline() || (options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE'))) {
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        console.log(`Returning cached data for ${endpoint}`);
        return cachedData;
      }
    }

    // If offline and no cache, return empty data for mobile
    if (!this.isOnline() && Capacitor.isNativePlatform()) {
      console.log(`Offline and no cache for ${endpoint}, returning empty data`);
      if (endpoint.includes('/devotions')) return { devotions: [] };
      if (endpoint.includes('/podcasts')) return { podcasts: [] };
      if (endpoint.includes('/events')) return { events: [] };
      if (endpoint.includes('/ministries')) return { ministries: [] };
      if (endpoint.includes('/sermons')) return { sermons: [] };
      if (endpoint.includes('/live-broadcasts')) return { broadcasts: [] };
      return {};
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        cache: 'no-cache',
      });

      if (!response.ok) {
        // Handle authentication errors (401/403) - token expired or invalid
        if (response.status === 401 || response.status === 403) {
          console.log('Authentication error, logging out user');
          if (this.logoutCallback) {
            this.logoutCallback();
          }
          const error = await response.json().catch(() => ({ error: 'Authentication failed' }));
          throw new Error(error.error || 'Authentication failed');
        }

        // Handle rate limiting (429) with exponential backoff
        if (response.status === 429 && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount);
          console.log(`Rate limited. Retrying ${endpoint} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request(endpoint, options, retryCount + 1, forceRefresh);
        }

        const error = await response.json().catch(() => ({ error: 'Network error' }));
        console.error('API Error Response:', error);
        throw new Error(error.error || error.errors?.[0]?.msg || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Cache successful GET responses (except admin endpoints that change frequently)
      if (options.method !== 'POST' && options.method !== 'PUT' && options.method !== 'DELETE' && !endpoint.includes('/auth/users')) {
        this.setCachedData(cacheKey, data);
      }

      return data;
    } catch (error: any) {
      // Handle network errors with exponential backoff
      // Don't retry authentication endpoints as they represent invalid credentials, not network issues
      if (retryCount < maxRetries && (error.name === 'TypeError' || error.message?.includes('Network error')) && !this.isAuthEndpoint(endpoint)) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`Network error. Retrying ${endpoint} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request(endpoint, options, retryCount + 1, forceRefresh);
      }
      // For mobile/offline usage, return cached data or empty data
      if (Capacitor.isNativePlatform()) {
        const cachedData = this.getCachedData(cacheKey);
        if (cachedData) {
          console.log(`Network failed, returning cached data for ${endpoint}`);
          return cachedData;
        }
        console.log(`API call to ${endpoint} failed, returning empty data for offline mode`);
        // Return appropriate empty response based on endpoint
        if (endpoint.includes('/devotions')) return { devotions: [] };
        if (endpoint.includes('/podcasts')) return { podcasts: [] };
        if (endpoint.includes('/events')) return { events: [] };
        if (endpoint.includes('/ministries')) return { ministries: [] };
        if (endpoint.includes('/sermons')) return { sermons: [] };
        if (endpoint.includes('/live-broadcasts')) return { broadcasts: [] };
        return {};
      }
      throw error;
    }
  }

  // Upload method for FormData (files)
  private async upload(endpoint: string, formData: FormData, retryCount = 0): Promise<any> {
    const maxRetries = 5;
    const baseDelay = 2000;

    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        // Handle authentication errors (401/403) - token expired or invalid
        if (response.status === 401 || response.status === 403) {
          console.log('Authentication error during upload');
          const error = await response.json().catch(() => ({ error: 'Authentication failed' }));
          throw new Error(error.error || 'Authentication failed');
        }

        // Handle rate limiting (429) with exponential backoff
        if (response.status === 429 && retryCount < maxRetries) {
          const delay = baseDelay * Math.pow(2, retryCount);
          console.log(`Rate limited. Retrying upload ${endpoint} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.upload(endpoint, formData, retryCount + 1);
        }

        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      // Handle network errors with exponential backoff
      // Don't retry authentication endpoints as they represent invalid credentials, not network issues
      if (retryCount < maxRetries && (error.name === 'TypeError' || error.message?.includes('Network error')) && !this.isAuthEndpoint(endpoint)) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`Network error. Retrying upload ${endpoint} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.upload(endpoint, formData, retryCount + 1);
      }
      throw error;
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Google OAuth
  initiateGoogleAuth() {
    const backendUrl = Capacitor.isNativePlatform() ? 'http://192.168.100.43:5000' : (import.meta.env.VITE_API_URL || 'http://localhost:5000');
    const googleAuthUrl = `${backendUrl}/api/auth/google`;
    window.location.href = googleAuthUrl;
  }

  async adminRegister(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(userData: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(passwordData: any) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async uploadProfilePicture(formData: FormData) {
    const url = `${BACKEND_BASE_URL}/api/auth/upload-profile-picture`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Sermons
  async getSermons(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/sermons?${queryString}`);
  }

  async getSermon(id: string) {
    return this.request(`/sermons/${id}`);
  }

  async createSermon(sermonData: any) {
    const result = await this.request('/sermons', {
      method: 'POST',
      body: JSON.stringify(sermonData),
    });
    // Clear sermons cache after creating a new sermon
    this.clearCacheByType('sermons');
    return result;
  }

  async updateSermon(id: string, sermonData: any) {
    const result = await this.request(`/sermons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sermonData),
    });
    // Clear sermons cache after updating a sermon
    this.clearCacheByType('sermons');
    return result;
  }

  async deleteSermon(id: string) {
    try {
      const result = await this.request(`/sermons/${id}`, {
        method: 'DELETE',
      });
      // Clear sermons cache after deleting a sermon
      this.clearCacheByType('sermons');
      return result;
    } catch (error: any) {
      // Provide more specific error messages
      if (error.message?.includes('404') || error.message?.includes('Sermon not found')) {
        throw new Error('Sermon not found. It may have been deleted already.');
      }
      throw error;
    }
  }

  async toggleSermonPublishStatus(id: string, isPublished: boolean) {
    const result = await this.request(`/sermons/${id}/publish`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublished }),
    });
    // Clear sermons cache after toggling publish status
    this.clearCacheByType('sermons');
    return result;
  }

  async getSermonStats() {
    return this.request('/sermons/admin/stats');
  }

  async uploadSermonVideo(formData: FormData) {
    const url = `${API_BASE_URL}/sermons/upload-video`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async saveSermon(id: string) {
    console.log('💾 API: saveSermon called for id:', id);
    const result = await this.request(`/sermons/${id}/save`, {
      method: 'POST',
    });
    // Dispatch event to notify other pages (like MyFavorites) to refresh
    if (typeof window !== 'undefined') {
      console.log('📢 API: Dispatching savedItemsChanged event for sermon');
      window.dispatchEvent(new Event('savedItemsChanged'));
    }
    return result;
  }

  async getSavedSermons(forceRefresh: boolean = false) {
    return this.request('/sermons/saved', {}, 0, forceRefresh);
  }

  async subscribe(channel: string) {
    return this.request(`/sermons/subscribe/${encodeURIComponent(channel)}`, {
      method: 'POST',
    });
  }

  // Devotions
  async getDevotions(params: any = {}, forceRefresh: boolean = false) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/devotions?${queryString}`, {}, 0, forceRefresh);
  }

  async getDevotion(id: string) {
    return this.request(`/devotions/${id}`);
  }

  async createDevotion(devotionData: any) {
    const result = await this.request('/devotions', {
      method: 'POST',
      body: JSON.stringify(devotionData),
    });
    // Clear devotions cache after creating a new devotion
    this.clearCacheByType('devotions');
    return result;
  }

  async updateDevotion(id: string, devotionData: any) {
    const result = await this.request(`/devotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(devotionData),
    });
    // Clear devotions cache after updating a devotion
    this.clearCacheByType('devotions');
    return result;
  }

  async deleteDevotion(id: string) {
    const result = await this.request(`/devotions/${id}`, {
      method: 'DELETE',
    });
    // Clear devotions cache after deleting a devotion
    this.clearCacheByType('devotions');
    return result;
  }

  async getSavedDevotions(forceRefresh: boolean = false) {
    return this.request('/devotions/saved', {}, 0, forceRefresh);
  }

  async saveDevotion(id: string) {
    console.log('💾 API: saveDevotion called for id:', id);
    const result = await this.request(`/devotions/${id}/save`, {
      method: 'POST',
    });
    // Dispatch event to notify other pages (like MyFavorites) to refresh
    if (typeof window !== 'undefined') {
      console.log('📢 API: Dispatching savedItemsChanged event for devotion');
      window.dispatchEvent(new Event('savedItemsChanged'));
    }
    return result;
  }

  // Events
  async getEvents(params: any = {}) {
    const queryString = new URLSearchParams({ ...params, _t: Date.now() }).toString();
    return this.request(`/events?${queryString}`);
  }

  async getEvent(id: string) {
    return this.request(`/events/${id}`);
  }

  async createEvent(eventData: any) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateEvent(id: string, eventData: any) {
    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteEvent(id: string) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  async registerForEvent(id: string, registrationData: any) {
    return this.request(`/events/${id}/register`, {
      method: 'POST',
      body: JSON.stringify(registrationData),
    });
  }

  // Prayer Requests
  async submitPrayerRequest(requestData: any) {
    return this.request('/prayer-requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async getPrayerRequests(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/prayer-requests?${queryString}`);
  }

  async updatePrayerRequest(id: string, updateData: any) {
    return this.request(`/prayer-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deletePrayerRequest(id: string) {
    return this.request(`/prayer-requests/${id}`, {
      method: 'DELETE',
    });
  }

  async getPrayerRequestStats() {
    return this.request('/prayer-requests/admin/stats');
  }

  // Ministries
  async getMinistries(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/ministries?${queryString}`);
  }

  async getMinistry(id: string) {
    return this.request(`/ministries/${id}`);
  }

  async createMinistry(ministryData: any) {
    return this.request('/ministries', {
      method: 'POST',
      body: JSON.stringify(ministryData),
    });
  }

  async updateMinistry(id: string, ministryData: any) {
    return this.request(`/ministries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ministryData),
    });
  }

  async deleteMinistry(id: string) {
    return this.request(`/ministries/${id}`, {
      method: 'DELETE',
    });
  }

  async updateMemberCount(id: string, count: number) {
    return this.request(`/ministries/${id}/members`, {
      method: 'PATCH',
      body: JSON.stringify({ memberCount: count }),
    });
  }


  // News
  async getNews(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/news?${queryString}`);
  }

  async getNewsArticle(id: string) {
    return this.request(`/news/${id}`);
  }

  async createNewsArticle(articleData: any) {
    return this.request('/news', {
      method: 'POST',
      body: JSON.stringify(articleData),
    });
  }

  async updateNewsArticle(id: string, articleData: any) {
    return this.request(`/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    });
  }

  async deleteNewsArticle(id: string) {
    return this.request(`/news/${id}`, {
      method: 'DELETE',
    });
  }

  async getNewsStats() {
    return this.request('/news/admin/stats');
  }

  // Podcasts
  async getPodcasts(params: any = {}, forceRefresh: boolean = false) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/podcasts?${queryString}`, {}, 0, forceRefresh);
  }

  async getPodcast(id: string) {
    return this.request(`/podcasts/${id}`);
  }

  async createPodcast(formData: FormData) {
    const url = `${API_BASE_URL}/podcasts`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    // Clear podcasts cache after creating a new podcast
    this.clearCacheByType('podcasts');
    return result;
  }

  async updatePodcast(id: string, formData: FormData) {
    const url = `${API_BASE_URL}/podcasts/${id}`;
    const headers: HeadersInit = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    // Clear podcasts cache after updating a podcast
    this.clearCacheByType('podcasts');
    return result;
  }

  async deletePodcast(id: string) {
    const result = await this.request(`/podcasts/${id}`, {
      method: 'DELETE',
    });
    // Clear podcasts cache after deleting a podcast
    this.clearCacheByType('podcasts');
    return result;
  }

  async savePodcast(id: string) {
    console.log('💾 API: savePodcast called for id:', id);
    const result = await this.request(`/podcasts/${id}/save`, {
      method: 'POST',
    });
    // Dispatch event to notify other pages (like MyFavorites) to refresh
    if (typeof window !== 'undefined') {
      console.log('📢 API: Dispatching savedItemsChanged event for podcast');
      window.dispatchEvent(new Event('savedItemsChanged'));
    }
    return result;
  }

  async unsavePodcast(id: string) {
    const result = await this.request(`/podcasts/${id}/unsave`, {
      method: 'POST',
    });
    // Dispatch event to notify other pages (like MyFavorites) to refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('savedItemsChanged'));
    }
    return result;
  }

  async getSavedPodcasts(forceRefresh: boolean = false) {
    return this.request('/podcasts/saved', {}, 0, forceRefresh);
  }

  // Live Broadcasts
  async getLiveBroadcasts(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/live-broadcasts?${queryString}`);
  }

  async startLiveBroadcast(broadcastData: any) {
    return this.request('/live-broadcasts/start', {
      method: 'POST',
      body: JSON.stringify(broadcastData),
    });
  }

  async stopLiveBroadcast(id: string) {
    return this.request(`/live-broadcasts/${id}/stop`, {
      method: 'POST',
    });
  }

  async updateLiveBroadcast(id: string, broadcastData: any) {
    return this.request(`/live-broadcasts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(broadcastData),
    });
  }

  async deleteLiveBroadcast(id: string) {
    return this.request(`/live-broadcasts/${id}`, {
      method: 'DELETE',
    });
  }

  // Donations/Giving
  async getDonations(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/giving?${queryString}`);
  }

  async createDonation(donationData: any) {
    return this.request('/giving', {
      method: 'POST',
      body: JSON.stringify(donationData),
    });
  }

  async updateDonation(id: string, donationData: any) {
    return this.request(`/giving/${id}`, {
      method: 'PUT',
      body: JSON.stringify(donationData),
    });
  }

  async deleteDonation(id: string) {
    return this.request(`/giving/${id}`, {
      method: 'DELETE',
    });
  }

  async getDonationStats() {
    return this.request('/giving/admin/stats');
  }

  // Users (Admin only)
  async getUsers(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/auth/users?${queryString}`);
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/auth/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Search
  async search(query: string, filters: any = {}) {
    const searchParams = new URLSearchParams({
      q: query,
      ...filters
    });
    return this.request(`/search?${searchParams}`);
  }
  
  // YouTube
  async getYouTubeVideoDetails(url: string) {
    return this.request(`/youtube/video-details?url=${encodeURIComponent(url)}`);
  }
  
  // Upload thumbnail
  async uploadThumbnail(formData: FormData) {
    const url = `${API_BASE_URL}/upload/thumbnail`;
    const headers: Record<string, string> = {};
    // Note: Thumbnail upload doesn't require authentication

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      throw error;
    }
  }

  // Upload event video
  async uploadEventVideo(formData: FormData) {
    const url = `${API_BASE_URL}/events/upload-video`;
    const headers: Record<string, string> = {};

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      throw error;
    }
  }

  // Comments
  async getComments(contentId: string, params: any = {}, forceRefresh: boolean = false) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/comments/${contentId}?${queryString}`, {}, 0, forceRefresh);
  }

  async createComment(commentData: { content: string; contentId: string; contentType: string }) {
    return this.request('/comments', {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async deleteComment(commentId: string) {
    return this.request(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
export default apiService;