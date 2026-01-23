import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
    const { login, register } = useAuth();
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username.trim() || !password) {
            setError('Por favor completa todos los campos');
            return;
        }

        if (isRegisterMode && password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);

        try {
            const result = isRegisterMode
                ? await register(username, password)
                : await login(username, password);

            if (!result.success) {
                setError(result.error || 'Error desconocido');
            }
        } catch (err) {
            console.error('Auth error:', err);
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode);
        setError('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 shadow-lg shadow-indigo-500/20 mb-4">
                        <span className="material-symbols-outlined text-white" style={{ fontSize: '32px' }}>school</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">PI Learning</h1>
                    <p className="text-gray-400 text-sm">
                        {isRegisterMode ? 'Crea una cuenta para comenzar' : 'Inicia sesión para continuar'}
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-surface-dark border border-white/5 rounded-2xl p-6 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Usuario
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500" style={{ fontSize: '20px' }}>
                                    person
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Ingresa tu usuario"
                                    className="w-full bg-background-dark border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Contraseña
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500" style={{ fontSize: '20px' }}>
                                    lock
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Ingresa tu contraseña"
                                    className="w-full bg-background-dark border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Confirm Password Field (Register Mode Only) */}
                        {isRegisterMode && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirmar Contraseña
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500" style={{ fontSize: '20px' }}>
                                        lock
                                    </span>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirma tu contraseña"
                                        className="w-full bg-background-dark border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                                        {isRegisterMode ? 'person_add' : 'login'}
                                    </span>
                                    {isRegisterMode ? 'Crear cuenta' : 'Iniciar sesión'}
                                </>
                            )}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-6 pt-6 border-t border-white/5 text-center">
                        <p className="text-gray-400 text-sm">
                            {isRegisterMode ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
                            <button
                                onClick={toggleMode}
                                className="text-primary hover:text-indigo-400 font-medium ml-2 transition-colors"
                                disabled={isLoading}
                            >
                                {isRegisterMode ? 'Inicia sesión' : 'Regístrate'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-600 mt-6">
                    Los datos se almacenan localmente en tu navegador
                </p>
                <p className="text-center text-xs text-green-500 mt-2">
                    v2.1 - Build actualizado
                </p>
            </div>
        </div>
    );
};
