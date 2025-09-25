'use client';

import { Input } from "@/components/ui/input";
import { Search, ListFilter } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export type SortOption = 'name-asc' | 'name-desc' | string;
export type SortOptionItem = { value: SortOption; label: string };

interface SearchAndSortProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortOption: SortOption;
    onSortChange: (option: SortOption) => void;
    sortOptions?: SortOptionItem[];
}

const defaultSortOptions: SortOptionItem[] = [
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
];

export function SearchAndSort({ 
    searchQuery, 
    onSearchChange, 
    sortOption, 
    onSortChange,
    sortOptions = defaultSortOptions
}: SearchAndSortProps) {
    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-12 h-12 text-base rounded-full bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary"
                />
            </div>

            <Accordion type="single" collapsible className="w-full rounded-xl glass-card px-6">
                <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                             <ListFilter className="h-5 w-5" />
                            <span className="text-base font-medium">Sort Options</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <RadioGroup value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)} className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                           {sortOptions.map(option => (
                                <div key={option.value}>
                                    <RadioGroupItem value={option.value} id={option.value} className="peer sr-only" />
                                    <Label 
                                        htmlFor={option.value} 
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                                            "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                                            "cursor-pointer"
                                        )}
                                    >
                                        {option.label}
                                    </Label>
                                </div>
                           ))}
                        </RadioGroup>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
