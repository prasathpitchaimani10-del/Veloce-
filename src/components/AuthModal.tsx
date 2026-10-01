import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register, quickLogin } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const res = await login(email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.message || 'Invalid email or password.');
        }
      } else {
        const res = await register(name, email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.message || 'Registration failed.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'customer' | 'admin') => {
    setError(null);
    setLoading(true);
    try {
      await quickLogin(role);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-neutral-900">
              {mode === 'signin' ? 'Sign In to Veloce' : 'Create Customer Account'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Secure authentication with salted bcrypt hashing and JWT.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Credentials Bar */}
        <div className="p-3 bg-neutral-100 rounded-xl space-y-1.5 text-xs">
          <span className="font-mono font-medium text-neutral-600 block">
            Instant Test Accounts:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('customer')}
              className="py-1.5 px-2 bg-white rounded-lg border border-neutral-200 font-semibold text-neutral-800 hover:bg-neutral-50 text-left shadow-2xs"
            >
              <div className="text-[11px] font-bold text-neutral-900">Customer</div>
              <div className="text-[10px] font-mono text-neutral-500 truncate">
                alex@example.com
              </div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="py-1.5 px-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 text-left shadow-2xs"
            >
              <div className="text-[11px] font-bold flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </div>
              <div className="text-[10px] font-mono text-neutral-300 truncate">
                admin@veloce.com
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Password (min 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-neutral-900 text-white rounded-xl font-semibold text-xs hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-xs"
          >
            {loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Mode Toggle */}
        <div className="text-center pt-2 border-t border-neutral-100">
          {mode === 'signin' ? (
            <p className="text-xs text-neutral-500">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className="text-neutral-900 font-semibold underline underline-offset-2"
              >
                Create one now
              </button>
            </p>
          ) : (
            <p className="text-xs text-neutral-500">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                }}
                className="text-neutral-900 font-semibold underline underline-offset-2"
              >
                Sign in instead
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
