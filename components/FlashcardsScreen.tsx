import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Flashcard as FlashcardType } from '../types';
import { n8nService } from '../services/n8nService';

// Individual Card Component
const FlashcardItem: React.FC<FlashcardType & { flipped?: boolean }> = ({ question, answer, tag, color, topic, category, flipped = false }) => {
    const [isFlipped, setIsFlipped] = useState(flipped);

    // Use question as the display title
    const displayTitle = question;

    const tagStyles: Record<string, { bg: string; text: string; border: string }> = {
        red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' }
    };
    const style = tagStyles[color] || tagStyles.blue;

    if (isFlipped) {
        return (
            <div
                onClick={() => setIsFlipped(false)}
                className="group relative flex flex-col justify-between h-[280px] p-6 rounded-xl border border-primary/50 bg-surface-dark shadow-xl shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer ring-1 ring-primary/20 animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="flex justify-between items-start mb-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md ${style.bg} ${style.text} text-xs font-semibold border ${style.border}`}>
                        {tag}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-[18px]">check</span>
                    </div>
                </div>
                <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                    <p className="text-text-secondary text-xs mb-2 font-medium uppercase tracking-wide">Question</p>
                    <h3 className="text-white/60 text-sm font-medium leading-snug mb-4 line-clamp-2">{displayTitle}</h3>
                    <p className="text-text-secondary text-xs mb-2 font-medium uppercase tracking-wide text-primary">Answer</p>
                    <p className="text-white text-base font-normal leading-relaxed">{answer}</p>
                </div>
                <div className="mt-4 flex gap-2 pt-2 border-t border-white/5">
                    <button className="flex-1 h-8 rounded bg-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/30 transition-colors" onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}>Got it</button>
                    <button className="flex-1 h-8 rounded bg-red-500/20 text-red-400 text-xs font-bold hover:bg-red-500/30 transition-colors" onClick={(e) => { e.stopPropagation(); setIsFlipped(false); }}>Study again</button>
                </div>
            </div>
        )
    }

    return (
        <div
            onClick={() => setIsFlipped(true)}
            className="group relative flex flex-col justify-between h-[280px] p-6 rounded-xl border border-surface-border bg-surface-dark shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 cursor-pointer"
        >
            <div className="flex justify-between items-start mb-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md ${style.bg} ${style.text} text-xs font-semibold border ${style.border}`}>
                    {tag}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-[18px] text-text-secondary group-hover:text-white">flip</span>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center text-center">
                <h3 className="text-white text-lg font-bold leading-snug">{displayTitle}</h3>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Click to flip</span>
            </div>
        </div>
    );
};

interface FlashcardsScreenProps {
    onNavigate: (view: 'chat' | 'flashcards') => void;
}

const STORAGE_KEY = 'pilearning_flashcards';

const MIN_CARDS = 5;
const MAX_CARDS = 15;
const DEFAULT_CARDS = 10;

export const FlashcardsScreen: React.FC<FlashcardsScreenProps> = ({ onNavigate }) => {
    // Load saved flashcards from localStorage on initial render
    const [cards, setCards] = useState<FlashcardType[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [topicInput, setTopicInput] = useState("");
    const [cardCount, setCardCount] = useState(DEFAULT_CARDS);

    // Save flashcards to localStorage whenever they change
    useEffect(() => {
        if (cards.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
        }
    }, [cards]);

    const loadCards = async (topic?: string) => {
        setLoading(true);
        // If a topic is passed (from manual input), clear filters to ensure we see the result
        if (topic) {
            setSelectedTags([]);
            setSelectedCategories([]);
            setSelectedSubcategories([]);
        }

        const newCards = await n8nService.generateFlashcards(topic, cardCount);

        // Merge: add new cards without duplicating (by question)
        setCards(prev => {
            const existingQuestions = new Set(prev.map(c => c.question));
            const uniqueNew = newCards.filter(c => !existingQuestions.has(c.question));
            return [...prev, ...uniqueNew];
        });

        setLoading(false);
    };

    // Clear all flashcards from state and localStorage
    const clearAllCards = () => {
        setCards([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const handleTopicSubmit = () => {
        if (!topicInput.trim()) return;
        loadCards(topicInput);
        setTopicInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleTopicSubmit();
    };

    // Filter Logic
    const uniqueTags = Array.from(new Set(cards.map(c => c.tag))).filter((tag): tag is string => !!tag).sort();
    const uniqueCategories = Array.from(new Set(cards.map(c => c.category))).filter((cat): cat is string => !!cat).sort();
    const uniqueSubcategories = Array.from(new Set(cards.map(c => c.subcategory))).filter((sub): sub is string => !!sub).sort();

    const filteredCards = cards.filter(card => {
        const tagMatch = selectedTags.length === 0 || selectedTags.includes(card.tag);
        const catMatch = selectedCategories.length === 0 || selectedCategories.includes(card.category);
        const subMatch = selectedSubcategories.length === 0 || selectedSubcategories.includes(card.subcategory);
        return tagMatch && catMatch && subMatch;
    });

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const toggleCategory = (cat: string) => {
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const toggleSubcategory = (sub: string) => {
        setSelectedSubcategories(prev =>
            prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
        );
    };

    const clearAllFilters = () => {
        setSelectedTags([]);
        setSelectedCategories([]);
        setSelectedSubcategories([]);
    };

    const totalActiveFilters = selectedTags.length + selectedCategories.length + selectedSubcategories.length;

    return (
        <div className="flex h-screen bg-background-dark overflow-hidden">
            <Sidebar onNavigate={onNavigate} />
            <main className="flex-1 flex flex-col h-full bg-background-dark relative overflow-hidden min-w-0">
                <TopNav activeTab="flashcards" onNavigate={onNavigate} />

                {/* Main Scroll Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-[1200px] mx-auto w-full px-6 lg:px-12 py-8 flex flex-col gap-8">
                        {/* Toolbar */}
                        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-20">
                            <div className="flex flex-col">
                                <h2 className="text-2xl font-bold text-white tracking-tight">Study Deck</h2>
                                <p className="text-text-secondary text-sm mt-1">
                                    {loading
                                        ? 'Loading...'
                                        : filteredCards.length !== cards.length
                                            ? `Showing ${filteredCards.length} of ${cards.length} cards`
                                            : `Reviewing all ${cards.length} cards`
                                    }
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Topic Input Field */}
                                <div className="relative group min-w-[200px] sm:min-w-[250px]">
                                    <input
                                        type="text"
                                        value={topicInput}
                                        onChange={(e) => setTopicInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Enter topic to generate..."
                                        className="w-full bg-surface-dark border border-surface-border text-white text-sm rounded-lg pl-3 pr-10 py-2.5 focus:ring-1 focus:ring-primary focus:border-primary placeholder-gray-500 transition-all shadow-sm"
                                    />
                                    <button
                                        onClick={handleTopicSubmit}
                                        className="absolute right-1.5 top-1.5 p-1 rounded-md bg-white/5 text-gray-400 hover:text-primary hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                                    </button>
                                </div>

                                {/* Card Count Selector */}
                                <div className="flex items-center gap-2 bg-surface-dark border border-surface-border rounded-lg px-3 py-1.5">
                                    <label className="text-xs text-gray-400 whitespace-nowrap">Cards:</label>
                                    <input
                                        type="number"
                                        min={MIN_CARDS}
                                        max={MAX_CARDS}
                                        value={cardCount}
                                        onChange={(e) => setCardCount(Math.min(MAX_CARDS, Math.max(MIN_CARDS, parseInt(e.target.value) || DEFAULT_CARDS)))}
                                        className="w-12 bg-transparent border-none text-white text-sm text-center focus:ring-0 focus:outline-none"
                                    />
                                </div>

                                <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>

                                {/* Filter Button with Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={`flex items-center gap-2 h-10 px-4 border rounded-lg text-sm font-medium transition-all shadow-sm ${isFilterOpen || totalActiveFilters > 0
                                                ? 'bg-primary/20 border-primary/50 text-white'
                                                : 'bg-surface-dark border-surface-border text-gray-300 hover:text-white hover:border-primary/50 hover:bg-surface-dark/80'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                        <span>Filtros</span>
                                        {totalActiveFilters > 0 && (
                                            <span className="ml-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{totalActiveFilters}</span>
                                        )}
                                    </button>

                                    {isFilterOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                                            <div className="absolute top-full mt-2 right-0 sm:right-auto sm:left-0 w-72 bg-[#1E1F30] border border-white/10 rounded-xl shadow-2xl z-20 p-1.5 animate-in fade-in zoom-in-95 duration-200 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                                {/* Header */}
                                                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between items-center border-b border-white/5 mb-1">
                                                    <span>Filtros</span>
                                                    {totalActiveFilters > 0 && (
                                                        <button onClick={clearAllFilters} className="text-primary hover:text-indigo-300 transition-colors">Limpiar todo</button>
                                                    )}
                                                </div>

                                                {/* Tags Section */}
                                                <div className="mb-3">
                                                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[14px]">label</span>
                                                        Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                                                    </div>
                                                    <div className="p-1 space-y-0.5">
                                                        {uniqueTags.length === 0 && <p className="text-gray-500 text-xs px-2 py-1">No hay tags</p>}
                                                        {uniqueTags.map(tag => (
                                                            <button
                                                                key={tag}
                                                                onClick={() => toggleTag(tag)}
                                                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedTags.includes(tag) ? 'bg-primary/20 text-white' : 'text-gray-300 hover:bg-white/5'}`}
                                                            >
                                                                <span>{tag}</span>
                                                                {selectedTags.includes(tag) && <span className="material-symbols-outlined text-[14px] text-primary">check</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Categories Section */}
                                                {uniqueCategories.length > 0 && (
                                                    <div className="mb-3 border-t border-white/5 pt-2">
                                                        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">category</span>
                                                            Categoría {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                                                        </div>
                                                        <div className="p-1 space-y-0.5">
                                                            {uniqueCategories.map(cat => (
                                                                <button
                                                                    key={cat}
                                                                    onClick={() => toggleCategory(cat)}
                                                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedCategories.includes(cat) ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-300 hover:bg-white/5'}`}
                                                                >
                                                                    <span>{cat}</span>
                                                                    {selectedCategories.includes(cat) && <span className="material-symbols-outlined text-[14px] text-emerald-400">check</span>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Subcategories Section */}
                                                {uniqueSubcategories.length > 0 && (
                                                    <div className="border-t border-white/5 pt-2">
                                                        <div className="px-3 py-1.5 text-xs font-medium text-gray-500 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">folder</span>
                                                            Subcategoría {selectedSubcategories.length > 0 && `(${selectedSubcategories.length})`}
                                                        </div>
                                                        <div className="p-1 space-y-0.5">
                                                            {uniqueSubcategories.map(sub => (
                                                                <button
                                                                    key={sub}
                                                                    onClick={() => toggleSubcategory(sub)}
                                                                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${selectedSubcategories.includes(sub) ? 'bg-amber-500/20 text-amber-400' : 'text-gray-300 hover:bg-white/5'}`}
                                                                >
                                                                    <span>{sub}</span>
                                                                    {selectedSubcategories.includes(sub) && <span className="material-symbols-outlined text-[14px] text-amber-400">check</span>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button onClick={() => loadCards()} className="flex items-center gap-2 h-10 px-4 bg-surface-dark border border-surface-border hover:border-primary/50 hover:bg-surface-dark/80 rounded-lg text-white text-sm font-medium transition-all shadow-sm" title="Refresh / Load more">
                                    <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                                </button>
                                <button className="flex items-center gap-2 h-10 px-4 bg-surface-dark border border-surface-border hover:border-primary/50 hover:bg-surface-dark/80 rounded-lg text-white text-sm font-medium transition-all shadow-sm" title="Export">
                                    <span className="material-symbols-outlined text-[18px]">ios_share</span>
                                </button>
                                {cards.length > 0 && (
                                    <button
                                        onClick={clearAllCards}
                                        className="flex items-center gap-2 h-10 px-4 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 rounded-lg text-red-400 text-sm font-medium transition-all shadow-sm"
                                        title="Clear all flashcards"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Flashcards Grid */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-[280px] rounded-xl border border-white/5 bg-surface-dark animate-pulse relative">
                                        <div className="absolute top-6 left-6 w-20 h-6 bg-white/10 rounded"></div>
                                        <div className="absolute top-1/2 left-6 right-6 h-4 bg-white/5 rounded"></div>
                                        <div className="absolute top-1/2 mt-6 left-6 right-16 h-4 bg-white/5 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
                                {filteredCards.map((card) => (
                                    <FlashcardItem key={card.id} {...card} />
                                ))}
                                {filteredCards.length === 0 && cards.length > 0 && (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                                        <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">filter_list_off</span>
                                        <p>No hay cards que coincidan con los filtros.</p>
                                        <button onClick={clearAllFilters} className="mt-4 text-primary hover:underline">Limpiar filtros</button>
                                    </div>
                                )}
                                {cards.length === 0 && (
                                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-500">
                                        <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">school</span>
                                        <p>No hay flashcards todavía.</p>
                                        <p className="text-sm mt-1">Ingresa un tema arriba para generar flashcards.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};