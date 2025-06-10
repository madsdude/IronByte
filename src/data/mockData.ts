import { Ticket, User, MetricData } from '../types';

// Mock user data
export const currentUser: User = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'admin',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=2'
};

export const users: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'agent',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=2'
  },
  {
    id: 'user-3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    role: 'agent',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=60&h=60&dpr=2'
  }
];

// Mock ticket data
export const tickets: Ticket[] = [
  {
    id: 'TK-1001',
    title: 'Email service outage',
    description: 'Unable to send or receive emails since this morning.',
    status: 'in-progress',
    priority: 'high',
    category: 'incident',
    createdAt: '2025-06-10T09:30:00Z',
    updatedAt: '2025-06-10T10:15:00Z',
    assigned_to: 'user-2',
    submittedBy: 'user-1',
    dueDate: '2025-06-10T12:30:00Z'
  },
  {
    id: 'TK-1002',
    title: 'New laptop request',
    description: 'Requesting a new laptop for the new marketing manager starting next week.',
    status: 'new',
    priority: 'medium',
    category: 'hardware',
    createdAt: '2025-06-09T14:20:00Z',
    updatedAt: '2025-06-09T14:20:00Z',
    submittedBy: 'user-1'
  },
  {
    id: 'TK-1003',
    title: 'VPN access request',
    description: 'Need VPN access for remote work starting tomorrow.',
    status: 'resolved',
    priority: 'medium',
    category: 'access',
    createdAt: '2025-06-08T11:45:00Z',
    updatedAt: '2025-06-09T09:30:00Z',
    assigned_to: 'user-3',
    submittedBy: 'user-1'
  },
  {
    id: 'TK-1004',
    title: 'Printer not working',
    description: 'The main office printer is showing error code E-02.',
    status: 'pending',
    priority: 'low',
    category: 'hardware',
    createdAt: '2025-06-07T15:10:00Z',
    updatedAt: '2025-06-07T16:45:00Z',
    assigned_to: 'user-2',
    submittedBy: 'user-3'
  },
  {
    id: 'TK-1005',
    title: 'Software installation request',
    description: 'Need Adobe Creative Suite installed on my workstation.',
    status: 'closed',
    priority: 'low',
    category: 'software',
    createdAt: '2025-06-05T10:20:00Z',
    updatedAt: '2025-06-06T14:30:00Z',
    assigned_to: 'user-3',
    submittedBy: 'user-1'
  },
  {
    id: 'TK-1006',
    title: 'Network connectivity issues',
    description: 'Intermittent network drops in the finance department.',
    status: 'in-progress',
    priority: 'critical',
    category: 'network',
    createdAt: '2025-06-10T08:15:00Z',
    updatedAt: '2025-06-10T09:05:00Z',
    assigned_to: 'user-2',
    submittedBy: 'user-3',
    dueDate: '2025-06-10T12:00:00Z'
  }
];

// Mock metrics data
export const metrics: MetricData[] = [
  {
    name: 'Open Tickets',
    value: 12,
    change: 2,
    changeType: 'decrease'
  },
  {
    name: 'Resolved Today',
    value: 8,
    change: 3,
    changeType: 'increase'
  },
  {
    name: 'Avg. Response Time',
    value: 4.2,
    change: 0.3,
    changeType: 'decrease'
  },
  {
    name: 'SLA Compliance',
    value: 97,
    change: 2,
    changeType: 'increase'
  }
];

// Knowledge base articles
export const knowledgeBaseArticles = [
  {
    id: 'kb-1',
    title: 'Network Infrastructure Overview',
    category: 'network',
    views: 1243,
    content: `# Network Infrastructure Overview

A comprehensive guide to our network infrastructure setup and configuration.

## Key Components

- Core Network
- Distribution Layer
- Access Layer
- Network Services

## Documentation

For detailed documentation, visit our [Network Infrastructure Repository](https://github.com/madsdude/Network#network-infrastructure)`
  },
  {
    id: 'kb-2',
    title: 'DHCP Server Configuration',
    category: 'network',
    views: 987,
    content: `# DHCP Server Configuration Guide

Step-by-step guide for configuring DHCP servers in our network.

## Configuration Steps

1. Initial Setup
2. IP Range Configuration
3. Lease Time Settings
4. DHCP Options

## Documentation

For detailed documentation, visit our [DHCP Configuration Guide](https://github.com/madsdude/Network#dhcp-server)`
  },
  {
    id: 'kb-3',
    title: 'DNS Server Setup',
    category: 'network',
    views: 856,
    content: `# DNS Server Setup Guide

Complete guide for DNS server configuration and management.

## Setup Process

1. Server Installation
2. Zone Configuration
3. Record Management
4. DNS Security

## Documentation

For detailed documentation, visit our [DNS Server Guide](https://github.com/madsdude/Network#dns-server)`
  },
  {
    id: 'kb-4',
    title: 'Active Directory Implementation',
    category: 'network',
    views: 742,
    content: `# Active Directory Implementation Guide

Comprehensive guide for implementing and managing Active Directory.

## Implementation Steps

1. Domain Controller Setup
2. OU Structure
3. Group Policy
4. User Management

## Documentation

For detailed documentation, visit our [Active Directory Guide](https://github.com/madsdude/Network#active-directory)`
  },
  {
    id: 'kb-5',
    title: 'Network File System (NFS)',
    category: 'network',
    views: 654,
    content: `# Network File System Guide

Complete guide for setting up and managing NFS.

## Configuration Steps

1. Server Setup
2. Export Configuration
3. Client Setup
4. Security Settings

## Documentation

For detailed documentation, visit our [NFS Guide](https://github.com/madsdude/Network#network-file-system)`
  },
  {
    id: 'kb-6',
    title: 'Network Security Measures',
    category: 'network',
    views: 589,
    content: `# Network Security Guide

Comprehensive guide for implementing network security measures.

## Security Components

1. Firewall Configuration
2. Access Control
3. Monitoring
4. Incident Response

## Documentation

For detailed documentation, visit our [Security Guide](https://github.com/madsdude/Network#security)`
  }
];