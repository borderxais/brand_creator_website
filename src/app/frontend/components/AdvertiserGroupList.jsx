import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Table, message, Spin } from 'antd';

const AdvertiserGroupList = ({ advertiserId }) => {
  const [adGroups, setAdGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  // Fetch ad groups on component mount
  useEffect(() => {
    fetchAdGroups();
  }, [advertiserId]);

  const fetchAdGroups = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/advertiser/adgroups?advertiser_id=${advertiserId}`);
      setAdGroups(response.data);
    } catch (error) {
      console.error('Error fetching ad groups:', error);
      message.error('Failed to fetch ad groups');
    } finally {
      setLoading(false);
    }
  };

  // Fetch real-time metrics
  const fetchRealTimeMetrics = async () => {
    setMetricsLoading(true);
    try {
      const response = await axios.post('/api/advertiser/real-time-metrics', {
        advertiser_id: advertiserId
      });
      
      // Update adGroups with metrics data
      const newAdGroups = [...adGroups];
      response.data.data.forEach(metric => {
        const adGroupIndex = newAdGroups.findIndex(ag => ag.adgroup_id === metric.adgroup_id);
        if (adGroupIndex !== -1) {
          newAdGroups[adGroupIndex] = { ...newAdGroups[adGroupIndex], ...metric };
        }
      });
      setAdGroups(newAdGroups);
      message.success('Real-time metrics updated successfully');
    } catch (error) {
      console.error('Error fetching metrics:', error);
      message.error('Failed to fetch real-time metrics');
    } finally {
      setMetricsLoading(false);
    }
  };

  // Send notification
  const sendNotification = async () => {
    setNotificationLoading(true);
    try {
      const response = await axios.post('/api/advertiser/send-notification', {
        advertiser_id: advertiserId
      });
      message.success('Notification process triggered successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
      message.error('Failed to trigger notification process');
    } finally {
      setNotificationLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (adGroupId) => {
    // Navigate to edit page or open edit modal
    console.log('Edit ad group:', adGroupId);
    // Implement your edit logic here
  };

  const columns = [
    {
      title: 'Ad Group ID',
      dataIndex: 'adgroup_id',
      key: 'adgroup_id',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Cost Per Conversion',
      dataIndex: 'cost_per_conversion',
      key: 'cost_per_conversion',
      render: (value) => value ? `$${parseFloat(value).toFixed(2)}` : 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => handleEdit(record.adgroup_id)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="advertiser-group-list">
      <div className="controls" style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          onClick={fetchRealTimeMetrics} 
          loading={metricsLoading}
          style={{ marginRight: 8 }}
        >
          Refresh Metrics
        </Button>
        <Button 
          type="default" 
          onClick={sendNotification}
          loading={notificationLoading}
        >
          Send Notification
        </Button>
      </div>
      
      <Spin spinning={loading}>
        <Table 
          dataSource={adGroups} 
          columns={columns} 
          rowKey="adgroup_id"
          pagination={{ pageSize: 10 }}
        />
      </Spin>
    </div>
  );
};

export default AdvertiserGroupList;
