import { useState, useEffect } from 'react';
import axios from 'axios';

// Cache templates in memory to avoid repeated API calls
let cachedTemplates = null;
let cachePromise = null;

export function useTemplates() {
  const [templates, setTemplates] = useState(cachedTemplates || {});
  const [loading, setLoading] = useState(!cachedTemplates);

  useEffect(() => {
    if (cachedTemplates) {
      setTemplates(cachedTemplates);
      setLoading(false);
      return;
    }

    // If already fetching, wait for that promise
    if (cachePromise) {
      cachePromise.then(data => {
        setTemplates(data);
        setLoading(false);
      });
      return;
    }

    // Fetch templates
    cachePromise = axios.get('/api/templates')
      .then(response => {
        cachedTemplates = response.data.templates;
        return cachedTemplates;
      })
      .catch(error => {
        console.error('Failed to load templates:', error);
        return {};
      })
      .finally(() => {
        cachePromise = null;
      });

    cachePromise.then(data => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  // Helper function to get template with fallback
  const t = (key, fallback = '') => {
    return templates[key] || fallback;
  };

  return { templates, loading, t };
}

// Function to invalidate cache (call after updating templates)
export function invalidateTemplateCache() {
  cachedTemplates = null;
  cachePromise = null;
}
