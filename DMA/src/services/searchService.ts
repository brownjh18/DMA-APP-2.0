// src/services/searchService.ts

export interface SearchResult {
  id: string;
  type: 'sermon' | 'news' | 'event' | 'devotion' | 'ministry';
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  date?: string;
  url: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export async function searchContent(query: string, limit: number = 20): Promise<SearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search API error:', error);
    // Return empty results instead of throwing to prevent app crashes
    return {
      results: [],
      total: 0,
      query: query
    };
  }
}

export async function getSearchSuggestions(): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/search/suggestions`);

    if (!response.ok) {
      throw new Error(`Suggestions failed: ${response.status}`);
    }

    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Suggestions API error:', error);
    // Fallback to static suggestions
    return [
      'Sunday Service',
      'Prayer Meeting',
      'Bible Study',
      'Youth Ministry',
      'Worship',
      'Sermon',
      'Devotion',
      'Testimony',
      'Healing',
      'Salvation',
      'Faith',
      'Hope',
      'Love',
      'Grace',
      'Mercy',
      'Forgiveness',
      'Holy Spirit',
      'Jesus Christ',
      'God',
      'Prayer'
    ];
  }
}