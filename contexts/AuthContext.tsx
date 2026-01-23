import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, StoredUser } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'pilearning_users';
const SESSION_STORAGE_KEY = 'pilearning_session';

// Hash password using SHA-256 via Web Crypto API
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate unique user ID
function generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get stored users from localStorage
function getStoredUsers(): StoredUser[] {
    try {
        const data = localStorage.getItem(USERS_STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            return parsed.users || [];
        }
    } catch (error) {
        console.error('Error reading users from localStorage:', error);
    }
    return [];
}

// Save users to localStorage
function saveUsers(users: StoredUser[]): void {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify({ users }));
}

// Get session from sessionStorage
function getSession(): User | null {
    try {
        const data = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading session:', error);
    }
    return null;
}

// Save session to sessionStorage
function saveSession(user: User): void {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
}

// Clear session
function clearSession(): void {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load session on mount
    useEffect(() => {
        const savedSession = getSession();
        if (savedSession) {
            setUser(savedSession);
            setIsAuthenticated(true);
        }
    }, []);

    const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const trimmedUsername = username.trim().toLowerCase();

        if (!trimmedUsername || !password) {
            return { success: false, error: 'Usuario y contraseña son requeridos' };
        }

        const users = getStoredUsers();
        const storedUser = users.find(u => u.username === trimmedUsername);

        if (!storedUser) {
            return { success: false, error: 'Usuario no encontrado' };
        }

        const passwordHash = await hashPassword(password);

        if (storedUser.passwordHash !== passwordHash) {
            return { success: false, error: 'Contraseña incorrecta' };
        }

        const sessionUser: User = {
            id: storedUser.id,
            username: storedUser.username,
            createdAt: storedUser.createdAt
        };

        setUser(sessionUser);
        setIsAuthenticated(true);
        saveSession(sessionUser);

        return { success: true };
    };

    const register = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
        const trimmedUsername = username.trim().toLowerCase();

        if (!trimmedUsername || !password) {
            return { success: false, error: 'Usuario y contraseña son requeridos' };
        }

        if (trimmedUsername.length < 3) {
            return { success: false, error: 'El usuario debe tener al menos 3 caracteres' };
        }

        if (password.length < 6) {
            return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
        }

        const users = getStoredUsers();
        const existingUser = users.find(u => u.username === trimmedUsername);

        if (existingUser) {
            return { success: false, error: 'El usuario ya existe' };
        }

        const passwordHash = await hashPassword(password);
        const newUser: StoredUser = {
            id: generateUserId(),
            username: trimmedUsername,
            passwordHash,
            createdAt: Date.now()
        };

        users.push(newUser);
        saveUsers(users);

        const sessionUser: User = {
            id: newUser.id,
            username: newUser.username,
            createdAt: newUser.createdAt
        };

        setUser(sessionUser);
        setIsAuthenticated(true);
        saveSession(sessionUser);

        return { success: true };
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        clearSession();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
