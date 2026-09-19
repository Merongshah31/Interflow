import React, { useState } from 'react';
import { X, Save, LogOut, Check, Plus, Tag, FileText, Briefcase, User, ShieldCheck } from 'lucide-react';
import type { UserProfile } from './AuthGate';
import { API_BASE_URL } from '../config';

interface ProfileEditModalProps {
  user: UserProfile;
  onClose: () => void;
  onSave: (updated: UserProfile) => void;
  onSignOut: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  user,
  onClose,
  onSave,
  onSignOut
}) => {
  const [name, setName] = useState<string>(user.name || '');
  const [headline, setHeadline] = useState<string>(user.headline || 'Software Engineering');
  const [skills, setSkills] = useState<string[]>(
    user.skills && user.skills.length > 0 ? user.skills : ['React', 'TypeScript', 'Python', 'FastAPI']
  );
  const [newSkill, setNewSkill] = useState<string>('');
  const [resumeText, setResumeText] = useState<string>(user.resume_text || '');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const updatedProfile: UserProfile = {
      ...user,
      name,
      headline,
      skills,
      resume_text: resumeText
    };

    try {
      await fetch(`${API_BASE_URL}/api/profile/me`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(user.user_id ? { 'X-User-Id': user.user_id } : {})
        },
        body: JSON.stringify(updatedProfile)
      });
      sessionStorage.setItem('internflow_user', JSON.stringify(updatedProfile));
      onSave(updatedProfile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3500,
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(28, 28, 30, 0.96)',
        backdropFilter: 'blur(30px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        width: '520px',
        maxWidth: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0, 0, 0, 0.75)',
        padding: '26px 28px',
        color: '#f5f5f7'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(0, 113, 227, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={16} color="#2997ff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>
                Profile & Career Settings
              </h2>
              <span style={{ fontSize: '0.72rem', color: '#86868b' }}>
                Synced with Google Single Sign-On
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#86868b',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Google User Identity Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '20px'
        }}>
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              referrerPolicy="no-referrer"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.16)',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0071e3, #5e5ce6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#ffffff'
            }}>
              {(name || user.name) ? (name || user.name)[0].toUpperCase() : 'U'}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#f5f5f7' }}>
                {name || user.name}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.64rem',
                color: '#30d158',
                background: 'rgba(48, 209, 88, 0.1)',
                padding: '2px 6px',
                borderRadius: '980px',
                fontWeight: 500
              }}>
                <ShieldCheck size={10} />
                Google Verified
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#86868b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit}>
          {/* Name Field */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.74rem', color: '#86868b', display: 'block', marginBottom: '5px' }}>
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f5f5f7',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Headline / Field of Study */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '0.74rem', color: '#86868b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              <Briefcase size={12} />
              <span>Headline / Field of Study</span>
            </label>
            <input
              type="text"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="e.g. Software Engineering, AI & Data Science"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f5f5f7',
                fontSize: '0.84rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Technical Skills Tags */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.74rem', color: '#86868b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
              <Tag size={12} />
              <span>Technical Skills (Used by Match Agent)</span>
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {skills.map(skill => (
                <span
                  key={skill}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    background: 'rgba(0, 113, 227, 0.12)',
                    border: '1px solid rgba(0, 113, 227, 0.25)',
                    color: '#64d2ff',
                    fontSize: '0.74rem',
                    fontWeight: 500
                  }}
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    style={{ background: 'transparent', border: 'none', color: '#64d2ff', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                placeholder="Add skill (e.g. Docker, PyTorch, Go)..."
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#f5f5f7',
                  fontSize: '0.78rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '6px',
                  color: '#f5f5f7',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Resume Snippet */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '0.74rem', color: '#86868b', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              <FileText size={12} />
              <span>Resume Snippet / Projects Overview</span>
            </label>
            <textarea
              rows={4}
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
              placeholder="Paste key achievements, projects, or degree summary..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#f5f5f7',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                lineHeight: 1.45
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                background: 'rgba(255, 69, 58, 0.1)',
                border: '1px solid rgba(255, 69, 58, 0.25)',
                color: '#ff453a',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '0.76rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '7px 14px', fontSize: '0.76rem' }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary"
                style={{
                  padding: '7px 16px',
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {savedSuccess ? (
                  <>
                    <Check size={14} color="#ffffff" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
