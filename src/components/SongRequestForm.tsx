import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Music2, Star, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

interface SongRequestFormProps {
  eventId?: string;
  eventName?: string;
  djName?: string;
}

type Step = 'review' | 'request' | 'success';

export function SongRequestForm({ eventName = "Current Event", djName = "DJ Shawn-E-Shawn" }: SongRequestFormProps) {
  const [step, setStep] = useState<Step>('review');
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const googleReviewUrl = "https://g.page/r/beatkulture/review";

  const handleReviewClick = () => {
    window.open(googleReviewUrl, '_blank');
  };

  const handleConfirmReview = () => {
    setReviewConfirmed(true);
    setStep('request');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !artist.trim()) return;
    
    setIsSubmitting(true);
    // Simulate submission - in production this would go to your backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStep('success');
    setIsSubmitting(false);
  };

  const handleNewRequest = () => {
    // Reset for new request - must leave another review
    setStep('review');
    setReviewConfirmed(false);
    setSongTitle('');
    setArtist('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card variant="glow" className="relative overflow-hidden">
          {/* Header */}
          <CardHeader className="text-center pb-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Music2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">{djName}</CardTitle>
            <CardDescription>{eventName}</CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {/* Step 1: Google Review Required */}
              {step === 'review' && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-3">
                    <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/30">
                      <AlertCircle className="w-6 h-6 text-secondary mx-auto mb-2" />
                      <h3 className="font-semibold text-lg">Leave a Google Review First</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        To request a song, please leave us a 4+ star review on Google. 
                        This helps us grow and ensures quality service!
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-1 py-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-8 h-8 ${star <= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-yellow-500'}`}
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    className="w-full"
                    size="lg"
                    onClick={handleReviewClick}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Leave Google Review
                  </Button>

                  {!reviewConfirmed && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleConfirmReview}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      I've Left My Review
                    </Button>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    A new review is required for each song request. Thank you for your support! 🎵
                  </p>
                </motion.div>
              )}

              {/* Step 2: Song Request Form */}
              {step === 'request' && (
                <motion.div
                  key="request"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <form onSubmit={handleSubmitRequest} className="space-y-4">
                    <div className="p-3 rounded-lg bg-success/10 border border-success/30 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-success" />
                      <span className="text-sm text-success">Review confirmed! Request your song below.</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="songTitle">Song Title *</Label>
                      <Input
                        id="songTitle"
                        value={songTitle}
                        onChange={(e) => setSongTitle(e.target.value)}
                        placeholder="Enter song title"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="artist">Artist *</Label>
                      <Input
                        id="artist"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        placeholder="Enter artist name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Special Message (Optional)</Label>
                      <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Dedicated to someone special? Let us know!"
                        rows={3}
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="hero"
                      className="w-full"
                      size="lg"
                      disabled={isSubmitting || !songTitle.trim() || !artist.trim()}
                    >
                      <Music2 className="w-4 h-4" />
                      {isSubmitting ? 'Submitting...' : 'Submit Song Request'}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* Step 3: Success */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-4"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2">Request Submitted!</h3>
                    <p className="text-muted-foreground">
                      "{songTitle}" by {artist} has been added to the queue.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      {djName} will play your request when the time is right. 
                      Enjoy the party! 🎉
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleNewRequest}
                    className="w-full"
                  >
                    <Music2 className="w-4 h-4" />
                    Request Another Song
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Remember: A new Google review is required for each song request.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
