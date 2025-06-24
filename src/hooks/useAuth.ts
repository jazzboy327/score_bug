import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Appconfig } from '../config';
import { SupabaseJwtproviderService } from '../services/SupabaeJwtproviderService';

const jwtPayloadService = new SupabaseJwtproviderService();

export const useAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(Appconfig.auth_token_key) || '';
      
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const isExpired = await jwtPayloadService.isTokenExpired();
        if (isExpired) {
          await jwtPayloadService.refreshToken();
        }
      } catch (error) {
        console.error('Token validation failed:', error);
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  return { isAuthenticated: !!localStorage.getItem(Appconfig.auth_token_key) };
}; 