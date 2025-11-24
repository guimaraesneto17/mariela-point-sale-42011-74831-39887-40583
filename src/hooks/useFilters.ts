import { useState, useMemo, useCallback } from 'react';

interface UseFiltersOptions<T> {
  data: T[];
  searchFields?: (keyof T)[];
  filterFunctions?: Record<string, (item: T, value: any) => boolean>;
}

export function useFilters<T>(options: UseFiltersOptions<T>) {
  const { data, searchFields = [], filterFunctions = {} } = options;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search filter
      if (searchTerm && searchFields.length > 0) {
        const matchesSearch = searchFields.some((field) => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchTerm.toLowerCase());
          }
          return false;
        });
        if (!matchesSearch) return false;
      }

      // Custom filters
      for (const [key, value] of Object.entries(filters)) {
        if (value === null || value === undefined || value === 'todos' || value === 'all') {
          continue;
        }
        
        const filterFn = filterFunctions[key];
        if (filterFn && !filterFn(item, value)) {
          return false;
        }
      }

      return true;
    });
  }, [data, searchTerm, searchFields, filters, filterFunctions]);

  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || Object.values(filters).some(
      (v) => v !== null && v !== undefined && v !== 'todos' && v !== 'all'
    );
  }, [searchTerm, filters]);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    filteredData,
    hasActiveFilters,
  };
}
