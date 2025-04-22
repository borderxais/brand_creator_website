'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface FormData {
  companyName: string;
  website: string;
  email: string;
  password: string;
  confirmPassword: string;
  industry: string;
  size: string;
  marketingBudget: string;
  goals: string[];
}

export default function JoinAsBrandChinese() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    website: '',
    email: '',
    password: '',
    confirmPassword: '',
    industry: '',
    size: '',
    marketingBudget: '',
    goals: [],
  });

  const industries = [
    '时尚与服装',
    '美妆与化妆品',
    '健康与保健',
    '食品与饮料',
    '旅游与酒店',
    '科技',
    '金融与金融科技',
    '电子商务',
    '娱乐',
    '教育',
  ] as const;

  const companySizes = [
    '初创企业 (1-10人)',
    '小型企业 (11-50人)',
    '中型企业 (51-200人)',
    '大型企业 (201-1000人)',
    '超大型企业 (1000+人)',
  ] as const;

  const marketingBudgets = [
    '5,000元/月以下',
    '5,000元 - 10,000元/月',
    '10,000元 - 25,000元/月',
    '25,000元 - 50,000元/月',
    '50,000元+/月',
  ] as const;

  const goals = [
    '品牌知名度',
    '产品发布',
    '销售与转化',
    '社交媒体增长',
    '内容创作',
    '社区建设',
  ] as const;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      try {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setError('密码不匹配');
          return;
        }

        // Register the user
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.companyName,
            role: 'BRAND'
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '注册失败');
        }

        // Redirect to login with success message
        router.push('/zh/login?registered=true');
      } catch (error) {
        console.error('错误:', error);
        setError(error instanceof Error ? error.message : '注册失败');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= num ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step > num ? <CheckCircle className="w-5 h-5" /> : num}
                </div>
                {num < 3 && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      step > num ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-black">公司信息</span>
            <span className="text-sm text-black">企业详情</span>
            <span className="text-sm text-black">营销目标</span>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 md:p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black">公司信息</h2>
                <div>
                  <label className="block text-sm font-medium text-black">
                    公司名称
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    公司网站
                    <span className="text-gray-500 text-sm font-normal ml-1">(选填)</span>
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    placeholder="https://www.example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">企业邮箱</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">密码</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">确认密码</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black">企业详情</h2>
                <div>
                  <label className="block text-sm font-medium text-black">行业</label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  >
                    <option value="">选择您的行业</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">公司规模</label>
                  <select
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  >
                    <option value="">选择公司规模</option>
                    {companySizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black">
                    月度营销预算
                  </label>
                  <select
                    name="marketingBudget"
                    value={formData.marketingBudget}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-black"
                    required
                  >
                    <option value="">选择预算范围</option>
                    {marketingBudgets.map((budget) => (
                      <option key={budget} value={budget}>
                        {budget}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-black">活动目标</h2>
                <div className="grid grid-cols-2 gap-4">
                  {goals.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => handleGoalToggle(goal)}
                      className={`p-4 border rounded-lg flex items-center justify-between ${
                        formData.goals.includes(goal)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <span className="text-black">{goal}</span>
                      {formData.goals.includes(goal) && (
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                {step === 3 ? '创建账户' : '下一步'}
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
