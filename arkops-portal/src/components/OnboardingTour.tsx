import { Button, Modal, Typography, Space } from 'antd';
import {
  AuditOutlined,
  RobotOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../app/i18n';

const TOUR_PENDING_KEY = 'allmall-daily-loop-tour-pending';

/**
 * Queue the daily-loop orientation tour. Called by the store-connection wizard
 * when the merchant finishes onboarding and heads to the dashboard, so the
 * tour appears exactly once at the moment the daily workspace opens
 * (it never pops over the wizard or a deep-linked approval).
 */
export function queueDailyLoopTour() {
  try {
    localStorage.setItem(TOUR_PENDING_KEY, 'true');
  } catch {
    // ignore
  }
}

function isTourPending(): boolean {
  try {
    return localStorage.getItem(TOUR_PENDING_KEY) === 'true';
  } catch {
    return false;
  }
}

function clearTourPending() {
  try {
    localStorage.removeItem(TOUR_PENDING_KEY);
  } catch {
    // ignore
  }
}

const stepIcons = [
  <AuditOutlined style={{ fontSize: 48, color: '#2563eb' }} />,
  <RobotOutlined style={{ fontSize: 48, color: '#7c3aed' }} />,
  <DashboardOutlined style={{ fontSize: 48, color: '#16a34a' }} />,
];

/**
 * Daily-loop orientation tour (repurposed from the legacy first-login modal).
 * Shows a 3-step introduction to the supervision loop — approvals, agents,
 * overview — right after the merchant completes store onboarding.
 */
export function OnboardingTour() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(() => isTourPending());
  const [step, setStep] = useState(0);

  // The tour is queued while the shell is already mounted, so re-check the
  // pending flag whenever the route changes (e.g. wizard → dashboard).
  useEffect(() => {
    if (!open && isTourPending()) {
      setOpen(true);
      setStep(0);
    }
  }, [location.pathname, open]);

  if (!open) return null;

  const steps = [
    {
      icon: stepIcons[0],
      title: t('onboarding.loop1Title'),
      desc: t('onboarding.loop1Desc'),
      action: () => navigate('/agents/approvals'),
    },
    {
      icon: stepIcons[1],
      title: t('onboarding.loop2Title'),
      desc: t('onboarding.loop2Desc'),
      action: () => navigate('/agents'),
    },
    {
      icon: stepIcons[2],
      title: t('onboarding.loop3Title'),
      desc: t('onboarding.loop3Desc'),
      action: () => navigate('/dashboard'),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      clearTourPending();
      setOpen(false);
      current.action();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    clearTourPending();
    setOpen(false);
  };

  return (
    <Modal
      open={open}
      onCancel={handleSkip}
      footer={null}
      width={480}
      centered
      closable={false}
      maskClosable={false}
    >
      <div style={{ textAlign: 'center', padding: '16px 0' }}>
        <div style={{ marginBottom: 24 }}>{current.icon}</div>
        <Typography.Title level={4}>{current.title}</Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          {current.desc}
        </Typography.Paragraph>

        <div style={{ marginBottom: 24 }}>
          {steps.map((_, i) => (
            <span
              key={i}
              style={{
                display: 'inline-block',
                width: i === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === step ? '#2563eb' : '#d1d5db',
                margin: '0 4px',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </div>

        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 16 }}>
          {t('onboarding.step', { current: step + 1, total: steps.length })}
        </Typography.Text>

        <Space>
          <Button onClick={handleSkip}>{t('onboarding.skip')}</Button>
          {step > 0 && (
            <Button onClick={() => setStep(step - 1)}>{t('onboarding.prev')}</Button>
          )}
          <Button type="primary" onClick={handleNext} icon={isLast ? <CheckCircleOutlined /> : undefined}>
            {isLast ? t('onboarding.done') : t('onboarding.next')}
          </Button>
        </Space>
      </div>
    </Modal>
  );
}
