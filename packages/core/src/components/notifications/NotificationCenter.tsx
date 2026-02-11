import React, { useState } from "react";
import { Bell, Check, CheckCircle2, Inbox, MoreHorizontal, Settings, Trash2 } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@complianceos/ui/ui/popover";
import { Button } from "@complianceos/ui/ui/button";
import { Badge } from "@complianceos/ui/ui/badge";
import { ScrollArea } from "@complianceos/ui/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Separator } from "@complianceos/ui/ui/separator";

export const NotificationCenter: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [, setLocation] = useLocation();

    // Queries
    const { data: notifications, refetch: refetchNotifications } = trpc.notifications.getNotifications.useQuery(
        { limit: 20 },
        { enabled: open }
    );
    const { data: unreadCount, refetch: refetchUnreadCount } = trpc.notifications.getUnreadCount.useQuery();

    // Mutations
    const markAsRead = trpc.notifications.markAsRead.useMutation({
        onSuccess: () => {
            refetchNotifications();
            refetchUnreadCount();
        },
    });

    const markAllAsRead = trpc.notifications.markAllAsRead.useMutation({
        onSuccess: () => {
            refetchNotifications();
            refetchUnreadCount();
        },
    });

    const handleNotificationClick = async (notification: any) => {
        if (!notification.readAt) {
            await markAsRead.mutateAsync({ id: notification.id });
        }
        if (notification.link) {
            setLocation(notification.link);
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                >
                    <Bell className="w-5 h-5" />
                    {unreadCount && unreadCount > 0 ? (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600"
                            onClick={() => markAllAsRead.mutate()}
                            title="Mark all as read"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600"
                            onClick={() => setLocation("/settings?tab=notifications")}
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="h-80">
                    {!notifications || notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                            <Inbox className="h-8 w-8 mb-2 opacity-20" />
                            <p className="text-xs">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <button
                                    key={n.id}
                                    className={`flex flex-col gap-1 p-4 text-left border-b hover:bg-slate-50 transition-colors relative ${!n.readAt ? "bg-blue-50/40" : ""
                                        }`}
                                    onClick={() => handleNotificationClick(n)}
                                >
                                    {!n.readAt && (
                                        <div className="absolute left-1 top-4 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-900 line-clamp-1 pr-4">
                                            {n.title}
                                        </span>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(n.sentAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {n.message}
                                    </p>
                                    {n.type === 'overdue_alert' && (
                                        <Badge variant="outline" className="w-fit mt-1 text-[9px] h-4 px-1.5 bg-red-50 text-red-600 border-red-100 uppercase tracking-wider font-bold">
                                            Overdue
                                        </Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                <div className="p-2 border-t text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-slate-500 hover:text-primary"
                        onClick={() => {
                            setLocation("/notifications");
                            setOpen(false);
                        }}
                    >
                        View all notifications
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};
