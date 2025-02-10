import { formatDistanceToNow, format } from 'date-fns';

export const formatFirebaseTimestamp = (timestamp) => {
  if (!timestamp) return 'No date';
  
  // Convert Firebase Timestamp to JS Date
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return format(date, 'MMM dd, yyyy HH:mm');
};

export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'No date';
  
  // Convert Firebase Timestamp to JS Date
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return formatDistanceToNow(date, { addSuffix: true });
}; 