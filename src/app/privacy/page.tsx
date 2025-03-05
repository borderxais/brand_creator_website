export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-xl text-gray-600">
            Last updated: March 4, 2025
          </p>
        </div>

        <div className="mt-16">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-8 prose prose-purple max-w-none">
              <h2>Introduction</h2>
              <p>
                We take your privacy seriously. This policy describes what personal information we collect
                and how we use it. This Privacy Policy applies to all services offered by our platform.
              </p>

              <h2>Information We Collect</h2>
              <ul>
                <li>
                  <strong>Account Information:</strong> When you create an account, we collect your name,
                  email address, and password.
                </li>
                <li>
                  <strong>Profile Information:</strong> Information you provide in your creator or brand
                  profile, including biography, location, and social media handles.
                </li>
                <li>
                  <strong>Usage Data:</strong> Information about how you use our platform, including
                  interactions with other users and content engagement metrics.
                </li>
              </ul>

              <h2>How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul>
                <li>Provide and improve our services</li>
                <li>Match creators with relevant brand opportunities</li>
                <li>Communicate with you about our services</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>

              <h2>Information Sharing</h2>
              <p>
                We do not sell your personal information. We share your information only in the
                following circumstances:
              </p>
              <ul>
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>With service providers who assist in our operations</li>
              </ul>

              <h2>Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal
                information against unauthorized access, alteration, disclosure, or destruction.
              </p>

              <h2>Your Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Receive a copy of your information</li>
              </ul>

              <h2>Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
                privacy@example.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
