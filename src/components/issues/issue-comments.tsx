"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/use-auth";
import { 
  useComments, 
  useCreateCommentMutation, 
  useUpdateCommentMutation, 
  useDeleteCommentMutation,
  Comment
} from "@/hooks/use-comments";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Edit2, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface IssueCommentsProps {
  issueId: string;
}

export function IssueComments({ issueId }: IssueCommentsProps) {
  const { data: user } = useAuth();
  const { data: comments, isLoading, error } = useComments(issueId);
  const createCommentMutation = useCreateCommentMutation(issueId);
  const [newComment, setNewComment] = useState("");

  const handleCreateComment = async () => {
    if (!newComment.trim()) return;
    try {
      await createCommentMutation.mutateAsync({ issueId, body: newComment });
      setNewComment("");
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 text-center">
        <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-zinc-800 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Comment List */}
      <div className="space-y-6">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              issueId={issueId}
              isAuthor={user?.id === comment.author.id}
            />
          ))
        ) : (
          <div className="py-4 text-center text-sm text-zinc-500">
            <MessageSquare className="mx-auto mb-2 h-5 w-5 opacity-20" />
            No comments yet.
          </div>
        )}
      </div>

      {/* New Comment Box */}
      <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-medium text-zinc-400">
            {user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <span className="text-xs font-medium text-zinc-400">Add a comment</span>
        </div>
        <MarkdownEditor
          value={newComment}
          onChange={setNewComment}
          placeholder="Write a comment..."
          minHeight="100px"
          className="bg-transparent"
        />
        <div className="flex justify-end">
          <Button 
            size="sm" 
            onClick={handleCreateComment}
            disabled={createCommentMutation.isPending || !newComment.trim()}
          >
            {createCommentMutation.isPending ? "Posting..." : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ 
  comment, 
  issueId,
  isAuthor 
}: { 
  comment: Comment; 
  issueId: string;
  isAuthor: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const updateCommentMutation = useUpdateCommentMutation(issueId);
  const deleteCommentMutation = useDeleteCommentMutation(issueId);

  const handleUpdate = async () => {
    if (!editBody.trim() || editBody === comment.body) {
      setIsEditing(false);
      return;
    }
    try {
      await updateCommentMutation.mutateAsync({ id: comment.id, body: editBody });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update comment:", err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCommentMutation.mutateAsync(comment.id);
      setShowDeleteDialog(false);
    } catch (err) {
      console.error("Failed to delete comment:", err);
    }
  };

  return (
    <div className="group relative flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
        {comment.author.name?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-200">{comment.author.name}</span>
            <span className="text-xs text-zinc-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              {comment.editedAt && (
                <span className="ml-2 italic opacity-70">
                  (edited {formatDistanceToNow(new Date(comment.editedAt), { addSuffix: true })})
                </span>
              )}
            </span>
          </div>
          
          {isAuthor && !isEditing && (
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button 
                onClick={() => setIsEditing(true)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                title="Edit comment"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => setShowDeleteDialog(true)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                title="Delete comment"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="mt-2">
          {isEditing ? (
            <div className="space-y-3">
              <MarkdownEditor
                value={editBody}
                onChange={setEditBody}
                minHeight="100px"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleUpdate}
                  disabled={updateCommentMutation.isPending}
                >
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditBody(comment.body);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none text-zinc-300">
              <ReactMarkdown>{comment.body}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteCommentMutation.isPending}
      />
    </div>
  );
}
