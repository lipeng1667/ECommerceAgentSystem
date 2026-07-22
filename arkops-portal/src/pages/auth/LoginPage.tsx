import {
  ArrowRightOutlined,
  BarChartOutlined,
  CheckCircleFilled,
  LockOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Segmented, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useAuth } from '../../app/auth';
import { useDemoMode } from '../../app/demoMode';
import { LANGUAGE_SWITCHER_ENABLED, useI18n } from '../../app/i18n';
import { LOCAL_LOGIN_ACCOUNTS } from '../../app/loginAccounts';
import { completeOnboarding } from '../../components/OnboardingTour';

interface LoginValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { language, setLanguage } = useI18n();
  const { login } = useAuth();
  const { enterDemo, exitDemo } = useDemoMode();
  const [form] = Form.useForm<LoginValues>();
  const [selectedEmail, setSelectedEmail] = useState(LOCAL_LOGIN_ACCOUNTS[0].email);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const chooseAccount = (email: string) => {
    const account = LOCAL_LOGIN_ACCOUNTS.find(item => item.email === email)!;
    setSelectedEmail(email);
    setError('');
    form.setFieldsValue({ email: account.email, password: account.password });
  };

  const handleLogin = async (values: LoginValues) => {
    setSubmitting(true);
    setError('');
    try {
      const user = await login(values.email.trim(), values.password);
      // The legacy welcome modal would obscure the new store-sync experience.
      completeOnboarding();
      if (user.experience === 'onboarding') {
        exitDemo();
        window.location.replace('/stores/onboarding?journey=import');
      } else {
        enterDemo();
        window.location.replace('/dashboard');
      }
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '登录失败，请重试。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page login-page-modern">
      <section className="login-showcase">
        <div className="login-showcase-brand"><span>A</span><div><strong>AllMall</strong><small>AI 电商运营平台</small></div></div>
        <div className="login-showcase-copy">
          <div className="onboarding-eyebrow"><span /> 本地产品体验环境</div>
          <Typography.Title>从连接第一家店铺，<br />到管理所有生意。</Typography.Title>
          <Typography.Paragraph>
            选择不同阶段的商家账号，体验 AllMall 从首次接入到成熟经营的完整产品路径。
          </Typography.Paragraph>
          <div className="login-feature-list">
            <div><CheckCircleFilled /><span><strong>安全同步已有店铺</strong><small>商品、订单、评价和库存一次导入</small></span></div>
            <div><CheckCircleFilled /><span><strong>跨平台智能迁移</strong><small>自动适配类目、价格、库存和内容</small></span></div>
            <div><CheckCircleFilled /><span><strong>经营数据一屏掌握</strong><small>多店铺指标、Agent 和异常集中管理</small></span></div>
          </div>
        </div>
        <div className="login-security-note"><SafetyCertificateOutlined /> 本地演示账号 · 不连接真实店铺 · 不产生外部操作</div>
      </section>

      <section className="login-panel">
        {LANGUAGE_SWITCHER_ENABLED && (
          <div className="login-panel-top">
            <Segmented
              size="small"
              value={language}
              onChange={(value) => setLanguage(value as 'en' | 'zh')}
              options={[{ label: 'EN', value: 'en' }, { label: '中文', value: 'zh' }]}
            />
          </div>
        )}
        <div className="login-form-wrap">
          <Typography.Title level={2}>欢迎使用 AllMall</Typography.Title>
          <Typography.Paragraph type="secondary">选择一个体验账号，我们会带你进入对应的商家阶段。</Typography.Paragraph>

          <div className="login-account-grid">
            {LOCAL_LOGIN_ACCOUNTS.map(account => {
              const isNew = account.user.experience === 'onboarding';
              const selected = selectedEmail === account.email;
              return (
                <button type="button" key={account.email} className={`login-account-card ${selected ? 'is-selected' : ''}`} onClick={() => chooseAccount(account.email)}>
                  <span className={`login-account-icon ${isNew ? 'new' : 'established'}`}>{isNew ? <ShopOutlined /> : <BarChartOutlined />}</span>
                  <span className="login-account-copy">
                    <span><Typography.Text strong>{account.title}</Typography.Text>{selected && <CheckCircleFilled />}</span>
                    <Typography.Text type="secondary">{account.description}</Typography.Text>
                    <Tag color={isNew ? 'blue' : 'green'}>{isNew ? '进入首次同步' : '查看完整经营数据'}</Tag>
                  </span>
                </button>
              );
            })}
          </div>

          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

          <Form
            form={form}
            layout="vertical"
            initialValues={{ email: LOCAL_LOGIN_ACCOUNTS[0].email, password: LOCAL_LOGIN_ACCOUNTS[0].password }}
            onFinish={handleLogin}
            requiredMark={false}
          >
            <Form.Item label="账号" name="email" rules={[{ required: true, message: '请输入账号' }]}>
              <Input size="large" prefix={<UserOutlined />} onChange={event => setSelectedEmail(event.target.value)} />
            </Form.Item>
            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password size="large" prefix={<LockOutlined />} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
              登录并开始体验 <ArrowRightOutlined />
            </Button>
          </Form>

          <Card size="small" className="login-credentials-card">
            <Space direction="vertical" size={4}>
              <Typography.Text type="secondary">两个账号使用相同密码</Typography.Text>
              <Typography.Text code>demo123</Typography.Text>
            </Space>
          </Card>
        </div>
      </section>
    </div>
  );
}
