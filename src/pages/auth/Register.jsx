import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { GraduationCap, KeyRound, Zap, ShieldCheck } from 'lucide-react';
import heroImg from '../../assets/hero.png';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
    } catch (err) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors.map((e) => e.msg).join(', '));
      } else {
        setError(err.response?.data?.message || 'Registration failed');
      }
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
          <h1>Join your class in under a minute.</h1>
          <p>Create an account, then join a Section with its join code — materials and notices show up instantly.</p>
          <div className="auth-visual-points">
            <span className="auth-visual-point"><KeyRound size={14} /> Join with a code</span>
            <span className="auth-visual-point"><Zap size={14} /> Instant access</span>
            <span className="auth-visual-point"><ShieldCheck size={14} /> Admin approved</span>
          </div>
        </div>
      </div>

      <div className="auth-container">
        <div className="card auth-card">
          <div className="auth-mobile-brand">
            <span className="auth-visual-mark"><GraduationCap size={19} /></span>
            Pocket University
          </div>

          <h2 className="auth-title">Create account</h2>
          <p className="auth-subtitle">Join Pocket University</p>

          {error && <div className="alert alert-block alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>I am a...</label>
              <div className="role-toggle">
                <button
                  type="button"
                  className={formData.role === 'student' ? 'active' : ''}
                  onClick={() => setFormData({ ...formData, role: 'student' })}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={formData.role === 'teacher' ? 'active' : ''}
                  onClick={() => setFormData({ ...formData, role: 'teacher' })}
                >
                  Teacher
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                minLength="6"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password (min 6 chars)"
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Registering…' : 'Register'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
