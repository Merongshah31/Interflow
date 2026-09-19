import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import type { NavTabType } from './components/Sidebar';
import { Header } from './components/Header';
import { PipelineTable } from './components/PipelineTable';
import type { Internship } from './components/PipelineTable';

import { CompanyMap } from './components/CompanyMap';
import { AIChatbotWidget } from './components/AIChatbotWidget';
import { HITLGatewayModal } from './components/HITLGatewayModal';
import type { PendingAction } from './components/HITLGatewayModal';
import { AuthGate } from './components/AuthGate';
import type { UserProfile } from './components/AuthGate';
import { ProfileEditModal } from './components/ProfileEditModal';
import { API_BASE_URL } from './config';

const INITIAL_INTERNSHIPS: Internship[] = [];

export const App: React.FC = () => {
  // User Profile & Authentication Gate
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem('internflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<NavTabType>('pipeline');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showHITLModal, setShowHITLModal] = useState<boolean>(false);
  const [internships, setInternships] = useState<Internship[]>(INITIAL_INTERNSHIPS);

  // Keyboard shortcut: Cmd+B / Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Human-in-the-Loop Pending Queue
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([
    {
      actionId: 'act-gmail-grab',
      actionType: 'SEND_EMAIL',
      title: 'Gmail Outreach: Grab Malaysia Recruiter',
      description: 'Send tailored email introduction highlighting Go, Microservices & Distributed Systems projects',
      recipient: 'recruitment.my@grab.com',
      payload: {
        subject: 'Software Engineer Intern Application',
        body: 'Hi Grab Malaysia University Relations,\n\nI am writing to express my enthusiastic interest in the Software Engineer Intern (Core Services) opening. Having built distributed microservices in Go and backend platforms, I would love the opportunity to contribute to Grab tech infrastructure.\n\nBest regards,\nApplicant',
        apiEndpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
      }
    }
  ]);

  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());

  // Synchronize live pipeline with FastAPI backend (per-user isolated status)
  const currentUserId = currentUser?.user_id;
  const fetchLivePipeline = React.useCallback(async () => {
    try {
      const url = currentUserId 
        ? `${API_BASE_URL}/api/internships?user_id=${encodeURIComponent(currentUserId)}`
        : `${API_BASE_URL}/api/internships`;
      const res = await fetch(url, {
        headers: currentUserId ? { 'X-User-Id': currentUserId } : {}
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Strict user gate: only approved roles appear at React (user)
          const approvedList = data.filter((item: any) => item.is_approved === true);
          const mapped: Internship[] = approvedList.map((item: any) => ({
            id: item.id,
            company: item.company,
            companyLogoBg: item.companyLogoBg || '#1c1c1e',
            companyLogoText: item.companyLogoText || (item.company ? item.company[0] : 'C'),
            role: item.role,
            status: item.status,
            deadline: item.deadline || '10/30/2026',
            matchScore: item.match_score ?? 85,
            matchTier: item.match_tier || 'High Match',
            aiReadiness: item.ai_readiness || 'Skills Ready',
            jobUrl: item.job_url || 'https://www.jobstreet.com.my',
            resource: (item.resource || item.source_name || 'Company Portal') as Internship['resource'],
            workMode: item.work_mode || 'Hybrid',
            salary: item.salary || 'Salary not stated',
            location: item.location || 'Kuala Lumpur, Malaysia',
            description: item.description || item.source_evidence || 'Description unavailable from source',
            sourceTitle: item.source_title || '',
            sourceEvidence: item.source_evidence || '',
            employmentType: item.employment_type || 'Employment type not stated',
            confidence: item.confidence,
            contactEmail: item.contact_email || item.contactEmail || `careers@${(item.company || '').toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            requiredSkills: item.required_skills || item.requiredSkills || [],
            coordinates: item.coordinates || (item.lat && item.lng ? { lat: Number(item.lat), lng: Number(item.lng) } : undefined),
            updatedAt: item.updated_at || item.updatedAt || item.created_at || item.createdAt || new Date().toISOString(),
            createdAt: item.created_at || item.createdAt || new Date().toISOString()
          }));
          // frontend safety: dedupe by company+role in case backend still has legacy duplicates
          const seen = new Set<string>();
          const deduped = mapped.filter(m => {
            const k = `${m.company.toLowerCase()}|${m.role.toLowerCase()}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
          setInternships(deduped);
          setLastSyncedAt(new Date());
        }
      }
    } catch {
      // Backend unavailable, preserve offline dataset
    }
  }, [currentUserId]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      await fetchLivePipeline();
    };
    if (active) {
      void load();
    }
    return () => {
      active = false;
    };
  }, [fetchLivePipeline]);

  const handleRetry = async () => {
    setIsRetrying(true);
    await fetchLivePipeline();
    setTimeout(() => setIsRetrying(false), 400);
  };

  const handleStatusChange = (id: string, newStatus: Internship['status']) => {
    // Optimistic UI update
    setInternships(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));

    // Persist to FastAPI backend with isolated user_id
    fetch(`${API_BASE_URL}/api/internships/${id}/status`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        ...(currentUser?.user_id ? { 'X-User-Id': currentUser.user_id } : {})
      },
      body: JSON.stringify({ 
        status: newStatus,
        user_id: currentUser?.user_id 
      })
    }).catch(() => {
      // Offline fallback
    });
  };


  // Sync profile details with backend (isolated by current user ID)
  useEffect(() => {
    if (!currentUserId) return;
    fetch(`${API_BASE_URL}/api/profile/me?user_id=${encodeURIComponent(currentUserId)}`, {
      headers: { 'X-User-Id': currentUserId }
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && (!data.user_id || data.user_id === currentUserId)) {
          const prof = data.profile || data;
          setCurrentUser(prev => {
            if (!prev || prev.user_id !== currentUserId) return prev;
            // Guard against cross-contamination: don't overwrite if email doesn't match
            if (prof.email && prev.email && prof.email.toLowerCase() !== prev.email.toLowerCase()) {
              console.warn('Ignoring profile update with mismatched email:', prof.email, 'vs', prev.email);
              return prev;
            }
            const merged: UserProfile = {
              ...prev,
              name: prof.name || prev.name,
              headline: prof.headline || prev.headline,
              avatar_url: prof.avatar_url || prev.avatar_url,
              skills: prof.skills && prof.skills.length > 0 ? prof.skills : prev.skills,
              resume_text: prof.resume_text || prev.resume_text
            };
            sessionStorage.setItem('internflow_user', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [currentUserId]);

  const handleSignOut = () => {
    sessionStorage.removeItem('internflow_user');
    localStorage.removeItem('internflow_user');
    setCurrentUser(null);
    setShowProfileModal(false);
    setGoogleStatus({ connected: false, email: '' });
    setInternships([]);
  };

  const handleSaveProfile = (updated: UserProfile) => {
    setCurrentUser(updated);
    sessionStorage.setItem('internflow_user', JSON.stringify(updated));
  };

  const handleUpdateContactEmail = async (listingId: string, newEmail: string) => {
    const targetItem = internships.find(i => i.id === listingId);
    const companyName = targetItem?.company;

    // 1. Optimistic update in table
    setInternships(prev => prev.map(item => item.id === listingId ? { ...item, contactEmail: newEmail } : item));

    // 2. Synchronize any pending HITL draft actions targeting this company or role
    if (companyName) {
      setPendingActions(prev => prev.map(action => {
        const matches = action.title.toLowerCase().includes(companyName.toLowerCase()) ||
          action.description.toLowerCase().includes(companyName.toLowerCase()) ||
          action.recipient.toLowerCase().includes(companyName.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (matches) {
          return {
            ...action,
            recipient: newEmail,
            payload: {
              ...action.payload,
              recipient: newEmail
            }
          };
        }
        return action;
      }));
    }

    // 3. Persist to backend
    try {
      await fetch(`${API_BASE_URL}/api/internships/${listingId}/email`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_email: newEmail })
      });
    } catch {
      // Offline fallback
    }
  };

  const handleTriggerOutreachFromMap = (companyData: { company: string; role: string; matchScore: number; contactEmail?: string }) => {
    const applicantName = currentUser?.name || 'Applicant';
    const recipientEmail = companyData.contactEmail || `careers@${companyData.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const newAction: PendingAction = {
      actionId: `act-map-${Date.now()}`,
      actionType: 'SEND_EMAIL',
      title: `Gmail Outreach: ${companyData.company}`,
      description: `Draft tailored cold application email for ${companyData.role}`,
      recipient: recipientEmail,
      payload: {
        subject: `Application for ${companyData.role} - ${applicantName}`,
        body: `Hi ${companyData.company} Recruiting Team,\n\nI am submitting my application for the ${companyData.role} internship role in Malaysia. My qualifications match ${companyData.matchScore}% of target technical criteria.\n\nBest regards,\n${applicantName}`,
        apiEndpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        recipient: recipientEmail
      }
    };
    setPendingActions(prev => [newAction, ...prev]);
    setShowHITLModal(true);
  };

  const handleAddListing = async (newListing: Internship) => {
    setInternships([newListing, ...internships]);
    try {
      await fetch(`${API_BASE_URL}/api/internships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: newListing.company,
          role: newListing.role,
          deadline: newListing.deadline,
          work_mode: newListing.workMode,
          resource: newListing.resource,
          salary: newListing.salary,
          location: newListing.location,
          job_url: newListing.jobUrl,
          contact_email: newListing.contactEmail,
          is_approved: true
        })
      });
    } catch {
      // Offline fallback
    }
  };

  const handleTriggerOutreach = (item: Internship) => {
    const applicantName = currentUser?.name || 'Applicant';
    const recipientEmail = item.contactEmail || `careers@${item.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
    const newAction: PendingAction = {
      actionId: `act-${Date.now()}`,
      actionType: 'SEND_EMAIL',
      title: `Gmail Outreach: ${item.company}`,
      description: `Draft tailored cold application email for ${item.role}`,
      recipient: recipientEmail,
      payload: {
        subject: `Application for ${item.role} - ${applicantName}`,
        body: `Hi ${item.company} Recruiting,\n\nI am submitting my application for ${item.role}. My technical profile matches ${item.matchScore}% of target requirements.\n\nBest regards,\n${applicantName}`,
        apiEndpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        recipient: recipientEmail
      }
    };
    setPendingActions([newAction, ...pendingActions]);
    setShowHITLModal(true);
  };

  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; email: string }>({
    connected: false,
    email: ''
  });

  const handleGoogleStatusChange = (st: any) => {
    setGoogleStatus({ connected: !!st.connected, email: st.email || '' });
    if (st.connected && st.email) {
      setCurrentUser(prev => {
        if (!prev) return null;
        // Strict guard: NEVER overwrite current user identity if email from status doesn't match!
        if (prev.email && st.email.toLowerCase() !== prev.email.toLowerCase()) {
          console.warn('Ignoring Google status from different account:', st.email, 'vs current:', prev.email);
          return prev;
        }
        const updated: UserProfile = {
          ...prev,
          is_google_connected: true,
          avatar_url: st.avatar_url || prev.avatar_url,
          name: prev.name || st.name
        };
        sessionStorage.setItem('internflow_user', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleApproveHITL = async (actionId: string, options?: { delivery_mode?: 'direct' | 'draft'; body?: string }) => {
    try {
      await fetch(`${API_BASE_URL}/api/hitl/approve/${actionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {})
      });
    } catch (e) {
      console.error('Approve HITL error:', e);
    }
    setPendingActions(prev => prev.filter(a => a.actionId !== actionId));
  };

  const handleRejectHITL = async (actionId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/hitl/reject/${actionId}`, {
        method: 'POST'
      });
    } catch (e) {
      console.error('Reject HITL error:', e);
    }
    setPendingActions(prev => prev.filter(a => a.actionId !== actionId));
  };

  // Mandatory Authentication Gate: if user is not authenticated, present frosted glass Google SSO screen
  if (!currentUser) {
    return (
      <AuthGate
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Left Sidebar Layout */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(prev => !prev)}
      />

      {/* Main Content Workspace */}
      <div className="main-wrapper">
        {/* Top Header */}
        <Header
          pendingHITLCount={pendingActions.length}
          onOpenHITL={() => setShowHITLModal(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          activeTab={activeTab}
          onGoogleStatusChange={handleGoogleStatusChange}
          user={currentUser}
          onOpenProfileModal={() => setShowProfileModal(true)}
        />

        {/* Content Body */}
        <main className="content-body">
          {activeTab === 'pipeline' && (
            <PipelineTable
              internships={internships}
              onTriggerOutreach={handleTriggerOutreach}
              onAddListing={handleAddListing}
              onStatusChange={handleStatusChange}
              onRetry={handleRetry}
              isRetrying={isRetrying}
              lastSyncedAt={lastSyncedAt}
              onUpdateContactEmail={handleUpdateContactEmail}
            />
          )}

          {activeTab === 'map' && (
            <CompanyMap
              internships={internships}
              onTriggerOutreach={handleTriggerOutreachFromMap}
              onRetry={handleRetry}
              isRetrying={isRetrying}
              lastSyncedAt={lastSyncedAt}
            />
          )}

          {/* Interactive AI Career Coach Chatbot Widget */}
          <AIChatbotWidget />

          {/* Human-in-the-Loop Execution Modal Overlay */}
          {showHITLModal && (
            <HITLGatewayModal
              pendingActions={pendingActions}
              onApprove={handleApproveHITL}
              onReject={handleRejectHITL}
              onClose={() => setShowHITLModal(false)}
              isGoogleConnected={googleStatus.connected}
              googleEmail={googleStatus.email}
            />
          )}

          {/* Profile Customization Modal */}
          {showProfileModal && currentUser && (
            <ProfileEditModal
              user={currentUser}
              onClose={() => setShowProfileModal(false)}
              onSave={handleSaveProfile}
              onSignOut={handleSignOut}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
