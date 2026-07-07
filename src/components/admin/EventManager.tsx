import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, QrCode, Music2, ExternalLink, Copy, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DJ_LIST } from "@/lib/pricing";
import { toast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "react-router-dom";

interface EventItem {
  id: string;
  name: string;
  venue: string | null;
  event_date: string | null;
  dj_name: string;
  is_active: boolean;
  google_review_url: string;
  created_at: string;
}

export function EventManager() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newVenue, setNewVenue] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newDj, setNewDj] = useState(DJ_LIST[0]);
  const [showCreate, setShowCreate] = useState(false);

  const baseUrl = window.location.origin;

  const fetchEvents = async () => {
    const { data } = await supabase
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setEvents(data as EventItem[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("events").insert({
      name: newName.trim(),
      venue: newVenue.trim() || null,
      event_date: newDate || null,
      dj_name: newDj,
    });
    if (error) {
      toast({ title: "Error", description: "Failed to create event", variant: "destructive" });
    } else {
      toast({ title: "Event Created", description: "QR code is ready to share!" });
      setNewName("");
      setNewVenue("");
      setNewDate("");
      setShowCreate(false);
      fetchEvents();
    }
    setCreating(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("events").update({ is_active: !current }).eq("id", id);
    fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    await supabase.from("events").delete().eq("id", id);
    fetchEvents();
  };

  const copyLink = (eventId: string) => {
    navigator.clipboard.writeText(`${baseUrl}/request/${eventId}`);
    toast({ title: "Link Copied", description: "Song request link copied to clipboard." });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Music2 className="w-5 h-5 text-primary" />
          Events & Song Requests
        </h2>
        <Button variant="hero" size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-2" />
          New Event
        </Button>
      </div>

      {showCreate && (
        <Card variant="glow">
          <CardHeader>
            <CardTitle className="text-lg">Create Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Name *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Wedding Reception" />
              </div>
              <div className="space-y-2">
                <Label>Venue</Label>
                <Input value={newVenue} onChange={(e) => setNewVenue(e.target.value)} placeholder="e.g. The Grand Hall" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>DJ</Label>
                <Select value={newDj} onValueChange={setNewDj}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DJ_LIST.map((dj) => (
                      <SelectItem key={dj} value={dj}>{dj}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="hero" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? "Creating..." : "Create Event"}
            </Button>
          </CardContent>
        </Card>
      )}

      {events.length === 0 ? (
        <Card variant="glass" className="text-center py-8">
          <CardContent>
            <Music2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No events yet. Create one to get a QR code for song requests!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {events.map((event) => {
            const requestUrl = `${baseUrl}/request/${event.id}`;
            const queueUrl = `${baseUrl}/dj-queue/${event.id}`;

            return (
              <Card key={event.id} variant="glass">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{event.name}</h3>
                        <Badge variant={event.is_active ? "default" : "outline"}>
                          {event.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {event.dj_name} {event.venue && `• ${event.venue}`}
                        {event.event_date && ` • ${new Date(event.event_date).toLocaleDateString()}`}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <QrCode className="w-4 h-4 mr-2" />
                              QR Code
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="text-center">Song Request QR Code</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col items-center gap-4 py-4">
                              <div className="bg-white p-4 rounded-xl">
                                <QRCodeSVG value={requestUrl} size={250} />
                              </div>
                              <p className="text-sm text-muted-foreground text-center">{event.name}</p>
                              <Button variant="outline" size="sm" onClick={() => copyLink(event.id)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Link
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/dj-queue/${event.id}`}>
                            <Music2 className="w-4 h-4 mr-2" />
                            DJ Queue
                          </Link>
                        </Button>

                        <Button variant="outline" size="sm" onClick={() => copyLink(event.id)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>

                        <Button variant="ghost" size="sm" onClick={() => window.open(requestUrl, "_blank")}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Active</Label>
                        <Switch checked={event.is_active} onCheckedChange={() => toggleActive(event.id, event.is_active)} />
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteEvent(event.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
