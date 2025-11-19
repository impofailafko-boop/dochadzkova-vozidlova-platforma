import { PendingMutation } from './offlineStorage';

export function validateAttendanceData(mutation: PendingMutation): { valid: boolean; error?: string } {
  const { type, timestamp, latitude, longitude, userId } = mutation.data;
  
  // Required fields
  if (!userId) {
    return { valid: false, error: 'User ID is required' };
  }
  
  if (!type || (type !== 'arrival' && type !== 'departure')) {
    return { valid: false, error: 'Invalid attendance type' };
  }
  
  if (!timestamp) {
    return { valid: false, error: 'Timestamp is required' };
  }
  
  // Validate timestamp
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid timestamp format' };
  }
  
  // Validate GPS coordinates (optional but if present must be valid)
  if (latitude !== null && latitude !== undefined) {
    if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
      return { valid: false, error: 'Invalid latitude value' };
    }
  }
  
  if (longitude !== null && longitude !== undefined) {
    if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
      return { valid: false, error: 'Invalid longitude value' };
    }
  }
  
  return { valid: true };
}

export function validateVehicleLogData(mutation: PendingMutation): { valid: boolean; error?: string } {
  const { data, action } = mutation;
  
  // Required fields for both create and update
  if (!data.user_id) {
    return { valid: false, error: 'User ID is required' };
  }
  
  if (!data.vehicle_id) {
    return { valid: false, error: 'Vehicle ID is required' };
  }
  
  if (!data.project_id) {
    return { valid: false, error: 'Project ID is required' };
  }
  
  if (!data.date) {
    return { valid: false, error: 'Date is required' };
  }
  
  // Validate date format
  const date = new Date(data.date);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  if (action === 'create') {
    // Validate km_start
    if (typeof data.km_start !== 'number' || data.km_start < 0) {
      return { valid: false, error: 'Invalid km_start value' };
    }
    
    // Validate GPS coordinates (optional)
    if (data.start_latitude !== null && data.start_latitude !== undefined) {
      if (typeof data.start_latitude !== 'number' || data.start_latitude < -90 || data.start_latitude > 90) {
        return { valid: false, error: 'Invalid start latitude' };
      }
    }
    
    if (data.start_longitude !== null && data.start_longitude !== undefined) {
      if (typeof data.start_longitude !== 'number' || data.start_longitude < -180 || data.start_longitude > 180) {
        return { valid: false, error: 'Invalid start longitude' };
      }
    }
  } else if (action === 'update') {
    // Validate log_id for update
    if (!data.log_id) {
      return { valid: false, error: 'Log ID is required for update' };
    }
    
    // Validate km_end
    if (typeof data.km_end !== 'number' || data.km_end < 0) {
      return { valid: false, error: 'Invalid km_end value' };
    }
    
    // Validate GPS coordinates (optional)
    if (data.end_latitude !== null && data.end_latitude !== undefined) {
      if (typeof data.end_latitude !== 'number' || data.end_latitude < -90 || data.end_latitude > 90) {
        return { valid: false, error: 'Invalid end latitude' };
      }
    }
    
    if (data.end_longitude !== null && data.end_longitude !== undefined) {
      if (typeof data.end_longitude !== 'number' || data.end_longitude < -180 || data.end_longitude > 180) {
        return { valid: false, error: 'Invalid end longitude' };
      }
    }
  }
  
  return { valid: true };
}

export function validateFuelLogData(mutation: PendingMutation): { valid: boolean; error?: string } {
  const { data } = mutation;
  
  // Required fields
  if (!data.user_id) {
    return { valid: false, error: 'User ID is required' };
  }
  
  if (!data.vehicle_id) {
    return { valid: false, error: 'Vehicle ID is required' };
  }
  
  if (!data.date) {
    return { valid: false, error: 'Date is required' };
  }
  
  // Validate date format
  const date = new Date(data.date);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  // Validate liters
  if (typeof data.liters !== 'number' || data.liters <= 0) {
    return { valid: false, error: 'Liters must be a positive number' };
  }
  
  if (data.liters > 1000) {
    return { valid: false, error: 'Liters value too large (max 1000)' };
  }
  
  // Validate price (optional but if present must be valid)
  if (data.price !== null && data.price !== undefined) {
    if (typeof data.price !== 'number' || data.price < 0) {
      return { valid: false, error: 'Price must be a non-negative number' };
    }
    
    if (data.price > 10000) {
      return { valid: false, error: 'Price value too large (max 10000)' };
    }
  }
  
  return { valid: true };
}
