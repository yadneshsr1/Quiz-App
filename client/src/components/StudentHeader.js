import React, { useState, useEffect } from 'react';
import { Avatar, Box, Typography, Skeleton } from '@mui/material';
import { generateInitials, handleImageError } from '../utils/photoUtils';
import { isFeatureEnabled } from '../config/featureFlags';

const StudentHeader = ({ userData }) => {
  const [photoData, setPhotoData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const SHOW_STUDENT_PHOTO = isFeatureEnabled('SHOW_STUDENT_PHOTO');

  useEffect(() => {
    if (!SHOW_STUDENT_PHOTO || !userData) {
      setIsLoading(false);
      return;
    }

    const fetchPhoto = async () => {
      try {
        const response = await fetch('/api/auth/me/photo', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Cache-Control': 'max-age=300' // Request caching
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPhotoData(data);
        } else if (response.status === 304) {
          // Not Modified - use cached data if available
          console.log('Photo data unchanged, using cached version');
        } else {
          setError('Failed to fetch photo');
        }
      } catch (err) {
        setError('Error fetching photo');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPhoto();
  }, [SHOW_STUDENT_PHOTO, userData]);

  if (!SHOW_STUDENT_PHOTO) {
    return null;
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box>
          <Skeleton variant="text" width={120} height={24} />
          <Skeleton variant="text" width={80} height={20} />
        </Box>
      </Box>
    );
  }

  if (error || imageLoadFailed) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <Avatar sx={{ width: 40, height: 40, bgcolor: '#6366f1' }}>
          {generateInitials(userData?.name)}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f2937' }}>
            {userData?.name || 'Student'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            {userData?.regNo || 'N/A'}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
      {photoData?.photoUrl && !imageLoadFailed ? (
        <Avatar
          src={photoData.photoUrl}
          alt={`Photo of ${userData?.name || 'student'}`}
          sx={{ width: 40, height: 40 }}
          onError={() => setImageLoadFailed(true)}
        />
      ) : (
        <Avatar sx={{ width: 40, height: 40, bgcolor: '#6366f1' }}>
          {generateInitials(userData?.name)}
        </Avatar>
      )}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1f2937' }}>
          {userData?.name || 'Student'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280' }}>
          {userData?.regNo || 'N/A'}
        </Typography>
      </Box>
    </Box>
  );
};

export default StudentHeader;
