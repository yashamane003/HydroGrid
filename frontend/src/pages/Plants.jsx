import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { APP_BASE_URL } from '../config';

// SYSTEM_TEMPLATES now fetched from DB for admins

const Plants = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('userInfo')) || {};
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPlantModal, setShowPlantModal] = useState(false);
    const [editingPlantId, setEditingPlantId] = useState(null);
    
    const [formData, setFormData] = useState({ name: '', targetPh: '', targetTds: '', targetTemp: '', usage: '', isSystem: false });

    const fetchPlants = useCallback(async () => {
        if (!user.token) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${APP_BASE_URL}/api/plants`, config);
            setPlants(data);
            setLoading(false);
        } catch (error) {
            console.error('Fetch plants failed:', error);
            setLoading(false);
        }
    }, [user.token]);

    useEffect(() => {
        if (user.token) {
            fetchPlants();
        } else {
            navigate('/login');
        }
    }, [fetchPlants, navigate, user.token]);

    const handleOpenModal = (plant = null) => {
        if (plant) {
            setEditingPlantId(plant._id);
            setFormData({
                name: plant.name,
                targetPh: plant.targetPh,
                targetTds: plant.targetTds,
                targetTemp: plant.targetTemp,
                usage: plant.usage || '',
                isSystem: plant.isSystem || false
            });
        } else {
            setEditingPlantId(null);
            setFormData({ name: '', targetPh: '', targetTds: '', targetTemp: '', usage: '', isSystem: false });
        }
        setShowPlantModal(true);
    };

    const handleSavePlant = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            if (editingPlantId) {
                await axios.put(`${APP_BASE_URL}/api/plants/${editingPlantId}`, formData, config);
            } else {
                await axios.post(`${APP_BASE_URL}/api/plants`, formData, config);
            }
            setShowPlantModal(false);
            fetchPlants();
        } catch (error) {
            console.error('Save plant failed:', error);
            alert('Failed to save plant');
        }
    };

    const handleDeletePlant = async (id) => {
        if (window.confirm('Remove this configuration permanently?')) {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                await axios.delete(`${APP_BASE_URL}/api/plants/${id}`, config);
                fetchPlants();
            } catch (error) {
                console.error('Delete plant failed:', error);
                alert('Failed to delete plant');
            }
        }
    };

    const handleUseTemplate = (tmpl) => {
        setEditingPlantId(null);
        setFormData({
            name: `${tmpl.name} Profile`,
            targetPh: tmpl.targetPh,
            targetTds: tmpl.targetTds,
            targetTemp: tmpl.targetTemp,
            usage: tmpl.usage || '',
            isSystem: false
        });
        setShowPlantModal(true);
    };



    const customPlants = plants.filter(p => !p.isSystem);
    const systemTemplates = plants.filter(p => p.isSystem);

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0' }}>Ecosystem Profiles</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500, margin: '4px 0 0' }}>Target parameters for optimal cultivation</p>
                </div>
                {user.role === 'admin' && (
                    <button 
                        onClick={() => handleOpenModal()}
                        className="btn btn-primary"
                        style={{ padding: '12px 24px' }}
                    >
                        Define New Species
                    </button>
                )}
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
                    Analyzing Genetics Library...
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    
                    {/* USER CUSTOM ECOSYSTEMS SECTION */}
                    {customPlants.length > 0 && (
                        <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>
                                    User Created Plants
                                </h2>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Personal profiles specific to your company's genetic library</p>
                            </div>
                            <div className="responsive-grid">
                                {customPlants.map((tmpl) => (
                                    <div key={tmpl._id} className="card glass-card" style={{ padding: '1.25rem', border: '1px solid var(--glass-stroke)', position: 'relative', background: 'white' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>{tmpl.name}</h3>
                                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.15rem' }}>User-Created Blueprint</div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 0 0', fontStyle: 'italic', lineHeight: '1.4' }}>{tmpl.usage}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleOpenModal(tmpl)}
                                                    style={{ background: '#f8fafc', border: '1px solid var(--glass-stroke)', color: 'var(--text-main)', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800 }}
                                                >EDIT</button>
                                                <button 
                                                    onClick={() => handleDeletePlant(tmpl._id)}
                                                    style={{ background: '#f8fafc', border: '1px solid var(--glass-stroke)', color: 'var(--text-muted)', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800 }}
                                                >DEL</button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>pH</div>
                                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{tmpl.targetPh}</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>TDS</div>
                                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{tmpl.targetTds}</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>TEMP</div>
                                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{tmpl.targetTemp}°</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* SYSTEM PRESETS SECTION */}
                    <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    System Meta-Templates
                                </h2>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Verified configurations for industrial-grade hydroponics</p>
                            </div>
                            <div className="responsive-grid">
                                {systemTemplates.map((tmpl) => (
                                    <div key={tmpl._id} className="card glass-card" style={{ padding: '1.25rem', border: '1px solid var(--glass-stroke)', position: 'relative', background: 'white' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>{tmpl.name}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.15rem' }}>
                                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Global Meta-Template</div>
                                                    {user.role === 'admin' && (
                                                        <div style={{ fontSize: '0.65rem', background: '#f0fdf4', color: '#166534', padding: '1px 6px', borderRadius: '4px', fontWeight: 800, border: '1px solid #dcfce7' }}>
                                                            {tmpl.userCount || 0} Users
                                                        </div>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '8px 0 0', fontStyle: 'italic', lineHeight: '1.4' }}>{tmpl.usage}</p>
                                            </div>
                                            {user.role === 'admin' && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => handleOpenModal(tmpl)}
                                                        style={{ background: '#f8fafc', border: '1px solid var(--glass-stroke)', color: 'var(--text-main)', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800 }}
                                                    >EDIT</button>
                                                    <button 
                                                        onClick={() => handleDeletePlant(tmpl._id)}
                                                        style={{ background: '#f8fafc', border: '1px solid var(--glass-stroke)', color: 'var(--text-muted)', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800 }}
                                                    >DEL</button>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>pH</div>
                                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{tmpl.targetPh}</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>TDS</div>
                                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{tmpl.targetTds}</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>TEMP</div>
                                                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>{tmpl.targetTemp}°</div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => handleUseTemplate(tmpl)}
                                                className="btn btn-primary"
                                                style={{ flex: 1, padding: '0.5rem', fontSize: '0.7rem', fontWeight: 800 }}
                                            >ADOPT PROFILE</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                </div>
            )}


            {showPlantModal && (
                <div className="modal-overlay">
                    <div className="card glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2rem', position: 'relative', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{editingPlantId ? 'Edit Blueprint' : 'New Blueprint'}</h2>
                                <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500, fontSize: '0.8rem' }}>Define your cultivation targets</p>
                            </div>
                            <button onClick={() => setShowPlantModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--text-muted)' }}>&times;</button>
                        </div>
                        <form onSubmit={handleSavePlant} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '0.35rem' }}>SPECIES / VARIETY NAME</label>
                                <input className="form-input" type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Genovese Basil" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '0.35rem' }}>TARGET pH</label>
                                    <input className="form-input" type="number" step="0.1" required value={formData.targetPh} onChange={e => setFormData({...formData, targetPh: e.target.value})} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '0.35rem' }}>TARGET TDS (ppm)</label>
                                    <input className="form-input" type="number" required value={formData.targetTds} onChange={e => setFormData({...formData, targetTds: e.target.value})} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '0.35rem' }}>TARGET TEMPERATURE (°C)</label>
                                <input className="form-input" type="number" step="0.1" required value={formData.targetTemp} onChange={e => setFormData({...formData, targetTemp: e.target.value})} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                                <label className="form-label" style={{ fontSize: '0.65rem', marginBottom: '0.35rem' }}>USAGE / DESCRIPTION</label>
                                <textarea className="form-input" value={formData.usage} onChange={e => setFormData({...formData, usage: e.target.value})} placeholder="Describe how this plant is used..." style={{ resize: 'vertical', minHeight: '80px' }} />
                            </div>
                            
                            {user.role === 'admin' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input 
                                        type="checkbox" 
                                        id="isSystem" 
                                        checked={formData.isSystem} 
                                        onChange={e => setFormData({...formData, isSystem: e.target.checked})} 
                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                    <label htmlFor="isSystem" style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600, cursor: 'pointer' }}>Global Meta-Template (Visible to all Admins)</label>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setShowPlantModal(false)} className="btn" style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>Discard</button>
                                <button className="btn btn-primary" type="submit" style={{ flex: 1.5, fontSize: '0.85rem' }}>
                                    {editingPlantId ? 'Save Changes' : (formData.isSystem ? 'Create Blueprint' : 'Create Profile')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            <style>{`
                @media (max-width: 480px) {
                    .plants-grid { grid-template-columns: 1fr !important; }
                }
                .plant-card-hover {
                    transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease !important;
                }
                .plant-card-hover:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.1), 0 4px 8px -4px rgba(0, 0, 0, 0.05) !important;
                    border-color: var(--primary) !important;
                }
            `}</style>
        </div>
    );
};

export default Plants;
