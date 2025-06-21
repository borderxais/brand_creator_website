'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Users, DollarSign, Clock, MapPin, Star, 
  Target, FileText, AlertTriangle, CheckCircle, Tag, Globe,
  Award, TrendingUp, Shield, Zap
} from 'lucide-react';
import Link from 'next/link';

// Complete mission interface with all database fields
interface DetailedMission {
  id: string;
  created_at: string;
  task_title: string;
  brand_id: string;
  campaign_objective: string;
  platform: string;
  task_start_at: string;
  task_end_at: string;
  follower_min: number;
  follower_max: number;
  niche_tags: string[];
  region_priority: string;
  content_quality_floor: string;
  deliverables: string;
  mandatory_elements: string;
  creative_guidelines: string;
  prohibited_elements: string;
  reward_model: string;
  fixed_reward?: number;
  tiered_table?: string;
  cps_rate?: number;
  kpi_baseline: string;
  updated_at: string;
  brand_name?: string;
}

export default function MissionDetail() {
  const params = useParams();
  const router = useRouter();
  const [mission, setMission] = useState<DetailedMission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMission = async () => {
      try {
        setIsLoading(true);
        
        // Await params before accessing properties with null check
        const resolvedParams = await params;
        if (!resolvedParams || !resolvedParams.id) {
          setError('Mission ID not found');
          return;
        }
        
        const missionId = resolvedParams.id as string;
        
        // Fetch from the real API
        const response = await fetch(`/api/entertainment-live/${missionId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Mission not found');
          } else {
            throw new Error(`Failed to fetch mission: ${response.status}`);
          }
          return;
        }

        const data = await response.json();
        console.log('Fetched mission detail:', data);
        setMission(data);
        
      } catch (err) {
        console.error('Error fetching mission details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load mission details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMission();
  }, [params]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getRewardDisplay = () => {
    if (!mission) return 'TBD';
    
    if (mission.reward_model === 'fixed' && mission.fixed_reward) {
      return `$${mission.fixed_reward} (Fixed)`;
    } else if (mission.reward_model === 'cps' && mission.cps_rate) {
      return `$${mission.cps_rate} per view`;
    } else if (mission.reward_model === 'tiered' && mission.tiered_table) {
      return 'Tiered rewards (see details below)';
    }
    return 'TBD';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Mission Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested mission could not be found.'}</p>
          <Link
            href="/entertainment-live"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Missions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/entertainment-live"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Missions
              </Link>
            </div>
            <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium">
              Apply Now
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mission Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{mission.task_title}</h1>
              <p className="text-lg text-gray-600 mb-4">by {mission.brand_name || 'Unknown Brand'}</p>
              <p className="text-gray-700 leading-relaxed">{mission.campaign_objective}</p>
            </div>
            <div className="ml-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-1" />
                Open for Applications
              </span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Reward</p>
                <p className="font-semibold text-lg">{getRewardDisplay()}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Followers Required</p>
                <p className="font-semibold text-lg">
                  {mission.follower_min?.toLocaleString() || 0} - {mission.follower_max?.toLocaleString() || 'Unlimited'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Platform</p>
                <p className="font-semibold text-lg capitalize">{mission.platform || 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Region</p>
                <p className="font-semibold text-lg capitalize">
                  {mission.region_priority?.replace('_', ' ') || 'Global'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Schedule & Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                Schedule & Timeline
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Start Date</p>
                    <p className="text-gray-600">{formatDate(mission.task_start_at)}</p>
                  </div>
                  <div>
                    <p className="font-medium">End Date</p>
                    <p className="text-gray-600">{formatDate(mission.task_end_at)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Deliverables */}
            {mission.deliverables && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-gray-600" />
                  Deliverables
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p>{mission.deliverables}</p>
                </div>
              </div>
            )}

            {/* Creative Guidelines */}
            {mission.creative_guidelines && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-600" />
                  Creative Guidelines
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p>{mission.creative_guidelines}</p>
                </div>
              </div>
            )}

            {/* Mandatory Elements */}
            {mission.mandatory_elements && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Mandatory Elements
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p>{mission.mandatory_elements}</p>
                </div>
              </div>
            )}

            {/* Prohibited Elements */}
            {mission.prohibited_elements && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                  Prohibited Elements
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p>{mission.prohibited_elements}</p>
                </div>
              </div>
            )}

            {/* KPI Baseline */}
            {mission.kpi_baseline && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  KPI Baseline & Success Metrics
                </h2>
                <div className="prose prose-gray max-w-none">
                  <p>{mission.kpi_baseline}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Mission Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Mission ID</p>
                  <p className="font-medium">{mission.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{formatDate(mission.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatDate(mission.updated_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reward Model</p>
                  <p className="font-medium capitalize">{mission.reward_model}</p>
                </div>
              </div>
            </div>

            {/* Content Quality Requirements */}
            {mission.content_quality_floor && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-gray-600" />
                  Quality Standards
                </h3>
                <p className="text-gray-700">{mission.content_quality_floor}</p>
              </div>
            )}

            {/* Niche Tags */}
            {mission.niche_tags && mission.niche_tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2 text-gray-600" />
                  Niche Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {mission.niche_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tiered Rewards (if applicable) */}
            {mission.reward_model === 'tiered' && mission.tiered_table && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-600" />
                  Tiered Rewards
                </h3>
                <div className="prose prose-gray max-w-none">
                  <p>{mission.tiered_table}</p>
                </div>
              </div>
            )}

            {/* Apply Button */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Ready to Apply?</h3>
              <p className="text-purple-100 text-sm mb-4">
                Join this exciting mission and start earning rewards for your live streaming skills.
              </p>
              <button className="w-full bg-white text-purple-600 font-semibold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors">
                <Zap className="w-5 h-5 inline mr-2" />
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
