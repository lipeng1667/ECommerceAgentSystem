import { LockOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Space, Spin, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { kioskGatewayApi, KioskGatewayNotConfiguredError, type KioskSession } from '../api/kioskGateway';
import { useI18n } from '../app/i18n';

export interface PlatformLoginStreamPlatform {
  key: string;
  name: string;
  /** Merchant-backend login URL the remote kiosk browser opens, e.g. mms.pinduoduo.com/login. */
  loginUrl: string;
}

interface PlatformLoginStreamModalProps {
  open: boolean;
  onClose: () => void;
  /** Fires once the gateway confirms an auth cookie landed (logged_in/captured/closed). */
  onSuccess: () => void;
  userId: string;
  /** Opaque handle binding this login session to a profile on the gateway host. */
  sessionStoreId: string;
  platform: PlatformLoginStreamPlatform;
}

type Phase = 'requesting' | 'streaming' | 'success' | 'error';

const POLL_INTERVAL_MS = 3000;
const TERMINAL_OK_STATES = new Set(['logged_in', 'capturing', 'captured', 'closed']);
const TERMINAL_FAIL_STATES = new Set(['timeout', 'failed']);

/**
 * Embeds the kiosk-gateway's own /login-stream page (CDP screencast canvas +
 * input relay, built server-side per docs/pdd-login-method2.md) so the user
 * can hand-complete a real platform login. This component only brokers the
 * session token and polls completion status — it does not reimplement the
 * streaming protocol.
 */
export function PlatformLoginStreamModal({ open, onClose, onSuccess, userId, sessionStoreId, platform }: PlatformLoginStreamModalProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>('requesting');
  const [session, setSession] = useState<KioskSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const requestSession = async () => {
    setPhase('requesting');
    setErrorMessage(null);
    try {
      const created = await kioskGatewayApi.createSession({ userId, storeId: sessionStoreId, loginUrl: platform.loginUrl });
      setSession(created);
      setPhase('streaming');
    } catch (err) {
      setSession(null);
      setPhase('error');
      setErrorMessage(
        err instanceof KioskGatewayNotConfiguredError
          ? t('storewizard.pddGatewayNotConfigured')
          : t('storewizard.pddSessionRequestFailed'),
      );
    }
  };

  useEffect(() => {
    if (open) requestSession();
    // Only (re-)request when the modal opens; retries go through requestSession() directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || phase !== 'streaming') return;
    let cancelled = false;
    const poll = async () => {
      try {
        const status = await kioskGatewayApi.getStatus(sessionStoreId);
        if (cancelled) return;
        if (TERMINAL_OK_STATES.has(status.state)) {
          setPhase('success');
        } else if (TERMINAL_FAIL_STATES.has(status.state)) {
          setPhase('error');
          setErrorMessage(t('storewizard.pddLoginTimeout'));
        }
      } catch {
        // Transient network hiccup — keep polling rather than failing the session on one miss.
      }
    };
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    poll();
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [open, phase, sessionStoreId, t]);

  useEffect(() => {
    if (phase !== 'success') return;
    const timer = window.setTimeout(() => onSuccessRef.current(), 1200);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={860}
      destroyOnClose
      maskClosable={false}
      title={
        <Space>
          <LockOutlined /> {t('storewizard.pddLoginTitle', { platform: platform.name })}
        </Space>
      }
    >
      {phase === 'requesting' && (
        <div className="pdd-login-stream-loading">
          <Spin />
          <Typography.Text type="secondary">{t('storewizard.pddRequestingSession')}</Typography.Text>
        </div>
      )}
      {phase === 'error' && (
        <Alert
          type="error"
          showIcon
          message={t('storewizard.pddLoginFailedTitle')}
          description={errorMessage}
          action={
            <Button size="small" danger onClick={requestSession}>
              {t('storewizard.retryAuth')}
            </Button>
          }
        />
      )}
      {phase === 'streaming' && session && (
        <>
          <Alert type="info" showIcon message={t('storewizard.pddStreamHint')} style={{ marginBottom: 12 }} />
          <div className="pdd-login-stream-frame">
            <iframe src={kioskGatewayApi.loginStreamUrl(session.token)} title={`${platform.name} login`} />
          </div>
          <div className="pdd-login-stream-footnote">
            <SafetyCertificateOutlined /> {t('storewizard.pddStreamFootnote')}
          </div>
        </>
      )}
      {phase === 'success' && (
        <Alert type="success" showIcon message={t('storewizard.pddLoginSuccessTitle')} description={t('storewizard.pddLoginSuccessDesc')} />
      )}
    </Modal>
  );
}
