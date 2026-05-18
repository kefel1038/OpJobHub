import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SavedSearch {
  id: string;
  name: string;
  params: Record<string, string>;
  createdAt: string;
}

interface SavedSearchesProps {
  currentParams: Record<string, string>;
  onApplySearch: (params: Record<string, string>) => void;
}

export function SavedSearches({ currentParams, onApplySearch }: SavedSearchesProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("savedJobSearches");
    if (saved) {
      setSavedSearches(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage
  const persist = (searches: SavedSearch[]) => {
    localStorage.setItem("savedJobSearches", JSON.stringify(searches));
    setSavedSearches(searches);
  };

  const saveCurrentSearch = () => {
    const name = prompt("Name this search (e.g. 'Engineering in Doha')") || 
      `Search ${new Date().toLocaleDateString()}`;
    
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      params: { ...currentParams },
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSearch];
    persist(updated);
    setShowDropdown(true);
  };

  const deleteSearch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSearches.filter(s => s.id !== id);
    persist(updated);
  };

  const applySearch = (search: SavedSearch) => {
    onApplySearch(search.params);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="rounded-full gap-1.5"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bookmark className="h-3.5 w-3.5" />
        Saved Searches
        {savedSearches.length > 0 && (
          <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
            {savedSearches.length}
          </Badge>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-background border rounded-xl shadow-xl z-50 p-2">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="text-sm font-semibold">Saved Searches</span>
            <Button variant="ghost" size="sm" onClick={saveCurrentSearch} className="h-7 text-xs">
              <BookmarkCheck className="h-3 w-3 mr-1" /> Save Current
            </Button>
          </div>

          {savedSearches.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No saved searches yet.<br />Save your current filters to quickly return later.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto py-1">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  onClick={() => applySearch(search)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted rounded-lg cursor-pointer group"
                >
                  <div>
                    <div className="font-medium text-sm">{search.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {Object.keys(search.params).length} filters
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteSearch(search.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
