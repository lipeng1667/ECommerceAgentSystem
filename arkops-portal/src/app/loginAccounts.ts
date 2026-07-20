import type { SessionUser } from './session';

export interface LocalLoginAccount {
  email: string;
  password: string;
  title: string;
  description: string;
  user: SessionUser;
}

/** The two explicit local personas used to validate first-use and established-store journeys. */
export const LOCAL_LOGIN_ACCOUNTS: LocalLoginAccount[] = [
  {
    email: 'new@allmall.cn',
    password: 'demo123',
    title: '新用户体验账号',
    description: '尚未连接店铺，登录后进入首次同步引导。',
    user: { id: 'u_new', email: 'new@allmall.cn', name: '林晓', role: 'Owner', tenantId: 'tenant_new', experience: 'onboarding' },
  },
  {
    email: 'merchant@allmall.cn',
    password: 'demo123',
    title: '成熟商家体验账号',
    description: '已有多店铺和经营数据，登录后进入经营总览。',
    user: { id: 'u_merchant', email: 'merchant@allmall.cn', name: '周远', role: 'Owner', tenantId: 'tenant_demo', experience: 'established' },
  },
];
