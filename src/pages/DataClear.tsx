import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2, CheckCircle, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/firebase";
import { collection, getDocs, deleteDoc, writeBatch } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

const DataClear = () => {
  const { user } = useAuth();
  const [clearing, setClearing] = useState(false);
  const [stats, setStats] = useState({
    enquiries: 0,
    sellerSubmissions: 0,
    chatMessages: 0,
    users: 0,
    userProfiles: 0,
    notifications: 0,
    aiActivities: 0,
    submissions: 0
  });

  // Check if user is admin (you can modify this logic)
  const isAdmin = user?.email === "admin@example.com" || user?.uid === "admin";

  const getCollectionStats = async () => {
    try {
      const collections = ['enquiries', 'sellerSubmissions', 'chatMessages', 'users', 'userProfiles', 'notifications', 'aiActivities', 'submissions'];
      const newStats: any = {};

      for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        newStats[colName] = snapshot.size;
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error getting stats:', error);
      toast({ title: 'Error', description: 'Failed to get collection stats', variant: 'destructive' });
    }
  };

  const clearAllData = async () => {
    if (!isAdmin) {
      toast({ title: 'Access Denied', description: 'Only admins can clear data', variant: 'destructive' });
      return;
    }

    if (!confirm('⚠️ WARNING: This will delete ALL data permanently!\n\nThis includes:\n• All enquiries and responses\n• All chat messages\n• All user profiles and data\n• All notifications\n• All AI activity logs\n• All localStorage data\n\nAre you absolutely sure you want to continue?')) {
      return;
    }

    setClearing(true);
    try {
      const collections = ['enquiries', 'sellerSubmissions', 'chatMessages', 'users', 'userProfiles', 'notifications', 'aiActivities', 'submissions'];
      let totalDeleted = 0;

      // Process each collection separately to avoid batch size limits
      for (const colName of collections) {
        console.log(`Clearing collection: ${colName}`);
        const snapshot = await getDocs(collection(db, colName));
        const docs = snapshot.docs;
        
        // Process in batches of 500 (Firestore limit)
        const batchSize = 500;
        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = writeBatch(db);
          const batchDocs = docs.slice(i, i + batchSize);
          
          batchDocs.forEach((doc) => {
            batch.delete(doc.ref);
            totalDeleted++;
          });
          
          await batch.commit();
          console.log(`Deleted batch ${Math.floor(i/batchSize) + 1} for ${colName}: ${batchDocs.length} documents`);
        }
        
        console.log(`Completed clearing ${colName}: ${docs.length} documents`);
      }

      // Clear localStorage data for all users
      console.log('Clearing localStorage data...');
      const localStorageKeys = Object.keys(localStorage);
      let localStorageCleared = 0;
      
      localStorageKeys.forEach(key => {
        if (key.startsWith('palUsageStats:') || key.startsWith('pal') || key.includes('pal')) {
          localStorage.removeItem(key);
          localStorageCleared++;
        }
      });
      
      console.log(`Cleared ${localStorageCleared} localStorage entries`);
      
      toast({ 
        title: 'Data Cleared Successfully', 
        description: `Deleted ${totalDeleted} documents from all collections and ${localStorageCleared} localStorage entries` 
      });
      
      // Reset stats
      setStats({
        enquiries: 0,
        sellerSubmissions: 0,
        chatMessages: 0,
        users: 0,
        userProfiles: 0,
        notifications: 0,
        aiActivities: 0,
        submissions: 0
      });

      // Force page refresh to clear any cached data and notify all users
      setTimeout(() => {
        // Clear all localStorage data for all users
        localStorage.clear();
        sessionStorage.clear();
        
        // Dispatch custom event to notify all dashboards to refresh
        window.dispatchEvent(new CustomEvent('palDataCleared'));
        
        // Force reload to clear all cached data
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error clearing data:', error);
      toast({ title: 'Error', description: 'Failed to clear data', variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  const clearSpecificCollection = async (collectionName: string) => {
    if (!isAdmin) {
      toast({ title: 'Access Denied', description: 'Only admins can clear data', variant: 'destructive' });
      return;
    }

    if (!confirm(`⚠️ WARNING: This will delete ALL ${collectionName} permanently!\n\nAre you sure?`)) {
      return;
    }

    setClearing(true);
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const docs = snapshot.docs;
      let deleted = 0;

      // Process in batches of 500 (Firestore limit)
      const batchSize = 500;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchDocs = docs.slice(i, i + batchSize);
        
        batchDocs.forEach((doc) => {
          batch.delete(doc.ref);
          deleted++;
        });
        
        await batch.commit();
        console.log(`Deleted batch ${Math.floor(i/batchSize) + 1} for ${collectionName}: ${batchDocs.length} documents`);
      }
      
      toast({ 
        title: 'Collection Cleared', 
        description: `Deleted ${deleted} documents from ${collectionName}` 
      });
      
      // Update stats
      setStats(prev => ({ ...prev, [collectionName]: 0 }));

    } catch (error) {
      console.error(`Error clearing ${collectionName}:`, error);
      toast({ title: 'Error', description: `Failed to clear ${collectionName}`, variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  const clearUserDashboardData = async () => {
    if (!isAdmin) {
      toast({ title: 'Access Denied', description: 'Only admins can clear data', variant: 'destructive' });
      return;
    }
    if (!confirm('⚠️ WARNING: This will delete ALL user dashboard data (enquiries & responses) permanently!\n\nAre you sure?')) {
      return;
    }
    setClearing(true);
    try {
      const collections = ['enquiries', 'sellerSubmissions'];
      let totalDeleted = 0;
      for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        const docs = snapshot.docs;
        const batchSize = 500;
        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = writeBatch(db);
          const batchDocs = docs.slice(i, i + batchSize);
          batchDocs.forEach((doc) => {
            batch.delete(doc.ref);
            totalDeleted++;
          });
          await batch.commit();
        }
      }
      // Clear localStorage data for all users
      const localStorageKeys = Object.keys(localStorage);
      let localStorageCleared = 0;
      
      localStorageKeys.forEach(key => {
        if (key.startsWith('palUsageStats:') || key.startsWith('pal') || key.includes('pal')) {
          localStorage.removeItem(key);
          localStorageCleared++;
        }
      });
      
      toast({ 
        title: 'User Dashboard Data Cleared', 
        description: `Deleted ${totalDeleted} documents from enquiries and sellerSubmissions. Also cleared ${localStorageCleared} localStorage entries.` 
      });
      
      setTimeout(() => {
        // Clear all localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Dispatch custom event to notify all dashboards to refresh
        window.dispatchEvent(new CustomEvent('palDataCleared'));
        
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error clearing user dashboard data:', error);
      toast({ title: 'Error', description: 'Failed to clear user dashboard data', variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
              <p className="text-slate-600">Only administrators can access this page.</p>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-slate-500 mb-4">
                To access data clearing, you need to be logged in as an admin user.
              </p>
              <Button onClick={() => window.history.back()}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">🧹 Data Management</h1>
            <p className="text-xl text-slate-600">Clear all data for fresh testing</p>
          </div>

          {/* Warning Banner */}
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">⚠️ DANGER ZONE</h3>
                  <p className="text-red-700">
                    This will permanently delete ALL data from your Firestore database including enquiries, responses, chats, user profiles, notifications, AI logs, and localStorage data. 
                    This action cannot be undone!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Stats */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-2xl font-bold text-slate-900">Current Data Status</h2>
              <p className="text-slate-600">Overview of documents in each collection</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.enquiries}</div>
                  <div className="text-sm text-blue-700">Enquiries</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.sellerSubmissions}</div>
                  <div className="text-sm text-green-700">Seller Submissions</div>
                </div>
                <div className="text-center p-4 bg-gray-100 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{stats.chatMessages}</div>
                  <div className="text-sm text-gray-700">Chat Messages</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.users}</div>
                  <div className="text-sm text-orange-700">Users</div>
                </div>
                <div className="text-center p-4 bg-cyan-50 rounded-lg">
                  <div className="text-2xl font-bold text-cyan-600">{stats.userProfiles}</div>
                  <div className="text-sm text-cyan-700">User Profiles</div>
                </div>
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl font-bold text-pink-600">{stats.notifications}</div>
                  <div className="text-sm text-pink-700">Notifications</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">{stats.aiActivities}</div>
                  <div className="text-sm text-indigo-700">AI Activities</div>
                </div>
                <div className="text-center p-4 bg-teal-50 rounded-lg">
                  <div className="text-2xl font-bold text-teal-600">{stats.submissions}</div>
                  <div className="text-sm text-teal-700">Submissions</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Button 
                  onClick={getCollectionStats} 
                  variant="outline"
                  disabled={clearing}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Refresh Stats
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Individual Collection Clearing */}
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-2xl font-bold text-slate-900">Clear Individual Collections</h2>
              <p className="text-slate-600">Clear specific collections one by one</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Enquiries</h3>
                    <Badge variant="outline">{stats.enquiries} documents</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">Buyer enquiries and requests</p>
                  <Button 
                    onClick={() => clearSpecificCollection('enquiries')}
                    variant="destructive"
                    size="sm"
                    disabled={clearing || stats.enquiries === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Enquiries
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Seller Submissions</h3>
                    <Badge variant="outline">{stats.sellerSubmissions} documents</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">Seller responses to enquiries</p>
                  <Button 
                    onClick={() => clearSpecificCollection('sellerSubmissions')}
                    variant="destructive"
                    size="sm"
                    disabled={clearing || stats.sellerSubmissions === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Submissions
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Chat Messages</h3>
                    <Badge variant="outline">{stats.chatMessages} documents</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">All chat conversations</p>
                  <Button 
                    onClick={() => clearSpecificCollection('chatMessages')}
                    variant="destructive"
                    size="sm"
                    disabled={clearing || stats.chatMessages === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Messages
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Users</h3>
                    <Badge variant="outline">{stats.users} documents</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">User profiles and data</p>
                  <Button 
                    onClick={() => clearSpecificCollection('users')}
                    variant="destructive"
                    size="sm"
                    disabled={clearing || stats.users === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Users
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">User Profiles</h3>
                    <Badge variant="outline">{stats.userProfiles} documents</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">Detailed user profile data</p>
                  <Button 
                    onClick={() => clearSpecificCollection('userProfiles')}
                    variant="destructive"
                    size="sm"
                    disabled={clearing || stats.userProfiles === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Profiles
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    <Badge variant="outline">{stats.notifications} documents</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">User notifications and alerts</p>
                  <Button 
                    onClick={() => clearSpecificCollection('notifications')}
                    variant="destructive"
                    size="sm"
                    disabled={clearing || stats.notifications === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Notifications
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">AI Activities</h3>
                    <Badge variant="outline">{stats.aiActivities} documents</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">AI processing logs and activities</p>
                  <Button 
                    onClick={() => clearSpecificCollection('aiActivities')}
                    variant="destructive"
                    size="sm"
                    disabled={clearing || stats.aiActivities === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear AI Logs
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-slate-900">Submissions</h3>
                    <Badge variant="outline">{stats.submissions} documents</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">General submissions and forms</p>
                  <Button 
                    onClick={() => clearSpecificCollection('submissions')}
                    variant="destructive"
                    size="sm"
                    disabled={clearing || stats.submissions === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Submissions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nuclear Option - Clear Everything */}
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <h2 className="text-2xl font-bold text-red-800">🚨 Nuclear Option</h2>
              <p className="text-red-700">Clear ALL data at once</p>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-red-700 mb-4">
                  This will delete <strong>ALL documents</strong> from <strong>ALL collections</strong> in one operation.
                </p>
                <Button 
                  onClick={clearAllData}
                  variant="destructive"
                  size="lg"
                  disabled={clearing}
                  className="px-8 py-3"
                >
                  {clearing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Clearing Data...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5 mr-2" />
                      Clear ALL Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Clear User Dashboard Data */}
          <Card className="border-yellow-300 bg-yellow-50 mb-8">
            <CardHeader>
              <h2 className="text-2xl font-bold text-yellow-800">🧹 Clear User Dashboard Data</h2>
              <p className="text-yellow-700">Delete all user enquiries and responses (dashboard histories) only</p>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Button 
                  onClick={clearUserDashboardData}
                  variant="destructive"
                  size="lg"
                  disabled={clearing}
                  className="px-8 py-3"
                >
                  {clearing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Clearing User Dashboard Data...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-5 w-5 mr-2" />
                      Clear User Dashboard Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default DataClear;
