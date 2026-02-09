import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { APP_BASE_URL } from '../config';

const SYSTEM_TEMPLATES = [
    { name: "Lettuce (Butterhead)", targetPh: 6.0, targetTds: 600, targetTemp: 20 },
    { name: "Basil (Genovese)", targetPh: 6.2, targetTds: 800, targetTemp: 22 },
    { name: "Tomato (Cherry)", targetPh: 6.5, targetTds: 1500, targetTemp: 24 },
    { name: "Spinach", targetPh: 6.0, targetTds: 1200, targetTemp: 18 },
    { name: "Strawberry", targetPh: 5.8, targetTds: 900, targetTemp: 21 },
    { name: "Kale (Curly)", targetPh: 6.3, targetTds: 1100, targetTemp: 19 },
    { name: "Peppers (Bell)", targetPh: 6.2, targetTds: 1400, targetTemp: 25 },
    { name: "Mint (Peppermint)", targetPh: 6.5, targetTds: 700, targetTemp: 21 },
    { name: "Cucumber", targetPh: 6.0, targetTds: 1300, targetTemp: 23 },
    { name: "Coriander", targetPh: 6.5, targetTds: 750, targetTemp: 20 },
];

const Plants = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('userInfo')) || {};
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPlantModal, setShowPlantModal] = useState(false);
    const [editingPlantId, setEditingPlantId] = useState(null);
    
    const [formData, setFormData] = useState({ name: '', targetPh: '', targetTds: '', targetTemp: '' });

    const fetchPlants = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`${APP_BASE_URL}/api/plants`, config);
            setPlants(data);
            setLoading(false);
        } catch (error) {
            console.error('Fetch plants failed:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user.token) {
            fetchPlants();
        } else {
            navigate('/login');
        }
    }, [user.token, navigate]);

    const handleOpenModal = (plant = null) => {
        if (plant) {
            setEditingPlantId(plant._id);
            setFormData({
                name: plant.name,
                targetPh: plant.targetPh,
                targetTds: plant.targetTds,
                targetTemp: plant.targetTemp
            });
        } else {
            setEditingPlantId(null);
            setFormData({ name: '', targetPh: '', targetTds: '', targetTemp: '' });
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
                alert('Failed to delete plant');
            }
        }
    };

    const handleUseTemplate = async (template) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`${APP_BASE_URL}/api/plants`, {
                name: template.name,
                targetPh: template.targetPh,
                targetTds: template.targetTds,
                targetTemp: template.targetTemp
            }, config);
            fetchPlants();
        } catch (error) {
            alert('Failed to add template');
        }
    };

    return (
        <div className="container animate-fade-in">
            <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0' }}>Ecosystem Profiles</h1>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500, margin: '4px 0 0' }}>Target parameters for optimal cultivation</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary"
                    style={{ padding: '12px 24px' }}
                >
                    Define New Species
                </button>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>
                    Analyzing Genetics Library...
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    
                    {/* CUSTOM PLANTS SECTION */}
                    <section>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            Custom Definitions
                        </h2>
                        <div className="responsive-grid">
                            {plants.length === 0 ? (
                                <div className="card glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 2rem' }}>
                                    <p style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Library is empty.</p>
                                </div>
                            ) : (
                                plants.map(plant => {
                                    /* ICON HELPERS */
                                    const Icons = {
                                        pH: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M5 12h14"/></svg>,
                                        TDS: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
                                        TEMP: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/></svg>
                                    };

                                    return (
                                    <div key={plant._id} className="card glass-card plant-card-hover" style={{ padding: '1.25rem', border: '1px solid var(--glass-stroke)', position: 'relative', background: 'white' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>{plant.name}</h3>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.15rem' }}>Custom Configuration</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleOpenModal(plant)}
                                                    style={{ background: '#f8fafc', border: '1px solid var(--glass-stroke)', color: 'var(--text-main)', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800 }}
                                                >EDIT</button>
                                                <button 
                                                    onClick={() => handleDeletePlant(plant._id)}
                                                    style={{ background: '#f8fafc', border: '1px solid var(--glass-stroke)', color: 'var(--text-muted)', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 800 }}
                                                >DEL</button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                            <div style={{ padding: '0.75rem 0.5rem', background: 'var(--bg-canvas)', borderRadius: '10px', border: '1px solid var(--glass-stroke)', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                                                    {Icons.pH}
                                                    <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>pH</span>
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{plant.targetPh}</div>
                                            </div>
                                            <div style={{ padding: '0.75rem 0.5rem', background: 'var(--bg-canvas)', borderRadius: '10px', border: '1px solid var(--glass-stroke)', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                                                    {Icons.TDS}
                                                    <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TDS</span>
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{plant.targetTds}</div>
                                            </div>
                                            <div style={{ padding: '0.75rem 0.5rem', background: 'var(--bg-canvas)', borderRadius: '10px', border: '1px solid var(--glass-stroke)', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                                                    {Icons.TEMP}
                                                    <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TEMP</span>
                                                </div>
                                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{plant.targetTemp}<span style={{ fontSize: '0.75em' }}>°C</span></div>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })
                            )}
                        </div>
                    </section>




                    {/* SYSTEM PRESETS SECTION */}
                    <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                System Meta-Templates
                            </h2>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Verified configurations for industrial-grade hydroponics</p>
                        </div>
                        <div className="responsive-grid">
                            {SYSTEM_TEMPLATES.map((tmpl, idx) => (
                                <div key={idx} className="card glass-card" style={{ padding: '1.25rem', border: '1px solid var(--glass-stroke)', position: 'relative', background: 'white' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>{tmpl.name}</h3>
                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '0.15rem' }}>Standard Preset</div>
                                        </div>
                                        <button 
                                            onClick={() => handleUseTemplate(tmpl)}
                                            style={{ 
                                                background: 'var(--bg-canvas)', color: 'var(--primary)', border: '1px solid var(--glass-stroke)', 
                                                padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.65rem', 
                                                fontWeight: 800, cursor: 'pointer'
                                            }}
                                        >
                                            CLONE
                                        </button>
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
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setShowPlantModal(false)} className="btn" style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.85rem' }}>Discard</button>
                                <button className="btn btn-primary" type="submit" style={{ flex: 1.5, fontSize: '0.85rem' }}>
                                    {editingPlantId ? 'Save Changes' : 'Create Profile'}
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
