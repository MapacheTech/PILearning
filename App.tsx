import React, { useState } from 'react';
import { ChatScreen } from './components/ChatScreen';
import { FlashcardsScreen } from './components/FlashcardsScreen';
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [currentView, setCurrentView] = useState<'chat' | 'flashcards'>('chat');

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

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

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;