import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, MapPin, UserCircle, FileText, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useGlobalSearch, SearchResult } from '@/hooks/useGlobalSearch';
import { cn } from '@/lib/utils';

const typeIcons = {
  sales_agent: Users,
  customer: UserCircle,
  route: MapPin,
  contract: FileText,
};

const typeLabels = {
  sales_agent: 'Sales Agent',
  customer: 'Customer',
  route: 'Route',
  contract: 'Contract',
};

const typeColors = {
  sales_agent: 'bg-blue-500/10 text-blue-500',
  customer: 'bg-green-500/10 text-green-500',
  route: 'bg-orange-500/10 text-orange-500',
  contract: 'bg-purple-500/10 text-purple-500',
};

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: results = [], isLoading } = useGlobalSearch(query);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        handleSelect(results[selectedIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.url);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Cari nama, kode agent, kode customer, kode route, kontrak..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50 max-h-80 overflow-auto"
        >
          {results.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Tidak ditemukan hasil untuk "{query}"
            </div>
          ) : (
            <ul className="py-1">
              {results.map((result, index) => {
                const Icon = typeIcons[result.type];
                return (
                  <li
                    key={`${result.type}-${result.id}`}
                    className={cn(
                      'px-3 py-2 cursor-pointer flex items-start gap-3 hover:bg-accent',
                      selectedIndex === index && 'bg-accent'
                    )}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className={cn('p-1.5 rounded-md', typeColors[result.type])}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{result.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground self-center">
                      {typeLabels[result.type]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
