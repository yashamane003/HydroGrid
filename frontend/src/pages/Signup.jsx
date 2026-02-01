import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            const { data } = await axios.post('http://localhost:5000/api/users/register', {
                name: formData.name,
                email: formData.email,
                password: formData.password
            });
            localStorage.setItem('userInfo', JSON.stringify(data));
            navigate('/dashboard');
        } catch (error) {
            console.error('Signup Error:', error.response?.data?.message || error.message);
            alert(error.response?.data?.message || 'Registration Failed');
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                {/* Title */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create Account</h1>
                    <p>Join HydroMonitor today</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                     <div className="form-group">
                        <label className="form-label" htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
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
                    
                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            className="form-input"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}>
                        Sign Up
                    </button>
                </form>

                {/* Secondary Nav */}
                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" className="link">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
