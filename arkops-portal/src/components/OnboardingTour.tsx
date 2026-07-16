import { Button, Modal, Typography, Space } from 'antd';
import {
  ShopOutlined,
  RobotOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../app/i18n';

const ONBOARDING_KEY = 'allmall-onboarding-completed';

/** Check if onboarding has been completed */
export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem(ONBOARDING_KEY);
}

/** Mark onboarding as completed */
export function completeOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}

const stepIcons = [
  <ShopOutlined style={{ fontSize: 48, color: '#2563eb' }} />,
  <RobotOutlined style={{ fontSize: 48, color: '#7c3aed' }} />,
  <DashboardOutlined style={{ fontSize: 48, color: '#16a34a' }} />,
];

/**
 * First-time user onboarding modal.
 * Shows a 3-step introduction on first login.
 * Can be skipped or completed.
 */
export function OnboardingTour() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(() => shouldShowOnboarding());
  const [step, setStep] = useState(0);

  if (!open) return null;

  const steps = [
    {
      icon: stepIcons[0],
      title: t('onboarding.step1Title'),
      desc: t('onboarding.step1Desc'),
      action: () => navigate('/setup'),
    },
    {
      icon: stepIcons[1],
      title: t('onboarding.step2Title'),
      desc: t('onboarding.step2Desc'),
      action: () => navigate('/agents'),
    },
    {
      icon: stepIcons[2],
      title: t('onboarding.step3Title'),
      desc: t('onboarding.step3Desc'),
      action: () => navigate('/dashboard'),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      setOpen(false);
      current.action();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
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
