import React from 'react';

interface TopNavProps {
    activeTab: 'chat' | 'flashcards';
    onNavigate: (view: 'chat' | 'flashcards') => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeTab, onNavigate }) => {
    return (
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 w-full shrink-0">
            <div className="flex items-center h-full gap-8">
                <button 
                    onClick={() => onNavigate('chat')}
                    className={`relative h-full flex items-center px-1 text-sm font-semibold transition-colors ${activeTab === 'chat' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Chat & Analysis
                    {activeTab === 'chat' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_-2px_6px_rgba(68,71,238,0.5)]"></div>
                    )}
                </button>
                <button 
                    onClick={() => onNavigate('flashcards')}
                    className={`relative h-full flex items-center px-1 text-sm font-medium transition-colors ${activeTab === 'flashcards' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Flashcards
                    {activeTab === 'flashcards' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full shadow-[0_-2px_6px_rgba(68,71,238,0.5)]"></div>
                    )}
                </button>
            </div>
            <div className="flex items-center gap-2">
                <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined" style={{fontSize: '20px'}}>search</span>
                </button>
                <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                    <span className="material-symbols-outlined" style={{fontSize: '20px'}}>ios_share</span>
                </button>
            </div>
        </header>
    );
};