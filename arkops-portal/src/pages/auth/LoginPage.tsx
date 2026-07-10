import { LockOutlined, PlayCircleOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Form, Input, Segmented, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useDemoMode } from '../../app/demoMode';
import { useI18n } from '../../app/i18n';

export function LoginPage() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useI18n();
  const { enterDemo } = useDemoMode();

  const handleDemoLogin = () => {
    enterDemo();
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <Segmented
          size="small"
          value={language}
          onChange={(value) => setLanguage(value as 'en' | 'zh')}
          options={[
            { label: 'EN', value: 'en' },
            { label: '中文', value: 'zh' }
          ]}
          style={{ marginBottom: 16 }}
        />
        <Typography.Title level={2}>{t('login.title')}</Typography.Title>
        <Typography.Paragraph type="secondary">{t('login.description')}</Typography.Paragraph>
        <Form layout="vertical" initialValues={{ email: 'lipeng@example.com', password: 'demo123456' }}>
          <Form.Item label={t('login.email')} name="email">
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item label={t('login.password')} name="password">
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Button type="primary" block size="large" onClick={() => navigate('/dashboard')}>
            {t('login.submit')}
          </Button>
        </Form>

        <Divider plain style={{ fontSize: 12, color: '#94a3b8' }}>{t('login.or')}</Divider>

        <Button
          block
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={handleDemoLogin}
          style={{
            borderColor: '#2563eb',
            color: '#2563eb',
            fontWeight: 500,
          }}
        >
          {t('login.demoEntry')}
        </Button>
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 8, fontSize: 11 }}>
          {t('login.demoEntryDesc')}
        </Typography.Text>
      </Card>
    </div>
  );
}
