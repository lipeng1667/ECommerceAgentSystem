/**
 * Customer Service Mock API (V1.0)
 * Provides sessions, messages, and quick-reply templates for the customer service page.
 */
import { mockDelay } from './client';
import type { AllMallId, CustomerSession, CustomerMessage, QuickReplyTemplate, SessionStatus } from '../types/domain';

// ===== Seed Data =====

const now = Date.now();
const min = (m: number) => new Date(now - m * 60000).toISOString();
const hr = (h: number) => new Date(now - h * 3600000).toISOString();

const sessions: CustomerSession[] = [
  { id: 10001, storeId: 1001, buyerName: '张女士', lastMessage: '那大概什么时候能到货？', lastMessageAt: min(3), unreadCount: 2, status: 'pending_reply', tags: ['物流查询'], platformId: 'pinduoduo' },
  { id: 10002, storeId: 1001, buyerName: '李同学', lastMessage: '好的，那就换一个颜色吧', lastMessageAt: min(15), unreadCount: 0, status: 'replied', tags: ['换货'], platformId: 'pinduoduo' },
  { id: 10003, storeId: 1002, buyerName: '王老板', lastMessage: '这个价格能不能再优惠点？我批发', lastMessageAt: min(8), unreadCount: 1, status: 'pending_reply', tags: ['议价', '批发'], platformId: 'taobao' },
  { id: 10004, storeId: 1002, buyerName: '赵女士', lastMessage: '收到货发现有瑕疵，麻烦处理一下', lastMessageAt: min(25), unreadCount: 0, status: 'replied', tags: ['质量投诉'], platformId: 'taobao' },
  { id: 10005, storeId: 1003, buyerName: '刘先生', lastMessage: '退款为什么还没到账？已经三天了', lastMessageAt: min(5), unreadCount: 3, status: 'pending_reply', tags: ['退款'], platformId: 'jd' },
  { id: 10006, storeId: 1003, buyerName: '陈小姐', lastMessage: '谢谢，已经收到了', lastMessageAt: hr(2), unreadCount: 0, status: 'closed', tags: ['好评'], platformId: 'jd' },
  { id: 10007, storeId: 1001, buyerName: '周女士', lastMessage: '你好，这个商品有优惠券可以用吗？', lastMessageAt: min(45), unreadCount: 0, status: 'replied', tags: ['促销咨询'], platformId: 'pinduoduo' },
  { id: 10008, storeId: 1002, buyerName: '吴先生', lastMessage: '尺寸不合适，可以退换吗？', lastMessageAt: min(2), unreadCount: 1, status: 'pending_reply', tags: ['退货', '尺码'], platformId: 'taobao' },
  { id: 10009, storeId: 1003, buyerName: '郑女士', lastMessage: '能帮我催一下快递吗？很急用', lastMessageAt: min(12), unreadCount: 1, status: 'pending_reply', tags: ['催发货'], platformId: 'jd' },
  { id: 10010, storeId: 1001, buyerName: '孙先生', lastMessage: '好的没问题', lastMessageAt: hr(5), unreadCount: 0, status: 'closed', tags: ['已解决'], platformId: 'pinduoduo' },
  { id: 10011, storeId: 1002, buyerName: '马女士', lastMessage: '你们的客服态度也太差了', lastMessageAt: min(30), unreadCount: 0, status: 'replied', tags: ['投诉', '客服'], platformId: 'taobao' },
  { id: 10012, storeId: 1003, buyerName: '黄先生', lastMessage: '赠品是不是漏发了？', lastMessageAt: min(7), unreadCount: 1, status: 'pending_reply', tags: ['漏发'], platformId: 'jd' },
];

const messages: Record<AllMallId, CustomerMessage[]> = {
  10001: [
    { id: 20001, sessionId: 10001, sender: 'buyer', content: '你好，我前天买的那个真皮托特包，物流显示还在揽收，什么时候能发货？', createdAt: min(20), isAutoReply: false },
    { id: 20002, sessionId: 10001, sender: 'agent', content: '亲，我帮您查一下哈，稍等~', createdAt: min(18), isAutoReply: true },
    { id: 20003, sessionId: 10001, sender: 'agent', content: '亲，查到了，您的订单已经出库，快递预计明天上午揽收，后天就能到哦', createdAt: min(16), isAutoReply: true },
    { id: 20004, sessionId: 10001, sender: 'buyer', content: '那大概什么时候能到货？', createdAt: min(3), isAutoReply: false },
  ],
  10002: [
    { id: 20005, sessionId: 10002, sender: 'buyer', content: '我买的冰丝防晒衬衫，码数买小了，想换个M号', createdAt: min(40), isAutoReply: false },
    { id: 20006, sessionId: 10002, sender: 'agent', content: '亲，可以的，您把商品寄回来，我们收到后给您换。运费我们承担。', createdAt: min(35), isAutoReply: true },
    { id: 20007, sessionId: 10002, sender: 'buyer', content: '好的，那就换一个颜色吧', createdAt: min(15), isAutoReply: false },
  ],
  10003: [
    { id: 20008, sessionId: 10003, sender: 'buyer', content: '老板，你们这个儿童积木桌，我这边要团购30套，能给个批发价吗？', createdAt: min(25), isAutoReply: false },
    { id: 20009, sessionId: 10003, sender: 'agent', content: '亲，您要的多的话我们可以给您申请团购价，具体优惠多少我跟您报一下', createdAt: min(20), isAutoReply: false },
    { id: 20010, sessionId: 10003, sender: 'buyer', content: '这个价格能不能再优惠点？我批发', createdAt: min(8), isAutoReply: false },
  ],
  10004: [
    { id: 20011, sessionId: 10004, sender: 'buyer', content: '你好，今天收到轻奢通勤真皮托特包了，但是包带接口处有磨损，拍照给你看', createdAt: min(50), isAutoReply: false },
    { id: 20012, sessionId: 10004, sender: 'agent', content: '非常抱歉给您带来不好的体验！请发一下照片，我这边核实后给您处理方案', createdAt: min(45), isAutoReply: false },
    { id: 20013, sessionId: 10004, sender: 'system', content: '买家已发送图片', createdAt: min(44), isAutoReply: true },
    { id: 20014, sessionId: 10004, sender: 'agent', content: '亲，已经确认了，是包带磨损问题。您看是给您换一个新的还是退款？我们都可以', createdAt: min(40), isAutoReply: false },
    { id: 20015, sessionId: 10004, sender: 'buyer', content: '换一个吧，这款挺喜欢的', createdAt: min(35), isAutoReply: false },
    { id: 20016, sessionId: 10004, sender: 'agent', content: '好的亲，我已经帮您申请了换货处理，新的商品明天发出', createdAt: min(30), isAutoReply: false },
    { id: 20017, sessionId: 10004, sender: 'system', content: '已生成换货单 #SWAP-0810-04', createdAt: min(28), isAutoReply: true },
    { id: 20018, sessionId: 10004, sender: 'buyer', content: '收到货发现有瑕疵，麻烦处理一下', createdAt: min(25), isAutoReply: false },
  ],
  10005: [
    { id: 20019, sessionId: 10005, sender: 'buyer', content: '你好，我的退款申请已经三天了，为什么还没有到账？', createdAt: min(20), isAutoReply: false },
    { id: 20020, sessionId: 10005, sender: 'agent', content: '亲，把订单号发我一下，我帮您查', createdAt: min(18), isAutoReply: true },
    { id: 20021, sessionId: 10005, sender: 'buyer', content: '订单号 JD240809-8820', createdAt: min(15), isAutoReply: false },
    { id: 20022, sessionId: 10005, sender: 'agent', content: '亲，查到了，您的退款已在财务审核中，预计1-2个工作日到账', createdAt: min(12), isAutoReply: true },
    { id: 20023, sessionId: 10005, sender: 'buyer', content: '能不能快一点？', createdAt: min(8), isAutoReply: false },
    { id: 20024, sessionId: 10005, sender: 'buyer', content: '退款为什么还没到账？已经三天了', createdAt: min(5), isAutoReply: false },
  ],
  10006: [
    { id: 20025, sessionId: 10006, sender: 'buyer', content: '你好，想问下这个便携式露营灯续航多久？', createdAt: hr(5), isAutoReply: false },
    { id: 20026, sessionId: 10006, sender: 'agent', content: '亲，这款露营灯充满电可以用8-12小时，亮度可调，很实用的~', createdAt: hr(4), isAutoReply: true },
    { id: 20027, sessionId: 10006, sender: 'buyer', content: '好的下单了', createdAt: hr(3), isAutoReply: false },
    { id: 20028, sessionId: 10006, sender: 'buyer', content: '谢谢，已经收到了', createdAt: hr(2), isAutoReply: false },
  ],
  10007: [
    { id: 20029, sessionId: 10007, sender: 'buyer', content: '你好，这个商品有优惠券可以用吗？', createdAt: min(50), isAutoReply: false },
    { id: 20030, sessionId: 10007, sender: 'agent', content: '亲，现在店铺有满200减30的优惠券，您可以先领券再下单哦', createdAt: min(48), isAutoReply: true },
    { id: 20031, sessionId: 10007, sender: 'buyer', content: '好的谢谢', createdAt: min(45), isAutoReply: false },
  ],
  10008: [
    { id: 20032, sessionId: 10008, sender: 'buyer', content: '你好，我买的运动休闲鞋42码有点紧，想换43码', createdAt: min(10), isAutoReply: false },
    { id: 20033, sessionId: 10008, sender: 'agent', content: '亲，可以的，您发起退换货申请，选"换货"，选43码就行', createdAt: min(8), isAutoReply: true },
    { id: 20034, sessionId: 10008, sender: 'buyer', content: '尺寸不合适，可以退换吗？', createdAt: min(2), isAutoReply: false },
  ],
  10009: [
    { id: 20035, sessionId: 10009, sender: 'buyer', content: '亲，我明天要出差，买的户外装备能不能加急发？', createdAt: min(30), isAutoReply: false },
    { id: 20036, sessionId: 10009, sender: 'agent', content: '亲我帮您看看仓库那边的备货情况', createdAt: min(25), isAutoReply: false },
    { id: 20037, sessionId: 10009, sender: 'agent', content: '亲，今天下午就能发出，发顺丰特快，预计明天上午到', createdAt: min(20), isAutoReply: false },
    { id: 20038, sessionId: 10009, sender: 'buyer', content: '能帮我催一下快递吗？很急用', createdAt: min(12), isAutoReply: false },
  ],
  10010: [
    { id: 20039, sessionId: 10010, sender: 'buyer', content: '老板在吗？', createdAt: hr(6), isAutoReply: false },
    { id: 20040, sessionId: 10010, sender: 'agent', content: '在的亲，有什么可以帮您的？', createdAt: hr(6), isAutoReply: true },
    { id: 20041, sessionId: 10010, sender: 'buyer', content: '谢谢了，快递收到了，包装很用心', createdAt: hr(5), isAutoReply: false },
    { id: 20042, sessionId: 10010, sender: 'agent', content: '谢谢亲的认可，期待您的下次光临~', createdAt: hr(5), isAutoReply: false },
    { id: 20043, sessionId: 10010, sender: 'buyer', content: '好的没问题', createdAt: hr(5), isAutoReply: false },
  ],
  10011: [
    { id: 20044, sessionId: 10011, sender: 'buyer', content: '我问了好几次都不回复，你们是怎么做服务的？', createdAt: min(60), isAutoReply: false },
    { id: 20045, sessionId: 10011, sender: 'agent', content: '非常抱歉给您带来了不愉快的体验！我是客服主管，您请说，我全程帮您跟进', createdAt: min(55), isAutoReply: false },
    { id: 20046, sessionId: 10011, sender: 'buyer', content: '算了，已经解决了，但是下次注意', createdAt: min(50), isAutoReply: false },
    { id: 20047, sessionId: 10011, sender: 'agent', content: '感谢您的理解，我们已经对相关同事进行了培训，后续不会再出现这种情况。', createdAt: min(45), isAutoReply: false },
    { id: 20048, sessionId: 10011, sender: 'buyer', content: '你们的客服态度也太差了', createdAt: min(30), isAutoReply: false },
  ],
  10012: [
    { id: 20049, sessionId: 10012, sender: 'buyer', content: '你好，我买的运动鞋，赠品袜子没有收到', createdAt: min(15), isAutoReply: false },
    { id: 20050, sessionId: 10012, sender: 'agent', content: '亲不好意思，我查一下仓库的发货清单', createdAt: min(12), isAutoReply: true },
    { id: 20051, sessionId: 10012, sender: 'agent', content: '亲，确认是仓库漏发了，我马上给您补发，预计后天到，抱歉！', createdAt: min(10), isAutoReply: false },
    { id: 20052, sessionId: 10012, sender: 'buyer', content: '赠品是不是漏发了？', createdAt: min(7), isAutoReply: false },
  ],
};

const quickReplies: QuickReplyTemplate[] = [
  // 问候
  { id: 'qr1', text: '亲，您好~ 有什么可以帮您的？😊', category: 'greeting' },
  { id: 'qr2', text: '欢迎光临，请问有什么需要了解的？', category: 'greeting' },
  { id: 'qr3', text: '感谢您的咨询，请稍等，我帮您查一下~', category: 'greeting' },
  // 售后
  { id: 'qr4', text: '亲，非常抱歉给您带来不便！请把订单号发我，我马上帮您处理', category: 'after_sales' },
  { id: 'qr5', text: '亲，您可以在「我的订单」中发起退换货申请，我们会尽快处理', category: 'after_sales' },
  { id: 'qr6', text: '您好，商品质量问题我们包退包换，运费我们承担，请您放心', category: 'after_sales' },
  { id: 'qr7', text: '已收到您的反馈，我会为您加急处理，预计24小时内解决', category: 'after_sales' },
  // 物流
  { id: 'qr8', text: '亲，您的订单已发货，快递单号已更新，预计2-3天送达', category: 'logistics' },
  { id: 'qr9', text: '亲，我帮您催促快递了，请您再耐心等待一下', category: 'logistics' },
  { id: 'qr10', text: '亲，配送进度您可以在「物流详情」中实时查看哦', category: 'logistics' },
  // 退款
  { id: 'qr11', text: '亲，退款一般在1-3个工作日到账，请您留意账户变动', category: 'refund' },
  { id: 'qr12', text: '亲，您的退款申请已通过，款项将原路返回，请耐心等待', category: 'refund' },
  // 通用
  { id: 'qr13', text: '亲，还有其他需要帮您的吗？', category: 'general' },
  { id: 'qr14', text: '感谢您的支持，祝您购物愉快！如有问题随时联系哦~', category: 'general' },
  { id: 'qr15', text: '亲，这个情况我需要跟仓库/物流确认一下，稍后给您回复', category: 'general' },
];

// ===== API =====

export const customerServiceApi = {
  listSessions: (filters?: { status?: SessionStatus; storeId?: AllMallId; search?: string }) => {
    let result = [...sessions];
    if (filters?.status) result = result.filter((s) => s.status === filters.status);
    if (filters?.storeId) result = result.filter((s) => s.storeId === filters.storeId);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((s) =>
        s.buyerName.toLowerCase().includes(q) ||
        s.lastMessage.toLowerCase().includes(q) ||
        s.tags.some((t) => t.includes(q))
      );
    }
    result.sort((a, b) => {
      if (a.status === 'pending_reply' && b.status !== 'pending_reply') return -1;
      if (b.status === 'pending_reply' && a.status !== 'pending_reply') return 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
    return mockDelay(result);
  },

  getMessages: (sessionId: AllMallId) => mockDelay(messages[sessionId] ?? []),

  getQuickReplies: () => mockDelay([...quickReplies]),

  sendMessage: async (sessionId: AllMallId, content: string): Promise<CustomerMessage> => {
    await mockDelay(null);
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    const msg: CustomerMessage = {
      id: (Math.max(...Object.values(messages).flat().map((m) => m.id), 20000) + 1) as AllMallId,
      sessionId,
      sender: 'agent',
      content,
      createdAt: new Date().toISOString(),
      isAutoReply: false,
    };
    if (!messages[sessionId]) messages[sessionId] = [];
    messages[sessionId].push(msg);
    session.lastMessage = content;
    session.lastMessageAt = new Date().toISOString();
    session.unreadCount = 0;
    session.status = 'replied';
    return msg;
  },

  updateSessionStatus: async (sessionId: AllMallId, status: SessionStatus): Promise<CustomerSession | undefined> => {
    await mockDelay(null);
    const session = sessions.find((s) => s.id === sessionId);
    if (session) session.status = status;
    return session;
  },

  escalateToHuman: async (sessionId: AllMallId, reason: string): Promise<{ session: CustomerSession; escalationId: number }> => {
    await mockDelay(null);
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error('Session not found');
    session.tags = [...new Set([...session.tags, '已转人工'])];
    const msg: CustomerMessage = {
      id: (Math.max(...Object.values(messages).flat().map((m) => m.id), 20000) + 1) as AllMallId,
      sessionId,
      sender: 'system',
      content: `已转接人工客服处理。原因：${reason}`,
      createdAt: new Date().toISOString(),
      isAutoReply: true,
    };
    if (!messages[sessionId]) messages[sessionId] = [];
    messages[sessionId].push(msg);
    return { session, escalationId: Date.now() };
  },
};
