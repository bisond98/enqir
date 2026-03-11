import { useEffect, useState } from 'react';
import SellShell from '../components/SellShell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { listMyListings, listResponsesForSeller, softDeleteListing, updateListing } from '../services/sellDb';
import type { SellListing, SellListingResponse } from '../types';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Save } from 'lucide-react';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<SellListing[]>([]);
  const [responses, setResponses] = useState<SellListingResponse[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ls, rs] = await Promise.all([listMyListings(user.uid), listResponsesForSeller(user.uid)]);
      setListings(ls);
      setResponses(rs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const startEdit = (l: SellListing) => {
    setEditingId(l.id);
    setEditTitle(l.title ?? '');
    setEditDescription(l.description ?? '');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateListing(editingId, { title: editTitle.trim(), description: editDescription.trim() } as any);
      toast({ title: 'Saved', description: 'Listing updated.' });
      setEditingId(null);
      await load();
    } catch {
      toast({ title: 'Failed', description: 'Could not update listing.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    try {
      await softDeleteListing(id);
      toast({ title: 'Deleted', description: 'Listing removed.' });
      await load();
    } catch {
      toast({ title: 'Failed', description: 'Could not delete listing.', variant: 'destructive' });
    }
  };

  if (!user) {
    return (
      <SellShell title="Seller Dashboard">
        <p className="text-sm text-gray-700">Sign in to view your dashboard.</p>
      </SellShell>
    );
  }

  return (
    <SellShell title="Seller Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          <Card className="border border-black rounded-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)]">
            <CardHeader className="font-black text-black">My Listings</CardHeader>
            <CardContent className="space-y-3">
              {loading && <p className="text-sm text-gray-700">Loading…</p>}
              {!loading && listings.length === 0 && <p className="text-sm text-gray-700">No listings yet.</p>}

              {!loading &&
                listings.map((l) => (
                  <div key={l.id} className="border border-black/10 rounded-2xl p-3">
                    {editingId === l.id ? (
                      <div className="space-y-2">
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                        <div className="flex gap-2">
                          <Button className="bg-black text-white border border-black font-black" onClick={saveEdit} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Saving…' : 'Save'}
                          </Button>
                          <Button variant="outline" className="border border-black" onClick={() => setEditingId(null)} disabled={saving}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/sell/listing/${l.id}`} className="block">
                            <p className="font-black text-black">{l.title}</p>
                            <p className="text-xs text-gray-700 line-clamp-2">{l.description}</p>
                          </Link>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="border border-black" onClick={() => startEdit(l)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="border border-black" onClick={() => remove(l.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card className="border border-black rounded-2xl">
            <CardHeader className="font-black text-black">Buyer Responses</CardHeader>
            <CardContent className="space-y-2">
              {loading && <p className="text-sm text-gray-700">Loading…</p>}
              {!loading && responses.length === 0 && <p className="text-sm text-gray-700">No responses yet.</p>}
              {!loading &&
                responses.slice(0, 30).map((r) => (
                  <div key={r.id} className="border border-black/10 rounded-xl p-2">
                    <p className="text-[11px] text-gray-600">Listing: {r.listingId}</p>
                    <p className="text-xs text-gray-800 whitespace-pre-wrap">{r.message}</p>
                    {r.offeredPrice != null && <p className="text-xs font-black mt-1">Offer: ₹{r.offeredPrice}</p>}
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </SellShell>
  );
}


