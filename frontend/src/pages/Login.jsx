import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { APP_BASE_URL } from '../config';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await axios.post(`${APP_BASE_URL}/api/users/login`, formData);
            
            // SAVE USER INFO - CRITICAL FIX
            localStorage.setItem('userInfo', JSON.stringify(data));

            if (data.role === 'admin') {
                navigate('/admin-dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login Error:', error.response?.data?.message || error.message);
            alert(error.response?.data?.message || 'Login Failed');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                {/* Title */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Welcome Back</h1>
                    <p>Login to your account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="form-input"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}>
                        Login
                    </button>
                </form>

                {/* Secondary Nav */}
                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/signup" className="link">Sign Up</Link>
                </div>
                
                {/* Demo Login Section */}
                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-stroke)' }}>
                    <p style={{ fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 500 }}>Demo Login</p>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            type="button" 
                            className="btn btn-secondary btn-full"
                            style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                            onClick={() => setFormData({ email: 'admin@example.com', password: 'password123' })}
                        >
                            Admin
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-secondary btn-full"
                            style={{ padding: '0.5rem', fontSize: '0.85rem' }}
                            onClick={() => setFormData({ email: 'user@example.com', password: 'password123' })}
                        >
                            User
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
