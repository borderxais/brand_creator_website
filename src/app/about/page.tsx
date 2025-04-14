import { Metadata } from 'next'

// Tell Next.js this is static content that can be prerendered
export const dynamic = 'force-static'

// Add proper metadata
export const metadata: Metadata = {
  title: 'About Us | Brand Creator Platform',
  description: 'Learn more about our mission to connect brands with authentic creators and revolutionize the creator economy.'
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">About Us</h1>
          <p className="mt-4 text-xl text-gray-600">
            Connecting brands with authentic creators
          </p>
        </div>

        <div className="mt-16">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600">
                We're on a mission to revolutionize the creator economy by building meaningful connections 
                between brands and content creators. Our platform enables authentic collaborations that 
                drive value for both creators and brands while delivering engaging content to audiences.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What We Do</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">For Creators</h3>
                  <p className="text-gray-600">
                    We help creators monetize their passion and connect with brands that align with their values. 
                    Our platform provides tools to showcase your work, manage collaborations, and grow your influence.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">For Brands</h3>
                  <p className="text-gray-600">
                    We connect brands with authentic creators who can tell their story to engaged audiences. 
                    Our platform streamlines the entire collaboration process, from discovery to campaign execution.
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Values</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Authenticity</h3>
                  <p className="text-purple-700">
                    We believe in fostering genuine connections and authentic content creation.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Innovation</h3>
                  <p className="text-purple-700">
                    We continuously evolve our platform to meet the changing needs of creators and brands.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">Community</h3>
                  <p className="text-purple-700">
                    We build and nurture a supportive community of creators and brands.
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
