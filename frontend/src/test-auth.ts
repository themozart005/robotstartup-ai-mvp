// Test imports
import { useAuthStore } from './store/AuthStore';
import { authService } from './services/authService';
import { hasToken } from './utils/authHelpers';

console.log('✅ All auth imports working!');
console.log('AuthStore:', useAuthStore);
console.log('AuthService:', authService);
console.log('Helpers:', hasToken);