import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Lock,
  FileEdit,
  Send,
  Info
} from 'lucide-react';

export interface PendingAction {
  actionId: string;
  actionType: 'SEND_EMAIL' | 'SUBMIT_APPLICATION' | 'CALENDAR_INVITE';
  title: string;
  description: string;
  recipient: string;
  payload: {
    recipient?: string;
    subject?: string;
    body?: string;
    summary?: string;
    description?: string;
    duration_minutes?: number;
    apiEndpoint: string;
    delivery_mode?: 'direct' | 'draft';
  };
}

interface HITLGatewayModalProps {
  pendingActions: PendingAction[];
  onApprove: (actionId: string, options?: { delivery_mode?: 'direct' | 'draft'; body?: string }) => void;
  onReject: (actionId: string) => void;
  onClose: () => void;
  isGoogleConnected?: boolean;
  googleEmail?: string;
}

export const HITLGatewayModal: React.FC<HITLGatewayModalProps> = ({
  pendingActions,
  onApprove,
  onReject,
  onClose,
  isGoogleConnected = false,
  googleEmail = ''
}) => {
  const [selectedActionId, setSelectedActionId] = useState<string>(
    pendingActions.length > 0 ? pendingActions[0].actionId : ''
  );
  
  const currentAction = pendingActions.find(a => a.actionId === selectedActionId) || pendingActions[0];

  const [editedBody, setEditedBody] = useState<string>(
    currentAction?.payload.body || ''
  );

  if (pendingActions.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(28, 28, 30, 0.92)',
          backdropFilter: 'blur(30px)',
          padding: '32px',
          borderRadius: '18px',
          width: '420px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(48, 209, 88, 0.14)',
            border: '1px solid rgba(48, 209, 88, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px'
          }}>
            <CheckCircle2 size={24} color="#30d158" />
          </div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#f5f5f7', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            All Actions Reviewed
          </h3>
          <p style={{ color: '#86868b', fontSize: '0.8rem', marginBottom: '18px', lineHeight: '1.4' }}>
            No pending side-effects queued. All action agent requests have been executed or dismissed.
          </p>
          <button onClick={onClose} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'rgba(28, 28, 30, 0.94)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderRadius: '18px',
        padding: '20px 18px',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
        boxSizing: 'border-box'
      }}>
        
        {/* Apple macOS Warning Banner */}
        <div style={{
          background: 'rgba(255, 69, 58, 0.1)',
          border: '1px solid rgba(255, 69, 58, 0.22)',
          borderRadius: '12px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '18px'
        }}>
          <ShieldAlert size={20} color="#ff453a" />
          <div>
            <div style={{ color: '#ff453a', fontWeight: '600', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Execution Approval Required</span>
              <Lock size={12} color="#ff453a" />
            </div>
            <p style={{ fontSize: '0.74rem', color: '#a1a1a6', margin: '2px 0 0 0' }}>
              Action agents pause consequential operations (email dispatch, calendar updates) until authorized by you.
            </p>
          </div>
        </div>

        {/* Action Details & Editor */}
        <div className="hitl-modal-grid">
          
          {/* Action List Sidebar */}
          <div className="hitl-queue-sidebar" style={{ borderRight: '1px solid var(--border-color)', paddingRight: '14px' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: '600', textTransform: 'uppercase', color: '#86868b', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Queue ({pendingActions.length})
            </span>
            <div className="hitl-queue-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {pendingActions.map(action => (
                <button
                  key={action.actionId}
                  onClick={() => {
                    setSelectedActionId(action.actionId);
                    setEditedBody(action.payload.body || '');
                  }}
                  style={{
                    textAlign: 'left',
                    background: action.actionId === currentAction.actionId ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: action.actionId === currentAction.actionId ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid transparent',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#f5f5f7',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontWeight: '500', marginBottom: '2px' }}>{action.title}</div>
                  <div style={{ fontSize: '0.68rem', color: '#86868b' }}>{action.actionType}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Inspection & Modification Panel */}
          <div>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '3px' }}>Target API Endpoint</span>
              <code style={{ fontSize: '0.72rem', color: '#2997ff', background: 'rgba(255, 255, 255, 0.04)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                {currentAction.payload.apiEndpoint}
              </code>
            </div>

            {currentAction.actionType === 'SEND_EMAIL' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '3px' }}>Recipient</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={currentAction.recipient}
                    style={{ width: '100%', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#f5f5f7', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '3px' }}>Subject</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={currentAction.payload.subject}
                    style={{ width: '100%', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#f5f5f7', fontSize: '0.8rem' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.72rem', color: '#86868b' }}>
                      Gmail Delivery Action
                    </label>
                    <span style={{ fontSize: '0.66rem', color: '#ff9f0a', fontWeight: 600, background: 'rgba(255, 159, 10, 0.12)', border: '1px solid rgba(255, 159, 10, 0.25)', padding: '1px 6px', borderRadius: '4px' }}>
                      Direct Send Disabled
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <button
                      type="button"
                      disabled
                      title="Direct email sending is currently disabled for safety"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '7px',
                        fontSize: '0.76rem',
                        fontWeight: 500,
                        cursor: 'not-allowed',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px dashed rgba(255, 255, 255, 0.1)',
                        color: '#636366',
                        opacity: 0.6
                      }}
                    >
                      <Send size={13} />
                      <span>Send Directly (Disabled)</span>
                    </button>
                    <button
                      type="button"
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '7px',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        cursor: 'default',
                        background: 'rgba(0, 113, 227, 0.18)',
                        border: '1px solid rgba(0, 113, 227, 0.45)',
                        color: '#64d2ff',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <FileEdit size={13} />
                      <span>Save as Gmail Draft (Active)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#86868b', display: 'block', marginBottom: '3px' }}>Draft Body (Editable)</label>
                  <textarea
                    rows={5}
                    value={editedBody}
                    onChange={e => setEditedBody(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      color: '#f5f5f7',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-sans)',
                      outline: 'none',
                      lineHeight: '1.4'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Google Workspace Connection Banner */}
            <div style={{
              marginTop: '14px',
              padding: '9px 12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.73rem',
              background: 'rgba(0, 113, 227, 0.08)',
              border: '1px solid rgba(0, 113, 227, 0.25)',
              color: '#64d2ff',
              gap: '7px'
            }}>
              <Info size={14} style={{ flexShrink: 0 }} />
              <span>
                {isGoogleConnected 
                  ? `Live direct dispatch disabled for safety. Approving will create an editable draft in your Gmail account (${googleEmail}) without sending.`
                  : `Google Workspace disconnected — connect via header to save drafts directly into Gmail.`}
              </span>
            </div>

            {/* Decision Buttons — Apple Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button 
                onClick={() => onReject(currentAction.actionId)}
                className="btn-danger"
              >
                <XCircle size={14} />
                <span>Dismiss</span>
              </button>

              <button 
                onClick={() => onApprove(currentAction.actionId, { delivery_mode: 'draft', body: editedBody })}
                className="btn-primary"
                style={{ background: '#0071e3', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FileEdit size={14} />
                <span>
                  {currentAction.actionType === 'SEND_EMAIL'
                    ? 'Save as Gmail Draft' 
                    : 'Approve Action'}
                </span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
