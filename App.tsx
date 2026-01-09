import React, { useState } from 'react';
import { ChatScreen } from './components/ChatScreen';
import { FlashcardsScreen } from './components/FlashcardsScreen';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<'chat' | 'flashcards'>('chat');

    return (
        <>
            {currentView === 'chat' ? (
                <ChatScreen onNavigate={setCurrentView} />
            ) : (
                <FlashcardsScreen onNavigate={setCurrentView} />
            )}
        </>
    );
};

export default App;