import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNewsletterAnalytics, getNewsletters, type Newsletter } from "@/lib/newsletterService";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Mail, MousePointer, Eye, Users, Calendar, TrendingUp } from "lucide-react";

interface AnalyticsData {
  newsletter: any;
  subscriber: any;
  event_type: string;
  created_at: string;
  event_data?: any;
}

const NewsletterAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      const [analyticsData, newslettersData] = await Promise.all([
        getNewsletterAnalytics(),
        getNewsletters()
      ]);
      
      setAnalytics(analyticsData as AnalyticsData[]);
      setNewsletters(newslettersData as Newsletter[]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventCounts = () => {
    const counts = {
      sent: analytics.filter(a => a.event_type === 'sent').length,
      opened: analytics.filter(a => a.event_type === 'opened').length,
      clicked: analytics.filter(a => a.event_type === 'clicked').length,
      unsubscribed: analytics.filter(a => a.event_type === 'unsubscribed').length,
    };
    
    return [
      { name: 'Sent', value: counts.sent, color: '#8884d8' },
      { name: 'Opened', value: counts.opened, color: '#82ca9d' },
      { name: 'Clicked', value: counts.clicked, color: '#ffc658' },
      { name: 'Unsubscribed', value: counts.unsubscribed, color: '#ff7c7c' },
    ];
  };

  const getNewsletterPerformance = () => {
    return newsletters.map(newsletter => {
      const sentCount = newsletter.recipient_count || 0;
      const openRate = sentCount > 0 ? ((newsletter.open_count || 0) / sentCount * 100) : 0;
      const clickRate = sentCount > 0 ? ((newsletter.click_count || 0) / sentCount * 100) : 0;
      
      return {
        name: newsletter.title.substring(0, 20) + (newsletter.title.length > 20 ? '...' : ''),
        openRate: Number(openRate.toFixed(1)),
        clickRate: Number(clickRate.toFixed(1)),
        sent: sentCount,
        opens: newsletter.open_count || 0,
        clicks: newsletter.click_count || 0,
      };
    }).filter(n => n.sent > 0);
  };

  const getActivityOverTime = () => {
    const last30Days = Array.from({length: 30}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const dayAnalytics = analytics.filter(a => 
        a.created_at.startsWith(date)
      );
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sent: dayAnalytics.filter(a => a.event_type === 'sent').length,
        opened: dayAnalytics.filter(a => a.event_type === 'opened').length,
        clicked: dayAnalytics.filter(a => a.event_type === 'clicked').length,
      };
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const eventCounts = getEventCounts();
  const performanceData = getNewsletterPerformance();
  const activityData = getActivityOverTime();
  const totalSent = eventCounts.find(e => e.name === 'Sent')?.value || 0;
  const totalOpened = eventCounts.find(e => e.name === 'Opened')?.value || 0;
  const totalClicked = eventCounts.find(e => e.name === 'Clicked')?.value || 0;
  const overallOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0';
  const overallClickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Newsletter Analytics</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallOpenRate}%</div>
            <div className="text-xs text-muted-foreground">{totalOpened} opens</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallClickRate}%</div>
            <div className="text-xs text-muted-foreground">{totalClicked} clicks</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Newsletters</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newsletters.filter(n => n.status === 'sent').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Event Distribution</CardTitle>
            <CardDescription>Breakdown of all newsletter events</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventCounts}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {eventCounts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Over Time</CardTitle>
            <CardDescription>Email events over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sent" stroke="#8884d8" name="Sent" />
                <Line type="monotone" dataKey="opened" stroke="#82ca9d" name="Opened" />
                <Line type="monotone" dataKey="clicked" stroke="#ffc658" name="Clicked" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Newsletter Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter Performance</CardTitle>
          <CardDescription>Open and click rates for each newsletter</CardDescription>
        </CardHeader>
        <CardContent>
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'openRate' || name === 'clickRate' ? `${value}%` : value,
                    name === 'openRate' ? 'Open Rate' : 
                    name === 'clickRate' ? 'Click Rate' : name
                  ]}
                />
                <Bar dataKey="openRate" fill="#82ca9d" name="Open Rate (%)" />
                <Bar dataKey="clickRate" fill="#ffc658" name="Click Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No sent newsletters to analyze yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Latest newsletter activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.slice(0, 10).map((event, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    event.event_type === 'sent' ? 'default' :
                    event.event_type === 'opened' ? 'secondary' :
                    event.event_type === 'clicked' ? 'outline' :
                    'destructive'
                  }>
                    {event.event_type}
                  </Badge>
                  <span className="text-sm">
                    {event.newsletter?.title || 'Unknown Newsletter'}
                  </span>
                  {event.subscriber?.email && (
                    <span className="text-xs text-muted-foreground">
                      • {event.subscriber.email}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(event.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            {analytics.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No events recorded yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsletterAnalytics;