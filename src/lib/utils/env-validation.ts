export const validateEnvVars = () => {
  const requiredVars = [
    'MEDIASERVER_SUPABASE_URL',
    'MEDIASERVER_SUPABASE_ANON_KEY',
    'CF_UPLOAD_WORKER_URL',
    'CF_IMAGE_WORKER_URL', 
    'CF_STORAGE_WORKER_URL',
    'UPLOAD_WORKER_TOKEN',
    'RESIZE_WORKER_TOKEN'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    throw new Error(`Environment configuration incomplete. Missing: ${missing.join(', ')}`);
  }
  
  return true;
};