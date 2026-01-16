import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
}

export function SearchInput({ 
  value, 
  onChange, 
  placeholder = "Cari...", 
  className,
  onClear 
}: SearchInputProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-3 h-4 w-4 text-gray-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="absolute right-2 h-6 w-6 p-0 hover:bg-gray-100"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}