import { useEffect, useState } from "react";
import { Link, Redirect } from "wouter";
import {
  Users,
  Briefcase,
  Star,
  Loader2,
  Trash2,
  Shield,
  UserCog,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, type Job } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface Stats {
  totalUsers: number;
  totalJobs: number;
  featuredJobs: number;
  usersByRole: Record<string, number>;
}

interface AdminUser {
  id: number;
  email: string;
  role: string;
  createdAt: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = () => {
    setError(null);
    return Promise.all([
      api.adminStats(),
      api.adminListUsers(),
      api.listJobs(),
    ])
      .then(([s, u, j]) => {
        setStats(s);
        setAdminUsers(u);
        setAllJobs(j);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === "admin") loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return <Redirect to="/login" />;
  if (user.role !== "admin") return <Redirect to="/" />;

  const handleRoleChange = async (id: number, role: string) => {
    try {
      await api.adminUpdateRole(id, role as "jobseeker" | "employer" | "admin");
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update role.");
    }
  };

  const handleDeleteUser = async (id: number, email: string) => {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    try {
      await api.adminDeleteUser(id);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete user.");
    }
  };

  const handleDeleteJob = async (id: number, title: string) => {
    if (!confirm(`Delete job "${title}"?`)) return;
    try {
      await api.deleteJob(id);
      await loadAll();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete job.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage users and job listings on KeFeL Jobs.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-md p-4">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<Users className="h-4 w-4" />}
                label="Total Users"
                value={stats?.totalUsers ?? 0}
              />
              <StatCard
                icon={<Briefcase className="h-4 w-4" />}
                label="Total Jobs"
                value={stats?.totalJobs ?? 0}
              />
              <StatCard
                icon={<Star className="h-4 w-4" />}
                label="Featured Jobs"
                value={stats?.featuredJobs ?? 0}
              />
              <StatCard
                icon={<UserCog className="h-4 w-4" />}
                label="Admins"
                value={stats?.usersByRole.admin ?? 0}
              />
            </div>

            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Users ({adminUsers.length})</CardTitle>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">
                    {stats?.usersByRole.jobseeker ?? 0} job seekers
                  </Badge>
                  <Badge variant="outline">
                    {stats?.usersByRole.employer ?? 0} employers
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.email}
                          {u.id === user.id && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.role}
                            onValueChange={(v) => handleRoleChange(u.id, v)}
                            disabled={u.id === user.id}
                          >
                            <SelectTrigger className="w-36 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="jobseeker">Job Seeker</SelectItem>
                              <SelectItem value="employer">Employer</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            disabled={u.id === user.id}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {adminUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No users yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jobs ({allJobs.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allJobs.map((j) => (
                      <TableRow key={j.id}>
                        <TableCell className="font-medium">
                          <Link href={`/jobs/${j.id}`} className="hover:underline">
                            {j.title}
                          </Link>
                        </TableCell>
                        <TableCell>{j.company}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {j.location}
                        </TableCell>
                        <TableCell>
                          {j.isFeatured ? (
                            <Badge className="gap-1 bg-amber-500 hover:bg-amber-500 text-white">
                              <Star className="h-3 w-3 fill-current" />
                              Featured
                            </Badge>
                          ) : (
                            <Badge variant="outline">Standard</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteJob(j.id, j.title)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {allJobs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No jobs yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground mb-1.5">
          <span className="text-xs font-medium">{label}</span>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
