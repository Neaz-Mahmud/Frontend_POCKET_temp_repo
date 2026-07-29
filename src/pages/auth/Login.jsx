import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { GraduationCap, FolderLock, Megaphone, Users } from 'lucide-react';
import heroImg from '../../assets/hero.png';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(formData.identifier, formData.password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div className="auth-visual-brand">
          <span className="auth-visual-mark"><GraduationCap size={19} /></span>
          Pocket University
        </div>
        <div className="auth-visual-image">
          <img src={heroImg} alt="" />
        </div>
        <div className="auth-visual-copy">
          <h1>One place for every section, notice and file.</h1>
          <p>Sections, materials and notices — shared cleanly between students, teachers, and section admins.</p>
          <div className="auth-visual-points">
            <span className="auth-visual-point"><FolderLock size={14} /> Private storage</span>
            <span className="auth-visual-point"><Megaphone size={14} /> Section notices</span>
            <span className="auth-visual-point"><Users size={14} /> Shared materials</span>
          </div>
        </div>
      </div>

      <div className="auth-container">
        <div className="card auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-visual-mark"><GraduationCap size={19} /></span>
            Pocket University
          </div>

          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account</p>

          {error && <div className="alert alert-block alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email or Phone</label>
              <input
                type="text"
                required
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                placeholder="you@example.com or 01..."
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
