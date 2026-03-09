import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, Check, Trash2, X, LogIn, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminNotifications, AdminNotification } from "@/hooks/useAdminNotifications";
import { cn } from "@/lib/utils";

const typeIcon: Record<string, React.ReactNode> = {
  portal_login: <LogIn className="w-3.5 h-3.5 text-primary" />,
};

function NotifItem({
  notif,
  onRead,
  onDelete,
}: {
  notif: AdminNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        "flex items-start gap-3 px-4 py-3 border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer group",
        !notif.is_read && "bg-primary/5"
      )}
      onClick={() => !notif.is_read && onRead(notif.id)}
    >
      <div className="mt-0.5 w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
        {typeIcon[notif.type] ?? <Bell className="w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-semibold truncate", !notif.is_read ? "text-foreground" : "text-muted-foreground")}>
          {notif.title}
        </p>
        <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {new Date(notif.created_at).toLocaleString("en-ZA")}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notif.is_read && (
          <button
            onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
            className="text-primary hover:text-primary/80"
            title="Mark read"
          >
            <Check className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notif.id); }}
          className="text-destructive hover:text-destructive/80"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      {!notif.is_read && (
        <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
      )}
    </motion.div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markRead, deleteNotification, clearAll } =
    useAdminNotifications();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((o) => !o)}
        title="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-5 h-5 text-primary" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-80 z-50 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={markAllRead}
                    >
                      <Check className="w-3 h-3 mr-1" /> Mark all read
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Notification list */}
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {notifications.map((n) => (
                      <NotifItem
                        key={n.id}
                        notif={n}
                        onRead={markRead}
                        onDelete={deleteNotification}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </ScrollArea>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-border/30 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive h-7 px-2"
                    onClick={clearAll}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Clear all
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
