// src/services/searchService.ts
import apiService from './api';

export interface SearchResult {
  id: string;
  type: 'sermon' | 'podcast' | 'event' | 'devotion' | 'ministry';
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

export async function searchContent(query: string, limit: number = 20): Promise<SearchResponse> {
  try {
    const response = await apiService.search(query, { limit });
    return response;
  } catch (error) {
    console.error('Search API error:', error);
    return {
      results: [],
      total: 0,
      query: query
    };
  }
}

export async function getSearchSuggestions(): Promise<string[]> {
  try {
    const suggestions = await apiService.getSearchSuggestions();
    return suggestions;
  } catch (error) {
    console.error('Suggestions API error:', error);
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