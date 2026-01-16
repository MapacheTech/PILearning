import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { Flashcard as FlashcardType } from '../types';
import { n8nService } from '../services/n8nService';

// Individual Card Component
const FlashcardItem: React.FC<FlashcardType & { flipped?: boolean }> = ({ title, question, answer, tag, color, flipped = false }) => {
    const [isFlipped, setIsFlipped] = useState(flipped);

    // Fallback for title/question mapping if API returns different structure
    const displayTitle = title || question;

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

export const FlashcardsScreen: React.FC<FlashcardsScreenProps> = ({ onNavigate }) => {
    const [cards, setCards] = useState<FlashcardType[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [topicInput, setTopicInput] = useState("");

    // Removed automatic load - flashcards are only generated when user submits a topic

    const loadCards = async (topic?: string) => {
        setLoading(true);
        // If a topic is passed (from manual input), clear filters to ensure we see the result
        if (topic) setSelectedTags([]);

        const data = await n8nService.generateFlashcards(topic);
        setCards(data);
        setLoading(false);
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

    const filteredCards = cards.filter(card =>
        selectedTags.length === 0 || selectedTags.includes(card.tag)
    );

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

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

                                <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>

                                {/* Filter Button with Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                                        className={`flex items-center gap-2 h-10 px-4 border rounded-lg text-sm font-medium transition-all shadow-sm ${isFilterOpen || selectedTags.length > 0
                                                ? 'bg-primary/20 border-primary/50 text-white'
                                                : 'bg-surface-dark border-surface-border text-gray-300 hover:text-white hover:border-primary/50 hover:bg-surface-dark/80'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                        <span>Filter</span>
                                        {selectedTags.length > 0 && (
                                            <span className="ml-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{selectedTags.length}</span>
                                        )}
                                    </button>

                                    {isFilterOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)}></div>
                                            <div className="absolute top-full mt-2 right-0 sm:right-auto sm:left-0 w-56 bg-[#1E1F30] border border-white/10 rounded-xl shadow-2xl z-20 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                                                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between items-center border-b border-white/5 mb-1">
                                                    <span>Filter by Tag</span>
                                                    {selectedTags.length > 0 && (
                                                        <button onClick={() => setSelectedTags([])} className="text-primary hover:text-indigo-300 transition-colors">Clear</button>
                                                    )}
                                                </div>
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-1 space-y-1">
                                                    {uniqueTags.length === 0 && <p className="text-gray-500 text-xs px-2 py-1">No tags found</p>}
                                                    {uniqueTags.map(tag => (
                                                        <button
                                                            key={tag}
                                                            onClick={() => toggleTag(tag)}
                                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${selectedTags.includes(tag) ? 'bg-primary/20 text-white' : 'text-gray-300 hover:bg-white/5'
                                                                }`}
                                                        >
                                                            <span>{tag}</span>
                                                            {selectedTags.includes(tag) && <span className="material-symbols-outlined text-[16px] text-primary">check</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button onClick={() => loadCards()} className="flex items-center gap-2 h-10 px-4 bg-surface-dark border border-surface-border hover:border-primary/50 hover:bg-surface-dark/80 rounded-lg text-white text-sm font-medium transition-all shadow-sm">
                                    <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                                </button>
                                <button className="flex items-center gap-2 h-10 px-4 bg-surface-dark border border-surface-border hover:border-primary/50 hover:bg-surface-dark/80 rounded-lg text-white text-sm font-medium transition-all shadow-sm">
                                    <span className="material-symbols-outlined text-[18px]">ios_share</span>
                                </button>
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
                                        <p>No cards match the selected filters.</p>
                                        <button onClick={() => setSelectedTags([])} className="mt-4 text-primary hover:underline">Clear filters</button>
                                    </div>
                                )}
                                {cards.length === 0 && (
                                    <div className="col-span-full text-center py-20 text-gray-500">
                                        No flashcards generated yet. Check your webhook connection.
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