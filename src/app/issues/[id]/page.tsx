"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Issue, IssueStatus, IssuePriority } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { IssueActivity } from "@/components/issues/issue-activity";
import { IssueComments } from "@/components/issues/issue-comments";
import { 
  useUpdateIssueMutation, 
  useDeleteIssueMutation, 
  useIssueSubscription, 
  useToggleSubscriptionMutation 
} from "@/hooks/use-issues";
import { PriorityIcon } from "@/components/issues/priority-icon";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowLeft, Trash2, Calendar, User, Folder, Tag, Hash, Bell, BellOff } from "lucide-react";

async function fetchIssue(id: string): Promise<Issue> {
  return apiClient.get<Issue>(`/api/v1/issues/${id}`);
}

interface Project {
  id: string;
  name: string;
}

interface Member {
  id: string;
  name: string;
}

export default function IssueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: issue, isLoading, error } = useQuery({
    queryKey: ["issue", id],
    queryFn: () => fetchIssue(id),
  });

  const [localTitle, setLocalTitle] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const updateIssueMutation = useUpdateIssueMutation();
  const deleteIssueMutation = useDeleteIssueMutation();
  const { data: subscription } = useIssueSubscription(id);
  const toggleSubscriptionMutation = useToggleSubscriptionMutation(id);

  useEffect(() => {
    if (issue) {
      setLocalTitle(issue.title);
      setLocalDescription(issue.description || "");
    }
  }, [issue]);

  useEffect(() => {
    Promise.all([
      apiClient.get<{ data: Project[] }>("/api/v1/projects"),
      apiClient.get<{ data: Member[] }>("/api/v1/members"),
    ]).then(([projectsRes, membersRes]) => {
      setProjects(projectsRes.data);
      setMembers(membersRes.data);
    });
  }, []);

  const handleUpdateField = useCallback(async (field: string, value: any) => {
    if (!issue) return;
    
    // Only update if value changed
    if (field === 'title' && value === issue.title) return;
    if (field === 'description' && value === (issue.description || "")) return;
    if (field === 'status' && value === issue.status) return;
    if (field === 'priority' && value === issue.priority) return;
    if (field === 'assigneeId' && value === (issue.assignee?.id || null)) return;
    if (field === 'dueDate' && value === (issue.dueDate || null)) return;

    try {
      await updateIssueMutation.mutateAsync({
        id,
        data: { [field]: value }
      });
      // Invalidate query to get fresh data
      queryClient.invalidateQueries({ queryKey: ["issue", id] });
    } catch (err) {
      console.error(`Failed to update ${field}:`, err);
    }
  }, [id, issue, updateIssueMutation, queryClient]);

  const handleDelete = async () => {
    await deleteIssueMutation.mutateAsync(id);
    router.push("/issues");
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-800 border-t-blue-500" />
          <p className="text-sm text-zinc-400">Loading issue...</p>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-red-400">Failed to load issue</p>
          <p className="text-sm text-red-500">{(error as Error)?.message || "Issue not found"}</p>
          <Link href="/issues" className="mt-4 inline-block rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700">
            Back to Issues
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/issues" className="text-zinc-400 hover:text-zinc-50">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2 font-mono text-sm text-zinc-500">
            <Hash className="h-4 w-4" />
            {issue.key}
          </div>
        </div>

        {/* Inline Editable Title */}
        <Input
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={() => handleUpdateField('title', localTitle)}
          className="border-none bg-transparent px-0 text-3xl font-bold text-zinc-50 shadow-none focus-visible:ring-0 md:text-4xl"
          placeholder="Issue Title"
        />

        {/* Inline Editable Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Description</Label>
            <div className="flex gap-2">
              {isEditingDescription ? (
                <>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-7 px-2 text-[10px] text-zinc-400 hover:text-zinc-200"
                    onClick={() => {
                      setLocalDescription(issue.description || "");
                      setIsEditingDescription(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-7 px-2 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                    onClick={async () => {
                      await handleUpdateField('description', localDescription);
                      setIsEditingDescription(false);
                    }}
                    disabled={updateIssueMutation.isPending}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-7 px-2 text-[10px] text-zinc-400 hover:text-zinc-200"
                  onClick={() => setIsEditingDescription(true)}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>
          
          {isEditingDescription ? (
            <MarkdownEditor
              value={localDescription}
              onChange={setLocalDescription}
              placeholder="Add a description..."
              minHeight="300px"
              className="border-none bg-zinc-900/30 shadow-none"
            />
          ) : (
            <div 
              className="prose prose-invert prose-sm max-w-none min-h-[100px] rounded-md bg-zinc-900/10 p-4 text-zinc-300 cursor-pointer hover:bg-zinc-900/20 transition-colors"
              onClick={() => setIsEditingDescription(true)}
            >
              {issue.description ? (
                <ReactMarkdown>{issue.description}</ReactMarkdown>
              ) : (
                <p className="text-zinc-600 italic">No description provided. Click to add one.</p>
              )}
            </div>
          )}
        </div>

        {/* Activity Section */}
        <div className="space-y-12 pt-10 border-t border-zinc-800">
          <div className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">History</h2>
            <IssueActivity issueId={id} />
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Comments</h2>
            <IssueComments issueId={id} />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-full space-y-6 lg:w-80 lg:border-l lg:border-zinc-800 lg:pl-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Properties</h3>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 px-2 text-[10px]",
                subscription?.subscribed ? "text-blue-400 bg-blue-500/10" : "text-zinc-500"
              )}
              onClick={() => toggleSubscriptionMutation.mutate(!subscription?.subscribed)}
              disabled={toggleSubscriptionMutation.isPending}
            >
              {subscription?.subscribed ? (
                <>
                  <BellOff className="mr-1 h-3 w-3" />
                  Unsubscribe
                </>
              ) : (
                <>
                  <Bell className="mr-1 h-3 w-3" />
                  Subscribe
                </>
              )}
            </Button>
          </div>
          
          {/* Status */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Status</Label>
            <Select
              value={issue.status}
              onChange={(e) => handleUpdateField('status', e.target.value)}
              className="h-9 w-full bg-zinc-900/50"
            >
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Priority</Label>
            <Select
              value={issue.priority}
              onChange={(e) => handleUpdateField('priority', e.target.value)}
              className="h-9 w-full bg-zinc-900/50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Project</Label>
            <div className="flex h-9 w-full items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-300 opacity-70">
              <Folder className="h-4 w-4 text-zinc-500" />
              {issue.project?.name || "No project"}
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Assignee</Label>
            <Select
              value={issue.assignee?.id || ""}
              onChange={(e) => handleUpdateField('assigneeId', e.target.value || null)}
              className="h-9 w-full bg-zinc-900/50"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-500">Due Date</Label>
            <Input
              type="date"
              value={issue.dueDate || ""}
              onChange={(e) => handleUpdateField('dueDate', e.target.value || null)}
              className="h-9 w-full border-zinc-800 bg-zinc-900/50"
            />
          </div>
        </div>

        <div className="space-y-4 border-t border-zinc-800 pt-6">
          <div className="flex flex-col gap-1 text-[11px] text-zinc-500">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
            </div>
            <div className="flex justify-between">
              <span>Updated</span>
              <span>{formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}</span>
            </div>
          </div>

          <Button 
            onClick={() => setShowDeleteDialog(true)} 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-red-500 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Issue
          </Button>
        </div>
      </aside>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Issue"
        description={`Are you sure you want to delete ${issue.key}: "${issue.title}"? This action cannot be undone.`}
        confirmText="Delete Issue"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteIssueMutation.isPending}
      />
    </div>
  );
}
