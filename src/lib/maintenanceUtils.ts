/**
 * Utility functions for parsing and managing maintenance requests
 */

export interface ParsedMaintenanceRequest {
  priority: 'low' | 'medium' | 'high';
  category: string;
  description: string;
  status: 'Pending Review' | 'Approved' | 'In Progress' | 'Completed';
}

/**
 * Parse maintenance request message content to extract structured data
 */
export function parseMaintenanceRequest(content: string): ParsedMaintenanceRequest {
  // Extract priority (default to medium)
  let priority: 'low' | 'medium' | 'high' = 'medium';
  if (content.includes('HIGH PRIORITY')) {
    priority = 'high';
  } else if (content.includes('LOW PRIORITY')) {
    priority = 'low';
  } else if (content.includes('MEDIUM PRIORITY')) {
    priority = 'medium';
  }

  // Extract category
  const categoryMatch = content.match(/Category:\s*([^\n]+)/i);
  const category = categoryMatch ? categoryMatch[1].trim() : 'General';

  // Extract status (default to Pending Review)
  const statusMatch = content.match(/Status:\s*([^\n]+)/i);
  const rawStatus = statusMatch ? statusMatch[1].trim() : 'Pending Review';
  const status = rawStatus as ParsedMaintenanceRequest['status'];

  // Extract description (everything between header and status)
  const descriptionMatch = content.match(/Category:[^\n]+\n\n([\s\S]+?)(?:\n\nStatus:|$)/i);
  const description = descriptionMatch ? descriptionMatch[1].trim() : content;

  return {
    priority,
    category,
    description,
    status
  };
}

/**
 * Get priority badge variant based on priority level
 */
export function getPriorityVariant(priority: 'low' | 'medium' | 'high'): 'default' | 'secondary' | 'destructive' {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
  }
}

/**
 * Get status badge variant based on status
 */
export function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'Approved':
    case 'Completed':
      return 'secondary';
    case 'In Progress':
      return 'default';
    default:
      return 'outline';
  }
}

/**
 * Update maintenance request status in message content
 */
export function updateMaintenanceStatus(content: string, newStatus: string): string {
  // Replace existing status or add new status
  if (content.includes('Status:')) {
    return content.replace(/Status:\s*[^\n]+/i, `Status: ${newStatus}`);
  } else {
    return `${content}\n\nStatus: ${newStatus}`;
  }
}
