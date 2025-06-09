import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section with Enhanced Welcome Message */}
      <div className="relative bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-800/30 via-transparent to-blue-800/30"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, rgba(255,255,255,0.1) 0%, transparent 50%)`
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-purple-200 text-sm font-medium border border-white/20">
                🚀 Welcome to the future of creator partnerships
              </span>
            </div>
            <h1 className="text-5xl tracking-tight font-extrabold sm:text-6xl md:text-7xl bg-gradient-to-r from-white via-purple-100 to-blue-100 bg-clip-text text-transparent">
              Welcome to BorderX
            </h1>
            <p className="mt-8 max-w-2xl mx-auto text-xl text-gray-300 md:text-2xl leading-relaxed">
              Connect with top creators and brands. Build authentic partnerships that drive real results.
            </p>
            <div className="mt-12 max-w-md mx-auto sm:flex sm:justify-center sm:max-w-none gap-4">
              <div className="group">
                <Link 
                  href="/find-creators" 
                  className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 md:py-4 md:text-lg md:px-12"
                >
                  Find Creators
                  <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
              <div className="mt-3 sm:mt-0 group">
                <Link 
                  href="/join-creator" 
                  className="w-full flex items-center justify-center px-8 py-4 border-2 border-white/30 text-base font-semibold rounded-xl text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 md:py-4 md:text-lg md:px-12"
                >
                  Join as Creator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Creators Choose BorderX Section */}
      <div className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-base font-semibold text-purple-600 tracking-wide uppercase mb-4">For Creators</h2>
            <h3 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-6">
              Why creators choose BorderX
            </h3>
            <p className="mt-4 max-w-3xl text-xl text-gray-600 mx-auto leading-relaxed">
              More campaigns, better pay, and real rewards — all in one platform.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* 12,000+ campaigns */}
            <div className="group">
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200 transform hover:-translate-y-2">
                <div className="absolute -top-6 left-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="pt-8">
                  <h4 className="text-3xl font-bold text-gray-900 mb-2">12,000+</h4>
                  <h5 className="text-xl font-semibold text-gray-800 mb-4">campaigns every month</h5>
                  <p className="text-gray-600 leading-relaxed">
                    Access thousands of brand opportunities across beauty, fashion, lifestyle, and beyond — updated daily.
                  </p>
                  <div className="mt-6 flex items-center text-purple-600 font-medium">
                    <Link href="/campaigns" className="flex items-center hover:text-purple-800">
                      <span>Explore campaigns</span>
                      <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Up to $5,000 bonus */}
            <div className="group">
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-green-200 transform hover:-translate-y-2">
                <div className="absolute -top-6 left-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="pt-8">
                  <h4 className="text-3xl font-bold text-gray-900 mb-2">Up to $5,000</h4>
                  <h5 className="text-xl font-semibold text-gray-800 mb-4">in bonus rewards</h5>
                  <p className="text-gray-600 leading-relaxed">
                    Get rewarded for consistency. Complete 200 videos and earn exclusive cash bonuses on top of your payouts.
                  </p>
                  <div className="mt-6 flex items-center text-green-600 font-medium">
                    <span>Learn about rewards</span>
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Personalized matches */}
            <div className="group">
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-orange-200 transform hover:-translate-y-2">
                <div className="absolute -top-6 left-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div className="pt-8">
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">Personalized</h4>
                  <h5 className="text-xl font-semibold text-gray-800 mb-4">campaign matches & top rates</h5>
                  <p className="text-gray-600 leading-relaxed">
                    We connect you with campaigns that suit your content — and ensure you get the best deal every time.
                  </p>
                  <div className="mt-6 flex items-center text-orange-600 font-medium">
                    <Link href="/how-it-works" className="flex items-center hover:text-orange-800">
                      <span>See how it works</span>
                      <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-base font-semibold text-purple-600 tracking-wide uppercase mb-4">Platform Features</h2>
            <h3 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-6">
              Everything you need to connect with creators
            </h3>
            <p className="mt-4 max-w-3xl text-xl text-gray-600 mx-auto leading-relaxed">
              BorderX provides you with powerful tools to find the perfect creators for your brand campaigns.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="group text-center">
              <div className="relative mx-auto w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl transform rotate-6 group-hover:rotate-12 transition-transform duration-300"></div>
                <div className="relative bg-white rounded-2xl p-6 shadow-lg">
                  <svg className="h-12 w-12 text-purple-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Smart Discovery</h4>
              <p className="text-lg text-gray-600 leading-relaxed">
                Discover creators across Tiktok that align with your brand values and target audience using our AI-powered matching system.
              </p>
            </div>

            <div className="group text-center">
              <div className="relative mx-auto w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl transform rotate-6 group-hover:rotate-12 transition-transform duration-300"></div>
                <div className="relative bg-white rounded-2xl p-6 shadow-lg">
                  <svg className="h-12 w-12 text-green-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Seamless Connection</h4>
              <p className="text-lg text-gray-600 leading-relaxed">
                Easily connect with creators and start conversations to build meaningful partnerships with built-in collaboration tools.
              </p>
            </div>

            <div className="group text-center">
              <div className="relative mx-auto w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl transform rotate-6 group-hover:rotate-12 transition-transform duration-300"></div>
                <div className="relative bg-white rounded-2xl p-6 shadow-lg">
                  <svg className="h-12 w-12 text-orange-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <h4 className="text-2xl font-bold text-gray-900 mb-4">Advanced Analytics</h4>
              <p className="text-lg text-gray-600 leading-relaxed">
                Track campaign performance with detailed analytics and real-time insights to optimize your creator partnerships.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24 bg-gradient-to-r from-purple-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-extrabold text-white mb-4">Trusted by thousands</h3>
            <p className="text-xl text-purple-200">Join the growing community of successful partnerships</p>
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">50K+</div>
              <div className="text-purple-200">Active Creators</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">2K+</div>
              <div className="text-purple-200">Partner Brands</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">1M+</div>
              <div className="text-purple-200">Campaigns Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">$50M+</div>
              <div className="text-purple-200">Creator Earnings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <div className="relative py-24 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 via-transparent to-blue-800/20"></div>
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl mb-6">
            Ready to find your perfect match?
          </h2>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-purple-200 leading-relaxed">
            Join thousands of successful creators and brands who have found their perfect partnerships on BorderX. 
            Start exploring our creator network today and unlock unlimited possibilities.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/find-creators"
              className="group inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-xl text-purple-900 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Get Started Now
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/join-creator"
              className="group inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-lg font-semibold rounded-xl text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 hover:border-white/50 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Join as Creator
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
