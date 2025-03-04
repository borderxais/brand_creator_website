import React, { use } from 'react';
import { Clock, DollarSign, Users, Edit, Share2, Archive } from 'lucide-react';
import { FaInstagram, FaTiktok } from 'react-icons/fa';
import { Metadata } from 'next';

// interface PageProps {
//   params: {
//     id: string;
//   };
//   searchParams: { [key: string]: string | string[] | undefined };
// }



interface Campaign {
  id: string;
  title: string;
  brand: string;
  image: string;
  description: string;
  platforms: string[];
  commission: string;
  deadline: string;
  budget: string;
  requirements: string[];
  status: string;
  applicants: number;
  deliverables: string[];
  timeline: {
    applicationDeadline: string;
    campaignStart: string;
    campaignEnd: string;
    contentDueDate: string;
  };
  requirement: {
    commission: string;
    minimumGuarantee: string;
    totalBudget: string;
  };
  applicantsList: {
    id: number;
    name: string;
    handle: string;
    followers: string;
    engagement: string;
    status: string;
    avatar: string;
  }[];
}

async function getCampaign(id: string): Promise<Campaign> {
  // This would be fetched from your API based on the ID
  return {
    id,
    title: 'Summer Fashion Collection Launch',
    brand: 'StyleCo',
    image: '/images/campaign1.jpg',
    description: 'Promote our new summer collection focusing on sustainable fashion and beachwear.',
    platforms: ['Instagram', 'TikTok'],
    commission: '15% per sale',
    deadline: '2024-04-15',
    budget: '$5,000',
    requirements: [
      'Minimum 10k followers',
      'Fashion/Lifestyle niche',
      'Previous experience with fashion brands',
      'High engagement rate'
    ],
    status: 'Active',
    applicants: 12,
    deliverables: [
      '3 Instagram feed posts',
      '5 Instagram stories',
      '2 TikTok videos',
      'Minimum 30s video duration'
    ],
    timeline: {
      applicationDeadline: '2024-04-15',
      campaignStart: '2024-05-01',
      campaignEnd: '2024-06-30',
      contentDueDate: '2024-06-15'
    },
    requirement: {
      commission: '15% per sale',
      minimumGuarantee: '$500',
      totalBudget: '$10,000'
    },
    applicantsList: [
      {
        id: 1,
        name: 'Sarah Johnson',
        handle: '@sarahstyle',
        followers: '125K',
        engagement: '4.2%',
        status: 'Pending',
        avatar: '/avatars/sarah.jpg'
      },
      {
        id: 2,
        name: 'Mike Chen',
        handle: '@mikesfashion',
        followers: '89K',
        engagement: '3.8%',
        status: 'Approved',
        avatar: '/avatars/mike.jpg'
      },
      // Add more applicants as needed
    ]
  };
}



export async function generateMetadata({params}: {params: Promise<{ id: string }>}) {
  const { id } = await params;
  const campaign = await getCampaign(id);

  return {
    title: `${campaign.title} - Campaign Details`,
    description: campaign.description,
  };
}



export default async function CampaignDetails({params}: {params: Promise<{ id: string }>}) {
  const { id } = await params;
  const campaign = await getCampaign(id);

  

  return (
    <div className="min-h-screen p-8">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">{campaign.title}</h1>
          <p className="text-lg text-gray-600 mt-2">by {campaign.brand}</p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="flex items-center px-4 py-2 text-gray-700 bg-white rounded-xl border hover:bg-gray-50">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
          <button className="flex items-center px-4 py-2 text-gray-700 bg-white rounded-xl border hover:bg-gray-50">
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </button>
          <button className="flex items-center px-4 py-2 text-white rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2 space-y-8">
          {/* Campaign Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex items-center">
                <DollarSign className="h-10 w-10 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Commission</p>
                  <p className="text-lg font-semibold text-green-600">{campaign.requirement.commission}</p>
                  <p className="text-sm text-gray-500">Min. {campaign.requirement.minimumGuarantee}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-10 w-10 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Deadline</p>
                  <p className="text-lg font-semibold text-gray-900">{campaign.timeline.applicationDeadline}</p>
                  <p className="text-sm text-gray-500">Applications close</p>
                </div>
              </div>
              <div className="flex items-center">
                <Users className="h-10 w-10 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Applicants</p>
                  <p className="text-lg font-semibold text-blue-600">{campaign.applicants} influencers</p>
                  <p className="text-sm text-gray-500">2 approved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Description */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Description</h2>
            <p className="text-gray-600">{campaign.description}</p>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Platforms</h3>
              <div className="flex space-x-3">
                {campaign.platforms.includes('Instagram') && (
                  <div className="flex items-center px-4 py-2 bg-pink-50 text-pink-700 rounded-lg">
                    <FaInstagram className="h-5 w-5 mr-2" />
                    Instagram
                  </div>
                )}
                {campaign.platforms.includes('TikTok') && (
                  <div className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg">
                    <FaTiktok className="h-5 w-5 mr-2" />
                    TikTok
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Deliverables */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Deliverables</h2>
            <ul className="space-y-2">
              {campaign.deliverables.map((deliverable, index) => (
                <li key={index} className="flex items-center text-gray-600">
                  <span className="h-2 w-2 bg-blue-600 rounded-full mr-3"></span>
                  {deliverable}
                </li>
              ))}
            </ul>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Campaign Timeline</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Application Deadline</span>
                <span className="font-medium">{campaign.timeline.applicationDeadline}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Campaign Start</span>
                <span className="font-medium">{campaign.timeline.campaignStart}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Content Due Date</span>
                <span className="font-medium">{campaign.timeline.contentDueDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Campaign End</span>
                <span className="font-medium">{campaign.timeline.campaignEnd}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Requirements */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
            <ul className="space-y-2">
              {campaign.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start">
                  <span className="h-2 w-2 bg-blue-600 rounded-full mr-3 mt-2"></span>
                  <span className="text-gray-600">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Applicants */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Recent Applicants</h2>
              <button className="text-blue-600 text-sm hover:text-blue-700">View all</button>
            </div>
            <div className="space-y-4">
              {campaign.applicantsList.map((applicant) => (
                <div key={applicant.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img src={applicant.avatar} alt={applicant.name} className="h-10 w-10 rounded-full" />
                    <div>
                      <p className="font-medium text-gray-900">{applicant.name}</p>
                      <p className="text-sm text-gray-500">{applicant.handle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{applicant.followers}</p>
                    <p className="text-sm text-gray-500">{applicant.engagement} eng.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
