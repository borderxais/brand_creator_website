import { Metadata } from 'next'

// Tell Next.js this is static content that can be prerendered
export const dynamic = 'force-static'

// Add proper metadata
export const metadata: Metadata = {
  title: '关于我们 | 品牌创作者平台',
  description: '了解我们的使命，如何连接品牌与真实创作者，并革新创作者经济。'
}

export default function AboutPageChinese() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">关于我们</h1>
          <p className="mt-4 text-xl text-gray-600">
            连接品牌与真实创作者
          </p>
        </div>

        <div className="mt-16">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">我们的使命</h2>
              <p className="text-gray-600">
                我们的使命是通过建立品牌与内容创作者之间的有意义的联系，革新创作者经济。
                我们的平台促进真实的合作，为创作者和品牌创造价值，同时为受众提供引人入胜的内容。
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">我们的工作</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">为创作者</h3>
                  <p className="text-gray-600">
                    我们帮助创作者将激情转化为收益，并与与其价值观一致的品牌建立联系。
                    我们的平台提供了展示您作品、管理合作以及扩大影响力的工具。
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">为品牌</h3>
                  <p className="text-gray-600">
                    我们将品牌与能够向目标受众讲述品牌故事的真实创作者联系起来。
                    我们的平台简化了整个合作过程，从发现到活动执行。
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">我们的价值观</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">真实性</h3>
                  <p className="text-purple-700">
                    我们致力于促进真实的联系和真实的内容创作。
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">创新</h3>
                  <p className="text-purple-700">
                    我们不断发展我们的平台，以满足创作者和品牌不断变化的需求。
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">社区</h3>
                  <p className="text-purple-700">
                    我们建立并培育创作者和品牌的支持性社区。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
