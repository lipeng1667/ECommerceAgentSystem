/**
 * Review Management Mock API (V1.0)
 */
import { mockDelay } from './client';
import type { AllMallId, Review, ReviewRating, ReviewReply, ReviewTemplate } from '../types/domain';

const now = Date.now();
const d = (days: number) => new Date(now - days * 86400000).toISOString();

const reviews: Review[] = [
  { id: 30001, storeId: 1001, buyerName: '张女士', rating: 5, productName: '轻奢通勤真皮托特包',
    content: '包包质量很好，皮质手感很棒，比图片还好看！物流也很快，两天就到了。同事都问我在哪买的，会回购的~', images: [], createdAt: d(1), replied: false,
    sentiment: 'positive' },
  { id: 30002, storeId: 1001, buyerName: '李同学', rating: 4, productName: '夏季冰丝防晒衬衫',
    content: '衣服料子很舒服，冰冰凉凉的适合夏天穿。就是颜色比图片偏浅一点，不过整体还不错。', images: [], createdAt: d(2), replied: true,
    reply: { content: '感谢亲的反馈！颜色问题已反馈给摄影团队优化，期待您的再次光临~', repliedAt: d(1), auto: true },
    sentiment: 'neutral' },
  { id: 30003, storeId: 1002, buyerName: '王老板', rating: 1, productName: '儿童积木桌多功能套装',
    content: '质量太差了！桌子买回来用了不到一个月就散架了，螺丝孔对不齐，客服也爱答不理。完全不值这个价！', images: [], createdAt: d(0.5), replied: false,
    sentiment: 'negative' },
  { id: 30004, storeId: 1002, buyerName: '赵女士', rating: 2, productName: '便携式户外露营灯',
    content: '亮度不够，说是能续航12小时实际只有四五个小时。户外露营根本不够用，差评。', images: [], createdAt: d(1.5), replied: false,
    sentiment: 'negative' },
  { id: 30005, storeId: 1003, buyerName: '刘先生', rating: 1, productName: '品牌运动休闲鞋',
    content: '鞋子有异味，穿了一天脚就起泡了。怀疑是不是正品，准备找平台投诉。', images: [], createdAt: d(0.8), replied: false,
    sentiment: 'negative' },
  { id: 30006, storeId: 1003, buyerName: '陈小姐', rating: 5, productName: '儿童积木桌多功能套装',
    content: '宝宝很喜欢这个积木桌，做工精致没有毛刺，安全性很好。还送了收纳盒，非常贴心！', images: [], createdAt: d(3), replied: true,
    reply: { content: '感谢亲的好评！祝宝宝玩得开心，有需要随时联系我们哦~', repliedAt: d(2), auto: true },
    sentiment: 'positive' },
  { id: 30007, storeId: 1001, buyerName: '周女士', rating: 3, productName: '轻奢通勤真皮托特包',
    content: '包包还行，但感觉不值这个价格。五金件有点轻飘飘的，用了两周就有划痕了。', images: [], createdAt: d(4), replied: true,
    reply: { content: '亲，非常抱歉给您带来不好的体验！五金件有质保的，请您联系客服免费更换。我们会持续改进产品质量。', repliedAt: d(3), auto: false },
    sentiment: 'negative' },
  { id: 30008, storeId: 1002, buyerName: '吴先生', rating: 5, productName: '便携式户外露营灯',
    content: '真的很好用！带出去露营三天，每天晚上开三四个小时，回来还有电。防水效果也不错下雨天没事。推荐！', images: [], createdAt: d(2), replied: false,
    sentiment: 'positive' },
  { id: 30009, storeId: 1003, buyerName: '郑女士', rating: 4, productName: '品牌运动休闲鞋',
    content: '鞋子版型好看，穿着逛街一天也不累。就是物流慢了点等了五天才到。', images: [], createdAt: d(3.5), replied: false,
    sentiment: 'neutral' },
  { id: 30010, storeId: 1001, buyerName: '孙先生', rating: 5, productName: '夏季冰丝防晒衬衫',
    content: '买给老爸的，他很喜欢。面料透气不闷汗，防晒效果也不错。准备再买一件给老妈。', images: [], createdAt: d(5), replied: false,
    sentiment: 'positive' },
  { id: 30011, storeId: 1002, buyerName: '马女士', rating: 1, productName: '儿童积木桌多功能套装',
    content: '收到货有严重色差，跟图片完全不一样！而且桌面有划痕，一看就是样品或者退货翻新的。太失望了。', images: [], createdAt: d(0.3), replied: false,
    sentiment: 'negative' },
  { id: 30012, storeId: 1003, buyerName: '黄先生', rating: 4, productName: '便携式户外露营灯',
    content: '小巧便携，亮度日常够用。充电口是 Type-C 的很方便，跟手机共用一根线。性价比高。', images: [], createdAt: d(1.2), replied: false,
    sentiment: 'positive' },
  { id: 30013, storeId: 1001, buyerName: '杨女士', rating: 2, productName: '轻奢通勤真皮托特包',
    content: '刚收到包带就脱线了，质量堪忧。虽然客服态度还行说可以换，但来回折腾太麻烦了。', images: [], createdAt: d(6), replied: false,
    sentiment: 'negative' },
  { id: 30014, storeId: 1002, buyerName: '朱先生', rating: 5, productName: '便携式户外露营灯',
    content: '第二次买了，上次买的被朋友拿走了。质量一如既往的好，发货也快。忠实粉丝了。', images: [], createdAt: d(7), replied: false,
    sentiment: 'positive' },
];

const templates: ReviewTemplate[] = [
  { id: 'rt1', text: '感谢亲的好评！您的满意是我们最大的动力，期待再次为您服务~', category: 'thanks' },
  { id: 'rt2', text: '感谢您的光临和反馈，祝您购物愉快！', category: 'thanks' },
  { id: 'rt3', text: '亲，非常抱歉给您带来不好的体验！我们已经记录下来并反馈给相关部门改进，请您给我们一次机会。', category: 'apology' },
  { id: 'rt4', text: '很抱歉让您失望了！如果商品有任何问题，您可以联系客服免费退换，运费我们承担，请您放心。', category: 'apology' },
  { id: 'rt5', text: '亲，感谢您的反馈！关于您提到的问题，我来给您解释一下：', category: 'explain' },
  { id: 'rt6', text: '亲，您提到的色差/做工问题，由于拍摄光线和显示器的差异会有些许不同，我们已在详情页做了说明哦。', category: 'explain' },
  { id: 'rt7', text: '感谢亲的认可！新品即将上线，期待您的再次光临~', category: 'invite' },
];

export const reviewsApi = {
  list: (filters?: { storeId?: AllMallId; rating?: ReviewRating; sentiment?: string; search?: string; replied?: boolean }) => {
    let result = [...reviews];
    if (filters?.storeId) result = result.filter((r) => r.storeId === filters.storeId);
    if (filters?.rating) result = result.filter((r) => r.rating === filters.rating);
    if (filters?.sentiment) result = result.filter((r) => r.sentiment === filters.sentiment);
    if (filters?.replied !== undefined) result = result.filter((r) => r.replied === filters.replied);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter((r) =>
        r.buyerName.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (a.sentiment === 'negative' && b.sentiment !== 'negative') return -1;
      if (b.sentiment === 'negative' && a.sentiment !== 'negative') return 1;
      if (!a.replied && b.replied) return -1;
      if (a.replied && !b.replied) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return mockDelay(result);
  },

  getTemplates: () => mockDelay([...templates]),

  replyToReview: async (reviewId: AllMallId, content: string): Promise<Review> => {
    await mockDelay(null);
    const review = reviews.find((r) => r.id === reviewId);
    if (!review) throw new Error('Review not found');
    review.reply = { content, repliedAt: new Date().toISOString(), auto: false };
    review.replied = true;
    return { ...review };
  },

  getStats: (storeId?: AllMallId) => {
    let data = reviews;
    if (storeId) data = data.filter((r) => r.storeId === storeId);
    const total = data.length;
    const negative = data.filter((r) => r.sentiment === 'negative').length;
    const unreplied = data.filter((r) => !r.replied).length;
    const avgRating = data.length > 0 ? +(data.reduce((sum, r) => sum + r.rating, 0) / data.length).toFixed(1) : 0;
    return mockDelay({ total, negative, unreplied, avgRating });
  },
};
