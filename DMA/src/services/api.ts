// API Service for connecting frontend to backend
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-backend-url.com/api'
  : '/api';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
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
    const url = `${API_BASE_URL}/auth/upload-profile-picture`;
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
    return this.request('/sermons', {
      method: 'POST',
      body: JSON.stringify(sermonData),
    });
  }

  async updateSermon(id: string, sermonData: any) {
    return this.request(`/sermons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sermonData),
    });
  }

  async deleteSermon(id: string) {
    return this.request(`/sermons/${id}`, {
      method: 'DELETE',
    });
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

  // Devotions
  async getDevotions(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/devotions?${queryString}`);
  }

  async getDevotion(id: string) {
    return this.request(`/devotions/${id}`);
  }

  async createDevotion(devotionData: any) {
    return this.request('/devotions', {
      method: 'POST',
      body: JSON.stringify(devotionData),
    });
  }

  async updateDevotion(id: string, devotionData: any) {
    return this.request(`/devotions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(devotionData),
    });
  }

  async deleteDevotion(id: string) {
    return this.request(`/devotions/${id}`, {
      method: 'DELETE',
    });
  }

  // Events
  async getEvents(params: any = {}) {
    const queryString = new URLSearchParams(params).toString();
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

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
export default apiService;