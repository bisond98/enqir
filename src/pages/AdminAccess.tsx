import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Shield } from 'lucide-react';

const AdminAccess = () => {
  const { secretToken } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'signing-in' | 'success' | 'error'>('checking');
  const [loading, setLoading] = useState(true);

  // Your secret token - Secure random token generated
  // For production, use environment variable: process.env.REACT_APP_ADMIN_SECRET
  const VALID_SECRET_TOKEN = '1eb93535-7967-49ec-b7f4-d35a3e9a3777-mi4wo91x';

  useEffect(() => {
    const processAccess = async () => {
      setLoading(true);

      // Validate token first
      if (secretToken !== VALID_SECRET_TOKEN) {
        setStatus('error');
        setLoading(false);
        toast({
          title: 'Invalid Access Token',
          description: 'The access link is invalid or incorrect',
          variant: 'destructive'
        });
        return;
      }

      try {
        let currentUser = user;
        let wasAutoSignedIn = false;

        // If no user, auto-sign in anonymously
        if (!currentUser) {
          setStatus('signing-in');
          try {
            const result = await signInAnonymously(auth);
            currentUser = result.user;
            wasAutoSignedIn = true;
            console.log('✅ Auto-signed in user for admin access:', currentUser.uid);
          } catch (signInError: any) {
            console.error('Error auto-signing in:', signInError);
            setStatus('error');
            setLoading(false);
            toast({
              title: 'Sign In Error',
              description: 'Failed to create admin session. Please try again.',
              variant: 'destructive'
            });
            return;
          }
        }

        // Grant admin access in Firestore
        try {
          const userProfileRef = doc(db, 'userProfiles', currentUser.uid);
          const userProfileSnap = await getDoc(userProfileRef);

          const adminData = {
            role: 'admin',
            isAdmin: true,
            adminGrantedAt: serverTimestamp(),
            adminGrantedVia: wasAutoSignedIn ? 'secure-link-auto' : 'secure-link',
            email: currentUser.email || null,
            displayName: currentUser.displayName || 'Admin User',
          };

          if (userProfileSnap.exists()) {
            // Update existing profile
            await updateDoc(userProfileRef, {
              ...adminData,
              updatedAt: serverTimestamp()
            });
          } else {
            // Create new profile
            await setDoc(userProfileRef, {
              userId: currentUser.uid,
              ...adminData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        } catch (firestoreError: any) {
          // Handle Firestore-specific errors
          console.error('Firestore error:', firestoreError);
          throw firestoreError; // Re-throw to be caught by outer catch
        }

        setStatus('success');
        toast({
          title: '✅ Admin Access Granted!',
          description: wasAutoSignedIn 
            ? 'You have been automatically signed in with admin privileges.' 
            : 'You now have admin privileges. Redirecting...',
        });

        // Redirect to admin panel after 2 seconds
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 2000);

      } catch (error: any) {
        console.error('Error granting admin access:', error);
        setStatus('error');
        
        // Check if it's a CORS/Firestore connection error
        const errorMessage = error.message || '';
        const isConnectionError = errorMessage.includes('CORS') || 
                                  errorMessage.includes('XMLHttpRequest') ||
                                  errorMessage.includes('access-control') ||
                                  errorMessage.includes('channel') ||
                                  error.code === 'unavailable' ||
                                  error.code === 'unauthenticated';
        
        if (isConnectionError) {
          toast({
            title: 'Connection Error',
            description: 'Unable to connect to Firebase. Please check your internet connection and try again. If the issue persists, the production domain may need to be authorized in Firebase Console.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Error',
            description: error.message || 'Failed to grant admin access. Please try again.',
            variant: 'destructive'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    processAccess();
  }, [secretToken, user, navigate]);

  if (loading || status === 'checking') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-gray-600 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Verifying access credentials...</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (status === 'signing-in') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Creating admin session...</p>
              <p className="text-sm text-gray-500 mt-2">This will only take a moment</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (status === 'error') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
              <p className="text-slate-600 mt-2">Invalid or expired access link</p>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => navigate('/')} className="w-full" size="lg">
                Go Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900">Access Granted!</h1>
            <p className="text-slate-600 mt-2">You now have admin privileges</p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-slate-500 mb-4">Redirecting to admin panel...</p>
            <Loader2 className="h-6 w-6 animate-spin text-gray-600 mx-auto" />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminAccess;

