import { UserAddOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Form, Input, message, Modal, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { settingsApi } from '../../api/settings';
import { useI18n } from '../../app/i18n';
import { PageHeader } from '../../components/PageHeader';
import type { Member } from '../../types/domain';

const ALL_ROLES = ['Owner', 'Admin', 'Operator', 'Approver', 'Finance', 'Viewer'] as const;

export function MembersSettingsPage() {
  const { t } = useI18n();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm] = Form.useForm();
  const { data = [] } = useQuery({ queryKey: ['members'], queryFn: settingsApi.members });

  const roleOptions = useMemo(() => [
    { value: 'Admin', label: t('member.role.Admin') },
    { value: 'Operator', label: t('member.role.Operator') },
    { value: 'Approver', label: t('member.role.Approver') },
    { value: 'Finance', label: t('member.role.Finance') },
    { value: 'Viewer', label: t('member.role.Viewer') },
  ], [t]);

  const columns: ColumnsType<Member> = [
    { title: t('settings.name'), dataIndex: 'name' },
    { title: t('login.email'), dataIndex: 'email' },
    { title: t('settings.role'), dataIndex: 'role', render: (role) => t(`member.role.${role}`) },
    { title: t('stores.status'), dataIndex: 'status', render: (status) => t(`member.status.${status}`) }
  ];
  return (
    <div className="page-stack">
      <PageHeader
        title={t('settings.membersTitle')}
        description={t('settings.membersDescription')}
        actions={<Button icon={<UserAddOutlined />} onClick={() => setInviteModalOpen(true)}>{t('settings.invite')}</Button>}
      />
      <Card>
        <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      </Card>
      <Card title={t('settings.mvpRoles')}>
        <Space wrap>
          {ALL_ROLES.map((role) => (
            <Tag key={role} color={role === 'Owner' ? 'blue' : role === 'Viewer' ? 'default' : 'geekblue'}>
              {t(`member.role.${role}`)}
            </Tag>
          ))}
        </Space>
      </Card>

      <Modal
        title={t('settings.inviteMember')}
        open={inviteModalOpen}
        onCancel={() => { setInviteModalOpen(false); inviteForm.resetFields(); }}
        onOk={() => {
          inviteForm.validateFields().then(() => {
            message.success(t('settings.inviteSuccess'));
            setInviteModalOpen(false);
            inviteForm.resetFields();
          });
        }}
      >
        <Form form={inviteForm} layout="vertical">
          <Form.Item label={t('login.email')} name="email" rules={[{ required: true, type: 'email', message: t('settings.emailValidation') }]}>
            <Input placeholder={t('settings.emailPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('settings.role')} name="role" rules={[{ required: true }]} initialValue="Operator">
            <Select options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
